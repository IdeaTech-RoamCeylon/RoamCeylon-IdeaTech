import { Controller, Get, Post, Query, Logger, Body, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { SearchService } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';
import { STOP_WORDS } from '../../constants/stop-words';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

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

export interface TripPlanRequestDto {
  destination: string;
  startDate: string;
  endDate: string;
  preferences?: string[];
}

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) { }

  @Get('health')
  getHealth() {
    return { message: 'AI Planner Module Operational' };
  }

  // ------------------- Helper: Validate & Preprocess -------------------
  private validateAndPreprocess(
    query: unknown,
  ): { cleaned: string; tokens: string[] } | string {
    if (typeof query !== 'string') {
      return 'Invalid query format.';
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return 'Query cannot be empty.';
    }

    // Preprocess FIRST
    const cleaned = preprocessQuery(trimmed);

    if (!cleaned) {
      return 'Query contains no valid searchable characters.';
    }

    // Length validation AFTER preprocessing
    if (cleaned.length < 3) {
      return 'Query too short (minimum 3 characters).';
    }

    if (cleaned.length > 300) {
      return 'Query too long (maximum 300 characters).';
    }

    const tokens = cleaned.split(/\s+/);

    // Remove stop words before final check
    const meaningfulTokens = tokens.filter((t) => !STOP_WORDS.has(t));

    if (meaningfulTokens.length === 0) {
      return 'Query contains no meaningful searchable terms.';
    }

    return {
      cleaned,
      tokens: meaningfulTokens,
    };
  }

  private async executeSearch(query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();

    const validated = this.validateAndPreprocess(query);
    if (typeof validated === 'string') {
      return {
        query: String(query),
        results: [],
        message: validated,
      };
    }

    const { cleaned, tokens: queryTokens } = validated;
    const queryComplexity = queryTokens.length * cleaned.length;

    const embeddingStart = process.hrtime.bigint();
    const queryVector = this.aiService.generateDummyEmbedding(cleaned, 1536);
    const embeddingTimeMs =
      Number(process.hrtime.bigint() - embeddingStart) / 1_000_000;

    const items = await this.aiService.getAllEmbeddings();
    const rowsScanned = items.length;

    const keywordFiltered = items.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();
      return queryTokens.some(
        (token) =>
          text.includes(token) || this.aiService.isPartialMatch(token, text),
      );
    });

    const rowsAfterGate = keywordFiltered.length;

    if (rowsAfterGate === 0) {
      return {
        query: cleaned,
        results: [],
        message: 'No strong matches found.',
      };
    }

    const scored = keywordFiltered
      .map((item) => {
        const score = this.aiService.cosineSimilarity(
          queryVector,
          item.embedding,
        );

        return {
          id: item.id,
          title: item.title,
          content: item.content,
          score,
          confidence: this.searchService.getConfidence(score),
        };
      })
      .filter((item) => item.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const totalTimeMs =
      Number(process.hrtime.bigint() - totalStart) / 1_000_000;

    this.logger.log(`
    [SEARCH METRICS]
    Query            : "${cleaned}"
    Tokens           : ${queryTokens.length}
    Query Complexity : ${queryComplexity}
    Rows Scanned     : ${rowsScanned}
    Rows After Gate  : ${rowsAfterGate}
    Vector Gen Time  : ${embeddingTimeMs.toFixed(2)} ms
    Total Time       : ${totalTimeMs.toFixed(2)} ms
  `);

    return {
      query: String(query),
      results: scored.map((item, idx) => ({
        rank: idx + 1,
        ...item,
      })),
    };
  }

  // ---------------- Cosine similarity search (in-memory) ----------------
  @Get('search')
  async search(@Query('query') query: unknown): Promise<SearchResponseDto> {
    return this.executeSearch(query);
  }

  // ---------------- Vector DB search (Postgres + pgvector) ----------------
  @Get('search/vector')
  async searchVector(
    @Query('q') q: unknown,
    @Query('limit') limit?: string,
  ): Promise<SearchResponseDto> {
    const validated = this.validateAndPreprocess(q);
    if (typeof validated === 'string')
      return {
        query: typeof q === 'string' ? q : '',
        results: [],
        message: validated,
      };

    const { cleaned } = validated;

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

  // ------------------- TRIP PLANNER -------------------
  @Post('trip-plan')
  @UseGuards(JwtAuthGuard)
  async tripPlan(
    @Body() body: TripPlanRequestDto,
  ): Promise<{ plan: any; message: string }> {
    // 🔹 Use destination + preferences as search query
    const query = [body.destination, ...(body.preferences || [])].join(' ');

    const searchResults = await this.executeSearch(query);

    // Take top 3 results as planner context
    const context = searchResults.results.slice(0, 3);

    return {
      plan: {
        destination: body.destination,
        dates: {
          start: body.startDate,
          end: body.endDate,
        },
        basedOn: context.map((r) => ({
          title: r.title,
          content: r.content,
          confidence: r.confidence,
        })),
        itinerary: [
          {
            day: 1,
            activity: `Arrival ${context[0]?.title ?? ''} and city tour`,
          },
          { day: 2, activity: 'Visit local attractions' },
          { day: 3, activity: 'Beach day' },
        ],
      },
      message: 'Trip plan generated using search context (mock planner).',
    };
  }
}
