# 🌴 RoamCeylon Mobile App

A comprehensive tourism and local services mobile app for Sri Lanka, built with [React Native](https://reactnative.dev/) (Expo SDK 54). RoamCeylon provides AI-powered trip planning, location-based exploration, marketplace shopping, transport booking, hotel reservations, and emergency services — all from a single app.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for quick testing on mobile)
- Android Studio or Xcode (optional, for emulators)

### Installation

`ash
# Install dependencies
npm install

# Start the development server
npm start
`

### Running the App

Once the dev server starts, you have several options:

- **📱 Expo Go (Recommended)**
  - Install "Expo Go" app from App Store or Play Store
  - Scan the QR code displayed in terminal
  - App loads instantly on your phone

- **🤖 Android**
  - Press  in terminal
  - Requires Android Studio with emulator installed

- **🍎 iOS**
  - Press i in terminal (Mac only)
  - Requires Xcode with iOS simulator

- **🌐 Web**
  - Press w in terminal
  - Note: Some React Native features may have limitations on web

---

## 📄 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Expo SDK 54, React Native 0.81, React 19 |
| **Language** | TypeScript 5.9 (strict mode) |
| **Navigation** | React Navigation v7 (Stack Navigator) |
| **Auth / BaaS** | [Nhost](https://nhost.io/) (Auth, Storage) + Google Sign-In |
| **Maps** | Mapbox GL v10.19 via @rnmapbox/maps |
| **Location** | expo-location (fine + coarse GPS) |
| **HTTP Client** | Axios with interceptors (auto-auth, token refresh, retry) |
| **Secure Storage** | expo-secure-store (auth tokens), @react-native-async-storage/async-storage (data) |
| **Networking** | @react-native-community/netinfo (online/offline detection) |
| **Date Picker** | @react-native-community/datetimepicker |
| **Notifications** | eact-native-toast-message |
| **Styling** | React Native StyleSheet, expo-linear-gradient |
| **Build / Deploy** | EAS Build (eas.json) — development, preview, production profiles |
| **New Architecture** | React Native New Architecture enabled |

---

## 📁 Project Structure

`
RoamCeylon/
├── App.tsx                        # Root component — providers, navigator, toast
├── index.ts                       # Entry point (Expo registerRootComponent)
│
├── src/
│   ├── navigation/                # Navigation configuration
│   │   ├── RootNavigator.tsx      # Root — AuthProvider, deep linking, auth guard
│   │   ├── AuthStack.tsx          # Auth flow (10 screens)
│   │   └── MainStack.tsx          # Main app (27 screens)
│   │
│   ├── screens/                   # All screen components
│   │   ├── auth/                  # Authentication screens
│   │   ├── home/                  # Main dashboard
│   │   ├── explore/               # Discover & browse
│   │   ├── planner/               # AI Trip Planner
│   │   ├── marketplace/           # Shopping & marketplace
│   │   ├── hotel/                 # Hotel booking
│   │   ├── transport/             # Transport / ride-hailing
│   │   ├── emergency/             # Emergency services
│   │   └── Settings/              # User settings
│   │
│   ├── components/                # Reusable UI components (26 files)
│   ├── context/                   # React Context providers
│   ├── services/                  # API & business logic services
│   ├── hooks/                     # Custom React hooks
│   ├── config/                    # App configuration
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   └── data/                      # Static/mock data
│
├── assets/                        # App icon, splash, favicon
├── app.json                       # Expo config (schemes, plugins, permissions)
├── eas.json                       # EAS Build profiles
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config
├── .env.example                   # Environment variable template
`

---

## 🧭 Navigation Map

`
App Launch
    │
    ├─→ Splash Screen (checks stored auth token)
    │
    ├─→ Auth Stack (if not authenticated or profile incomplete)
    │       ├── Welcome → Register → Email Verification
    │       ├── Login (email/password or Google)
    │       ├── Password Reset → Link Sent → Enter New Password
    │       ├── Google Sign-In
    │       └── Profile Setup
    │
    └─→ Main Stack (authenticated + profile complete)
            ├── Home (dashboard)
            ├── Explore → Activities → Activity Details
            │         → Tour Packages → Details → Booking
            ├── AI Planner → Welcome → Home → Chat → Trip Planner
            │             → Saved Trips → Planner Testing
            ├── Marketplace → Category → Product Details
            │              → Shop Details
            ├── Hotel Booking
            ├── Transport → Location Picker → Status
            ├── Emergency
            └── Settings → Personal Info / Change Password / Privacy Policy
`

---

## 🔐 Authentication

The app uses a global authentication context for state management.

- Email + password registration & login via Nhost
- Google Sign-In (OAuth)
- Profile setup flow (name, birthday, gender, local/tourist)
- Email verification with deep linking (oamceylon://verify-email)
- Password reset flow (request link → enter new password via deep link)
- Automatic token refresh (Axios interceptor retries on 401)
- Secure token storage (expo-secure-store)

---

## 🤖 AI Trip Planner

RoamCeylon includes a powerful AI-powered trip planning feature that helps users create personalized itineraries for Sri Lanka using custom modeled AI.

### Features

- **✨ AI-Powered Planning**: Uses custom AI to generate customized itineraries
- **🎯 Personalized**: Adapts to user preferences, interests, and budget
- **💾 Save & Manage**: Save trips locally and sync with backend
- **📊 Budget Breakdown**: Detailed cost estimation for trips
- **🗓️ Flexible Duration**: Plan trips from 1 to 30 days
- **⚡ Multiple Paces**: Choose relaxed, moderate, or fast-paced itineraries
- **🎨 Rich UI**: Beautiful cards with confidence indicators and detailed breakdowns
- **👍 Feedback System**: Submit thumbs-up/thumbs-down feedback on generated plans
- **🏅 Positive History Badge**: Activities on destinations you've previously rated ≥4 stars are highlighted with a "Based on your positive history" ✨ badge

### AI Service Integration

The trip planner uses the iService to communicate with AI:

`	ypescript
import { aiService } from './src/services/aiService';

// Generate trip itinerary
const itinerary = await aiService.generateTripItinerary({
  destination: 'Sigiriya',
  days: 5,
  budget: 50000,
  interests: ['culture', 'history', 'nature'],
  pace: 'moderate',
});
`

---

## 🌐 API Integration & Services

RoamCeylon includes 9 specialized services for different features.

### API Service (pi.ts)

The base Axios HTTP client with automatic token injection.
- **Request interceptor**: Auto-attaches Bearer token and user ID from SecureStore
- **Response interceptor**: Handles 401s with automatic token refresh via Nhost auth endpoint
- **Smart Retry**: etryWithBackoff in 
etworkUtils.ts retries only on transient failures (network errors, 5xx)

### Planner API Service (plannerApiService.ts)

Backend API for trip planning data (Save, load, delete trips, and submit feedback).

### Trip Storage Service (	ripStorageService.ts)

Dual storage (AsyncStorage + Backend) with automatic sync and offline support.

---

## 🪝 Custom Hooks

RoamCeylon includes a collection of custom React hooks for common functionality:

- useApiFetch: Hook for API data fetching with loading and error states.
- usePagination: Hook for implementing pagination logic (Pull-to-refresh, Load more).
- useInfiniteScroll: Hook for implementing infinite scroll with FlatList.
- useDebounce: Hook for debouncing user input (e.g., search fields).
- useFormState: Hook for managing form state and validation.
- useNetworkStatus: Hook for monitoring network connectivity.

---

## 🔔 Toast Notifications

The app uses eact-native-toast-message for user feedback with a custom utility wrapper.

`	ypescript
import { showToast } from './src/utils/toast';

showToast.success('Profile updated successfully!', 'Success');
`

---

## 🛡️ Error Handling

- **Error Boundary**: Catches JavaScript errors in child components and displays a user-friendly error screen.
- **Global API Error Handling**: Auto-logout on 401, network error detection, and toast notifications.

---

## 🗺️ Mapbox Integration

### Overview

The app integrates **Mapbox** for interactive maps in the Transport screen. 

⚠️ **Mapbox requires native code and will NOT work in Expo Go.**
In Expo Go, a graceful fallback UI is shown. To test the map, use an EAS build or local native build (
px expo run:android).

---

## 🔧 Configuration & Environment Variables

Copy .env.example to .env and fill in the values:

`env
# Backend API
EXPO_PUBLIC_API_URL=<backend-api-url>

# Mapbox (public access token, starts with 'pk.')
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=<mapbox-public-token>

# Nhost
EXPO_PUBLIC_NHOST_SUBDOMAIN=<nhost-project-subdomain>
EXPO_PUBLIC_NHOST_REGION=<nhost-region>

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<google-android-client-id>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<google-web-client-id>
`

> **Note:** The Mapbox download token (starts with sk.) is configured separately in eas.json under the development build environment.

---

## 🚧 Future Enhancements

- [x] **Mapbox Integration** - ✅ Implemented in Transport screen
- [x] **AI Trip Planner** - ✅ Implemented with AI
- [x] **Trip Storage** - ✅ Implemented with AsyncStorage + Backend sync
- [x] **Enhanced Transport** - ✅ Location picker and ride status tracking
- [x] **Feedback Submission** - ✅ 1–5 star rating stored in PlannerFeedback table
- [x] **Feedback Influence** - ✅ Positive-history badge (✨) on activities for previously loved destinations
- [x] **Trust Score** - ✅ Per-user trust score weighted by recency via UserFeedbackSignal
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

## 🧪 Testing & Troubleshooting

### Testing Flow
1. Start dev server: 
pm start
2. Scan QR code with Expo Go
3. Test authentication and navigate through app screens

### Common Issues

**Metro bundler cache issues**
`ash
npx expo start --clear
`

**Port already in use**
`ash
# Kill process on port 8081 (Metro bundler)
npx expo start --port 8082
`

**Web version blank screen**
- Web support has some React Native compatibility limitations. Use mobile instead.

---

## 🔧 Recent Bug Fixes & Improvements

### Feedback Submission (Feb 2026)
- **Problem:** Feedback data was logged as submitted but never appeared in the database.
- **Fix:** Corrected payload structure and SQL extraction queries to use { rating: N } instead of bare numbers.

### Saved Trips Screen Crash (Feb 2026)
- **Problem:** TypeError: Cannot read property 'reduce' of undefined on opening Saved Trips.
- **Fix:** ilteredTrips pre-filters items ensuring 	ripPlan.itinerary is an array. Added optional chaining.

### AI Trip Planner Timeout (Feb 2026)
- **Fix:** Increased API timeout limits in interceptors (60s for AI endpoints, 30s for standard requests) to accommodate LLM processing latency.

### Smart Retry Logic (Feb 2026)
- **Fix:** Re-configured retry backoff to avoid retrying 4xx and 408 (Timeout) errors which are non-recoverable.

---

**Built with ❤️ for Sri Lanka tourism**