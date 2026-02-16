# 🌴 RoamCeylon Mobile App

React Native (Expo) mobile application for RoamCeylon - A comprehensive tourism and local services platform for Sri Lanka.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for quick testing on mobile)
- Android Studio or Xcode (optional, for emulators)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

Once the dev server starts, you have several options:

- **📱 Expo Go (Recommended)**
  - Install "Expo Go" app from App Store or Play Store
  - Scan the QR code displayed in terminal
  - App loads instantly on your phone

- **🤖 Android**
  - Press `a` in terminal
  - Requires Android Studio with emulator installed

- **🍎 iOS**
  - Press `i` in terminal (Mac only)
  - Requires Xcode with iOS simulator

- **🌐 Web**
  - Press `w` in terminal
  - Note: Some React Native features may have limitations on web

---

## 📁 Project Structure

```
RoamCeylon/
├── src/
│   ├── components/              # Reusable UI components (25 total)
│   │   ├── Button.tsx           # Button component (primary, secondary, outline)
│   │   ├── Input.tsx            # Input component with error states
│   │   ├── Card.tsx             # Card component (clickable & static)
│   │   ├── Loader.tsx           # Loading spinner component
│   │   ├── ErrorBoundary.tsx    # Error boundary for crash handling
│   │   ├── AuthLayout.tsx       # Authentication screens layout wrapper
│   │   ├── BudgetBreakdown.tsx  # Trip budget visualization
│   │   ├── ConfidenceIndicator.tsx  # AI confidence level display
│   │   ├── DaySelector.tsx      # Trip duration selector
│   │   ├── DriverInfoCard.tsx   # Driver details card
│   │   ├── DriverMarker.tsx     # Map marker for drivers
│   │   ├── EmptyState.tsx       # Empty list placeholder
│   │   ├── EndOfListIndicator.tsx  # Pagination end indicator
│   │   ├── EnhancedItineraryCard.tsx  # Rich trip itinerary card
│   │   ├── ErrorState.tsx       # Error display component
│   │   ├── InterestSelector.tsx # User interest/preference picker
│   │   ├── ItineraryItem.tsx    # Single itinerary activity item
│   │   ├── ItineraryList.tsx    # List of itinerary items
│   │   ├── LoadingFooter.tsx    # Loading indicator for lists
│   │   ├── LoadingState.tsx     # Full-screen loading state
│   │   ├── PaceSelector.tsx     # Trip pace preference selector
│   │   ├── PreferenceSummaryBanner.tsx  # Trip preferences summary
│   │   ├── PreferenceTag.tsx    # Individual preference tag
│   │   ├── RideTimeline.tsx     # Transport ride status timeline
│   │   └── index.ts             # Component exports
│   │
│   ├── navigation/              # Navigation configuration
│   │   ├── AuthStack.tsx        # Auth flow navigation
│   │   ├── MainStack.tsx        # Main app navigation
│   │   └── RootNavigator.tsx    # Root navigation container
│   │
│   ├── screens/                 # Screen components
│   │   ├── auth/                # Authentication screens
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── PhoneEntryScreen.tsx
│   │   │   ├── OTPScreen.tsx
│   │   │   └── ProfileSetupScreen.tsx
│   │   │
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   │
│   │   ├── explore/
│   │   │   └── ExploreScreen.tsx
│   │   │
│   │   ├── marketplace/         # Marketplace feature
│   │   │   ├── MarketplaceHomeScreen.tsx      # Categories view
│   │   │   ├── MarketplaceCategoryScreen.tsx  # Products by category
│   │   │   └── ProductDetailsScreen.tsx       # Product details
│   │   │
│   │   ├── planner/             # AI Trip Planner feature
│   │   │   ├── AITripPlannerScreen.tsx       # AI-powered trip planner
│   │   │   ├── SavedTripsScreen.tsx          # Saved trips list
│   │   │   └── TripPlannerForm.tsx           # Trip planning form
│   │   │
│   │   ├── transport/           # Transport & ride booking
│   │   │   ├── TransportScreen.tsx                  # Transport home
│   │   │   ├── MapScreen.tsx                        # Mapbox integration
│   │   │   ├── TransportLocationPickerScreen.tsx   # Location selection
│   │   │   └── TransportStatusScreen.tsx            # Ride status tracking
│   │   │
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   │
│   ├── services/                # API and business logic (7 services)
│   │   ├── api.ts               # Axios HTTP client with interceptors
│   │   ├── auth.ts              # Authentication service
│   │   ├── marketplaceApi.ts    # Marketplace API endpoints
│   │   ├── aiService.ts         # AI integration
│   │   ├── plannerApiService.ts # Trip planner API
│   │   ├── transportService.ts  # Transport/ride booking service
│   │   └── tripStorageService.ts  # Trip storage & caching
│   │
│   ├── context/                 # React Context providers (4 contexts)
│   │   ├── AuthContext.tsx      # Global auth state management
│   │   ├── LoadingContext.tsx   # Global loading overlay
│   │   ├── MapContext.tsx       # Map state sharing
│   │   └── PlannerContext.tsx   # Trip planner state management
│   │
│   ├── hooks/                   # Custom React hooks (6 hooks)
│   │   ├── useApiFetch.ts       # API data fetching with states
│   │   ├── useDebounce.ts       # Input debouncing
│   │   ├── useFormState.ts      # Form state management
│   │   ├── useInfiniteScroll.ts # Infinite scrolling pagination
│   │   ├── useNetworkStatus.ts  # Network connectivity status
│   │   ├── usePagination.ts     # Pagination logic
│   │   └── index.ts             # Hook exports
│   │
│   ├── data/                    # Mock/static data
│   │   └── mockDrivers.ts       # Mock driver data for testing
│   │
│   ├── utils/                   # Utility functions
│   │   └── toast.ts             # Toast notification helpers
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── navigation.types.ts  # Navigation types
│   │   ├── marketplace.types.ts # Marketplace types
│   │   └── index.ts             # Type exports
│   │
│   └── config/                  # App configuration
│       ├── mapbox.config.ts     # Mapbox settings
│       └── index.ts             # Config exports
│
├── assets/                      # Images, fonts, etc.
│   ├── Activities-TouristSpots.png
│   ├── Food-Restaurents.png
│   ├── Hotel-Stays.png
│   └── Ride-Transport.png
│
├── App.tsx                      # App entry point
├── .eslintrc.js                 # ESLint config
├── .prettierrc                  # Prettier config
├── .env.example                 # Environment variables template
└── package.json
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

````env
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Mapbox (optional - for maps feature)
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

> **Note:** Use `.env.example` as a template

### TypeScript Configuration

The app uses TypeScript for type safety. Configuration is in `tsconfig.json`.

### Code Quality

**ESLint** - Linting configuration

```bash
npm run lint
````

