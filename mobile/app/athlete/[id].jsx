import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';

export default function AthleteDetail() {
  const params = useLocalSearchParams();
  const id = params?.id ?? params?.id?.[0];
  const [athlete, setAthlete] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [stats, setStats] = useState({ progression: [], shotTypeDistribution: [] });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', surname: '', height: '', weight: '', body_fat: '', birth_date: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [a, t, s] = await Promise.all([
        api.getAthlete(String(id)),
        api.getTrainings(String(id)),
        api.getAthleteStats(String(id)),
      ]);
      setAthlete(a);
      setTrainings(Array.isArray(t) ? t : []);
      setStats({
        progression: Array.isArray(s?.progression) ? s.progression : [],
        shotTypeDistribution: Array.isArray(s?.shotTypeDistribution) ? s.shotTypeDistribution : [],
      });
      if (a) {
        setEditForm({
          name: String(a.name ?? ''),
          surname: String(a.surname ?? ''),
          height: a.height != null ? String(a.height) : '',
          weight: a.weight != null ? String(a.weight) : '',
          body_fat: a.body_fat != null ? String(a.body_fat) : '',
          birth_date: a.birth_date ? String(a.birth_date).slice(0, 10) : '',
        });
      }
    } catch (e) {
      Alert.alert('Hata', e?.message || 'Bağlantı hatası.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const filteredTrainings = trainings.filter((tr) => {
    const d = tr.created_at ? String(tr.created_at).slice(0, 10) : '';
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });

  const handleSaveEdit = async () => {
    try {
      await api.updateAthlete(String(id), {
        name: editForm.name,
        surname: editForm.surname,
        height: editForm.height ? Number(editForm.height) : null,
        weight: editForm.weight ? Number(editForm.weight) : null,
        body_fat: editForm.body_fat ? Number(editForm.body_fat) : null,
        birth_date: editForm.birth_date || null,
      });
      setEditModal(false);
      load();
    } catch (err) {
      Alert.alert('Hata', err?.message || 'Kaydedilemedi.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Sporcuyu Sil',
      'Bu sporcuyu ve tüm antrenman verilerini silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAthlete(String(id));
              router.replace('/');
            } catch (err) {
              Alert.alert('Hata', err?.message || 'Silinemedi.');
            }
          },
        },
      ]
    );
  };

  const createTraining = async () => {
    try {
      const t = await api.createTraining(String(id));
      if (t?.id) router.push(`/athlete/${id}/training/${t.id}`);
    } catch (err) {
      Alert.alert('Hata', err?.message || 'Antrenman oluşturulamadı.');
    }
  };

  const openTraining = (trainingId) => {
    if (trainingId) router.push(`/athlete/${id}/training/${trainingId}`);
  };

  if (loading || !athlete) {
    return (
      <SafeAreaView style={[s.container, s.centered]} edges={['bottom']}>
        <ActivityIndicator size="large" color="#58a6ff" />
      </SafeAreaView>
    );
  }

  const { progression, shotTypeDistribution } = stats;

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.title}>{athlete.name} {athlete.surname}</Text>
        <View style={s.row}>
          <TouchableOpacity style={s.btnGhost} onPress={() => setEditModal(true)}>
            <Text style={s.btnGhostText}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnGhost, s.btnDanger]} onPress={handleDelete}>
            <Text style={s.btnDangerText}>Sil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btn} onPress={createTraining}>
            <Text style={s.btnText}>Antrenman Oluştur</Text>
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <Text style={s.label}>Tarih aralığı (YYYY-MM-DD)</Text>
          <View style={s.rowInput}>
            <TextInput
              style={s.inputFlex}
              placeholder="Başlangıç"
              placeholderTextColor="#8b949e"
              value={dateFrom}
              onChangeText={setDateFrom}
            />
            <TextInput
              style={s.inputFlex}
              placeholder="Bitiş"
              placeholderTextColor="#8b949e"
              value={dateTo}
              onChangeText={setDateTo}
            />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Antrenmanlar</Text>
          {filteredTrainings.length === 0 ? (
            <Text style={s.muted}>Antrenman yok.</Text>
          ) : (
            filteredTrainings.map((tr, i) => (
              <TouchableOpacity
                key={tr.id}
                style={s.listItem}
                onPress={() => openTraining(tr.id)}
              >
                <Text style={s.listItemText}>
                  {filteredTrainings.length - i}. Antrenman — {tr.created_at ? String(tr.created_at).slice(0, 16).replace('T', ' ') : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {progression.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Şut isabet % gelişimi</Text>
            {progression.map((item, i) => (
              <Text key={i} style={s.muted}>
                {item.label ?? `${i + 1}. Antrenman`}: %{item.pct ?? 0}
              </Text>
            ))}
          </View>
        )}

        {shotTypeDistribution.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Şut türü dağılımı (isabet %)</Text>
            {shotTypeDistribution.map((item, i) => (
              <Text key={i} style={s.muted}>{item.name}: %{item.value ?? 0}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={editModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setEditModal(false)}>
          <Pressable style={s.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={s.sectionTitle}>Bilgileri düzenle</Text>
            <TextInput style={s.input} placeholder="Ad" placeholderTextColor="#8b949e" value={editForm.name} onChangeText={(v) => setEditForm((f) => ({ ...f, name: v }))} />
            <TextInput style={s.input} placeholder="Soyad" placeholderTextColor="#8b949e" value={editForm.surname} onChangeText={(v) => setEditForm((f) => ({ ...f, surname: v }))} />
            <TextInput style={s.input} placeholder="Boy (cm)" placeholderTextColor="#8b949e" value={editForm.height} onChangeText={(v) => setEditForm((f) => ({ ...f, height: v }))} keyboardType="numeric" />
            <TextInput style={s.input} placeholder="Kilo (kg)" placeholderTextColor="#8b949e" value={editForm.weight} onChangeText={(v) => setEditForm((f) => ({ ...f, weight: v }))} keyboardType="numeric" />
            <TextInput style={s.input} placeholder="Yağ oranı (%)" placeholderTextColor="#8b949e" value={editForm.body_fat} onChangeText={(v) => setEditForm((f) => ({ ...f, body_fat: v }))} keyboardType="numeric" />
            <TextInput style={s.input} placeholder="Doğum tarihi (YYYY-MM-DD)" placeholderTextColor="#8b949e" value={editForm.birth_date} onChangeText={(v) => setEditForm((f) => ({ ...f, birth_date: v }))} />
            <View style={s.modalRow}>
              <TouchableOpacity style={[s.btnGhost, s.modalBtn]} onPress={() => setEditModal(false)}>
                <Text style={s.btnGhostText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.modalBtn]} onPress={handleSaveEdit}>
                <Text style={s.btnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#e6edf3', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e6edf3', marginBottom: 8 },
  label: { fontSize: 12, color: '#8b949e', marginBottom: 4 },
  input: { backgroundColor: '#0f1419', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 12, color: '#e6edf3', fontSize: 16, marginBottom: 8 },
  inputFlex: { flex: 1, backgroundColor: '#0f1419', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 12, color: '#e6edf3', fontSize: 16 },
  rowInput: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  btn: { backgroundColor: '#58a6ff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#30363d', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  btnGhostText: { color: '#e6edf3' },
  btnDanger: { borderColor: '#f85149' },
  btnDangerText: { color: '#f85149' },
  listItem: { backgroundColor: '#243044', padding: 14, borderRadius: 8, marginBottom: 6 },
  listItemText: { color: '#e6edf3', fontSize: 14 },
  card: { backgroundColor: '#1a2332', padding: 16, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#30363d' },
  muted: { color: '#8b949e', fontSize: 14, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#1a2332', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#30363d' },
  modalRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modalBtn: { flex: 1 },
});
