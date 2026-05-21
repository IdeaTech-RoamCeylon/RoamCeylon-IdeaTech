import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const bentotaImg = require('../../assets/bentota.png');
const teaFortressImg = require('../../assets/tea_fortress.png');
const galleSurferImg = require('../../assets/Galle_Surfer.png');
const sigiriyaImg = require('../../assets/Sigiriya_Sky_Treetops.png');

const ExploreScreen = () => {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('All Stays');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Roam Ceylon</Text>
        <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} style={styles.profilePic} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Main Title */}
        <Text style={styles.mainTitle}>
          Rest in the <Text style={styles.highlightText}>Pearl</Text>{"\n"}of the Indian{"\n"}Ocean
        </Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search by city or hotel..." 
            placeholderTextColor="#888"
            style={styles.searchInput}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {['All Stays', 'Luxury', 'Eco-Resort'].map((filter) => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cards */}
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image source={bentotaImg} style={styles.cardImage} />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>4.9/5</Text>
            </View>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Bentota Beach Resort</Text>
              <Text style={styles.cardPrice}>$280<Text style={styles.perNight}>/night</Text></Text>
            </View>
            <View style={styles.cardSubtitle}>
              <Ionicons name="leaf" size={14} color="#1A7A1B" />
              <Text style={styles.cardSubtitleText}>Eco-Luxury Living</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image source={teaFortressImg} style={styles.cardImage} />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>4.8/5</Text>
            </View>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Tea Fortress Kandy</Text>
              <Text style={styles.cardPrice}>$195<Text style={styles.perNight}>/night</Text></Text>
            </View>
            <View style={styles.cardSubtitle}>
              <Ionicons name="triangle" size={14} color="#1A7A1B" />
              <Text style={styles.cardSubtitleText}>Mountain Sanctuary</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image source={galleSurferImg} style={styles.cardImage} />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>4.7/5</Text>
            </View>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>The Galle Surfer Inn</Text>
              <Text style={styles.cardPrice}>$85<Text style={styles.perNight}>/night</Text></Text>
            </View>
            <View style={styles.cardSubtitle}>
              <Ionicons name="water" size={14} color="#1A7A1B" />
              <Text style={styles.cardSubtitleText}>Coastal Adventure</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image source={sigiriyaImg} style={styles.cardImage} />
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>5.0/5</Text>
            </View>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sigiriya Sky Treetops</Text>
              <Text style={styles.cardPrice}>$320<Text style={styles.perNight}>/night</Text></Text>
            </View>
            <View style={styles.cardSubtitle}>
              <Ionicons name="location" size={14} color="#1A7A1B" />
              <Text style={styles.cardSubtitleText}>Heritage Stay</Text>
            </View>
          </View>
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <Text style={styles.promoEyebrow}>CURATED FOR YOU</Text>
          <Text style={styles.promoTitle}>Discover Secret{"\n"}Hideaways</Text>
          <Text style={styles.promoDescription}>
            Join our elite list of travelers and receive weekly guides to boutique stays across the island.
          </Text>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={styles.promoButtonText}>Join the Circle</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerTab} onPress={() => navigation.navigate('Home' as never)}>
          <Ionicons name="home-outline" size={24} color="#666" />
          <Text style={styles.footerText}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTabActive}>
          <Ionicons name="compass" size={24} color="#000" />
          <Text style={styles.footerTextActive}>EXPLORE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab}>
          <Ionicons name="notifications-outline" size={24} color="#666" />
          <Text style={styles.footerText}>ALERTS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab}>
          <Ionicons name="settings-outline" size={24} color="#666" />
          <Text style={styles.footerText}>SETTINGS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  mainTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#111',
    lineHeight: 44,
    marginTop: 10,
    marginBottom: 20,
    letterSpacing: -1,
  },
  highlightText: {
    color: '#9B7B4A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#EEE',
  },
  filterButtonActive: {
    backgroundColor: '#98F59B',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  filterTextActive: {
    color: '#111',
  },
  card: {
    marginBottom: 35,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  cardInfo: {
    paddingHorizontal: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9B7B4A',
  },
  perNight: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  cardSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardSubtitleText: {
    fontSize: 14,
    color: '#1A7A1B',
    fontWeight: '600',
  },
  promoBanner: {
    backgroundColor: '#FAF0CD',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  promoEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#9B7B4A',
    marginBottom: 15,
  },
  promoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 15,
  },
  promoDescription: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  promoButton: {
    backgroundColor: '#FFD94D',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FFD94D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  promoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingVertical: Platform.OS === 'ios' ? 25 : 15,
    paddingBottom: Platform.OS === 'ios' ? 35 : 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  footerTab: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerTabActive: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD94D',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  footerTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111',
  },
});

export default ExploreScreen;
