# Sporcu Şut Takip – Expo Go (iOS / Android)

Bu klasör, **Expo Go** ile iPhone veya Android telefonunuzda çalışan mobil uygulamadır. Web arayüzü ve backend API ile aynı veritabanını kullanır.

## Gereksinimler

- Node.js (v18+)
- Bilgisayar ve telefon **aynı WiFi ağında**
- Backend (API) çalışıyor olmalı (proje kökünde veya `server` klasöründe)

## 1. API adresini ayarlayın

Telefon, bilgisayarınızdaki API’ye bağlanacak. Bunun için bilgisayarınızın **yerel IP adresini** yazmanız gerekir.

1. **Windows:** Komut İstemi’nde `ipconfig` yazın → **IPv4 Address** (örn. `192.168.1.5`)
2. **Mac:** Sistem Tercihleri → Ağ → Gelişmiş → TCP/IP veya Terminal’de `ifconfig`

`mobile/config.js` dosyasını açın ve `API_BASE` değerini kendi IP’nize göre değiştirin:

```js
export const API_BASE = 'http://192.168.1.5:3001';  // Kendi IP'nizi yazın
```

Port `3001` backend’in çalıştığı port olmalı (varsayılan).

## 2. Backend’i başlatın

Proje kökünde (bitirme projesi klasöründe) veya `server` klasöründe:

```bash
cd server
npm run dev
```

“API http://localhost:3001” mesajını gördüğünüzde API hazırdır.

## 3. Mobil uygulamayı başlatın

```bash
cd mobile
npm install
npx expo start
```

Tarayıcıda veya terminalde **Expo Dev Tools** açılır. QR kodu görürsünüz.

## 4. iPhone’da Expo Go ile açma

1. App Store’dan **Expo Go** uygulamasını indirin.
2. iPhone’unuzun kamerası ile terminaldeki (veya tarayıcıdaki) **QR kodu** tarayın.
3. Çıkan bildirimde “Expo Go’da Aç” deyin.
4. Uygulama yüklenecek ve açılacak.

**Not:** iPhone’da QR ile açmak için bilgisayar ve telefon aynı WiFi’de olmalı. Bağlantı hatası alırsanız `config.js` içindeki IP’yi kontrol edin; bazen router farklı bir IP verir (örn. 192.168.0.x).

## Özet

| Adım | Ne yapılır |
|------|------------|
| 1 | `mobile/app/lib/config.js` → `API_BASE` = `http://BILGISAYAR_IP:3001` |
| 2 | `server` klasöründe `npm run dev` (backend açık kalsın) |
| 3 | `mobile` klasöründe `npm install` sonra `npx expo start` |
| 4 | Telefonda Expo Go ile QR kodu tara, uygulama açılsın |

Bağlantı hatası alırsanız: bilgisayarınızda Windows Güvenlik Duvarı veya antivirüs 3001 portunu engelliyor olabilir; geçici olarak izin verin veya kapatıp tekrar deneyin.

---

## "Request timed out" / exp://... bağlanamıyor

Telefon bilgisayara (port 8081) ulaşamıyorsa **tünel modu** kullanın:

```bash
cd mobile
npm run start:tunnel
```

veya `npx expo start --tunnel`. QR kodu tünel URL ile gelir; telefon aynı WiFi'de olmasa da bağlanabilir. İlk seferde `@expo/ngrok` yüklenecektir.

Alternatif: Windows Güvenlik Duvarı'nda **8081** (ve isteğe bağlı 19000, 19001) portuna izin verin.