**Prettier** - Code formatting

```bash
npm run format
```

---

## 🧭 App Navigation Flow

### Authentication Flow

```
SplashScreen
    ↓
WelcomeScreen
    ↓
PhoneEntryScreen → Enter phone number
    ↓
OTPScreen → Verify OTP
    ↓
ProfileSetupScreen → Complete profile
    ↓
[Login to Main App]
```

### Main App Navigation

```
HomeScreen ← Default landing
    ↓
├── ExploreScreen      (Discover destinations)
├── MarketplaceScreen  (Shop local products)
├── TransportScreen    (Book rides)
├── AITripPlanner      (Plan trips with AI)
└── ProfileScreen      (User settings & logout)
```

---

## 🤖 AI Trip Planner

RoamCeylon includes a powerful AI-powered trip planning feature that helps users create personalized itineraries for Sri Lanka using custom modeled AI.

### Features

- **✨ AI-Powered Planning**: Uses custom AI to generate customized itineraries
- **🎯 Personalized**: Adapts to user preferences, interests, and budget
- **💾 Save & Manage**: Save trips locally and sync with backend
- **📊 Budget Breakdown**: Detailed cost estimation for trips
- **🗓️ Flexible Duration**: Plan trips from 1 to 14 days
- **⚡ Multiple Paces**: Choose relaxed, moderate, or fast-paced itineraries
- **🎨 Rich UI**: Beautiful cards with confidence indicators and detailed breakdowns

### Trip Planning Workflow

```
HomeScreen → "Plan My Entire Trip with AI"
    ↓
AITripPlannerScreen
    ↓
[1] Enter Preferences (TripPlannerForm)
    - Destination (autocomplete)
    - Duration (1-14 days)
    - Budget
    - Interests (culture, adventure, food, etc.)
    - Pace preference
    ↓
[2] AI Generation
    - Sends request to custom AI via aiService
    - Generates day-by-day itinerary
    - Calculates budget breakdown
    - Provides confidence scores
    ↓
[3] Review & Save
    - View detailed itinerary with EnhancedItineraryCard
    - See budget breakdown by category
    - Save trip to local storage & backend
    ↓
SavedTripsScreen
    - View all saved trips
    - Infinite scroll pagination
    - Pull-to-refresh
    - Delete trips
```

