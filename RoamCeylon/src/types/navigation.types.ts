// Navigation type definitions for the app

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  PhoneEntry: undefined;
  OTP: { phoneNumber: string };
  ProfileSetup: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Explore: undefined;
  Marketplace: undefined;
  MarketplaceHome: undefined;
  MarketplaceCategory: {
    categoryId: string;
    categoryName: string;
  };
  ProductDetails: {
    productId: string;
  };
  Transport: undefined;
  TransportStatus: undefined;
  Map: undefined;
  Profile: undefined;
  ComponentShowcase: undefined;
  AITripPlanner: undefined;
  SavedTrips: undefined;
};
