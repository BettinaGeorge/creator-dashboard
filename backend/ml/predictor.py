import joblib
import os
import pandas as pd
import pickle

BASE_DIR = os.path.dirname(__file__)

model = joblib.load(os.path.join(BASE_DIR, "model.pkl"))

with open(os.path.join(BASE_DIR, "features.pkl"), "rb") as f:
    feature_columns = pickle.load(f)

def predict_reel(data):

    df = pd.DataFrame([data])

    # One-hot encode categorical variables
    df = pd.get_dummies(df)

    # Align columns with training features
    df = df.reindex(columns=feature_columns, fill_value=0)

    predicted_views = model.predict(df)[0]

    # Virality probability
    viral_threshold = 200000
    probability = min(predicted_views / viral_threshold, 1)

    # Performance category
    if predicted_views < 50000:
        category = "Low"
    elif predicted_views < 150000:
        category = "Medium"
    else:
        category = "High"

    # --- Recommendation logic ---
    recommendations = []

    if data["hook_strength_score"] < 0.5:
        recommendations.append("Improve the opening hook to capture attention in the first 3 seconds.")

    if data["music_type"] == "Original":
        recommendations.append("Consider using trending or remix audio to increase discoverability.")

    if data["duration_sec"] > 20:
        recommendations.append("Shorter videos tend to perform better for Reels.")

    if data["is_weekend"] == 0:
        recommendations.append("Weekend posting may increase reach and engagement.")

    if category == "High":
        recommendations.append("Strong concept — this reel has high performance potential.")

    if not recommendations:
        recommendations.append("This reel structure looks strong based on historical performance patterns.")

    return {
        "predicted_views": float(predicted_views),
        "performance_category": category,
        "virality_probability": float(probability),
        "recommendation": " ".join(recommendations)
    }