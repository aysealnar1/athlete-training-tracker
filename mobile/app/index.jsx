import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../lib/api';
import { API_BASE } from '../lib/config';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const chartConfig = {
  backgroundGradientFrom: '#1a2332',
  backgroundGradientTo: '#243044',
  color: (opacity = 1) => `rgba(88, 166, 255, ${opacity})`,
  labelColor: () => '#8b949e',
  strokeWidth: 2,
};

export default function Dashboard() {
  const [branch, setBranch] = useState('Basketbol');
  const [branches, setBranches] = useState(['Basketbol']);
  const [search, setSearch] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [stats, setStats] = useState({ monthlyTrend: [], shotTypeDistribution: [], ageGroupSuccess: [] });
  const [form, setForm] = useState({ name: '', surname: '', height: '', weight: '', body_fat: '' });
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const load = async () => {
    setLoading(true);
    setConnectionError(false);
    try {
      const [br, list, st] = await Promise.all([
        api.getBranches(),
        api.getAthletes(branch, search),
        api.getBranchStats(branch),
      ]);
      setBranches(br || ['Basketbol']);
      setAthletes(Array.isArray(list) ? list : []);
      setStats(st || { monthlyTrend: [], shotTypeDistribution: [], ageGroupSuccess: [] });
    } catch (e) {
      setConnectionError(true);
      Alert.alert('Bağlantı hatası', e.message || 'Sunucuya ulaşılamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [branch, search]);

  const handleAdd = async () => {
    const name = (form.name || '').trim();
    const surname = (form.surname || '').trim();
    if (!name || !surname) {
      Alert.alert('Eksik bilgi', 'Ad ve soyad alanları zorunludur.');
      return;
    }
    setAdding(true);
    try {
      await api.createAthlete({
        branch,
        name,
        surname,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        body_fat: form.body_fat ? Number(form.body_fat) : null,
      });
      setForm({ name: '', surname: '', height: '', weight: '', body_fat: '' });
      load();
    } catch (err) {
      const msg = err?.message || (typeof err === 'string' ? err : 'Oyuncu eklenemedi.');
      Alert.alert('Hata', msg + '\n\nTelefon ve bilgisayar aynı WiFi\'de mi? mobile/lib/config.js içinde API_BASE bilgisayarınızın IP\'si mi?');
    } finally {
      setAdding(false);
    }
  };

  const trendData = stats.monthlyTrend?.length
    ? { labels: stats.monthlyTrend.map((d) => d.month.slice(5)), datasets: [{ data: stats.monthlyTrend.map((d) => d.pct) }] }
    : null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.section}>
        <Text style={s.label}>Branş</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.branchRow}>
          {(branches || ['Basketbol']).map((b) => (
            <TouchableOpacity
              key={b}
              style={[s.chip, branch === b && s.chipActive]}
              onPress={() => setBranch(b)}
            >
              <Text style={[s.chipText, branch === b && s.chipTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={s.section}>
        <Text style={s.label}>Arama</Text>
        <TextInput
          style={s.input}
          placeholder="İsim / Soyad..."
          placeholderTextColor="#8b949e"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {connectionError && (
        <View style={s.errorBanner}>
          <Text style={s.errorBannerText}>Sunucuya bağlanılamadı. Web'de eklediğiniz oyuncular burada görünmez.</Text>
          <Text style={s.errorBannerHint}>API: {API_BASE}</Text>
          <Text style={s.errorBannerHint}>Telefon ve bilgisayar aynı WiFi'de olmalı. Bilgisayarın IP'sini mobile/mobile/lib/config.js içinde API_BASE olarak yazın (Expo'da gördüğünüz exp://IP:8081 → http://IP:3001).</Text>
          <TouchableOpacity style={s.btnSecondary} onPress={() => load()}>
            <Text style={s.btnText}>Yenile</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Sporcular</Text>
        {loading ? (
          <ActivityIndicator color="#58a6ff" style={{ marginVertical: 16 }} />
        ) : connectionError ? (
          <Text style={s.muted}>Bağlantı kurulunca liste burada görünecek.</Text>
        ) : athletes.length === 0 ? (
          <Text style={s.muted}>Sporcu yok.</Text>
        ) : (
          athletes.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={s.listItem}
              onPress={() => router.push(`/athlete/${a.id}`)}
            >
              <Text style={s.listItemText}>{a.name} {a.surname}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      <View style={s.card}>
        <Text style={s.sectionTitle}>Sporcu Ekle</Text>
        <TextInput style={s.input} placeholder="Ad *" placeholderTextColor="#8b949e" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
        <TextInput style={s.input} placeholder="Soyad *" placeholderTextColor="#8b949e" value={form.surname} onChangeText={(v) => setForm((f) => ({ ...f, surname: v }))} />
        <TextInput style={s.input} placeholder="Boy (cm)" placeholderTextColor="#8b949e" value={form.height} onChangeText={(v) => setForm((f) => ({ ...f, height: v }))} keyboardType="numeric" />
        <TextInput style={s.input} placeholder="Kilo (kg)" placeholderTextColor="#8b949e" value={form.weight} onChangeText={(v) => setForm((f) => ({ ...f, weight: v }))} keyboardType="numeric" />
        <TextInput style={s.input} placeholder="Yağ oranı (%)" placeholderTextColor="#8b949e" value={form.body_fat} onChangeText={(v) => setForm((f) => ({ ...f, body_fat: v }))} keyboardType="numeric" />
        <TouchableOpacity style={s.btn} onPress={handleAdd} disabled={adding}>
          <Text style={s.btnText}>{adding ? 'Ekleniyor...' : 'Ekle'}</Text>
        </TouchableOpacity>
      </View>
      {trendData && trendData.datasets[0].data.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Ay ay isabet % (Takım)</Text>
          <LineChart
            data={trendData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={s.chart}
          />
        </View>
      )}
      {stats.shotTypeDistribution?.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Şut tipleri (isabet %)</Text>
          {stats.shotTypeDistribution.map((s, i) => (
            <Text key={i} style={s.muted}>{s.name}: %{s.value}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419' },
  content: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e6edf3', marginBottom: 8 },
  label: { fontSize: 12, color: '#8b949e', marginBottom: 4 },
  input: { backgroundColor: '#1a2332', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 12, color: '#e6edf3', fontSize: 16 },
  branchRow: { flexDirection: 'row', marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#243044', marginRight: 8 },
  chipActive: { backgroundColor: '#58a6ff' },
  chipText: { color: '#8b949e' },
  chipTextActive: { color: '#fff' },
  listItem: { backgroundColor: '#243044', padding: 14, borderRadius: 8, marginBottom: 6 },
  listItemText: { color: '#e6edf3', fontSize: 16 },
  card: { backgroundColor: '#1a2332', padding: 16, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#30363d' },
  btn: { backgroundColor: '#58a6ff', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnSecondary: { backgroundColor: '#30363d', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  muted: { color: '#8b949e', fontSize: 14 },
  chart: { borderRadius: 8 },
  errorBanner: { backgroundColor: '#3d1f1f', borderWidth: 1, borderColor: '#f85149', borderRadius: 10, padding: 16, marginBottom: 16 },
  errorBannerText: { color: '#f85149', fontWeight: '600', marginBottom: 8 },
  errorBannerHint: { color: '#8b949e', fontSize: 12, marginBottom: 4 },
});
