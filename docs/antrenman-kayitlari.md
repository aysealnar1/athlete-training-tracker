# Antrenman kayıtlarını düzenleme

- Her şut kaydında **Düzenle** ve **Sil** düğmeleri bulunur.
- Düzenle, kayıtlı şut tipi, saha noktaları ve sayıları yeniden açar. Sıradaki düğmeleriyle sayılar kontrol edilir; **Değişikliği Uygula** kaydı listede değiştirir.
- **Son Noktayı Geri Al** ve **Noktaları Temizle** saha seçimini düzeltir.
- **Kaydı İptal Et** tamamlanmamış ekleme veya düzenlemeyi iptal eder. Listedeki önceki kayıt korunur.
- Silme onay gerektirir ve yalnızca ilgili şut kaydını listeden kaldırır.
- Bu değişiklikler üstteki **Kaydet** düğmesiyle sunucuya gönderilir. Tüm şut kayıtları silinirse boş liste de kaydedilebilir; antrenman silinmez.
- Tamamlanmamış bir kayıt varsa Kaydet devre dışıdır. Önce kayıt tamamlanmalı veya iptal edilmelidir.
- Kaydetme başarısız olduğunda sayfa ve değişiklikler korunur.
- Uygulama içi geri dönüş ve tarayıcının geri düğmesi kaydedilmemiş değişikliklerde onay ister. Yenileme ve sekme kapatma için tarayıcının kendi uyarısı kullanılır; bu uyarının metnini tarayıcı belirler.

## Teknik değişiklikler

React Router veri yönlendiricisine geçilerek `useBlocker` kullanılır; mevcut adresler ve oturum koruması korunur. `beforeunload` ayrı olarak dinlenir. Değişiklik karşılaştırması yalnızca API'ye gönderilen alanları dikkate alır. Yeni antrenman oluşturma isteği StrictMode etkisinin tekrarında paylaşılır. Crossover saha seçimi iki noktayla sınırlanmaz; sunucunun 1000 noktalık sınırı korunur. Şut sayıları 0–1.000.000 arasında tam sayı olmalıdır.

## Kontroller

Ana klasörde:

```sh
node --test client/tests/*.test.js
npm test --prefix server
npm run build --prefix client
```

Kendi uygulama kopyanda bir test antrenmanında düzenleme, iptal, silme, kaydetme, geri dönüş uyarısı ve yenilemeden sonra kayıtların korunması ayrıca kontrol edilmelidir.
