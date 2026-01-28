import {
  Controller,
  Get,
  Post,
  Query,
  Logger,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

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

import { TripStoreService, SavedTrip } from './trips/trip-store.service';

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

  // Saved Trip Context integration
  useSavedContext?: boolean; // default true
  mode?: 'new' | 'refine'; // default 'refine'
  tripId?: string; // optional specific trip refinement
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

      tripId?: string;
      versionNo?: number;
      usedSavedContext?: boolean;
      sourceTripId?: string;
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
    private readonly tripStore: TripStoreService,
  ) {}

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

  // deterministic merge for saved + request prefs
  private mergePreferencesDeterministic(a: string[], b: string[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const p of [...a, ...b]) {
      const t = this.normalizeText(p);
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }

  // saved context toggle
  private shouldUseSavedContext(body: TripPlanRequestDto): boolean {
    // default ON unless explicitly false; mode=new disables
    return body.useSavedContext !== false && body.mode !== 'new';
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

    const thresholdMap = {
      High: this.CONFIDENCE_THRESHOLDS.HIGH,
      Medium: this.CONFIDENCE_THRESHOLDS.MEDIUM,
      Low: this.CONFIDENCE_THRESHOLDS.MINIMUM,
    };
    const threshold = thresholdMap[minConfidence];

    const filtered = results.filter(
      (item) => item.score !== undefined && item.score >= threshold,
    );

    let fallbackMessage: string | undefined;

    if (filtered.length === 0) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_MATCHES;
    } else if (
      minConfidence === 'High' &&
      !filtered.some((r) => r.confidence === 'High')
    ) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_HIGH_CONFIDENCE;
    } else if (minConfidence === 'High') {
      const highConfidenceCount = filtered.filter(
        (r) => r.confidence === 'High',
      ).length;
      if (highConfidenceCount < filtered.length * 0.5) {
        fallbackMessage = this.FALLBACK_MESSAGES.PARTIAL_RESULTS;
      }
    }

    const avgScore =
      filtered.reduce((sum, r) => sum + (r.score || 0), 0) / filtered.length;

    if (
      !fallbackMessage &&
      avgScore < PLANNER_CONFIG.THRESHOLDS.AVG_SCORE_LOW_QUALITY
    ) {
      fallbackMessage = this.FALLBACK_MESSAGES.LOW_QUALITY;
    }

    return { filtered, fallbackMessage };
  }

  private validatePreferences(preferences?: string[]): {
    valid: boolean;
    warning?: string;
  } {
    if (!preferences || preferences.length === 0) {
      return {
        valid: true,
        warning: 'No preferences specified. Showing popular attractions.',
      };
    }

    const conflictPairs = [
      {
        a: 'adventure',
        b: 'relaxation',
        msg: 'Adventure and relaxation preferences may conflict',
      },
      {
        a: 'nature',
        b: 'shopping',
        msg: 'Nature and shopping preferences may conflict',
      },
      {
        a: 'culture',
        b: 'beach',
        msg: 'Culture and beach preferences suggest different trip styles',
      },
    ];

    const lowerPrefs = preferences.map((p) => p.toLowerCase());

    for (const pair of conflictPairs) {
      if (lowerPrefs.includes(pair.a) && lowerPrefs.includes(pair.b)) {
        return {
          valid: true,
          warning: `${pair.msg}. We'll balance both, but consider focusing on one style.`,
        };
      }
    }

    const vagueTerms = ['things', 'stuff', 'places', 'anywhere', 'something'];
    const hasVague = preferences.some((p) =>
      vagueTerms.some((v) => p.toLowerCase().includes(v)),
    );

    if (hasVague) {
      return {
        valid: false,
        warning:
          'Please be more specific. Instead of "things to do", try "hiking", "temples", or "beaches".',
      };
    }

    return { valid: true };
  }

  /* ---------- In-memory cosine search ---------- */

  private async executeSearch(query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();

    const originalQuery = typeof query === 'string' ? query.trim() : '';

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

    let rawResults: (EmbeddingItem & { score: number })[] = [];
    try {
      rawResults = await this.aiService.search(queryVector, 20);
    } catch (error) {
      this.logger.error(`Vector search failed: ${(error as Error).message}`);
      rawResults = [];
    }

    const searchEnd = process.hrtime.bigint();
    const searchTimeMs = Number(searchEnd - searchStart) / 1_000_000;

    const mappedResults = rawResults.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      score: item.score,
      confidence: this.searchService.getConfidence(item.score),
      normalizedText: `${item.title} ${item.content}`.toLowerCase().trim(),
    }));

    const keywordFiltered = mappedResults.filter((item) => {
      const text = item.normalizedText;
      const matchedTokens = queryTokens.filter(
        (token) =>
          text.includes(token) || this.aiService.isPartialMatch(token, text),
      );
      return matchedTokens.length > 0;
    });

    const rowsAfterGate = keywordFiltered.length;

    if (rowsAfterGate === 0 && rawResults.length > 0) {
      return {
        query: cleaned,
        results: [],
        message: 'No strong matches found (keywords missing).',
      };
    } else if (rowsAfterGate === 0) {
      return {
        query: cleaned,
        results: [],
        message: 'No strong matches found.',
      };
    }

    const scored = keywordFiltered
      .filter((item) => item.score >= this.CONFIDENCE_THRESHOLDS.MINIMUM)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
      }));

    const { filtered, fallbackMessage } = this.filterByConfidenceThreshold(
      scored,
      'Medium',
    );

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
        rank: idx + 1,
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
    const validated = this.validateAndPreprocess(q);
    if (typeof validated === 'string') {
      return {
        query: typeof q === 'string' ? q : '',
        results: [],
        message: validated,
      };
    }

    const { cleaned } = validated;

    const parsedLimit = Number(limit);
    const lim =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 20)
        : 10;

    const embedding = this.aiService.generateDummyEmbedding(cleaned, 1536);

    const rawResults =
      await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );

    if (Array.isArray(rawResults)) {
      const confidenceLevel =
        minConfidence === 'High' ||
        minConfidence === 'Medium' ||
        minConfidence === 'Low'
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

    if (ctx.isFallback) {
      return {
        selectionReason:
          "We included this to give you a complete itinerary, though we don't have strong matches for your search.",
        rankingFactors: {
          relevanceScore: 0,
          confidenceLevel: 'Low',
          categoryMatch: false,
          novelty: 'Low',
        },
        whyThisPlace: [
          'Added because we found limited options matching your preferences',
          'Try adding specific interests (like "beach" or "temples") for better suggestions',
        ],
        tips: [
          'Consider refining your destination or adding nearby town names',
        ],
      };
    }

    if (matched.length > 0) {
      whyPlace.push(
        `Matches what you're looking for: ${matched.slice(0, 2).join(', ')}`,
      );
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

    if (priorityScore >= 1.3) {
      whyPlace.push('Highly recommended based on your trip style');
    }

    const destRegion = this.inferRegion(ctx.destination);
    const placeRegion = this.inferRegion(`${result.title} ${result.content}`);
    if (destRegion && placeRegion && destRegion !== placeRegion) {
      whyPlace.push('Note: This is farther from your main destination');
      tips.push(
        'If you prefer staying local, add nearby town names to your preferences',
      );
    }

    if (ctx.dayNumber === 1) {
      if (category === 'Arrival')
        whyDay.push('Perfect for your first day - easy after traveling');
      else whyDay.push('Scheduled for day one to start your trip smoothly');
    } else if (ctx.dayNumber === ctx.totalDays) {
      whyDay.push('Great way to end your trip on a high note');
    } else {
      if (category === 'Beach' || category === 'Relaxation')
        whyDay.push('Placed here to give you a break mid-trip');
      else if (category === 'Adventure' || category === 'Nature')
        whyDay.push("Scheduled when you'll have good energy levels");
      else whyDay.push('Fits well with your other activities this day');
    }

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

    if (category === 'Beach') tips.push('Bring sunscreen and stay hydrated');
    else if (category === 'Nature' || category === 'Adventure')
      tips.push(
        'Wear comfortable sturdy shoes - paths can be uneven and allow extra travel time',
      );
    else if (category === 'Culture' || category === 'History') {
      if (
        titleLower.includes('temple') ||
        titleLower.includes('kovil') ||
        titleLower.includes('church') ||
        titleLower.includes('mosque')
      ) {
        tips.push('Dress modestly - cover shoulders and knees');
      } else {
        tips.push(
          'Allow extra time - these sites are often larger than expected',
        );
      }
    }

    if (
      contentLower.includes('entrance fee') ||
      contentLower.includes('ticket')
    )
      tips.push('Cash may be needed for entrance fees');

    if (
      category === 'Adventure' &&
      (contentLower.includes('rain') || contentLower.includes('weather'))
    ) {
      tips.push('Check weather - some activities close during heavy rain');
    }

    const parts: string[] = [];
    if (matched.length)
      parts.push(
        `it matches your interest in ${matched.slice(0, 2).join(' and ')}`,
      );
    if (score >= 0.72) parts.push("it's a strong fit for your trip");
    else parts.push('it adds variety to your itinerary');

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

  /* ==================== PRIORITY / SCORING ==================== */

  private calculateCategoryAlignment(
    text: string,
    preferences?: string[],
  ): number {
    if (!preferences?.length) return 0;

    let alignmentScore = 0;
    const textLower = text.toLowerCase();
    const matchedPrefs = new Set<string>();

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

  private getTripLengthType(dayCount: number): 'short' | 'medium' | 'long' {
    if (dayCount <= PLANNER_CONFIG.TRIP_LENGTH.SHORT_MAX) return 'short';
    if (dayCount <= PLANNER_CONFIG.TRIP_LENGTH.MEDIUM_MAX) return 'medium';
    return 'long';
  }

  private isValidDestination(destination?: string): boolean {
    const trimmed = this.normalizeLower(destination);
    if (!trimmed || trimmed.length < 3) return false;
    const invalidValues = ['unknown', 'n/a', 'none'];
    return !invalidValues.includes(trimmed);
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

  /* ==================== FALLBACK BUILDERS ==================== */

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
    const lower = `${title} ${content}`.toLowerCase();

    if (preferences?.length) {
      for (const pref of preferences) {
        const pl = pref.toLowerCase();
        if (lower.includes(pl)) {
          const mapped = this.INTEREST_CATEGORY_MAP[pl];
          if (mapped?.length) return mapped[0];
        }
      }
    }

    if (lower.includes('beach') || lower.includes('surf')) return 'Beach';
    if (
      lower.includes('fort') ||
      lower.includes('historical') ||
      lower.includes('ruins') ||
      lower.includes('temple') ||
      lower.includes('kovil') ||
      lower.includes('church')
    )
      return 'History';
    if (lower.includes('museum') || lower.includes('culture')) return 'Culture';
    if (
      lower.includes('park') ||
      lower.includes('wildlife') ||
      lower.includes('forest') ||
      lower.includes('nature')
    )
      return 'Nature';
    if (
      lower.includes('adventure') ||
      lower.includes('hiking') ||
      lower.includes('rafting')
    )
      return 'Adventure';

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

    if (resultId) this.categoryCache.set(resultId, category);
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

  private generateDayTheme(activities: EnhancedItineraryItemDto[]): {
    theme: string;
    explanation: string;
  } {
    if (!activities?.length) {
      return {
        theme: 'Free Day',
        explanation:
          'No specific activities planned - explore at your own pace.',
      };
    }

    const categories = activities
      .map((a) => (a.category || '').trim().toLowerCase())
      .filter(Boolean);

    const unique = Array.from(new Set(categories));

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

      return (
        themes[category] || {
          theme: 'Exploration Day',
          explanation: `Focus on ${category} activities today.`,
        }
      );
    }

    const hasAny = (cats: string[]) => cats.some((c) => unique.includes(c));

    if (hasAny(['arrival'])) {
      if (hasAny(['beach']))
        return {
          theme: 'Arrival & Beach',
          explanation: 'Start with check-in, then relax by the water.',
        };
      if (hasAny(['culture', 'sightseeing']))
        return {
          theme: 'Arrival & Exploration',
          explanation: 'Settle in and see some nearby highlights.',
        };
      return {
        theme: 'Arrival Day',
        explanation: 'Get oriented and ease into your trip.',
      };
    }

    if (hasAny(['beach']) && hasAny(['relaxation']))
      return {
        theme: 'Beach & Chill',
        explanation: 'Coastal relaxation and downtime.',
      };
    if (hasAny(['culture']) && hasAny(['history']))
      return {
        theme: 'Culture & History',
        explanation: 'Explore heritage sites and local traditions.',
      };
    if (hasAny(['nature']) && hasAny(['adventure']))
      return {
        theme: 'Nature & Adventure',
        explanation: 'Outdoor activities in beautiful settings.',
      };
    if (hasAny(['culture']) && hasAny(['nature']))
      return {
        theme: 'Culture & Nature',
        explanation: 'Balance cultural sites with natural beauty.',
      };

    if (hasAny(['sightseeing'])) {
      if (hasAny(['beach']))
        return {
          theme: 'Sights & Beach',
          explanation: 'Mix of landmarks and coastal relaxation.',
        };
      if (hasAny(['nature']))
        return {
          theme: 'Sights & Nature',
          explanation: 'Combine must-see spots with natural beauty.',
        };
    }

    if (unique.length >= 3)
      return {
        theme: 'Mixed Day',
        explanation: `Variety of ${unique.length} different experiences today.`,
      };

    return {
      theme: 'Discovery Day',
      explanation: `Mix of ${unique.join(' and ')} activities.`,
    };
  }

  private generateGroupingExplanation(
    activities: EnhancedItineraryItemDto[],
  ): string {
    if (activities.length === 0) return 'No activities scheduled.';

    if (activities.length === 1) {
      const activity = activities[0];
      if (activity.priority > 0.7)
        return 'Single focused activity that matches your preferences well.';
      return 'One main activity for the day.';
    }

    const categories = activities.map((a) => a.category);
    const uniqueCategories = Array.from(new Set(categories));

    if (uniqueCategories.length === 1)
      return `All ${categories[0].toLowerCase()} activities - keeping the day focused.`;
    if (uniqueCategories.length === 2)
      return `${uniqueCategories[0]} and ${uniqueCategories[1]} pair well together.`;
    return `${uniqueCategories.length} different types of activities for a well-rounded day.`;
  }

  private generateDayPlacementExplanation(
    dayNumber: number,
    activity: EnhancedItineraryItemDto,
    totalDays: number,
    dayActivities: EnhancedItineraryItemDto[],
  ): string {
    if (dayNumber === 1) {
      if (activity.category === 'Arrival')
        return 'First day activity - easy after traveling.';
      return 'Good starter activity for day one.';
    }
    if (dayNumber === totalDays)
      return 'Final day highlight to end your trip well.';

    if (activity.category === 'Beach' || activity.category === 'Relaxation')
      return 'Placed here to give you a break mid-trip.';
    if (activity.category === 'Adventure' || activity.category === 'Nature')
      return "Scheduled when you'll have good energy.";

    const sameCategoryCount = dayActivities.filter(
      (a) => a.category === activity.category,
    ).length;
    if (sameCategoryCount > 1)
      return `Grouped with other ${activity.category.toLowerCase()} activities for better flow.`;

    if (activity.priority >= 0.85)
      return 'Placed mid-trip as a highlight experience.';
    return 'Works well with your other activities this day.';
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
      if (!result.score || result.score < this.CONFIDENCE_THRESHOLDS.MINIMUM)
        return false;
      if (!result.content || result.content.length < 20) return false;
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

      const nearHit = destTokens.some((t) => near.includes(t));
      const regionHit = destRegion && region && region === destRegion;
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

    const matched: string[] = [];

    for (const pref of preferences) {
      const key = pref.toLowerCase();
      const mapped = this.INTEREST_CATEGORY_MAP[key];

      if (mapped?.length) {
        const ok = mapped.some((c) => categoriesSet.has(c.toLowerCase()));
        if (ok) matched.push(pref);
        continue;
      }

      const directOk = categoriesSet.has(key);
      if (directOk) matched.push(pref);
    }

    const seen = new Set<string>();
    return matched.filter((m) => {
      const k = m.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

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

  /* ==================== TRIP PLAN ENDPOINT (Saved Trip Context Integrated) ==================== */

  @Post('trip-plan')
  async tripPlanEnhanced(
    @Req() req: Request,
    @Body() body: TripPlanRequestDto,
  ): Promise<TripPlanResponseDto> {
    // -------------------- 0) Resolve userId (auth or dev header) --------------------
    const authUserId = (req as any)?.user?.id as string | undefined;

    // ✅ Postman/dev support: send header x-user-id: test-user-1
    const headerUserId =
      (req.headers['x-user-id'] as string | undefined) || undefined;

    const userId: string | undefined = authUserId || headerUserId;

    this.logger.log(
      `[trip-plan] userId=${userId ?? 'NONE'} useSavedContext=${body.useSavedContext ?? true} mode=${body.mode ?? 'refine'} tripId=${body.tripId ?? 'NONE'}`,
    );

    // -------------------- 1) Validate preferences first --------------------
    const prefValidation = this.validatePreferences(body.preferences);
    if (!prefValidation.valid) {
      const destination = this.normalizeText(body.destination) || 'Unknown';
      const start =
        this.normalizeText(body.startDate) ||
        new Date().toISOString().split('T')[0];
      const end = this.normalizeText(body.endDate) || start;

      return {
        plan: {
          destination,
          dates: { start, end },
          totalDays: this.clampDayCount(start, end),
          dayByDayPlan: [],
          summary: {
            totalActivities: 0,
            categoriesIncluded: [],
            preferencesMatched: [],
            planConfidence: 'Low' as const,
            usedFallback: false,
            usedSavedContext: false,
          },
        },
        message: prefValidation.warning || 'Invalid preferences provided.',
      };
    }

    const preferenceWarning = prefValidation.warning;

    // -------------------- 2) Load saved trip context (optional) --------------------
    let savedTrip: SavedTrip | null = null;

    if (userId && this.shouldUseSavedContext(body)) {
      try {
        savedTrip = body.tripId
          ? await this.tripStore.getByIdForUser(userId, body.tripId)
          : await this.tripStore.getLatestForUser(userId);

        this.logger.log(
          `[trip-plan] loaded savedTrip=${savedTrip ? savedTrip.id : 'NONE'}`,
        );
      } catch (e) {
        this.logger.error(
          `[trip-plan] failed to load saved trip: ${(e as Error).message}`,
        );
        savedTrip = null;
      }
    }

    const usedSavedContext = Boolean(savedTrip);
    const sourceTripId = savedTrip?.id;

    // -------------------- Destination --------------------
    const destinationRaw =
      this.normalizeText(body.destination) ||
      (savedTrip ? this.normalizeText(savedTrip.destination) : '');

    const destination = destinationRaw || 'Unknown';
    const destinationLower = this.normalizeLower(destinationRaw);

    // -------------------- Dates --------------------
    const startDateStr =
      this.normalizeText(body.startDate) ||
      (savedTrip ? this.normalizeText(savedTrip.startDate) : '') ||
      new Date().toISOString().split('T')[0];

    const endDateStr =
      this.normalizeText(body.endDate) ||
      (savedTrip ? this.normalizeText(savedTrip.endDate) : '') ||
      startDateStr;

    // -------------------- Preferences --------------------
    const preferencesFromBody = this.normalizePreferences(body.preferences);
    const preferencesFromSaved = savedTrip
      ? this.normalizePreferences(savedTrip.preferences)
      : [];

    const preferences = savedTrip
      ? this.mergePreferencesDeterministic(
          preferencesFromSaved,
          preferencesFromBody,
        )
      : preferencesFromBody;

    // -------------------- Days --------------------
    const dayCount = this.clampDayCount(startDateStr, endDateStr);

    // Helper: attach saved meta to response
    const attachSavedMeta = (
      response: TripPlanResponseDto,
      savedMeta?: { tripId: string; versionNo: number } | null,
    ) => {
      response.plan.summary = {
        ...response.plan.summary,
        tripId: savedMeta?.tripId,
        versionNo: savedMeta?.versionNo,
        usedSavedContext,
        sourceTripId,
      };
      return response;
    };

    const isValidDestination = this.isValidDestination(destinationLower);

    // -------------------- INVALID DESTINATION FLOW --------------------
    if (!isValidDestination) {
      const allEmbeddings = await this.aiService.getAllEmbeddings();
      const suggestions: EnhancedItineraryItemDto[] = [];

      for (const pref of preferences) {
        const key = pref.toLowerCase();
        const mappedCategories = this.INTEREST_CATEGORY_MAP[key] || [];

        const matchedItems = allEmbeddings
          .filter((item) =>
            `${item.title} ${item.content}`.toLowerCase().includes(key),
          )
          .sort((a, b) => String(a.id).localeCompare(String(b.id)))
          .slice(0, 2);

        for (const item of matchedItems) {
          const category = mappedCategories[0] || 'Sightseeing';
          const timeSlot: 'Morning' | 'Afternoon' = 'Morning';

          suggestions.push({
            order: suggestions.length + 1,
            dayNumber: 1,
            placeName: item.title,
            shortDescription: item.content,
            category,
            confidenceScore: 'Medium',
            priority: 0.7,
            timeSlot,
            estimatedDuration: this.estimateDuration(category),
            explanation: this.buildRichExplanation(
              {
                rank: suggestions.length + 1,
                id: item.id,
                title: item.title,
                content: item.content,
                score: 0.6,
                confidence: 'Medium',
              },
              0.7,
              category,
              {
                destination: destinationRaw,
                dayNumber: 1,
                totalDays: 1,
                activityIndex: Math.max(0, suggestions.length - 1),
                activitiesInDay: Math.max(1, suggestions.length),
                preferences,
                novelty: 'Medium',
                isFallback: false,
                timeSlot,
              },
            ),
          });
        }
      }

      if (suggestions.length === 0) {
        allEmbeddings
          .slice()
          .sort((a, b) => String(a.id).localeCompare(String(b.id)))
          .slice(0, 3)
          .forEach((item, idx) => {
            const timeSlot: 'Morning' | 'Afternoon' =
              idx === 0 ? 'Morning' : 'Afternoon';

            suggestions.push({
              order: idx + 1,
              dayNumber: 1,
              placeName: item.title,
              shortDescription: item.content,
              category: 'Sightseeing',
              confidenceScore: 'Medium',
              priority: 0.5,
              timeSlot,
              estimatedDuration: this.estimateDuration('Sightseeing'),
              explanation: this.buildRichExplanation(
                {
                  rank: idx + 1,
                  id: item.id,
                  title: item.title,
                  content: item.content,
                  score: 0.6,
                  confidence: 'Medium',
                },
                0.5,
                'Sightseeing',
                {
                  destination: destinationRaw,
                  dayNumber: 1,
                  totalDays: 1,
                  activityIndex: idx,
                  activitiesInDay: 3,
                  preferences,
                  novelty: 'Medium',
                  isFallback: false,
                  timeSlot,
                },
              ),
            });
          });
      }

      const dayByDayPlan: DayPlan[] = [
        {
          day: 1,
          date: startDateStr,
          theme: 'Suggested Places',
          themeExplanation:
            'Destination was not recognized. Suggestions are based on preferences and general popularity.',
          groupingReason:
            'Preference-first suggestions (destination missing or invalid).',
          activities: suggestions,
        },
      ];

      const planConfidence = this.computePlanConfidence(dayByDayPlan);
      const preferencesMatched = this.computePreferencesMatched(
        preferences,
        dayByDayPlan,
      );

      const response: TripPlanResponseDto = {
        plan: {
          destination,
          dates: { start: startDateStr, end: endDateStr },
          totalDays: dayCount,
          dayByDayPlan,
          summary: {
            totalActivities: suggestions.length,
            categoriesIncluded: [
              ...new Set(suggestions.map((a) => a.category)),
            ],
            preferencesMatched,
            planConfidence,
            usedFallback: false,
            usedSavedContext, // ✅ include it even here
          },
        },
        message: this.buildFinalMessage(
          false,
          planConfidence,
          preferencesMatched,
        ),
      };

      // Save version + attach meta (tripId/versionNo)
      let savedMeta: { tripId: string; versionNo: number } | null = null;

      if (userId) {
        try {
          const saved = await this.tripStore.saveTripVersion({
            userId,
            tripId: savedTrip?.id,
            destination: response.plan.destination,
            startDate: startDateStr,
            endDate: endDateStr,
            preferences,
            planJson: response.plan,
            aiMeta: {
              model: 'gpt-4.1-mini',
              temperature: 0,
              plannerVersion: ALGORITHM_VERSION,
            },
          });

          savedMeta = { tripId: saved.tripId, versionNo: saved.versionNo };
          this.logger.log(
            `[trip-plan] saved invalid-destination version tripId=${saved.tripId} v=${saved.versionNo}`,
          );
        } catch (e) {
          this.logger.error(
            `[trip-plan] saveTripVersion failed (invalid-destination): ${(e as Error).message}`,
          );
        }
      } else {
        this.logger.warn(`[trip-plan] skip save: userId is missing`);
      }

      return attachSavedMeta(response, savedMeta);
    }

    // -------------------- NORMAL FLOW --------------------
    const searchTerms = [
      destinationLower,
      'attractions',
      'places to visit',
      ...preferences.map((p) => p.toLowerCase()),
    ];
    const query = searchTerms.join(' ');

    const searchResults = await this.executeSearch(query);

    const gated = this.gateByNearOrRegion(
      searchResults.results,
      destinationLower,
    );

    const { plans: dayByDayPlan, usedFallback } = this.generateItinerary(
      gated,
      dayCount,
      startDateStr,
      preferences,
      destinationLower,
    );

    const allCategoriesInPlan = dayByDayPlan.flatMap((d) =>
      d.activities.map((a) => a.category),
    );

    const preferencesMatched = this.computePreferencesMatched(
      preferences,
      dayByDayPlan,
    );
    const planConfidence = this.computePlanConfidence(dayByDayPlan);

    const response: TripPlanResponseDto = {
      plan: {
        destination,
        dates: { start: startDateStr, end: endDateStr },
        totalDays: dayCount,
        dayByDayPlan,
        summary: {
          totalActivities: dayByDayPlan.reduce(
            (sum, d) => sum + d.activities.length,
            0,
          ),
          categoriesIncluded: [...new Set(allCategoriesInPlan)],
          preferencesMatched,
          planConfidence,
          usedFallback,
          usedSavedContext, // ✅ include it
        },
      },
      message: [
        this.buildFinalMessage(
          usedFallback,
          planConfidence,
          preferencesMatched,
        ),
        preferenceWarning,
      ]
        .filter(Boolean)
        .join(' '),
    };

    // Save version + attach meta (tripId/versionNo)
    let savedMeta: { tripId: string; versionNo: number } | null = null;

    if (userId) {
      try {
        const saved = await this.tripStore.saveTripVersion({
          userId,
          tripId: savedTrip?.id,
          destination: response.plan.destination,
          startDate: startDateStr,
          endDate: endDateStr,
          preferences,
          planJson: response.plan,
          aiMeta: {
            model: 'gpt-4.1-mini',
            temperature: 0,
            plannerVersion: ALGORITHM_VERSION,
          },
        });

        savedMeta = { tripId: saved.tripId, versionNo: saved.versionNo };
        this.logger.log(
          `[trip-plan] saved normal-flow version tripId=${saved.tripId} v=${saved.versionNo}`,
        );
      } catch (e) {
        this.logger.error(
          `[trip-plan] saveTripVersion failed (normal-flow): ${(e as Error).message}`,
        );
      }
    } else {
      this.logger.warn(`[trip-plan] skip save: userId is missing`);
    }

    return attachSavedMeta(response, savedMeta);
  }
}