### Using the Trip Planner

**1. Plan a New Trip**

```typescript
// Navigate to AI Trip Planner
navigation.navigate('AITripPlanner');

// The screen handles all the planning flow
// User fills TripPlannerForm with preferences
// AI generates itinerary automatically
```

**2. Manage Saved Trips**

```typescript
// View saved trips
navigation.navigate('SavedTrips');

// Trips are stored locally (AsyncStorage) and synced with backend
// Supports pagination, refresh, and deletion
```

### AI Service Integration

The trip planner uses the `aiService` to communicate with AI:

```typescript
import { aiService } from './src/services/aiService';

// Generate trip itinerary
const itinerary = await aiService.generateTripItinerary({
  destination: 'Sigiriya',
  days: 5,
  budget: 50000,
  interests: ['culture', 'history', 'nature'],
  pace: 'moderate',
});

// Returns structured itinerary with:
// - Day-by-day activities
// - Budget breakdown
// - Recommendations
// - Confidence scores
```

### Trip Storage

Trips are managed using `tripStorageService` with dual storage:

```typescript
import { tripStorageService } from './src/services/tripStorageService';

// Save trip (local + backend)
await tripStorageService.saveTrip(tripData);

// Get all trips with pagination
const trips = await tripStorageService.getTrips(page, limit);

// Delete trip
await tripStorageService.deleteTrip(tripId);

// Refresh from backend
await tripStorageService.refreshTrips();
```

### Planner Context

Global state management for the trip planner:

```typescript
import { usePlanner } from './src/context/PlannerContext';

function MyComponent() {
  const { currentTrip, savedTrips, isGenerating, generateTrip, saveTrip, deleteTrip } =
    usePlanner();

  // Generate new trip
  await generateTrip(preferences);

  // Current trip is available immediately
  console.log(currentTrip);
}
```

### Related Components

**Planner-Specific Components:**

- `EnhancedItineraryCard` - Rich trip card with all details
- `ItineraryList` - Scrollable list of trips
- `ItineraryItem` - Individual activity item
- `BudgetBreakdown` - Visual budget split by category
- `ConfidenceIndicator` - AI confidence level display
- `InterestSelector` - Interest preference picker
- `DaySelector` - Trip duration selector
- `PaceSelector` - Trip pace selector
- `PreferenceSummaryBanner` - Shows selected preferences
- `PreferenceTag` - Individual preference tag

## 🪝 Custom Hooks

RoamCeylon includes a collection of custom React hooks for common functionality:

### useApiFetch

Hook for API data fetching with loading and error states.

```typescript
import { useApiFetch } from './src/hooks/useApiFetch';

function MyComponent() {
  const { data, loading, error, refetch } = useApiFetch('/api/destinations');

  if (loading) return <Loader />;
  if (error) return <ErrorState message={error} />;

  return <View>{/* Render data */}</View>;
}
```

**Features:**

- Automatic loading states
- Error handling
- Refetch capability
- TypeScript support

### usePagination

Hook for implementing pagination logic.

```typescript
import { usePagination } from './src/hooks/usePagination';

function ListScreen() {
  const {
    data,
    loading,
    hasMore,
    loadMore,
    refresh,
  } = usePagination('/api/trips', { pageSize: 10 });

  return (
    <FlatList
      data={data}
      onEndReached={loadMore}
      onRefresh={refresh}
      refreshing={loading}
    />
  );
}
```

**Features:**

- Infinite scroll support
- Pull-to-refresh
- Configurable page size
- Loading states

### useDebounce

Hook for debouncing user input (e.g., search fields).

```typescript
import { useDebounce } from './src/hooks/useDebounce';

function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    // API call only fires after 500ms of no typing
    if (debouncedSearch) {
      searchAPI(debouncedSearch);
    }
  }, [debouncedSearch]);
}
```

### useFormState

Hook for managing form state and validation.

```typescript
import { useFormState } from './src/hooks/useFormState';

function FormScreen() {
  const { values, errors, handleChange, handleSubmit } = useFormState({
    initialValues: { name: '', email: '' },
    validate: values => {
      const errors = {};
      if (!values.email) errors.email = 'Email required';
      return errors;
    },
    onSubmit: values => {
      // Submit form
    },
  });
}
```

### useNetworkStatus

Hook for monitoring network connectivity.

