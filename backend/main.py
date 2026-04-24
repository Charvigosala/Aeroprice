from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from model import load_model

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model()

# ---------------- INPUT MODEL ----------------
class FlightInput(BaseModel):
    airline: str
    source: str
    destination: str
    stops: int
    duration: int
    journey_date: str
    departure_time: str


@app.get("/")
def home():
    return {"message": "Flight Price API Running"}


# ---------------- MAPPINGS ----------------
airline_map = {
    "IndiGo": 0,
    "Air India": 1,
    "Jet Airways": 2,
    "SpiceJet": 3,
    "Vistara": 4
}

destination_map = {
    "Cochin": 0,
    "Delhi": 1,
    "Hyderabad": 2,
    "Kolkata": 3
}

source_map = {
    "Banglore": 11,
    "Kolkata": 12,
    "Delhi": 13,
    "Chennai": 14,
    "Mumbai": 15
}


# ---------------- PREDICT ----------------
@app.post("/predict")
def predict(data: FlightInput):

    # ✅ Validation
    if data.duration < 60 or data.duration > 1000:
        raise HTTPException(status_code=400, detail="Duration must be between 60 and 1000 minutes")

    if data.stops < 0:
        raise HTTPException(status_code=400, detail="Stops cannot be negative")

    if not data.journey_date or not data.departure_time:
        raise HTTPException(status_code=400, detail="Please provide journey date and departure time")

    # ---------------- DATE FEATURES ----------------
    date_obj = datetime.strptime(data.journey_date, "%Y-%m-%d")

    journey_day = date_obj.day
    journey_month = date_obj.month
    day_of_week = date_obj.weekday()   # NEW FEATURE

    # ---------------- TIME FEATURES ----------------
    dep_hour = int(data.departure_time.split(":")[0])
    dep_min = int(data.departure_time.split(":")[1])

    # Time category (NEW FEATURE)
    if 5 <= dep_hour < 12:
        time_category = 0   # morning
    elif 12 <= dep_hour < 17:
        time_category = 1   # afternoon
    elif 17 <= dep_hour < 21:
        time_category = 2   # evening
    else:
        time_category = 3   # night

    # ---------------- ARRIVAL ----------------
    total_minutes = data.duration
    arr_hour = (dep_hour + total_minutes // 60) % 24
    arr_min = (dep_min + total_minutes % 60) % 60

    # ---------------- FEATURE CREATION ----------------
    features = [0] * 16

    features[0] = airline_map.get(data.airline, 0)
    features[1] = destination_map.get(data.destination, 0)
    features[2] = data.stops

    features[3] = journey_day
    features[4] = journey_month

    features[5] = dep_hour
    features[6] = dep_min

    features[7] = arr_hour
    features[8] = arr_min

    features[9] = data.duration // 60
    features[10] = data.duration % 60

    # NEW FEATURES (🔥 upgrade)
    features[11] = day_of_week
    features[12] = time_category

    # Source one-hot encoding
    if data.source in source_map:
        features[source_map[data.source]] = 1

    # ---------------- PREDICTION ----------------
    price = model.predict([features])[0]

    return {"predicted_price": float(price)}