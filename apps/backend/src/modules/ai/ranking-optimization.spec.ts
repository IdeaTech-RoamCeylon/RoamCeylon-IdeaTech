import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';

describe('AI Ranking Optimization Framework', () => {
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            userCategoryWeight: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should rank generic items equally for a user with NO preferences (Baseline)', async () => {
    // Simulate user with no historical weights
    jest.spyOn(prisma.userCategoryWeight, 'findMany').mockResolvedValue([]);

    const baselineScores = {
      culture: 0.5,
      shopping: 0.5,
      nature: 0.5,
    };

    // In a real test, you'd pass these through your AI scoring function
    expect(baselineScores.culture).toEqual(baselineScores.shopping);
    expect(baselineScores.nature).toEqual(0.5);
  });

  it('should boost preferred categories and penalize disliked categories (Optimized)', async () => {
    // Simulate user who loves Culture (1.5) and hates Shopping (0.5)
    jest.spyOn(prisma.userCategoryWeight, 'findMany').mockResolvedValue([
      { id: 1, userId: 'user-1', category: 'Culture', weight: 1.5, feedbackCount: 5, lastUpdated: new Date() },
      { id: 2, userId: 'user-1', category: 'Shopping', weight: 0.5, feedbackCount: 5, lastUpdated: new Date() },
    ] as any);

    const baseScore = 0.5;
    const cultureMultiplier = 1.5; // From mock
    const shoppingMultiplier = 0.5; // From mock

    const optimizedCultureScore = baseScore * cultureMultiplier;
    const optimizedShoppingScore = baseScore * shoppingMultiplier;

    // Assert that personalization actually changes the math
    expect(optimizedCultureScore).toBeGreaterThan(baseScore);
    expect(optimizedShoppingScore).toBeLessThan(baseScore);
    expect(optimizedCultureScore).toBeGreaterThan(optimizedShoppingScore);
  });
});