```typescript
import { useNetworkStatus } from './src/hooks/useNetworkStatus';

function MyComponent() {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  if (!isConnected) {
    return <ErrorState message="No internet connection" />;
  }
}
```

### useInfiniteScroll

Hook for implementing infinite scroll with FlatList.

```typescript
import { useInfiniteScroll } from './src/hooks/useInfiniteScroll';

function InfiniteListScreen() {
  const {
    data,
    loading,
    loadMore,
    hasMore,
  } = useInfiniteScroll(fetchDataFunction);

  return (
    <FlatList
      data={data}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <LoadingFooter /> : null}
    />
  );
}
```

---

## 🌍 Context Providers

### AuthContext

Global authentication state (previously documented).

### LoadingContext

Global loading overlay for app-wide loading states.

```typescript
import { useLoading } from './src/context/LoadingContext';

function MyComponent() {
  const { showLoading, hideLoading } = useLoading();

  const handleAction = async () => {
    showLoading('Saving changes...');
    await apiCall();
    hideLoading();
  };
}
```

### MapContext

Shared state for map components.

```typescript
import { useMap } from './src/context/MapContext';

function MapScreen() {
  const { currentLocation, selectedLocation, setSelectedLocation } = useMap();
}
```

### PlannerContext

Trip planner state management (see AI Trip Planner section above).

````

---

## 🔐 Authentication

The app uses a global authentication context for state management.

### Using Auth Context

```typescript
import { useAuth } from './src/context/AuthContext';

function MyComponent() {
  const { isAuthenticated, login, logout } = useAuth();

  // Login with token
  await login('jwt-token-here');

  // Logout
  await logout();

  // Check status
  if (isAuthenticated) {
    // User is logged in
  }
}
````

### Token Storage

- Tokens are securely stored using **Expo SecureStore**
- Automatically persisted across app restarts
- Cleared on logout

---

## 🌐 API Integration & Services

RoamCeylon includes 7 specialized services for different features.

### API Service (`api.ts`)

The base Axios HTTP client with automatic token injection:

```typescript
import { apiService } from './src/services/api';

// GET request
const data = await apiService.get('/users/profile');

// POST request
const response = await apiService.post('/bookings', {
  destination: 'Sigiriya',
  date: '2024-12-10',
});

// PUT request
await apiService.put('/users/profile', { name: 'John' });

// DELETE request
await apiService.delete('/bookings/123');
```

### Request Interceptors

- **Auth Token**: Automatically adds `Authorization: Bearer <token>` to all requests
- **Error Handling**: Handles 401 errors and auto-logout on token expiration

### Base Configuration

```typescript
// Default API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.roamceylon.com';

// Request timeout
timeout: 10000; // 10 seconds
```

### Auth Service (`auth.ts`)

Handles authentication and user profile management:

```typescript
import { authService } from './src/services/auth';

// Send OTP
await authService.sendOTP(phoneNumber);

// Verify OTP
const { token, user } = await authService.verifyOTP(phoneNumber, otp);

// Update profile
await authService.updateProfile({ name, email });

// Get current user
const user = await authService.getCurrentUser();
```

### Marketplace API Service (`marketplaceApi.ts`)

Manages marketplace operations:

```typescript
import { marketplaceApi } from './src/services/marketplaceApi';

// Get categories
const categories = await marketplaceApi.getCategories();

// Get products by category
const products = await marketplaceApi.getProductsByCategory(categoryId);

// Get product details
const product = await marketplaceApi.getProductDetails(productId);
```

### Planner API Service (`plannerApiService.ts`)

Backend API for trip planning data:

```typescript
import { plannerApiService } from './src/services/plannerApiService';

// Save trip
await plannerApiService.saveTrip(tripData);

// Get all trips
const trips = await plannerApiService.getTrips(page, limit);

// Get trip by ID
const trip = await plannerApiService.getTripById(tripId);

// Delete trip
await plannerApiService.deleteTrip(tripId);
```

### Transport Service (`transportService.ts`)

Transport and ride booking operations:

```typescript
import { transportService } from './src/services/transportService';

// Get nearby drivers
const drivers = await transportService.getNearbyDrivers(location);

// Book ride
const booking = await transportService.bookRide({
  pickupLocation,
  dropoffLocation,
  driverId,
});

// Get ride status
const status = await transportService.getRideStatus(rideId);

// Cancel ride
await transportService.cancelRide(rideId);
```

### Trip Storage Service (`tripStorageService.ts`)

Local storage and caching for trips:

```typescript
import { tripStorageService } from './src/services/tripStorageService';

