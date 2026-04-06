import pandas as pd
import numpy as np
import joblib

def load_assets():
    df = pd.read_csv('../data/training/ml_training_dataset_extended.csv')
    model = joblib.load('../data/training/roamceylon_recommendation_model.pkl')
    return df, model

def prepare_features(df_subset):
    # 1. Drop metadata columns not used in training
    features = df_subset.drop(columns=['user_id', 'item_id', 'event_type', 'created_at', 'label'])
    # 2. Handle sparse data safely by filling any missing values with 0
    return features.fillna(0)

def test_repeated_predictions(df, model):
    print("Running Test 1: Repeated Predictions (Determinism)...")
    sample = df.iloc[[0]]
    features = prepare_features(sample)
    
    first_pred = model.predict_proba(features)[:, 1][0]
    
    for _ in range(100):
        pred = model.predict_proba(features)[:, 1][0]
        assert pred == first_pred, "FAIL: Model is not deterministic!"
        
    print("✅ Pass: Model returned identical scores across 100 consecutive requests.")

def test_sparse_data_users(df, model):
    print("\nRunning Test 2: Sparse Data Users (Robustness)...")
    # Isolate users with 2 or fewer total feedback interactions
    sparse_users = df[df['user_total_feedback_count'] <= 2]
    
    if len(sparse_users) == 0:
        print("⚠️ No sparse users found. Testing with a completely zeroed-out profile instead.")
        sparse_features = pd.DataFrame(0, index=[0], columns=prepare_features(df.iloc[[0]]).columns)
    else:
        sparse_features = prepare_features(sparse_users.head(10))
        
    preds = model.predict_proba(sparse_features)[:, 1]
    
    # Assert the model didn't panic and return NaNs, and that probabilities are valid
    assert not np.isnan(preds).any(), "FAIL: Model produced NaN (crash) for sparse users!"
    assert (preds >= 0.0).all() and (preds <= 1.0).all(), "FAIL: Predictions out of bounds!"
    
    print(f"✅ Pass: Model successfully processed {len(preds)} sparse profiles without crashing.")

def test_mixed_user_profiles(df, model):
    print("\nRunning Test 3: Mixed User Profiles (Sensitivity)...")
    
    # Take a base row to manipulate
    base_row = df.iloc[[0]].copy()
    features = prepare_features(base_row)
    
    # Profile A: Hardcore Culture Fan
    profile_a = features.copy()
    profile_a['interest_culture'] = 1.0
    profile_a['interest_relaxation'] = 0.0
    score_a = model.predict_proba(profile_a)[:, 1][0]
    
    # Profile B: Hardcore Relaxation Fan
    profile_b = features.copy()
    profile_b['interest_culture'] = 0.0
    profile_b['interest_relaxation'] = 1.0
    score_b = model.predict_proba(profile_b)[:, 1][0]
    
    assert score_a != score_b, "FAIL: Model is ignoring user preference features!"
    print(f"✅ Pass: Model successfully differentiated the destination based on user profile.")
    print(f"   -> Culture Fan predicted score: {score_a:.4f}")
    print(f"   -> Relaxation Fan predicted score: {score_b:.4f}")

if __name__ == "__main__":
    print("==================================")
    print("🧪 Model Stability Test Suite")
    print("==================================\n")
    
    df, model = load_assets()
    
    test_repeated_predictions(df, model)
    test_sparse_data_users(df, model)
    test_mixed_user_profiles(df, model)
    
    print("\n==================================")
    print("🎉 ALL STABILITY TESTS PASSED!")
    print("==================================")