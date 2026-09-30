# Sporcu ve Antrenman Şut Takip Sistemi

Antrenörlerin sporcu bilgilerini, antrenmanlarını ve şut performansını takip edebildiği bir üniversite bitirme projesidir. Sporcular Basketbol ve Voleybol branşlarına göre listelenir; şut kaydı ekranında basketbol şut türleri ve saha haritası kullanılır.

Bu depoda çalışan web uygulaması, Node.js API sunucusu ve geliştirme aşamasındaki mobil uygulama bulunur. Web tarafındaki temel kullanım akışları yerel ortamda kontrol edilmiştir. Mobil uygulamanın fiziksel cihaz testi henüz yapılmamıştır.

## Özellikler

- Antrenör hesabı oluşturma, giriş yapma ve çıkış yapma.
- Hesaba bağlı sporcu ve antrenman kayıtları.
- Branşa göre sporcu listeleme ve isme göre arama.
- Sporcu ekleme ve düzenleme: ad, soyad, boy, kilo, yağ oranı, doğum tarihi ve cinsiyet.
- Doğum tarihini takvimden seçme ve yaşın otomatik hesaplanması.
- Sporcu detayları, antrenman oluşturma ve mevcut şut kayıtlarını düzenleme.
- Saha üzerinde şut noktalarını işaretleme; şut türü, deneme ve isabet sayısı kaydetme.
- Antrenman listesini başlangıç ve bitiş tarihlerini takvimden seçerek filtreleme.
- Sporcu gelişimi, aylık performans, şut türü ve yaş grubu başarı grafikleri.
- SQLite ile kayıtların uygulama kapatıldıktan sonra da saklanması.

## Ekran görüntüleri

Görseller yerel uygulamada örnek sporcu ve antrenman kayıtlarıyla alınmıştır.

### Genel panel

Branşa göre sporcu listesi ve performans grafikleri.

![Sporcu listesi ve genel performans grafikleri](docs/screenshots/genel-panel.png)

### Sporcu detayı

Sporcu bilgileri, takvimle tarih filtreleme ve antrenman gelişimi.

![Deniz Test sporcu detayları ve antrenman gelişim grafikleri](docs/screenshots/sporcu-detay.png)

### Şut haritası

Şut türü seçimi, saha üzerinde nokta işaretleme ve antrenman kayıtları.

![Antrenman saha haritası ve mevcut şut kayıtları](docs/screenshots/sut-haritasi.png)

### Karşılama ekranı

Antrenör girişi ve yeni hesap oluşturma seçenekleri.

![Antrenman analizi karşılama ekranı](docs/screenshots/karsilama.png)

## Teknolojiler

| Katman | Teknolojiler |
| --- | --- |
| Web | React, Vite, React Router, Recharts, Lucide |
| Sunucu | Node.js, Express |
| Veritabanı | SQLite, better-sqlite3 |
| Mobil | React Native, Expo, Expo Router |
| Testler | Node.js test runner |

## Ekip çalışması ve katkılar

Proje ekip çalışması olarak geliştirilmiştir. Bu depo, **Ayşe Gül Alnar’ın üzerinde çalıştığı sürümü** içerir.

- **Ayşe Gül Alnar:** Frontend arayüzleri, tasarım, analiz ve veri görselleştirme ekranları, API entegrasyonu ve bu sürümün son düzenlemeleri.
- **Efe Telimen:** Projenin başlangıcındaki backend ve veritabanı çalışmaları; proje raporlarında bu alanların görev sorumluluğu.

Bu açıklama ekipteki görev dağılımını belirtir; depodaki bütün kodun tek kişi tarafından yazıldığı anlamına gelmez. İlk proje sonrasında oturum ve veri doğrulama kontrolleri, tarih seçimi ve kişisel bilgi alanları ile yayın hazırlığı AI desteğiyle geliştirilmiştir.

## Yerel kurulum

Bu sürüm Windows üzerinde **Node.js 24** ile çalıştırılıp kontrol edilmiştir. Node.js, npm ve Git kurulu olmalıdır.

Depoyu indirdikten sonra proje ana klasöründe bir terminal açın. Önce bağımlılıkları yükleyin:

```sh
npm install
npm run install:all
```

Ardından web uygulamasını ve API sunucusunu birlikte başlatın:

```sh
npm run dev
```

