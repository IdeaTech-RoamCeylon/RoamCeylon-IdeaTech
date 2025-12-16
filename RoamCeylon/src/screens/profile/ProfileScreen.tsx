import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = () => {
  const { logout, user, isLoading } = useAuth();

  const handleLogout = async () => {
    console.log('Logging out...');
    await logout();
  };

  // Get phone number from potentially nested structure
  const getPhoneNumber = () => {
    if (user?.phoneNumber) return user.phoneNumber;
    if ((user as any)?.data?.phoneNumber) return (user as any).data.phoneNumber;
    return undefined;
  };

  // Get name from potentially nested structure
  const getName = () => {
    if (user?.name) return user.name;
    if ((user as any)?.data?.firstName) {
      const firstName = (user as any).data.firstName;
      const lastName = (user as any).data.lastName || '';
      return `${firstName} ${lastName}`.trim();
    }
    return undefined;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return 'Phone number not available';
    // Example: +94771234567 -> +94 77 123 4567
    if (phone.startsWith('+94') && phone.length === 12) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    }
    // Handle without + prefix
    if (phone.startsWith('94') && phone.length === 11) {
      return `+${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  // Get user initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return '👤';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const displayName = getName();
  const phoneNumber = getPhoneNumber();

  console.log('=== ProfileScreen Render ===');
  console.log('Display Name:', displayName);
  console.log('Phone number:', phoneNumber);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName ? getInitials(displayName) : '👤'}
          </Text>
        </View>
        <Text style={styles.name}>{displayName || 'Welcome Back!'}</Text>
        <Text style={styles.phone}>{formatPhoneNumber(phoneNumber)}</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>📝 Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>🎫 My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>❤️ Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>⚙️ Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
          <Text style={[styles.menuText, styles.logoutText]}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    backgroundColor: '#0066CC',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  phone: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginTop: 20,
  },
  logoutText: {
    color: '#dc3545',
  },
});

export default ProfileScreen;
