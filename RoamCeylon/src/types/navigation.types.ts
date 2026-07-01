// Navigation type definitions for the app

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Register: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  GoogleSignIn: undefined;
  EmailVerification: { email: string };
  PasswordReset: undefined;
  LinkSent: { email: string };
  EnterNewPassword: { refreshToken?: string; type?: string } | undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Explore: undefined;
  Activities: undefined;
  ActivityDetails: { activity: any };
  TourPackages: undefined;
  TourPackageDetails: { tourPackage: any };
  TourPackageBooking: { tourPackage: any };
  Marketplace: undefined;
  MarketplaceHome: undefined;
  ShopDetails: { shop: any };
  Alerts: undefined;
  MarketplaceCategory: {
    categoryId: string;
    categoryName: string;
  };
  ProductDetails: {
    productId: string;
  };
  Transport: { pickup?: LocationSelection; destination?: LocationSelection } | undefined;
  TransportLocationPicker:
    | { pickup?: LocationSelection; destination?: LocationSelection }
    | undefined;
  TransportStatus: undefined;
  Map: undefined;
  Profile: undefined;
  PersonalInfo: undefined;
  ChangePassword: undefined;
  PrivacyPolicy: undefined;
  ComponentShowcase: undefined;
  AITripPlanner: undefined;
  AIWelcome: undefined;
  AIHome: undefined;
  AIChat: undefined;
  SavedTrips: undefined;
  AIPlannerTesting: undefined;
  Emergency: undefined;
  HotelBooking: {
    hotel?: any;
    checkIn?: string;
    checkOut?: string;
  } | undefined;
};

export type LocationSelection = {
  name: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
};
