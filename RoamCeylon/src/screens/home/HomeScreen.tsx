import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Card } from '../../components';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  id: string;
  image: any;
  description: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: '1',
    image: require('../../assets/Ride-Transport.png'),
    description: 'Ride and transport',
    route: 'Transport',
  },
  {
    id: '2',
    image: require('../../assets/Hotel-Stays.png'),
    description: 'Hotel and Stays',
    route: 'Hotels',
  },
  {
    id: '3',
    image: require('../../assets/Food-Restaurents.png'),
    description: 'Food and Restaurants',
    route: 'Marketplace',
  },
  {
    id: '4',
    image: require('../../assets/Activities-TouristSpots.png'),
    description: 'Activities and Tourist Spots',
    route: 'Explore',
  },
];

// Memoized navigation card component
interface NavCardProps {
  item: NavItem;
  onPress: (route: string) => void;
}

const NavCard = React.memo<NavCardProps>(({ item, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(item.route);
  }, [item.route, onPress]);

  return (
    <Card style={styles.card} onPress={handlePress}>
      <Image source={item.image} style={styles.cardImage} />
      <Text style={styles.cardText}>{item.description}</Text>
    </Card>
  );
});

NavCard.displayName = 'NavCard';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const userName = user?.name || 'Traveler'; // Retrieve actual user name from auth context

  const handleNavigate = useCallback(
    (route: string) => {
      navigation.navigate(route as never);
    },
    [navigation]
  );

  const keyExtractor = useCallback((item: NavItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: NavItem }) => <NavCard item={item} onPress={handleNavigate} />,
    [handleNavigate]
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <View>
          <LinearGradient
            colors={['#1B7F6B', '#6f9f93','#7aaea1']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.title}>RoamCeylon</Text>
            <Text style={styles.subtitle}>Hi {userName}</Text>
            <Text style={styles.subtitle}>Sri Lanka Welcomes You</Text>
            <TouchableOpacity 
              style={styles.profileIconContainer}
              onPress={() => handleNavigate('Profile')}
            >
              <Ionicons name="person" size={24} color="black" />
            </TouchableOpacity>
          </LinearGradient>
          <View style={styles.searchSection}>
            <View style={styles.searchRow}>
              <TouchableOpacity style={styles.searchIconBubble}>
                <Ionicons name="search" size={24} color="#1B7F6B" />
              </TouchableOpacity>
              <View style={styles.searchInputContainer}>
                <TextInput
                  placeholder="Your Destination"
                  placeholderTextColor="#D88A8A"
                  style={styles.searchInput}
                />
              </View>
            </View>
          </View>
        </View>
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <MaterialCommunityIcons name="brain" size={24} color="#F59E0B" />
            <Text style={styles.aicardTitle}>AI Powered Full Trip Planning</Text>
          </View>
          <Text style={styles.aiCardSubtitle}>Easy, instant travel planning with AI</Text>
          <TouchableOpacity onPress={() => handleNavigate('AIHome')}>
            <LinearGradient
              colors={['#FFDE59', '#FFBD0C']}
              style={styles.aiButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.aiButtonText}>Plan My Entire Trip with AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={styles.helptext}>Explore Our Essentials</Text>
      </View>
    ),
    [userName, handleNavigate]
  );

  return (
    <LinearGradient
      colors={['#6fedb0','#B2F2D3']}
      style={styles.container}
    >
      <FlatList
        data={NAV_ITEMS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={ListHeaderComponent}
        ListHeaderComponentStyle={styles.headerWrapper}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="home" size={24} color="#000" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="list" size={24} color="#000" />
          <Text style={styles.footerText}>Activities</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="notifications" size={24} color="#000" />
          <Text style={styles.footerText}>Notification</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="settings" size={24} color="#000" />
          <Text style={styles.footerText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    marginHorizontal: -10,
    marginTop: -10,
    marginBottom: 0,
  },
  gradientContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#197d6e',
    padding: 30,
    paddingTop: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileIconContainer: {
    width: 35,
    height: 35,
    backgroundColor: '#FCD34D', // Yellow
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    bottom: 40,
    borderWidth: 2,
    borderColor: '#156150',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardImage: {
    width: 80,
    height: 80,
    marginBottom: 0,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  helptext: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gridContent: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
  },
  cardTitle: {
    fontSize: 24,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    position: 'relative',
    zIndex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  searchIconBubble: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInputContainer: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    fontSize: 16,
    color: '#D88A8A',
    textAlign: 'center',
  },
  skylineImage: {
    width: '100%',
    height: 100,
    opacity: 0.3,
    marginTop: 10,
    zIndex: -1,
  },
  aiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
    shadowColor: '#d2f9f6',
    margin: 15,
    marginTop: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  aicardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiCardSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    marginLeft: 30,
  },
  aiButton: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  aiButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'android' ? 53 : 15,
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  footerText: {
    fontSize: 10,
    color: '#000',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default React.memo(HomeScreen);
