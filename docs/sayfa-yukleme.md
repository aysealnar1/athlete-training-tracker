# Sayfaların ihtiyaç olduğunda yüklenmesi

Giriş ekranı başlangıç paketinde kalır. Dashboard, AthleteDetail ve Training sayfaları React Router `lazy` ile ziyaret edildiğinde yüklenir. İki antrenman adresi aynı modülü kullanır; ortak grafik kodu Vite tarafından ayrı pakete çıkarılır.

Ölçüm: Vite üretim derlemesinde başlangıç JavaScript dosyası 680,45 kB’den 251,47 kB’ye, gzip boyutu 199,90 kB’den 82,81 kB’ye düştü. Ortak grafik paketi 395,44 kB’dir. Bu sayılar ağda ölçülmüş açılış süresi değildir; toplam uygulama kodunun aynı oranda küçüldüğü anlamına gelmez.

Kontrol:
- `node --test client/tests/*.test.js`: mevcut altı yardımcı işlev testi geçti.
- `npm run build --prefix client`: başarılı; 500 kB paket uyarısı çıkmadı.
- Kullanıcı kontrolü: giriş, panel, sporcu ayrıntısı, mevcut antrenman ve kaydedilmemiş değişiklik uyarısı. Bir ayrıntı adresinde sayfayı yenileyerek doğrudan açılış da kontrol edilmelidir.

Kaynak: https://api.reactrouter.com/v7/functions/react-router.createHashRouter.html (`route.lazy` açıklaması).
