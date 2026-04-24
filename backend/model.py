import pickle

def load_model():
    return pickle.load(open("flight_price_model.pkl", "rb"))

def predict_price(model, features):
    return model.predict([features])[0]