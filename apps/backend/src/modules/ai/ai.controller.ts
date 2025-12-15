import { Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { SearchService } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';

export interface SearchResponseDto {
  query: string;
  results: {
    rank: number;
    id: number | string;
    title: string;
    content: string;
    score: number;
    confidence?: 'High' | 'Medium' | 'Low'; // NEW: confidence field
    metadata?: any;
  }[];
  message?: string;
}

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) {}

  @Get('health')
  getHealth() {
    return { message: 'AI Planner Module Operational' };
  }

  // ---------------- Cosine similarity search (in-memory) ----------------
  @Get('search')
  async search(@Query('query') query: string) {
    if (!query || query.trim() === '') {
      return { error: 'Query cannot be empty' };
    }

    const cleanedQuery = query.trim();

    if (cleanedQuery.length < 3) {
      return { error: 'Query too short (minimum 3 characters)' };
    }

    if (cleanedQuery.length > 300) {
      return { error: 'Query too long (maximum 300 characters)' };
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(cleanedQuery)) {
      return {
        error:
          'Query contains invalid characters (letters, numbers, and spaces only)',
      };
    }

    // ---------------- PREPROCESS ----------------
    const preprocessedQuery = preprocessQuery(cleanedQuery);
    const queryTokens = preprocessedQuery.split(/\s+/);

    // ---------------- EMBEDDING ----------------
    const queryVector = this.aiService.generateDummyEmbedding(
      preprocessedQuery,
      1536,
    );

    const items = await this.aiService.getAllEmbeddings();

    // ---------------- STAGE 1: KEYWORD GATE ----------------
    const keywordFiltered = items.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();

      return queryTokens.some((token) => {
        return (
          text.includes(token) || this.aiService.isPartialMatch(token, text) // fuzzy (galle → gallefort)
        );
      });
    });

    // If nothing passes lexical filter → stop
    if (keywordFiltered.length === 0) {
      return {
        query: cleanedQuery,
        message: 'No strong matches found. Try another query.',
        results: [],
      };
    }

    // ---------------- VECTOR SIMILARITY ----------------
    const scored = keywordFiltered
      .map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        score: this.aiService.cosineSimilarity(queryVector, item.embedding),
      }))
      .filter((item) => item.score >= 0.55) // IMPORTANT threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // ---------------- FALLBACK ----------------
    if (scored.length === 0) {
      return {
        query: cleanedQuery,
        message: 'No strong matches found. Try another query.',
        results: [],
      };
    }

    return {
      query: cleanedQuery,
      results: scored.map((item, idx) => ({
        rank: idx + 1,
        ...item,
      })),
    };
  }

  // ---------------- Vector DB search (Postgres + pgvector) ----------------
  @Get('search/vector')
  async searchVector(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<SearchResponseDto> {
    const startTotal = Date.now();
    const lim = limit ? parseInt(limit, 10) : 10;

    this.logger.log(`🔍 Vector search - query received: "${query}"`);

    const cleanedQuery = preprocessQuery(query);
    this.logger.log(`🧹 Preprocessed query: "${cleanedQuery}"`);

    // ---- Embedding ----
    const embedStart = Date.now();
    const embedding = this.aiService.generateDummyEmbedding(cleanedQuery, 1536);
    const embedTime = Date.now() - embedStart;
    this.logger.log(`⚙️ Embedding generated in ${embedTime}ms`);

    // ---- Vector DB Search (ONE CALL ONLY) ----
    const searchStart = Date.now();
    const rawResults =
      await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );
    const searchTime = Date.now() - searchStart;

    this.logger.log(`📡 Vector DB search duration: ${searchTime}ms`);
    this.logger.log(`🏆 Ranked results: ${JSON.stringify(rawResults)}`);

    const total = Date.now() - startTotal;
    this.logger.log(`✅ Total vector search pipeline time: ${total}ms`);

    // ---- Return ----
    if (Array.isArray(rawResults)) {
      return { query, results: rawResults };
    } else {
      return { query, results: [], message: rawResults.message };
    }
  }

  // ------------------- SEED DATABASE -------------------
  @Post('seed')
  async seedDatabase(): Promise<{ message: string }> {
    this.logger.log('AI Planner seed database triggered');
    try {
      await this.aiService.seedEmbeddingsFromAiPlanner();
      return { message: 'Seeding completed successfully!' };
    } catch {
      return { message: 'Seeding failed.' };
    }
  }

  // ------------------- DEBUG EMBEDDING -------------------
  @Get('debug/embedding')
  debugEmbedding(@Query('text') text: string) {
    this.logger.log(`Debug embedding requested for text: "${text}"`);

    const preprocessedText = preprocessQuery(text);
    const embedding = this.aiService.generateDummyEmbedding(
      preprocessedText,
      1536,
    );

    const notes: string[] = [];
    if (!text) notes.push('Input text was empty.');
    if (embedding.every((v) => v === 0)) notes.push('Embedding is all zeros.');
    if (embedding.length !== 1536)
      notes.push(
        `Embedding dimension mismatch: got ${embedding.length}, expected 1536.`,
      );

    const min = Math.min(...embedding);
    const max = Math.max(...embedding);

    return {
      cleanedQuery: preprocessedText,
      embedding,
      dimension: embedding.length,
      min,
      max,
      notes,
    };
  }
}