// Save trip (local + backend sync)
await tripStorageService.saveTrip(tripData);

// Get all trips with pagination
const { trips, hasMore } = await tripStorageService.getTrips(page, limit);

// Delete trip (local + backend)
await tripStorageService.deleteTrip(tripId);

// Refresh from backend
await tripStorageService.refreshTrips();

// Clear local cache
await tripStorageService.clearCache();
```

**Features:**

- Dual storage (AsyncStorage + Backend)
- Automatic sync
- Offline support
- Pagination
- Cache management

---

## 🎨 UI Components

The app includes a comprehensive library of 25 reusable UI components for consistent design across screens.

### Core Components

#### Button Component

Three variants available: **primary**, **secondary**, and **outline**.

```typescript
import { Button } from './src/components';

// Primary button (default)
<Button title="Continue" onPress={handlePress} />

// Secondary button
<Button title="Cancel" variant="secondary" onPress={handleCancel} />

// Outline button
<Button title="Learn More" variant="outline" onPress={handleLearnMore} />

// Loading state
<Button title="Submit" loading={isLoading} onPress={handleSubmit} />

// Disabled state
<Button title="Submit" disabled onPress={handleSubmit} />
```

#### Input Component

Text input with error state support.

```typescript
import { Input } from './src/components';

// Basic input
<Input
  placeholder="Enter your name"
  value={name}
  onChangeText={setName}
/>

// Input with error
<Input
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
  error="Invalid email format"
/>

// Phone input
<Input
  placeholder="+94 XX XXX XXXX"
  keyboardType="phone-pad"
  value={phone}
  onChangeText={setPhone}
/>
```

#### Card Component

Container component for content grouping.

```typescript
import { Card } from './src/components';

// Static card
<Card>
  <Text>Card content here</Text>
</Card>

// Clickable card
<Card onPress={handleCardPress}>
  <Text>Tap me!</Text>
</Card>

// Custom styled card
<Card style={{ backgroundColor: '#f0f8ff' }}>
  <Text>Custom background</Text>
</Card>
```

### Loading & State Components

#### Loader Component

Loading spinner with customization options.

```typescript
import { Loader } from './src/components';

// Small loader
<Loader size="small" />

// Large loader
<Loader size="large" />

// Loader with text
<Loader text="Loading data..." />

// Custom color
<Loader color="#0066CC" text="Please wait..." />
```

#### LoadingState Component

Full-screen loading state.

```typescript
import { LoadingState } from './src/components';

<LoadingState message="Loading your trips..." />
```

#### LoadingFooter Component

Loading indicator for list pagination.

```typescript
import { LoadingFooter } from './src/components';

<FlatList
  data={items}
  ListFooterComponent={loading ? <LoadingFooter /> : null}
/>
```

#### ErrorState Component

Error display with retry option.

```typescript
import { ErrorState } from './src/components';

<ErrorState
  message="Failed to load data"
  onRetry={handleRetry}
/>
```

#### EmptyState Component

Placeholder for empty lists.

```typescript
import { EmptyState } from './src/components';

<EmptyState
  title="No trips yet"
  message="Start planning your first trip!"
  icon="✈️"
/>
```

#### EndOfListIndicator Component

Indicator for end of paginated lists.

```typescript
import { EndOfListIndicator } from './src/components';

<FlatList
  data={items}
  ListFooterComponent={!hasMore ? <EndOfListIndicator /> : null}
/>
```

### Layout Components

#### AuthLayout Component

Consistent layout wrapper for authentication screens.

```typescript
import { AuthLayout } from './src/components';

<AuthLayout title="Welcome Back">
  {/* Your auth screen content */}
</AuthLayout>
```

### Trip Planner Components

#### EnhancedItineraryCard Component

Rich card displaying full trip details with budget, itinerary, and confidence indicators.

```typescript
import { EnhancedItineraryCard } from './src/components';

<EnhancedItineraryCard
  trip={tripData}
  onPress={() => navigation.navigate('TripDetails', { tripId })}
  onDelete={handleDelete}
/>
```

#### ItineraryList & ItineraryItem Components

Scrollable list of trip activities.

```typescript
import { ItineraryList, ItineraryItem } from './src/components';

<ItineraryList itinerary={tripData.itinerary} />

// Or individual items
<ItineraryItem
  day={1}
  activity="Visit Sigiriya Rock Fortress"
  time="9:00 AM"
  cost={5000}
