import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { randomUUID } from 'crypto';

export type ActivityInteraction = {
  userId: string;
  placeId: string;
  placeName: string;
  category: string;
  timestamp: string;
  action: 'selected' | 'removed';
};

export type SavedTrip = {
  id: string;
  userId: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preferences: string[];
  createdAt: string;
  updatedAt: string;
};

export type TripVersionRow = {
  id: string;
  tripId: string;
  userId: string;
  versionNo: number;
  planJson: unknown;
  aiMeta:
    | { model: string; temperature: number; plannerVersion: string }
    | Record<string, unknown>;
  createdAt: string;
};

/* -------------------- DB Row Types -------------------- */

type SavedTripRow = {
  id: string;
  userId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  preferences: unknown; // jsonb
  itinerary: unknown; // jsonb
  createdAt: Date;
  updatedAt: Date;
};

type TripVersionsRow = {
  id: string;
  trip_id: string;
  user_id: string;
  version_no: number;
  plan_json: unknown;
  ai_meta: unknown;
  created_at: string;
};

type MaxVersionRow = {
  max_version: number | string | null;
};

type InsertVersionRow = {
  id: string;
  trip_id: string;
  version_no: number | string;
};

@Injectable()
export class TripStoreService {
  private readonly logger = new Logger(TripStoreService.name);
  private client: Client | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  /* -------------------- DB -------------------- */

  private createClient(): Client {
    const dbUrl = this.configService.get<string>('DATABASE_URL');

    if (dbUrl) {
      return new Client({
        connectionString: dbUrl,
        ssl: dbUrl.includes('sslmode=')
          ? { rejectUnauthorized: false }
          : undefined,
      });
    }

    return new Client({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: String(this.configService.get<string>('DB_PASSWORD') || ''),
      port: Number(this.configService.get<string>('DB_PORT')),
    });
  }

  private async ensureConnected(): Promise<Client> {
    if (this.client && this.isConnected) return this.client;

    this.client = this.createClient();
    await this.client.connect();
    this.isConnected = true;

    return this.client;
  }

  /* -------------------- Helpers -------------------- */

