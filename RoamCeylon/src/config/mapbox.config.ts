// Mapbox Configuration
// Make sure to add your Mapbox keys to .env file

export const MAPBOX_CONFIG = {
  // Load Mapbox access token from environment variable
  // For development, add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to .env file
  // For production, set via EAS Secrets or build environment
  accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  
  // Default map settings
  defaultStyle: 'mapbox://styles/mapbox/streets-v12',
  
  // Sri Lanka center coordinates
  defaultCenter: {
    latitude: 7.8731,
    longitude: 80.7718,
  },
  
  // Default zoom level
  defaultZoom: 7,
  
  // Map settings
  settings: {
    compassViewPosition: 3,
    compassViewMargins: {
      x: 10,
      y: 10,
    },
    logoViewPosition: 0,
    attributionButtonPosition: 1,
  },
};

// Note: To use Mapbox, add the following to your .env file:
// EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
