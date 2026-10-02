# Analiz ve tarih aralığı

Sporcu detayındaki başlangıç ve bitiş tarihleri antrenman listesini, gelişim grafiğini ve şut türüne göre başarı grafiğini birlikte filtreler. Sınır günleri dahil edilir; tarih karşılaştırması Türkiye saatine göre yapılır. Tarih Filtresini Temizle tüm antrenmanları yeniden gösterir. Başlangıcın bitişten sonra olduğu aralıklar hata olarak gösterilir.

Şut denemesi olmayan antrenmanlar gelişim grafiğine dahil edilmez; listede ve veritabanında kalır. Örneğin 10 denemede 0 isabet gerçek %0 başarıdır ve grafikte gösterilir. 0 deneme başarı yüzdesi üretmez. Filtre veya boş antrenmanlar numaraları değiştirmez; grafik ve listedeki numaralar aynı antrenmanı ifade eder.

Gelişim grafiği ipucunda başarı yüzdesi yanında isabet/deneme sayıları gösterilir. Şut türü başarı oranı seçilen antrenmanların toplam isabetinin toplam denemeye bölünmesiyle hesaplanır. Antrenman yüzdelerinin ortalaması alınmaz.

API: `GET /api/athletes/:id/stats?dateFrom=2026-10-01&dateTo=2026-10-02`. Parametreler isteğe bağlıdır. Geçersiz takvim tarihleri ve ters aralıklar 400 yanıtı verir. Oturum ve sahiplik denetimi devam eder.

Ortak tarih dönüşümü `shared/training-time.mjs` dosyasındadır. Web ve sunucu aynı Türkiye gününü kullanır. Branş analizindeki aylar da Türkiye tarihine göre gruplanır; denemesi olmayan aylar aylık başarı grafiğine dahil edilmez.

Kontrol komutları:

```sh
npm test --prefix server
node --test client/tests/*.test.js
npm run build --prefix client
```
