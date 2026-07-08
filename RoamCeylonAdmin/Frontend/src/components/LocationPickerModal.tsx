import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
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
}

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

export default function LocationPickerModal({
  visible,
  onClose,
  onConfirm,
  initialCoordinate,
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedCoord, setSelectedCoord] = useState<[number, number] | null>(
    initialCoordinate ?? null,
  );
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressName, setAddressName] = useState<string>(
    'Select a location on the map',
  );
  const [fallbackAddress, setFallbackAddress] = useState('');

  const centerCoordinate: [number, number] = selectedCoord ??
    initialCoordinate ?? [
      MAPBOX_CONFIG.defaultCenter.longitude,
      MAPBOX_CONFIG.defaultCenter.latitude,
    ];

  useEffect(() => {
    if (visible) {
      setSelectedCoord(initialCoordinate ?? null);
      setAddressName(
        initialCoordinate ? 'Saved location' : 'Select a location on the map',
      );
    }
  }, [visible, initialCoordinate]);

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
    } catch (e) {
      setAddressName(`Lat: ${coords[1].toFixed(4)}, Lng: ${coords[0].toFixed(4)}`);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleMapPress = async (feature: any) => {
    if (!feature?.geometry?.coordinates) return;
    const coords = feature.geometry.coordinates as [number, number];
    setSelectedCoord(coords);
    await reverseGeocode(coords);
  };

  const handleConfirm = () => {
    if (!MapboxGL && fallbackAddress) {
      onConfirm(fallbackAddress, [0, 0]);
      return;
    }
    if (selectedCoord) {
      onConfirm(addressName, selectedCoord);
    }
  };

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

          <Text style={styles.fallbackSubtitle}>
            Interactive map is unavailable on this device. Pick a location below
            or type it.
          </Text>

          <Text style={styles.fallbackLabel}>Popular Locations</Text>
          <View style={styles.pillContainer}>
            {FALLBACK_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.fallbackPill,
                  fallbackAddress === loc && styles.fallbackPillActive,
                ]}
                onPress={() => setFallbackAddress(loc)}
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

          <Text style={styles.fallbackLabel}>Or enter a custom address</Text>
          <TextInput
            style={styles.fallbackInput}
            placeholder="e.g. Cinnamon Grand, Colombo"
            value={fallbackAddress}
            onChangeText={setFallbackAddress}
          />

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !fallbackAddress && styles.confirmBtnDisabled,
              { marginBottom: Math.max(insets.bottom, 20) },
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
            zoomLevel={selectedCoord ? 14 : MAPBOX_CONFIG.defaultZoom}
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

        {/* Top Header */}
        <View
          style={[
            styles.header,
            { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 20 },
          ]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pick Location</Text>
          <View style={{ width: 44 }} />
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
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
    marginBottom: 24,
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
