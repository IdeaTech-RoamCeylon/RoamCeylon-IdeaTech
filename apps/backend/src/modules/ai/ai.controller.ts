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
import { SearchService } from './retrieval/search.service';
import { preprocessQuery } from './embeddings/embedding.utils';
import { STOP_WORDS } from '../../constants/stop-words';

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
  | 'Nature'
  | 'Beach'
  | 'Relaxation';

interface ItineraryItemDto {
  order: number;
  placeName: string;
  shortDescription: string;
  category: ItineraryCategory;
  confidenceScore?: 'High' | 'Medium' | 'Low';
  explanation?: {
    selectionReason: string;
    rankingFactors: {
      relevanceScore: number;
      confidenceLevel: string;
      categoryMatch?: boolean;
      preferenceMatch?: string[];
    };
  };
}

// Day-based planning structure
interface DayPlan {
  day: number;
  date: string;
  theme?: string;
  activities: EnhancedItineraryItemDto[];
}

// Enhanced itinerary with additional fields
interface EnhancedItineraryItemDto extends ItineraryItemDto {
  dayNumber: number;
  timeSlot?: 'Morning' | 'Afternoon' | 'Evening';
  estimatedDuration?: string;
  priority: number;
}

// Enhanced response with day-by-day structure
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

// type VectorSearchResult = SearchResultItem[] | { message: string };

/* -------------------- CONTROLLER -------------------- */

@Controller('ai')
@UseGuards(ThrottlerGuard)
export class AIController {
  private readonly logger = new Logger(AIController.name);

