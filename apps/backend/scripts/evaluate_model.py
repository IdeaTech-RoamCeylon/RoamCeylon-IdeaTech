import pandas as pd
import numpy as np
import joblib

def calculate_ranking_metrics(df, k=5):
    """
    Calculates Precision@K and Recall@K for the recommendation model.
    """
    # Group the predictions by user
    user_groups = df.groupby('user_id')
    
    precisions = []
    recalls = []
    relevance_scores = []

    for user_id, group in user_groups:
        # Sort the user's destinations by the model's predicted probability (highest to lowest)
        top_k_items = group.sort_values(by='prediction_score', ascending=False).head(k)
        
        # Ground truth: All items this user actually liked (label == 1)
        actual_positives = group[group['label'] == 1]['item_id'].tolist()
        
        if not actual_positives:
            continue # Skip users with no positive interactions to avoid division by zero
            
        # Top K recommended items
        recommended_items = top_k_items['item_id'].tolist()
        
        # How many of the Top K recommendations were actually liked? (True Positives)
        hits = len(set(recommended_items) & set(actual_positives))
        
        # Precision@K: Out of K recommendations, what percentage were relevant?
        precisions.append(hits / k)
        
        # Recall@K: Out of all relevant items for this user, what percentage did we find in Top K?
        recalls.append(hits / len(actual_positives))
        
        # Relevance Score (Mean predicted probability of the actual positive items)
        rel_score = group[group['label'] == 1]['prediction_score'].mean()
        relevance_scores.append(rel_score)

    return {
        f"Precision@{k}": np.mean(precisions),
        f"Recall@{k}": np.mean(recalls),
        "Mean Relevance Score": np.mean(relevance_scores)
    }

if __name__ == "__main__":
    print("Loading data and model for evaluation...")
    
    # 1. Load the dataset and the trained model
    df = pd.read_csv('../data/training/ml_training_dataset_extended.csv')
    model = joblib.load('../data/training/roamceylon_recommendation_model.pkl')
    
    # 2. Separate features from metadata
    # We drop metadata columns so the model only sees the numerical features it was trained on
    features = df.drop(columns=['user_id', 'item_id', 'event_type', 'created_at', 'label'])
    
    # 3. Generate prediction scores (probability of a positive interaction)
    print("Generating prediction probabilities...")
    df['prediction_score'] = model.predict_proba(features)[:, 1]
    
    # 4. Calculate Metrics (Evaluate Top 5 recommendations per user)
    print("Calculating K-Metrics...")
    metrics = calculate_ranking_metrics(df, k=5)
    
    print("\n==================================")
    print("🚀 Model Evaluation Results (Top 5)")
    print("==================================")
    for metric, value in metrics.items():
        print(f"{metric}: {value:.4f}")
    print("==================================\n")