/>
```

#### BudgetBreakdown Component

Visual breakdown of trip costs by category.

```typescript
import { BudgetBreakdown } from './src/components';

<BudgetBreakdown
  budget={{
    accommodation: 25000,
    transport: 15000,
    food: 10000,
    activities: 8000,
  }}
/>
```

#### InterestSelector Component

Multi-select interest picker for trip preferences.

```typescript
import { InterestSelector } from './src/components';

<InterestSelector
  selected={selectedInterests}
  onChange={setSelectedInterests}
  options={['Culture', 'Adventure', 'Food', 'Nature', 'History']}
/>
```

#### DaySelector Component

Trip duration selector (1-14 days).

```typescript
import { DaySelector } from './src/components';

<DaySelector
  value={days}
  onChange={setDays}
  min={1}
  max={14}
/>
```

#### PaceSelector Component

Trip pace preference selector.

```typescript
import { PaceSelector } from './src/components';

<PaceSelector
  value={pace}
  onChange={setPace}
  options={['relaxed', 'moderate', 'fast-paced']}
/>
```

#### PreferenceSummaryBanner Component

Displays selected trip preferences summary.

```typescript
import { PreferenceSummaryBanner } from './src/components';

<PreferenceSummaryBanner
  destination="Kandy"
  days={5}
  budget={50000}
  interests={['Culture', 'Nature']}
  pace="moderate"
/>
```

#### PreferenceTag Component

Individual preference tag/chip.

```typescript
import { PreferenceTag } from './src/components';

<PreferenceTag label="Culture" onRemove={handleRemove} />
```

#### ConfidenceIndicator Component

Displays AI confidence level for generated plans.

```typescript
import { ConfidenceIndicator } from './src/components';

<ConfidenceIndicator confidence={0.85} />
// Shows: 🟢 85% confidence
```

### Transport Components

#### DriverInfoCard Component

Driver details card for transport booking.

```typescript
import { DriverInfoCard } from './src/components';

<DriverInfoCard
  driver={{
    name: 'Kumara Silva',
    rating: 4.8,
    vehicle: 'Toyota Prius',
    plate: 'WP ABC-1234',
    photo: driverPhotoUrl,
  }}
  onCall={handleCall}
  onMessage={handleMessage}
/>
```

#### DriverMarker Component

Map marker component for driver locations.

```typescript
import { DriverMarker } from './src/components';

<DriverMarker
  coordinate={driverLocation}
  driverId={driver.id}
  onPress={handleDriverSelect}
/>
```

#### RideTimeline Component

Ride status timeline showing pickup, in-progress, and drop-off.

```typescript
import { RideTimeline } from './src/components';

<RideTimeline
  status="in-progress"
  pickupTime="2:30 PM"
  dropoffTime="3:15 PM"
  currentStep={2}
/>
```

---

## 🔔 Toast Notifications

The app uses `react-native-toast-message` for user feedback with a custom utility wrapper.

### Toast Utility

```typescript
import { showToast } from './src/utils/toast';

// Success toast
showToast.success('Profile updated successfully!', 'Success');

// Error toast
showToast.error('Failed to save changes', 'Error');

// Info toast
showToast.info('New features available', 'Info');

// API error handling (automatic)
try {
  await apiService.post('/endpoint', data);
} catch (error) {
  showToast.apiError(error); // Automatically formats API errors
}
```

### Toast Features

- **Automatic API Error Handling**: The API service automatically shows toast notifications for failed requests
- **Network Error Detection**: Special handling for network connectivity issues
- **Status Code Messages**: User-friendly messages for 400, 401, 403, 404, 500 errors
- **Custom Fallback**: Generic error message when specific error info is unavailable

### Toast Configuration

Toast messages appear at the top of the screen and auto-dismiss after 3 seconds. They're integrated throughout the app for:

- Authentication flow (OTP sent, verification success/failure)
- Profile updates
- API errors
- Network connectivity issues

---

## 🛡️ Error Handling

### Error Boundary

The app includes an `ErrorBoundary` component that catches React errors and prevents app crashes.

```typescript
import { ErrorBoundary } from './src/components';

// Wrap your app or specific components
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

The ErrorBoundary:

- Catches JavaScript errors in child components
- Displays a user-friendly error screen
- Logs error details for debugging
- Prevents the entire app from crashing

### Global API Error Handling

The API service includes automatic error handling:

- **401 Unauthorized**: Auto-logout and token cleanup
- **Network Errors**: User-friendly "No internet connection" message
- **Toast Notifications**: Automatic error display to users
- **Error Logging**: Console logging for debugging (console.error preserved)

