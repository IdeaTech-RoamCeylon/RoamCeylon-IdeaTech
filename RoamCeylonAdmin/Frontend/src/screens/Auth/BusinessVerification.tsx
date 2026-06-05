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

const BusinessVerification = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={26} color="#1C1917" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Verification</Text>
        <View style={{ width: 32 }} /> {/* Balance header layout */}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>In Review</Text>
          <Text style={styles.statusSubtitle}>
            Your profile is currently being reviewed by our team. Please complete any pending document uploads below to expedite the process.
          </Text>

          {/* Stepper */}
          <View style={styles.stepperWrapper}>
            {/* Background connecting lines */}
            <View style={styles.progressLineBg}>
              <View style={styles.progressLineFill} />
            </View>

            <View style={styles.stepsRow}>
              {/* Step 1: Details */}
              <View style={styles.stepNode}>
                <View style={styles.circleCheck}>
                  <Ionicons name="checkmark" size={14} color="#493D1B" />
                </View>
                <Text style={styles.stepNodeText}>Details</Text>
              </View>

              {/* Step 2: Verification */}
              <View style={styles.stepNode}>
                <View style={styles.circleNumberActive}>
                  <Text style={styles.circleNumberTextActive}>2</Text>
                </View>
                <Text style={[styles.stepNodeText, styles.stepNodeTextActive]}>Verification</Text>
              </View>

              {/* Step 3: Approval */}
              <View style={styles.stepNode}>
                <View style={styles.circleNumberInactive}>
                  <Text style={styles.circleNumberTextInactive}>3</Text>
                </View>
                <Text style={styles.stepNodeText}>Approval</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Required Documents Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>1 of 3 Completed</Text>
          </View>
        </View>

        {/* Document Card 1: NIC / Passport (Success) */}
        <View style={styles.documentCard}>
          <View style={styles.docHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="id-card-outline" size={22} color="#5B600A" />
            </View>
            <View style={styles.docTextContainer}>
              <Text style={styles.docTitle}>NIC / Passport</Text>
              <Text style={styles.docSubtitle}>Identity document uploaded</Text>
            </View>
          </View>
          
          <View style={styles.cardDivider} />

          <View style={styles.docFooterRow}>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewDocLink}>View Document</Text>
            </TouchableOpacity>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#0E5E2F" style={{ marginRight: 4 }} />
              <Text style={styles.successBadgeText}>Success</Text>
            </View>
          </View>
        </View>

        {/* Document Card 2: Business License (Pending) */}
        <View style={styles.documentCard}>
          <View style={styles.docHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="business-outline" size={22} color="#5B600A" />
            </View>
            <View style={styles.docTextContainer}>
              <Text style={styles.docTitle}>Business License</Text>
              <View style={styles.pendingRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#DC3545" style={{ marginRight: 4 }} />
                <Text style={styles.pendingText}>Pending upload</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.uploadButton} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={18} color="#493D1B" style={{ marginRight: 8 }} />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Document Card 3: Selfie Verification (Pending) */}
        <View style={styles.documentCard}>
          <View style={styles.docHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={22} color="#5B600A" />
            </View>
            <View style={styles.docTextContainer}>
              <Text style={styles.docTitle}>Selfie Verification</Text>
              <View style={styles.pendingRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#DC3545" style={{ marginRight: 4 }} />
                <Text style={styles.pendingText}>Pending upload</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.uploadButton} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={18} color="#493D1B" style={{ marginRight: 8 }} />
            <Text style={styles.uploadButtonText}>Upload</Text>
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
    color: '#1C1917',
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#60646C',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 16,
  },
  stepperWrapper: {
    position: 'relative',
    marginTop: 16,
    marginBottom: 8,
    width: '100%',
    height: 60,
  },
  progressLineBg: {
    position: 'absolute',
    top: 15,
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: '#E5E7EB',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAD26B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleNumberActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B600A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleNumberTextActive: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  circleNumberInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleNumberTextInactive: {
    color: '#60646C',
    fontSize: 13,
    fontWeight: '800',
  },
  stepNodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60646C',
    marginTop: 8,
  },
  stepNodeTextActive: {
    color: '#5B600A',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  completedBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#EAF2EC',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docTextContainer: {
    flex: 1,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  docSubtitle: {
    fontSize: 13,
    color: '#7D8A82',
    fontWeight: '600',
    marginTop: 2,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pendingText: {
    fontSize: 13,
    color: '#DC3545',
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F3F1',
    marginVertical: 14,
  },
  docFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDocLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B600A',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E5E2F',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAD26B',
    borderRadius: 16,
    height: 48,
    marginTop: 16,
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadButtonText: {
    color: '#493D1B',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default BusinessVerification;
