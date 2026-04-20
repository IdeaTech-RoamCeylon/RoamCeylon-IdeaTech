import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import GroupKFold, GroupShuffleSplit, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT / "data" / "training" / "ml_training_dataset_extended.csv"
OUTPUT_MODEL_PATH = ROOT / "data" / "training" / "roamceylon_recommendation_model_tuned.pkl"
OUTPUT_REPORT_PATH = ROOT / "data" / "training" / "hyperparameter_tuning_report.json"

META_COLUMNS = ["user_id", "item_id", "event_type", "created_at"]
TARGET_COLUMN = "label"
SIMILARITY_COLUMN = "user_item_affinity"


def calculate_topk_metrics(df: pd.DataFrame, k: int = 5) -> dict:
    precisions: list[float] = []
    recalls: list[float] = []
    relevance_scores: list[float] = []

    for _, group in df.groupby("user_id"):
        top_k = group.sort_values("prediction_score", ascending=False).head(k)
        actual_positives = group[group[TARGET_COLUMN] == 1]["item_id"].tolist()
        if not actual_positives:
            continue

        recommended_items = top_k["item_id"].tolist()
        hits = len(set(recommended_items) & set(actual_positives))

        precisions.append(hits / k)
        recalls.append(hits / len(actual_positives))
        relevance_scores.append(group[group[TARGET_COLUMN] == 1]["prediction_score"].mean())

    return {
        f"Precision@{k}": float(np.mean(precisions)) if precisions else 0.0,
        f"Recall@{k}": float(np.mean(recalls)) if recalls else 0.0,
        "Mean Relevance Score": float(np.mean(relevance_scores)) if relevance_scores else 0.0,
    }


def calculate_topk_metrics_with_similarity_threshold(
    df: pd.DataFrame,
    threshold: float,
    k: int = 5,
) -> dict:
    precisions: list[float] = []
    recalls: list[float] = []
    relevance_scores: list[float] = []

    for _, group in df.groupby("user_id"):
        group_sorted = group.sort_values("prediction_score", ascending=False)
        filtered = group_sorted[group_sorted[SIMILARITY_COLUMN] >= threshold]

        if len(filtered) < k:
            fallback = group_sorted[~group_sorted.index.isin(filtered.index)]
            top_k = pd.concat([filtered, fallback]).head(k)
        else:
            top_k = filtered.head(k)

        actual_positives = group[group[TARGET_COLUMN] == 1]["item_id"].tolist()
        if not actual_positives:
            continue

        recommended_items = top_k["item_id"].tolist()
        hits = len(set(recommended_items) & set(actual_positives))

        precisions.append(hits / k)
        recalls.append(hits / len(actual_positives))
        relevance_scores.append(group[group[TARGET_COLUMN] == 1]["prediction_score"].mean())

    precision = float(np.mean(precisions)) if precisions else 0.0
    recall = float(np.mean(recalls)) if recalls else 0.0
    f1_like = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    return {
        "similarity_threshold": threshold,
        f"Precision@{k}": precision,
        f"Recall@{k}": recall,
        "Mean Relevance Score": float(np.mean(relevance_scores)) if relevance_scores else 0.0,
        "TopK_F1_like": f1_like,
    }


def build_pipeline(X: pd.DataFrame) -> Pipeline:
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
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


def main() -> None:
    print("Loading dataset...")
    df = pd.read_csv(DATASET_PATH)

    required = META_COLUMNS + [TARGET_COLUMN]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    feature_columns = [c for c in df.columns if c not in META_COLUMNS + [TARGET_COLUMN]]
    X = df[feature_columns]
    y = df[TARGET_COLUMN].astype(int)
    groups = df["user_id"]

    print("Creating user-grouped train/validation split...")
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, val_idx = next(splitter.split(X, y, groups=groups))

    X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
    y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
    groups_train = groups.iloc[train_idx]

    pipeline = build_pipeline(X_train)

    param_distributions = {
        "model__learning_rate": np.array([0.01, 0.03, 0.05, 0.08, 0.1, 0.15, 0.2]),
        "model__l2_regularization": np.logspace(-4, 1, 25),
        "model__max_depth": [None, 3, 5, 7, 9],
        "model__max_leaf_nodes": [15, 31, 63, 127],
        "model__min_samples_leaf": [20, 50, 100, 200],
        "model__max_iter": [100, 150, 200, 300],
    }

    print("Running randomized hyperparameter search...")
    search = RandomizedSearchCV(
        estimator=pipeline,
        param_distributions=param_distributions,
        n_iter=24,
        scoring="roc_auc",
        n_jobs=-1,
        cv=GroupKFold(n_splits=3),
        random_state=42,
        verbose=1,
    )
    search.fit(X_train, y_train, groups=groups_train)

    best_model: Pipeline = search.best_estimator_

    print("Evaluating tuned model on validation set...")
    val_pred = best_model.predict_proba(X_val)[:, 1]
    val_auc = roc_auc_score(y_val, val_pred)
    val_ap = average_precision_score(y_val, val_pred)

    eval_df = df.iloc[val_idx][["user_id", "item_id", TARGET_COLUMN]].copy()
    eval_df["prediction_score"] = val_pred

    if SIMILARITY_COLUMN in df.columns:
        eval_df[SIMILARITY_COLUMN] = df.iloc[val_idx][SIMILARITY_COLUMN].astype(float).values
        thresholds = np.round(np.arange(0.2, 0.91, 0.05), 2)
    else:
        # Fallback if the dataset does not include a similarity feature.
        eval_df[SIMILARITY_COLUMN] = eval_df["prediction_score"]
        thresholds = np.round(np.arange(0.35, 0.81, 0.05), 2)

    baseline_topk = calculate_topk_metrics(eval_df, k=5)

    threshold_results = [
        calculate_topk_metrics_with_similarity_threshold(eval_df, float(t), k=5)
        for t in thresholds
    ]
    threshold_results.sort(key=lambda x: x["TopK_F1_like"], reverse=True)
    best_threshold_result = threshold_results[0]

    OUTPUT_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, OUTPUT_MODEL_PATH)

    report = {
        "dataset_path": str(DATASET_PATH),
        "tuned_model_path": str(OUTPUT_MODEL_PATH),
        "best_hyperparameters": search.best_params_,
        "best_cv_roc_auc": float(search.best_score_),
        "validation_roc_auc": float(val_auc),
        "validation_average_precision": float(val_ap),
        "baseline_topk_metrics": baseline_topk,
        "best_similarity_threshold": best_threshold_result,
        "all_similarity_threshold_results": threshold_results,
    }

    OUTPUT_REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\n=== Hyperparameter Tuning Complete ===")
    print(f"Best params: {search.best_params_}")
    print(f"Best CV ROC-AUC: {search.best_score_:.4f}")
    print(f"Validation ROC-AUC: {val_auc:.4f}")
    print(f"Validation AP: {val_ap:.4f}")
    print(f"Best similarity threshold: {best_threshold_result['similarity_threshold']}")
    print(f"Precision@5: {best_threshold_result['Precision@5']:.4f}")
    print(f"Recall@5: {best_threshold_result['Recall@5']:.4f}")
    print(f"Saved tuned model -> {OUTPUT_MODEL_PATH}")
    print(f"Saved report -> {OUTPUT_REPORT_PATH}")


if __name__ == "__main__":
    main()
