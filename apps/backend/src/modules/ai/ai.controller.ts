import {
  Controller,
  Get,
  Post,
  Query,
  Logger,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AIService } from './ai.service';
import { EmbeddingItem } from './embeddings/embedding.service';
import { SearchService } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';
import { STOP_WORDS } from '../../constants/stop-words';
import {
  ALGORITHM_VERSION,
  LOCK_DATE,
  LOCK_STATUS,
  PLANNER_CONFIG,
} from './planner.constants';

/* -------------------- TYPES -------------------- */

export interface SearchResultItem {
  rank: number;
  id: number | string;
  title: string;
  content: string;
  score: number;
  confidence?: 'High' | 'Medium' | 'Low';
  metadata?: unknown;
}

export interface SearchResponseDto {
  query: string;
  results: SearchResultItem[];
  message?: string;
}

export interface TripPlanRequestDto {
  destination: string;
  startDate: string;
  endDate: string;
  preferences?: string[];
}

type ItineraryCategory =
  | 'Arrival'
  | 'Sightseeing'
  | 'Culture'
  | 'History'
  | 'Nature'
  | 'Beach'
  | 'Adventure'
  | 'Relaxation';

type ConfidenceLevel = 'High' | 'Medium' | 'Low';

interface ExplanationContext {
  destination?: string;
  dayNumber: number;
  totalDays: number;
  activityIndex: number;
  activitiesInDay: number;
  preferences?: string[];
  novelty?: 'High' | 'Medium' | 'Low';
  isFallback?: boolean;
  timeSlot?: 'Morning' | 'Afternoon' | 'Evening';
}

interface RichExplanation {
  selectionReason: string;
  rankingFactors: {
    relevanceScore: number;
    confidenceLevel: string;
    categoryMatch?: boolean;
    preferenceMatch?: string[];
    novelty?: string;
  };
  whyThisPlace?: string[];
  whyThisDay?: string[];
  whyThisTimeSlot?: string[];
  tips?: string[];
}

interface ItineraryItemDto {
  order: number;
  placeName: string;
  shortDescription: string;
  category: ItineraryCategory;
  confidenceScore?: 'High' | 'Medium' | 'Low';
  explanation?: RichExplanation;
}

interface DayPlan {
  day: number;
  date: string;
  theme: string;
  themeExplanation?: string;
  activities: EnhancedItineraryItemDto[];
  groupingReason?: string;
}

interface EnhancedItineraryItemDto extends ItineraryItemDto {
  dayNumber: number;
  timeSlot?: 'Morning' | 'Afternoon' | 'Evening';
  estimatedDuration?: string;
  priority: number;
  dayPlacementReason?: string;
}

interface TripPlanResponseDto {
  plan: {
    destination: string;
    dates: { start: string; end: string };
    totalDays: number;
    dayByDayPlan: DayPlan[];
    summary: {
      totalActivities: number;
      categoriesIncluded: ItineraryCategory[];
      preferencesMatched: string[];
      planConfidence: 'High' | 'Medium' | 'Low';
      usedFallback: boolean;
    };
  };
  message: string;
}

/* -------------------- CONTROLLER -------------------- */

@Controller('ai')
@UseGuards(ThrottlerGuard)
export class AIController {
  private readonly logger = new Logger(AIController.name);

  private readonly CONFIDENCE_THRESHOLDS = PLANNER_CONFIG.CONFIDENCE;

  private readonly FALLBACK_MESSAGES = {
    NO_HIGH_CONFIDENCE:
      'No high-confidence matches found. Showing best available results.',
    NO_MATCHES:
      'No relevant items found. Please try refining your search with different keywords.',
    LOW_QUALITY:
      'Search results have low confidence scores. Consider adding more specific details to your query.',
    PARTIAL_RESULTS:
      'Only partial results available. Some recommendations may not strongly match your preferences.',
    USED_FALLBACK_ITINERARY:
      'Not enough strong matches found. A basic fallback itinerary was generated. Add 1–2 preferences (e.g., "beach", "history") or nearby town names for better results.',
  };

  private readonly INTEREST_CATEGORY_MAP: Record<string, ItineraryCategory[]> =
    {
      nature: ['Nature'],
      history: ['History', 'Culture', 'Sightseeing'],
      culture: ['Culture', 'History', 'Sightseeing'],
      adventure: ['Adventure', 'Nature'],
      beach: ['Beach', 'Relaxation'],
      beaches: ['Beach', 'Relaxation'],
      relaxation: ['Relaxation', 'Beach'],
      sightseeing: ['Sightseeing', 'Culture', 'History'],
      food: ['Culture', 'Relaxation'],
      shopping: ['Sightseeing', 'Culture'],
      nightlife: ['Sightseeing', 'Relaxation'],

      // Allow explicit category words as preferences
      arrival: ['Arrival'],
      sightseeing_day: ['Sightseeing'],
      culture_day: ['Culture'],
      history_day: ['History'],
      nature_day: ['Nature'],
      beach_day: ['Beach'],
      relaxation_day: ['Relaxation'],
      adventure_day: ['Adventure'],
    };

