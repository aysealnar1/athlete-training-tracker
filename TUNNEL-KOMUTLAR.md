> Tünel kurulumu henüz yeni oturum yapısıyla test edilmedi. Bu geliştirme sürümünde README’deki yerel kurulum adımlarını kullanın.

# Telefon farklı ağda – Tünel ile çalıştırma (PowerShell)

Bilgisayar ve telefon aynı WiFi’de değilse: Expo’yu ve backend’i tünel üzerinden açarız.  
**3 terminal** kullanacaksınız. Sırayı bozmayın.

---

## Ön hazırlık (bir kez)

### ngrok kullanımı (kurulum gerekmez)

Aşağıda **Terminal 2** adımında `ngrok http 3001` yerine şunu kullanın:

```powershell
npx ngrok http 3001
```

(İlk seferde ngrok indirilir, sonra tünel açılır.)

**İsterseniz** ngrok’u bilgisayara da kurabilirsiniz: https://ngrok.com/download → indir, zip’i aç, içindeki `ngrok.exe` dosyasının olduğu klasörü PATH’e ekleyin. Sonra doğrudan `ngrok http 3001` yazabilirsiniz.

---

## Her çalıştırmada sıra

### Terminal 1 – Backend’i başlat

```powershell
cd "C:\PROJE_KLASORU"
cd server; npm run dev
```

“API http://localhost:3001” yazana kadar bekleyin. Bu terminali **kapatmayın**.

---

### Terminal 2 – Backend’i tünel ile dışarı aç (ngrok)

**Yeni bir PowerShell** açın:

```powershell
npx ngrok http 3001
```

Çıkan ekranda **https://xxxx-xx-xx-xxx.ngrok-free.app** gibi bir adres görünecek.  
Bu adresi **kopyalayın** (örn. `https://a1b2c3d4.ngrok-free.app`).

- Bu terminali de **açık bırakın**.

---

### Terminal 3 – API adresini tünel adresi yap

**mobile\lib\config.js** dosyasını açın.  
`API_BASE` satırlarındaki adresi, az önce kopyaladığınız **ngrok https adresi** ile değiştirin (sonunda **:3001 yazmayın**).

Örnek: ngrok adresiniz `https://a1b2c3d4.ngrok-free.app` ise:

```js
export const API_BASE = __DEV__
  ? 'https://a1b2c3d4.ngrok-free.app'
  : 'https://a1b2c3d4.ngrok-free.app';
```

Dosyayı kaydedin.

---

### Terminal 4 – Expo’yu tünel modunda başlat

**Yeni bir PowerShell** açın:

```powershell
cd "C:\PROJE_KLASORU\mobile"
npx expo start --tunnel
```

QR kod çıkacak. Telefonda **Expo Go** ile bu QR’ı tarayın.  
Uygulama tünel üzerinden açılır ve API istekleri ngrok üzerinden bilgisayarınızdaki backend’e gider.

---

## Özet sıra

| Sıra | Terminal | Komut / İşlem |
|------|----------|----------------|
| 1 | PowerShell 1 | `cd "C:\PROJE_KLASORU"` |
| 2 | PowerShell 1 | `cd server; npm run dev` |
| 3 | PowerShell 2 | `npx ngrok http 3001` → çıkan **https://...** adresini kopyala |
| 4 | Cursor / dosya | **mobile\lib\config.js** içinde `API_BASE` = ngrok adresi (port yok) |
| 5 | PowerShell 3 | `cd "C:\PROJE_KLASORU\mobile"` |
| 6 | PowerShell 3 | `npx expo start --tunnel` |
| 7 | Telefon | Expo Go ile QR kodu tara |

---

**Not:** ngrok ücretsiz sürümde her açılışta adres değişir. Her seferinde **Terminal 2**’de yeni adresi alıp **config.js**’teki `API_BASE`’i güncellemeniz gerekir.
