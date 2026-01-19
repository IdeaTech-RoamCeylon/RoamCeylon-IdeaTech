import {
  Controller,
  Get,
  Post,
  Query,
  Logger,
  Body,
  UseGuards,
} from '@nestjs/common';
// import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AIService } from './ai.service';
import { SearchService } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';
import { EmbeddingItem } from './embeddings/embedding.service';
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
    };
  };
  message: string;
}

/* -------------------- CONTROLLER -------------------- */

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('ai')
// @UseGuards(ThrottlerGuard, JwtAuthGuard)
@UseGuards(JwtAuthGuard)
// @Throttle({ default: { limit: 5, ttl: 60000 } })
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
    };

  private readonly LOCATION_REGION_HINTS: Record<string, string[]> = {
    galle: [
      'galle',
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

  /* ---------- In-memory cosine search ---------- */
  private async executeSearch(query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();

    const originalQuery = typeof query === 'string' ? query.trim() : '';

    const validated = this.validateAndPreprocess(query);
    if (typeof validated === 'string')
      return {
        query: originalQuery,
        results: [],
        message: validated,
      };

    const { cleaned, tokens: queryTokens } = validated;
    const queryComplexity = queryTokens.length * cleaned.length;

    const embeddingStart = process.hrtime.bigint();
    const queryVector = this.aiService.generateDummyEmbedding(cleaned, 1536);
    const embeddingEnd = process.hrtime.bigint();
    const embeddingTimeMs = Number(embeddingEnd - embeddingStart) / 1_000_000;

    const searchStart = process.hrtime.bigint();

    // OPTIMIZATION: Use DB-level vector search instead of loading all embeddings
    let rawResults: (EmbeddingItem & { score: number })[] = [];
    try {
      rawResults = await this.aiService.search(queryVector, 20);
    } catch (error) {
      this.logger.error(`Vector search failed: ${(error as Error).message}`);
      // FALLBACK: Return empty or static popular items? 
      // For now, return empty array to avoid 500 error, clearer message to user
      rawResults = [];
    }

    const searchEnd = process.hrtime.bigint();
    const searchTimeMs = Number(searchEnd - searchStart) / 1_000_000;

    const mappedResults = rawResults.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      score: item.score,
      confidence: this.searchService.getConfidence(item.score),
      normalizedText: `${item.title} ${item.content}`.toLowerCase().trim(),
    }));

    // Filter by keyword match (Gate) to ensure relevance beyond just vector proximity
    // This maintains the "Keyword Gate" logic from the original implementation but on a much smaller subset
    const keywordFiltered = mappedResults.filter((item) => {
      const text = item.normalizedText;
      const matchedTokens = queryTokens.filter(
        (token) =>
          text.includes(token) || this.aiService.isPartialMatch(token, text),
      );
      return matchedTokens.length > 0;
    });

    // If vector search gives good results but keyword gate is too strict, we might want to relax it
    // For now, let's keep it to ensure quality. If 0, fallback to vector results with lower confidence?
    // Let's stick to the original logic: if gate fails, return "No strong matches".

    // Actually, if vector score is high enough (>0.85), we should trust it even if keyword fails (semantic match)
    // But adhering to original strictness for now.

    const rowsAfterGate = keywordFiltered.length;

    if (rowsAfterGate === 0 && rawResults.length > 0) {
      // Optional: Fallback to purely semantic results if they are very strong?
      // For this refactor, we'll return empty to be safe, or maybe just return the top vector result if score is very high.
      // Let's return empty to match original behavior.
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
    if (typeof validated === 'string')
      return {
        query: typeof q === 'string' ? q : '',
        results: [],
        message: validated,
      };

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
    } else {
      return { query: cleaned, results: [], message: rawResults.message };
    }
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

  /* ==================== EXPLANATION HELPERS (FIXED) ==================== */

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

  private buildRichExplanation(
    result: SearchResultItem,
    priorityScore: number,
    category: ItineraryCategory,
    ctx: ExplanationContext,
  ): RichExplanation {
    const score = result.score ?? 0;
    const confidence = (result.confidence ?? 'Low') as ConfidenceLevel;

    const { matched, titleMatches, contentMatches } =
      this.extractMatchedPreferences(result, ctx.preferences);

    const whyPlace: string[] = [];
    const whyDay: string[] = [];
    const whyTime: string[] = [];
    const tips: string[] = [];

    if (ctx.isFallback) {
      return {
        selectionReason:
          'Fallback recommendation: not enough high-confidence matches for this day. Added to preserve a usable itinerary structure.',
        rankingFactors: {
          relevanceScore: 0,
          confidenceLevel: 'Low',
          categoryMatch: false,
          novelty: 'Low',
        },
        whyThisPlace: [
          'Planner fallback (limited strong matches)',
          'Keeps itinerary structure intact',
        ],
        tips: [
          'Tip: add 1–2 preferences (e.g., "beach", "history") or nearby town names for stronger matches.',
        ],
      };
    }

    // WHY THIS PLACE (preferences)
    if (matched.length) {
      if (titleMatches > 0) {
        whyPlace.push(
          `Matches your interests in the title: ${matched
            .slice(0, titleMatches)
            .join(', ')}`,
        );
      } else if (contentMatches > 0) {
        whyPlace.push(
          `Matches your interests in the description: ${matched.join(', ')}`,
        );
      }
    }

    // less repetitive + more varied
    const pct = Math.round(score * 100);
    whyPlace.push(`${this.scoreLabel(score)} (${pct}%)`);

    if (confidence === 'High' && pct >= 90) {
      whyPlace.push('Very strong semantic match to your query');
    } else if (confidence === 'High') {
      whyPlace.push('Strong match with high confidence');
    } else if (confidence === 'Medium') {
      whyPlace.push('Decent match; included to broaden options');
    } else {
      whyPlace.push('Lower-confidence option; included mainly for variety');
    }

    // Update these thresholds to match your new scoring
    if (priorityScore >= 1.3) {
      whyPlace.push('Boosted because it aligns strongly with your trip style');
    } else if (priorityScore >= 0.9) {
      whyPlace.push('Boosted by relevance + category fit');
    }

    if (ctx.novelty) {
      whyPlace.push(
        `Novelty: ${ctx.novelty === 'High'
          ? 'Unique pick'
          : ctx.novelty === 'Medium'
            ? 'Variety pick'
            : 'Similar to another item'
        }`,
      );
    }

    // feasibility / distance sanity note
    const destRegion = this.inferRegion(ctx.destination);
    const placeRegion = this.inferRegion(`${result.title} ${result.content}`);

    if (destRegion && placeRegion && destRegion !== placeRegion) {
      whyPlace.push(
        'Note: this looks far from your destination — consider swapping with a closer option',
      );
      tips.push(
        'Tip: If you want nearby places only, include nearby towns in preferences (e.g., "Unawatuna", "Hikkaduwa").',
      );
    }

    // WHY THIS DAY
    if (ctx.dayNumber === 1 && category === 'Arrival') {
      whyDay.push('Placed on Day 1 to keep the schedule light after travel');
    } else if (ctx.dayNumber === ctx.totalDays) {
      whyDay.push('Placed on the final day as a strong wrap-up experience');
    } else if (ctx.dayNumber > 1 && ctx.dayNumber < ctx.totalDays) {
      whyDay.push('Placed mid-trip when you’re more settled and flexible');
    }

    if (category === 'Beach' || category === 'Relaxation') {
      whyDay.push('Used to balance energy after more active experiences');
    }
    if (category === 'Adventure' || category === 'Nature') {
      whyDay.push('Better earlier in the day / when energy is higher');
    }
    if (category === 'Culture' || category === 'History') {
      whyDay.push('Scheduled when you have time to explore slowly');
    }

    // WHY THIS TIME SLOT (based on actual slot, not index tricks)
    const slot = ctx.timeSlot;

    if (ctx.dayNumber === 1 && ctx.activityIndex === 0) {
      whyTime.push('Afternoon slot fits arrival + check-in flow');
    } else if (slot === 'Morning') {
      whyTime.push('Morning slot chosen for better pacing and more daylight');
    } else if (slot === 'Afternoon') {
      whyTime.push(
        'Afternoon slot keeps the day balanced after a morning activity',
      );
    } else if (slot === 'Evening') {
      whyTime.push(
        'Evening slot chosen for a relaxed finish and flexible timing',
      );
    }

    // Tips (generic safe)
    if (category === 'Beach')
      tips.push(
        'Bring sun protection and water; plan a short rest after midday',
      );
    if (category === 'Nature' || category === 'Adventure')
      tips.push('Wear comfortable shoes; keep buffer time for travel');
    if (category === 'Culture' || category === 'History')
      tips.push('Keep extra time—these visits often take longer than expected');

    // Selection reason: build a 1-liner that varies
    const parts: string[] = [];
    if (matched.length)
      parts.push(`matches your interests (${matched.slice(0, 2).join(', ')})`);
    parts.push(`${this.scoreLabel(score).toLowerCase()}`);
    parts.push(this.humanizeConfidence(confidence).toLowerCase());
    parts.push(`fits the ${category.toLowerCase()} plan`);

    const selectionReason = `Selected because it ${parts.join(', ')}.`;

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

      // ✅ Direct match
      if (textLower.includes(prefLower)) {
        alignmentScore +=
          PLANNER_CONFIG.SCORING.CATEGORY_ALIGNMENT.DIRECT_MATCH;
        matchedPrefs.add(prefLower);
        continue;
      }

      // ✅ Category match
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

    // ✅ Cap at max
    return Math.min(
      alignmentScore,
      PLANNER_CONFIG.SCORING.CATEGORY_ALIGNMENT.MAX,
    );
  }

  /* ==================== PRIORITY / SCORING ==================== */
  private scoreResultsByPreferences(
    results: SearchResultItem[],
    preferences?: string[],
    dayCount?: number,
    destination?: string,
  ): Array<SearchResultItem & { priorityScore: number }> {
    const tripType = dayCount ? this.getTripLengthType(dayCount) : undefined;
    const dest = (destination ?? '').toLowerCase().trim();

    return results
      .map((result) => {
        const baseScore = result.score || 0.5;
        let priorityScore = baseScore;

        // 1. Confidence weighting
        const confidenceMultiplier =
          PLANNER_CONFIG.SCORING.CONFIDENCE_MULTIPLIERS[
          result.confidence ?? 'Low'
          ];
        priorityScore *= confidenceMultiplier;

        const text = `${result.title} ${result.content}`.toLowerCase();

        // Limit boosts for very low base scores
        const boostMultiplier =
          baseScore < PLANNER_CONFIG.SCORING.MIN_BASE_SCORE
            ? PLANNER_CONFIG.SCORING.LOW_QUALITY_MULTIPLIER
            : 1.0;

        // 2. Proximity boost (scaled by base score quality)
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

        // 3. Preference alignment (scaled)
        const categoryAlignment = this.calculateCategoryAlignment(
          text,
          preferences,
        );
        priorityScore += categoryAlignment * boostMultiplier;

        // 4. Trip length optimization
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

        // ✅ Cap at locked max priority
        priorityScore = Math.min(
          priorityScore,
          PLANNER_CONFIG.SCORING.MAX_PRIORITY,
        );

        return { ...result, priorityScore };
      })
      .sort((a, b) => {
        const scoreDiff = b.priorityScore - a.priorityScore;
        if (Math.abs(scoreDiff) > 0.001) return scoreDiff;

        // Stable tie-breakers
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

  private isValidDestination(destination?: string): boolean {
    if (!destination) return false;
    const trimmed = destination.trim().toLowerCase();
    if (trimmed.length < 3) return false;
    const invalidValues = ['unknown', 'n/a', 'none'];
    return !invalidValues.includes(trimmed);
  }

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
        order: day,
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
        if (lower.includes(pref.toLowerCase())) {
          const mapped = this.INTEREST_CATEGORY_MAP[pref.toLowerCase()];
          if (mapped?.length)
            return mapped.includes('Sightseeing') ? mapped[0] : mapped[0];
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

    // Single consistent threshold
    const maxPerCategory = Math.ceil(
      maxCount / PLANNER_CONFIG.DIVERSITY.CATEGORY_DIVISOR,
    );

    // Sort ONCE with stable sort
    const sorted = [...scoredResults].sort((a, b) => {
      const diff = b.priorityScore - a.priorityScore;
      if (Math.abs(diff) > 0.001) return diff; // Tighter threshold
      return String(a.id).localeCompare(String(b.id));
    });

    // Single-pass selection with clear rules
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

      // Simple, consistent rule
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

  private generateDayTheme(activities: EnhancedItineraryItemDto[]): {
    theme: string;
    explanation: string;
  } {
    if (!activities?.length) {
      return {
        theme: 'Exploration Day',
        explanation: 'No specific activities scheduled for this day.',
      };
    }

    const categories = activities
      .map((a) => (a.category || '').trim().toLowerCase())
      .filter(Boolean);

    const unique = Array.from(new Set(categories));

    const counts = categories.reduce<Record<string, number>>((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    const topCategory =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'sightseeing';

    const hasAll = (req: string[]) => req.every((r) => unique.includes(r));
    const hasAny = (req: string[]) => req.some((r) => unique.includes(r));

    const THEME_RULES: Array<{
      all?: string[];
      any?: string[];
      title: string;
      explanation: string;
    }> = [
        {
          all: ['arrival', 'sightseeing'],
          title: 'Arrival & City Highlights',
          explanation:
            'Arrival activities paired with sightseeing to ease into your trip while covering key landmarks.',
        },
        {
          all: ['arrival', 'culture'],
          title: 'Arrival & Cultural Start',
          explanation:
            'Arrival day combined with cultural experiences to introduce local traditions.',
        },
        {
          all: ['arrival', 'beach'],
          title: 'Arrival & Coastal Unwind',
          explanation:
            'Arrival activities followed by beach time to relax after travel.',
        },
        {
          any: ['arrival'],
          title: 'Arrival & Orientation',
          explanation:
            'First day focused on settling in and getting oriented with your destination.',
        },
        {
          all: ['beach', 'relaxation'],
          title: 'Beach & Relaxation',
          explanation:
            'Beach and relaxation activities are grouped for a smooth, low-stress day.',
        },
        {
          all: ['culture', 'sightseeing'],
          title: 'Cultural Exploration',
          explanation:
            'Cultural and sightseeing activities combined to explore heritage and landmarks.',
        },
        {
          all: ['nature', 'sightseeing'],
          title: 'Nature & Highlights',
          explanation:
            'Nature experiences paired with key highlights to balance scenery with must-see spots.',
        },
        {
          all: ['culture', 'nature'],
          title: 'Culture & Nature',
          explanation:
            'Balanced mix of culture and nature for both traditions and landscapes.',
        },
      ];

    if (unique.length === 1) {
      const only = unique[0];
      const theme = `${only[0].toUpperCase() + only.slice(1)} Day`;
      const explanation = `This day focuses on ${only} activities for a concentrated experience.`;
      return { theme, explanation };
    }

    for (const rule of THEME_RULES) {
      const okAll = rule.all ? hasAll(rule.all) : true;
      const okAny = rule.any ? hasAny(rule.any) : true;
      if (okAll && okAny) {
        return { theme: rule.title, explanation: rule.explanation };
      }
    }

    const DOMINANT_FALLBACK: Record<
      string,
      { theme: string; explanation: string }
    > = {
      beach: {
        theme: 'Beach Escape',
        explanation: 'Beach activities are prioritized for a coastal day.',
      },
      nature: {
        theme: 'Nature Day',
        explanation: 'Nature activities are prioritized to enjoy landscapes.',
      },
      culture: {
        theme: 'Cultural Day',
        explanation: 'Cultural activities are highlighted for local insights.',
      },
      relaxation: {
        theme: 'Relax & Recharge',
        explanation:
          'Relaxation activities are scheduled for rest and recovery.',
      },
      sightseeing: {
        theme: 'Highlights Day',
        explanation:
          'Sightseeing activities grouped to cover key landmarks efficiently.',
      },
      arrival: {
        theme: 'Arrival Day',
        explanation: 'First day is designed to ease into the destination.',
      },
    };

    const fallback = DOMINANT_FALLBACK[topCategory] || {
      theme: 'Discovery Day',
      explanation: `This day combines ${unique.join(', ')} activities to provide variety.`,
    };

    const dominantCount = counts[topCategory] || 0;
    const total = categories.length;
    const varietyNote =
      unique.length >= 3
        ? `Includes variety across ${unique.length} activity types.`
        : `Focused mainly on ${topCategory}.`;
    const dominanceNote = `Dominant category: ${topCategory} (${dominantCount}/${total}).`;

    return {
      theme: fallback.theme,
      explanation:
        `${fallback.explanation} ${dominanceNote} ${varietyNote}`.trim(),
    };
  }

  private generateDayPlacementExplanation(
    dayNumber: number,
    activity: EnhancedItineraryItemDto,
    totalDays: number,
    dayActivities: EnhancedItineraryItemDto[],
  ): string {
    const reasons: string[] = [];

    if (dayNumber === 1 && activity.category === 'Arrival') {
      return 'Arrival day placement: allows time for check-in and settling in before activities.';
    }

    if (dayNumber === totalDays)
      reasons.push('Final-day highlight to end on a strong note');
    else if (dayNumber > 1)
      reasons.push('Placed when you’re more settled into the trip');

    if (activity.category === 'Adventure' || activity.category === 'Nature') {
      reasons.push('Better when energy is higher (earlier / mid-trip)');
    }
    if (activity.category === 'Beach' || activity.category === 'Relaxation') {
      reasons.push('Used to balance pacing and recovery');
    }

    const sameCategoryCount = dayActivities.filter(
      (a) => a.category === activity.category,
    ).length;
    if (sameCategoryCount > 1) {
      reasons.push(
        `Grouped with similar ${activity.category.toLowerCase()} activities for smoother pacing`,
      );
    }

    if (activity.priority >= 0.85)
      reasons.push('High priority match to your preferences');

    return reasons.length
      ? reasons.slice(0, 2).join('; ')
      : 'Placed for balanced pacing and variety.';
  }

  private generateGroupingExplanation(
    activities: EnhancedItineraryItemDto[],
  ): string {
    if (activities.length <= 1) {
      if (activities.length === 1) {
        const activity = activities[0];
        if (activity.priority > 0.7) {
          return `Single high-priority ${activity.category.toLowerCase()} activity selected for focused exploration`;
        } else if (activity.priority < 0.4) {
          return `Fallback activity provided to maintain trip structure`;
        }
        return `Single ${activity.category.toLowerCase()} activity scheduled for this day`;
      }
      return 'No activities scheduled for this day';
    }

    const categories = activities.map((a) => a.category);
    const uniqueCategories = Array.from(new Set(categories));
    const explanations: string[] = [];

    if (uniqueCategories.length === 1) {
      explanations.push(
        `All ${categories[0].toLowerCase()} activities grouped for a focused experience`,
      );
    } else if (uniqueCategories.length === 2) {
      explanations.push(
        `${uniqueCategories.join(' and ')} activities paired for complementary experiences`,
      );
    } else {
      explanations.push(
        `Diverse mix of ${uniqueCategories.length} activity types for a well-rounded day`,
      );
    }

    const timeSlots = activities.map((a) => a.timeSlot).filter(Boolean);
    if (timeSlots.length > 1) {
      explanations.push('scheduled across different time slots for pacing');
    }

    const highPriority = activities.filter((a) => a.priority > 0.7).length;
    if (highPriority > 1) {
      explanations.push(
        `includes ${highPriority} high-priority activities matching your preferences`,
      );
    }

    const totalEstimatedHours = activities.reduce((sum, a) => {
      const duration = a.estimatedDuration || '';
      const hours = parseInt(duration.split('-')[0]) || 2;
      return sum + hours;
    }, 0);

    if (totalEstimatedHours > 8) {
      explanations.push('balanced to avoid over-scheduling');
    }

    return explanations.join('; ');
  }

  /* ==================== MAIN ITINERARY GENERATION ==================== */

  private generateItinerary(
    searchResults: SearchResultItem[],
    dayCount: number,
    startDate: string,
    preferences?: string[],
    destination?: string,
  ): DayPlan[] {
    const filteredResults = searchResults.filter((result) => {
      if (!result.score || result.score < this.CONFIDENCE_THRESHOLDS.MINIMUM) {
        this.logger.warn(
          `Filtered out low score result: "${result.title}" (score: ${result.score})`,
        );
        return false;
      }

      if (!result.content || result.content.length < 20) {
        this.logger.warn(
          `Filtered out short content: "${result.title}" (length: ${result.content?.length ?? 0
          })`,
        );
        return false;
      }

      return true;
    });

    if (filteredResults.length === 0) {
      this.logger.error('No results passed confidence threshold filters');
      return this.createFallbackItinerary(dayCount, startDate, destination);
    }

    const scored = this.scoreResultsByPreferences(
      filteredResults,
      preferences,
      dayCount,
      destination, // pass destination for proximity bias
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
              timeSlot, // ✅ FIX 1: pass actual timeSlot
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

    return dayPlans;
  }

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
    const dest = (destination ?? '').toLowerCase().trim();
    if (!dest) return undefined;

    // map destination -> region key (match what you store in JSON)
    const map: Record<string, string> = {
      galle: 'south',
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

  /**
   * ✅ STRONG GATE:
   * - keep if destination appears in Near:
   * - OR same region as destination
   * - otherwise drop
   */
  private gateByNearOrRegion(
    results: SearchResultItem[],
    destination?: string,
  ): SearchResultItem[] {
    const dest = (destination ?? '').toLowerCase().trim();
    if (!dest || dest.length < 3) return results;

    const destRegion = this.getDestinationRegion(dest);

    const kept = results.filter((r) => {
      const text = `${r.title} ${r.content}`.toLowerCase();

      const { near, region } = this.extractMeta(text);

      const nearHit = near.includes(dest);
      const regionHit = destRegion && region && region === destRegion;

      // also allow direct text mention (as backup)
      const directHit = text.includes(dest);

      return nearHit || regionHit || directHit;
    });

    // if filtering removes everything, fallback to original (avoid empty plan)
    return kept.length > 0 ? kept : results;
  }

  // private buildLocalPool(
  //   all: SearchResultItem[],
  //   destination?: string,
  // ): SearchResultItem[] {
  //   const dest = (destination ?? '').toLowerCase().trim();
  //   if (!dest) return all;

  //   const destRegion = this.getDestinationRegion(dest);

  //   return all.filter((r) => {
  //     const text = `${r.title} ${r.content}`.toLowerCase();
  //     const { near, region } = this.extractMeta(text);

  //     if (near.includes(dest)) return true;
  //     if (destRegion && region === destRegion) return true;
  //     return false;
  //   });
  // }

  /* ==================== TRIP PLAN ENDPOINT ==================== */

  @Post('trip-plan')
  async tripPlanEnhanced(
    @Body() body: TripPlanRequestDto,
  ): Promise<TripPlanResponseDto> {
    const isValidDestination = this.isValidDestination(body.destination);
    let dayByDayPlan: DayPlan[] = [];
    let preferencesMatched: string[] = [];
    const suggestions: EnhancedItineraryItemDto[] = [];

    const startDateStr =
      body.startDate || new Date().toISOString().split('T')[0];
    const endDateStr = body.endDate || startDateStr;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const dayCount = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    );

    const allEmbeddings = await this.aiService.getAllEmbeddings();

    if (!isValidDestination) {
      (body.preferences ?? []).forEach((pref) => {
        const mappedCategories = this.INTEREST_CATEGORY_MAP[pref.toLowerCase()];
        const matchedItems = allEmbeddings.filter((item) =>
          `${item.title} ${item.content}`
            .toLowerCase()
            .includes(pref.toLowerCase()),
        );

        matchedItems.slice(0, 2).forEach((item) => {
          const timeSlot: 'Morning' | 'Afternoon' = 'Morning';

          suggestions.push({
            order: suggestions.length + 1,
            dayNumber: 1,
            placeName: item.title,
            shortDescription: item.content,
            category: mappedCategories?.[0] || 'Sightseeing',
            confidenceScore: 'Medium',
            priority: 0.7,
            timeSlot,
            estimatedDuration: this.estimateDuration(
              mappedCategories?.[0] || 'Sightseeing',
            ),
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
              mappedCategories?.[0] || 'Sightseeing',
              {
                destination: body.destination,
                dayNumber: 1,
                totalDays: 1,
                activityIndex: suggestions.length - 1,
                activitiesInDay: suggestions.length,
                preferences: body.preferences,
                novelty: 'Medium',
                isFallback: false,
                timeSlot, // timeSlot aware
              },
            ),
          });
        });
      });

      if (suggestions.length === 0) {
        allEmbeddings.slice(0, 3).forEach((item, idx) => {
          const timeSlot: 'Morning' | 'Afternoon' =
            idx === 0 ? 'Morning' : 'Afternoon';

          suggestions.push({
            order: idx + 1,
            dayNumber: 1,
            placeName: item.title,
            shortDescription: item.content,
            category: 'Sightseeing',
            confidenceScore: 'High',
            priority: 0.5,
            timeSlot,
            estimatedDuration: this.estimateDuration('Sightseeing'),
            explanation: this.buildRichExplanation(
              {
                rank: idx + 1,
                id: item.id,
                title: item.title,
                content: item.content,
                score: 0.65,
                confidence: 'High',
              },
              0.5,
              'Sightseeing',
              {
                destination: body.destination,
                dayNumber: 1,
                totalDays: 1,
                activityIndex: idx,
                activitiesInDay: 3,
                preferences: body.preferences,
                novelty: 'Medium',
                isFallback: false,
                timeSlot, // timeSlot aware
              },
            ),
          });
        });
      }

      preferencesMatched = (body.preferences ?? []).filter((pref) => {
        const mapped = this.INTEREST_CATEGORY_MAP[pref.toLowerCase()] || [];
        return suggestions.some((item) => mapped.includes(item.category));
      });

      return {
        plan: {
          destination: body.destination || 'Unknown',
          dates: { start: startDateStr, end: endDateStr },
          totalDays: dayCount,
          dayByDayPlan: [
            {
              day: 1,
              date: startDate.toISOString().split('T')[0],
              theme: 'Suggested Places',
              activities: suggestions,
            },
          ],
          summary: {
            totalActivities: suggestions.length,
            categoriesIncluded: [
              ...new Set(suggestions.map((a) => a.category)),
            ],
            preferencesMatched,
          },
        },
        message:
          preferencesMatched.length > 0
            ? 'High-confidence suggestions found for your preferred categories.'
            : 'No strong preference matches found. Showing best available results.',
      };
    }

    const searchTerms = [
      body.destination,
      'attractions',
      'places to visit',
      ...(body.preferences ?? []),
    ];
    const query = searchTerms.join(' ');

    const searchResults = await this.executeSearch(query);

    // HARD filter by Near or Region (prevents Nilaveli/Horton for Galle)
    const gated = this.gateByNearOrRegion(
      searchResults.results,
      body.destination,
    );

    dayByDayPlan = this.generateItinerary(
      gated,
      dayCount,
      startDateStr,
      body.preferences,
      body.destination,
    );

    const allCategoriesInPlan = dayByDayPlan.flatMap((d) =>
      d.activities.map((a) => a.category),
    );

    preferencesMatched = (body.preferences ?? []).filter((pref) => {
      const mapped = this.INTEREST_CATEGORY_MAP[pref.toLowerCase()] || [];
      return allCategoriesInPlan.some((cat) => mapped.includes(cat));
    });

    return {
      plan: {
        destination: body.destination,
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
        },
      },
      message:
        preferencesMatched.length > 0
          ? 'High-confidence suggestions found for your preferred categories.'
          : 'No strong preference matches found. Showing best available results.',
    };
  }
}
