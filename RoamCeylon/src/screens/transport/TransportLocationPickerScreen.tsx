import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LocationSelection, MainStackParamList } from '../../types';
import { MAPBOX_CONFIG } from '../../config/mapbox.config';

type TransportLocationPickerNavProp = StackNavigationProp<
  MainStackParamList,
  'TransportLocationPicker'
>;

type TransportLocationPickerRouteProp = RouteProp<
  MainStackParamList,
  'TransportLocationPicker'
>;

type Suggestion = {
  name: string;
  coordinates: { longitude: number; latitude: number };
};

const TransportLocationPickerScreen = () => {
  const navigation = useNavigation<TransportLocationPickerNavProp>();
  const route = useRoute<TransportLocationPickerRouteProp>();

  const [pickup, setPickup] = useState(route.params?.pickup?.name || '');
  const [destination, setDestination] = useState(
    route.params?.destination?.name || ''
  );
  const [pickupSelection, setPickupSelection] = useState<LocationSelection | undefined>(
    route.params?.pickup
  );
  const [destinationSelection, setDestinationSelection] = useState<LocationSelection | undefined>(
    route.params?.destination
  );
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Suggestion[]>([]);
  const [activeField, setActiveField] = useState<'pickup' | 'destination' | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) return [] as Suggestion[];
    try {
      setIsSearching(true);
      const encoded = encodeURIComponent(query.trim());
      
      // Nominatim (OpenStreetMap) - FREE with excellent Sri Lanka coverage
      const url = `https://nominatim.openstreetmap.org/search?` +
        `q=${encoded}` +
        `&countrycodes=lk` + // Restrict to Sri Lanka
        `&format=json` +
        `&limit=10` +
        `&addressdetails=1` +
        `&accept-language=en`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'RoamCeylon/1.0' // Nominatim requires User-Agent
        }
      });

      if (!res.ok) return [];
      const data = await res.json();

      return Array.isArray(data)
        ? data
            .map((item: any) => {
              // Build a readable display name prioritizing the place name
              let displayName = item.display_name;
              
              // If there's a specific name, use it with context
              if (item.name) {
                const context = [];
                // Add location context (road, suburb, city)
                if (item.address?.road && item.address.road !== item.name) {
                  context.push(item.address.road);
                }
                if (item.address?.suburb && item.address.suburb !== item.name) {
                  context.push(item.address.suburb);
                }
                if (item.address?.city && item.address.city !== item.name) {
                  context.push(item.address.city);
                }
                
                displayName = context.length > 0 
                  ? `${item.name}, ${context.join(', ')}`
                  : item.name;
              }

              return item.lat && item.lon
                ? {
                    name: displayName,
                    coordinates: {
                      longitude: parseFloat(item.lon),
                      latitude: parseFloat(item.lat),
                    },
                  }
                : null;
            })
            .filter(Boolean) as Suggestion[]
        : [];
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (activeField !== 'pickup') return;
    const handler = setTimeout(async () => {
      const results = await fetchSuggestions(pickup);
      setPickupSuggestions(results);
    }, 350);
    return () => clearTimeout(handler);
  }, [pickup, activeField, fetchSuggestions]);

  useEffect(() => {
    if (activeField !== 'destination') return;
    const handler = setTimeout(async () => {
      const results = await fetchSuggestions(destination);
      setDestinationSuggestions(results);
    }, 350);
    return () => clearTimeout(handler);
  }, [destination, activeField, fetchSuggestions]);

  const handleSelectSuggestion = useCallback(
    (field: 'pickup' | 'destination', item: Suggestion) => {
      if (field === 'pickup') {
        setPickup(item.name);
        setPickupSelection({ name: item.name, coordinates: item.coordinates });
        setPickupSuggestions([]);
      } else {
        setDestination(item.name);
        setDestinationSelection({ name: item.name, coordinates: item.coordinates });
        setDestinationSuggestions([]);
      }
      setActiveField(null);
    },
    []
  );

  const handleDone = useCallback(() => {
    navigation.navigate('Transport', {
      pickup: pickupSelection,
      destination: destinationSelection,
    });
  }, [navigation, pickupSelection, destinationSelection]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Locations</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pickup</Text>
          <TextInput
            style={styles.input}
            value={pickup}
            onChangeText={setPickup}
            placeholder="Enter pickup location"
            placeholderTextColor="#9aa0a6"
            onFocus={() => setActiveField('pickup')}
          />
          {activeField === 'pickup' && pickupSuggestions.length > 0 && (
            <View style={styles.suggestionsCard}>
              <FlatList
                data={pickupSuggestions}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion('pickup', item)}
                  >
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Destination</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="Where are you going?"
            placeholderTextColor="#9aa0a6"
            onFocus={() => setActiveField('destination')}
          />
          {activeField === 'destination' && destinationSuggestions.length > 0 && (
            <View style={styles.suggestionsCard}>
              <FlatList
                data={destinationSuggestions}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion('destination', item)}
                  >
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.doneButton, isSearching && { opacity: 0.6 }]}
          onPress={handleDone}
          disabled={isSearching}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 13,
    color: '#111',
  },
  doneButton: {
    marginTop: 10,
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default React.memo(TransportLocationPickerScreen);
