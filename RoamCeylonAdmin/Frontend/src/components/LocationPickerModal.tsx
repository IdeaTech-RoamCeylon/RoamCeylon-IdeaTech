import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAPBOX_CONFIG } from '@/config/mapbox.config';

// Load the Mapbox SDK lazily so the app still runs (with a fallback UI) if the
// native module is unavailable.
let MapboxGL: any = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
  if (MAPBOX_CONFIG.accessToken) {
    MapboxGL.setAccessToken(MAPBOX_CONFIG.accessToken);
  }
} catch (error) {
  console.warn('Mapbox SDK not available', error);
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (address: string, coordinate: [number, number]) => void; // [lng, lat]
  /** Existing pin to center on, as [lng, lat]. */
  initialCoordinate?: [number, number] | null;
  /** Existing address text to display initially. */
  initialAddress?: string;
  /** Placeholder text for the location search input. */
  searchPlaceholder?: string;
}

interface SearchPlace {
  id: string;
  title: string;
  subtitle: string;
  fullAddress: string;
  coordinate: [number, number]; // [lng, lat]
  isAccommodation?: boolean;
}

const ACCOMMODATION_TYPES = new Set([
  'hotel',
  'resort',
  'guest_house',
  'hostel',
  'motel',
  'chalet',
  'apartment',
]);

const FALLBACK_LOCATIONS = [
  'Colombo City',
  'Negombo',
  'Kandy',
  'Galle / Unawatuna',
  'Sigiriya / Dambulla',
  'Ella',
  'Nuwara Eliya',
  'Mirissa',
];

function parseNominatimPlace(item: any): SearchPlace | null {
  const lat = parseFloat(item?.lat);
  const lon = parseFloat(item?.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const addr = item.address || {};
  const rawDisplay: string = item.display_name || '';
  const fallbackFirst = rawDisplay.split(',')[0]?.trim() || 'Selected Location';

  const title: string =
    item.name?.trim() ||
    addr.hotel ||
    addr.tourism ||
    addr.road ||
    fallbackFirst;

  const roadWithNumber =
    addr.house_number && addr.road
      ? `${addr.house_number} ${addr.road}`
      : addr.road;

  const rawParts = [
    roadWithNumber,
    addr.suburb || addr.neighbourhood,
    addr.city || addr.town || addr.village,
    addr.state_district || addr.state,
  ].filter(Boolean) as string[];

  const seen = new Set<string>([title.toLowerCase()]);
  const contextParts: string[] = [];
  for (const part of rawParts) {
    const normalized = part.trim();
    if (normalized && !seen.has(normalized.toLowerCase())) {
      seen.add(normalized.toLowerCase());
      contextParts.push(normalized);
    }
  }

  let subtitle = contextParts.join(', ');
  if (!subtitle && rawDisplay) {
    subtitle = rawDisplay
      .split(',')
      .slice(1)
      .map((s) => s.trim())
      .filter((s) => s && s.toLowerCase() !== 'sri lanka')
      .slice(0, 3)
      .join(', ');
  }

  const fullAddress = subtitle ? `${title}, ${subtitle}` : title;
  const isAccommodation =
    item.class === 'tourism' && ACCOMMODATION_TYPES.has(item.type);

  return {
    id: `nom-${item.place_id ?? `${lon}-${lat}`}`,
    title,
    subtitle,
    fullAddress,
    coordinate: [lon, lat],
    isAccommodation,
  };
}

async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<SearchPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const encoded = encodeURIComponent(trimmed);

  // 1. Try OpenStreetMap Nominatim (strong POI/hotel coverage across Sri Lanka)
  try {
    const nominatimUrl =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encoded}` +
      `&countrycodes=lk` +
      `&format=json` +
      `&limit=10` +
      `&addressdetails=1` +
      `&accept-language=en`;

    const res = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'RoamCeylonAdmin/1.0' },
      signal,
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const parsed = data
          .map(parseNominatimPlace)
          .filter((p): p is SearchPlace => p !== null);
        if (parsed.length > 0) return parsed;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
  }

  // 2. Fallback to Mapbox Geocoding API if configured
  if (MAPBOX_CONFIG.accessToken) {
    const mapboxUrl =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json` +
      `?country=LK&limit=8&access_token=${encodeURIComponent(MAPBOX_CONFIG.accessToken)}`;

    const res = await fetch(mapboxUrl, { signal });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.features)) {
        return data.features
          .map((f: any): SearchPlace | null => {
            const center = f?.center;
            if (!Array.isArray(center) || center.length < 2) return null;
            const title = f.text || f.place_name || 'Selected Location';
            const placeName: string = f.place_name || title;
            const subtitle = placeName.startsWith(`${title},`)
              ? placeName.slice(title.length + 1).trim()
              : '';
            return {
              id: `mb-${f.id}`,
              title,
              subtitle,
              fullAddress: placeName,
              coordinate: [center[0], center[1]],
            };
          })
          .filter((p: SearchPlace | null): p is SearchPlace => p !== null);
      }
    }
  }

  return [];
}

