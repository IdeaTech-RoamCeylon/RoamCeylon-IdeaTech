# RoamCeylon Frontend Architecture Review
**Tag:** `frontend-v3.1-month3`
**Date:** 2026-03-09
**Scope:** Full frontend codebase audit — component structure, state management, rendering performance, and technical debt backlog.

---

## 1. Component Structure

### Screen Inventory

#### Auth Screens (`src/screens/auth/`)

| File | ~Lines | Purpose | SRP Notes |
|---|---|---|---|
| `SplashScreen.tsx` | ~80 | App launch logo/animation | Clean |
| `WelcomeScreen.tsx` | ~149 | Landing page with auth buttons | Minor — defines `AuthButton` inline instead of using shared `Button` |
| `PhoneEntryScreen.tsx` | ~100 | Phone number entry | Clean — uses `AuthLayout`, `Button`, `Input` |
| `OTPScreen.tsx` | ~120 | OTP verification | Clean — uses `AuthLayout`, `Button` |
| `ProfileSetupScreen.tsx` | ~287 | Post-auth profile creation | Moderate — handles form validation, date picking, and API submission together |

#### Home (`src/screens/home/`)

| File | ~Lines | Purpose | SRP Notes |
|---|---|---|---|
| `HomeScreen.tsx` | ~399 | Main dashboard | Moderate — renders a hardcoded non-functional bottom navigation bar inline (lines 161–181) that belongs in a navigator |

#### Explore (`src/screens/explore/`)

| File | ~Lines | Purpose | SRP Notes |
|---|---|---|---|
| `ExploreScreen.tsx` | ~73 | Placeholder stub | None — but reimplements `EmptyState` pattern rather than using the existing component |

#### Marketplace (`src/screens/marketplace/`)

| File | ~Lines | Purpose | SRP Notes |
|---|---|---|---|
| `MarketplaceHomeScreen.tsx` | ~221 | Category grid | Clean — uses `useApiFetch`, `LoadingState`, `ErrorState` |
| `MarketplaceCategoryScreen.tsx` | ~340 | Product list per category | Clean — uses `useApiFetch`, `LoadingState`, `ErrorState`, `EmptyState` |
| `ProductDetailsScreen.tsx` | ~515 | Product detail view | Moderate — seller card, features list, quantity stepper, size selector all inlined |

#### Planner (`src/screens/planner/`)

| File | ~Lines | Purpose | SRP Notes |
|---|---|---|---|
| `AIWelcomeScreen.tsx` | ~80 | AI onboarding intro | Clean |
| `AIHomeScreen.tsx` | ~200 | AI hub screen | Minor — duplicates `user?.name \|\| 'Traveler'` from `HomeScreen` |
| `TripPlannerForm.tsx` | ~120 | Form input panel | Clean — correctly extracted |
| `AITripPlannerScreen.tsx` | **~860** | AI trip generation + results | **Severe SRP violation** — see detailed breakdown below |
| `SavedTripsScreen.tsx` | ~404 | Saved trip list + search | Moderate — handles search, load, delete, and context wiring together |
| `AIPlannerTestingScreen.tsx` | **~1049** | Internal ranking comparison tool | **Risk — internal dev tool accessible to all users in production** |
| `AIChat.tsx` | ~180 | Chat interface | Minor |

#### Transport (`src/screens/transport/`)

| File | ~Lines | Purpose | SRP Notes |
|---|---|---|---|
| `TransportScreen.tsx` | ~397 | Ride booking with map embed | Moderate — distance calc, fare estimation, ride type selection, and map render in one file |
| `TransportLocationPickerScreen.tsx` | ~317 | Location search/selection | Clean |
| `MapScreen.tsx` | ~355 | Mapbox map renderer | Moderate — doubles as a "Coming Soon" stub when Mapbox is unavailable |
| `TransportStatusScreen.tsx` | ~369 | Active ride tracker | Minor — manual `ActivityIndicator` when `LoadingState` exists |

#### Profile (`src/screens/profile/`)

| File | ~Lines | Purpose | SRP Notes |
|---|---|---|---|
| `ProfileScreen.tsx` | ~168 | User profile view | Minor — normalizes `user` with `as any` casts; `UserProfile` type does not match real API response shape |

---

### AITripPlannerScreen — Detailed Breakdown

At ~860 lines, this single file manages **10+ distinct concerns:**

