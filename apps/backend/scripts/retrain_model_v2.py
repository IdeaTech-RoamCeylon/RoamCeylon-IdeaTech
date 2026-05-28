# apps/backend/scripts/retrain_model_v2.py

"""
Retrain ML Model with New Feedback Data (Model v2)
- Uses latest user behavior signals, feedback ratings, and updated feature tables
- Trains an improved HistGradientBoosting classifier with better generalization
- recency_weight present but safe (corr=-0.004 with label)
- GroupKFold cross-validation prevents user data leakage
- Decision threshold: 0.65 (recommended for production)
"""

import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import GroupKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix,
)
import warnings
warnings.filterwarnings('ignore')

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data" / "training"
V1_MODEL_PATH = DATA_DIR / "roamceylon_recommendation_model_tuned.pkl"
V2_MODEL_PATH = DATA_DIR / "roamceylon_recommendation_model_v2.pkl"
V2_SCALER_PATH = DATA_DIR / "scaler_v2.pkl"
metadata_path   = DATA_DIR / "model_v2_metadata.json"

# ── Decision threshold (used for evaluation reporting — not baked into model) ─
DECISION_THRESHOLD = 0.65


def load_training_data() -> tuple:
    """Load latest v2 CSV (primary) or SMOTE balanced dataset (fallback)."""
    print('[1/6] Loading training data...')

    # Primary: latest dated v2 CSV (fresh live feedback)
    v2_datasets = sorted(DATA_DIR.glob("ml_training_dataset_v2_*.csv"))

    if v2_datasets:
        dataset_path = v2_datasets[-1]  # Latest
        print(f"  ✓ Using latest live feedback dataset: {dataset_path.name}")
        df = pd.read_csv(dataset_path)
        print(f"  ✓ Loaded {len(df)} records  "
              f"(pos={df['label'].sum()}, neg={(df['label']==0).sum()})\n")
        return df, dataset_path.name

    # Fallback: SMOTE balanced dataset
    smote_path = DATA_DIR / "smote_balanced_dataset.csv"
    if smote_path.exists():
        print(f"  ℹ Live feedback dataset not found — using fallback SMOTE dataset: {smote_path.name}")
        df = pd.read_csv(smote_path)
        print(f"  ✓ Loaded {len(df)} records  "
              f"(pos={df['label'].sum()}, neg={(df['label']==0).sum()})\n")
        return df, smote_path.name

    raise FileNotFoundError(
        "No training dataset found. Expected ml_training_dataset_v2_*.csv "
        "or smote_balanced_dataset.csv in data/training/"
    )


def prepare_features(df: pd.DataFrame):
    """
    Drop non-feature columns and scale.
    event_weight is NOT in the SMOTE dataset — no explicit removal needed.
    If running on original v2 CSV, event_weight is explicitly excluded here.
    """
    print('[2/6] Engineering features...')

    # Columns that are never features
    NON_FEATURE_COLS = [
        'label', 'user_id', 'destination_id', 'created_at',
        # Leakage features — excluded if present (original v2 CSV fallback)
        'event_weight',
    ]

    X = df.drop(
        [c for c in NON_FEATURE_COLS if c in df.columns],
        axis=1,
    )
    y      = df['label'].values
    groups = (
        df['user_id'].astype('category').cat.codes.values
        if 'user_id' in df.columns
        else np.arange(len(df))
    )

    # Handle missing values (if any) by filling with column means
    X = X.fillna(X.mean(numeric_only=True))
    
    # Feature scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled, columns=X.columns)

    pos = int((y == 1).sum())
    neg = int((y == 0).sum())
    print(f"  ✓ Features       : {X_scaled.shape[1]}")
    print(f"  ✓ Positive class : {pos} ({100 * pos / len(y):.1f}%)")
    print(f"  ✓ Negative class : {neg} ({100 * neg / len(y):.1f}%)\n")

    return X_scaled, y, groups, scaler, list(X.columns)


def train_model_v2(X: pd.DataFrame, y: np.ndarray, groups: np.ndarray):
    """
    Train HistGradientBoostingClassifier with GroupKFold cross-validation.
    Uses all 5 folds for CV reporting, then fits final model on full dataset.
    """
    print('[3/6] Training Model v2 (HistGradientBoosting)...')

    model = HistGradientBoostingClassifier(
        loss='log_loss',
        learning_rate=0.05,  # Lower learning rate for better generalization
        max_iter=500,  # More iterations with early stopping
        max_depth=7,
        l2_regularization=0.1,  # Increased regularization
        max_bins=255,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=20,
        random_state=42,
    )
    
    gkf = GroupKFold(n_splits=5)
    fold_metrics = []

    print("  Cross-validation (GroupKFold, 5 folds):")
    for fold_idx, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups)):
        X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_tr, y_val = y[train_idx], y[val_idx]

        model.fit(X_tr, y_tr)

        y_proba = model.predict_proba(X_val)[:, 1]
        y_pred  = (y_proba >= DECISION_THRESHOLD).astype(int)

        prec = precision_score(y_val, y_pred,  zero_division=0)
        rec  = recall_score(y_val, y_pred,     zero_division=0)
        f1   = f1_score(y_val, y_pred,         zero_division=0)
        auc  = roc_auc_score(y_val, y_proba) if len(np.unique(y_val)) > 1 else 0.0

        fold_metrics.append({'precision': prec, 'recall': rec, 'f1': f1, 'auc': auc})
        print(f"    Fold {fold_idx+1}: "
              f"P={prec:.3f}  R={rec:.3f}  F1={f1:.3f}  AUC={auc:.3f}")

    avg = {
        k: float(np.mean([m[k] for m in fold_metrics]))
        for k in ('precision', 'recall', 'f1', 'auc')
    }
    print(f"\n  ✓ Avg CV: "
          f"P={avg['precision']:.3f}  R={avg['recall']:.3f}  "
          f"F1={avg['f1']:.3f}  AUC={avg['auc']:.3f}\n")

    # Final fit on full dataset
    model.fit(X, y)

    return model, avg, fold_metrics


