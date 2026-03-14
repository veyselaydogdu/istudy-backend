import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api from '../../../lib/api';
import { getApiError } from '../../../lib/auth';

interface School {
  id: number;
  name: string;
  type: string | null;
  address: string | null;
  phone: string | null;
  logo: string | null;
  joined_at: string | null;
}

function SchoolInitials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`
    : name.substring(0, 2);
  return (
    <View style={styles.schoolAvatar}>
      <Text style={styles.schoolAvatarText}>{initials.toUpperCase()}</Text>
    </View>
  );
}

export default function SchoolsScreen() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchools = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { setLoading(true); }
    setError(null);
    try {
      const response = await api.get<{ data: School[] }>('/parent/schools');
      setSchools(response.data.data);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchSchools();
  }, [fetchSchools]);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchSchools(true);
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
        <View>
          <Text style={styles.headerSub}>Kayıtlı</Text>
          <Text style={styles.headerTitle}>Okullarım</Text>
        </View>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => router.push('/(app)/schools/join')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.joinButtonText}>Katıl</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={schools}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/schools/${item.id}`)}
            activeOpacity={0.75}
          >
            <SchoolInitials name={item.name} />
            <View style={styles.cardInfo}>
              <Text style={styles.schoolName} numberOfLines={1}>{item.name}</Text>
              {item.type && (
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipText}>{item.type}</Text>
                </View>
              )}
              {item.address && (
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.schoolAddress} numberOfLines={1}>{item.address}</Text>
                </View>
              )}
              {item.joined_at && (
                <Text style={styles.joinedAt}>
                  Katılım: {new Date(item.joined_at).toLocaleDateString('tr-TR')}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#208AEF" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="school-outline" size={40} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Kayıtlı okul yok</Text>
            <Text style={styles.emptyText}>Davet kodu ile bir okula katılabilirsiniz.</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(app)/schools/join')}
              activeOpacity={0.8}
            >
              <Ionicons name="enter-outline" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Okula Katıl</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerSub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  joinButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
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
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  schoolAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  schoolAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#208AEF',
  },
  cardInfo: { flex: 1 },
  schoolName: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 5 },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
  },
  typeChipText: { fontSize: 11, color: '#208AEF', fontWeight: '600' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  schoolAddress: { fontSize: 12, color: '#9CA3AF', flex: 1 },
  joinedAt: { fontSize: 11, color: '#C4C9D4' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#208AEF',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