1. Form input collection — controlled by `TripPlannerForm` but parent holds all state
2. AI plan generation — API call, loading state, error handling
3. Itinerary rendering — day selection, activity list display
4. Activity editing — move up/down and delete with `useCallback` handlers
5. Mapbox map panel — lazy-loaded SDK with toggle button
6. Save dialog — a `Modal` with its own `TextInput` and save logic
7. Feedback collection — thumbs up/down UI + negative reasons picker
8. Analytics event firing via `analyticsService`
9. Network connectivity check via `useNetworkStatus`
10. Context info modal (`showContextInfo` state)

**Hook count:**
- `useState` × 12
- `useCallback` × 9+
- `useMemo` × 6
- `useRef` × 3
- `useEffect` × 2

Natural extraction candidates: `SaveTripModal`, `FeedbackPanel`, `ActivityMapView`

---

### AIPlannerTestingScreen — Production Risk

A 1049-line internal testing screen is accessible to all users via a floating button hardcoded in `HomeScreen.tsx` lines 183–189:

```tsx
{/* Internal AI Testing Button - Dev Only */}
<TouchableOpacity
  style={styles.devTestButton}
  onPress={() => handleNavigate('AIPlannerTesting')}
>
  <MaterialCommunityIcons name="test-tube" size={20} color="#FFFFFF" />
</TouchableOpacity>
```

There is no `__DEV__` guard or build flag around this button. The screen computes internal ranking score breakdowns, tracks render counts, and renders detailed comparison tables — developer tooling that should not be in a production bundle.

---

### Shared Components Inventory (`src/components/`)

| Component | Purpose | Adoption |
|---|---|---|
| `Button` | Styled pressable | Auth screens only |
| `Input` | Styled text input | Auth screens only |
| `Card` | White rounded shadow container | `HomeScreen` only |
| `Loader` | Full-screen overlay loader | `LoadingContext` only (never called) |
| `LoadingState` | Inline activity indicator + text | Marketplace screens only |
| `ErrorState` | Error message + retry button | Marketplace screens only |
| `EmptyState` | Empty data state card | `SavedTripsScreen` only |
| `ErrorBoundary` | React error boundary | App root |
| `AuthLayout` | Auth screen wrapper | `PhoneEntryScreen`, `OTPScreen` |
| `DaySelector` | Tab row for planner days | `AITripPlannerScreen` |
| `ItineraryList` | Day's activity list | `AITripPlannerScreen` |
| `BudgetBreakdown` | Budget summary block | `AITripPlannerScreen` |
| `EnhancedItineraryCard` | Single activity card | `AITripPlannerScreen` |
| `RideTimeline` | Ride status progress | `TransportStatusScreen` |
| `DriverInfoCard` | Driver details panel | `TransportStatusScreen` |
| `InterestSelector` | Multi-select interest chips | `TripPlannerForm` |
| `PaceSelector` | Pace option selector | `TripPlannerForm` |
| `PreferenceSummaryBanner` | User preference summary | `AITripPlannerScreen` |
| `PreferenceTag` | Individual tag chip | `EnhancedItineraryCard` |
| `ConfidenceIndicator` | AI confidence display | `EnhancedItineraryCard` |

General-purpose components (`LoadingState`, `ErrorState`, `EmptyState`, `Card`) exist but are inconsistently adopted outside of the marketplace domain.

---

## 2. State Management

### Context Inventory (`src/context/`)

#### AuthContext (~107 lines)

Manages: `isAuthenticated`, `isLoading`, `user`, `isProfileComplete`
Provides: `login`, `logout`, `refreshUser`, `updateUserProfile`, `setUser`

**Strengths:** All callbacks are `useCallback`-memoized. Provider value is `useMemo`'d. Minimal unnecessary re-renders.

**Issues:**
- `isProfileComplete` derivation (`!!(userData?.name && userData?.email)`) is duplicated identically in `refreshUser` and `updateUserProfile`. If the rule changes, it must be updated in two places.
- Raw `setUser` is exposed in the context interface — callers can overwrite `user` without triggering `isProfileComplete` recalculation, leaving context state internally inconsistent.
- `ProfileScreen` accesses `(user as any)?.data?.phoneNumber` and `(user as any)?.data?.firstName` — the declared `UserProfile` type does not match the real API response shape.

---

#### LoadingContext (~43 lines)

Manages: global `isLoading` boolean + optional `message` string for a full-screen overlay.

**Issue: Dead infrastructure.** `LoadingContext` was built as a global loading solution but is never called. Seven screens independently manage their own loading state:

