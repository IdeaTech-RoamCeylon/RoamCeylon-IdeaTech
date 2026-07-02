# RoamCeylon Admin — Frontend

The **RoamCeylon Admin** app is a cross-platform (Android / iOS / Web) admin panel for tourism-industry partners in Sri Lanka. Built with [Expo](https://expo.dev) (SDK 54) and [React Native](https://reactnative.dev/), it allows Hotel Managers, Activity Providers, Shop Partners, and Tour Guides to manage their listings, bookings, and business operations from a single mobile app.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Expo SDK 54, React Native 0.81, React 19 |
| **Language** | TypeScript 5.9 (strict mode) |
| **Routing** | Expo Router v6 — file-based routing with typed routes |
| **Auth / BaaS** | [Nhost](https://nhost.io/) (GraphQL, Auth, Storage) + Google Sign-In |
| **Maps** | Mapbox GL via `@rnmapbox/maps`, `react-native-maps` |
| **Secure Storage** | `expo-secure-store` for tokens |
| **Image Handling** | `expo-image` (optimised), `expo-image-picker` |
| **Date Picker** | `@react-native-community/datetimepicker` |
| **Animations** | `react-native-reanimated` v4, animated splash overlay |
| **Styling** | React Native `StyleSheet`, `expo-linear-gradient`, light/dark theme system |
| **Build / Deploy** | EAS Build (`eas.json`) — development, preview, production profiles |

---

## Project Structure

```
Frontend/
├── src/
│   ├── app/                    # Expo Router file-based routes
│   │   ├── _layout.tsx         # Root layout — ThemeProvider, AuthGuard, splash
│   │   ├── index.tsx           # Entry redirect
│   │   ├── login.tsx           # Login route
│   │   ├── register.tsx        # Registration route
│   │   ├── home.tsx            # Post-login landing page
│   │   ├── activities/         # Activity Provider routes (13 screens)
│   │   ├── booking/            # Hotel Manager routes (14 screens)
│   │   ├── notifications/      # Shared notifications route
│   │   ├── shopping/           # Shop Partner routes (9 screens)
│   │   └── tour-guide/         # Tour Guide routes (17 screens)
│   │
│   ├── screens/                # Screen components (business logic & UI)
│   │   ├── Auth/               # Login, Register, Partner role selection,
│   │   │                       #   Email verification, Password reset,
│   │   │                       #   Google Sign-In, Business verification,
│   │   │                       #   Edit profile, Change password
│   │   ├── Booking/            # Hotel dashboard, Room CRUD, Calendar,
│   │   │                       #   Booking management, Guest details/messages,
│   │   │                       #   Hotel details, Settings
│   │   ├── Activities/         # Activities dashboard, Active activities,
│   │   │                       #   New/Update activity, Bookings, Daily schedule,
│   │   │                       #   Analytics, Finance, Reviews, Settings
│   │   ├── Notifications/      # Shared notifications screen
│   │   ├── Shopping/           # Shop dashboard, Add/Edit shop,
│   │   │                       #   Pending/Total shop views, Settings
│   │   ├── Tour Guide/         # Tour dashboard, Packages CRUD, Bookings,
│   │   │                       #   Inquiries (Active/Pending), Analytics,
│   │   │                       #   Revenue, Insights, Notifications,
│   │   │                       #   Tourist details, Settings
│   │   └── HomeScreen.tsx      # Placeholder partner home screen
│   │
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 #   └── collapsible.tsx
│   │   ├── animated-icon.tsx   # Animated splash overlay (native + web)
│   │   ├── app-tabs.tsx        # Tab bar component (native + web)
│   │   ├── themed-text.tsx     # Theme-aware Text wrapper
│   │   ├── themed-view.tsx     # Theme-aware View wrapper
│   │   ├── external-link.tsx   # Safe external link opener
│   │   └── web-badge.tsx       # Web platform badge
│   │
│   ├── config/
│   │   └── nhostClient.ts      # Nhost SDK singleton (in-memory session storage)
│   │
│   ├── constants/
│   │   └── theme.ts            # Colors (light/dark), Fonts, Spacing tokens
│   │
│   ├── hooks/
│   │   ├── use-theme.ts        # Returns current theme colors
│   │   └── use-color-scheme.ts # Color scheme detection (native + web)
│   │
│   ├── types/
│   │   └── navigation.types.ts # AuthStack param list type definitions
│   │
│   ├── utils/
│   │   ├── notificationsStore.ts # Global notification state, polling & useNotifications hook
│   │   └── toast.ts            # Cross-platform toast helper (Alert.alert fallback)
│   │
│   └── global.css              # CSS custom properties for web fonts
│
├── assets/                     # App icons, splash images, favicon
├── app.json                    # Expo config (scheme: roamceylonadmin)
├── eas.json                    # EAS Build profiles
├── metro.config.js             # Metro bundler — path alias (@/ → src/) & watch folders
├── tsconfig.json               # TypeScript config — strict, path aliases
├── package.json                # Dependencies & scripts
└── .env                        # Environment variables (see below)
```

---

## Features by Partner Role

### 🔐 Authentication (All Roles)
- Email + password login via Nhost
- Google Sign-In (`@react-native-google-signin/google-signin`)
- User registration with partner role selection
- Email verification flow
- Password reset (request link → enter new password)
- Token-based auth guard on protected routes (`expo-secure-store`)
- Business verification screen
- Profile editing & password change

### 🏨 Hotel Manager (`/booking`)
- **Dashboard** — Today's check-ins, occupancy overview
- **Room Management** — Add, edit, and view rooms
- **Availability Calendar** — Visual date-based availability
- **Booking Management** — View and manage reservations
- **Guest Details & Messages** — Guest info and communication
- **Hotel Details** — Property information management
- **Settings** — Account and hotel configuration

### 🎯 Activity Provider (`/activities`)
- **Dashboard** — Active listings, bookings count, revenue metrics
- **Active Activities** — Searchable list of currently active activity listings
- **Activity CRUD** — Create and update activities (with date/time picker)
- **Bookings** — Activity booking management
- **Daily Schedule** — Day-by-day activity planner
- **Analytics** — Performance metrics and trends
- **Finance** — Revenue and payment tracking
- **Reviews** — Customer feedback management
- **Settings** — Account configuration

### 🛍️ Shop Partner (`/shopping`)
- **Dashboard** — Shop stats, live shop listing with API integration
- **Shop CRUD** — Add and edit shop listings (with image picker)
- **Pending Shops** — View shops awaiting approval
- **Total Shops** — Browse all registered shops
- **Settings** — Account and shop configuration

### 🧭 Tour Guide (`/tour-guide`)
- **Dashboard** — Tour stats, active packages, booking overview
- **Package CRUD** — Create and edit tour packages
- **Bookings** — Tour booking management
- **Inquiries** — Active and pending inquiry management
- **Analytics & Insights** — Performance data and business insights
- **Revenue** — Earnings and payment tracking
- **Notifications** — In-app notification center (shared module, see below)
- **Tourist Details** — Individual tourist info view
- **Map Integration** — Open directions in Apple/Google Maps
- **Settings** — Account configuration

### 🔔 Notifications (Shared — `/notifications`)
- **Notification Center** — Unified screen for all in-app notifications
- **Global Store** — `notificationsStore.ts` manages state globally with a pub/sub pattern
- **Module Filtering** — `useNotifications(module)` hook filters by `'activity'`, `'shopping'`, or `'guide'`
- **Real-time Polling** — Auto-refreshes every 15 seconds
- **Mark Read** — Mark individual or all notifications as read (optimistic updates)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli` (optional; `npx expo` works too)
- For native builds: [EAS CLI](https://docs.expo.dev/build/introduction/) — `npm install -g eas-cli`
- Android Studio / Xcode for emulator/simulator (or use [Expo Go](https://expo.dev/go) for quick testing)

### Environment Variables

Create a `.env` file in the project root with:

```env
EXPO_PUBLIC_API_URL=<backend-api-url>
EXPO_PUBLIC_NHOST_SUBDOMAIN=<nhost-project-subdomain>
EXPO_PUBLIC_NHOST_REGION=<nhost-region>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<google-oauth-client-id>
```

### Installation & Running

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npx expo start
   ```

   From the output you can open the app in:
   - [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go)

3. **Run on a specific platform**

   ```bash
   npm run android    # Run on Android emulator/device
   npm run ios        # Run on iOS simulator/device
   npm run web        # Run in the browser
   ```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `start` | `expo start` | Start the Expo dev server |
| `android` | `expo run:android` | Build & run on Android |
| `ios` | `expo run:ios` | Build & run on iOS |
| `web` | `expo start --web` | Start web dev server |
| `lint` | `expo lint` | Run ESLint |
| `reset-project` | `node ./scripts/reset-project.js` | Reset to a blank project |

---

## Build & Deploy (EAS)

The project is configured with [EAS Build](https://docs.expo.dev/build/introduction/) via `eas.json`:

| Profile | Purpose | Distribution |
|---|---|---|
| `development` | Dev client with dev tools | Internal |
| `preview` | Testing build for QA | Internal |
| `production` | Store-ready build | Auto-increment versioning |

```bash
# Build for development
eas build --profile development --platform android

# Build for production
eas build --profile production --platform all
```

---

## Path Aliases

The project uses TypeScript path aliases configured in both `tsconfig.json` and `metro.config.js`:

| Alias | Maps to |
|---|---|
| `@/*` | `./src/*` |
| `@/assets/*` | `./assets/*` |

Example: `import { nhost } from '@/config/nhostClient';`

---

## Theming

The app supports **light and dark modes** (follows system preference) with a custom theme system:

- **Colors** — Defined in `src/constants/theme.ts` (`Colors.light` / `Colors.dark`)
- **Fonts** — Platform-specific font stacks (iOS system fonts, web CSS variables)
- **Spacing** — Consistent spacing scale (4px base unit)
- **Hooks** — `useTheme()` returns the current color palette, `useColorScheme()` detects the active scheme
- **Components** — `ThemedText` and `ThemedView` automatically adapt to the current theme

---

## Authentication Flow

```
Splash Screen
    │
    ├─→ Login Screen
    │       ├─→ Email + Password → Home
    │       ├─→ Google Sign-In → Home
    │       ├─→ Forgot Password → Password Reset → Link Sent → Enter New Password
    │       └─→ Register → Partner Role Selection → Email Verification → Login
    │
    └─→ AuthGuard (on protected routes)
            └─→ Checks SecureStore for auth token → Redirects to Login if missing
```

---

## License

See [LICENSE](./LICENSE) for details.
