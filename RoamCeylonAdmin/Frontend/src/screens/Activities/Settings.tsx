import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
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

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: '',
    phone: '',
    picture: '',
  });

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const token = await SecureStore.getItemAsync('authToken');
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';
          if (!token) return;

          let newProfile = { ...profile };

          // 1. Load from cache
          try {
            const cachedProfile = await SecureStore.getItemAsync('userProfile');
            if (cachedProfile) {
              const parsed = JSON.parse(cachedProfile);
              if (parsed.name) newProfile.name = parsed.name;
              if (parsed.email) newProfile.email = parsed.email;
              if (parsed.phoneNumber) newProfile.phone = parsed.phoneNumber;
              if (parsed.profile_picture) newProfile.picture = parsed.profile_picture;
              setProfile(newProfile);
            }
          } catch (_e) { }

          // 2. Load from DB
          try {
            const res = await fetch(`${apiUrl}/admin-users/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const resJson = await res.json();
              const profileData = resJson.data || resJson || {};
              if (profileData.name) newProfile.name = profileData.name;
              if (profileData.email) newProfile.email = profileData.email;
              if (profileData.phoneNumber) newProfile.phone = profileData.phoneNumber;
              if (profileData.profile_picture) newProfile.picture = profileData.profile_picture;
              setProfile(newProfile);
            }
          } catch (_e) { }

        } catch (err) {
          console.error('[Settings] Error loading user profile:', err);
        }
      };
      loadProfile();
    }, [])
  );

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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Header Gradient */}
        <LinearGradient
          colors={['#0F3D26', '#145334', '#0E5E2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 24 }]}
        >
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7} onPress={() => router.replace('/activities/home' as any)}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Settings</Text>
          <View style={{ width: 44 }} />
        </LinearGradient>
        {/* Deep Emerald Profile Card section */}
        <LinearGradient
          colors={['#0F3D26', '#145334']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileSection}
        >
          {/* Avatar Container with yellow border and white verified checkmark */}
          <View style={styles.avatarContainer}>
            {profile.picture ? (
              <Image
                source={{ uri: profile.picture }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarInitial}>
                <Text style={styles.avatarInitialText}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-sharp" size={12} color="#0F3D26" />
            </View>
          </View>

          {/* Guide Badge */}
          <View style={styles.adminBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.adminBadgeText}>VERIFIED ADMIN</Text>
          </View>

          {/* Profile Name */}
          <Text style={styles.profileName}>{profile.name}</Text>

          {/* Contact Details with custom light opacity icons and labels */}
          <View style={styles.contactContainer}>
            {!!profile.email && (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.8)" style={{ marginRight: 8 }} />
                <Text style={styles.contactText}>{profile.email}</Text>
              </View>
            )}
            {!!profile.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.8)" style={{ marginRight: 8 }} />
                <Text style={styles.contactText}>{profile.phone}</Text>
              </View>
            )}
          </View>

          {/* Side-by-side Action Buttons */}
          <View style={styles.profileActionsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1, marginRight: 8 }]}
              activeOpacity={0.8}
              onPress={() => router.push('/activities/editProfile' as any)}
            >
              <Text style={styles.primaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.secondaryButton, { flex: 1, marginLeft: 8 }]}
              activeOpacity={0.8}
              onPress={() => router.push('/activities/businessVerification' as any)}
            >
              <Text style={styles.secondaryButtonText}>Verify Credentials</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* System Preferences Card */}
        <Text style={styles.sectionHeader}>System Preferences</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#1C1917' }]}>
                <Ionicons name="moon" size={18} color="#FFFFFF" />
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

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="notifications" size={18} color="#FFFFFF" />
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

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="document-text" size={18} color="#FFFFFF" />
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

        {/* Security Section */}
        <Text style={styles.sectionHeader}>Security & Privacy</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => router.push('/activities/changePassword' as any)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Change Password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#60646C" />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Two-Factor Auth</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#60646C" />
          </TouchableOpacity>
        </View>

        {/* Listings Section */}
        <Text style={styles.sectionHeader}>Linked Properties</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="business" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Manage Properties</Text>
                <Text style={styles.settingSubtitle}>12 Active Listings in Bentota</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#60646C" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZoneCard}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning-outline" size={20} color="#DC3545" style={{ marginRight: 8 }} />
            <Text style={styles.dangerTitle}>DANGER ZONE</Text>
          </View>
          <Text style={styles.dangerSubtitle}>
            These actions affect administrative access across the Roam Ceylon network.
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

          <TouchableOpacity
            style={styles.deactivateButton}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert(
                "Deactivate Account",
                "Are you sure you want to deactivate your admin account? This action cannot be undone and your active listings will be removed.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Deactivate",
                    style: "destructive",
                    onPress: async () => {
                      setLoading(true);
                      try {
                        const token = await SecureStore.getItemAsync('authToken');
                        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

                        if (token) {
                          const res = await fetch(`${apiUrl}/admin-users/me`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (!res.ok) throw new Error('Failed to deactivate account');
                        }

                        try {
                          await (nhost.auth as any).signOut();
                        } catch (_e) { }
                        await SecureStore.deleteItemAsync('authToken');
                        await SecureStore.deleteItemAsync('nhostRefreshToken');
                        await SecureStore.deleteItemAsync('userProfile');

                        showToast.success('Account deactivated successfully', 'Goodbye');
                        router.replace('/login');
                      } catch (_err) {
                        showToast.error('Failed to deactivate account', 'Error');
                        setLoading(false);
                      }
                    }
                  }
                ]
              );
            }}
          >
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
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
    marginBottom: 16,
    marginHorizontal: -20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EAEAEA',
    borderWidth: 3,
    borderColor: '#EAD26B',
  },
  avatarInitial: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0E5E2F',
    borderWidth: 3,
    borderColor: '#EAD26B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#EAD26B',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#EAD26B',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F3D26',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  contactContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  profileActionsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#493D1B',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
