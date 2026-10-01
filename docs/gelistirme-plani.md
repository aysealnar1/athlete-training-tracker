# Kaynak incelemesi ve geliştirme sırası

İnceleme tarihi: 1 Ekim 2026. Başlangıç noktası: `fac23a5`.

## Elimizdeki kanıt

Karşılaştırmada Ayşe'nin daha önce paylaştığı `client - Kopya (2)` proje kopyası ve GitHub'daki güncel sürüm kullanıldı. İlk kopya zaten ekip katkılarını birlikte içeriyor. Efe'nin yalnızca kendi çalışmalarını içeren ilk sürümü elimizde yok.

Depodaki iki commit, ilk yayın ve ekran görüntülerinin kırpılmasıyla ilgili. Projenin ilk geliştirilme aşamasını içermedikleri için bu geçmişten ilk kod yazarlarını belirlemek mümkün değil. Git blame bu iki kayıt için son kaydı gösterir; özgün yazarlık kanıtı değildir.

## Dosyalara ilişkin bulgular

| Bölüm | Karşılaştırma bulgusu | Sınır |
| --- | --- | --- |
| `server/index.js` | İlk kopyadaki route ve SQL yapısının önemli bölümleri korunmuş; oturum, sahiplik ve doğrulama kontrolleri eklenmiş | Raporlardaki backend görev dağılımı, her satırın Efe tarafından yazıldığını kanıtlamaz |
| `server/db.js` | İlk şema korunmuş; hesap sahipliği ve cinsiyet için geçişler eklenmiş | Veritabanı tasarımının kişi bazında kökeni bu kopyadan çıkarılamaz |
| `server/auth.js`, `athlete-validation.js`, `age-group.js`, `training-records.js` ve sunucu testleri | Paylaşılan ilk kopyada bulunmayan, sonraki hazırlık sürecinde eklenen dosyalar | Bunlar sonraki AI destekli geliştirmelerdir; tüm sunucunun sıfırdan yazıldığı anlamına gelmez |
| Web arayüzü | İlk sayfalar üzerinde oturum, grafik, kişisel bilgi ve takvim düzenlemeleri yapılmış; yeni ortak bileşenler eklenmiş | Sayfaların değişmesi ilk kodun tamamının değiştiğini göstermez |
| Mobil uygulama | API ve giriş katmanı değiştirilmiş; bazı ekranlar ilk kopyayla aynı | Cihaz testi ve ilk yazarlık incelemesi henüz tamamlanmadı |
| `SutSayaci/` | Ana uygulama tarafından kullanılmayan Expo başlangıç şablonu | Şablonun bulunması uygulama geliştirme deneyiminin kanıtı değildir; bu çalışma dalından çıkarıldı |

Satır benzerliği, dosya ismi, commit yazarı ve ekip görev dağılımı tek başına kişi bazında kesin kod yazarlığı sonucu vermez.

## Geliştirme hedefi

Çalışan web akışlarını ve yerel sporcu verilerini koruyarak daha anlaşılır, test edilebilir ve kullanılabilir bir portföy sürümü hazırlamak. Geliştirmeler tarihsel ekip katkısını veya eski kodun yayın izinlerini geriye dönük değiştirmez. Kod değişikliği, farklı isimlendirme veya AI ile yeniden yazım hukuki izin verilmiş olduğu anlamına gelmez.

## Uygulama sırası

1. **Depo yapısı:** Kullanılmayan şablonu kaldır; web, sunucu ve mobil rollerini açıkça belgeleyerek gereksiz kopyaları azalt.
2. **Sunucu:** API'nin mevcut istek/yanıt sözleşmesini belgeleyerek hesap, sporcu, antrenman ve istatistik işlemlerini ayrı modüllere taşı. Önce mevcut davranışları testlerle koru. Veritabanı geçişlerini ayrı tut; mevcut `sport.db` dosyasını değiştirme veya dağıtma.
3. **Antrenman ekranı:** Mevcut kayıtların ayrı ayrı düzenlenmesini ve kaldırılmasını, kaydedilmemiş değişiklik uyarısını ve kaydetme geri bildirimini ele al. Bir kaydın silinmesiyle bütün antrenmanın silinmesini kullanıcıya açıkça ayır.
4. **Analiz:** Tarih aralığı, sıralama, boş veri durumları ve performans özetlerini tutarlı yap. Yüzdeleri toplam isabet/toplam deneme üzerinden doğrula.
5. **Web görünümü:** Telefon boyutlarında form, saha haritası, menü ve grafikleri kontrol et; klavye erişimi, etiketler ve okunabilirliği iyileştir.
6. **Mobil:** Fiziksel cihazda giriş, sporcu listeleme ve antrenman kaydını doğrula. Webdeki yeni alanları mobil akışla karşılaştır.

Her iş ayrı bir değişiklik olarak incelenecek. Oturum/sahiplik testleri ve web derlemesi gerektiğinde çalıştırılacak. Çalışan kayıtların korunması ve hesaplar arasında erişim olmaması temel kabul koşullarıdır.

## Yazarlık konusundaki açık nokta

Efe'nin ilk verdiği dosyalar, o dönemdeki sürümler veya katkı geçmişi bulunursa kişi bazındaki değerlendirme güçlenir. Böyle bir kaynak olmadan dosyalar yalnızca "ilk ekip sürümünden gelen" ve "sonradan eklenen/değiştirilen" şeklinde tanımlanmalıdır. Ekip projesi açıklaması korunmalıdır.
