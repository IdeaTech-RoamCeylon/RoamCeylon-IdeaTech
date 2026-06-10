import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const BusinessVerification = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Elegant Gradient Hero Banner */}
        <LinearGradient
          colors={['#0F3D26', '#145334']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, { paddingTop: insets.top + 20 }]}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="time-outline" size={24} color="#EAD26B" />
            </View>
            <View>
              <Text style={styles.bannerTitle}>Account In Review</Text>
              <Text style={styles.bannerSubtitle}>Verification process is active</Text>
            </View>
          </View>
          
          <Text style={styles.bannerDescription}>
            Your profile is currently being reviewed by our team. Please complete any pending document uploads below to expedite the process.
          </Text>

          {/* Elegant Stepper */}
          <View style={styles.stepperWrapper}>
            <View style={styles.progressLineBg}>
              <View style={styles.progressLineFill} />
            </View>

            <View style={styles.stepsRow}>
              {/* Step 1 */}
              <View style={styles.stepNode}>
                <View style={styles.circleCheck}>
                  <Ionicons name="checkmark" size={14} color="#EAD26B" />
                </View>
                <Text style={[styles.stepNodeText, styles.stepNodeTextCompleted]}>Details</Text>
              </View>

              {/* Step 2 */}
              <View style={styles.stepNode}>
                <View style={styles.circleNumberActive}>
                  <Text style={styles.circleNumberTextActive}>2</Text>
                </View>
                <Text style={[styles.stepNodeText, styles.stepNodeTextActive]}>Verification</Text>
              </View>

              {/* Step 3 */}
              <View style={styles.stepNode}>
                <View style={styles.circleNumberInactive}>
                  <Text style={styles.circleNumberTextInactive}>3</Text>
                </View>
                <Text style={styles.stepNodeText}>Approval</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>1 of 3 Completed</Text>
          </View>
        </View>

        {/* Document List */}
        <View style={styles.docList}>
          {/* Document 1: NIC / Passport (Success) */}
          <View style={styles.docRow}>
            <View style={styles.docRowLeft}>
              <View style={[styles.docIconBox, styles.docIconBoxSuccess]}>
                <Ionicons name="id-card-outline" size={22} color="#0E5E2F" />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>NIC / Passport</Text>
                <Text style={styles.docStatusSuccess}>Identity document verified</Text>
              </View>
            </View>

            <View style={styles.docActions}>
              <TouchableOpacity activeOpacity={0.7} style={styles.viewDocBtn}>
                <Text style={styles.viewDocLink}>View</Text>
              </TouchableOpacity>
              <View style={styles.inlineSuccessBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#0E5E2F" />
              </View>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Document 2: Business License (Pending) */}
          <View style={styles.docRow}>
            <View style={styles.docRowLeft}>
              <View style={[styles.docIconBox, styles.docIconBoxPending]}>
                <Ionicons name="business-outline" size={22} color="#D32F2F" />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Business License</Text>
                <Text style={styles.docStatusPending}>Pending document upload</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.rowUploadButton} activeOpacity={0.8}>
              <Ionicons name="cloud-upload-outline" size={15} color="#493D1B" style={{ marginRight: 6 }} />
              <Text style={styles.rowUploadButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowDivider} />

          {/* Document 3: Selfie Verification (Pending) */}
          <View style={styles.docRow}>
            <View style={styles.docRowLeft}>
              <View style={[styles.docIconBox, styles.docIconBoxPending]}>
                <Ionicons name="camera-outline" size={22} color="#D32F2F" />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>Selfie Verification</Text>
                <Text style={styles.docStatusPending}>Pending photo upload</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.rowUploadButton} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={15} color="#493D1B" style={{ marginRight: 6 }} />
              <Text style={styles.rowUploadButtonText}>Upload</Text>
            </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    width: '100%',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  heroBanner: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
    marginTop: 10,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAD26B',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EAD26B',
    marginTop: 2,
  },
  bannerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 20,
  },
  stepperWrapper: {
    position: 'relative',
    marginTop: 8,
    width: '100%',
    height: 56,
  },
  progressLineBg: {
    position: 'absolute',
    top: 15,
    left: '15%',
    right: '15%',
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 1,
  },
  progressLineFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#EAD26B',
  },
  stepsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  stepNode: {
    alignItems: 'center',
    width: '30%',
  },
  circleCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: '#EAD26B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleNumberActive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAD26B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleNumberTextActive: {
    color: '#0F3D26',
    fontSize: 12,
    fontWeight: '800',
  },
  circleNumberInactive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleNumberTextInactive: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '800',
  },
  stepNodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
  },
  stepNodeTextActive: {
    color: '#EAD26B',
  },
  stepNodeTextCompleted: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    backgroundColor: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  completedBadge: {
    backgroundColor: '#EAF7EE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  docList: {
    paddingHorizontal: 24,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  docRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  docIconBoxSuccess: {
    backgroundColor: '#EAF7EE',
  },
  docIconBoxPending: {
    backgroundColor: '#FFF5F5',
  },
  docInfo: {
    flex: 1,
    paddingRight: 12,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  docStatusSuccess: {
    fontSize: 12,
    color: '#0E5E2F',
    fontWeight: '600',
    marginTop: 3,
  },
  docStatusPending: {
    fontSize: 12,
    color: '#DC3545',
    fontWeight: '600',
    marginTop: 3,
  },
  docActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDocBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewDocLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  inlineSuccessBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAD26B',
    borderRadius: 12,
    height: 38,
    paddingHorizontal: 14,
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  rowUploadButtonText: {
    color: '#493D1B',
    fontSize: 13,
    fontWeight: '800',
  },
  rowDivider: {
    height: 1.2,
    backgroundColor: '#F0F3F1',
  },
});

export default BusinessVerification;