| Screen | Pattern |
|---|---|
| `ProfileScreen` | Manual `ActivityIndicator` |
| `SavedTripsScreen` | Manual `ActivityIndicator` |
| `TransportStatusScreen` | Manual `ActivityIndicator` |
| `MapScreen` | `const [isLoading, setIsLoading] = useState(true)` |
| `AITripPlannerScreen` | `const [isLoading, setIsLoading] = useState(false)` |
| `AIPlannerTestingScreen` | `const [isLoading, setIsLoading] = useState(false)` |
| `TripPlannerForm` | Receives `isLoading` as prop |

Resolution: Either adopt `LoadingContext` across all screens or remove it.

---

#### MapContext (~48 lines)

Manages: `userLocation`, `drivers`, `isMapboxConfigured`

**Issues:**
- All three state values are exposed as raw `React.Dispatch` setters — any component can overwrite `drivers` directly. No domain-level encapsulation.
- `isMapboxConfigured` is stored in context but `MapScreen` also derives this independently via its own `try/catch` block at module scope. Two sources of truth that can diverge.
- `drivers` is initialized from `../../data/mockDrivers` at the context level — not fetched from a real API.

---

#### PlannerContext (~215 lines)

Manages: `query`, `tripPlan`, `currentTripId`, `isEditing`

**Strengths:** AsyncStorage persistence with 500ms debounce, error recovery clears corrupted data, `startEditing`/`stopEditing` are good domain-level actions.

**Issues:**
- `AITripPlannerScreen` has 12 local `useState` hooks layered on top. `error` and `isLoading` for plan generation duplicate what `LoadingContext` was designed to centralize.
- `SavedTripsScreen` loads the trips list into local component state, re-fetching on every visit. No caching at the context or service layer.
- `setQuery` and `setTripPlan` are exposed directly — external code can partially update state without validation. `AITripPlannerScreen` calls `setQuery` with spread-merge patterns rather than typed action creators.

---

### Context vs. Local State Duplication

| Concern | In Context | Also in Local Component State |
|---|---|---|
| Global loading indicator | `LoadingContext.isLoading` | 7 screens independently |
| Map configuration | `MapContext.isMapboxConfigured` | `MapScreen` module-level try/catch |
| User name | `AuthContext.user.name` | Derived locally in both `HomeScreen` and `AIHomeScreen` |

---

## 3. Rendering Performance

### HomeScreen

**Good practices:** `React.memo` on export, `useCallback` on all handlers, `useMemo` on `ListHeaderComponent`, `keyExtractor` on FlatList, `renderItem` memoized.

**Gaps:**
- `getItemLayout` absent — 4-item fixed-height grid; providing it would eliminate measurement passes on initial render (low impact but trivially fixable)
- `removeClippedSubviews` not set
- `TextInput` search bar (lines 110–115) is completely uncontrolled — no `onChangeText`, no state, purely decorative
- Footer nav buttons (Activities, Notification, Settings) have no `onPress` handlers — dead UI

---

### AITripPlannerScreen

#### No Virtualization

The outer shell is a plain `ScrollView` (L512). Activities are rendered via `.map()` inside a `View` — **not a FlatList**. Every card for every day is mounted simultaneously. `removeClippedSubviews`, `keyExtractor`, and `getItemLayout` are all irrelevant because there is no FlatList. For multi-day itineraries this causes measurable layout and paint overhead.

#### Inline Functions Per Activity Card (lines 768–781)

```tsx
activities.map((activity, index) => (
  <EnhancedItineraryCard
    onPress={() => setSelectedActivity(activity)}
    onMoveUp={() => handleMoveActivity(index, 'up')}
    onMoveDown={() => handleMoveActivity(index, 'down')}
    onDelete={() => handleDeleteActivity(index)}
  />
))
```

4 new function references per card, per render. `EnhancedItineraryCard`'s `React.memo` wrapper is **completely negated** by this pattern.

#### Other Inline Handlers in JSX (17 total)

| Line | Code |
|---|---|
| L515 | `onPress={() => navigation.goBack()}` |
| L540 | `onPress={() => setUseSavedContext(!useSavedContext)}` |
| L611 | `onPress={() => handleFeedback(true)}` |
| L622 | `onPress={() => handleFeedback(false)}` |
| L641 | `onPress={() => toggleReason(reason)}` (inside `.map()`) |
| L652 | `onPress={() => { setFeedbackState('none'); setSelectedReasons([]); }}` |
| L685 | `onPress={() => setShowSaveDialog(true)}` |
| L708 | `onSelectDay={(day) => { setSelectedDay(day); setSelectedActivity(null); }}` |
| L816 | `onRequestClose={() => setShowSaveDialog(false)}` |

