import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './services/embedding.service';
import { CreatePlanDto, ItineraryResponse, DayPlan } from './dto/create-ai-planner.dto';
import tourismData from './data/sample-tourism.json';

@Injectable()
export class AiPlannerService {
  private readonly logger = new Logger(AiPlannerService.name);

  // Fallback itinerary if generation fails
  private readonly DEFAULT_ITINERARY: DayPlan[] = [
    { day: 1, location: 'Colombo', activities: ['City tour', 'National Museum', 'Galle Face Green'] },
    { day: 2, location: 'Kandy', activities: ['Temple of the Tooth', 'Botanical Gardens'] },
    { day: 3, location: 'Sigiriya', activities: ['Lion Rock Fortress', 'Village tour'] },
  ];

  constructor(private readonly embeddingService: EmbeddingService) { }

  async seedEmbeddingsFromAiPlanner(): Promise<void> {
    await this.embeddingService.seedEmbeddings();
  }

  /**
   * Generates a stable itinerary with fallbacks and consistent ordering.
   */
  async createPlan(dto: CreatePlanDto): Promise<ItineraryResponse> {
    this.logger.log(`Creating plan for ${dto.days} days with interests: ${dto.preferences?.interests}`);

    try {
      // 1. Handle unexpected inputs safely
      if (!dto.preferences || !dto.preferences.interests || dto.preferences.interests.length === 0) {
        this.logger.warn('Empty interests received, using fallback');
        return {
          itinerary: this.DEFAULT_ITINERARY.slice(0, dto.days),
          isFallback: true,
          message: 'Default plan provided due to missing preferences'
        };
      }

      // 2. Consistent response ordering
      // Sort interests to ensure deterministic processing if the logic scales
      const sortedInterests = [...dto.preferences.interests].sort();

      // Simulate matching logic using sample data
      const matchedPlaces = tourismData.tourism_samples
        .filter(sample =>
          sortedInterests.some(interest =>
            sample.description.toLowerCase().includes(interest.toLowerCase()) ||
            sample.title.toLowerCase().includes(interest.toLowerCase())
          )
        )
        // Ensure consistent ordering of results by ID or Title
        .sort((a, b) => a.id.localeCompare(b.id));

      if (matchedPlaces.length === 0) {
        this.logger.log('No matches found for interests, providing fallback');
        return {
          itinerary: this.DEFAULT_ITINERARY.slice(0, dto.days),
          isFallback: true,
          message: 'No specific matches found for your interests, provided our top-rated route.'
        };
      }

      // Build plan for requested days
      const itinerary: DayPlan[] = [];
      for (let i = 1; i <= dto.days; i++) {
        // Round-robin through matched places if days exceed matches
        const place = matchedPlaces[(i - 1) % matchedPlaces.length];
        itinerary.push({
          day: i,
          location: place.title,
          activities: [
            `Visit ${place.title}`,
            `Explore surroundings`,
            i === 1 ? 'Arrival and check-in' : 'Local sightseeing'
          ],
        });
      }

      return { itinerary, isFallback: false };

    } catch (error) {
      // 3. Fallback responses: Catch all errors and return a valid structure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error generating plan: ${errorMessage}`);

      return {
        itinerary: this.DEFAULT_ITINERARY.slice(0, dto.days),
        isFallback: true,
        message: 'Internal error occurred while generating your plan. Providing a stable fallback.'
      };
    }
  }
}
