import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../../lib/api';
import CourtMap from '../../../components/CourtMap';

const SHOT_TYPES = [
  { id: 'Sabit Catch & Shoot', label: 'Sabit C&S', maxPoints: 1 },
  { id: 'Hareketli Catch & Shoot', label: 'Hareketli C&S', maxPoints: 2 },
  { id: 'Dribling Üzeri', label: 'Dribling', maxPoints: 2 },
  { id: 'Crossover Üzeri', label: 'Crossover', maxPoints: null },
];

function parsePoints(r) {
  if (!r) return [];
  if (Array.isArray(r.points)) return r.points;
  const raw = r.points_json ?? r.points;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw || '[]'); } catch { return []; }
  }
  return Array.isArray(raw) ? raw : [];
}

export default function Training() {
  const params = useLocalSearchParams();
  const athleteId = params?.id ?? params?.id?.[0];
  const trainingIdParam = params?.trainingId ?? params?.trainingId?.[0];
  const isNew = trainingIdParam === 'new' || !trainingIdParam;
  const trainingId = isNew ? null : String(trainingIdParam);

  const [athlete, setAthlete] = useState(null);
  const [training, setTraining] = useState(null);
  const [records, setRecords] = useState([]);
  const [currentType, setCurrentType] = useState(null);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [step, setStep] = useState('select');
  const [attemptedInput, setAttemptedInput] = useState('');
  const [madeInput, setMadeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!athleteId) return;
    api.getAthlete(String(athleteId))
      .then(setAthlete)
      .catch(() => router.back());
  }, [athleteId]);

  useEffect(() => {
    if (!athleteId) return;
    if (isNew) {
      api.createTraining(String(athleteId))
        .then((t) => {
          setTraining(t);
          setRecords([]);
        })
        .catch(() => router.back());
    } else {
      api.getTraining(trainingId)
        .then((t) => {
          setTraining(t);
          const list = Array.isArray(t?.records) ? t.records : [];
          setRecords(list.map((r) => ({
            shot_type: r.shot_type || 'Sabit Catch & Shoot',
            points: parsePoints(r),
            attempted: Number(r.attempted) || 0,
            made: Number(r.made) || 0,
          })));
        })
        .catch(() => router.back());
    }
  }, [athleteId, trainingId, isNew]);

  useEffect(() => {
    if (athlete && training) setLoading(false);
  }, [athlete, training]);

  const addPoint = (coord) => {
    const cfg = SHOT_TYPES.find((t) => t.id === currentType);
    if (cfg?.maxPoints != null && currentPoints.length >= cfg.maxPoints) return;
    setCurrentPoints((prev) => [...prev, coord]);
  };

  const goNext = () => {
    if (step === 'select') {
      if (!currentType) return;
      const cfg = SHOT_TYPES.find((t) => t.id === currentType);
      const max = cfg?.maxPoints;
      if (max === 1 && currentPoints.length >= 1) setStep('attempted');
      else if (max === 2 && currentPoints.length >= 2) setStep('attempted');
      else if (max == null) setStep('attempted');
      else return;
    } else if (step === 'attempted') {
      const n = parseInt(attemptedInput, 10);
      if (isNaN(n) || n < 0) {
        Alert.alert('Uyarı', 'Geçerli bir sayı girin.');
        return;
      }
      setStep('made');
    } else if (step === 'made') {
      const attempted = parseInt(attemptedInput, 10);
      const made = parseInt(madeInput, 10);
      if (isNaN(made) || made < 0 || made > attempted) {
        Alert.alert('Uyarı', 'İsabetli sayısı 0 ile atılan şut sayısı arasında olmalıdır.');
        return;
      }
      setRecords((prev) => [...prev, {
        shot_type: currentType,
        points: [...currentPoints],
        attempted,
        made,
      }]);
      setCurrentType(null);
      setCurrentPoints([]);
      setAttemptedInput('');
      setMadeInput('');
      setStep('select');
    }
  };

  const handleSave = async () => {
    const tid = training?.id;
    if (!tid) return;
    setSaving(true);
    try {
      await api.saveTraining(tid, records.map((r) => ({
        shot_type: r.shot_type,
        points: Array.isArray(r.points) ? r.points : [],
        attempted: Number(r.attempted) || 0,
        made: Number(r.made) || 0,
      })));
      router.replace(`/athlete/${athleteId}`);
    } catch (err) {
      Alert.alert('Hata', err?.message || 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const maxPts = currentType ? (SHOT_TYPES.find((t) => t.id === currentType)?.maxPoints ?? 2) : 0;

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.centered]} edges={['bottom']}>
        <ActivityIndicator size="large" color="#58a6ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={s.headerTitle}>
          {athlete?.name} {athlete?.surname} — Antrenman
        </Text>

        <View style={s.sidebar}>
          <Text style={s.sectionTitle}>Şut tipi</Text>
          {SHOT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[s.chip, currentType === t.id && s.chipActive]}
              onPress={() => { if (step === 'select') { setCurrentType(t.id); setCurrentPoints([]); } }}
            >
              <Text style={[s.chipText, currentType === t.id && s.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.courtWrap}>
          <CourtMap
            points={currentPoints}
            onPointAdd={addPoint}
            maxPoints={maxPts}
            disabled={!currentType || step !== 'select'}
          />
        </View>

        {(step === 'attempted' || step === 'made') && (
          <Modal visible transparent animationType="fade">
            <Pressable style={s.popupOverlay}>
              <View style={s.popup}>
                {step === 'attempted' && (
                  <>
                    <Text style={s.popupLabel}>Kaç şut atıldı?</Text>
                    <TextInput
                      style={s.popupInput}
                      value={attemptedInput}
                      onChangeText={setAttemptedInput}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#8b949e"
                    />
                  </>
                )}
                {step === 'made' && (
                  <>
                    <Text style={s.popupLabel}>Kaç tanesi isabetli?</Text>
                    <TextInput
                      style={s.popupInput}
                      value={madeInput}
                      onChangeText={setMadeInput}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#8b949e"
                    />
                    <Text style={s.muted}>En fazla {attemptedInput || 0}</Text>
                  </>
                )}
                <TouchableOpacity style={s.btn} onPress={goNext}>
                  <Text style={s.btnText}>Sıradaki</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}

        {step === 'select' && (
          <View style={s.row}>
            <Text style={s.muted}>
              {currentType
                ? (currentPoints.length ? `Nokta: ${currentPoints.length}` : 'Sahada nokta seçin')
                : 'Şut tipi seçin'}
            </Text>
            <TouchableOpacity style={s.btn} onPress={goNext}>
              <Text style={s.btnText}>Sıradaki</Text>
            </TouchableOpacity>
          </View>
        )}

        {records.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Kayıtlar ({records.length})</Text>
            {records.map((r, i) => (
              <Text key={i} style={s.muted}>{r.shot_type}: {r.made}/{r.attempted} isabet</Text>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btn} onPress={handleSave} disabled={saving}>
          <Text style={s.btnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  headerTitle: { fontSize: 16, color: '#e6edf3', marginBottom: 12 },
  sidebar: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e6edf3', marginBottom: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#243044', marginBottom: 6 },
  chipActive: { backgroundColor: '#58a6ff' },
  chipText: { color: '#8b949e' },
  chipTextActive: { color: '#fff' },
  courtWrap: { minHeight: 320, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  btn: { backgroundColor: '#58a6ff', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  muted: { color: '#8b949e', fontSize: 14 },
  card: { backgroundColor: '#1a2332', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#30363d' },
  popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  popup: { backgroundColor: '#1a2332', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#30363d' },
  popupLabel: { fontSize: 16, fontWeight: '600', color: '#e6edf3', marginBottom: 8 },
  popupInput: { backgroundColor: '#0f1419', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 14, color: '#e6edf3', fontSize: 18, marginBottom: 12 },
  footer: { padding: 16, paddingBottom: 34, backgroundColor: '#0f1419', borderTopWidth: 1, borderTopColor: '#30363d' },
});
