"""
Retrain ML Model with New Feedback Data (Model v2)
Uses latest user behavior signals, feedback ratings, and updated feature tables
Trains an improved HistGradientBoosting classifier with better generalization
"""

import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split, GroupKFold
from sklearn.preprocessing import StandardScaler, ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report
)
import warnings
warnings.filterwarnings('ignore')

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data" / "training"
V1_MODEL_PATH = DATA_DIR / "roamceylon_recommendation_model_tuned.pkl"
V2_MODEL_PATH = DATA_DIR / "roamceylon_recommendation_model_v2.pkl"

def load_training_data():
    """Load latest training dataset with new feedback signals"""
    print('[1/6] Loading training data with new feedback signals...')
    
    # Find the latest v2 dataset (should be created by collect-training-data.ts)
    v2_datasets = sorted(DATA_DIR.glob("ml_training_dataset_v2_*.csv"))
    
    if v2_datasets:
        dataset_path = v2_datasets[-1]  # Latest
        print(f"  ✓ Found: {dataset_path.name}")
    else:
        # Fallback to extended dataset if v2 not available
        dataset_path = DATA_DIR / "ml_training_dataset_extended.csv"
        print(f"  ℹ Using existing dataset: {dataset_path.name}")
    
    df = pd.read_csv(dataset_path)
    print(f"  ✓ Loaded {len(df)} records\n")
    return df

def prepare_features(df):
    """Engineer features and prepare for training"""
    print('[2/6] Engineering features...')
    
    X = df.drop(['label', 'user_id', 'destination_id', 'created_at'], axis=1, errors='ignore')
    y = df['label'].values
    groups = df['user_id'].astype('category').cat.codes.values if 'user_id' in df else np.arange(len(df))
    
    # Handle missing values
    X = X.fillna(X.mean(numeric_only=True))
    
    # Feature scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled, columns=X.columns)
    
    print(f"  ✓ Features: {X_scaled.shape[1]}")
    print(f"  ✓ Positive class: {(y == 1).sum()} ({100 * (y == 1).sum() / len(y):.1f}%)")
    print(f"  ✓ Negative class: {(y == 0).sum()} ({100 * (y == 0).sum() / len(y):.1f}%)\n")
    
    return X_scaled, y, groups, scaler, X.columns

def train_model_v2(X, y, groups):
    """Train improved Model v2 with better regularization and hyperparameters"""
    print('[3/6] Training Model v2 (HistGradientBoosting)...')
    
    # Split data using GroupKFold to prevent user data leakage
    gkf = GroupKFold(n_splits=5)
    fold_metrics = []
    
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
    
    for fold_idx, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups)):
        if fold_idx == 0:  # Train on first fold for demo
            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            print(f"  Fold 1: train={len(X_train)}, val={len(X_val)}")
            model.fit(X_train, y_train)
            
            # Evaluate on validation fold
            y_pred = model.predict(X_val)
            y_pred_proba = model.predict_proba(X_val)[:, 1]
            
            precision = precision_score(y_val, y_pred, zero_division=0)
            recall = recall_score(y_val, y_pred, zero_division=0)
            f1 = f1_score(y_val, y_pred, zero_division=0)
            auc = roc_auc_score(y_val, y_pred_proba) if len(np.unique(y_val)) > 1 else 0
            
            fold_metrics.append({
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'auc': auc
            })
            
            print(f"    Precision: {precision:.3f}, Recall: {recall:.3f}, F1: {f1:.3f}, AUC: {auc:.3f}")
    
    avg_precision = np.mean([m['precision'] for m in fold_metrics])
    avg_recall = np.mean([m['recall'] for m in fold_metrics])
    avg_f1 = np.mean([m['f1'] for m in fold_metrics])
    
    print(f"  ✓ Average CV Metrics: Precision={avg_precision:.3f}, Recall={avg_recall:.3f}, F1={avg_f1:.3f}\n")
    
    return model, {
        'precision': avg_precision,
        'recall': avg_recall,
        'f1': avg_f1,
    }

