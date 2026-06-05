import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Finance = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const transactions = [
    {
      initials: 'SJ',
      avatarBg: '#F5EBE1',
      avatarColor: '#8A5A52',
      name: 'Samantha Jones', 
      date: 'Oct 12, 2023',
      amount: '$450.00',
      status: 'PROCESSED',
      statusBg: '#C2F3D0',
      statusColor: '#0E5E2F',
    },
    {
      initials: 'MW',
      avatarBg: '#E1EFE6',
      avatarColor: '#0E5E2F',
      name: 'Michael Wong',
      date: 'Oct 11, 2023',
      amount: '$1,200.00',
      status: 'PENDING',
      statusBg: '#FEF3C7',
      statusColor: '#D97706',
    },
    {
      initials: 'AB',
      avatarBg: '#E0E9F5',
      avatarColor: '#4A607A',
      name: 'Alice Bennett',
      date: 'Oct 10, 2023',
      amount: '$850.00',
      status: 'PROCESSED',
      statusBg: '#C2F3D0',
      statusColor: '#0E5E2F',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={28} color="#172B1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Financial Overview</Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          activeOpacity={0.7}
          onPress={() => router.push('/activities/settings' as any)}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
            }}
            style={styles.profileImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitle}>
            All the earnings from activities
          </Text>

          {/* Download Report Button */}
          <TouchableOpacity style={styles.downloadButton} activeOpacity={0.7}>
            <Feather name="download" size={18} color="#0E5E2F" style={{ marginRight: 8 }} />
            <Text style={styles.downloadText}>Download Annual Report</Text>
          </TouchableOpacity>
        </View>

        {/* Total Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.cardLabel}>TOTAL REVENUE</Text>
          <Text style={styles.revenueValue}>$48,250.00</Text>
          <View style={styles.trendRow}>
            <Feather name="trending-up" size={16} color="#22C55E" style={{ marginRight: 4 }} />
            <Text style={styles.trendText}>+12.4% vs last month</Text>
          </View>
          {/* Watermark banknote background */}
          <View style={styles.watermarkContainer}>
            <MaterialCommunityIcons name="cash-multiple" size={72} color="#5B600A" style={{ opacity: 0.08 }} />
          </View>
        </View>

        {/* Next Payout Card */}
        <View style={styles.payoutCard}>
          <View style={styles.payoutCardHeader}>
            <View style={styles.payoutIconBox}>
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.payoutLabel}>Next Payout</Text>
          </View>
          <Text style={styles.payoutValue}>$3,240.00</Text>
          <Text style={styles.payoutDate}>Oct 15, 2023</Text>

          <TouchableOpacity style={styles.payoutCTA} activeOpacity={0.8}>
            <Text style={styles.payoutCTAText}>View Payout Details</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions Section */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {/* Search & Filter Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#60646C" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search guests..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <Feather name="sliders" size={20} color="#1C1917" />
          </TouchableOpacity>
        </View>

        {/* Tabular Grid container */}
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, { flex: 1.5 }]}>Guest Name</Text>
            <Text style={[styles.colHeader, { flex: 1.2 }]}>Date</Text>
            <Text style={[styles.colHeader, { flex: 1.0 }]}>Amount</Text>
            <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'center' }]}>Status</Text>
            <Text style={[styles.colHeader, { width: 50, textAlign: 'center' }]}></Text>
          </View>

          {/* Table Data Rows */}
          {transactions.map((tx, idx) => (
            <View key={idx} style={styles.tableRow}>
              {/* Guest Name & Initials */}
              <View style={[styles.cell, { flex: 1.5, flexDirection: 'row', alignItems: 'center' }]}>
                <View style={[styles.avatar, { backgroundColor: tx.avatarBg }]}>
                  <Text style={[styles.avatarText, { color: tx.avatarColor }]}>{tx.initials}</Text>
                </View>
                <Text style={styles.guestName} numberOfLines={1}>
                  {tx.name}
                </Text>
              </View>

              {/* Date */}
              <Text style={[styles.cell, styles.dateCell, { flex: 1.2 }]}>{tx.date}</Text>

              {/* Amount */}
              <Text style={[styles.cell, styles.amountCell, { flex: 1.0 }]}>{tx.amount}</Text>

              {/* Status */}
              <View style={[styles.cell, { flex: 1.2, alignItems: 'center' }]}>
                <View style={[styles.statusBadge, { backgroundColor: tx.statusBg }]}>
                  <Text style={[styles.statusText, { color: tx.statusColor }]}>{tx.status}</Text>
                </View>
              </View>

              {/* Actions */}
              <TouchableOpacity style={[styles.cell, { width: 50, alignItems: 'center' }]} activeOpacity={0.6}>
                <Feather name="more-vertical" size={18} color="#60646C" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Table Footer */}
          <View style={styles.tableFooter}>
            <Text style={styles.footerInfo}>Showing 1-10 of 124 transactions</Text>
            <View style={styles.paginationRow}>
              <TouchableOpacity style={styles.pageButton} activeOpacity={0.6}>
                <Ionicons name="chevron-back" size={16} color="#60646C" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.pageButton} activeOpacity={0.6}>
                <Ionicons name="chevron-forward" size={16} color="#1C1917" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: -0.3,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0E5E2F',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#60646C',
    marginTop: 6,
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0E5E2F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderLeftWidth: 6,
    borderLeftColor: '#5B600A',
    padding: 20,
    marginTop: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60646C',
    letterSpacing: 0.5,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#5B600A',
    marginTop: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22C55E',
  },
  watermarkContainer: {
    position: 'absolute',
    right: 20,
    top: 25,
  },
  payoutCard: {
    backgroundColor: '#053820',
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    shadowColor: '#053820',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  payoutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  payoutIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  payoutValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  payoutDate: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  payoutCTA: {
    backgroundColor: '#EAD26B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  payoutCTAText: {
    color: '#493D1B',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
    marginTop: 28,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1917',
    fontWeight: '500',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  tableCard: {
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F9F5',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  colHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cell: {
    justifyContent: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '800',
  },
  guestName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
  },
  dateCell: {
    fontSize: 13,
    color: '#60646C',
    fontWeight: '500',
  },
  amountCell: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  footerInfo: {
    fontSize: 12,
    color: '#60646C',
    fontWeight: '600',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});

export default Finance;
