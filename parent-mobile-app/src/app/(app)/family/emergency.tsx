import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface EmergencyContact {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  relationship: string;
  identity_number: string | null;
  sort_order: number;
}

interface ContactForm {
  first_name: string;
  last_name: string;
  phone: string;
  relationship: string;
  identity_number: string;
}

const emptyForm: ContactForm = {
  first_name: '',
  last_name: '',
  phone: '',
  relationship: '',
  identity_number: '',
};

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await api.get<{ data: EmergencyContact[] }>(
        '/parent/family/emergency-contacts'
      );
      setContacts(response.data.data);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchContacts(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.phone,
      relationship: contact.relationship,
      identity_number: contact.identity_number ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Hata', 'Ad ve soyad zorunludur.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('Hata', 'Telefon numarası zorunludur.');
      return;
    }
    if (!form.relationship.trim()) {
      Alert.alert('Hata', 'İlişki türü zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        relationship: form.relationship.trim(),
        identity_number: form.identity_number.trim() || undefined,
      };

      if (editingId) {
        await api.put(`/parent/family/emergency-contacts/${editingId}`, payload);
      } else {
        await api.post('/parent/family/emergency-contacts', payload);
      }

      setShowModal(false);
      void fetchContacts(true);
    } catch (err: unknown) {
      Alert.alert('Hata', getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Acil Kişiyi Sil',
      `${contact.first_name} ${contact.last_name} kişisini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/parent/family/emergency-contacts/${contact.id}`);
              void fetchContacts(true);
            } catch (err: unknown) {
              Alert.alert('Hata', getApiError(err));
            }
          },
        },
      ]
    );
  };

  const updateField = (key: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Acil Kişiler</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openAdd}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIconBox}>
              <Text style={styles.cardIcon}>🚨</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.contactName}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={styles.contactRelation}>{item.relationship}</Text>
              <Text style={styles.contactPhone}>📞 {item.phone}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => openEdit(item)}
                activeOpacity={0.7}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                activeOpacity={0.7}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#208AEF"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚨</Text>
            <Text style={styles.emptyTitle}>Acil kişi eklenmedi</Text>
            <Text style={styles.emptyText}>
              Olası acil durumlarda ulaşılacak kişileri ekleyin.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={openAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>İlk Kişiyi Ekle</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Kişiyi Düzenle' : 'Acil Kişi Ekle'}
            </Text>

            <View style={styles.row}>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Ad *</Text>
                <TextInput
                  style={styles.input}
                  value={form.first_name}
                  onChangeText={(v) => updateField('first_name', v)}
                  placeholder="Ad"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Soyad *</Text>
                <TextInput
                  style={styles.input}
                  value={form.last_name}
                  onChangeText={(v) => updateField('last_name', v)}
                  placeholder="Soyad"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Telefon *</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(v) => updateField('phone', v)}
                placeholder="+90 5xx xxx xx xx"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>İlişki Türü *</Text>
              <TextInput
                style={styles.input}
                value={form.relationship}
                onChangeText={(v) => updateField('relationship', v)}
                placeholder="Anne, Baba, Büyükanne, Amca..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>TC Kimlik No (İsteğe bağlı)</Text>
              <TextInput
                style={styles.input}
                value={form.identity_number}
                onChangeText={(v) => updateField('identity_number', v)}
                placeholder="12345678901"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backText: { color: '#208AEF', fontSize: 15, fontWeight: '500', width: 60 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  addBtn: {
    backgroundColor: '#208AEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: { fontSize: 20 },
  info: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  contactRelation: { fontSize: 12, color: '#208AEF', fontWeight: '500', marginTop: 2 },
  contactPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  editBtn: { padding: 6 },
  editBtnText: { fontSize: 16 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  emptyButton: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1F2937',
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
