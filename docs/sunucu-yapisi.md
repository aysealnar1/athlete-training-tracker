# Sunucu yapısı

Bu düzenleme API adreslerini ve yanıt biçimlerini korur. Veritabanı şemasını veya mevcut kayıtları değiştirmez.

| Dosya | Sorumluluk |
| --- | --- |
| `server/index.js` | Sunucuyu HOST ve PORT ayarlarıyla başlatır. |
| `server/app.js` | CORS, istek doğrulama, oturum denetimi, rotalar ve hata yanıtlarını sırayla kurar. |
| `server/auth.js` | Kayıt, giriş, çıkış, oturum ve parola işlemleri. |
| `server/middleware/ownership.js` | Sporcu ve antrenmanın giriş yapan antrenöre ait olduğunu doğrular. |
| `server/routes/athletes.js` | Branş listesi ve sporcu ekleme, arama, okuma, düzenleme, silme. |
| `server/routes/trainings.js` | Sporcuya ait antrenman listesi, antrenman oluşturma, okuma ve kayıtları güncelleme. |
| `server/routes/stats.js` | Sporcu ve branş analizleri. |
| `server/db.js` | SQLite bağlantısı ve mevcut şema kurulumu. |

## İstek sırası

Kaynak ve özel başlık denetimi JSON ayrıştırmadan önce çalışır. Kayıt ve giriş rotaları oturum denetiminden önce kurulur. Diğer API rotaları oturum denetiminden geçer; sporcu ve antrenman adresleri ayrıca sahiplik denetiminden geçer. Sahiplik denetimi rota dosyaları kurulmadan önce yerleştirilmelidir.

## Doğrulama

Ana klasörde `npm test --prefix server` çalıştırılır. Testler geçici veritabanları kullanır; kişisel `sport.db` dosyasına yazmaz. Oturum, hesaplar arası erişim, doğrulama ve işlemin geri alınması yanında branş listesi, sporcu araması ve antrenman listesi yanıtları kontrol edilir.

Bu değişiklik kodun sorumluluklara göre ayrılmasıdır; geçmiş katkı veya kod sahipliği hakkında yeni bir iddia oluşturmaz.
