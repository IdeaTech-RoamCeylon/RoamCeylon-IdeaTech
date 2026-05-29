import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly googleApiKey: string;
  private readonly nhostStorageUrl: string;
  private readonly nhostAdminSecret: string;
  private readonly inFlightRequests = new Map<string, Promise<string | null>>();

  constructor(private readonly prisma: PrismaService) {
    this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    const subdomain = process.env.NHOST_SUBDOMAIN || '';
    const region = process.env.NHOST_REGION || '';
    this.nhostStorageUrl = `https://${subdomain}.storage.${region}.nhost.run/v1/files`;
    this.nhostAdminSecret = process.env.NHOST_ADMIN_SECRET || '';
  }

  async getPlacePhotoUrl(
    placeName: string,
    location: string,
  ): Promise<string | null> {
    if (!this.googleApiKey) {
      this.logger.warn('GOOGLE_PLACES_API_KEY is not configured');
      return null;
    }

    // 1. Normalize placeName
    const normalizedName = placeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');

    if (this.inFlightRequests.has(normalizedName)) {
      this.logger.log(`Waiting for existing fetch request for ${placeName}`);
      return this.inFlightRequests.get(normalizedName)!;
    }

    const requestPromise = this.fetchAndCachePhoto(
      placeName,
      normalizedName,
      location,
    ).finally(() => {
      this.inFlightRequests.delete(normalizedName);
    });

    this.inFlightRequests.set(normalizedName, requestPromise);
    return requestPromise;
  }

  private async fetchAndCachePhoto(
    placeName: string,
    normalizedName: string,
    location: string,
  ): Promise<string | null> {
    try {
      // 2. Query PlaceCache
      const cached = await this.prisma.placeCache.findUnique({
        where: { placeName: normalizedName },
      });
      if (cached) {
        this.logger.log(`Found cached image for ${placeName}`);
        return this.getPresignedUrlForPlace(placeName);
      }

      // 3. Fetch from Google Places API
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        placeName + ' ' + location,
      )}&key=${this.googleApiKey}`;

      interface PlacesResponse {
        results: Array<{
          photos?: Array<{
            photo_reference: string;
          }>;
        }>;
      }

      const searchRes = await axios.get<PlacesResponse>(searchUrl);
      const results = searchRes.data.results;

      if (!results || results.length === 0) {
        this.logger.warn(`No results found in Google Places for: ${placeName}`);
        return null;
      }
      if (!results[0].photos || results[0].photos.length === 0) {
        this.logger.warn(`No photos found in Google Places for: ${placeName}`);
        return null;
      }

      const photoRef = results[0].photos[0].photo_reference;

      // 4. Fetch the photo buffer
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${this.googleApiKey}`;
      const photoRes = await axios.get(photoUrl, {
        responseType: 'arraybuffer',
      });
      const buffer = Buffer.from(photoRes.data as ArrayBuffer);

      // 5. Check size limit (< 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        this.logger.warn(`Image for ${placeName} exceeds 5MB limit`);
        return null;
      }

      // 6. Upload to Nhost using Axios
      const filename = `${normalizedName}-${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file[]', buffer, {
        filename,
        contentType: 'image/jpeg',
      });
      formData.append('bucket-id', 'Places');

      interface NhostUploadResponse {
        processedFiles?: Array<{
          id: string;
        }>;
      }

      const uploadRes = await axios.post<NhostUploadResponse>(
        this.nhostStorageUrl,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'x-hasura-admin-secret': this.nhostAdminSecret,
          },
        },
      );

      if (
        !uploadRes.data ||
        !uploadRes.data.processedFiles ||
        !uploadRes.data.processedFiles[0]?.id
      ) {
        this.logger.error(
          'Nhost upload succeeded but no fileMetadata returned',
        );
        return null;
      }

      const fileId = uploadRes.data.processedFiles[0].id;
      const imageUrl = `${this.nhostStorageUrl}/${fileId}`;

      // 7. Save to PlaceCache using upsert to avoid race conditions
      await this.prisma.placeCache.upsert({
        where: { placeName: normalizedName },
        update: { imageUrl },
        create: {
          placeName: normalizedName,
          imageUrl,
        },
      });

      this.logger.log(
        `Successfully fetched and uploaded image for ${placeName}: ${imageUrl}`,
      );
      return this.getPresignedUrlForPlace(placeName);
    } catch (error) {
      this.logger.error(
        `Failed to get photo for ${placeName}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async getPresignedUrlForPlace(placeName: string): Promise<string | null> {
    const normalizedName = placeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-');

    try {
      const cached = await this.prisma.placeCache.findUnique({
        where: { placeName: normalizedName },
      });

      if (!cached || !cached.imageUrl) {
        return null;
      }

      // Extract fileId from the stored Nhost URL (e.g. https://.../v1/files/<fileId>)
      const fileIdMatch = cached.imageUrl.match(/\/v1\/files\/([a-f0-9-]+)$/);
      if (!fileIdMatch) {
        return null;
      }
      const fileId = fileIdMatch[1];

      const subdomain = process.env.NHOST_SUBDOMAIN;
      const region = process.env.NHOST_REGION;
      const url = `https://${subdomain}.storage.${region}.nhost.run/v1/files/${fileId}/presignedurl`;

      interface PresignedUrlResponse {
        url?: string;
      }

      const res = await axios.get<PresignedUrlResponse>(url, {
        headers: {
          'x-hasura-admin-secret': this.nhostAdminSecret,
        },
      });

      return res.data?.url || null;
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for ${placeName}: ${(error as Error).message}`,
      );
      return null;
    }
  }
}
