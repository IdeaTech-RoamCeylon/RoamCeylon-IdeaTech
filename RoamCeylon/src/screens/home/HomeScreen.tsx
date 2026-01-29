import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from '../../components';
import { useNavigation } from '@react-navigation/native';

interface NavItem {
  id: string;
  emoji: string;
  title: string;
  description: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: '1', emoji: '🗺️', title: 'Explore', description: 'Discover destinations', route: 'Explore' },
  { id: '2', emoji: '🛍️', title: 'Marketplace', description: 'Shop local goods', route: 'Marketplace' },
  { id: '3', emoji: '🚗', title: 'Transport', description: 'Book rides', route: 'Transport' },
  { id: '4', emoji: '🤖', title: 'AI Planner', description: 'Plan your trip', route: 'AITripPlanner' },
  { id: '5', emoji: '💾', title: 'Saved Trips', description: 'Your saved plans', route: 'SavedTrips' },
  { id: '6', emoji: '👤', title: 'Profile', description: 'Your account', route: 'Profile' },
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
      <Text style={styles.cardTitle}>{item.emoji} {item.title}</Text>
      <Text style={styles.cardText}>{item.description}</Text>
    </Card>
  );
});

NavCard.displayName = 'NavCard';

const HomeScreen = () => {
  const navigation = useNavigation();

  const handleNavigate = useCallback((route: string) => {
    navigation.navigate(route as never);
  }, [navigation]);

  const keyExtractor = useCallback((item: NavItem) => item.id, []);

  const renderItem = useCallback(({ item }: { item: NavItem }) => (
    <NavCard item={item} onPress={handleNavigate} />
  ), [handleNavigate]);

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.header}>
      <Text style={styles.title}>RoamCeylon</Text>
      <Text style={styles.subtitle}>Explore Sri Lanka</Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerWrapper: {
    marginHorizontal: -10,
    marginTop: -10,
    marginBottom: 10,
  },
  header: {
    backgroundColor: '#0066CC',
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
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
  },
});

export default React.memo(HomeScreen);
