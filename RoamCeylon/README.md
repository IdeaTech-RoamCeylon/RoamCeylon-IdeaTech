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
│   ├── navigation/              # Navigation configuration
│   │   ├── AuthStack.tsx        # Auth flow navigation
│   │   ├── MainStack.tsx        # Main app navigation
│   │   └── RootNavigator.tsx    # Root navigation container
│   │
│   ├── screens/                 # Screen components
│   │   ├── SplashScreen.tsx
│   │   ├── WelcomeScreen.tsx
│   │   ├── PhoneEntryScreen.tsx
│   │   ├── OTPScreen.tsx
│   │   ├── ProfileSetupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ExploreScreen.tsx
│   │   ├── MarketplaceScreen.tsx
│   │   ├── TransportScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── services/                # API and business logic
│   │   ├── api.ts               # Axios HTTP client
│   │   └── auth.ts              # Authentication service
│   │
│   ├── context/                 # React Context providers
│   │   └── AuthContext.tsx      # Global auth state
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

## 📦 Key Dependencies

### Navigation & UI

- `@react-navigation/native` - Navigation framework
- `@react-navigation/stack` - Stack navigator
- `react-native-screens` - Native navigation performance
- `react-native-safe-area-context` - Safe area management
- `react-native-gesture-handler` - Gesture system
- `expo-status-bar` - Status bar component

### API & Storage

- `axios` - HTTP client
- `expo-secure-store` - Secure token storage

### Development

- `typescript` - Type safety
- `@types/react` - React type definitions
- `eslint` - Code linting
- `prettier` - Code formatting

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

| Screen          | Description    | Features                              |
| --------------- | -------------- | ------------------------------------- |
| **Home**        | Dashboard      | Quick access to all features          |
| **Explore**     | Destinations   | Map view (Mapbox integration planned) |
| **Marketplace** | Local products | Shopping experience                   |
| **Transport**   | Ride booking   | Tuk-tuks, taxis, tours                |
| **Profile**     | User settings  | Profile edit, logout                  |

---

## 🚧 Future Enhancements

- [ ] **Mapbox Integration** - Interactive maps in Explore screen
- [ ] **Real OTP** - Backend integration for SMS verification
- [ ] **Push Notifications** - Booking confirmations, updates
- [ ] **Offline Mode** - Cache data for offline access
- [ ] **Payment Gateway** - Secure payment processing
- [ ] **Multi-language** - Sinhala, Tamil, English support
- [ ] **Dark Mode** - Theme switching

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
- **UI Library**: React Native core components
- **State Management**: React Context API
- **Navigation**: React Navigation 6
- **HTTP Client**: Axios
- **Storage**: Expo SecureStore

---

## 💡 Development Tips

1. **Use Expo Go** for fastest development iteration
2. **Check terminal logs** for API request/response data
3. **Use React Developer Tools** for debugging
4. **Test on real devices** for best performance assessment
5. **Keep dependencies updated** for security and features

---

**Built with ❤️ for Sri Lanka tourism**
