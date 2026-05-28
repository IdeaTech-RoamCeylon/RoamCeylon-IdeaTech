# apps/backend/scripts/predict.py

import sys
import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

# Set paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data" / "training"

# Model paths to check in order
MODEL_PATHS = [
    DATA_DIR / "roamceylon_recommendation_model_v2.pkl",
    DATA_DIR / "roamceylon_recommendation_model_tuned.pkl",
    DATA_DIR / "roamceylon_recommendation_model.pkl"
]

SCALER_PATHS = [
    DATA_DIR / "scaler_v2.pkl",
    DATA_DIR / "scaler.pkl"  # Fallback if present
]

def load_artifacts():
    model = None
    scaler = None

    # Load model
    for p in MODEL_PATHS:
        if p.exists():
            try:
                model = joblib.load(p)
                break
            except Exception as e:
                print(f"Error loading model {p.name}: {e}", file=sys.stderr)
    
    # Load scaler
    for s in SCALER_PATHS:
        if s.exists():
            try:
                scaler = joblib.load(s)
                break
            except Exception as e:
                print(f"Error loading scaler {s.name}: {e}", file=sys.stderr)

    if model is None:
        raise FileNotFoundError("No trained recommendation model found (.pkl).")

    return model, scaler

def main():
    try:
        # Load standard input
        input_data = json.loads(sys.stdin.read())
        
        user_features = input_data.get("user_features", {})
        destinations = input_data.get("destinations", [])

        if not destinations:
            print(json.dumps({"recommendations": []}))
            return

        # Load trained classifier model and feature scaler
        model, scaler = load_artifacts()

        # Get features from the model metadata if possible, else use default feature list
        # Standard 15 features matching collect-training-data.ts:
        feature_columns = [
            "user_interest_score",
            "destination_popularity",
            "cultural_match",
            "adventure_match",
            "relaxation_match",
            "click_frequency",
            "feedback_positivity_rate",
            "engagement_recency",
            "diversity_score",
            "travel_pace_preference",
            "booking_conversion_rate",
            "category_affinity",
            "user_trust_score",
            "strong_engagement_count",
            "ignored_recs_count"
        ]

        # Read model metadata if available to ensure perfect feature list matching
        metadata_path = DATA_DIR / "model_v2_metadata.json"
        if metadata_path.exists():
            try:
                with open(metadata_path, 'r') as f:
                    meta = json.load(f)
                    feature_columns = meta.get("features", feature_columns)
            except Exception:
                pass

        # Build feature rows
        rows = []
        for dest in destinations:
            row = {}
            # Initialize all feature columns to 0.5 default
            for col in feature_columns:
                row[col] = 0.5
            
            # Map user features
            for k, v in user_features.items():
                if k in row:
                    row[k] = v if v is not None else 0.5
            
            # Map destination-specific features
            dest_id = dest.get("destination_id")
            dest_pop = dest.get("destination_popularity", 0.5)
            
            if "destination_popularity" in row:
                row["destination_popularity"] = dest_pop if dest_pop is not None else 0.5
            
            # Additional maps for specific features trained in model_v2_metadata.json
            if "category_diversity" in row and "diversity_score" in user_features:
                row["category_diversity"] = user_features["diversity_score"]
            if "trust_score" in row and "user_trust_score" in user_features:
                row["trust_score"] = user_features["user_trust_score"]
            if "booking_rate" in row and "booking_conversion_rate" in user_features:
                row["booking_rate"] = user_features["booking_conversion_rate"]
            if "category_loyalty_score" in row and "category_affinity" in user_features:
                row["category_loyalty_score"] = user_features["category_affinity"]

            # Set candidate match features (e.g. cultural_match, relaxation_match)
            if "cultural_match" in row and "cultural_match" in user_features:
                row["cultural_match"] = user_features["cultural_match"]
            if "adventure_match" in row and "adventure_match" in user_features:
                row["adventure_match"] = user_features["adventure_match"]
            if "relaxation_match" in row and "relaxation_match" in user_features:
                row["relaxation_match"] = user_features["relaxation_match"]

            rows.append(row)

        # Create DataFrame
        df_features = pd.DataFrame(rows, columns=feature_columns)

        # Scale features
        if scaler is not None:
            try:
                X_scaled = scaler.transform(df_features)
                df_features = pd.DataFrame(X_scaled, columns=feature_columns)
            except Exception as e:
                print(f"Warning: Scaling failed: {e}", file=sys.stderr)

        # Predict engagement probability
        probabilities = model.predict_proba(df_features)[:, 1]

        # Format output
        results = []
        for i, dest in enumerate(destinations):
            results.append({
                "destination_id": dest.get("destination_id"),
                "ml_score": float(probabilities[i])
            })

        print(json.dumps({"recommendations": results}))

    except Exception as e:
        print(f"Error in prediction script: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