---

## 📦 Key Dependencies

### Navigation & UI

- `@react-navigation/native` - Navigation framework
- `@react-navigation/stack` - Stack navigator
- `react-native-screens` - Native navigation performance
- `react-native-safe-area-context` - Safe area management
- `react-native-gesture-handler` - Gesture system
- `expo-status-bar` - Status bar component
- `expo-navigation-bar` - Navigation bar customization
- `expo-linear-gradient` - Gradient components
- `react-native-toast-message` - Toast notifications for user feedback

### API & Storage

- `axios` - HTTP client
- `expo-secure-store` - Secure token storage
- `@react-native-async-storage/async-storage` - Local data persistence
- `expo-constants` - Environment variable support

### Date & Time

- `@react-native-community/datetimepicker` - Date and time picker components

### Network & Connectivity

- `@react-native-community/netinfo` - Network status monitoring

### Maps & Location

- `@rnmapbox/maps` - Mapbox SDK for interactive maps
  - ⚠️ Requires custom native build (not available in Expo Go)
- `expo-location` - Location services

### Development

- `typescript` - Type safety
- `@types/react` - React type definitions
- `eslint` - Code linting
- `prettier` - Code formatting
- `expo-dev-client` - Custom development builds

---

## 📜 Available Scripts

```bash
# Development
npm start          # Start Expo dev server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser

# Code Quality
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

---

## 🎨 Screens Overview

### Auth Screens

| Screen           | Description           | Navigation     |
| ---------------- | --------------------- | -------------- |
| **Splash**       | Brand introduction    | → Welcome      |
| **Welcome**      | Onboarding            | → PhoneEntry   |
| **PhoneEntry**   | Enter phone number    | → OTP          |
| **OTP**          | Verify OTP code       | → ProfileSetup |
| **ProfileSetup** | Complete user profile | → Home         |

### Main Screens

| Screen                      | Description          | Features                                          |
| --------------------------- | -------------------- | ------------------------------------------------- |
| **Home**                    | Dashboard            | Quick access to all features                      |
| **Explore**                 | Destinations         | Browse tourist attractions                        |
| **MarketplaceHome**         | Shop categories      | Browse product categories                         |
| **MarketplaceCategory**     | Products by category | View products, filter, navigate to details        |
| **ProductDetails**          | Product information  | View product details, pricing, description        |
| **AITripPlanner**           | AI trip planning     | Generate personalized itineraries with AI         |
| **SavedTrips**              | Saved trips list     | View, manage, and delete saved trips              |
| **TripPlannerForm**         | Trip preferences     | Input destination, budget, interests, preferences |
| **Transport**               | Ride booking home    | Browse drivers, view map, book rides              |
| **TransportLocationPicker** | Location selection   | Pick pickup and drop-off locations                |
| **TransportStatus**         | Active ride tracking | Real-time ride status, driver info, timeline      |
| **MapScreen**               | Interactive map      | Mapbox integration showing Sri Lanka              |
| **Profile**                 | User settings        | Profile edit, logout                              |

---

## 🗺️ Mapbox Integration

### Overview

The app integrates **Mapbox** for interactive maps in the Transport screen. The implementation includes:

- ✅ Interactive map of Sri Lanka
- ✅ Custom center coordinates (7.8731°N, 80.7718°E)
- ✅ Graceful fallback UI when Mapbox is unavailable
- ✅ Environment-based configuration

### Configuration

**1. Environment Variable**

Add your Mapbox access token to `.env`:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```

**2. Mapbox Config**

Configuration is in `src/config/mapbox.config.ts`:

```typescript
export const MAPBOX_CONFIG = {
  accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  defaultStyle: 'mapbox://styles/mapbox/streets-v12',
  defaultCenter: {
    latitude: 7.8731, // Sri Lanka center
    longitude: 80.7718,
  },
  defaultZoom: 7,
};
```

### Important: Native Build Requirement

⚠️ **Mapbox requires native code and will NOT work in Expo Go.**

**In Expo Go:**

- Shows placeholder UI with "Map Coming Soon" message
- No crashes or errors
- Graceful fallback behavior

**In Custom Builds:**

- Shows live interactive Mapbox map
- Full map functionality (pan, zoom, markers)
- Production-ready

### Testing the Map

**Option 1: EAS Build (Recommended - No Android Studio)**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build development APK
eas build --profile development --platform android
```

Download the APK and install on your Android device to see the live map.

**Option 2: Local Development Build**

```bash
# Android (requires Android Studio)
npx expo run:android

