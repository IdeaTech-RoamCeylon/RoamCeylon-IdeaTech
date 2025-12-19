import { Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { SearchService } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';
import { STOP_WORDS } from '../../constants/stop-words';


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

  // ------------------- Helper: Validate & Preprocess -------------------
  private validateAndPreprocess(query: unknown): { cleaned: string; tokens: string[] } | string {
    if (typeof query !== 'string') return 'Invalid query format.';
    const trimmed = query.trim();
    if (!trimmed) return 'Query cannot be empty.';
    if (trimmed.length < 3) return 'Query too short (minimum 3 characters).';
    if (trimmed.length > 300) return 'Query too long (maximum 300 characters).';

    const cleaned = preprocessQuery(trimmed);
    if (!cleaned) return 'Query contains invalid characters.';

    const tokens = cleaned.split(/\s+/);
    if (tokens.every(t => STOP_WORDS.has(t))) return 'Query contains no meaningful searchable terms.';

    return { cleaned, tokens };
  }

  // ---------------- Cosine similarity search (in-memory) ----------------
  @Get('search')
  async search(@Query('query') query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();
    
    // ---------- TYPE SAFETY ----------
    const validated = this.validateAndPreprocess(query);
    if (typeof validated === 'string') return { query: typeof query === 'string' ? query : '', results: [], message: validated };

    const { cleaned, tokens: queryTokens } = validated;
    const queryComplexity = queryTokens.length * cleaned.length;

    // ---------------- VECTOR GENERATION ----------------
    const embeddingStart = process.hrtime.bigint();

    const queryVector = this.aiService.generateDummyEmbedding(
      cleaned,
      1536,
    );

    const embeddingEnd = process.hrtime.bigint();
    const embeddingTimeMs = Number(embeddingEnd - embeddingStart) / 1_000_000;

    // ---------------- FETCH DATA ----------------
    const items = await this.aiService.getAllEmbeddings();
    const rowsScanned = items.length;

    // ---------------- SEARCH EXECUTION ----------------
    const searchStart = process.hrtime.bigint();

    // -------- KEYWORD + FUZZY GATE --------
    // Filter out stop words before keyword matching
    const queryTokensFiltered = queryTokens.filter(token => !STOP_WORDS.has(token));
    
    // 🔹 Log preprocessed query and filtered tokens
    this.logger.log(`🧹 Preprocessed query: "${cleaned}"`);
    this.logger.log(`🔑 Query tokens used for keyword matching: ${JSON.stringify(queryTokensFiltered)}`);

    
    const keywordFiltered = items.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();
      
      // Find matched tokens
      const matchedTokens = queryTokensFiltered.filter(token =>
         text.includes(token) || this.aiService.isPartialMatch(token, text)
      );

      // Log matched tokens
      if (matchedTokens.length > 0) {
        this.logger.log(`Item ID ${item.id} matched tokens: ${matchedTokens.join(', ')}`);
      }    

      // Return true if any token matched
      return matchedTokens.length > 0;
   });

    const rowsAfterGate = keywordFiltered.length;

    // -------- STOP EARLY --------
    if (rowsAfterGate === 0) {
      const totalEnd = process.hrtime.bigint();
      const totalTimeMs = Number(totalEnd - totalStart) / 1_000_000;

      this.logger.log(`
        [SEARCH METRICS]
        Query            : "${cleaned}"
        Tokens           : ${queryTokens.length}
        Query Complexity : ${queryComplexity}
        Rows Scanned     : ${rowsScanned}
        Rows After Gate  : 0
        Vector Gen Time  : ${embeddingTimeMs.toFixed(2)} ms
        Total Time       : ${totalTimeMs.toFixed(2)} ms
        `);

      return {
        query: cleaned,
        message: 'No strong matches found. Try another query.',
        results: [],
      };
    }

    // -------- VECTOR SIMILARITY --------
    const scored = keywordFiltered
      .map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        score: this.aiService.cosineSimilarity(queryVector, item.embedding),
      }))
      .filter((item) => item.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const searchEnd = process.hrtime.bigint();
    const searchTimeMs = Number(searchEnd - searchStart) / 1_000_000;

    const totalEnd = process.hrtime.bigint();
    const totalTimeMs = Number(totalEnd - totalStart) / 1_000_000;

    // -------- FALLBACK --------
    if (scored.length === 0) {
      this.logger.log(`
        [SEARCH METRICS]
        Query            : "${cleaned}"
        Tokens           : ${queryTokens.length}
        Query Complexity : ${queryComplexity}
        Rows Scanned     : ${rowsScanned}
        Rows After Gate  : ${rowsAfterGate}
        Vector Gen Time  : ${embeddingTimeMs.toFixed(2)} ms
        Search Exec Time : ${searchTimeMs.toFixed(2)} ms
        Total Time       : ${totalTimeMs.toFixed(2)} ms
        `);

      return {
        query: cleaned,
        message: 'No strong matches found. Try another query.',
        results: [],
      };
    }

    // ---------------- FINAL LOG ----------------
    this.logger.log(`
      [SEARCH METRICS]
      Query            : "${cleaned}"
      Tokens           : ${queryTokens.length}
      Query Complexity : ${queryComplexity}
      Rows Scanned     : ${rowsScanned}
      Rows After Gate  : ${rowsAfterGate}
      Vector Gen Time  : ${embeddingTimeMs.toFixed(2)} ms
      Search Exec Time : ${searchTimeMs.toFixed(2)} ms
      Total Time       : ${totalTimeMs.toFixed(2)} ms
      `);

    return {
      query: cleaned,
      results: scored.map((item, idx) => ({
        rank: idx + 1,
        ...item,
      })),
    };
  }

  // ---------------- Vector DB search (Postgres + pgvector) ----------------
  @Get('search/vector')
  async searchVector(
    @Query('q') q: unknown,
    @Query('limit') limit?: string,
  ): Promise<SearchResponseDto> {
    
    const validated = this.validateAndPreprocess(q);
    if (typeof validated === 'string') return { query: typeof q === 'string' ? q : '', results: [], message: validated };

    const { cleaned} = validated;

       const startTotal = Date.now();

    const parsedLimit = Number(limit);

    const lim =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 20)
        : 10;

    this.logger.log(`🔍 Vector search - query received: "${String(q)}"`);

    this.logger.log(`🧹 Preprocessed query: "${cleaned}"`);

    // ---- Embedding ----
    const embedStart = Date.now();
    const embedding = this.aiService.generateDummyEmbedding(cleaned, 1536);
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

    this.logger.log(`⏳ Vector DB search duration: ${searchTime}ms`);
    this.logger.log(`🏆 Ranked results: ${JSON.stringify(rawResults)}`);

    const total = Date.now() - startTotal;
    this.logger.log(`✅ Total vector search pipeline time: ${total}ms`);

    // ---- Return ----
    if (Array.isArray(rawResults)) {
      return { query: cleaned, results: rawResults };
    } else {
      return { query: cleaned, results: [], message: rawResults.message };
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