---

## 4. Custom Hooks Analysis (`src/hooks/`)

### useDebounce — No Issues
Standard, correct implementation. Cleans up timeout on change. No unstable references.

### useFormState — Minor Issue
`handleSetValue` has `[error]` in its `useCallback` dependency array. Every time `error` changes, `handleSetValue` gets a new reference. If passed to a memoized child, clearing or setting an error will cascade a re-render. Fix: use a functional state updater that does not depend on `error`.

### useNetworkStatus — Unstable Return Value
`updateNetworkStatus` is defined outside `useEffect`, creating a new function reference on every render. The hook returns `networkStatus` as a plain object — any component consuming it passes new object references to children on every network event. `AITripPlannerScreen` uses `networkStatus.isConnected`, triggering a full re-render of the planner on every connectivity change.

### useApiFetch — Stale Closure Bug
`fetchData` callback (returned as `refetch`) lists `[showSuccessToast, successMessage, showErrorToast, errorMessage]` as dependencies but **is missing `fetchFn`**. `refetch` always calls the `fetchFn` from the first render.

The `autoFetch` `useEffect` (lines 91–118) also duplicates the entire fetch flow from `fetchData` rather than calling it, creating a second stale closure on `fetchFn`, `showSuccessToast`, `successMessage`, `showErrorToast`, and `errorMessage`. The `hasFetchedRef` guard prevents repeated calls in practice, but the initial auto-fetch uses stale values if options are provided via variables.

### usePagination — Reference Cascade
`loadPage` depends on `[fetchFunction, pageSize, onError]`. If callers pass `fetchFunction` as an inline arrow, `loadPage` is recreated on every render, cascading into `loadMore`, `refresh`, and `retry`. Well-guarded against duplicate requests via `isLoadingRef` but is a design-level concern.

### useInfiniteScroll — Inherits Reference Instability
`onEndReached` depends on `[enabled, isLoading, onLoadMore]`. If `onLoadMore` is `loadMore` from `usePagination` and that function is unstable, `onEndReached` is also recreated each render.

---

## 5. Services Architecture

### api.ts — Singleton, Correct
Single `ApiService` instance exported at module level. Axios instance and interceptors created once in constructor. Stable reference. No issues.

### aiService.ts — Singleton with Shallow Cache
Singleton exported as `new AIService()`. Has a 1-entry request cache keyed by `JSON.stringify`. Cache prevents redundant network calls.

**Note:** `getMockCoordinates` (lines 138–145) uses `Math.random()` to generate map marker positions. Result is baked into the cached response. New requests generate entirely different random coordinates, causing map markers to jump unpredictably between plan generations.

### analyticsService.ts — Proper Singleton
Uses `private static instance` + `getInstance()` pattern. `logEvent` is a no-op stub serving as an integration point for a future analytics provider. No performance concerns.

### tripStorageService.ts — Permanent Fallback Risk
The `useBackend` flag (line 23) is mutable instance state. When any backend call fails, it is permanently set to `false` for the entire session with no mechanism to retry when connectivity is restored. A single transient network failure silently degrades all subsequent trip operations to local-only mode.

### plannerApiService.ts — Object Literal with Module-Level Cache
Exported as a stable plain object literal. Uses module-level `tripsCache` and `cacheTimestamp` with a 1-minute TTL. Cache correctly invalidated on `saveTrip`, `updateTrip`, `deleteTrip`.

**Issue:** `getTripById` calls `this.getSavedTrips()` (fetches all trips) then uses `.find()`. If cache is cold, makes a full backend fetch to retrieve one trip. A dedicated `GET /planner/:id` endpoint would be more efficient.

### marketplaceApi.ts — Client-Side Pagination Anti-Pattern
`getProducts` (lines 60–68):
```typescript
const products = this.unwrap(response); // ALL products returned by backend
const paginatedData = products.slice(startIndex, endIndex); // Client-side slice
```
Every "load more" call downloads the entire product catalog. This worsens linearly with catalog size and needs server-side pagination.

### transportService.ts — Demo Logic in Production
`getActiveRide` (lines 56–85) auto-initializes a fake ride session with a 120-second cycle on first call if the backend returns null. No `__DEV__` guard. Users will see a fake ride status cycling through states if the real backend is unavailable.

