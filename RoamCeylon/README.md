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
│   ├── components/              # Reusable UI components
│   │   ├── Button.tsx           # Button component (primary, secondary, outline)
│   │   ├── Input.tsx            # Input component with error states
│   │   ├── Card.tsx             # Card component (clickable & static)
│   │   ├── Loader.tsx           # Loading spinner component
│   │   ├── ErrorBoundary.tsx    # Error boundary for crash handling
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
│   │   ├── transport/
│   │   │   ├── TransportScreen.tsx
│   │   │   └── MapScreen.tsx    # Mapbox integration with fallback
│   │   │
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   │
│   │   └── ComponentShowcaseScreen.tsx  # UI component demo
│   │
│   ├── services/                # API and business logic
│   │   ├── api.ts               # Axios HTTP client with interceptors
│   │   ├── auth.ts              # Authentication service
│   │   └── marketplaceApi.ts    # Marketplace API endpoints
│   │
│   ├── context/                 # React Context providers
│   │   └── AuthContext.tsx      # Global auth state management
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
│       └── mapbox.config.ts     # Mapbox settings
│
├── assets/                      # Images, fonts, etc.
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

```env
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Mapbox (optional - for maps feature)
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

> **Note:** Use `.env.example` as a template

### TypeScript Configuration

The app uses TypeScript for type safety. Configuration is in `tsconfig.json`.

### Code Quality

**ESLint** - Linting configuration

```bash
npm run lint
```

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
└── ProfileScreen      (User settings & logout)
```

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
```

### Token Storage

- Tokens are securely stored using **Expo SecureStore**
- Automatically persisted across app restarts
- Cleared on logout

---

## 🌐 API Integration

### API Service

The app uses Axios with automatic token injection:

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

---

## 🎨 UI Components

The app includes a library of reusable UI components for consistent design across screens.

### Button Component

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

### Input Component

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

### Card Component

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

### Loader Component

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

### Component Showcase

View all components in action on the **ComponentShowcaseScreen**. This screen demonstrates all component variants and states for easy testing and reference.

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
- `react-native-toast-message` - Toast notifications for user feedback

### API & Storage

- `axios` - HTTP client
- `expo-secure-store` - Secure token storage
- `expo-constants` - Environment variable support

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

| Screen                  | Description          | Features                                   |
| ----------------------- | -------------------- | ------------------------------------------ |
| **Home**                | Dashboard            | Quick access to all features               |
| **Explore**             | Destinations         | Browse tourist attractions                 |
| **MarketplaceHome**     | Categories           | Browse product categories                  |
| **MarketplaceCategory** | Products by category | View products, filter, navigate to details |
| **ProductDetails**      | Product information  | View product details, pricing, description |
| **Transport**           | Ride booking         | Interactive Mapbox map of Sri Lanka        |
| **Profile**             | User settings        | Profile edit, logout                       |
| **ComponentShowcase**   | UI component demo    | View all reusable components               |

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
- [ ] **Real OTP** - Backend integration for SMS verification
- [ ] **Push Notifications** - Booking confirmations, updates
- [ ] **Offline Mode** - Cache data for offline access
- [ ] **Payment Gateway** - Secure payment processing
- [ ] **Multi-language** - Sinhala, Tamil, English support
- [ ] **Dark Mode** - Theme switching
- [ ] **Map Features** - Destination markers, route planning

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
- **UI Library**: React Native core components + Custom component library
- **State Management**: React Context API
- **Navigation**: React Navigation 7
- **HTTP Client**: Axios 1.13
- **Storage**: Expo SecureStore
- **Maps**: Mapbox GL JS (via @rnmapbox/maps 10.2)
- **Notifications**: React Native Toast Message 2.3
- **Error Handling**: Custom ErrorBoundary component
- **Location**: Expo Location
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
