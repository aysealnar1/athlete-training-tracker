# GitHub üzerinde otomatik kontroller

`.github/workflows/ci.yml`, main dalına yapılan push ve main dalını hedefleyen pull request işlemlerinde çalışır. Actions sekmesinden elle de başlatılabilir.

Node.js 24 ile istemci ve sunucu bağımlılıkları kendi package-lock.json dosyalarından npm ci kullanılarak kurulur. Ardından sırayla:

1. İstemci testleri çalıştırılır.
2. Sunucu testleri çalıştırılır.
3. İstemcinin üretim derlemesi alınır.

Bir adım hata verirse kontrol başarısız olur. Actions sekmesinde ilgili çalıştırmayı açıp hatalı adımın çıktısı incelenebilir.

Bu işlem uygulamayı yayımlamaz. Sunucu testleri geçici test veritabanları kullanır; bilgisayardaki sporcu kayıtları GitHub'a gönderilmez. Expo mobil uygulaması bu iş akışında test edilmez.

Yerel kontrol komutları:

```sh
node --test client/tests/*.test.js
npm test --prefix server
npm run build --prefix client
```
