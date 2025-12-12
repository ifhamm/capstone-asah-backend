import joblib
import json
import pandas as pd
from src.feature_engineering import FeatureEngineer


class ModelInference:
    def __init__(
        self,
        model_path="models/lightgbm_model.pkl",
        preprocessor_path="models/preprocessor.pkl",
        feature_config_path="models/feature_config.pkl",
        threshold_path="models/threshold_config.json"
    ):
        # Load LightGBM model
        self.model = joblib.load(model_path)

        # Load preprocessing pipeline (SKLearn ColumnTransformer + OHE + Scaler)
        self.preprocessor = joblib.load(preprocessor_path)

        # Load feature config (optional, sometimes contains ordering)
        self.feature_config = joblib.load(feature_config_path)

        # Load threshold
        with open(threshold_path, "r") as f:
            cfg = json.load(f)
        self.threshold = cfg.get("threshold", 0.24)

        # Feature engineering logic
        self.feature_engineer = FeatureEngineer()

    def predict(self, client_data: dict):
        # Convert to DataFrame (input can be underscore or dot notation)
        df = pd.DataFrame([client_data])

        # Step 1: Feature engineering (25 engineered features)
        df_engineered = self.feature_engineer.engineer_features(df)

        # Step 2: Preprocess using sklearn pipeline (64 model features)
        X = self.preprocessor.transform(df_engineered)

        # Step 3: Predict probability
        proba = self.model.predict_proba(X)[0][1]

        # Step 4: Apply threshold
        prediction = int(proba >= self.threshold)
        label = "YES" if prediction else "NO"

        return {
            "probability": float(proba),
            "prediction": prediction,
            "label": label,
            "threshold": self.threshold
        }

    def predict_batch(self, clients_data: list):
        return [self.predict(client) for client in clients_data]
