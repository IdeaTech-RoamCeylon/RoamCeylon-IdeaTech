import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EditShop = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [shopName, setShopName] = useState('Ceylon Spices & Tea');
  const [category, setCategory] = useState('Artisan Goods');
  const [description, setDescription] = useState('Premium organic spices and hand-picked teas from the central highlands.');
  const [hoursEnabled, setHoursEnabled] = useState(true);

  const [website, setWebsite] = useState('ceylonspices.com');
  const [instagram, setInstagram] = useState('ceylon_spices');
  const [facebook, setFacebook] = useState('CeylonSpicesTea');
  const [tiktok, setTiktok] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#0E5E2F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Shop</Text>
        <TouchableOpacity style={styles.profileImageContainer} activeOpacity={0.7} onPress={() => router.push('/shopping/settings' as any)}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
            style={styles.profileImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Partner Settings</Text>
        <Text style={styles.pageSubtitle}>Manage your shop profile and digital{'\n'}presence.</Text>

        <TouchableOpacity style={styles.previewButton} activeOpacity={0.85}>
          <Ionicons name="eye-outline" size={20} color="#493D1B" style={{ marginRight: 8 }} />
          <Text style={styles.previewButtonText}>View Shop Preview</Text>
        </TouchableOpacity>

        {/* Separator / Drag Handle */}
        <View style={styles.separatorContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* Shop Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="storefront" size={22} color="#0E5E2F" />
            <Text style={styles.cardTitle}>Shop Profile</Text>
          </View>
          <View style={styles.cardDivider} />

          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1590426189955-46733ec6b1d4?auto=format&fit=crop&q=80&w=800' }}
            style={styles.shopCoverImage}
            contentFit="cover"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shop Name</Text>
            <TextInput
              style={styles.textInput}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Enter shop name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Category</Text>
            <TouchableOpacity style={styles.dropdownInput} activeOpacity={0.7}>
              <Text style={styles.dropdownText}>{category}</Text>
              <Feather name="chevron-down" size={20} color="#60646C" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Short Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your shop"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.switchCard}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Business Hours</Text>
              <Text style={styles.switchSubtitle}>Currently set to Mon-Sat, 9AM -{'\n'}6PM</Text>
            </View>
            <Switch
              value={hoursEnabled}
              onValueChange={setHoursEnabled}
              trackColor={{ false: '#E5E7EB', true: '#0E5E2F' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* External Integrations Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="link-2" size={22} color="#0E5E2F" />
            <Text style={styles.cardTitle}>External Integrations</Text>
          </View>
          <View style={styles.cardDivider} />

          <Text style={styles.integrationDesc}>
            Connect your digital presence to direct{'\n'}travelers to your booking or content{'\n'}platforms.
          </Text>

          {/* Website Input */}
          <View style={styles.integrationInputContainer}>
            <View style={styles.integrationPrefix}>
              <Feather name="globe" size={18} color="#4A4A4A" />
              <Text style={styles.prefixText}>https://</Text>
            </View>
            <TextInput
              style={styles.integrationInput}
              value={website}
              onChangeText={setWebsite}
              placeholder="yourwebsite.com"
              placeholderTextColor="#D1D5DB"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Instagram Input */}
          <View style={styles.integrationInputContainer}>
            <View style={styles.integrationPrefix}>
              <Feather name="instagram" size={18} color="#4A4A4A" />
              <Text style={styles.prefixText}>instagram.com/</Text>
            </View>
            <TextInput
              style={styles.integrationInput}
              value={instagram}
              onChangeText={setInstagram}
              placeholder="username"
              placeholderTextColor="#D1D5DB"
              autoCapitalize="none"
            />
          </View>

          {/* Facebook Input */}
          <View style={styles.integrationInputContainer}>
            <View style={styles.integrationPrefix}>
              <Feather name="facebook" size={18} color="#4A4A4A" />
              <Text style={styles.prefixText}>facebook.com/</Text>
            </View>
            <TextInput
              style={styles.integrationInput}
              value={facebook}
              onChangeText={setFacebook}
              placeholder="page"
              placeholderTextColor="#D1D5DB"
              autoCapitalize="none"
            />
          </View>

          {/* TikTok Input */}
          <View style={styles.integrationInputContainer}>
            <View style={styles.integrationPrefix}>
              <MaterialCommunityIcons name="play-circle-outline" size={20} color="#4A4A4A" />
              <Text style={styles.prefixText}>tiktok.com/@</Text>
            </View>
            <TextInput
              style={styles.integrationInput}
              value={tiktok}
              onChangeText={setTiktok}
              placeholder="username"
              placeholderTextColor="#E5E7EB"
              autoCapitalize="none"
            />
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E5E2F',
    flex: 1,
    marginLeft: 12,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#0F3D26',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#60646C',
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },
  previewButton: {
    backgroundColor: '#EAD26B',
    borderRadius: 100,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewButtonText: {
    color: '#493D1B',
    fontSize: 15,
    fontWeight: '700',
  },
  separatorContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dragHandle: {
    width: 32,
    height: 4,
    backgroundColor: '#F472B6',
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F3F1',
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
    marginLeft: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  shopCoverImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1C1917',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 90,
    paddingTop: 14,
    paddingBottom: 14,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 15,
    color: '#1C1917',
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
    marginBottom: 4,
  },
  switchSubtitle: {
    fontSize: 13,
    color: '#60646C',
    lineHeight: 18,
  },
  integrationDesc: {
    fontSize: 15,
    color: '#60646C',
    lineHeight: 22,
    marginBottom: 24,
  },
  integrationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 52,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  integrationPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
  },
  prefixText: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 10,
  },
  integrationInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1C1917',
    paddingRight: 16,
  },
});

export default EditShop;
