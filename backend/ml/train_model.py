import pandas as pd
import pickle
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

# Project paths
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "viral_shorts_reels_performance_dataset.csv"

print("Loading dataset from:", DATA_PATH)

# Load dataset
df = pd.read_csv(DATA_PATH)

# Convert upload_time → is_weekend
df["upload_time"] = pd.to_datetime(df["upload_time"])
df["is_weekend"] = (df["upload_time"].dt.dayofweek >= 5).astype(int)

# Features used for prediction
features = [
    "duration_sec",
    "hook_strength_score",
    "niche",
    "music_type",
    "is_weekend"
]

X = df[features]
y = df["views_total"]

# Encode categorical variables
X = pd.get_dummies(X, columns=["niche", "music_type"], drop_first=True)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestRegressor(
    n_estimators=200,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)

print("Model trained successfully")
print("Mean Absolute Error:", mae)

# Save model
model_path = BASE_DIR / "model.pkl"
features_path = BASE_DIR / "features.pkl"

with open(model_path, "wb") as f:
    pickle.dump(model, f)

with open(features_path, "wb") as f:
    pickle.dump(X.columns.tolist(), f)

print("Model saved to:", model_path)
print("Feature columns saved to:", features_path)