  private readonly LOCATION_REGION_HINTS: Record<string, string[]> = {
    galle: [
      'galle',
      'galle fort',
      'unawatuna',
      'hikkaduwa',
      'mirissa',
      'weligama',
      'bentota',
    ],
    colombo: ['colombo', 'negombo', 'mount lavinia'],
    kandy: ['kandy', 'peradeniya'],
    sigiriya: ['sigiriya', 'dambulla', 'polonnaruwa'],
    nuwaraeliya: ['nuwara eliya', 'ella', 'haputale'],
    yala: ['yala', 'tissamaharama', 'kirinda'],
    trincomalee: ['trincomalee', 'nilaveli', 'uppuveli'],
  };

  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) { }

  @Get('health')
  getHealth() {
    return {
      message: 'AI Planner Module Operational',
      algorithm: {
        version: ALGORITHM_VERSION,
        status: LOCK_STATUS,
        locked_since: LOCK_DATE,
        changes_allowed: 'Critical bug fixes only',
      },
    };
  }

  /* -------------------- NORMALIZATION -------------------- */

  private normalizeText(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizeLower(value: unknown): string {
    return this.normalizeText(value).toLowerCase();
  }

  private normalizePreferences(prefs?: string[]): string[] {
    if (!Array.isArray(prefs)) return [];
    const normalized = prefs.map((p) => this.normalizeText(p)).filter(Boolean);

    // deterministic de-dup (case-insensitive) while preserving first occurrence
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of normalized) {
      const key = p.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
    return out;
  }

  private clampDayCount(startDateStr: string, endDateStr: string): number {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

    const diffDays =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(1, diffDays);
  }

  /* ---------- Validate & Preprocess ---------- */

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

    const cleaned = preprocessQuery(trimmed);

    if (!cleaned) {
      return 'Query contains no valid searchable characters.';
    }

    if (cleaned.length < PLANNER_CONFIG.SEARCH.MIN_QUERY_LENGTH) {
      return 'Query too short (minimum 3 characters).';
    }

    if (cleaned.length > PLANNER_CONFIG.SEARCH.MAX_QUERY_LENGTH) {
      return 'Query too long (maximum 300 characters).';
    }

    const tokens = cleaned.split(/\s+/);
    const meaningfulTokens = tokens.filter((t) => !STOP_WORDS.has(t));

    if (meaningfulTokens.length === 0) {
      return 'Query contains no meaningful searchable terms.';
    }

    return {
      cleaned,
      tokens: meaningfulTokens,
    };
  }

  /**
   * Filter results based on confidence thresholds
   * Returns filtered results and appropriate fallback message if needed
   */
  private filterByConfidenceThreshold(
    results: SearchResultItem[],
    minConfidence: 'High' | 'Medium' | 'Low' = 'Medium',
  ): { filtered: SearchResultItem[]; fallbackMessage?: string } {
    if (results.length === 0) {
      return {
        filtered: [],
        fallbackMessage: this.FALLBACK_MESSAGES.NO_MATCHES,
      };
    }

    // Threshold map
    const thresholdMap = {
      High: this.CONFIDENCE_THRESHOLDS.HIGH,
      Medium: this.CONFIDENCE_THRESHOLDS.MEDIUM,
      Low: this.CONFIDENCE_THRESHOLDS.MINIMUM,
    };
    const threshold = thresholdMap[minConfidence];

    // Filter results above threshold
    const filtered = results.filter((item) => item.score !== undefined && item.score >= threshold);

    // Default fallback
    let fallbackMessage: string | undefined;

    // Case 1: No results after filtering
    if (filtered.length === 0) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_MATCHES;
    }
    // Case 2: Minimum confidence is High, but no high-confidence matches
    else if (minConfidence === 'High' && !filtered.some((r) => r.confidence === 'High')) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_HIGH_CONFIDENCE;
    }
    // Case 3: Partial high-confidence coverage
    else if (minConfidence === 'High') {
      const highConfidenceCount = filtered.filter((r) => r.confidence === 'High').length;
      if (highConfidenceCount < filtered.length * 0.5) {
        fallbackMessage = this.FALLBACK_MESSAGES.PARTIAL_RESULTS;
      }
    }
    // Case 4: Average score is low
    const avgScore = filtered.reduce((sum, r) => sum + (r.score || 0), 0) / filtered.length;
    if (!fallbackMessage && avgScore < 0.65) {
      fallbackMessage = this.FALLBACK_MESSAGES.LOW_QUALITY;
    }

    return { filtered, fallbackMessage };
  }

  /* ---------- In-memory cosine search ---------- */

  private async executeSearch(query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();

    const originalQuery = typeof query === 'string' ? query.trim() : '';

    // Better empty query message
    if (!originalQuery) {
      return {
        query: '',
        results: [],
        message:
          'Please enter a destination or interest (e.g., "beaches in Galle", "temples", "wildlife").',
      };
    }

    const validated = this.validateAndPreprocess(query);
    if (typeof validated === 'string') {
      // Add helpful suggestions to short queries
      const helpfulMessage = validated.includes('too short')
        ? `${validated} Try "Sigiriya", "Ella hiking", or "beach resorts".`
        : validated;

      return {
        query: originalQuery,
        results: [],
        message: helpfulMessage,
      };
    }

    const { cleaned, tokens: queryTokens } = validated;
    const queryComplexity = queryTokens.length * cleaned.length;

    const embeddingStart = process.hrtime.bigint();
    const queryVector = this.aiService.generateDummyEmbedding(cleaned, 1536);
    const embeddingEnd = process.hrtime.bigint();
    const embeddingTimeMs = Number(embeddingEnd - embeddingStart) / 1_000_000;

    const searchStart = process.hrtime.bigint();

    // -------- KEYWORD + FUZZY GATE --------
    // 🔹 Log preprocessed query and filtered tokens
    this.logger.log(`🧹 Preprocessed query: "${cleaned}"`);

    const keywordFiltered = items.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();

      // Find matched tokens
      const matchedTokens = queryTokens.filter(
        (token) =>
          text.includes(token) || this.aiService.isPartialMatch(token, text),
      );

      // Return true if any token matched
      return matchedTokens.length > 0;
    });

    const rowsAfterGate = keywordFiltered.length;

    // -------- STOP EARLY --------
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
          normalizedText: `${item.title} ${item.content}`.toLowerCase().trim(),
        };
      })
      .filter((item) => item.score >= this.CONFIDENCE_THRESHOLDS.MINIMUM)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.id).localeCompare(String(b.id)); // Stable sort
      })
      .slice(0, 5)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
      }));

    // Apply confidence threshold filtering
    const { filtered, fallbackMessage } = this.filterByConfidenceThreshold(
      scored,
      'Medium', // Require at least Medium confidence
    );

    const searchEnd = process.hrtime.bigint();
    const searchTimeMs = Number(searchEnd - searchStart) / 1_000_000;

    const totalEnd = process.hrtime.bigint();
    const totalTimeMs = Number(totalEnd - totalStart) / 1_000_000;

    this.logger.log(
      `[SEARCH METRICS]
  Query           : "${originalQuery}"
  Tokens          : ${queryTokens.length}
  Query Complexity: ${queryComplexity}
  Rows Scanned    : ${rawResults.length} (Vector Top-K)
  Rows After Gate : ${rowsAfterGate}
  Vector Gen Time : ${embeddingTimeMs.toFixed(2)} ms
  Search Exec Time: ${searchTimeMs.toFixed(2)} ms
  Total Time      : ${totalTimeMs.toFixed(2)} ms`,
    );

    return {
      query: originalQuery,
      results: filtered.map((item, idx) => ({
        ...item,
        rank: idx + 1, // Re-assign ranks after filtering
      })),
      message: fallbackMessage,
    };
  }

  /* ---------- REST endpoints ---------- */

  @Get('search')
  async search(@Query('query') query: unknown): Promise<SearchResponseDto> {
    return this.executeSearch(query);
  }

  @Get('search/vector')
  async searchVector(
    @Query('q') q: unknown,
    @Query('limit') limit?: string,
    @Query('minConfidence') minConfidence?: string,
  ): Promise<SearchResponseDto> {
    try {
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

      // Apply confidence filtering to vector results
      if (Array.isArray(rawResults)) {
        const confidenceLevel =
          minConfidence === 'High' || minConfidence === 'Medium' || minConfidence === 'Low'
            ? minConfidence
            : 'Medium';

        const { filtered, fallbackMessage } = this.filterByConfidenceThreshold(
          rawResults,
          confidenceLevel,
        );

        return {
          query: cleaned,
          results: filtered,
          message: fallbackMessage,
        };
      } else {
        return { query: cleaned, results: [], message: rawResults.message };
      }
    } catch (error) {
      this.logger.error(`Vector search failed: ${error.message}`, error.stack);
      return {
        query: typeof q === 'string' ? q : '',
        results: [],
        message: 'A temporary issue occurred with our search service. Please try keyword search instead.',
      };
    }

    return { query: cleaned, results: [], message: rawResults.message };
  }

  /* ---------- Seed ---------- */

  @Post('seed')
  async seedDatabase(): Promise<{ message: string }> {
    try {
      await this.aiService.seedEmbeddingsFromAiPlanner();
      return { message: 'Seeding completed successfully!' };
    } catch {
      return { message: 'Seeding failed.' };
    }
  }

  /* ---------- Debug ---------- */

  @Get('debug/embedding')
  debugEmbedding(@Query('text') text: string) {
    const cleaned = preprocessQuery(text);
    const embedding = this.aiService.generateDummyEmbedding(cleaned, 1536);

    return {
      cleanedQuery: cleaned,
      embedding,
      dimension: embedding.length,
      min: Math.min(...embedding),
      max: Math.max(...embedding),
    };
  }

  /* ==================== EXPLANATION HELPERS ==================== */

  private inferRegion(text?: string): string | null {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const [region, keys] of Object.entries(this.LOCATION_REGION_HINTS)) {
      if (keys.some((k) => lower.includes(k))) return region;
    }
    return null;
  }

  private humanizeConfidence(c?: ConfidenceLevel) {
    if (c === 'High') return 'High confidence';
    if (c === 'Medium') return 'Medium confidence';
    return 'Low confidence';
  }

  private scoreLabel(score: number) {
    if (score >= 0.85) return 'Excellent match';
    if (score >= 0.72) return 'Strong match';
    if (score >= 0.62) return 'Good match';
    return 'Weak match';
  }

  private computeNovelty(
    normalizedText: string,
    seenSet: Set<string>,
  ): 'High' | 'Medium' | 'Low' {
    if (seenSet.has(normalizedText)) return 'Low';
    return normalizedText.length > 120 ? 'High' : 'Medium';
  }

  private extractMatchedPreferences(
    result: SearchResultItem,
    preferences?: string[],
  ): { matched: string[]; titleMatches: number; contentMatches: number } {
    const matched: string[] = [];
    let titleMatches = 0;
    let contentMatches = 0;

    if (!preferences?.length) return { matched, titleMatches, contentMatches };

    const titleLower = result.title.toLowerCase();
    const contentLower = result.content.toLowerCase();

    for (const pref of preferences) {
      const p = pref.toLowerCase();
      if (titleLower.includes(p)) {
        matched.push(pref);
        titleMatches++;
      } else if (contentLower.includes(p)) {
        matched.push(pref);
        contentMatches++;
      }
    }

    return { matched, titleMatches, contentMatches };
  }

  /**
  * Generates clear, user-friendly explanations for why a place was chosen
  */
  private buildRichExplanation(
    result: SearchResultItem,
    priorityScore: number,
    category: ItineraryCategory,
    ctx: ExplanationContext,
  ): RichExplanation {
    const score = result.score ?? 0;
    const confidence = (result.confidence ?? 'Low') as ConfidenceLevel;

    const { matched } = this.extractMatchedPreferences(result, ctx.preferences);

    const whyPlace: string[] = [];
    const whyDay: string[] = [];
    const whyTime: string[] = [];
    const tips: string[] = [];

    // Handle fallback case
    if (ctx.isFallback) {
      return {
        selectionReason: "We included this to give you a complete itinerary, though we don't have strong matches for your search.",
        rankingFactors: {
          relevanceScore: 0,
          confidenceLevel: 'Low',
          categoryMatch: false,
          novelty: 'Low',
        },
        whyThisPlace: [
          'Added because we found limited options matching your preferences',
          'Try adding specific interests (like "beach" or "temples") for better suggestions'
        ],
        tips: ['Consider refining your destination or adding nearby town names'],
      };
    }

    // WHY THIS PLACE
    if (matched.length > 0) {
      whyPlace.push(`Matches what you're looking for: ${matched.slice(0, 2).join(', ')}`);
    }

    if (score >= 0.85) {
      whyPlace.push('Strong match for your trip');
    } else if (score >= 0.72) {
      whyPlace.push('Good fit based on your preferences');
    } else if (score >= 0.62) {
      whyPlace.push('Decent option that fits your style');
    } else {
      whyPlace.push('Added for variety');
    }

    // Add priority boost context
    if (priorityScore >= 1.3) {
      whyPlace.push('Highly recommended based on your trip style');
    }

    // Check region mismatch
    const destRegion = this.inferRegion(ctx.destination);
    const placeRegion = this.inferRegion(`${result.title} ${result.content}`);
    if (destRegion && placeRegion && destRegion !== placeRegion) {
      whyPlace.push('Note: This is farther from your main destination');
      tips.push('If you prefer staying local, add nearby town names to your preferences');
    }

    // WHY THIS DAY
    if (ctx.dayNumber === 1) {
      if (category === 'Arrival') {
        whyDay.push('Perfect for your first day - easy after traveling');
      } else {
        whyDay.push('Scheduled for day one to start your trip smoothly');
      }
    } else if (ctx.dayNumber === ctx.totalDays) {
      whyDay.push('Great way to end your trip on a high note');
    } else {
        if (category === 'Beach' || category === 'Relaxation') {
          whyDay.push('Placed here to give you a break mid-trip');
        } else if (category === 'Adventure' || category === 'Nature') {
          whyDay.push("Scheduled when you'll have good energy levels");
        } else {
          whyDay.push('Fits well with your other activities this day');
        }
      }

    // WHY THIS TIME SLOT
    const slot = ctx.timeSlot;
    if (ctx.dayNumber === 1 && ctx.activityIndex === 0) {
      whyTime.push('Afternoon works best after check-in');
    } else if (slot === 'Morning') {
      whyTime.push('Morning is ideal for this type of activity');
    } else if (slot === 'Afternoon') {
      whyTime.push('Afternoon timing keeps your day balanced');
    } else if (slot === 'Evening') {
      whyTime.push('Evening slot for a relaxed end to the day');
    }

    const titleLower = result.title.toLowerCase();
    const contentLower = result.content.toLowerCase();

    // PRACTICAL TIPS
    if (category === 'Beach') {
      tips.push('Bring sunscreen and stay hydrated');
    } else if (category === 'Nature' || category === 'Adventure') {
      tips.push('Wear comfortable sturdy shoes - paths can be uneven and allow extra travel time');
    } else if (category === 'Culture' || category === 'History') {
        if (titleLower.includes('temple') || titleLower.includes('kovil') || 
        titleLower.includes('church') || titleLower.includes('mosque')) {
      tips.push('Dress modestly - cover shoulders and knees');
    } else {
      tips.push('Allow extra time - these sites are often larger than expected');
    }}

    // Context-specific tips
    if (contentLower.includes('entrance fee') || contentLower.includes('ticket')) {
      tips.push('Cash may be needed for entrance fees');
    }

    if (category === 'Adventure' && (contentLower.includes('rain') || contentLower.includes('weather'))) {
      tips.push('Check weather - some activities close during heavy rain');
    }

    // Build selection reason (main summary)
    const parts: string[] = [];
    if (matched.length) {
      parts.push(`it matches your interest in ${matched.slice(0, 2).join(' and ')}`);
    }
    if (score >= 0.72) {
      parts.push("it's a strong fit for your trip");
    } else {
      parts.push("it adds variety to your itinerary");
    }

    const selectionReason = parts.length 
      ? `We picked this because ${parts.join(' and ')}.`
      : 'We included this to round out your itinerary.';

    return {
      selectionReason,
      rankingFactors: {
        relevanceScore: score,
        confidenceLevel: confidence,
        categoryMatch: true,
        preferenceMatch: matched.length ? matched : undefined,
        novelty: ctx.novelty,
      },
      whyThisPlace: whyPlace,
      whyThisDay: whyDay.length ? whyDay : undefined,
      whyThisTimeSlot: whyTime.length ? whyTime : undefined,
      tips: tips.length ? tips : undefined,
    };
  }

  private isValidDestination(destination?: string): boolean {
    if (!destination || typeof destination !== 'string') return false;

    const trimmed = destination.trim().toLowerCase();

    // Minimum length for a meaningful destination
    if (trimmed.length < 2) return false;

    // Reject common placeholder/nonsense values
    const invalidValues = [
      'unknown',
      'n/a',
      'none',
      'test',
      'undefined',
      'null',
      'somewhere',
    ];
    if (invalidValues.includes(trimmed)) return false;

    // Reject searches that are purely numeric (likely zip codes or IDs, not city names)
    if (/^\d+$/.test(trimmed)) return false;

    return true;
  }

  /**
   * Safely parse and validate trip dates
   */
  private validateDates(
    start?: string,
    end?: string,
  ): { startDate: string; endDate: string; dayCount: number; isValid: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDate = (d?: string): Date | null => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    };

    let startDate = parseDate(start);
    let endDate = parseDate(end);

    // Default: 3-day trip starting today
    if (!startDate) {
      startDate = new Date(today);
    }

    if (!endDate || endDate < startDate) {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2); // Default 3 days (e.g., 9th to 11th)
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const dayCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Cap trip duration to 14 days to prevent performance issues
    const finalDayCount = Math.min(Math.max(1, dayCount), 14);

    // Recalculate end date if capped
    if (finalDayCount !== dayCount) {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + finalDayCount - 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dayCount: finalDayCount,
      isValid: !!start && !!end && !isNaN(new Date(start).getTime()) && !isNaN(new Date(end).getTime()),
    };
  }

    for (const pref of preferences) {
      const prefLower = pref.toLowerCase();
      if (matchedPrefs.has(prefLower)) continue;

      const mappedCategories = this.INTEREST_CATEGORY_MAP[prefLower] || [];

      if (textLower.includes(prefLower)) {
        alignmentScore +=
          PLANNER_CONFIG.SCORING.CATEGORY_ALIGNMENT.DIRECT_MATCH;
        matchedPrefs.add(prefLower);
        continue;
      }

      let bestCategoryMatch = 0;
      for (const category of mappedCategories) {
        const categoryLower = category.toLowerCase();
        if (textLower.includes(categoryLower)) {
          bestCategoryMatch = Math.max(
            bestCategoryMatch,
            PLANNER_CONFIG.SCORING.CATEGORY_ALIGNMENT.MAPPED_MATCH,
          );
        }
      }

      if (bestCategoryMatch > 0) {
        alignmentScore += bestCategoryMatch;
        matchedPrefs.add(prefLower);
      }
    }

    return Math.min(
      alignmentScore,
      PLANNER_CONFIG.SCORING.CATEGORY_ALIGNMENT.MAX,
    );
  }

  private scoreResultsByPreferences(
    results: SearchResultItem[],
    preferences?: string[],
    dayCount?: number,
    destination?: string,
  ): Array<SearchResultItem & { priorityScore: number }> {
    const tripType = dayCount ? this.getTripLengthType(dayCount) : undefined;
    const dest = this.normalizeLower(destination);

    return results
      .map((result) => {
        const baseScore = result.score || 0.5;
        let priorityScore = baseScore;

        const confidenceMultiplier =
          PLANNER_CONFIG.SCORING.CONFIDENCE_MULTIPLIERS[
            result.confidence ?? 'Low'
          ];
        priorityScore *= confidenceMultiplier;

        const text = `${result.title} ${result.content}`.toLowerCase();

        const boostMultiplier =
          baseScore < PLANNER_CONFIG.SCORING.MIN_BASE_SCORE
            ? PLANNER_CONFIG.SCORING.LOW_QUALITY_MULTIPLIER
            : 1.0;

        if (dest && dest.length >= PLANNER_CONFIG.SEARCH.MIN_QUERY_LENGTH) {
          const hasDestInTitle = result.title.toLowerCase().includes(dest);
          const hasDestInContent = result.content.toLowerCase().includes(dest);
          const hasNearMetadata = text.includes('near:') && text.includes(dest);

          if (hasDestInTitle) {
            priorityScore +=
              PLANNER_CONFIG.SCORING.PROXIMITY_BOOSTS.TITLE * boostMultiplier;
          } else if (hasNearMetadata) {
            priorityScore +=
              PLANNER_CONFIG.SCORING.PROXIMITY_BOOSTS.METADATA *
              boostMultiplier;
          } else if (hasDestInContent) {
            priorityScore +=
              PLANNER_CONFIG.SCORING.PROXIMITY_BOOSTS.CONTENT * boostMultiplier;
          }

          if (
            (hasDestInTitle || hasNearMetadata) &&
            result.score >= PLANNER_CONFIG.THRESHOLDS.HIGH_SCORE_COMBO
          ) {
            priorityScore += PLANNER_CONFIG.SCORING.PROXIMITY_BOOSTS.COMBO;
          }
        }

        const categoryAlignment = this.calculateCategoryAlignment(
          text,
          preferences,
        );
        priorityScore += categoryAlignment * boostMultiplier;

        if (tripType === 'short') {
          if (text.match(/fort|temple|kovil|church|museum|beach/)) {
            priorityScore +=
              PLANNER_CONFIG.SCORING.TRIP_OPTIMIZATION.SHORT_BOOST *
              boostMultiplier;
          }
        }

        if (tripType === 'long') {
          if (text.match(/nature|park|wildlife|relax|spa|garden/)) {
            priorityScore +=
              PLANNER_CONFIG.SCORING.TRIP_OPTIMIZATION.LONG_BOOST *
              boostMultiplier;
          }
        }

        priorityScore = Math.min(
          priorityScore,
          PLANNER_CONFIG.SCORING.MAX_PRIORITY,
        );

        return { ...result, priorityScore };
      })
      .sort((a, b) => {
        const scoreDiff = b.priorityScore - a.priorityScore;
        if (Math.abs(scoreDiff) > 0.001) return scoreDiff;

        if (a.confidence !== b.confidence) {
          const order = { High: 3, Medium: 2, Low: 1 };
          return order[b.confidence!] - order[a.confidence!];
        }

        return String(a.id).localeCompare(String(b.id));
      });
  }

  private getTripLengthType(dayCount: number): 'short' | 'medium' | 'long' {
    if (dayCount <= PLANNER_CONFIG.TRIP_LENGTH.SHORT_MAX) return 'short';
    if (dayCount <= PLANNER_CONFIG.TRIP_LENGTH.MEDIUM_MAX) return 'medium';
    return 'long';
  }

        activitiesForDay.push({
          order: activityIndex + 1,
          dayNumber: day,
          placeName: result.title,
          shortDescription: result.content,
          category,
          timeSlot: this.assignTimeSlot(i, activitiesThisDay, day),
          estimatedDuration: this.estimateDuration(category),
          confidenceScore: result.confidence,
          priority:
            Math.round(
              (scored.find((s) => s.id === result.id)?.priorityScore || 0) *
              100,
            ) / 100,
          explanation: this.generateExplanation(
            result,
            priorityScore,
            category,
            preferences,
          ),
        });

  /* ==================== FALLBACK BUILDERS ==================== */

  private createFallbackItinerary(
    dayCount: number,
    startDate: string,
    destination?: string,
  ): DayPlan[] {
    const dayPlans: DayPlan[] = [];
    const baseDate = new Date(startDate);

    for (let day = 1; day <= dayCount; day++) {
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + day - 1);

      const fallbackCategory: ItineraryCategory =
        day === 1 ? 'Arrival' : 'Sightseeing';
      const fallbackTimeSlot: 'Morning' | 'Afternoon' =
        day === 1 ? 'Afternoon' : 'Morning';

      const fallbackActivity: EnhancedItineraryItemDto = {
        order: 1,
        dayNumber: day,
        placeName: destination || 'Destination',
        shortDescription:
          day === 1
            ? 'Arrival and check-in at accommodation. Explore nearby area.'
            : `Explore ${destination || 'the destination'} at your own pace. Visit local attractions and landmarks.`,
        category: fallbackCategory,
        timeSlot: fallbackTimeSlot,
        estimatedDuration: '3-4 hours',
        confidenceScore: 'Low',
        priority: 0.3,
        explanation: this.buildRichExplanation(
          {
            rank: 1,
            id: 'fallback',
            title: destination || 'Destination',
            content: 'Fallback activity',
            score: 0,
            confidence: 'Low',
          },
          0.3,
          fallbackCategory,
          {
            destination,
            dayNumber: day,
            totalDays: dayCount,
            activityIndex: 0,
            activitiesInDay: 1,
            isFallback: true,
            timeSlot: fallbackTimeSlot,
          },
        ),
      };

      dayPlans.push({
        day,
        date: dayDate.toISOString().split('T')[0],
        theme: day === 1 ? 'Arrival Day' : 'Exploration',
        activities: [fallbackActivity],
        groupingReason: 'Fallback day plan (not enough strong matches found).',
        themeExplanation:
          'A basic structure was created due to limited strong matches.',
      });
    }

    return dayPlans;
  }

  private createSingleDayFallback(
    day: number,
    destination?: string,
  ): EnhancedItineraryItemDto {
    const isDay1 = day === 1;
    const category: ItineraryCategory = isDay1 ? 'Arrival' : 'Sightseeing';
    const timeSlot: 'Morning' | 'Afternoon' = isDay1 ? 'Afternoon' : 'Morning';

    return {
      order: 1,
      dayNumber: day,
      placeName: destination || 'Destination',
      shortDescription: isDay1
        ? 'Arrival and check-in at accommodation. Explore nearby area.'
        : `Explore ${destination || 'the destination'} at your own pace. Visit local landmarks and attractions.`,
      category,
      timeSlot,
      estimatedDuration: '3-4 hours',
      confidenceScore: 'Low',
      priority: 0.3,
      explanation: this.buildRichExplanation(
        {
          rank: 1,
          id: 'fallback',
          title: destination || 'Destination',
          content: 'Fallback activity',
          score: 0,
          confidence: 'Low',
        },
        0.3,
        category,
        {
          destination,
          dayNumber: day,
          totalDays: day,
          activityIndex: 0,
          activitiesInDay: 1,
          isFallback: true,
          timeSlot,
        },
      ),
    };
  }

  /* ==================== CATEGORY / DIVERSITY ==================== */

  private inferCategoryFromText(
    title: string,
    content: string,
    preferences?: string[],
  ): ItineraryCategory {
    const text = `${title} ${content}`.toLowerCase();

    if (preferences) {
      for (const pref of preferences) {
        const p = pref.toLowerCase();
        if (p.match(/beach|coast/)) return 'Beach';
        if (p.match(/culture|temple|heritage/)) return 'Culture';
        if (p.match(/nature|wildlife|park/)) return 'Nature';
        if (p.match(/relax|spa|resort/)) return 'Relaxation';
      }
    }

    if (text.match(/beach|coast|ocean/)) return 'Beach';
    if (text.match(/temple|museum|heritage/)) return 'Culture';
    if (text.match(/park|wildlife|forest/)) return 'Nature';
    if (text.match(/fort|ancient|historical/)) return 'Sightseeing';

    return 'Sightseeing';
  }

  private categoryCache = new Map<string | number, ItineraryCategory>();

  private determineActivityCategory(
    title: string,
    content: string,
    dayNumber: number,
    activityIndex: number,
    preferences?: string[],
    resultId?: string | number,
  ): ItineraryCategory {
    if (resultId && this.categoryCache.has(resultId)) {
      return this.categoryCache.get(resultId)!;
    }

    let category = this.inferCategoryFromText(title, content, preferences);

    if (!category || category === 'Sightseeing') {
      const rotationPattern: ItineraryCategory[] = [
        'Sightseeing',
        'History',
        'Culture',
        'Nature',
        'Beach',
        'Relaxation',
        'Adventure',
      ];
      category =
        rotationPattern[(dayNumber + activityIndex) % rotationPattern.length];
    }

    if (resultId) {
      this.categoryCache.set(resultId, category);
    }

    return category;
  }

  private selectDiverseActivities(
    scoredResults: Array<SearchResultItem & { priorityScore: number }>,
    maxCount: number,
    preferences?: string[],
  ): SearchResultItem[] {
    const selected: SearchResultItem[] = [];
    const categoryCount: Record<string, number> = {};
    const textSet = new Set<string>();

    const maxPerCategory = Math.ceil(
      maxCount / PLANNER_CONFIG.DIVERSITY.CATEGORY_DIVISOR,
    );

    const sorted = [...scoredResults].sort((a, b) => {
      const diff = b.priorityScore - a.priorityScore;
      if (Math.abs(diff) > 0.001) return diff;
      return String(a.id).localeCompare(String(b.id));
    });

    for (const result of sorted) {
      if (selected.length >= maxCount) break;

      const textKey = `${result.title} ${result.content}`.toLowerCase();
      if (textSet.has(textKey)) continue;

      const category = this.inferCategoryFromText(
        result.title,
        result.content,
        preferences,
      );

      const currentCount = categoryCount[category] || 0;
      if (currentCount < maxPerCategory) {
        selected.push(result);
        categoryCount[category] = currentCount + 1;
        textSet.add(textKey);
      }
    }

    return selected;
  }

  /* ==================== DAY PLANNING HELPERS ==================== */

  private allocateAcrossDays(
    activities: SearchResultItem[],
    dayCount: number,
    maxPerDay: number,
  ): SearchResultItem[][] {
    const buckets: SearchResultItem[][] = Array.from(
      { length: dayCount },
      () => [],
    );

    activities.forEach((item, index) => {
      const dayIndex = index % dayCount;
      if (buckets[dayIndex].length < maxPerDay) {
        buckets[dayIndex].push(item);
      }
    });

    return buckets;
  }

  private assignTimeSlot(
    activityIndex: number,
    totalActivitiesInDay: number,
    dayNumber?: number,
  ): 'Morning' | 'Afternoon' | 'Evening' {
    if (dayNumber === 1) {
      if (activityIndex === 0) return 'Afternoon';
      return 'Evening';
    }

    if (totalActivitiesInDay === 1) return 'Morning';

    if (totalActivitiesInDay === 2) {
      return activityIndex === 0 ? 'Morning' : 'Afternoon';
    }

    const ratio = activityIndex / (totalActivitiesInDay - 1);
    if (ratio < 0.4) return 'Morning';
    if (ratio < 0.7) return 'Afternoon';
    return 'Evening';
  }

  private estimateDuration(category: ItineraryCategory): string {
    const durations: Record<ItineraryCategory, string> = {
      Arrival: '2-3 hours',
      Sightseeing: '2-4 hours',
      Culture: '2-3 hours',
      History: '2-4 hours',
      Nature: '3-5 hours',
      Adventure: '3-6 hours',
      Beach: '2-4 hours',
      Relaxation: '2-3 hours',
    };

    return durations[category];
  }

  /**
  * Generates day theme with clear, friendly explanation
  */
  private generateDayTheme(activities: EnhancedItineraryItemDto[]): {
    theme: string;
    explanation: string;
  } {
    if (!activities?.length) {
      return {
        theme: 'Free Day',
        explanation: 'No specific activities planned - explore at your own pace.',
      };
    }

    const categories = activities
      .map((a) => (a.category || '').trim().toLowerCase())
      .filter(Boolean);

    const unique = Array.from(new Set(categories));
    
    // Single category day
    if (unique.length === 1) {
      const category = unique[0];
      const themes: Record<string, { theme: string; explanation: string }> = {
        arrival: {
          theme: 'Arrival Day',
          explanation: 'Take it easy - settle in and get your bearings.',
        },
        beach: {
          theme: 'Beach Day',
          explanation: 'Enjoy the coast and soak up the sun.',
        },
        culture: {
          theme: 'Cultural Day',
          explanation: 'Dive into local traditions and heritage.',
        },
        history: {
          theme: 'History Day',
          explanation: 'Explore historical sites and stories.',
        },
        nature: {
          theme: 'Nature Day',
          explanation: 'Get outdoors and enjoy natural beauty.',
        },
        adventure: {
          theme: 'Adventure Day',
          explanation: 'Active experiences for the adventurous.',
        },
        relaxation: {
          theme: 'Relaxation Day',
          explanation: 'Take it slow and recharge.',
        },
        sightseeing: {
          theme: 'Sightseeing Day',
          explanation: 'See the highlights and must-visit spots.',
        },
      };

      return themes[category] || {
        theme: 'Exploration Day',
        explanation: `Focus on ${category} activities today.`,
      };
    }

    // Mixed categories - create intuitive combinations
    const hasAny = (cats: string[]) => cats.some((c) => unique.includes(c));

    // Arrival combinations
    if (hasAny(['arrival'])) {
        if (hasAny(['beach'])) {
          return {
            theme: 'Arrival & Beach',
            explanation: 'Start with check-in, then relax by the water.',
          };
        }
        if (hasAny(['culture', 'sightseeing'])) {
          return {
            theme: 'Arrival & Exploration',
            explanation: 'Settle in and see some nearby highlights.',
          };
        }
        return {
          theme: 'Arrival Day',
          explanation: 'Get oriented and ease into your trip.',
        };
      }

      // Beach + Relaxation
      if (hasAny(['beach']) && hasAny(['relaxation'])) {
        return {
          theme: 'Beach & Chill',
          explanation: 'Coastal relaxation and downtime.',
        };
      }

      // Culture + History
      if (hasAny(['culture']) && hasAny(['history'])) {
        return {
          theme: 'Culture & History',
          explanation: 'Explore heritage sites and local traditions.',
        };
      }

      // Nature + Adventure
      if (hasAny(['nature']) && hasAny(['adventure'])) {
        return {
          theme: 'Nature & Adventure',
          explanation: 'Outdoor activities in beautiful settings.',
        };
      }

      // Culture + Nature
      if (hasAny(['culture']) && hasAny(['nature'])) {
        return {
          theme: 'Culture & Nature',
          explanation: 'Balance cultural sites with natural beauty.',
        };
      }

      // Sightseeing + anything
      if (hasAny(['sightseeing'])) {
        if (hasAny(['beach'])) {
          return {
            theme: 'Sights & Beach',
            explanation: 'Mix of landmarks and coastal relaxation.',
          };
        }
        if (hasAny(['nature'])) {
          return {
            theme: 'Sights & Nature',
            explanation: 'Combine must-see spots with natural beauty.',
          };
        }
      }

      // Mixed variety
      if (unique.length >= 3) {
          return {
            theme: 'Mixed Day',
            explanation: `Variety of ${unique.length} different experiences today.`,
          };
     }

     // Default for 2 categories
     return {
        theme: 'Discovery Day',
        explanation: `Mix of ${unique.join(' and ')} activities.`,
    };
  }

  /**
  * Generates clear day placement explanation
  */
  private generateDayPlacementExplanation(
    dayNumber: number,
    activity: EnhancedItineraryItemDto,
    totalDays: number,
    dayActivities: EnhancedItineraryItemDto[],
  ): string {
    // First day
    if (dayNumber === 1) {
      if (activity.category === 'Arrival') {
        return 'First day activity - easy after traveling.';
      }
      return 'Good starter activity for day one.';
    }

    // Last day
    if (dayNumber === totalDays) {
      return 'Final day highlight to end your trip well.';
    }

    // Mid-trip placement
    if (activity.category === 'Beach' || activity.category === 'Relaxation') {
      return 'Placed here to give you a break mid-trip.';
    }

    if (activity.category === 'Adventure' || activity.category === 'Nature') {
      return "Scheduled when you'll have good energy.";
    }

    // USE dayActivities to provide context
    const sameCategoryCount = dayActivities.filter(
      (a) => a.category === activity.category
    ).length;
  
    if (sameCategoryCount > 1) {
      return `Grouped with other ${activity.category.toLowerCase()} activities for better flow.`;
    }

    if (activity.priority >= 0.85) {
       return 'Placed mid-trip as a highlight experience.';
    }

    return 'Works well with your other activities this day.';
  }

  /**
  * Generates clear grouping explanation for day's activities
  */
  private generateGroupingExplanation(
    activities: EnhancedItineraryItemDto[],
  ): string {
    if (activities.length === 0) {
      return 'No activities scheduled.';
    }

    if (activities.length === 1) {
      const activity = activities[0];
      if (activity.priority > 0.7) {
        return 'Single focused activity that matches your preferences well.';
      }
      return 'One main activity for the day.';
    }

    const categories = activities.map((a) => a.category);
    const uniqueCategories = Array.from(new Set(categories));

    if (uniqueCategories.length === 1) {
      return `All ${categories[0].toLowerCase()} activities - keeping the day focused.`;
    }

    if (uniqueCategories.length === 2) {
      return `${uniqueCategories[0]} and ${uniqueCategories[1]} pair well together.`;
    }
      return `${uniqueCategories.length} different types of activities for a well-rounded day.`;
  }

  /* ==================== MAIN ITINERARY GENERATION ==================== */

  private generateItinerary(
    searchResults: SearchResultItem[],
    dayCount: number,
    startDate: string,
    preferences?: string[],
    destination?: string,
  ): { plans: DayPlan[]; usedFallback: boolean } {
    const filteredResults = searchResults.filter((result) => {
      if (!result.score || result.score < this.CONFIDENCE_THRESHOLDS.MINIMUM) {
        return false;
      }
      if (!result.content || result.content.length < 20) {
        return false;
      }
      return true;
    });

    if (filteredResults.length === 0) {
      return {
        plans: this.createFallbackItinerary(dayCount, startDate, destination),
        usedFallback: true,
      };
    }

    const scored = this.scoreResultsByPreferences(
      filteredResults,
      preferences,
      dayCount,
      destination,
    );

    const MAX_PER_DAY =
      dayCount === 1
        ? PLANNER_CONFIG.ACTIVITIES.MAX_PER_DAY_SHORT
        : PLANNER_CONFIG.ACTIVITIES.MAX_PER_DAY_LONG;

    const maxTotalActivities = Math.min(
      dayCount * MAX_PER_DAY,
      PLANNER_CONFIG.ACTIVITIES.MAX_TOTAL,
      scored.length,
    );

    const selectedResults = this.selectDiverseActivities(
      scored,
      maxTotalActivities,
      preferences,
    );

    const dayBuckets = this.allocateAcrossDays(
      selectedResults,
      dayCount,
      MAX_PER_DAY,
    );

    const dayPlans: DayPlan[] = [];
    const baseDate = new Date(startDate);
    const seenText = new Set<string>();

    for (let day = 1; day <= dayCount; day++) {
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + (day - 1));

      const bucket = dayBuckets[day - 1] ?? [];
      const activitiesForDay: EnhancedItineraryItemDto[] = [];

      for (let i = 0; i < bucket.length; i++) {
        const result = bucket[i];
        const scoredResult = scored.find((s) => s.id === result.id);
        const priorityScore = scoredResult?.priorityScore || 0;

        const category = this.determineActivityCategory(
          result.title,
          result.content,
          day,
          i,
          preferences,
          result.id,
        );

        const normalizedText = `${result.title} ${result.content}`
          .toLowerCase()
          .trim();
        const novelty = this.computeNovelty(normalizedText, seenText);
        seenText.add(normalizedText);

        const timeSlot = this.assignTimeSlot(i, bucket.length, day);

        const activityItem: EnhancedItineraryItemDto = {
          order: i + 1,
          dayNumber: day,
          placeName: result.title,
          shortDescription: result.content,
          category,
          timeSlot,
          estimatedDuration: this.estimateDuration(category),
          confidenceScore: result.confidence || 'Low',
          priority: Math.round((priorityScore || 0) * 100) / 100,
          explanation: this.buildRichExplanation(
            result,
            priorityScore,
            category,
            {
              destination,
              dayNumber: day,
              totalDays: dayCount,
              activityIndex: i,
              activitiesInDay: bucket.length,
              preferences,
              novelty,
              isFallback: false,
              timeSlot,
            },
          ),
        };

        activitiesForDay.push(activityItem);

        activityItem.dayPlacementReason = this.generateDayPlacementExplanation(
          day,
          activityItem,
          dayCount,
          activitiesForDay,
        );
      }

      if (activitiesForDay.length === 0) {
        activitiesForDay.push(this.createSingleDayFallback(day, destination));
      }

      if (day === 1 && activitiesForDay.length > 0) {
        activitiesForDay[0].category = 'Arrival';
        activitiesForDay[0].timeSlot = 'Afternoon';
        activitiesForDay[0].estimatedDuration = '2-3 hours';
      }

      const themeData = this.generateDayTheme(activitiesForDay);
      const groupingReason = this.generateGroupingExplanation(activitiesForDay);

      dayPlans.push({
        day,
        date: dayDate.toISOString().split('T')[0],
        theme: themeData.theme,
        themeExplanation: themeData.explanation,
        groupingReason,
        activities: activitiesForDay,
      });
    }

    return { plans: dayPlans, usedFallback: false };
  }

  /* ==================== META / REGION GATE ==================== */

  private extractMeta(content: string): { near: string[]; region?: string } {
    const nearMatch = content.match(/Near:\s*([^\n]+)/i);
    const regionMatch = content.match(/Region:\s*([^\n]+)/i);

    const near = nearMatch
      ? nearMatch[1]
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const region = regionMatch
      ? regionMatch[1].trim().toLowerCase()
      : undefined;

    return { near, region };
  }

  private getDestinationRegion(destination?: string): string | undefined {
    const dest = this.normalizeLower(destination);
    if (!dest) return undefined;

    const map: Record<string, string> = {
      galle: 'south',
      'galle fort': 'south',
      unawatuna: 'south',
      hikkaduwa: 'south',
      mirissa: 'south',
      bentota: 'south',
      kandy: 'kandy',
      sigiriya: 'cultural_triangle',
      dambulla: 'cultural_triangle',
      trincomalee: 'east_coast',
      nilaveli: 'east_coast',
      nuwara: 'hill_country',
      'nuwara eliya': 'hill_country',
      ella: 'hill_country',
      yala: 'safari_south',
      udawalawe: 'safari_south',
    };

    return map[dest];
  }

  private gateByNearOrRegion(
    results: SearchResultItem[],
    destination?: string,
  ): SearchResultItem[] {
    const dest = this.normalizeLower(destination);
    if (!dest || dest.length < 3) return results;

    const destRegion = this.getDestinationRegion(dest);
    const destTokens = dest.split(/\s+/).filter(Boolean);

    const kept = results.filter((r) => {
      const text = `${r.title} ${r.content}`.toLowerCase();
      const { near, region } = this.extractMeta(text);

      // Strongest: explicit Near: match against any destination token
      const nearHit = destTokens.some((t) => near.includes(t));

      // Next: same region
      const regionHit = destRegion && region && region === destRegion;

      // Backup: direct mention (any token)
      const directHit = destTokens.some((t) => text.includes(t));

      return nearHit || regionHit || directHit;
    });

    return kept.length > 0 ? kept : results;
  }

  /* ==================== SUMMARY / MESSAGING ==================== */

  private computePlanConfidence(
    dayByDayPlan: DayPlan[],
  ): 'High' | 'Medium' | 'Low' {
    const all = dayByDayPlan.flatMap((d) => d.activities);
    if (all.length === 0) return 'Low';

    const high = all.filter((a) => a.confidenceScore === 'High').length;
    const medium = all.filter((a) => a.confidenceScore === 'Medium').length;

    if (high >= Math.max(1, Math.ceil(all.length * 0.4))) return 'High';
    if (high + medium >= Math.max(1, Math.ceil(all.length * 0.6)))
      return 'Medium';
    return 'Low';
  }

  private computePreferencesMatched(
    preferences: string[],
    dayByDayPlan: DayPlan[],
  ): string[] {
    if (!preferences.length) return [];

    const allCategories = dayByDayPlan.flatMap((d) =>
      d.activities.map((a) => a.category),
    );

    const categoriesSet = new Set(allCategories.map((c) => c.toLowerCase()));

    // Match logic:
    // - If preference maps to categories in INTEREST_CATEGORY_MAP -> match if plan contains any of those categories
    // - Else, if preference itself looks like a category word -> match directly
    const matched: string[] = [];

    for (const pref of preferences) {
      const key = pref.toLowerCase();
      const mapped = this.INTEREST_CATEGORY_MAP[key];

      if (mapped?.length) {
        const ok = mapped.some((c) => categoriesSet.has(c.toLowerCase()));
        if (ok) matched.push(pref);
        continue;
      }

      // Direct category word match
      const directOk = categoriesSet.has(key);
      if (directOk) matched.push(pref);
    }

    // deterministic de-dup
    const seen = new Set<string>();
    return matched.filter((m) => {
      const k = m.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  /**
  * Generates final user-facing message
  */
  private buildFinalMessage(
    usedFallback: boolean,
    planConfidence: 'High' | 'Medium' | 'Low',
    preferencesMatched: string[],
  ): string {
    if (usedFallback) {
      return 'We created a basic plan, but found limited strong matches. Try adding specific interests (like "beach" or "temples") or nearby town names for better results.';
    }

    if (planConfidence === 'High') {
      if (preferencesMatched.length > 0) {
        return `Great! We found strong matches for ${preferencesMatched.join(', ')}.`;
      }
      return 'Great! We found strong suggestions for your destination.';
    }

    if (planConfidence === 'Medium') {
      if (preferencesMatched.length > 0) {
        return `Good matches found for ${preferencesMatched.join(', ')}. Some activities have lower confidence.`;
      }
      return 'We found some good options, though some have lower confidence.';
    }

    return 'We found limited strong matches. Try adding more specific preferences or nearby locations for better suggestions.';
  }


  /* ==================== TRIP PLAN ENDPOINT ==================== */

  @Post('trip-plan')
  async tripPlanEnhanced(
    @Body() body: TripPlanRequestDto,
  ): Promise<TripPlanResponseDto> {
    try {
      // 1. Strict Input Validation & Preprocessing
      const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
      const preferences = Array.isArray(body.preferences)
        ? body.preferences.filter((p) => typeof p === 'string' && p.length > 0)
        : [];

      const { startDate, endDate, dayCount, isValid: datesAreValid } = this.validateDates(
        body.startDate,
        body.endDate,
      );

      const isValidDestination = this.isValidDestination(destination);

      const validThemes: ItineraryCategory[] = [
        'Arrival',
        'Sightseeing',
        'Culture',
        'Nature',
        'Beach',
        'Relaxation',
      ];

      let dayByDayPlan: DayPlan[] = [];
      let preferencesMatched: string[] = [];

      // Fetch all DB embeddings for fallback scenarios
      const allEmbeddings = await this.aiService.getAllEmbeddings();

      // ----- CASE 1: INVALID DESTINATION OR DATES -----
      if (!isValidDestination || !datesAreValid) {
        const suggestions: EnhancedItineraryItemDto[] = [];
        const matchedPrefsSet = new Set<string>();

        // Match preferences in database for personalized suggestions even without destination
        preferences.forEach((pref) => {
          const prefLower = pref.toLowerCase();
          const matchedItems = allEmbeddings.filter((item) => {
            const text = `${item.title} ${item.content}`.toLowerCase();
            return text.includes(prefLower);
          });

          matchedItems.slice(0, 2).forEach((item) => {
            if (!suggestions.some(s => s.placeName === item.title)) {
              suggestions.push({
                order: suggestions.length + 1,
                dayNumber: 1,
                placeName: item.title,
                shortDescription: item.content,
                category: validThemes.includes(pref as ItineraryCategory)
                  ? (pref as ItineraryCategory)
                  : 'Sightseeing',
                confidenceScore: 'Medium',
                priority: 0.7,
                explanation: {
                  selectionReason: `Matches your preference "${pref}"`,
                  rankingFactors: {
                    relevanceScore: 0.6,
                    confidenceLevel: 'Medium',
                    categoryMatch: true,
                    preferenceMatch: [pref],
                  },
                },
              });
              matchedPrefsSet.add(pref);
            }
          });
        });

        // Fill with general attractions if needed
        if (suggestions.length < 3) {
          allEmbeddings
            .sort((a, b) => String(a.title).localeCompare(String(b.title))) // Stable sort
            .slice(0, 5 - suggestions.length)
            .forEach((item) => {
              if (!suggestions.some(s => s.placeName === item.title)) {
                suggestions.push({
                  order: suggestions.length + 1,
                  dayNumber: 1,
                  placeName: item.title,
                  shortDescription: item.content,
                  category: 'Sightseeing',
                  confidenceScore: 'High',
                  priority: 0.5,
                });
              }
            });
        }

        preferencesMatched = Array.from(matchedPrefsSet);

        return {
          plan: {
            destination: isValidDestination ? destination : 'Travel Discovery',
            dates: { start: startDate, end: endDate },
            totalDays: dayCount,
            dayByDayPlan: [
              {
                day: 1,
                date: startDate,
                theme: 'Travel Suggestions',
                activities: suggestions.slice(0, 4),
              },
            ],
            summary: {
              totalActivities: Math.min(suggestions.length, 4),
              categoriesIncluded: [...new Set(suggestions.map((a) => a.category))],
              preferencesMatched,
            },
          },
          message: !isValidDestination
            ? 'Destination not recognized. Showing top travel recommendations based on your preferences.'
            : 'Invalid dates provided. Showing a suggested itinerary based on default travel dates.',
        };
      }

      // ----- CASE 2: VALID DESTINATION - Normal Workflow -----
      const searchTerms = [
        destination,
        'attractions',
        ...(preferences.length > 0 ? preferences : ['best places']),
      ];
      const query = searchTerms.join(' ');

      const searchResults = await this.executeSearch(query);

      dayByDayPlan = this.generateItinerary(
        searchResults.results,
        dayCount,
        startDate,
        preferences,
        destination,
      );

      // Final metadata calculation
      const allActivities = dayByDayPlan.flatMap((d) => d.activities);
      const allCategoriesInPlan = [...new Set(allActivities.map((a) => a.category))];

      preferencesMatched = preferences.filter((pref) =>
        allActivities.some(
          (a) =>
            a.category.toLowerCase() === pref.toLowerCase() ||
            a.placeName.toLowerCase().includes(pref.toLowerCase()) ||
            a.shortDescription.toLowerCase().includes(pref.toLowerCase()),
        ),
      );

      const message =
        preferencesMatched.length > 0
          ? `Personalized itinerary generated for ${destination} with matches for ${preferencesMatched.length} preferences.`
          : `Itinerary generated for ${destination}. Explore the best attractions this location has to offer.`;

      return {
        plan: {
          destination,
          dates: { start: startDate, end: endDate },
          totalDays: dayCount,
          dayByDayPlan,
          summary: {
            totalActivities: allActivities.length,
            categoriesIncluded: allCategoriesInPlan as ItineraryCategory[],
            preferencesMatched,
          },
        },
        message,
      };
    } catch (error) {
      this.logger.error(`Critical error in tripPlanEnhanced: ${error.message}`, error.stack);

      // ABSOLUTE FALLBACK - Never return 500
      const today = new Date().toISOString().split('T')[0];
      return {
        plan: {
          destination: body.destination || 'Sri Lanka',
          dates: { start: today, end: today },
          totalDays: 1,
          dayByDayPlan: [
            {
              day: 1,
              date: today,
              theme: 'Exploration Day',
              activities: [
                {
                  order: 1,
                  dayNumber: 1,
                  placeName: 'Local Exploration',
                  shortDescription: 'Discover the hidden gems and local culture of the area at your own pace.',
                  category: 'Sightseeing',
                  timeSlot: 'Morning',
                  estimatedDuration: '4 hours',
                  confidenceScore: 'Low',
                  priority: 0.5,
                },
              ],
            },
          ],
          summary: {
            totalActivities: 1,
            categoriesIncluded: ['Sightseeing'],
            preferencesMatched: [],
          },
        },
        message: 'We encountered a temporary issue generating your personalized plan. Showing a general recommendation instead.',
      };
    }
  }
}
