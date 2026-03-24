
import apiService from './api';

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Safe, fire-and-forget event tracking.
   * Calls the /analytics/events endpoint with the 'engagement_' prefix implicitly added by the backend.
   */
  logEvent(event: string, payload: object = {}) {
    // Non-blocking call to backend
    apiService.post('/analytics/events', {
      event,
      timestamp: Date.now(),
      ...payload,
    }).catch(() => {
      // Slantly swallow to prevent analytics failures from breaking UI
    });
  }

  logPlanGenerated(destination: string, duration: string, budget: string) {
    this.logEvent('plan_generated', {
      destination,
      duration,
      budget,
    });
  }

  logTripSaved(tripId: string, name: string) {
    this.logEvent('trip_saved', {
      tripId,
      name,
    });
  }

  logFeedbackSubmitted(isPositive: boolean, reasons?: string[]) {
    this.logEvent('feedback_submitted', {
      isPositive,
      reasons: reasons || [],
    });
  }

  // New Engagement Event aliases (matching Backend ML canonical types)
  trackTripClicked(tripId: string) {
    this.logEvent('trip_clicked', { tripId });
  }

  trackDestinationViewed(destinationId: string) {
    this.logEvent('destination_viewed', { destinationId });
  }

  trackPlannerEdit(tripId: string, field: string) {
    this.logEvent('planner_edit', { tripId, field });
  }

  trackTripAccepted(tripId: string) {
    this.logEvent('trip_accepted', { tripId });
  }

  trackTripRejected(tripId: string, reason?: string) {
    this.logEvent('trip_rejected', { tripId, reason });
  }
}

export const analyticsService = AnalyticsService.getInstance();