# iOS (requires Xcode, Mac only)
npx expo run:ios
```

### Map Features

- **Location**: Centered on Sri Lanka
- **Style**: Streets view (customizable)
- **Markers**: Default pin at Sri Lanka center
- **Overlay**: "Sri Lanka - Explore the Island" info card
- **Interactive**: Pan, zoom, rotate gestures

### Getting a Mapbox Token

1. Visit [mapbox.com](https://mapbox.com)
2. Create a free account
3. Go to Account → Tokens
4. Create a new access token
5. Add to `.env` file

> **Production Note**: Create a separate production token before deploying

---

## 🚧 Future Enhancements

- [x] **Mapbox Integration** - ✅ Implemented in Transport screen
- [x] **AI Trip Planner** - ✅ Implemented with AI
- [x] **Trip Storage** - ✅ Implemented with AsyncStorage + Backend sync
- [x] **Enhanced Transport** - ✅ Location picker and ride status tracking
- [ ] **Real OTP** - Backend integration for SMS verification
- [ ] **Push Notifications** - Booking confirmations, trip updates
- [ ] **Offline Mode** - Enhanced offline support for saved trips
- [ ] **Payment Gateway** - Secure payment processing for bookings
- [ ] **Multi-language** - Sinhala, Tamil, English support
- [ ] **Dark Mode** - Theme switching
- [ ] **Real-time Tracking** - Live driver location updates
- [ ] **Social Features** - Share trips with friends
- [ ] **Reviews & Ratings** - User reviews for destinations and services

---

## 🧪 Testing

### Manual Testing

1. **Expo Go** - Quick testing on real devices
2. **Android Emulator** - Test Android-specific features
3. **iOS Simulator** - Test iOS-specific features (Mac only)

### Testing Flow

1. Start dev server: `npm start`
2. Scan QR code with Expo Go
3. Navigate through app screens
4. Test authentication flow
5. Verify API calls (check terminal logs)

---

## 🐛 Troubleshooting

### Common Issues

**Metro bundler cache issues**

```bash
npx expo start --clear
```

**Dependency problems**

```bash
rm -rf node_modules
npm install
```

**Port already in use**

```bash
# Kill process on port 8081 (Metro bundler)
npx expo start --port 8082
```

**Web version blank screen**

- Use mobile (Expo Go/Android/iOS) instead
- Web support has some React Native compatibility limitations

**Mapbox shows placeholder instead of map**

- Expected behavior in Expo Go (no native code support)
- Build a custom development build to see the live map:
  ```bash
  eas build --profile development --platform android
  ```
- Or use local build: `npx expo run:android`

---

## 📚 Resources

### Documentation

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

### Expo SDK

- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [expo-status-bar](https://docs.expo.dev/versions/latest/sdk/status-bar/)

### Backend API

- API Documentation: `http://localhost:3000/api` (when backend is running)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Lint your code: `npm run lint`
4. Format your code: `npm run format`
5. Test on multiple platforms
6. Submit a pull request

---

## 📄 Tech Stack

- **Framework**: React Native 0.81.5
- **Runtime**: Expo SDK 54
- **Language**: TypeScript 5.9
- **UI Library**: React Native core components + Custom component library (25 components)
- **State Management**: React Context API (4 contexts: Auth, Loading, Map, Planner)
- **Navigation**: React Navigation 7
- **HTTP Client**: Axios 1.13
- **Storage**:
  - Expo SecureStore (authentication tokens)
  - AsyncStorage (local trip data, preferences)
- **Maps**: Mapbox GL JS (via @rnmapbox/maps 10.2)
- **Notifications**: React Native Toast Message 2.3
- **Error Handling**: Custom ErrorBoundary component
- **Location**: Expo Location
- **Network Monitoring**: NetInfo
- **Date/Time**: DateTimePicker
- **UI Enhancements**: Linear Gradient, Navigation Bar
- **Custom Hooks**: 6 hooks (useApiFetch, usePagination, useDebounce, useFormState, useNetworkStatus, useInfiniteScroll)
- **Development**: Expo Dev Client for custom builds

---

## 💡 Development Tips

1. **Use Expo Go** for fastest development iteration
2. **Check terminal logs** for API request/response data
3. **Use React Developer Tools** for debugging
4. **Test on real devices** for best performance assessment
5. **Keep dependencies updated** for security and features

---

**Built with ❤️ for Sri Lanka tourism**