export default function LocationPickerModal({
  visible,
  onClose,
  onConfirm,
  initialCoordinate,
  initialAddress,
  searchPlaceholder = 'Search hotel, place, or address...',
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const suppressNextSearchRef = useRef(false);

  const [selectedCoord, setSelectedCoord] = useState<[number, number] | null>(
    initialCoordinate ?? null,
  );
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressName, setAddressName] = useState<string>(
    'Select a location on the map',
  );
  const [fallbackAddress, setFallbackAddress] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const centerCoordinate: [number, number] = selectedCoord ??
    initialCoordinate ?? [
      MAPBOX_CONFIG.defaultCenter.longitude,
      MAPBOX_CONFIG.defaultCenter.latitude,
    ];

  useEffect(() => {
    if (visible) {
      suppressNextSearchRef.current = false;
      setSelectedCoord(initialCoordinate ?? null);
      setAddressName(
        initialAddress?.trim() ||
          (initialCoordinate ? 'Saved location' : 'Select a location on the map'),
      );
      setFallbackAddress(initialAddress?.trim() || '');
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setShowResults(false);
    }
  }, [visible, initialCoordinate, initialAddress]);

  const executeSearch = useCallback(
    async (query: string, signal?: AbortSignal) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchPlaces(trimmed, signal);
        if (!signal?.aborted) {
          setSearchResults(results);
          setHasSearched(true);
          setShowResults(true);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setSearchResults([]);
          setHasSearched(true);
        }
      } finally {
        if (!signal?.aborted) {
          setIsSearching(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      return;
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      setShowResults(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      executeSearch(trimmed, controller.signal);
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, executeSearch]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setShowResults(false);
  };

  const handleSelectPlace = (place: SearchPlace) => {
    Keyboard.dismiss();
    suppressNextSearchRef.current = true;
    setSearchQuery(place.title);
    setShowResults(false);
    setSelectedCoord(place.coordinate);
    setAddressName(place.fullAddress);
    setFallbackAddress(place.fullAddress);

    if (cameraRef.current?.setCamera) {
      cameraRef.current.setCamera({
        centerCoordinate: place.coordinate,
        zoomLevel: 15,
        animationMode: 'flyTo',
        animationDuration: 1000,
      });
    }
  };

  const reverseGeocode = async (coords: [number, number]) => {
    setAddressLoading(true);
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: coords[1],
        longitude: coords[0],
      });
      if (result && result.length > 0) {
        const addr = result[0];
        const formatted = [addr.name, addr.street, addr.city, addr.region]
          .filter(Boolean)
          .join(', ');
        setAddressName(formatted || 'Unknown Location');
      } else {
        setAddressName('Unknown Location');
      }
    } catch {
      setAddressName(`Lat: ${coords[1].toFixed(4)}, Lng: ${coords[0].toFixed(4)}`);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleMapPress = async (feature: any) => {
    setShowResults(false);
    Keyboard.dismiss();
    if (!feature?.geometry?.coordinates) return;
    const coords = feature.geometry.coordinates as [number, number];
    setSelectedCoord(coords);
    await reverseGeocode(coords);
  };

  const handleConfirm = () => {
    if (!MapboxGL && fallbackAddress) {
      onConfirm(fallbackAddress, selectedCoord ?? [0, 0]);
      return;
    }
    if (selectedCoord) {
      onConfirm(addressName, selectedCoord);
    }
  };

  const renderSearchSection = (isOverlay: boolean) => (
    <View style={isOverlay ? styles.searchOverlayWrapper : styles.searchInlineWrapper}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#60646C" />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearchChange}
          onFocus={() => {
            if (searchQuery.trim().length >= 2 && (searchResults.length > 0 || hasSearched)) {
              setShowResults(true);
            }
          }}
          returnKeyType="search"
          onSubmitEditing={() => executeSearch(searchQuery)}
          autoCorrect={false}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color="#0E5E2F" />
        ) : searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={handleClearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {showResults && searchQuery.trim().length >= 2 && (
        <View style={styles.resultsDropdown}>
          {isSearching && searchResults.length === 0 ? (
            <View style={styles.emptyResultsRow}>
              <ActivityIndicator size="small" color="#0E5E2F" />
              <Text style={styles.emptyResultsText}>Searching places...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={styles.resultsList}
            >
              {searchResults.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.resultItem,
                    index === searchResults.length - 1 && styles.resultItemLast,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelectPlace(item)}
                >
                  <View style={styles.resultIconBadge}>
                    <Ionicons
                      name={item.isAccommodation ? 'bed-outline' : 'location-outline'}
                      size={18}
                      color="#0E5E2F"
                    />
                  </View>
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!!item.subtitle && (
                      <Text style={styles.resultSubtitle} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : hasSearched ? (
            <View style={styles.emptyResultsRow}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <Text style={styles.emptyResultsText}>
                No matching hotels or places found. Try another name.
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );

  // ── Fallback UI when the native Mapbox module is unavailable ───────────────
  if (!MapboxGL) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View
          style={[
            styles.fallbackContainer,
            { paddingTop: Platform.OS === 'ios' ? insets.top + 20 : 40 },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.fallbackBackBtn}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.fallbackTitle}>Select Location</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fallbackSubtitle}>
              Search for a hotel or place below, pick a popular area, or enter
              an address manually.
            </Text>

            {renderSearchSection(false)}

            <Text style={styles.fallbackLabel}>Popular Locations</Text>
            <View style={styles.pillContainer}>
              {FALLBACK_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[
                    styles.fallbackPill,
                    fallbackAddress === loc && styles.fallbackPillActive,
                  ]}
                  onPress={() => {
                    setFallbackAddress(loc);
                    setSelectedCoord(null);
                  }}
                >
                  <Text
                    style={[
                      styles.fallbackPillText,
                      fallbackAddress === loc && styles.fallbackPillTextActive,
                    ]}
                  >
                    {loc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fallbackLabel}>Selected / Custom Address</Text>
            <TextInput
              style={styles.fallbackInput}
              placeholder="e.g. Cinnamon Grand, Colombo"
              value={fallbackAddress}
              onChangeText={(text) => {
                setFallbackAddress(text);
                setSelectedCoord(null);
              }}
            />
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !fallbackAddress && styles.confirmBtnDisabled,
              { marginBottom: Math.max(insets.bottom, 20), marginTop: 12 },
            ]}
            disabled={!fallbackAddress}
            onPress={handleConfirm}
          >
            <LinearGradient
              colors={fallbackAddress ? ['#0F3D26', '#0E5E2F'] : ['#CCC', '#DDD']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.confirmBtnText}>Confirm Location</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // ── Map UI ─────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MAPBOX_CONFIG.defaultStyle}
          onPress={handleMapPress}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={selectedCoord ? 15 : MAPBOX_CONFIG.defaultZoom}
            centerCoordinate={centerCoordinate}
            animationMode="flyTo"
            animationDuration={1200}
          />
          {selectedCoord && (
            <MapboxGL.PointAnnotation id="selected-location" coordinate={selectedCoord}>
              <View style={styles.markerWrapper}>
                <View style={styles.pickupMarker} />
              </View>
            </MapboxGL.PointAnnotation>
          )}
        </MapboxGL.MapView>

        {/* Top Header + Search Overlay */}
        <View
          pointerEvents="box-none"
          style={[
            styles.topOverlay,
            { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : Math.max(insets.top, 20) },
          ]}
        >
          <View style={styles.header} pointerEvents="box-none">
            <TouchableOpacity style={styles.backBtn} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pick Location</Text>
            <View style={{ width: 44 }} />
          </View>

          {renderSearchSection(true)}
        </View>

        {/* Bottom Details Panel */}
        <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Text style={styles.panelLabel}>Selected Location</Text>
          <View style={styles.addressRow}>
            {addressLoading ? (
              <ActivityIndicator size="small" color="#0E5E2F" />
            ) : (
              <Ionicons name="location" size={20} color="#0E5E2F" />
            )}
            <Text style={styles.addressText} numberOfLines={2}>
              {addressName}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, !selectedCoord && styles.confirmBtnDisabled]}
            disabled={!selectedCoord || addressLoading}
            onPress={handleConfirm}
          >
            <LinearGradient
              colors={selectedCoord ? ['#0F3D26', '#0E5E2F'] : ['#CCC', '#DDD']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.confirmBtnText}>Confirm Location</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  map: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchOverlayWrapper: {
    marginTop: 12,
  },
  searchInlineWrapper: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    marginLeft: 10,
    marginRight: 8,
    height: '100%',
  },
  resultsDropdown: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 16,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  resultsList: {
    maxHeight: 240,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultItemLast: {
    borderBottomWidth: 0,
  },
  resultIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  resultSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyResultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  emptyResultsText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  panelLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginLeft: 12,
  },
  confirmBtn: {
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0E5E2F',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // Fallback UI
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  fallbackBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  fallbackLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  fallbackPill: {
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginRight: 10,
    marginBottom: 10,
  },
  fallbackPillActive: {
    backgroundColor: '#0E5E2F',
    borderColor: '#0E5E2F',
  },
  fallbackPillText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  fallbackPillTextActive: {
    color: '#FFF',
  },
  fallbackInput: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: '#111',
    marginTop: 8,
  },
});
