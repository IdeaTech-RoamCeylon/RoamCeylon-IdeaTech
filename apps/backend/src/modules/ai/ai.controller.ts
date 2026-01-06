import { Controller, Get, Post, Query, Logger, Body, UseGuards } from '@nestjs/common';
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

// interface EmbeddedItem {
//   id: number | string;
//   title: string;
//   content: string;
//   embedding: number[];
// }

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
}

// NEW: Day-based planning structure
interface DayPlan {
  day: number;
  date: string;
  theme?: string;
  activities: EnhancedItineraryItemDto[];
}

// NEW: Enhanced itinerary with additional fields
interface EnhancedItineraryItemDto extends ItineraryItemDto {
  dayNumber: number;
  timeSlot?: 'Morning' | 'Afternoon' | 'Evening';
  estimatedDuration?: string;
  priority: number;
}

// NEW: Enhanced response with day-by-day structure
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

  constructor(
    private readonly aiService: AIService,
    private readonly searchService: SearchService,
  ) { }

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

  /* ---------- In-memory cosine search ---------- */
  private async executeSearch(query: unknown): Promise<SearchResponseDto> {
    const totalStart = process.hrtime.bigint();
    
    const originalQuery =
      typeof query === 'string' ? query.trim() : '';
    
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
    // 🔹 Log preprocessed query and filtered tokens
    this.logger.log(`🧹 Preprocessed query: "${cleaned}"`);
       
    const keywordFiltered = items.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();
      
    // Find matched tokens
    const matchedTokens = queryTokens.filter(token =>
      text.includes(token) || this.aiService.isPartialMatch(token, text)
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
        };
      })
      .filter((item) => item.score >= 0.55)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.id).localeCompare(String(b.id)); // Stable sort
      })
      .slice(0, 5);    

    const searchEnd = process.hrtime.bigint();
    const searchTimeMs = Number(searchEnd - searchStart) / 1_000_000;

    const totalEnd = process.hrtime.bigint();
    const totalTimeMs = Number(totalEnd - totalStart) / 1_000_000;


    this.logger.log(`
    [SEARCH METRICS]
    Query            : "${originalQuery}"
    Tokens           : ${queryTokens.length}
    Query Complexity : ${queryComplexity}
    Rows Scanned     : ${rowsScanned}
    Rows After Gate  : ${rowsAfterGate}
    Vector Gen Time  : ${embeddingTimeMs.toFixed(2)} ms
    Search Exec Time : ${searchTimeMs.toFixed(2)} ms
    Total Time       : ${totalTimeMs.toFixed(2)} ms
  `);

    return {
      query: originalQuery,
      results: scored.map((item, idx) => ({
        rank: idx + 1,
        ...item,
      })),
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
    return results.map((result) => {
      let priorityScore = result.score;

      const text = `${result.title} ${result.content}`.toLowerCase();

      // Preference boosts
      if (preferences && preferences.length > 0) {
        preferences.forEach((pref) => {
          const prefLower = pref.toLowerCase();
          if (text.includes(prefLower)) priorityScore += 0.15;

          const prefWords = prefLower.split(' ');
          const matchCount = prefWords.filter((word) => text.includes(word)).length;
          priorityScore += (matchCount / prefWords.length) * 0.08;
        });
      }

      // Confidence boost
      if (result.confidence === 'High') priorityScore += 0.05;

      // Cap max score
      priorityScore = Math.min(priorityScore, 1.2);

      return { ...result, priorityScore, normalizedText: text }; // Add normalizedText for dedup
    });
  }
  
  /* ---------- Trip Planner ---------- */

  /**
  * Main enhanced itinerary generation
  */
  private generateItinerary(
    searchResults: SearchResultItem[],
    dayCount: number,
    startDate: string,
    preferences?: string[],
    destination?: string,
  ): DayPlan[] {
    const scored = this.scoreResultsByPreferences(searchResults, preferences);
    const maxActivities = Math.min(15, scored.length);
    const selectedResults = this.selectDiverseActivities(scored, maxActivities);

    const dayPlans: DayPlan[] = [];
    let activityIndex = 0;

    const categorySequence: ItineraryCategory[] = ['Arrival','Sightseeing','Culture','Nature','Beach','Relaxation'];

    for (let day = 1; day <= dayCount; day++) {
      const activitiesForDay: EnhancedItineraryItemDto[] = [];
      const activitiesThisDay = Math.ceil((maxActivities - activityIndex) / (dayCount - day + 1));

      for (let i = 0; i < activitiesThisDay && activityIndex < selectedResults.length; i++) {
        const result = selectedResults[activityIndex];

        // Prefer logical order using category sequence
        let category = this.determineActivityCategory(result.title, result.content, day, i, preferences);
        const seqIndex = categorySequence.indexOf(category);
        category = categorySequence[seqIndex >=0 ? seqIndex : 0];

        activitiesForDay.push({
          order: activityIndex + 1,
          dayNumber: day,
          placeName: result.title,
          shortDescription: result.content,
          category,
          timeSlot: this.assignTimeSlot(i, activitiesThisDay, day),
          estimatedDuration: this.estimateDuration(category),
          confidenceScore: result.confidence,
          priority: Math.round((scored.find(s => s.id === result.id)?.priorityScore || 0) * 100) / 100,
        });

        activityIndex++;
      }

      // Fallback for empty day 1
      if (activitiesForDay.length === 0 && day === 1) {
        activitiesForDay.push({
          order: 1,
          dayNumber: 1,
          placeName: destination || 'Destination',
          shortDescription: 'Arrival and check-in at accommodation. Explore nearby area.',
          category: 'Arrival',
          timeSlot: 'Afternoon',
          estimatedDuration: '2-3 hours',
          confidenceScore: 'Low',
          priority: 0.5,
        });
      }

      const baseDate = new Date(startDate);
      const dayDate = new Date(baseDate);
      dayDate.setDate(baseDate.getDate() + day - 1);

      dayPlans.push({
        day,
        date: dayDate.toISOString().split('T')[0],
        theme: this.generateDayTheme(activitiesForDay),
        activities: activitiesForDay,
      });
    }
    return dayPlans;
  }

  /**
 * Enhanced category determination with better logic
 */
  private determineActivityCategory(
    title: string,
    content: string,
    dayNumber: number,
    activityIndex: number,
    preferences?: string[],
  ): ItineraryCategory {
    const text = `${title} ${content}`.toLowerCase();

    // Day 1 afternoon should always be arrival
    if (dayNumber === 1 && activityIndex === 0) return 'Arrival';

    // Check preferences with priority
    if (preferences && preferences.length > 0) {
      for (const pref of preferences) {
        const prefLower = pref.toLowerCase();
        if (text.includes(prefLower)) {
          if (prefLower.match(/beach|surf|diving|coast/)) return 'Beach';
          if (prefLower.match(/nature|wildlife|park|safari/)) return 'Nature';
          if (prefLower.match(/culture|temple|religious|heritage|traditional/)) return 'Culture';
          if (prefLower.match(/relax|spa|resort/)) return 'Relaxation';
        }
      }
    }

    // Strong keyword matching with priority order
    if (text.match(/beach|coast|ocean|surf|whale watching/)) return 'Beach';
    if (text.match(/temple|pagoda|shrine|cultural center|museum/)) return 'Culture';
    if (text.match(/national park|wildlife|safari|nature reserve|forest/)) return 'Nature';
    if (text.match(/fortress|fort|rock|ancient|historical site|monument/)) return 'Sightseeing';
    if (text.match(/spa|resort|tea|plantation|scenic|relaxation/)) return 'Relaxation';

    // Default based on day progression
    const rotationPattern: ItineraryCategory[] = [
      'Sightseeing',
      'Nature',
      'Culture',
      'Beach',
      'Relaxation',
    ];
  
    return rotationPattern[(dayNumber + activityIndex) % rotationPattern.length];
  }


  /**
  * Ensure diversity in activity categories
  */
  private selectDiverseActivities(
    scoredResults: Array<SearchResultItem & { priorityScore: number; normalizedText?: string }>,
    maxCount: number,
  ): SearchResultItem[] {
    const selected: SearchResultItem[] = [];
    const categoryCount: Record<string, number> = {};
    const textSet = new Set<string>();
    const maxPerCategory = Math.ceil(maxCount / 4);

    const sorted = [...scoredResults].sort((a, b) => b.priorityScore - a.priorityScore);

    for (const result of sorted) {
      if (selected.length >= maxCount) break;

      // Deduplication based on normalized text
      const textKey = result.normalizedText || `${result.title} ${result.content}`.toLowerCase();
      if (textSet.has(textKey)) continue;

      // Determine category
      let category = 'General';
      if (textKey.match(/beach|coast|ocean/)) category = 'Beach';
      else if (textKey.match(/temple|cultural|heritage|museum/)) category = 'Culture';
      else if (textKey.match(/park|wildlife|nature|mountain/)) category = 'Nature';
      else if (textKey.match(/fortress|historical|ancient/)) category = 'Sightseeing';

      // Respect category limit for diversity
      const currentCount = categoryCount[category] || 0;
      if (currentCount < maxPerCategory) {
        selected.push(result);
        categoryCount[category] = currentCount + 1;
        textSet.add(textKey); // Mark as added
      }
    }

    // Fill remaining if not enough
    for (const result of sorted) {
      if (selected.length >= maxCount) break;
      const textKey = result.normalizedText || `${result.title} ${result.content}`.toLowerCase();
      if (!textSet.has(textKey)) {
        selected.push(result);
        textSet.add(textKey);
      }
    }

    return selected;
  }

  /**
  * Assign time slots to activities for better day structure
 */
  private assignTimeSlot(
    activityIndex: number,
    totalActivitiesInDay: number,
    dayNumber?: number,
  ): 'Morning' | 'Afternoon' | 'Evening' {

    // 🔹 DAY 1 RULE
    if (dayNumber === 1) {
      // Arrival handled separately
      if (activityIndex === 0) return 'Afternoon';
      return 'Evening';
    }

    // 🔹 OTHER DAYS LOGIC
    if (totalActivitiesInDay === 1) return 'Morning';

    if (totalActivitiesInDay === 2) {
      return activityIndex === 0 ? 'Morning' : 'Afternoon';
    }

    const ratio = activityIndex / (totalActivitiesInDay - 1);
    if (ratio < 0.4) return 'Morning';
    if (ratio < 0.7) return 'Afternoon';
  return 'Evening';
 }


  /**
  * Estimate activity duration based on category
  */
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

  /**
  * Generate day themes based on activities
  */
  private generateDayTheme(activities: EnhancedItineraryItemDto[]): string {
    const categories = activities.map((a) => a.category);
    const uniqueCategories = [...new Set(categories)];

    if (uniqueCategories.length === 1) {
      return `${uniqueCategories[0]} Day`;
    }
  
    if (categories.includes('Beach') && categories.includes('Relaxation')) {
      return 'Beach & Relaxation';
    }
  
    if (categories.includes('Culture') && categories.includes('Sightseeing')) {
      return 'Cultural Exploration';
    }
  
    if (categories.includes('Nature') ) {
      return 'Nature & Wildlife';
    }

    return 'Mixed Activities';
  }

  @Post('trip-plan')
  async tripPlanEnhanced(
    @Body() body: TripPlanRequestDto,
  ): Promise<TripPlanResponseDto> {
    this.logger.log(`🗺️ Generating enhanced trip plan for: ${body.destination}`);

    // Step 1: Build enriched search query
    const searchTerms = [
      body.destination,
      'attractions',
      'places to visit',
      ...(body.preferences ?? []),
    ];
    const query = searchTerms.join(' ');

    // Step 2: Execute search
    const searchResults = await this.executeSearch(query);

    // Step 3: Calculate trip duration
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const dayCount = Math.max(
      1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  this.logger.log(`📅 Trip duration: ${dayCount} days`);
  this.logger.log(`🎯 Preferences: ${body.preferences?.join(', ') || 'None'}`);

  // Step 4: Generate enhanced day-by-day itinerary
  const dayPlans = this.generateItinerary(
    searchResults.results,
    dayCount,
    body.startDate,
    body.preferences,
    body.destination,
  );


  // Step 5: Generate summary
  const allActivities = dayPlans.flatMap((d) => d.activities);
  const categories = [...new Set(allActivities.map((a) => a.category))];
  const matchedPrefs = body.preferences?.filter((pref) =>
    allActivities.some((activity) =>
      activity.category.toLowerCase() === pref.toLowerCase()
    )
  ) || [];

  return {
    plan: {
      destination: body.destination,
      dates: {
        start: body.startDate,
        end: body.endDate,
      },
      totalDays: dayCount,
      dayByDayPlan: dayPlans,
      summary: {
        totalActivities: allActivities.length,
        categoriesIncluded: categories,
        preferencesMatched: matchedPrefs,
      },
    },
    message: `Generated ${allActivities.length} activities across ${dayCount} days for ${body.destination}. Matched ${matchedPrefs.length} of your preferences.`,
  };
}}