  // Confidence threshold constants
  private readonly CONFIDENCE_THRESHOLDS = {
    HIGH: 0.8,
    MEDIUM: 0.5,
    MINIMUM: 0.55,
  };

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

  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) {}

  @Get('health')
  getHealth() {
    return { message: 'AI Planner Module Operational' };
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
    const filtered = results.filter(
      (item) => item.score !== undefined && item.score >= threshold,
    );

    // Default fallback
    let fallbackMessage: string | undefined;

    // Case 1: No results after filtering
    if (filtered.length === 0) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_MATCHES;
    }
    // Case 2: Minimum confidence is High, but no high-confidence matches
    else if (
      minConfidence === 'High' &&
      !filtered.some((r) => r.confidence === 'High')
    ) {
      fallbackMessage = this.FALLBACK_MESSAGES.NO_HIGH_CONFIDENCE;
    }
    // Case 3: Partial high-confidence coverage
    else if (minConfidence === 'High') {
      const highConfidenceCount = filtered.filter(
        (r) => r.confidence === 'High',
      ).length;
      if (highConfidenceCount < filtered.length * 0.5) {
        fallbackMessage = this.FALLBACK_MESSAGES.PARTIAL_RESULTS;
      }
    }
    // Case 4: Average score is low
    const avgScore =
      filtered.reduce((sum, r) => sum + (r.score || 0), 0) / filtered.length;
    if (!fallbackMessage && avgScore < 0.65) {
      fallbackMessage = this.FALLBACK_MESSAGES.LOW_QUALITY;
    }

    return { filtered, fallbackMessage };
  }

  /* ---------- In-memory cosine search ---------- */
  private async executeSearch(query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();

    const originalQuery = typeof query === 'string' ? query.trim() : '';

    // ---------- TYPE SAFETY ----------
    const validated = this.validateAndPreprocess(query);
    if (typeof validated === 'string')
      return {
        query: originalQuery,
        results: [],
        message: validated,
      };

    const { cleaned, tokens: queryTokens } = validated;
    const queryComplexity = queryTokens.length * cleaned.length;

    // ---------------- VECTOR GENERATION ----------------
    const embeddingStart = process.hrtime.bigint();
    const queryVector = this.aiService.generateDummyEmbedding(cleaned, 1536);
    const embeddingEnd = process.hrtime.bigint();
    const embeddingTimeMs = Number(embeddingEnd - embeddingStart) / 1_000_000;

    // ---------------- FETCH DATA ----------------
    const items = await this.aiService.getAllEmbeddings();
    const rowsScanned = items.length;

    // ---------------- SEARCH EXECUTION ----------------
    const searchStart = process.hrtime.bigint();

    // -------- KEYWORD + FUZZY GATE --------
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
  Rows Scanned    : ${rowsScanned}
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
    @Query('minConfidence') minConfidence?: string, // optional confidence filter
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

    // ---- Embedding ----
    const embedding = this.aiService.generateDummyEmbedding(cleaned, 1536);

    // ---- Vector DB Search (ONE CALL ONLY) ----
    const rawResults =
      await this.searchService.searchEmbeddingsWithMetadataFromEmbedding(
        embedding,
        lim,
      );

    // Apply confidence filtering to vector results
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

  /**
   * Score search results based on preferences and relevance
   */
  private scoreResultsByPreferences(
    results: SearchResultItem[],
    preferences?: string[],
  ): Array<SearchResultItem & { priorityScore: number }> {
    if (!preferences || preferences.length === 0) {
      return results.map((r) => ({
        ...r,
        priorityScore: r.score || 0.5,
      }));
    }

    return results
      .map((result) => {
        let priorityScore = result.score || 0.5;

        const text = `${result.title} ${result.content}`.toLowerCase();
        let matchCount = 0;

        for (const pref of preferences) {
          const prefLower = pref.toLowerCase();

          // Exact phrase match in title (highest priority)
          if (result.title.toLowerCase().includes(prefLower)) {
            priorityScore += 0.3;
            matchCount++;
          }
          // Match in content
          else if (text.includes(prefLower)) {
            priorityScore += 0.15;
            matchCount++;
          }

          // Bonus for multiple word preferences (more specific)
          if (prefLower.split(' ').length > 1 && text.includes(prefLower)) {
            priorityScore += 0.1;
          }
        }

        // Boost results that match multiple preferences
        if (matchCount > 1) {
          priorityScore += matchCount * 0.1;
        }

        // Confidence level weighting
        if (result.confidence === 'High') {
          priorityScore *= 1.2;
        } else if (result.confidence === 'Medium') {
          priorityScore *= 1.0;
        } else if (result.confidence === 'Low') {
          priorityScore *= 0.8;
        }

        // Cap the score
        priorityScore = Math.min(priorityScore, 2.0);

        return { ...result, priorityScore };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore); // Sort by priority
  }
  /* ---------- Trip Planner ---------- */

  // Generate explanation metadata for itinerary items
  private generateExplanation(
    result: SearchResultItem,
    priorityScore: number,
    category: ItineraryCategory,
    preferences?: string[],
  ): {
    selectionReason: string;
    rankingFactors: {
      relevanceScore: number;
      confidenceLevel: string;
      categoryMatch?: boolean;
      preferenceMatch?: string[];
    };
  } {
    const matchedPreferences: string[] = [];
    let titleMatches = 0;
    let contentMatches = 0;

    // Check preference matches with detail
    if (preferences && preferences.length > 0) {
      const titleLower = result.title.toLowerCase();
      const contentLower = result.content.toLowerCase();

      for (const pref of preferences) {
        const prefLower = pref.toLowerCase();

        if (titleLower.includes(prefLower)) {
          matchedPreferences.push(pref);
          titleMatches++;
        } else if (contentLower.includes(prefLower)) {
          matchedPreferences.push(pref);
          contentMatches++;
        }
      }
    }

    // Build accurate selection reason
    const reasons: string[] = [];

    // Preference matching (most important)
    if (titleMatches > 0) {
      reasons.push(
        `strong match with preferences in title: ${matchedPreferences.slice(0, titleMatches).join(', ')}`,
      );
    } else if (contentMatches > 0) {
      reasons.push(`matches preferences: ${matchedPreferences.join(', ')}`);
    }

    // Relevance score (second most important)
    if (result.score && result.score >= 0.8) {
      reasons.push(
        `high relevance score (${(result.score * 100).toFixed(0)}%)`,
      );
    } else if (result.score && result.score >= 0.6) {
      reasons.push(
        `good relevance score (${(result.score * 100).toFixed(0)}%)`,
      );
    }

    // Confidence level
    if (result.confidence === 'High') {
      reasons.push(`high confidence match`);
    } else if (result.confidence === 'Medium') {
      reasons.push(`medium confidence`);
    }

    // Priority boost
    if (priorityScore > 1.5) {
      reasons.push(`highly prioritized by multiple factors`);
    } else if (priorityScore > 1.0) {
      reasons.push(`boosted priority`);
    }

    // Category fit
    if (reasons.length === 0) {
      reasons.push(`fits ${category.toLowerCase()} category`);
    }

    const selectionReason =
      reasons.length > 0
        ? `Selected: ${reasons.join('; ')}`
        : `Selected based on category fit (${category})`;

    return {
      selectionReason,
      rankingFactors: {
        relevanceScore: result.score || 0,
        confidenceLevel: result.confidence || 'Low',
        categoryMatch: true,
        preferenceMatch:
          matchedPreferences.length > 0 ? matchedPreferences : undefined,
      },
    };
  }

  // Prevents meaningless AI searches, Enables intelligent fallback logic
  private isValidDestination(destination?: string): boolean {
    if (!destination) return false;

    const trimmed = destination.trim().toLowerCase();

    if (trimmed.length < 3) return false;

    const invalidValues = ['unknown', 'n/a', 'none'];
    return !invalidValues.includes(trimmed);
  }

  //Create fallback itinerary when confidence is too low
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

      const fallbackActivity: EnhancedItineraryItemDto = {
        order: day,
        dayNumber: day,
        placeName: destination || 'Destination',
        shortDescription:
          day === 1
            ? 'Arrival and check-in at accommodation. Explore nearby area.'
            : `Explore ${destination || 'the destination'} at your own pace. Visit local attractions and landmarks.`,
        category: day === 1 ? 'Arrival' : 'Sightseeing',
        timeSlot: day === 1 ? 'Afternoon' : 'Morning',
        estimatedDuration: '3-4 hours',
        confidenceScore: 'Low',
        priority: 0.3,
        explanation: {
          selectionReason:
            'Fallback activity - insufficient high-confidence recommendations available',
          rankingFactors: {
            relevanceScore: 0,
            confidenceLevel: 'Low',
            categoryMatch: false,
          },
        },
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

  // Main enhanced itinerary generation (MULTI-DAY SAFE)
  private generateItinerary(
    searchResults: SearchResultItem[],
    dayCount: number,
    startDate: string,
    preferences?: string[],
    destination?: string,
  ): DayPlan[] {
    // Strict filtering
    const filteredResults = searchResults.filter((result) => {
      if (!result.score || result.score < this.CONFIDENCE_THRESHOLDS.MINIMUM) {
        this.logger.warn(
          `Filtered out low score result: "${result.title}" (score: ${result.score})`,
        );
        return false;
      }

      if (!result.content || result.content.length < 20) {
        this.logger.warn(
          `Filtered out short content: "${result.title}" (length: ${result.content?.length ?? 0})`,
        );
        return false;
      }

      return true;
    });

    // If nothing usable → full fallback plan
    if (filteredResults.length === 0) {
      this.logger.error('No results passed confidence threshold filters');
      return this.createFallbackItinerary(dayCount, startDate, destination);
    }

    // Score + diversify
    const scored = this.scoreResultsByPreferences(filteredResults, preferences);

    // total max activities for the full trip
    const MAX_PER_DAY = dayCount === 1 ? 3 : 4;
    const maxTotalActivities = Math.min(
      dayCount * MAX_PER_DAY,
      15,
      scored.length,
    );

    const selectedResults = this.selectDiverseActivities(
      scored,
      maxTotalActivities,
      preferences,
    );

    // Build day buckets (balanced distribution)
    const dayBuckets = this.allocateAcrossDays(
      selectedResults,
      dayCount,
      MAX_PER_DAY,
    );

    // Build day plans + pad empty days with fallback activity
    const dayPlans: DayPlan[] = [];
    const baseDate = new Date(startDate);

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

        activitiesForDay.push({
          order: i + 1, // per-day ordering
          dayNumber: day,
          placeName: result.title,
          shortDescription: result.content,
          category,
          timeSlot: this.assignTimeSlot(i, bucket.length, day),
          estimatedDuration: this.estimateDuration(category),
          confidenceScore: result.confidence || 'Low',
          priority: Math.round((priorityScore || 0) * 100) / 100,
          explanation: this.generateExplanation(
            result,
            priorityScore,
            category,
            preferences,
          ),
        });
      }

      // Guarantee at least 1 activity per day
      if (activitiesForDay.length === 0) {
        activitiesForDay.push(this.createSingleDayFallback(day, destination));
      }

      // Guarantee day 1 has Arrival as first item
      if (day === 1 && activitiesForDay.length > 0) {
        activitiesForDay[0].category = 'Arrival';
        activitiesForDay[0].timeSlot = 'Afternoon';
        activitiesForDay[0].estimatedDuration = '2-3 hours';
      }

      dayPlans.push({
        day,
        date: dayDate.toISOString().split('T')[0],
        theme: this.generateDayTheme(activitiesForDay),
        activities: activitiesForDay,
      });
    }

    return dayPlans;
  }

  // Balanced distribution across days (keeps daily cap)
  private allocateAcrossDays(
    activities: SearchResultItem[],
    dayCount: number,
    maxPerDay: number,
  ): SearchResultItem[][] {
    const buckets: SearchResultItem[][] = Array.from(
      { length: dayCount },
      () => [],
    );

    // Round-robin distribution for balance
    let dayIndex = 0;
    for (const item of activities) {
      // find next day that still has space
      let tries = 0;
      while (tries < dayCount && buckets[dayIndex].length >= maxPerDay) {
        dayIndex = (dayIndex + 1) % dayCount;
        tries++;
      }

      // if all full, stop
      if (tries >= dayCount && buckets[dayIndex].length >= maxPerDay) break;

      buckets[dayIndex].push(item);
      dayIndex = (dayIndex + 1) % dayCount;
    }

    return buckets;
  }

  // Single fallback activity (used to pad empty days)
  private createSingleDayFallback(
    day: number,
    destination?: string,
  ): EnhancedItineraryItemDto {
    const isDay1 = day === 1;

    return {
      order: 1,
      dayNumber: day,
      placeName: destination || 'Destination',
      shortDescription: isDay1
        ? 'Arrival and check-in at accommodation. Explore nearby area.'
        : `Explore ${destination || 'the destination'} at your own pace. Visit local landmarks and attractions.`,
      category: isDay1 ? 'Arrival' : 'Sightseeing',
      timeSlot: isDay1 ? 'Afternoon' : 'Morning',
      estimatedDuration: '3-4 hours',
      confidenceScore: 'Low',
      priority: 0.3,
      explanation: {
        selectionReason:
          'Fallback activity - insufficient high-confidence recommendations available',
        rankingFactors: {
          relevanceScore: 0,
          confidenceLevel: 'Low',
          categoryMatch: false,
        },
      },
    };
  }

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

  // Enhanced category determination with better logic
  private determineActivityCategory(
    title: string,
    content: string,
    dayNumber: number,
    activityIndex: number,
    preferences?: string[],
  ): ItineraryCategory {
    // Day 1 afternoon should always be Arrival
    if (dayNumber === 1 && activityIndex === 0) return 'Arrival';

    // Start with base inference
    let category = this.inferCategoryFromText(title, content, preferences);

    // Optional: apply day rotation fallback if no strong match
    const rotationPattern: ItineraryCategory[] = [
      'Sightseeing',
      'Nature',
      'Culture',
      'Beach',
      'Relaxation',
    ];

    if (!category || category === 'Sightseeing') {
      category =
        rotationPattern[(dayNumber + activityIndex) % rotationPattern.length];
    }

    return category;
  }

  // Ensure diversity in activity categories
  private selectDiverseActivities(
    scoredResults: Array<
      SearchResultItem & { priorityScore: number; normalizedText?: string }
    >,
    maxCount: number,
    preferences?: string[],
  ): SearchResultItem[] {
    const selected: SearchResultItem[] = [];
    const categoryCount: Record<string, number> = {};
    const textSet = new Set<string>();
    const maxPerCategory = Math.ceil(maxCount / 4);

    const sorted = [...scoredResults].sort(
      (a, b) => b.priorityScore - a.priorityScore,
    );

    for (const result of sorted) {
      if (selected.length >= maxCount) break;

      const textKey =
        result.normalizedText ||
        `${result.title} ${result.content}`.toLowerCase();
      if (textSet.has(textKey)) continue;

      // Determine category using the new helper
      const category = this.inferCategoryFromText(
        result.title,
        result.content,
        preferences,
      );

      // Respect category limit for diversity
      const currentCount = categoryCount[category] || 0;
      if (currentCount < maxPerCategory) {
        selected.push(result);
        categoryCount[category] = currentCount + 1;
        textSet.add(textKey);
      }
    }

    // Fill remaining if not enough
    for (const result of sorted) {
      if (selected.length >= maxCount) break;
      const textKey =
        result.normalizedText ||
        `${result.title} ${result.content}`.toLowerCase();
      if (!textSet.has(textKey)) {
        selected.push(result);
        textSet.add(textKey);
      }
    }

    return selected;
  }

  // Assign time slots to activities for better day structure
  private assignTimeSlot(
    activityIndex: number,
    totalActivitiesInDay: number,
    dayNumber?: number,
  ): 'Morning' | 'Afternoon' | 'Evening' {
    // DAY 1 RULE
    if (dayNumber === 1) {
      // Arrival handled separately
      if (activityIndex === 0) return 'Afternoon';
      return 'Evening';
    }

    // OTHER DAYS LOGIC
    if (totalActivitiesInDay === 1) return 'Morning';

    if (totalActivitiesInDay === 2) {
      return activityIndex === 0 ? 'Morning' : 'Afternoon';
    }

    const ratio = activityIndex / (totalActivitiesInDay - 1);
    if (ratio < 0.4) return 'Morning';
    if (ratio < 0.7) return 'Afternoon';
    return 'Evening';
  }

  // Estimate activity duration based on category
  private estimateDuration(category: ItineraryCategory): string {
    const durations: Record<ItineraryCategory, string> = {
      Arrival: '2-3 hours',
      Sightseeing: '2-4 hours',
      Culture: '2-3 hours',
      Nature: '3-5 hours',
      Beach: '2-4 hours',
      Relaxation: '2-3 hours',
    };
    return durations[category];
  }

  // Generate day themes based on activities
  private generateDayTheme(activities: EnhancedItineraryItemDto[]): string {
    if (!activities?.length) return 'Exploration Day';

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

    // Rules (ordered by priority)
    // Put more "specific" combos near the top.
    const THEME_RULES: Array<{
      all?: string[]; // must include all
      any?: string[]; // must include at least one
      title: string;
    }> = [
      // Arrival-aware themes
      { all: ['arrival', 'sightseeing'], title: 'Arrival & City Highlights' },
      { all: ['arrival', 'culture'], title: 'Arrival & Cultural Start' },
      { all: ['arrival', 'beach'], title: 'Arrival & Coastal Unwind' },
      { all: ['arrival', 'nature'], title: 'Arrival & Nature Intro' },
      { any: ['arrival'], title: 'Arrival & Orientation' },

      // Strong combos
      { all: ['beach', 'relaxation'], title: 'Beach & Relaxation' },
      { all: ['culture', 'sightseeing'], title: 'Cultural Exploration' },
      { all: ['nature', 'sightseeing'], title: 'Nature & Highlights' },
      { all: ['culture', 'nature'], title: 'Culture & Nature' },
      { all: ['beach', 'culture'], title: 'Coast & Culture' },
      { all: ['beach', 'sightseeing'], title: 'Coastal Highlights' },
      { all: ['nature', 'beach'], title: 'Nature & Coast' },
      { all: ['relaxation', 'culture'], title: 'Relaxation & Culture' },
    ];

    // 1) If single-category day → "{Category} Day"
    if (unique.length === 1) {
      const only = unique[0];
      return `${only[0].toUpperCase() + only.slice(1)} Day`;
    }

    // 2) Apply first matching rule
    for (const rule of THEME_RULES) {
      const okAll = rule.all ? hasAll(rule.all) : true;
      const okAny = rule.any ? hasAny(rule.any) : true;
      if (okAll && okAny) return rule.title;
    }

    // 3) Weighted fallback based on dominant category
    const DOMINANT_FALLBACK: Record<string, string> = {
      beach: 'Beach Escape',
      nature: 'Nature Day',
      culture: 'Cultural Day',
      relaxation: 'Relax & Recharge',
      sightseeing: 'Highlights Day',
      arrival: 'Arrival Day',
    };

    return DOMINANT_FALLBACK[topCategory] || 'Discovery Day';
  }

  @Post('trip-plan')
  async tripPlanEnhanced(
    @Body() body: TripPlanRequestDto,
  ): Promise<TripPlanResponseDto> {
    const isValidDestination = this.isValidDestination(body.destination);

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

    // Fetch all DB embeddings once
    const allEmbeddings = await this.aiService.getAllEmbeddings();

    // FALLBACK for invalid destination
    if (!isValidDestination) {
      const suggestions: EnhancedItineraryItemDto[] = [];

      // Match preferences in database
      (body.preferences ?? []).forEach((pref) => {
        const matchedItems = allEmbeddings.filter((item) => {
          const text = `${item.title} ${item.content}`.toLowerCase();
          return text.includes(pref.toLowerCase());
        });

        matchedItems.slice(0, 2).forEach((item) => {
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
              selectionReason: `Matches your preference "${pref}" in title/content.`,
              rankingFactors: {
                relevanceScore: 0.6,
                confidenceLevel: 'Medium',
                categoryMatch: true,
                preferenceMatch: [pref],
              },
            },
          });
        });
      });

      // If no matches found, use top 3 general attractions
      if (suggestions.length === 0) {
        allEmbeddings.slice(0, 3).forEach((item, idx) => {
          suggestions.push({
            order: idx + 1,
            dayNumber: 1,
            placeName: item.title,
            shortDescription: item.content,
            category: 'Sightseeing',
            confidenceScore: 'High',
            priority: 0.5,
          });
        });
      }

      // Calculate preferencesMatched based on actual returned activities
      preferencesMatched = (body.preferences ?? []).filter((pref) =>
        suggestions.some(
          (item) => item.category.toLowerCase() === pref.toLowerCase(),
        ),
      );

      dayByDayPlan = [
        {
          day: 1,
          date: new Date().toISOString().split('T')[0],
          theme: 'Suggested Places',
          activities: suggestions,
        },
      ];

      return {
        plan: {
          destination: body.destination || 'Unknown',
          dates: { start: '', end: '' },
          totalDays: 0,
          dayByDayPlan,
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
            : 'No high-confidence preference matches found. Showing best available recommendations.',
      };
    }

    // VALID DESTINATION: normal itinerary
    const searchTerms = [
      body.destination,
      'attractions',
      'places to visit',
      ...(body.preferences ?? []),
    ];
    const query = searchTerms.join(' ');

    const searchResults = await this.executeSearch(query);

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const dayCount = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    );

    dayByDayPlan = this.generateItinerary(
      searchResults.results,
      dayCount,
      body.startDate,
      body.preferences,
      body.destination,
    );

    // Calculate preferencesMatched based on actual returned activities
    const allCategoriesInPlan = dayByDayPlan.flatMap((d) =>
      d.activities.map((a) => a.category),
    );

    preferencesMatched = (body.preferences ?? []).filter((pref) =>
      allCategoriesInPlan.some(
        (cat) => cat.toLowerCase() === pref.toLowerCase(),
      ),
    );

    const message =
      preferencesMatched.length > 0
        ? 'High-confidence suggestions found for your preferred categories.'
        : 'No high-confidence preference matches found. Showing best available recommendations.';

    return {
      plan: {
        destination: body.destination,
        dates: { start: body.startDate, end: body.endDate },
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
      message,
    };
  }
}
