import React, { useCallback } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

type GreetingPeriod = 'Morning' | 'Afternoon' | 'Evening';

interface EssentialItem {
  id: string;
  label: string;
  icon: string;
  iconColor: string;
  iconBackground: string;
  cardBackground: string;
  route: string;
}

interface FooterItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: 'alerts';
}

const ESSENTIAL_ITEMS: EssentialItem[] = [
  {
    id: 'transport',
    label: 'Ride and Transport',
    icon: 'bus',
    iconColor: '#A84E0D',
    iconBackground: '#FDE8A8',
    cardBackground: '#FFF4D7',
    route: 'Transport',
  },
  {
    id: 'stays',
    label: 'Hotel & Stays',
    icon: 'office-building',
    iconColor: '#1A6A3B',
    iconBackground: '#D8F6E2',
    cardBackground: '#EFFBF1',
    route: 'Explore',
  },
  {
    id: 'marketplace',
    label: 'Market Place',
    icon: 'shopping-outline',
    iconColor: '#125D8D',
    iconBackground: '#DDEEFF',
    cardBackground: '#F0F7FF',
    route: 'Marketplace',
  },
  {
    id: 'activities',
    label: 'Activities & Tourist Spots',
    icon: 'terrain',
    iconColor: '#B14B17',
    iconBackground: '#FDE5CA',
    cardBackground: '#FFF2E5',
    route: 'Explore',
  },
];

const FOOTER_ITEMS: FooterItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    route: 'Home',
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: 'compass-outline',
    route: 'Explore',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: 'notifications-outline',
    action: 'alerts',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    route: 'Profile',
  },
];

const HERO_IMAGE = require('../../assets/Homepage.png');
const TRENDING_IMAGE = require('../../assets/Trending.png');

const getGreetingPeriod = (date: Date): GreetingPeriod => {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Morning';
  }

  if (hour < 17) {
    return 'Afternoon';
  }

  return 'Evening';
};

interface EssentialCardProps {
  item: EssentialItem;
  onPress: (route: string) => void;
}

const EssentialCard = React.memo<EssentialCardProps>(({ item, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item.route);
  }, [item.route, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.essentialCard, { backgroundColor: item.cardBackground }]}
    >
      <View style={[styles.essentialIconWrap, { backgroundColor: item.iconBackground }]}> 
        <MaterialCommunityIcons name={item.icon as any} size={34} color={item.iconColor} />
      </View>
      <Text style={[styles.essentialLabel, { color: item.iconColor }]}>{item.label}</Text>
    </TouchableOpacity>
  );
});

EssentialCard.displayName = 'EssentialCard';

interface FooterTabProps {
  item: FooterItem;
  isActive: boolean;
  onPress: (item: FooterItem) => void;
}

const FooterTab = React.memo<FooterTabProps>(({ item, isActive, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.footerTab, isActive && styles.footerTabActive]}
    >
      <Ionicons name={item.icon} size={22} color={isActive ? '#141414' : '#7B7B7B'} />
      <Text style={[styles.footerText, isActive && styles.footerTextActive]}>{item.label}</Text>
    </TouchableOpacity>
  );
});