---

## 6. Code Duplication

### Android Navigation Bar Hiding (5 files)
Identical `useEffect` block in every auth screen:
```tsx
useEffect(() => {
  if (Platform.OS === 'android') {
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('inset-swipe');
  }
}, []);
```
**Files:** `WelcomeScreen`, `PhoneEntryScreen`, `OTPScreen`, `ProfileSetupScreen`, `SplashScreen`
**Fix:** Extract to a `useHideNavigationBar()` custom hook or into `AuthLayout`.

### Manual Back-Button Header Row (6 files)
Six screens define their own header row with `← Back`, `paddingTop: 60` for status bar clearance, and near-identical styles:

- `AITripPlannerScreen.tsx`
- `SavedTripsScreen.tsx`
- `TransportLocationPickerScreen.tsx`
- `TransportStatusScreen.tsx`
- `ProductDetailsScreen.tsx`
- `MarketplaceCategoryScreen.tsx`

**Fix:** Extract to a shared `ScreenHeader` component.

### Inline "Coming Soon" Placeholder (5 files)
Identical visual pattern (large emoji + bold title + grey subtitle) recreated in 5 screens despite `EmptyState` existing for exactly this:

- `ExploreScreen.tsx`
- `MarketplaceHomeScreen.tsx`
- `MarketplaceCategoryScreen.tsx`
- `ProductDetailsScreen.tsx`
- `MapScreen.tsx`

Each file also duplicates a `StyleSheet` block with `placeholderText` (fontSize 64), `placeholderTitle` (fontSize 20), `placeholderSubtitle` (fontSize 14).

