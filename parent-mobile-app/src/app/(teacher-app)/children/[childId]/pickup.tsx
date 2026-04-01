import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../../lib/api';
import { getApiError } from '../../../../lib/auth';

interface AuthorizedPickup {
  id: number;
  name: string;
  phone: string | null;
  relationship: string | null;
}

interface PickupLog {
  id: number;
  picked_by_name: string;
  picked_at: string;
  notes: string | null;
}

export default function PickupScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [authorizedPickups, setAuthorizedPickups] = useState<AuthorizedPickup[]>([]);
  const [pickupLogs, setPickupLogs] = useState<PickupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [useListedPerson, setUseListedPerson] = useState(true);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [pickupsRes, logsRes] = await Promise.all([
          api.get<{ data: AuthorizedPickup[] }>(
            `/teacher/children/${childId}/authorized-pickups`
          ),
          api.get<{ data: PickupLog[] }>(
            `/teacher/children/${childId}/pickup-logs`
          ),
        ]);
        setAuthorizedPickups(pickupsRes.data.data);
        setPickupLogs(logsRes.data.data);
      } catch (err: unknown) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera izni gereklidir.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickup = async () => {
    const pickedByName = useListedPerson
      ? authorizedPickups.find((p) => p.id === selectedPickupId)?.name
      : customName.trim();

    if (!pickedByName) {
      Alert.alert('Hata', 'Lütfen teslim eden kişiyi seçin veya girin.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('picked_by_name', pickedByName);
      if (useListedPerson && selectedPickupId) {
        formData.append('authorized_pickup_id', String(selectedPickupId));
      }
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }
      if (photoUri) {
        const filename = photoUri.split('/').pop() ?? 'photo.jpg';
        formData.append('picked_by_photo', {
          uri: photoUri,
          name: filename,
          type: 'image/jpeg',
        } as unknown as Blob);
      }

      await api.post(`/teacher/children/${childId}/record-pickup`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Refresh logs
      const logsRes = await api.get<{ data: PickupLog[] }>(
        `/teacher/children/${childId}/pickup-logs`
      );
      setPickupLogs(logsRes.data.data);
      setModalVisible(false);
      resetModal();
      Alert.alert('Başarılı', 'Teslim işlemi kaydedildi.');
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setUseListedPerson(true);
    setSelectedPickupId(null);
    setCustomName('');
    setNotes('');
    setPhotoUri(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#208AEF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teslim İşlemi</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Authorized pickups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yetkili Alıcılar</Text>
          {authorizedPickups.length === 0 ? (
            <Text style={styles.emptyText}>Kayıtlı yetkili alıcı yok.</Text>
          ) : (
            authorizedPickups.map((pickup) => (
              <View key={pickup.id} style={styles.pickupCard}>
                <View style={styles.pickupAvatar}>
                  <Ionicons name="person" size={20} color="#208AEF" />
                </View>
                <View style={styles.pickupInfo}>
                  <Text style={styles.pickupName}>{pickup.name}</Text>
                  {pickup.relationship && (
                    <Text style={styles.pickupRelation}>{pickup.relationship}</Text>
                  )}
                  {pickup.phone && (
                    <Text style={styles.pickupPhone}>{pickup.phone}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Teslim et button */}
        <TouchableOpacity
          style={styles.pickupBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="car" size={20} color="#FFFFFF" />
          <Text style={styles.pickupBtnText}>Teslim Et</Text>
        </TouchableOpacity>

        {/* Pickup history */}
        {pickupLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Geçmiş Teslimler</Text>
            {pickupLogs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logRow}>
                  <Ionicons name="person-outline" size={15} color="#6B7280" />
                  <Text style={styles.logName}>{log.picked_by_name}</Text>
                </View>
                <View style={styles.logRow}>
                  <Ionicons name="time-outline" size={15} color="#6B7280" />
                  <Text style={styles.logDate}>
                    {new Date(log.picked_at).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {log.notes && (
                  <Text style={styles.logNotes}>{log.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pickup Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(false);
          resetModal();
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Teslim Et</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetModal();
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, useListedPerson && styles.toggleBtnActive]}
                onPress={() => setUseListedPerson(true)}
                activeOpacity={0.75}
              >
                <Text style={[styles.toggleBtnText, useListedPerson && styles.toggleBtnTextActive]}>
                  Listeden Seç
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !useListedPerson && styles.toggleBtnActive]}
                onPress={() => setUseListedPerson(false)}
                activeOpacity={0.75}
              >
                <Text style={[styles.toggleBtnText, !useListedPerson && styles.toggleBtnTextActive]}>
                  Listedeki Kişi Değil
                </Text>
              </TouchableOpacity>
            </View>

            {useListedPerson ? (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Alıcı Seç</Text>
                {authorizedPickups.map((pickup) => (
                  <TouchableOpacity
                    key={pickup.id}
                    style={[
                      styles.pickupSelectRow,
                      selectedPickupId === pickup.id && styles.pickupSelectRowActive,
                    ]}
                    onPress={() => setSelectedPickupId(pickup.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.pickupSelectRadio}>
                      {selectedPickupId === pickup.id && (
                        <View style={styles.pickupSelectRadioInner} />
                      )}
                    </View>
                    <Text style={styles.pickupSelectName}>{pickup.name}</Text>
                    {pickup.relationship && (
                      <Text style={styles.pickupSelectRelation}>{pickup.relationship}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Kişi Adı</Text>
                <TextInput
                  style={styles.textInput}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="Ad Soyad"
                  placeholderTextColor="#C4C9D4"
                />
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Notlar</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Notlar..."
                placeholderTextColor="#C4C9D4"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Fotoğraf</Text>
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.75}
              >
                <Ionicons name="camera-outline" size={20} color="#208AEF" />
                <Text style={styles.cameraBtnText}>Fotoğraf Çek</Text>
              </TouchableOpacity>
              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handlePickup}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Teslim Et</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  pickupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pickupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupInfo: {
    flex: 1,
    gap: 2,
  },
  pickupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  pickupRelation: {
    fontSize: 12,
    color: '#208AEF',
    fontWeight: '600',
  },
  pickupPhone: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pickupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pickupBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 5,
    marginBottom: 8,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  logDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  logNotes: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  modalScroll: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  toggleBtnActive: {
    backgroundColor: '#208AEF',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  modalSection: {
    marginBottom: 18,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickupSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickupSelectRowActive: {
    borderColor: '#208AEF',
    backgroundColor: '#EFF6FF',
  },
  pickupSelectRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupSelectRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#208AEF',
  },
  pickupSelectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  pickupSelectRelation: {
    fontSize: 12,
    color: '#208AEF',
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  cameraBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#208AEF',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
