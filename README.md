# aeroprice

A fullstack flight fare prediction app. Enter your airline, route, date, and departure time — the ML model spits out an estimated ticket price in seconds.

Live demo: https://aeroprice-v2.vercel.app/
---

## What it does

- Takes flight details as input — airline, source, destination, number of stops, flight duration, journey date, and departure time
- Derives additional features from that input: day of week, time-of-day category (morning/afternoon/evening/night), arrival hour/minute
- Feeds a 16-feature vector into a trained scikit-learn model and returns a predicted fare
- Frontend has a dark space-themed UI with animated starfield, aurora blobs, and a flying plane animation that triggers on prediction

---

## Tech stack

**Frontend** — React 19, Create React App, deployed on Vercel  
**Backend** — Python, FastAPI, Uvicorn  
**ML** — scikit-learn model trained on Indian domestic flight data, serialised as a `.pkl` file  
**Data processing** — NumPy, Pandas

---

## Project structure

```
aeroprice-fullstack/
├── backend/
│   ├── main.py                   # FastAPI app + /predict endpoint
│   ├── model.py                  # Loads the pickled model
│   ├── flight_price_model.pkl    # Trained ML model
│   └── requirements.txt
└── frontend/
    ├── public/
    └── src/
        ├── App.js                # Full UI — form, animations, prediction result
        ├── App.css
        └── index.js
```

---

## How the prediction works

The model takes 16 numerical features built from the user's input:

| Index | Feature |
|-------|---------|
| 0 | Airline (label encoded) |
| 1 | Destination (label encoded) |
| 2 | Number of stops |
| 3 | Journey day |
| 4 | Journey month |
| 5 | Departure hour |
| 6 | Departure minute |
| 7 | Arrival hour (computed from duration) |
| 8 | Arrival minute |
| 9 | Duration hours |
| 10 | Duration minutes |
| 11 | Day of week |
| 12 | Time category (0=morning, 1=afternoon, 2=evening, 3=night) |
| 13–15 | Source one-hot encoded (Bangalore, Kolkata, Delhi, Chennai, Mumbai) |

Supported airlines: IndiGo, Air India, Jet Airways, SpiceJet, Vistara  
Supported sources: Bangalore, Kolkata, Delhi, Chennai, Mumbai  
Supported destinations: Cochin, Delhi, Hyderabad, Kolkata

---

## Running locally

### Backend

Requires Python 3.8+.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be running at `http://localhost:8000`.

Test it:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "airline": "IndiGo",
    "source": "Banglore",
    "destination": "Delhi",
    "stops": 0,
    "duration": 150,
    "journey_date": "2026-06-15",
    "departure_time": "06:30"
  }'
```

### Frontend

Requires Node.js 16+.

```bash
cd frontend
npm install
npm start
```

The app will be at `http://localhost:3000`. By default it points to `http://localhost:8000` for the backend — update the API URL in `App.js` if you're deploying the backend elsewhere.

---

## API

### `POST /predict`

**Request body:**

```json
{
  "airline": "IndiGo",
  "source": "Banglore",
  "destination": "Delhi",
  "stops": 1,
  "duration": 180,
  "journey_date": "2026-06-15",
  "departure_time": "08:45"
}
```

**Response:**

```json
{
  "predicted_price": 4823.57
}
```

**Validation rules:**
- `duration` must be between 60 and 1000 minutes
- `stops` must be 0 or more
- `journey_date` and `departure_time` are required

### `GET /`

Health check. Returns `{ "message": "Flight Price API Running" }`.

---

## Deploying

**Backend** — works on any platform that supports Python. For Render:
1. Set build command: `pip install -r requirements.txt`
2. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Frontend** — already deployed on Vercel. For a fresh deploy, push to GitHub and import the repo on Vercel. Set `REACT_APP_API_URL` as an environment variable pointing to your deployed backend URL, then update `App.js` to use `process.env.REACT_APP_API_URL`.

---

## Notes

- The `.pkl` model file is ~46MB — GitHub has a 100MB file size limit so you're fine, but if the file ever grows past that you'll need Git LFS.
- The model was trained on historical Indian domestic flight data. Predictions outside the trained routes and airlines will fall back to default encoding (index 0) and may be less accurate.
- `duration` input is in total minutes — the backend splits it into hours and minutes before passing to the model.
