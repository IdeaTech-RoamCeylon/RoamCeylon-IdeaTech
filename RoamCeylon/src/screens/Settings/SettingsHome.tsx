import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const SettingsHomeScreen = () => {
  const navigation = useNavigation();
  const { logout, user, isLoading } = useAuth();

  // Local settings preferences states
  const [nationality, setNationality] = useState<'Sri Lankan' | 'Foreign'>('Sri Lankan');
  const [currency, setCurrency] = useState<'USD' | 'LKR' | 'EUR'>('USD');
  const [distance, setDistance] = useState<'KM' | 'Miles'>('KM');

  const handleLogout = async () => {
    await logout();
  };

  // Get name from potentially nested structure
  const getName = () => {
    if (user?.name) return user.name;
    if ((user as any)?.data?.firstName) {
      const firstName = (user as any).data.firstName;
      const lastName = (user as any).data.lastName || '';
      return `${firstName} ${lastName}`.trim();
    }
    return 'Ariyan Perera'; // Fallback / mockup default
  };

  // Action dialogs for selection options
  const handleSelectNationality = () => {
    Alert.alert(
      'Select Nationality',
      'Choose your nationality preference:',
      [
        { text: 'Sri Lankan', onPress: () => setNationality('Sri Lankan') },
        { text: 'Foreign', onPress: () => setNationality('Foreign') },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSelectCurrency = () => {
    Alert.alert(
      'Select Currency',
      'Choose your preferred currency:',
      [
        { text: 'USD ($)', onPress: () => setCurrency('USD') },
        { text: 'LKR (Rs)', onPress: () => setCurrency('LKR') },
        { text: 'EUR (€)', onPress: () => setCurrency('EUR') },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSelectDistance = () => {
    Alert.alert(
      'Select Distance Unit',
      'Choose your preferred unit of measurement:',
      [
        { text: 'KM (Kilometers)', onPress: () => setDistance('KM') },
        { text: 'Miles', onPress: () => setDistance('Miles') },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleUnderConstruction = (feature: string) => {
    Alert.alert('Under Construction', `${feature} is currently under construction. Stay tuned!`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6B5E27" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  const displayName = getName();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <Ionicons name="settings" size={18} color="#6B5E27" />
          </View>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PersonalInfo' as never)}
        >
          <Ionicons name="pencil-sharp" size={20} color="#5F5F5F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#708A5E', '#4A603E']}
            style={styles.profileBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              <View style={styles.avatarImagePlaceholder}>
                <Ionicons name="person" size={48} color="#FFFFFF" />
              </View>
            </View>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
        </View>

        {/* ACCOUNT Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PersonalInfo' as never)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>Personal Info</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1CFC7" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ChangePassword' as never)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1CFC7" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PrivacyPolicy' as never)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1CFC7" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleSelectNationality}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="flag-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>Nationality</Text>
            </View>
            <Text style={styles.menuValueText}>{nationality}</Text>
          </TouchableOpacity>
        </View>

        {/* PREFERENCES Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleUnderConstruction('Notifications')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1CFC7" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleSelectCurrency}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="cash-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>Currency</Text>
            </View>
            <Text style={styles.menuValueText}>{currency}</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleSelectDistance}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="speedometer-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>Distance</Text>
            </View>
            <Text style={styles.menuValueText}>{distance}</Text>
          </TouchableOpacity>
        </View>

        {/* SUPPORT Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>SUPPORT</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Emergency' as never)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="help-circle-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1CFC7" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleUnderConstruction('FAQ')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="help-buoy-outline" size={18} color="#6B5E27" />
              </View>
              <Text style={styles.menuItemText}>FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1CFC7" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#C53030" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop:50,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F2EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E2D6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6B5E27',
    letterSpacing: -0.5,
  },
  editButton: {
    padding: 6,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    alignItems: 'center',
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileBanner: {
    width: '100%',
    height: 90,
  },
  avatarContainer: {
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarImagePlaceholder: {
    flex: 1,
    borderRadius: 37,
    backgroundColor: '#8A9E80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9B9A95',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F2EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F3E3A',
  },
  menuValueText: {
    fontSize: 15,
    color: '#8A8984',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F6F5F0',
    marginVertical: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDE8E8',
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FBD5D5',
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutText: {
    color: '#C53030',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SettingsHomeScreen;
