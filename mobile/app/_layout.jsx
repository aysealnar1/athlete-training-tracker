import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, Button, ScrollView, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api, onSessionExpired } from '../lib/api';

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', surname: '', email: '', password: '' });
  useEffect(() => onSessionExpired(() => setUser(null)), []);
  const submit = async () => {
    setBusy(true);
    try {
      if (register) {
        await api.registerCoach(form);
        setRegister(false);
        setForm(previous => ({ ...previous, password: '' }));
        Alert.alert('Kayıt başarılı', 'Şimdi giriş yapabilirsiniz.');
      } else {
        setUser(await api.loginCoach({ email: form.email, password: form.password }));
        setForm({ name: '', surname: '', email: '', password: '' });
      }
    } catch (error) { Alert.alert('İşlem tamamlanamadı', error.message); }
    finally { setBusy(false); }
  };
  const logout = async () => {
    setBusy(true);
    try { await api.logoutCoach(); setUser(null); }
    catch (error) { Alert.alert('Çıkış yapılamadı', error.message); }
    finally { setBusy(false); }
  };
  return <SafeAreaProvider>
    <StatusBar style="light" />
    {!user ? <SafeAreaView style={{ flex: 1, backgroundColor: '#0f1419' }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 16 }}>
        <Text style={{ color: '#fff', fontSize: 24 }}>{register ? 'Antrenör Kaydı' : 'Antrenör Girişi'}</Text>
        {(register ? ['name', 'surname', 'email', 'password'] : ['email', 'password']).map(field =>
          <TextInput key={field} accessibilityLabel={{ name: 'Ad', surname: 'Soyad', email: 'E-posta', password: 'Şifre' }[field]}
            placeholder={{ name: 'Ad', surname: 'Soyad', email: 'E-posta', password: 'Şifre (en az 10 karakter)' }[field]}
            placeholderTextColor="#8b949e" value={form[field]} editable={!busy}
            onChangeText={value => setForm(previous => ({ ...previous, [field]: value }))}
            secureTextEntry={field === 'password'} autoCapitalize={field === 'email' ? 'none' : 'sentences'}
            keyboardType={field === 'email' ? 'email-address' : 'default'}
            maxLength={field === 'password' ? 128 : field === 'email' ? 254 : 100}
            style={{ padding: 14, color: '#fff', borderWidth: 1, borderColor: '#30363d', borderRadius: 8 }} />)}
        <Button title={busy ? 'Bekleyin…' : register ? 'Kayıt Ol' : 'Giriş Yap'} disabled={busy} onPress={submit} />
        <Button title={register ? 'Girişe Dön' : 'Yeni Hesap Oluştur'} disabled={busy} onPress={() => setRegister(!register)} />
      </ScrollView>
    </SafeAreaView> : <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#0f1419' }}>
        <View style={{ padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff' }}>{user.name}</Text><Button title="Çıkış Yap" disabled={busy} onPress={logout} />
        </View>
      </SafeAreaView>
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#0f1419' }, headerTintColor: '#fff' }} />
    </>}
  </SafeAreaProvider>;
}