Tarayıcıda **http://localhost:5173** adresini açın. API sunucusu varsayılan olarak **http://127.0.0.1:3001** adresinde çalışır. Uygulamayı kullanırken terminal açık kalmalıdır; durdurmak için `Ctrl+C` kullanın.

İlk kullanımda yeni bir antrenör hesabı oluşturup giriş yapın. Şifre 10–128 karakter olmalıdır. Depoda hazır hesap veya kişisel sporcu verisi bulunmaz.

Veritabanı ilk çalıştırmada `server/sport.db` dosyasında otomatik oluşturulur. Bu dosya Git takibinin dışındadır. Yerel kayıtların korunması için dosyayı saklayın.

## Proje yapısı

| Klasör | İçerik |
| --- | --- |
| `client/` | React web arayüzü |
| `server/` | Express API, SQLite erişimi ve sunucu testleri |
| `mobile/` | Geliştirme aşamasındaki Expo mobil uygulaması |
| `SutSayaci/` | Korunan Expo başlangıç şablonu; ana web uygulaması için gerekli değildir |

## Kontroller ve mevcut durum

Sunucu testlerini çalıştırmak için proje ana klasöründen:

```sh
cd server
npm test
```

Web derlemesini kontrol etmek için proje ana klasöründen:

```sh
cd client
npm run build
```

Son yerel doğrulamada **18 sunucu testi geçti** ve web üretim derlemesi tamamlandı. Testler geçici veritabanları kullanır; mevcut sporcu kayıtlarını değiştirmez.

Tarayıcıda sporcu ekleme ve düzenleme, doğum tarihinden yaş hesaplama, cinsiyet seçimi, antrenman kaydı, grafikler, takvimle tarih filtreleme, çıkış ve yeniden giriş sonrası kayıtların korunması kontrol edildi. Çıkıştan sonra tarayıcının geri düğmesiyle korumalı panele erişilemediği de kontrol edildi.

Antrenman düzenleme ve silme akışlarının kapsamlı arayüz kontrolü, küçük ekranlarda görünüm kontrolü ve mobil fiziksel cihaz testi sonraki geliştirme işleridir. Üretim ortamına dağıtım henüz doğrulanmamıştır.

## Oturum ve veri kontrolleri

- Parolalar rastgele tuzla scrypt kullanılarak hashlenir.
- Web oturumu HttpOnly ve SameSite=Strict çereziyle tutulur; oturum süresi 8 saattir. Çıkış sunucudaki oturumu iptal eder.
- Sporcu, antrenman ve grafik sorguları antrenör hesabına göre sınırlandırılır.
- Sporcu bilgileri ve şut kayıtları sunucuda doğrulanır. İsabet sayısı deneme sayısını aşamaz; doğum tarihi gelecekte olamaz.
- Şut kayıtları tek veritabanı işlemi içinde güncellenir; yazma hatasında önceki kayıtlar korunur.
- Yaş grubu, antrenman tarihindeki yaşa göre hesaplanır. Doğum tarihi olmayan sporcular ayrı değerlendirilir.

Bu sürüm yerel geliştirme ve portföy gösterimi içindir. İnternete açık kullanım için HTTPS, dağıtım yapılandırması ve üretim ortamı kontrolleri ayrıca tamamlanmalıdır. Sunucuda `NODE_ENV=production` kullanıldığında oturum çerezleri Secure olur ve HTTPS gerekir. `ALLOWED_ORIGINS` izin verilen web adreslerini belirler.

## Mobil uygulama

Mobil uygulama aynı API sunucusunu kullanır; web arayüzünden farklı bir görünüme sahiptir. JS/JSX dosyaları sözdizimi açısından kontrol edilmiştir, ancak fiziksel cihazda çalışması henüz doğrulanmamıştır.

Mobil kurulum ve API adresi ayarları için [mobil uygulama açıklamasına](mobile/README.md) bakın. API sunucusu varsayılan olarak yalnızca kendi bilgisayarından erişilebildiğinden, telefon testi için ağ adresi ve sunucu ayarları da gerekir.

## Sonraki geliştirmeler

- Antrenman düzenleme, silme ve hata mesajlarının arayüzde kontrol edilmesi.
- Telefon ve tablet boyutlarında web arayüzünün iyileştirilmesi.
- Mobil uygulamanın cihazda test edilmesi ve web özellikleriyle karşılaştırılması.
- Kullanım örneklerinin ve yeni özelliklerin belgelenmesi.
- Üretim ortamı kurulumu ve dağıtımının doğrulanması.
