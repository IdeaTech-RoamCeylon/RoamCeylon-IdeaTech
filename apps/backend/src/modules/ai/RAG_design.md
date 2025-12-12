# Retrieval-Augmented Generation (RAG) Design Document

## Error Handling

- All API endpoints return clear error messages and appropriate HTTP status codes (e.g., 400 for bad requests, 500 for server/database errors).
- If the embedding or retrieval service fails (e.g., database connection error), the error is logged and a generic error message is returned to the client.
- Malformed or missing queries result in a 400 response with a descriptive message.
- Unexpected exceptions are caught and logged for debugging.

## Edge Cases

- **Empty Query:** Returns an empty result set with a note indicating the query was empty.
- **No Results Found:** Returns an empty results array and a message indicating no relevant locations were found.
- **Duplicate or Similar Results:** The system de-duplicates results based on ID or text similarity before returning.
- **Extremely Long Queries:** Queries are truncated to a maximum length before embedding to prevent performance issues.
- **Non-ASCII Characters:** Queries are normalized to handle Unicode and special characters.

## How Ranking Affects the Final Trip Planner Prompt

- Only the top N ranked results (by normalized score) are included in the Trip Planner prompt.
- Higher-ranked locations are prioritized in the suggested itinerary.
- The prompt template lists locations in order of rank, ensuring the most relevant places are considered first.
- Scores may be used to adjust the level of detail or confidence in the AI's recommendations.

## How Irrelevant Results Are Filtered

- Results with a normalized score below a configurable threshold (e.g., 0.5) are excluded from the prompt.
- Additional filtering may be applied based on location type, user preferences, or business rules.
- The system logs when results are filtered out for transparency and debugging.
- The frontend is notified if too few relevant results are found, allowing for fallback strategies.

---

## Examples

### Sample Embedding Output

For the input: "Visit the ancient city of Anuradhapura."

```json
{
  "input": "Visit the ancient city of Anuradhapura.",
  "embedding": [0.012, -0.034, 0.256, ...] // 768-dim float array
}
```

---

### Sample Search Output

Query: "Historical sites in Sri Lanka"

```json
[
  {
    "document_id": "doc_123",
    "content": "Anuradhapura is a UNESCO World Heritage site...",
    "score": 0.92
  },
  {
    "document_id": "doc_456",
    "content": "Polonnaruwa is known for its ancient ruins...",
    "score": 0.87
  }
]
```

---

### Sample Trip Planner Prompt Using Retrieved Results

**Prompt Template:**
```
You are a travel planner. Based on the following information, suggest a 3-day itinerary:

Context:
{retrieved_results}

User Request:
{user_query}
```

**Filled Example:**
```
You are a travel planner. Based on the following information, suggest a 3-day itinerary:

Context:
1. Anuradhapura is a UNESCO World Heritage site...
2. Polonnaruwa is known for its ancient ruins...

User Request:
I want to visit historical sites in Sri Lanka.
```

---

**This document will be updated as the RAG pipeline evolves in future sprints.**