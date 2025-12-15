# RAG Pipeline Design & AI Module Documentation

---

## 1. RAG Pipeline Design

**Overview:**
- **Ingestion:**  
  - Sample tourism data is stored in `data/sample-tourism.json`.
  - Embeddings are generated for each description using a dummy embedding function in `embeddings/embedding.service.ts`.
  - Embeddings are stored in the PostgreSQL database with a pgvector column.

- **Retrieval:**  
  - User queries are received via endpoints in `ai.controller.ts`.
  - The query is preprocessed and converted to an embedding using the same dummy function.
  - The system searches the database for similar embeddings using cosine similarity (`retrieval/search.service.ts`).
  - Top results are filtered, ranked, and returned to the user.

- **Augmentation (future):**  
  - Retrieved results will be used to augment AI prompts for trip planning and recommendations.

---

## 2. Search Ranking Logic

- **Similarity Calculation:**  
  - Cosine similarity is calculated between the query embedding and each stored embedding (`embeddings/embedding.service.ts`).
  - Scores are normalized to a 0–1 range.

- **Filtering:**  
  - Results below a similarity threshold are filtered out.
  - Duplicate results (by ID) are removed.

- **Confidence Scoring:**  
  - Each result is assigned a confidence level in `retrieval/search.service.ts`:
    - High: score ≥ 0.8
    - Medium: 0.5 ≤ score < 0.8
    - Low: score < 0.5

- **Ranking:**  
  - Results are sorted by score (highest first).
  - The top N results are returned in the response.

---

## 3. Debug Endpoint Usage

- **Endpoint:**  
  - `GET /ai/debug/embedding?text=YourText`

- **Returns:**  
  - Cleaned query
  - Generated embedding vector
  - Embedding dimension
  - Min/max values of the vector
  - Validation notes

- **Example Request:**  
  ```
  GET /ai/debug/embedding?text=Sigiriya
  ```

- **Example Response:**  
  ```json
  {
    "cleanedQuery": "sigiriya",
    "embedding": [0.12, 0.34, ...],
    "dimension": 1536,
    "min": -0.5,
    "max": 0.5,
    "notes": []
  }
  ```

---

## 4. Known Limitations

- **Dummy embeddings:**  
  - Current embeddings are not semantically meaningful; all similarity and confidence scores are for demonstration only.

- **Similarity scores:**  
  - May not reflect true relevance until real embeddings are integrated.

- **Confidence levels:**  
  - May not correspond to actual confidence in result relevance.

- **Seeding:**  
  - Running the seed endpoint deletes all existing data in the embeddings table.

- **Error handling & security:**  
  - Minimal; not production-ready.

---

## 5. Folder Structure & Extensibility

```
ai/
├── ai.controller.ts         # API endpoints
├── ai.module.ts             # NestJS module definition
├── ai.service.ts            # Main AI service logic
├── RAG_design.md            # This documentation
├── data/
│     └── sample-tourism.json    # Sample tourism data
├── embeddings/
│     ├── embedding.service.ts   # Embedding logic (generation, seeding)
│     └── embedding.utils.ts     # Preprocessing utilities
├── prompts/
│     └── planner.prompt.ts      # Prompt templates for future AI tasks
├── retrieval/
│     └── search.service.ts      # Search and ranking logic
```

- **To extend:**  
  - Replace dummy embedding logic with real model in `embedding.service.ts`.
  - Add new prompt templates in `prompts/`.
  - Adjust ranking or filtering logic in `search.service.ts`.

---

## 6. Future Upgrades

- **Integrate real embeddings:**  
  - Use OpenAI, Hugging Face, or local models for semantic embeddings.
  - Update seeding and search to use real vectors.

- **Tune thresholds and ranking:**  
  - Adjust similarity thresholds and confidence logic as needed.

- **Enhance error handling and security:**  
  - Add validation, authentication, and robust error responses.

- **Expand RAG pipeline:**  
  - Integrate retrieved results into AI-generated trip plans and recommendations.

---

**This document is the reference for the AI module as of Sprint 1. Update as the system evolves.**