FooterTab.displayName = 'FooterTab';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const userName = user?.name || 'Traveler';
  const greetingMessage = `Hi ${userName}, Good ${getGreetingPeriod(new Date())}!`;

  const handleNavigate = useCallback(
    (route: string) => {
      navigation.navigate(route as never);
    },
    [navigation]
  );

  const handleFooterPress = useCallback(
    (item: FooterItem) => {
      if (item.action === 'alerts') {
        Alert.alert('Alerts', 'Notifications center coming soon.');
        return;
      }

      if (item.route) {
        handleNavigate(item.route);
      }
    },
    [handleNavigate]
  );

  const currentFooterLabel = 'Home';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topGreetingCard}>
          <Text style={styles.greetingText}>{greetingMessage}</Text>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchIconBubble}>
              <Ionicons name="search" size={22} color="#9B7B4A" />
            </View>
            <View style={styles.searchInputContainer}>
              <TextInput
                placeholder="Your Destination"
                placeholderTextColor="#C7A97B"
                style={styles.searchInput}
              />
            </View>
          </View>
        </View>

        <View style={styles.aiCard}>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="star" size={12} color="#0F1B10" />
            <Text style={styles.aiBadgeText}>AI TRAVEL ASSISTANT</Text>
          </View>
          <Text style={styles.aiTitle}>AI Powered Full Trip Planning</Text>
          <Text style={styles.aiDescription}>
            Personalize your Sri Lankan escape. Our AI analyzes thousands of routes,
            stays, and secret spots to craft your perfect journey in seconds.
          </Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => handleNavigate('AITripPlanner')}>
            <LinearGradient
              colors={['#FFD94D', '#FFD13A']}
              style={styles.aiButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.aiButtonText}>Plan My Entire Trip with AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Image source={HERO_IMAGE} style={styles.heroImage} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>CURATED SELECTION</Text>
          <Text style={styles.sectionTitle}>Our Explore Essentials Individually</Text>
        </View>

        <View style={styles.essentialsGrid}>
          {ESSENTIAL_ITEMS.map((item) => (
            <EssentialCard key={item.id} item={item} onPress={handleNavigate} />
          ))}
        </View>

        <View style={styles.trendingCard}>
          <Image source={TRENDING_IMAGE} style={styles.trendingImage} />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.9)']}
            style={styles.trendingOverlay}
          />
          <View style={styles.trendingContent}>
            <View style={styles.trendingBadge}>
              <Text style={styles.trendingBadgeText}>TRENDING</Text>
            </View>
            <Text style={styles.trendingTitle}>The Golden Fortress</Text>
            <Text style={styles.trendingSubtitle}>
              Explore the heights of Sigiriya this season.
            </Text>
          </View>
        </View>

        <View style={styles.ecoCard}>
          <Text style={styles.ecoTitle}>Eco-Tourism at its Finest</Text>
          <Text style={styles.ecoDescription}>
            We partner with local communities to ensure your visit supports
            sustainable development in the pearl of the Indian Ocean.
          </Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.ecoLink}>
            <Text style={styles.ecoLinkText}>Learn about our mission</Text>
            <Ionicons name="arrow-forward" size={18} color="#9A7300" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {FOOTER_ITEMS.map((item) => (
          <FooterTab
            key={item.id}
            item={item}
            isActive={item.label === currentFooterLabel}
            onPress={handleFooterPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFAF6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 124,
  },
  topGreetingCard: {
    marginTop: 30,
    backgroundColor: '#FFD26B',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  greetingText: {
    color: '#343434',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  searchSection: {
    marginBottom: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchIconBubble: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
    color: '#7F6A51',
    textAlign: 'left',
  },
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 4,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8CF27F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 18,
  },
  aiBadgeText: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: '#132014',
  },
  aiTitle: {
    fontSize: 32,
    lineHeight: 38,
    color: '#1B1B1B',
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 18,
  },
  aiDescription: {
    fontSize: 17,
    lineHeight: 26,
    color: '#5F5F5F',
    marginBottom: 22,
  },
  aiButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#B98E0A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  aiButtonText: {
    color: '#222222',
    fontWeight: '800',
    fontSize: 15,
  },
  heroImage: {
    width: '100%',
    height: 335,
    borderRadius: 40,
    marginBottom: 26,
    resizeMode: 'cover',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    color: '#1A7A1B',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#222222',
    letterSpacing: -0.35,
  },
  essentialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  essentialCard: {
    width: '48.3%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(24, 24, 24, 0.04)',
    alignItems: 'center',
  },
  essentialIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  essentialLabel: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '800',
  },
  trendingCard: {
    borderRadius: 32,
    overflow: 'hidden',
    minHeight: 420,
    marginBottom: 18,
    backgroundColor: '#111111',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 6,
  },
  trendingImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  trendingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  trendingContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 260,
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#A87C00',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 14,
  },
  trendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  trendingTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  trendingSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    lineHeight: 25,
    maxWidth: 340,
  },
  ecoCard: {
    backgroundColor: '#FFF1B8',
    borderRadius: 32,
    paddingHorizontal: 22,
    paddingVertical: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  ecoTitle: {
    color: '#121212',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 18,
    maxWidth: 260,
  },
  ecoDescription: {
    color: '#4F4633',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  ecoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ecoLinkText: {
    color: '#9A7300',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 10 : 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  footerTab: {
    flex: 1,
    minHeight: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  footerTabActive: {
    backgroundColor: '#FFE06B',
  },
  footerText: {
    fontSize: 11,
    color: '#7B7B7B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footerTextActive: {
    color: '#151515',
  },
});

export default React.memo(HomeScreen);