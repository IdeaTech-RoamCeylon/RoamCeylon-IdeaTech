import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { uploadImage } from '@/utils/imageUpload';
import { showToast } from '@/utils/toast';
import {
  getVerification,
  VerificationStatus,
} from '@/utils/verification';

const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.198:3001';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'heic', 'pdf'];

const mimeForExt = (ext: string): string =>
  (
    {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      heic: 'image/heic',
      pdf: 'application/pdf',
    } as Record<string, string>
  )[ext] || 'application/octet-stream';

type DocKey = 'nic' | 'license' | 'selfie';

interface DocState {
  url: string | null;
  uploading: boolean;
}

const emptyDoc: DocState = { url: null, uploading: false };

const BusinessVerification = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>('none');
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);

  const [nic, setNic] = useState<DocState>(emptyDoc);
  const [license, setLicense] = useState<DocState>(emptyDoc);
  const [selfie, setSelfie] = useState<DocState>(emptyDoc);

  const setters: Record<DocKey, React.Dispatch<React.SetStateAction<DocState>>> =
    { nic: setNic, license: setLicense, selfie: setSelfie };

  // ── Load existing verification on focus ───────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const rec = await getVerification();
        if (!active) return;
        if (rec) {
          setStatus(rec.status);
          setReviewNotes(rec.reviewNotes ?? null);
          setNic({ url: rec.nicUrl ?? null, uploading: false });
          setLicense({ url: rec.businessLicenseUrl ?? null, uploading: false });
          setSelfie({ url: rec.selfieUrl ?? null, uploading: false });
        }
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const locked = status === 'pending' || status === 'approved';

  // ── Upload a picked file through the backend proxy ────────────────────────
  const uploadDoc = async (
    key: DocKey,
    uri: string,
    mimeType: string,
    baseName?: string,
  ) => {
    const setter = setters[key];
    setter((d) => ({ ...d, uploading: true }));
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        showToast.error('You must be logged in to upload documents.');
        return;
      }
      const url = await uploadImage(
        uri,
        '/verification/upload',
        token,
        mimeType,
        baseName?.replace(/\.[^.]+$/, ''),
      );
      setter({ url, uploading: false });
    } catch (e) {
      setter((d) => ({ ...d, uploading: false }));
      showToast.error('Upload failed. Please try again.');
    }
  };

  // ── Pick a document (image or PDF) for NIC / Business License ─────────────
  const pickDocument = async (key: DocKey) => {
    if (locked) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/png', 'image/jpeg', 'image/heic', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_BYTES) {
      showToast.error('File exceeds the 5 MB size limit.');
      return;
    }
    const ext = (asset.name?.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      showToast.error('Allowed file types: png, jpg, jpeg, heic, pdf.');
      return;
    }
    await uploadDoc(key, asset.uri, asset.mimeType || mimeForExt(ext), asset.name);
  };

  // ── Capture a selfie via the camera ───────────────────────────────────────
  const pickSelfie = async () => {
    if (locked) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast.error('Camera permission is required to take a selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    await uploadDoc(
      'selfie',
      result.assets[0].uri,
      'image/jpeg',
      `selfie_${Date.now()}`,
    );
  };

  const openDoc = (url: string | null) => {
    if (url) Linking.openURL(url);
  };

  // ── Submit / resubmit for review ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!nic.url || !license.url || !selfie.url) {
      showToast.error('Please upload all three documents before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        showToast.error('You must be logged in to submit.');
        return;
      }
      const res = await fetch(`${apiUrl()}/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nicUrl: nic.url,
          businessLicenseUrl: license.url,
          selfieUrl: selfie.url,
        }),
      });
      if (!res.ok) {
        showToast.error('Submission failed. Please try again.');
        return;
      }
      setStatus('pending');
      setReviewNotes(null);
      showToast.success(
        'Your documents were submitted. We will review them shortly.',
        'Submitted for Review',
      );
    } catch (e) {
      showToast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived UI values ─────────────────────────────────────────────────────
  const docs: {
    key: DocKey;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    state: DocState;
    onUpload: () => void;
    uploadLabel: string;
    uploadIcon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      key: 'nic',
      title: 'NIC / Passport',
      icon: 'id-card-outline',
      state: nic,
      onUpload: () => pickDocument('nic'),
      uploadLabel: 'Upload',
      uploadIcon: 'cloud-upload-outline',
    },
    {
      key: 'license',
      title: 'Business License',
      icon: 'business-outline',
      state: license,
      onUpload: () => pickDocument('license'),
      uploadLabel: 'Upload',
      uploadIcon: 'cloud-upload-outline',
    },
    {
      key: 'selfie',
      title: 'Selfie Verification',
      icon: 'camera-outline',
      state: selfie,
      onUpload: pickSelfie,
      uploadLabel: 'Capture',
      uploadIcon: 'camera-outline',
    },
  ];

  const completedCount = docs.filter((d) => !!d.state.url).length;
  const allUploaded = completedCount === 3;

  const banner = {
    none: {
      icon: 'shield-outline' as const,
      title: 'Verify Your Business',
      subtitle: 'Verification required',
      description:
        'Upload the documents below to verify your business. You must be verified before you can add any listings.',
    },
    pending: {
      icon: 'time-outline' as const,
      title: 'Account In Review',
      subtitle: 'Verification process is active',
      description:
        'Your documents are being reviewed by our team. You will be able to add listings once approved.',
    },
    approved: {
      icon: 'checkmark-circle-outline' as const,
      title: 'Account Verified',
      subtitle: 'You are all set',
      description:
        'Your business has been verified. You can now add and manage your listings.',
    },
    rejected: {
      icon: 'alert-circle-outline' as const,
      title: 'Verification Rejected',
      subtitle: 'Action needed',
      description:
        'Your verification was not approved. Please review the note below, update your documents, and resubmit.',
    },
  }[status];

  const progressFill =
    status === 'approved' ? '100%' : status === 'pending' ? '80%' : '50%';

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
              <Ionicons name={banner.icon} size={24} color="#EAD26B" />
            </View>
            <View>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
            </View>
          </View>

          <Text style={styles.bannerDescription}>{banner.description}</Text>

          {/* Elegant Stepper */}
          <View style={styles.stepperWrapper}>
            <View style={styles.progressLineBg}>
              <View style={[styles.progressLineFill, { width: progressFill }]} />
            </View>

            <View style={styles.stepsRow}>
              {/* Step 1 — Details */}
              <View style={styles.stepNode}>
                <View style={styles.circleCheck}>
                  <Ionicons name="checkmark" size={14} color="#EAD26B" />
                </View>
                <Text style={[styles.stepNodeText, styles.stepNodeTextCompleted]}>
                  Details
                </Text>
              </View>

              {/* Step 2 — Verification */}
              <View style={styles.stepNode}>
                {status === 'approved' || status === 'pending' ? (
                  <View style={styles.circleCheck}>
                    <Ionicons name="checkmark" size={14} color="#EAD26B" />
                  </View>
                ) : (
                  <View style={styles.circleNumberActive}>
                    <Text style={styles.circleNumberTextActive}>2</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.stepNodeText,
                    status === 'approved' || status === 'pending'
                      ? styles.stepNodeTextCompleted
                      : styles.stepNodeTextActive,
                  ]}
                >
                  Verification
                </Text>
              </View>

              {/* Step 3 — Approval */}
              <View style={styles.stepNode}>
                {status === 'approved' ? (
                  <View style={styles.circleCheck}>
                    <Ionicons name="checkmark" size={14} color="#EAD26B" />
                  </View>
                ) : status === 'pending' ? (
                  <View style={styles.circleNumberActive}>
                    <Text style={styles.circleNumberTextActive}>3</Text>
                  </View>
                ) : (
                  <View style={styles.circleNumberInactive}>
                    <Text style={styles.circleNumberTextInactive}>3</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.stepNodeText,
                    status === 'approved'
                      ? styles.stepNodeTextCompleted
                      : status === 'pending'
                        ? styles.stepNodeTextActive
                        : undefined,
                  ]}
                >
                  Approval
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0E5E2F" />
          </View>
        ) : (
          <>
            {/* Rejection note */}
            {status === 'rejected' && (
              <View style={styles.rejectedBanner}>
                <Ionicons name="alert-circle" size={20} color="#D32F2F" />
                <Text style={styles.rejectedBannerText}>
                  {reviewNotes
                    ? reviewNotes
                    : 'Your submission was rejected. Please re-upload your documents and resubmit.'}
                </Text>
              </View>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Required Documents</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>
                  {completedCount} of 3 Completed
                </Text>
              </View>
            </View>

            {/* Document List */}
            <View style={styles.docList}>
              {docs.map((doc, idx) => {
                const isApproved = status === 'approved';
                const hasFile = !!doc.state.url;
                return (
                  <React.Fragment key={doc.key}>
                    <View style={styles.docRow}>
                      <View style={styles.docRowLeft}>
                        <View
                          style={[
                            styles.docIconBox,
                            hasFile
                              ? styles.docIconBoxSuccess
                              : styles.docIconBoxPending,
                          ]}
                        >
                          <Ionicons
                            name={doc.icon}
                            size={22}
                            color={hasFile ? '#0E5E2F' : '#D32F2F'}
                          />
                        </View>
                        <View style={styles.docInfo}>
                          <Text style={styles.docTitle}>{doc.title}</Text>
                          <Text
                            style={
                              hasFile
                                ? styles.docStatusSuccess
                                : styles.docStatusPending
                            }
                          >
                            {doc.state.uploading
                              ? 'Uploading…'
                              : isApproved && hasFile
                                ? 'Verified'
                                : hasFile
                                  ? 'Document uploaded'
                                  : 'Pending upload'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.docActions}>
                        {hasFile && (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.viewDocBtn}
                            onPress={() => openDoc(doc.state.url)}
                          >
                            <Text style={styles.viewDocLink}>View</Text>
                          </TouchableOpacity>
                        )}

                        {isApproved ? (
                          <View style={styles.inlineSuccessBadge}>
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color="#0E5E2F"
                            />
                          </View>
                        ) : doc.state.uploading ? (
                          <ActivityIndicator size="small" color="#0E5E2F" />
                        ) : (
                          !locked && (
                            <TouchableOpacity
                              style={styles.rowUploadButton}
                              activeOpacity={0.8}
                              onPress={doc.onUpload}
                            >
                              <Ionicons
                                name={doc.uploadIcon}
                                size={15}
                                color="#493D1B"
                                style={{ marginRight: 6 }}
                              />
                              <Text style={styles.rowUploadButtonText}>
                                {hasFile ? 'Replace' : doc.uploadLabel}
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    </View>
                    {idx < docs.length - 1 && <View style={styles.rowDivider} />}
                  </React.Fragment>
                );
              })}
            </View>

            {/* Footer action */}
            <View style={styles.footer}>
              {status === 'pending' ? (
                <View style={styles.infoPill}>
                  <Ionicons name="time-outline" size={18} color="#493D1B" />
                  <Text style={styles.infoPillText}>
                    Your documents are under review.
                  </Text>
                </View>
              ) : status === 'approved' ? (
                <View style={[styles.infoPill, styles.infoPillSuccess]}>
                  <Ionicons name="checkmark-circle" size={18} color="#0E5E2F" />
                  <Text style={[styles.infoPillText, styles.infoPillTextSuccess]}>
                    Your business is verified.
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!allUploaded || submitting) && styles.submitButtonDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={!allUploaded || submitting}
                  onPress={handleSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#493D1B" />
                  ) : (
                    <>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={18}
                        color="#493D1B"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.submitButtonText}>
                        {status === 'rejected'
                          ? 'Resubmit for Review'
                          : 'Submit for Review'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
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
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F5C6C6',
  },
  rejectedBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#B71C1C',
    fontWeight: '600',
    lineHeight: 19,
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
  footer: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAD26B',
    borderRadius: 16,
    height: 54,
    shadowColor: '#EAD26B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#E7E5E4',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#493D1B',
    fontSize: 15,
    fontWeight: '800',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FBF6DE',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infoPillSuccess: {
    backgroundColor: '#EAF7EE',
  },
  infoPillText: {
    color: '#493D1B',
    fontSize: 14,
    fontWeight: '700',
  },
  infoPillTextSuccess: {
    color: '#0E5E2F',
  },
});

export default BusinessVerification;
