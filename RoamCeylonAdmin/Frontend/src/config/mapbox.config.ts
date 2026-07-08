// Mapbox Configuration
// Token comes from EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.

export const MAPBOX_CONFIG = {
  accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',

  // Default map style
  defaultStyle: 'mapbox://styles/mapbox/streets-v12',

  // Sri Lanka center coordinates
  defaultCenter: {
    latitude: 7.8731,
    longitude: 80.7718,
  },

  defaultZoom: 7,
};