### Shadow Style Declarations (17 files)
Shadow properties (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`) are manually declared in every screen's `StyleSheet` instead of composing with the existing `<Card>` component.

### User Name Derivation (2 files)
```tsx
// HomeScreen.tsx L68
const userName = user?.name || 'Traveler';
// AIHomeScreen.tsx L16
const userName = user?.name || 'Traveler';
```

### useApiFetch Not Adopted Consistently
Used correctly in marketplace screens; absent in `TransportStatusScreen`, `SavedTripsScreen`, `AITripPlannerScreen` which use manual try/catch/finally patterns instead.

---

## 7. Technical Debt Backlog

### Critical

| # | Area | File | Issue |
|---|---|---|---|
| 1 | Monolithic screen | `screens/planner/AITripPlannerScreen.tsx` | 860-line file across 10 concerns — extract `SaveTripModal`, `FeedbackPanel`, `ActivityMapView` |
| 2 | No list virtualization | `AITripPlannerScreen.tsx` L512/L768 | `ScrollView` + `.map()` — replace activity list with `FlatList` + `keyExtractor` + `getItemLayout` |
| 3 | Inline functions per card | `AITripPlannerScreen.tsx` L768–781 | 4 inline handlers per `EnhancedItineraryCard` negate `React.memo` — wrap in stable `useCallback` refs |
| 4 | `useApiFetch` stale closure | `hooks/useApiFetch.ts` L89 | `fetchFn` missing from `fetchData` deps — `refetch` always calls first-render function |

### High

| # | Area | File | Issue |
|---|---|---|---|
| 5 | Dead context | `context/LoadingContext.tsx` | Never called by any screen — adopt across all 7 manual-loading screens or remove |
| 6 | Dev tool in production | `screens/home/HomeScreen.tsx` L183–189 | `AIPlannerTestingScreen` accessible to all users with no `__DEV__` guard |
| 7 | Duplicate nav bar effect | 5 auth screen files | `NavigationBar.setVisibilityAsync` duplicated — extract to `useHideNavigationBar()` hook |
| 8 | Duplicate header row | 6 screen files | Manual `← Back` header with `paddingTop: 60` duplicated — extract to `ScreenHeader` component |
| 9 | Permanent backend fallback | `services/tripStorageService.ts` L23/55 | Single error permanently disables backend for the session with no recovery path |

### Medium

| # | Area | File | Issue |
|---|---|---|---|
| 10 | `EmptyState` not adopted | `ExploreScreen.tsx` + 4 others | Inline placeholder pattern duplicated — use `<EmptyState />` |
| 11 | `LoadingState`/`ErrorState` not adopted | `ProfileScreen`, `SavedTripsScreen`, `TransportStatusScreen` | Manual `ActivityIndicator` blocks — shared components exist |
| 12 | `useApiFetch` not adopted | `TransportStatusScreen`, `SavedTripsScreen`, `AITripPlannerScreen` | Manual try/catch/finally — `useApiFetch` exists for this |
| 13 | Client-side pagination | `services/marketplaceApi.ts` L60–68 | Full product list fetched on every page request — needs server-side pagination |
| 14 | `useFormState` re-render on error | `hooks/useFormState.ts` L59 | `handleSetValue` recreated on every error state change due to `[error]` dep |
| 15 | `usePagination` reference cascade | `hooks/usePagination.ts` L102 | Inline `fetchFunction` callers cause full callback recreation each render |
| 16 | Demo ride in production | `services/transportService.ts` L56–59 | Demo ride auto-initializer runs with no `__DEV__` guard |
| 17 | `MapContext` raw setters | `context/MapContext.tsx` | All state exposed as raw `React.Dispatch` — no domain-level encapsulation |
| 18 | Shadow style duplication | 17 screen files | Repeated shadow `StyleSheet` block — compose with `<Card>` instead |

### Low / Refinement

| # | Area | File | Issue |
|---|---|---|---|
| 19 | `UserProfile` type mismatch | `screens/profile/ProfileScreen.tsx` | `as any` casts to access data — type does not match API response shape |
| 20 | `AuthContext` raw `setUser` | `context/AuthContext.tsx` | Bypasses `isProfileComplete` recalculation |
| 21 | `isProfileComplete` duplication | `context/AuthContext.tsx` | Derivation logic copied in `refreshUser` and `updateUserProfile` |
| 22 | `userName` derivation duplication | `HomeScreen`, `AIHomeScreen` | `user?.name \|\| 'Traveler'` — identical line in two screens |
| 23 | `getTripById` full-fetch | `services/plannerApiService.ts` L162 | Fetches all trips then `.find()`s — no dedicated by-ID endpoint |
| 24 | Mapbox eager import | `navigation/MainStack.tsx` L13 | Importing `AITripPlannerScreen` triggers Mapbox `require` at app startup |
| 25 | Uncontrolled search input | `screens/home/HomeScreen.tsx` L110 | `TextInput` has no `onChangeText` or state — purely decorative |
| 26 | `useApiFetch` duplicate fetch logic | `hooks/useApiFetch.ts` | Auto-fetch `useEffect` duplicates all fetch logic instead of calling `fetchData` |
| 27 | Mock coordinate jitter | `services/aiService.ts` L138 | `Math.random()` coordinates baked into cache — markers jump between plan generations |

---

## 8. Navigation Architecture

```
RootNavigator (wraps AuthProvider)
  Navigation (reads useAuth)
    NavigationContainer
      RootStack.Navigator  [@react-navigation/stack]
        AuthStack          OR      MainStack
        (5 screens flat)           (14 screens flat)
```

- All navigation is stack-based push/pop — no nested Tab navigator, no persisted/cached screen complications.
- Screens remain mounted while navigating forward (standard stack behavior).
- All 14 `MainStack` screen imports are eager — module-level code (including Mapbox `require`) runs at app startup regardless of which screens are visited.
- No `detachInactiveScreens` configuration.

---

## 9. Release Tag

| Tag | Commit | Notes |
|---|---|---|
| `frontend-release-v3.0` | `cb1b435` | Stabilization — experimental toggles removed, debug artifacts cleaned, `optimized_v1` locked |
| `frontend-v3.1-month3` | `cb1b435` | Stable UI baseline for Month 3 — architecture review captured |

Push tags to remote:
```bash
git push origin frontend-release-v3.0
git push origin frontend-v3.1-month3
```

---

## 10. Recommended Month 4 Priorities

1. **Break up `AITripPlannerScreen`** — Extract `SaveTripModal`, `FeedbackPanel`, and `ActivityMapView` as standalone components. This is the single highest-leverage refactor.
2. **Virtualize the activity list** — Replace `ScrollView` + `.map()` with a `FlatList`. Fix the inline handler pattern at lines 768–781 with stable `useCallback` refs so `React.memo` on `EnhancedItineraryCard` is effective.
3. **Fix `useApiFetch` stale closure** — Add `fetchFn` to the `fetchData` dependency array.
4. **Gate `AIPlannerTestingScreen`** — Wrap the dev button in `HomeScreen` with `{__DEV__ && ...}` or remove from the production bundle.
5. **Adopt or remove `LoadingContext`** — The infrastructure exists; either wire it into the 7 independent loading screens or delete it.
