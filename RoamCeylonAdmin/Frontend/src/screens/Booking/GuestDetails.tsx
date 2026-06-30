import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: _width } = Dimensions.get('window');

const GuestDetails = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.headerIconButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guest Details</Text>
        <TouchableOpacity style={styles.avatarButton} activeOpacity={0.7}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' }}
            style={styles.headerAvatar}
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
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileGreenBar} />

          {/* Avatar Container */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' }}
              style={styles.profileAvatar}
              contentFit="cover"
            />
            {/* Star badge overlay */}
            <View style={styles.starBadge}>
              <Ionicons name="star" size={10} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.guestName}>Eleanor Richards</Text>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>PREMIUM MEMBER</Text>
          </View>

          <View style={styles.divider} />

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
              <View style={styles.actionCircle}>
                <Ionicons name="call-outline" size={20} color="#103F24" />
              </View>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
              <View style={styles.actionCircle}>
                <Ionicons name="mail-outline" size={20} color="#103F24" />
              </View>
              <Text style={styles.actionLabel}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
              <View style={styles.actionCircle}>
                <Ionicons name="chatbubble-outline" size={20} color="#103F24" />
              </View>
              <Text style={styles.actionLabel}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Card */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.sectionHeaderTitle}>QUICK ACTIONS</Text>

          <TouchableOpacity style={[styles.qaButton, styles.qaButtonCheckIn]} activeOpacity={0.85}>
            <Ionicons name="enter-outline" size={20} color="#FFFFFF" style={styles.qaButtonIcon} />
            <Text style={styles.qaButtonTextCheckIn}>Check-in Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.qaButton, styles.qaButtonModify]} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={20} color="#5B600A" style={styles.qaButtonIcon} />
            <Text style={styles.qaButtonTextModify}>Modify Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.qaButton, styles.qaButtonCancel]} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={20} color="#DC2626" style={styles.qaButtonIcon} />
            <Text style={styles.qaButtonTextCancel}>Cancel Reservation</Text>
          </TouchableOpacity>
        </View>

        {/* Stay Information Card */}
        <View style={styles.stayInfoCard}>
          {/* Vertical left border accent */}
          <View style={styles.stayLeftAccent} />

          <View style={styles.stayHeaderRow}>
            <View style={styles.stayTitleCol}>
              <Text style={styles.stayInfoTitle}>Stay Information</Text>

              {/* Check-in / Stay Summary */}
              <View style={styles.stayDatesContainer}>
                <View style={styles.stayDetailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#7C8A82" />
                  <Text style={styles.stayDetailText}>Oct 12 - Oct 15</Text>
                </View>
                <View style={[styles.stayDetailRow, { marginTop: 6 }]}>
                  <Ionicons name="moon-outline" size={16} color="#7C8A82" />
                  <Text style={styles.stayDetailText}>3 Nights</Text>
                </View>
              </View>
            </View>

            {/* Badges Column */}
            <View style={styles.stayBadgesCol}>
              <View style={styles.resNumBadge}>
                <Text style={styles.resNumText}>#4421</Text>
              </View>
              <View style={styles.arrivingBadge}>
                <Text style={styles.arrivingText}>ArrivingSoon</Text>
              </View>
            </View>
          </View>

          {/* Room Type Sub-Card */}
          <View style={styles.subCardContainer}>
            <Text style={styles.subCardHeader}>ROOM TYPE</Text>
            <View style={styles.subCardContent}>
              <View style={styles.subCardIconBg}>
                <Ionicons name="bed-outline" size={20} color="#0D4F2E" />
              </View>
              <View style={styles.subCardTextCol}>
                <Text style={styles.roomNameText}>Ocean View Suite</Text>
                <Text style={styles.roomDescText}>Room 204 • Building A</Text>
              </View>
            </View>
          </View>

          {/* Check-in Details Sub-Card */}
          <View style={styles.subCardContainer}>
            <Text style={styles.subCardHeader}>CHECK-IN DETAILS</Text>
            <View style={styles.subCardContent}>
              <View style={[styles.subCardIconBg, styles.checkInIconBg]}>
                <Ionicons name="time-outline" size={20} color="#855E0E" />
              </View>
              <View style={styles.subCardTextCol}>
                <Text style={styles.etaText}>ETA 2:00 PM</Text>
                <Text style={styles.standardCheckInText}>Standard check-in time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Special Requests Card */}
        <View style={styles.specialRequestsCard}>
          <View style={styles.specialRequestsHeader}>
            <MaterialCommunityIcons name="clipboard-alert-outline" size={20} color="#7C8A82" />
            <Text style={[styles.sectionHeaderTitle, { marginBottom: 0, marginLeft: 8 }]}>SPECIAL REQUESTS</Text>
          </View>

          {/* Request 1: Late check-out */}
          <View style={[styles.requestBanner, styles.requestBannerGreen]}>
            <View style={[styles.requestLeftLine, styles.requestLeftLineGreen]} />
            <Ionicons name="time-outline" size={18} color="#0E5E2F" style={styles.requestIcon} />
            <View style={styles.requestTextCol}>
              <Text style={styles.requestTitle}>Late check-out</Text>
              <Text style={styles.requestDesc}>requested (4:00 PM)</Text>
            </View>
          </View>

          {/* Request 2: Extra pillows */}
          <View style={[styles.requestBanner, styles.requestBannerYellow]}>
            <View style={[styles.requestLeftLine, styles.requestLeftLineYellow]} />
            <Ionicons name="star-outline" size={18} color="#855E0E" style={styles.requestIcon} />
            <View style={styles.requestTextCol}>
              <Text style={styles.requestTitle}>Extra pillows</Text>
              <Text style={styles.requestDesc}>(Feather & Synthetic mix)</Text>
            </View>
          </View>

          {/* Request 3: Airport pickup */}
          <View style={[styles.requestBanner, styles.requestBannerBrown]}>
            <View style={[styles.requestLeftLine, styles.requestLeftLineBrown]} />
            <Ionicons name="bus-outline" size={18} color="#855E0E" style={styles.requestIcon} />
            <View style={styles.requestTextCol}>
              <Text style={styles.requestTitle}>Airport pickup confirmed</Text>
              <Text style={styles.requestDesc}>Flight - EK652</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary Card */}
        <View style={styles.paymentCard}>
          {/* Watermark banknote outline icon */}
          <View style={styles.watermarkContainer}>
            <Ionicons name="cash-outline" size={96} color="rgba(14, 94, 47, 0.03)" />
          </View>

          <Text style={styles.sectionHeaderTitle}>PAYMENT SUMMARY</Text>

          <View style={styles.paymentCenterContent}>
            <Text style={styles.totalAmountLabel}>Total Stay Amount</Text>
            <Text style={styles.totalAmountValue}>$1,350.00</Text>

            {/* Paid badge */}
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#7D5505" style={{ marginRight: 6 }} />
              <Text style={styles.paidBadgeText}>Paid in full</Text>
            </View>
          </View>

          <View style={styles.paymentDivider} />

          {/* Two-column detail layout */}
          <View style={styles.paymentDetailsGrid}>
            <View style={styles.paymentGridCol}>
              <Text style={styles.payDetailLabel}>Nightly Rate</Text>
              <Text style={styles.payDetailValue}>$450.00</Text>

              <Text style={[styles.payDetailLabel, { marginTop: 14 }]}>Method</Text>
              <Text style={styles.payDetailValue}>Visa •• 4412</Text>
            </View>

            <View style={styles.paymentGridCol}>
              <Text style={styles.payDetailLabel}>Taxes & Fees</Text>
              <Text style={styles.payDetailValue}>$0.00</Text>

              <Text style={[styles.payDetailLabel, { marginTop: 14 }]}>Invoice</Text>
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={styles.downloadInvoiceText}>Download PDF</Text>
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
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    zIndex: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  profileGreenBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#0E5E2F',
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  starBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5C158',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  guestName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D3823',
    marginBottom: 8,
  },
  membershipBadge: {
    backgroundColor: '#D9ECE1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 18,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
    letterSpacing: 0.8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F3F1',
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 12,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F5F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    gap: 12,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7C8A82',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  qaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  qaButtonIcon: {
    marginRight: 8,
  },
  qaButtonCheckIn: {
    backgroundColor: '#66BB6A',
    borderColor: '#66BB6A',
  },
  qaButtonModify: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F6E4A6',
  },
  qaButtonCancel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FCA5A5',
  },
  qaButtonTextCheckIn: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qaButtonTextModify: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B600A',
  },
  qaButtonTextCancel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  stayInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    gap: 16,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  stayLeftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#0E5E2F',
  },
  stayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  stayTitleCol: {
    flex: 1,
  },
  stayInfoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E5E2F',
    marginBottom: 10,
  },
  stayDatesContainer: {
    paddingLeft: 2,
  },
  stayDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stayDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4D4A',
    marginLeft: 8,
  },
  stayBadgesCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  resNumBadge: {
    backgroundColor: '#F6D046',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7D5505',
  },
  arrivingBadge: {
    backgroundColor: '#CDE5D8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  arrivingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  subCardContainer: {
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    borderRadius: 16,
    padding: 14,
    paddingLeft: 16,
  },
  subCardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C8A82',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  subCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subCardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInIconBg: {
    backgroundColor: '#FDF8F5',
  },
  subCardTextCol: {
    marginLeft: 12,
  },
  roomNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E5E2F',
  },
  roomDescText: {
    fontSize: 13,
    color: '#7C8A82',
    fontWeight: '500',
    marginTop: 2,
  },
  etaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#855E0E',
  },
  standardCheckInText: {
    fontSize: 13,
    color: '#7C8A82',
    fontWeight: '500',
    marginTop: 2,
  },
  specialRequestsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    gap: 12,
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  specialRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  requestBannerGreen: {
    backgroundColor: '#F5FAF6',
  },
  requestBannerYellow: {
    backgroundColor: '#FFFDF2',
  },
  requestBannerBrown: {
    backgroundColor: '#FAF8F5',
  },
  requestLeftLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  requestLeftLineGreen: {
    backgroundColor: '#66BB6A',
  },
  requestLeftLineYellow: {
    backgroundColor: '#E5C158',
  },
  requestLeftLineBrown: {
    backgroundColor: '#855E0E',
  },
  requestIcon: {
    marginRight: 12,
  },
  requestTextCol: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  requestDesc: {
    fontSize: 12,
    color: '#7C8A82',
    fontWeight: '500',
    marginTop: 2,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0E5E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    opacity: 0.8,
  },
  paymentCenterContent: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  totalAmountLabel: {
    fontSize: 14,
    color: '#7C8A82',
    fontWeight: '600',
    marginBottom: 4,
  },
  totalAmountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0A3F24',
    marginBottom: 8,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6D046',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7D5505',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 4,
    marginBottom: 16,
  },
  paymentDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentGridCol: {
    width: '48%',
  },
  payDetailLabel: {
    fontSize: 12,
    color: '#7C8A82',
    fontWeight: '600',
    marginBottom: 4,
  },
  payDetailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1917',
  },
  downloadInvoiceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5B600A',
    textDecorationLine: 'underline',
  },
});

export default GuestDetails;
