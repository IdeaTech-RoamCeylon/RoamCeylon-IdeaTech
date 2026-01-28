import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

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
        // Important for many hosted PG providers (Nhost, Supabase, etc.)
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
      // If you connect to hosted DB via vars, you may also need:
      // ssl: { rejectUnauthorized: false },
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

  private mapTripRow(row: any): SavedTrip {
    return {
      id: String(row.id),
      userId: String(row.user_id),
      destination: String(row.destination),
      startDate: String(row.start_date),
      endDate: String(row.end_date),
      preferences: Array.isArray(row.preferences)
        ? row.preferences
        : row.preferences
          ? row.preferences
          : [],
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  /* -------------------- Public API -------------------- */

  async getLatestForUser(userId: string): Promise<SavedTrip | null> {
    const db = await this.ensureConnected();

    const q = `
      SELECT id, user_id, destination, start_date, end_date, preferences, created_at, updated_at
      FROM trips
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1;
    `;

    const res = await db.query(q, [userId]);
    if (res.rowCount === 0) return null;
    return this.mapTripRow(res.rows[0]);
  }

  async getByIdForUser(
    userId: string,
    tripId: string,
  ): Promise<SavedTrip | null> {
    const db = await this.ensureConnected();

    const q = `
      SELECT id, user_id, destination, start_date, end_date, preferences, created_at, updated_at
      FROM trips
      WHERE user_id = $1 AND id = $2
      LIMIT 1;
    `;

    const res = await db.query(q, [userId, tripId]);
    if (res.rowCount === 0) return null;
    return this.mapTripRow(res.rows[0]);
  }

  /**
   * Saves a new version (immutable) and updates the "current trip" snapshot.
   */
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

    await db.query('BEGIN');
    try {
      let tripId = args.tripId;

      if (tripId) {
        const check = await db.query(
          `SELECT id FROM trips WHERE id = $1 AND user_id = $2 LIMIT 1`,
          [tripId, args.userId],
        );
        if (check.rowCount === 0) tripId = undefined;
      }

      if (!tripId) {
        const insertTrip = await db.query(
          `
          INSERT INTO trips (user_id, destination, start_date, end_date, preferences)
          VALUES ($1, $2, $3, $4, $5::jsonb)
          RETURNING id;
          `,
          [
            args.userId,
            args.destination,
            args.startDate,
            args.endDate,
            JSON.stringify(args.preferences ?? []),
          ],
        );
        tripId = String(insertTrip.rows[0].id);
      } else {
        await db.query(
          `
          UPDATE trips
          SET destination = $2,
              start_date = $3,
              end_date = $4,
              preferences = $5::jsonb,
              updated_at = NOW()
          WHERE id = $1 AND user_id = $6;
          `,
          [
            tripId,
            args.destination,
            args.startDate,
            args.endDate,
            JSON.stringify(args.preferences ?? []),
            args.userId,
          ],
        );
      }

      const versionRes = await db.query(
        `
        SELECT COALESCE(MAX(version_no), 0) AS max_version
        FROM trip_versions
        WHERE trip_id = $1;
        `,
        [tripId],
      );

      const nextVersionNo = Number(versionRes.rows[0]?.max_version ?? 0) + 1;

      const insertVersion = await db.query(
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

    const res = await db.query(q, [tripId, userId]);
    if (res.rowCount === 0) return null;

    const row = res.rows[0];
    return {
      id: String(row.id),
      tripId: String(row.trip_id),
      userId: String(row.user_id),
      versionNo: Number(row.version_no),
      planJson: row.plan_json,
      aiMeta: row.ai_meta,
      createdAt: String(row.created_at),
    };
  }
}