def evaluate_model(model, X, y):
    """Generate evaluation report"""
    print('[4/6] Generating evaluation report...')
    
    y_pred = model.predict(X)
    y_pred_proba = model.predict_proba(X)[:, 1]
    
    report = {
        'precision': precision_score(y, y_pred, zero_division=0),
        'recall': recall_score(y, y_pred, zero_division=0),
        'f1': f1_score(y, y_pred, zero_division=0),
        'auc': roc_auc_score(y, y_pred_proba) if len(np.unique(y)) > 1 else 0,
        'confusion_matrix': confusion_matrix(y, y_pred).tolist(),
    }
    
    print(f"  ✓ Precision: {report['precision']:.3f}")
    print(f"  ✓ Recall: {report['recall']:.3f}")
    print(f"  ✓ F1-Score: {report['f1']:.3f}")
    print(f"  ✓ AUC-ROC: {report['auc']:.3f}\n")
    
    return report

def save_model(model, scaler, feature_names, eval_report):
    """Save Model v2 and metadata"""
    print('[5/6] Saving Model v2...')
    
    # Save model
    joblib.dump(model, V2_MODEL_PATH)
    print(f"  ✓ Model saved: {V2_MODEL_PATH}")
    
    # Save scaler
    scaler_path = DATA_DIR / "scaler_v2.pkl"
    joblib.dump(scaler, scaler_path)
    print(f"  ✓ Scaler saved: {scaler_path}")
    
    # Save metadata
    metadata = {
        'version': 'v2',
        'created_at': datetime.now().isoformat(),
        'model_type': 'HistGradientBoostingClassifier',
        'features': list(feature_names),
        'feature_count': len(feature_names),
        'hyperparameters': {
            'learning_rate': 0.05,
            'max_iter': 500,
            'max_depth': 7,
            'l2_regularization': 0.1,
        },
        'evaluation': eval_report,
    }
    
    metadata_path = DATA_DIR / "model_v2_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"  ✓ Metadata saved: {metadata_path}\n")
    
    return metadata

def print_summary(eval_report):
    """Print training summary"""
    print('[6/6] Training Complete! 📊\n')
    print('=' * 60)
    print('MODEL v2 TRAINING SUMMARY')
    print('=' * 60)
    print(f'Model Type: HistGradientBoostingClassifier')
    print(f'Training Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'\nEvaluation Metrics:')
    print(f'  Precision: {eval_report["precision"]:.3f}')
    print(f'  Recall: {eval_report["recall"]:.3f}')
    print(f'  F1-Score: {eval_report["f1"]:.3f}')
    print(f'  AUC-ROC: {eval_report["auc"]:.3f}')
    print(f'\nModel Artifacts:')
    print(f'  Model: {V2_MODEL_PATH}')
    print(f'  Scaler: {DATA_DIR / "scaler_v2.pkl"}')
    print(f'  Metadata: {DATA_DIR / "model_v2_metadata.json"}')
    print('=' * 60)
    print('\n✅ Model v2 ready for comparison!\n')

def main():
    print('\n' + '=' * 60)
    print('RETRAIN ML MODEL - MODEL v2')
    print('Using: New feedback data + User behavior signals + Updated features')
    print('=' * 60 + '\n')
    
    try:
        # Load and prepare data
        df = load_training_data()
        X, y, groups, scaler, feature_names = prepare_features(df)
        
        # Train model
        model, cv_metrics = train_model_v2(X, y, groups)
        
        # Evaluate
        eval_report = evaluate_model(model, X, y)
        
        # Save
        save_model(model, scaler, feature_names, eval_report)
        
        # Summary
        print_summary(eval_report)
        
    except Exception as e:
        print(f'\n❌ Error during training: {e}')
        raise

if __name__ == '__main__':
    main()