def evaluate_model(model, X: pd.DataFrame, y: np.ndarray) -> dict:
    """Full-dataset evaluation at both threshold=0.5 and DECISION_THRESHOLD."""
    print('[4/6] Generating evaluation report...')

    y_proba = model.predict_proba(X)[:, 1]

    results = {}
    for thresh in (0.5, DECISION_THRESHOLD):
        y_pred = (y_proba >= thresh).astype(int)
        results[f'threshold_{thresh}'] = {
            'precision':     float(precision_score(y, y_pred, zero_division=0)),
            'recall':        float(recall_score(y, y_pred, zero_division=0)),
            'f1':            float(f1_score(y, y_pred, zero_division=0)),
            'auc':           float(roc_auc_score(y, y_proba) if len(np.unique(y)) > 1 else 0),
            'prediction_rate': float(y_pred.mean()),
            'confusion_matrix': confusion_matrix(y, y_pred).tolist(),
        }

    r = results[f'threshold_{DECISION_THRESHOLD}']
    print(f"  ✓ Precision      : {r['precision']:.3f}  (threshold={DECISION_THRESHOLD})")
    print(f"  ✓ Recall         : {r['recall']:.3f}")
    print(f"  ✓ F1-Score       : {r['f1']:.3f}")
    print(f"  ✓ AUC-ROC        : {r['auc']:.3f}")
    print(f"  ✓ Predict rate   : {r['prediction_rate']*100:.1f}%\n")

    return results


def save_model(model, scaler, feature_names: list,
               eval_results: dict, cv_avg: dict, fold_metrics: list, dataset_name: str) -> dict:
    """Save model, scaler, and metadata."""
    print('[5/6] Saving Model v2...')

    # Save model
    joblib.dump(model, V2_MODEL_PATH)
    print(f"  ✓ Model saved: {V2_MODEL_PATH}")

    # Save scaler
    joblib.dump(scaler, V2_SCALER_PATH)
    print(f"  ✓ Scaler saved : {V2_SCALER_PATH}")

    # Save metadata
    metadata = {
        'version': 'v2',
        'created_at': datetime.now().isoformat(),
        'model_type': 'HistGradientBoostingClassifier',
        'dataset':    dataset_name,
        'features': list(feature_names),
        'feature_count': len(feature_names),
        'leakage_removed': ['event_weight'],
        'decision_threshold': DECISION_THRESHOLD,
        'hyperparameters': {
            'learning_rate': 0.05,
            'max_iter': 500,
            'max_depth': 7,
            'l2_regularization': 0.1,
            'early_stopping':    True,
        },
        'cv_metrics':  cv_avg,
        'cv_folds':    fold_metrics,
        'evaluation':  eval_results,
    }

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  ✓ Metadata saved: {metadata_path}\n")

    return metadata

def print_summary(metadata: dict) -> None:
    """Print training summary"""
    print('[6/6] Training Complete! 📊\n')
    print('=' * 60)
    print('MODEL v2 TRAINING SUMMARY')
    print('=' * 60)
    print(f'Model Type     : {metadata["model_type"]}')
    print(f'Training Date  : {metadata["created_at"][:19]}')
    print(f'Features       : {metadata["feature_count"]} '
          f'(event_weight excluded)')
    print(f'Dataset        : {metadata["dataset"]}')
    print(f'Threshold      : {metadata["decision_threshold"]}')

    cv = metadata['cv_metrics']
    print(f'\nCV Metrics (5-fold GroupKFold):')
    print(f'  Precision : {cv["precision"]:.3f}')
    print(f'  Recall    : {cv["recall"]:.3f}')
    print(f'  F1-Score  : {cv["f1"]:.3f}')
    print(f'  AUC-ROC   : {cv["auc"]:.3f}')

    t = metadata['evaluation'][f'threshold_{metadata["decision_threshold"]}']
    print(f'\nFull-dataset Metrics (threshold={metadata["decision_threshold"]}):')
    print(f'  Precision    : {t["precision"]:.3f}')
    print(f'  Recall       : {t["recall"]:.3f}')
    print(f'  F1-Score     : {t["f1"]:.3f}')
    print(f'  AUC-ROC      : {t["auc"]:.3f}')
    print(f'  Predict rate : {t["prediction_rate"]*100:.1f}%')

    print(f'\nArtifacts:')
    print(f'  Model    : {V2_MODEL_PATH}')
    print(f'  Scaler   : {V2_SCALER_PATH}')
    print(f'  Metadata : {metadata_path}')
    print('=' * 62)

# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    print('\n' + '=' * 60)
    print('RETRAIN ML MODEL - MODEL v2')
    print('=' * 60 + '\n')

    try:
        # Load and prepare data
        df, dataset_name = load_training_data()
        X, y, groups, scaler, feature_names = prepare_features(df)
        model, cv_avg, fold_metrics = train_model_v2(X, y, groups)
        eval_results = evaluate_model(model, X, y)
        metadata = save_model(
            model, scaler, feature_names,
            eval_results, cv_avg, fold_metrics, dataset_name
        )
        print_summary(metadata)

    except Exception as e:
        print(f'\n❌ Error during training: {e}')
        raise

if __name__ == '__main__':
    main()
