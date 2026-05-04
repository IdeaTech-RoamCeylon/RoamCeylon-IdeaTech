# apps/backend/scripts/tune_hyperparameters.py

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score, average_precision_score
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


ROOT = Path(__file__).resolve().parent.parent

DATASET_PATH = ROOT / "data" / "training" / "smote_balanced_dataset.csv"
OUTPUT_MODEL_PATH = ROOT / "data" / "training" / "roamceylon_model_tuned.pkl"
OUTPUT_REPORT_PATH = ROOT / "data" / "training" / "tuning_report.json"

TARGET_COLUMN = "label"


def build_pipeline(X: pd.DataFrame) -> Pipeline:
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

    numeric_transformer = Pipeline(
        steps=[("imputer", SimpleImputer(strategy="median"))]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=True)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_cols),
            ("cat", categorical_transformer, categorical_cols),
        ]
    )

    model = HistGradientBoostingClassifier(random_state=42)

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )


def main():
    print("Loading dataset...")
    df = pd.read_csv(DATASET_PATH)

    if TARGET_COLUMN not in df.columns:
        raise ValueError("Target column 'label' not found!")

    # Features & target
    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN].astype(int)

    print("Train-test split...")
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline(X_train)

    param_distributions = {
        "model__learning_rate": np.array([0.01, 0.03, 0.05, 0.08, 0.1]),
        "model__l2_regularization": np.logspace(-4, 1, 10),
        "model__max_depth": [None, 3, 5, 7],
        "model__max_leaf_nodes": [15, 31, 63],
        "model__min_samples_leaf": [20, 50, 100],
        "model__max_iter": [100, 150, 200],
    }

    print("Running hyperparameter tuning...")
    search = RandomizedSearchCV(
        pipeline,
        param_distributions=param_distributions,
        n_iter=10,
        scoring="roc_auc",
        n_jobs=1,
        cv=2,
        random_state=42,
        verbose=1,
    )

    search.fit(X_train, y_train)

    best_model = search.best_estimator_

    print("Evaluating...")
    val_pred = best_model.predict_proba(X_val)[:, 1]

    val_auc = roc_auc_score(y_val, val_pred)
    val_ap = average_precision_score(y_val, val_pred)

    # Save model
    OUTPUT_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, OUTPUT_MODEL_PATH)

    # Report
    report = {
        "best_params": search.best_params_,
        "best_cv_auc": float(search.best_score_),
        "validation_auc": float(val_auc),
        "validation_ap": float(val_ap),
        "num_features": X.shape[1],
        "num_rows": len(df),
    }

    OUTPUT_REPORT_PATH.write_text(json.dumps(report, indent=2))

    print("\n=== DONE ===")
    print(f"Validation ROC-AUC: {val_auc:.4f}")
    print(f"Validation AP: {val_ap:.4f}")
    print(f"Model saved -> {OUTPUT_MODEL_PATH}")
    print(f"Report saved -> {OUTPUT_REPORT_PATH}")


if __name__ == "__main__":
    main()