import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { nhost } from '@/config/nhostClient';
import { showToast } from '@/utils/toast';

const Settings = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Switch States
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      try {
        await (nhost.auth as any).signOut();
      } catch (signOutErr) {
        console.warn('[Settings] Nhost client signOut warning:', signOutErr);
      }
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('nhostRefreshToken');
      showToast.success('Logged out successfully', 'Logged Out');
      router.replace('/login');
    } catch (err) {
      console.error('[Settings] Logout error:', err);
      showToast.error('Failed to log out. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.replace('/booking/home' as any)}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={26} color="#0E5E2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Section */}
        <View style={styles.profileSection}>
          {/* Avatar Container with Verified Badge */}
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
              }}
              style={styles.avatarImage}
              contentFit="cover"
            />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />
            </View>
          </View>
          
          {/* Verified Admin Label */}
          <View style={styles.adminBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#0E5E2F" style={{ marginRight: 4 }} />
            <Text style={styles.adminBadgeText}>BOOKING MANAGER</Text>
          </View>

          {/* Contact Information */}
          <View style={styles.contactContainer}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={16} color="#60646C" style={{ marginRight: 8 }} />
              <Text style={styles.contactText}>manager@roamceylon.lk</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={16} color="#60646C" style={{ marginRight: 8 }} />
              <Text style={styles.contactText}>+94 77 987 6543</Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/booking/editProfile' as any)}
          >
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push('/booking/businessVerification' as any)}
          >
            <Text style={styles.primaryButtonText}>Verify Business</Text>
          </TouchableOpacity>
        </View>

        {/* System Preferences Section */}
        <Text style={styles.sectionHeader}>System Preferences</Text>
        <View style={styles.card}>
          {/* Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="moon-outline" size={20} color="#1C1917" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingSubtitle}>Adjust UI for low-light</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#0E5E2F' }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>

          <View style={styles.cardDivider} />

          {/* Push Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={20} color="#1C1917" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Get alerts for bookings</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#E5E7EB', true: '#0E5E2F' }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>

          <View style={styles.cardDivider} />

          {/* Weekly Reports */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#1C1917" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Weekly Reports</Text>
                <Text style={styles.settingSubtitle}>Performance data summary</Text>
              </View>
            </View>
            <Switch
              value={weeklyReports}
              onValueChange={setWeeklyReports}
              trackColor={{ false: '#E5E7EB', true: '#0E5E2F' }}
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>
        </View>

        {/* Security & Privacy Section */}
        <Text style={styles.sectionHeader}>Security & Privacy</Text>
        <View style={styles.card}>
          {/* Change Password */}
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => router.push('/booking/changePassword' as any)}
          >
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#1C1917" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Change Password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#60646C" />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          {/* Two-Factor Auth */}
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#1C1917" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Two-Factor Auth</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#60646C" />
          </TouchableOpacity>
        </View>

        {/* Linked Properties Section */}
        <Text style={styles.sectionHeader}>Linked Properties</Text>
        <View style={styles.card}>
          {/* Manage Properties */}
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="business-outline" size={20} color="#1C1917" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Manage Properties</Text>
                <Text style={styles.settingSubtitle}>12 Active Listings in Bentota</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#60646C" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.dangerZoneCard}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning-outline" size={20} color="#DC3545" style={{ marginRight: 8 }} />
            <Text style={styles.dangerTitle}>DANGER ZONE</Text>
          </View>
          <Text style={styles.dangerSubtitle}>
            These actions affect administrative access across the entire Roam Ceylon network.
          </Text>

          <TouchableOpacity
            style={[styles.dangerButtonOutline, loading && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={handleLogout}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={18} color="#DC3545" style={{ marginRight: 8 }} />
            <Text style={styles.dangerButtonOutlineText}>
              {loading ? 'Logging out...' : 'Logout from all devices'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deactivateButton} activeOpacity={0.7}>
            <Text style={styles.deactivateText}>Deactivate Admin Account</Text>
          </TouchableOpacity>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EAEAEA',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#0E5E2F',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1917',
  },
  userSubtitle: {
    fontSize: 14,
    color: '#60646C',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: 0.5,
  },
  contactContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    color: '#49504B',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 14,
    width: '85%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#493D1B',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7D8A82',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#60646C',
    marginTop: 2,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  dangerZoneCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#FEE2E2',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC3545',
    letterSpacing: 0.5,
  },
  dangerSubtitle: {
    fontSize: 13,
    color: '#854D4D',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  dangerButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DC3545',
    borderRadius: 14,
    height: 48,
    marginBottom: 16,
  },
  dangerButtonOutlineText: {
    color: '#DC3545',
    fontSize: 14,
    fontWeight: '700',
  },
  deactivateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  deactivateText: {
    color: '#DC3545',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default Settings;