  private parsePreferences(value: unknown): string[] {
    if (Array.isArray(value) && value.every((v) => typeof v === 'string'))
      return value;

    // If pg returns JSON as string (rare, but possible)
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string'))
          return parsed;
      } catch {
        // ignore
      }
    }

    return [];
  }

  private mapSavedTripRow(row: SavedTripRow): SavedTrip {
    return {
      id: String(row.id),
      userId: String(row.userId),
      destination: String(row.destination),
      startDate: String(row.startDate),
      endDate: String(row.endDate),
      preferences: this.parsePreferences(row.preferences),
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
    };
  }

  /* -------------------- Public API -------------------- */

  async getLatestForUser(userId: string): Promise<SavedTrip | null> {
    const db = await this.ensureConnected();

    // Use "SavedTrip" table (Prisma managed)
    const q = `
      SELECT id, "userId", destination, "startDate", "endDate", preferences, "createdAt", "updatedAt"
      FROM "SavedTrip"
      WHERE "userId" = $1
      ORDER BY "updatedAt" DESC
      LIMIT 1;
    `;

    const res = await db.query<SavedTripRow>(q, [userId]);
    if (res.rowCount === 0) return null;
    return this.mapSavedTripRow(res.rows[0]);
  }

  async getByIdForUser(
    userId: string,
    tripId: string,
  ): Promise<SavedTrip | null> {
    const db = await this.ensureConnected();

    const q = `
      SELECT id, "userId", destination, "startDate", "endDate", preferences, "createdAt", "updatedAt"
      FROM "SavedTrip"
      WHERE "userId" = $1 AND id = $2
      LIMIT 1;
    `;

    const res = await db.query<SavedTripRow>(q, [userId, tripId]);
    if (res.rowCount === 0) return null;
    return this.mapSavedTripRow(res.rows[0]);
  }

  async saveTripVersion(args: {
    userId: string;
    destination: string;
    startDate: string;
    endDate: string;
    preferences: string[];
    planJson: unknown;
    aiMeta:
      | { model: string; temperature: number; plannerVersion: string }
      | Record<string, unknown>;
    tripId?: string;
  }): Promise<{ id: string; tripId: string; versionNo: number }> {
    const db = await this.ensureConnected();

    // Normalize dates to YYYY-MM-DD format (strip any timezone info)
    const normalizeDate = (dateStr: string): string => {
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toISOString().split('T')[0];
      } catch {
        return dateStr;
      }
    };

    const startDate = normalizeDate(args.startDate);
    const endDate = normalizeDate(args.endDate);
    const now = new Date().toISOString();

    await db.query('BEGIN');
    try {
      let tripId = args.tripId;

      if (tripId) {
        const check = await db.query<{ id: string }>(
          `SELECT id FROM "SavedTrip" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
          [tripId, args.userId],
        );
        if (check.rowCount === 0) tripId = undefined;
      }

      if (!tripId) {
        // Generate a new UUID
        const newTripId = randomUUID();

        await db.query(
          `
          INSERT INTO "SavedTrip" (id, "userId", name, destination, "startDate", "endDate", preferences, itinerary, "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
          `,
          [
            newTripId,
            args.userId,
            'My AI Trip', // Default name
            args.destination,
            new Date(startDate), // Date object for timestamp columns
            new Date(endDate),
            JSON.stringify(args.preferences ?? []),
            JSON.stringify(args.planJson ?? {}),
            now,
          ],
        );
        tripId = newTripId;
      } else {
        await db.query(
          `
          UPDATE "SavedTrip"
          SET destination = $2,
              "startDate" = $3,
              "endDate" = $4,
              preferences = $5::jsonb,
              itinerary = $6::jsonb,
              "updatedAt" = $7
          WHERE id = $1 AND "userId" = $8;
          `,
          [
            tripId,
            args.destination,
            new Date(startDate),
            new Date(endDate),
            JSON.stringify(args.preferences ?? []),
            JSON.stringify(args.planJson ?? {}),
            now,
            args.userId,
          ],
        );
      }

      // Ensure trip_versions table exists (manually managed)
      await db.query(`
        CREATE TABLE IF NOT EXISTS trip_versions (
          id SERIAL PRIMARY KEY,
          trip_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          version_no INT NOT NULL,
          plan_json JSONB,
          ai_meta JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_trip_versions_trip_id ON trip_versions(trip_id);
      `);

      const versionRes = await db.query<MaxVersionRow>(
        `
        SELECT COALESCE(MAX(version_no), 0) AS max_version
        FROM trip_versions
        WHERE trip_id = $1;
        `,
        [tripId],
      );

      const maxVRaw = versionRes.rows[0]?.max_version ?? 0;
      const nextVersionNo = Number(maxVRaw) + 1;

      const insertVersion = await db.query<InsertVersionRow>(
        `
        INSERT INTO trip_versions (trip_id, user_id, version_no, plan_json, ai_meta)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
        RETURNING id, trip_id, version_no;
        `,
        [
          tripId,
          args.userId,
          nextVersionNo,
          JSON.stringify(args.planJson ?? {}),
          JSON.stringify(args.aiMeta ?? {}),
        ],
      );

      await db.query('COMMIT');

      return {
        id: String(insertVersion.rows[0].id),
        tripId: String(insertVersion.rows[0].trip_id),
        versionNo: Number(insertVersion.rows[0].version_no),
      };
    } catch (err) {
      await db.query('ROLLBACK');
      this.logger.error(`saveTripVersion failed: ${(err as Error).message}`);
      throw err;
    }
  }

  async getLatestPlanForTrip(
    userId: string,
    tripId: string,
  ): Promise<TripVersionRow | null> {
    const db = await this.ensureConnected();

    const q = `
      SELECT id, trip_id, user_id, version_no, plan_json, ai_meta, created_at
      FROM trip_versions
      WHERE trip_id = $1 AND user_id = $2
      ORDER BY version_no DESC
      LIMIT 1;
    `;

    const res = await db.query<TripVersionsRow>(q, [tripId, userId]);
    if (res.rowCount === 0) return null;

    const row = res.rows[0];

    return {
      id: String(row.id),
      tripId: String(row.trip_id),
      userId: String(row.user_id),
      versionNo: Number(row.version_no),
      planJson: row.plan_json,
      aiMeta: (row.ai_meta ?? {}) as TripVersionRow['aiMeta'],
      createdAt: String(row.created_at),
    };
  }

  /**
   * Get all trips for a user
   */
  async getUserTrips(
    userId: string,
  ): Promise<Array<SavedTrip & { planJson?: unknown }>> {
    const db = await this.ensureConnected();

    // Join with trip_versions to get plan_json if available,
    // otherwise fallback to SavedTrip.itinerary?
    // Actually, SavedTrip.itinerary should be the latest if we update it.
    // For now, keep the logic consistent with old implementation: prefer versioned plan.
    const q = `
      SELECT 
        t.id, t."userId", t.destination, t."startDate", t."endDate", 
        t.preferences, t."createdAt", t."updatedAt",
        tv.plan_json
      FROM "SavedTrip" t
      LEFT JOIN LATERAL (
        SELECT plan_json 
        FROM trip_versions 
        WHERE trip_id = t.id 
        ORDER BY version_no DESC 
        LIMIT 1
      ) tv ON true
      WHERE t."userId" = $1
      ORDER BY t."updatedAt" DESC;
    `;

    const res = await db.query<SavedTripRow & { plan_json: unknown }>(q, [
      userId,
    ]);

    return res.rows.map((row) => ({
      ...this.mapSavedTripRow(row),
      planJson: row.plan_json || row.itinerary, // Fallback to itinerary if version missing
    }));
  }

  /**
   * Get user activity log
   */
  async getUserActivityLog(userId: string): Promise<ActivityInteraction[]> {
    const db = await this.ensureConnected();

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_activity_log (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          place_id TEXT NOT NULL,
          place_name TEXT NOT NULL,
          category TEXT NOT NULL,
          action TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
      `);

      const result = await db.query<{
        user_id: string;
        place_id: string;
        place_name: string;
        category: string;
        action: string;
        created_at: string;
      }>(
        `SELECT user_id, place_id, place_name, category, action, created_at
         FROM user_activity_log
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId],
      );

      return result.rows.map((row) => ({
        userId: String(row.user_id),
        placeId: String(row.place_id),
        placeName: String(row.place_name),
        category: String(row.category),
        action: row.action as 'selected' | 'removed',
        timestamp: String(row.created_at),
      }));
    } catch (error) {
      this.logger.warn(
        `getUserActivityLog failed: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Get user's preferred travel pace based on past trips
   */
  async getUserTravelPace(
    userId: string,
  ): Promise<'relaxed' | 'moderate' | 'active'> {
    const trips = await this.getUserTrips(userId);
    if (trips.length === 0) return 'moderate';

    const avgActivitiesPerDay =
      trips.reduce((sum, trip) => {
        const planJson = trip.planJson as
          | {
              dayByDayPlan?: Array<{ activities?: unknown[] }>;
              totalDays?: number;
            }
          | undefined;
        const activities =
          planJson?.dayByDayPlan?.flatMap((d) => d.activities || []) || [];
        const days = planJson?.totalDays || 1;
        return sum + activities.length / days;
      }, 0) / trips.length;

    if (avgActivitiesPerDay <= 2) return 'relaxed';
    if (avgActivitiesPerDay <= 3) return 'moderate';
    return 'active';
  }

  /**
   * Get categories the user has explicitly removed (negative signal)
   */
  async getUserAvoidedCategories(userId: string): Promise<string[]> {
    const activities = await this.getUserActivityLog(userId);

    const removed = activities
      .filter((a) => a.action === 'removed')
      .map((a) => a.category.toLowerCase());

    const removedCounts = removed.reduce(
      (acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Return categories removed 2+ times
    return Object.entries(removedCounts)
      .filter(([, count]) => count >= 2)
      .map(([cat]) => cat);
  }

  /**
   * Get recent selections (last 30 days)
   */
  async getRecentUserSelections(
    userId: string,
  ): Promise<Array<{ placeId: string; category: string; timestamp: string }>> {
    const activities = await this.getUserActivityLog(userId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return activities
      .filter(
        (a) =>
          a.action === 'selected' && new Date(a.timestamp) >= thirtyDaysAgo,
      )
      .map((a) => ({
        placeId: a.placeId,
        category: a.category,
        timestamp: a.timestamp,
      }));
  }

  /**
   * Log user activity interaction for personalization
   */
  async logActivityInteraction(
    interaction: ActivityInteraction,
  ): Promise<void> {
    const db = await this.ensureConnected();

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_activity_log (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        place_id TEXT NOT NULL,
        place_name TEXT NOT NULL,
        category TEXT NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
    `);

    await db.query(
      `INSERT INTO user_activity_log (user_id, place_id, place_name, category, action)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        interaction.userId,
        interaction.placeId,
        interaction.placeName,
        interaction.category,
        interaction.action,
      ],
    );
  }

  /**
   * Get user's frequently selected categories
   */
  async getUserCategoryPreferences(userId: string): Promise<
    {
      category: string;
      count: number;
    }[]
  > {
    const db = await this.ensureConnected();

    try {
      // Ensure table exists
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_activity_log (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          place_id TEXT NOT NULL,
          place_name TEXT NOT NULL,
          category TEXT NOT NULL,
          action TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
      `);

      const result = await db.query<{ category: string; count: string }>(
        `SELECT category, COUNT(*) as count
         FROM user_activity_log
         WHERE user_id = $1 AND action = 'selected'
         GROUP BY category
         ORDER BY count DESC
         LIMIT 5`,
        [userId],
      );

      return result.rows.map((row) => ({
        category: String(row.category),
        count: parseInt(String(row.count), 10),
      }));
    } catch (error) {
      this.logger.warn(
        `getUserCategoryPreferences failed: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Get user's frequently visited places
   */
  async getUserFrequentPlaces(userId: string): Promise<
    {
      placeId: string;
      placeName: string;
      count: number;
    }[]
  > {
    const db = await this.ensureConnected();

    try {
      // Ensure table exists
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_activity_log (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          place_id TEXT NOT NULL,
          place_name TEXT NOT NULL,
          category TEXT NOT NULL,
          action TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
      `);

      const result = await db.query<{
        place_id: string;
        place_name: string;
        count: string;
      }>(
        `SELECT place_id, place_name, COUNT(*) as count
         FROM user_activity_log
         WHERE user_id = $1 AND action = 'selected'
         GROUP BY place_id, place_name
         ORDER BY count DESC
         LIMIT 10`,
        [userId],
      );

      return result.rows.map((row) => ({
        placeId: String(row.place_id),
        placeName: String(row.place_name),
        count: parseInt(String(row.count), 10),
      }));
    } catch (error) {
      this.logger.warn(
        `getUserFrequentPlaces failed: ${(error as Error).message}`,
      );
      return [];
    }
  }

  /**
   * Get destinations where user gave positive feedback (4+ stars)
   */
  async getUserPositiveFeedbackDestinations(userId: string): Promise<string[]> {
    const db = await this.ensureConnected();

    try {
      // "PlannerFeedback" table is created by Prisma (case-sensitive)
      // Join on tripId to get destination from "SavedTrip"
      // Filter rating >= 4
      const result = await db.query<{ destination: string }>(
        `
        SELECT DISTINCT t.destination
        FROM "PlannerFeedback" pf
        JOIN "SavedTrip" t ON t.id = pf."tripId"
        WHERE pf."userId" = $1
          AND COALESCE(
            -- New format: {"rating": N}
            (pf."feedbackValue"->>'rating')::int,
            -- Legacy format: bare number stored as JSON
            CASE jsonb_typeof(pf."feedbackValue")
              WHEN 'number' THEN (pf."feedbackValue"::text)::int
              ELSE NULL
            END
          ) >= 4;
        `,
        [userId],
      );

      return result.rows
        .map((r) => r.destination)
        .filter((d) => d && d.trim().length > 0);
    } catch (error) {
      this.logger.warn(
        `getUserPositiveFeedbackDestinations failed: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
