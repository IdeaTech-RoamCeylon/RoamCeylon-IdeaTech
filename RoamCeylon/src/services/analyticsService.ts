
import { TripPlanResponse } from './aiService';

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  logEvent(eventName: string, params?: object) {
    if (__DEV__) {
      console.log(`[Analytics] Event: ${eventName}`, params || '');
    }
    // TODO: Integrate with real analytics provider (Firebase, Amplitude, etc.)
  }

  logPlanGenerated(destination: string, duration: string, budget: string) {
    this.logEvent('plan_generated', {
      destination,
      duration,
      budget,
      timestamp: new Date().toISOString(),
    });
  }

  logTripSaved(tripId: string, name: string) {
    this.logEvent('trip_saved', {
      tripId,
      name,
      timestamp: new Date().toISOString(),
    });
  }

  logFeedbackSubmitted(isPositive: boolean, reasons?: string[]) {
    this.logEvent('feedback_submitted', {
      isPositive,
      reasons: reasons || [],
      timestamp: new Date().toISOString(),
    });
  }
}

export const analyticsService = AnalyticsService.getInstance();
