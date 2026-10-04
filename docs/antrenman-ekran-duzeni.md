# Antrenman ekranı tasarımı

3 Ekim 2026: Kullanıcının paylaştığı koyu temalı tasarım referans alındı. Sol panelde ikonlu şut tipleri, mevcut şut kayıtları ve kullanım açıklaması bulunur. Seçili tip turuncu kenarlıkla gösterilir. Ana kartta yatay saha, seçili tip, nokta sayacı ve işlem düğmeleri birlikte yer alır. Kaydetme durumu üst başlıktadır.

Saha yatay tam saha olarak görüntülenir; iki potaya da şut konumu eklenebilir. Eski yarı saha kayıtları sol potaya göre gösterilir. Görsel, kesin saha ölçümlerini temsil etmez.

Küçük ekranda sol panel Şut Tipleri düğmesiyle açılır ve kendi içinde kayar. Uzun kayıt listesi de kendi içinde kayar. Deneme/isabet alanları kayıt başına toplam sayıları gösterir; her noktanın ayrı isabet bilgisi tutulmaz.

Doğrulama: sekiz web yardımcı işlev testi ve üretim derlemesi başarılı. Yeni koordinat testi, yatay çizimde eski koordinatların korunmasını ve boşluk tıklamalarını kontrol eder. Bu kontroller otomatik tarayıcı testi değildir.

Kullanıcı kontrolü: geniş ve 390 piksel görünümde yerleşim, mevcut kaydı düzenleme/iptal, tıklanan noktaya işaret düşmesi, sayı girişi, kaydetme ve kaydedilmemiş değişiklik uyarısı.

## Tam saha görseli

Kullanıcının sağladığı AI üretimi `client/src/assets/saha.png` yatay tam saha olarak kullanılır. Görsel değiştirilmeden SVG arka planına yerleştirilir; şut işaretleri ve bağlantıları ayrı bir katmandır. Masaüstünde saha yüksekliği ekranın %62’sini aşmaz; mobilde görsel oranı korunur.

Yeni noktalar `coordinate_space: "full-court"` ile 0–100 aralığında kaydedilir. Bu alanı olmayan eski yarı saha noktaları sol potaya göre görüntülenir; veritabanındaki eski koordinatlar değiştirilmez. Düzenlenen kayıtta eski ve yeni noktalar birlikte bulunabilir. Görselin dış boşluğuna tıklamak nokta eklemez. Nokta eşleşmesi ve eski/yeni kayıtların birlikte saklanması test edilir.

Deneme/isabet girişi, Sıradaki, düzenleme/silme ve kaydetmeden çıkma uyarıları mevcut akışlarını korur. Mobil uygulamanın tam saha koordinatlarını göstermesi ayrıca uyarlanmalıdır.

## Kompakt kayıt listesi ve hizalama

4 Ekim 2026: Yeni görsel referansa göre kayıtlar renkli şut tipi işareti, ad, isabet/deneme bilgisi ve Düzenle/Sil ikon düğmeleriyle satır halinde gösterilir. İkonlar mevcut Lucide setinden gelir; düğmeler açıklama, erişilebilir ad ve 44 piksel tıklama alanı taşır. Uzun kayıt listesi kendi içinde kayar. Boş liste açık bir mesaj gösterir.

Ana kartın genişliği ekran yüksekliğine göre sınırlandırılarak sahanın çevresindeki yatay boşluk azaltılır. Saha en-boy oranını korur. Şut tipi kartları, alt kontrol alanı ve üst boşluk sıkıştırılır. Kayıt silme onayı, düzenleme ve kaydetme akışı değiştirilmez. Görsel referanstaki örnek kayıtlar veya artı düğmesi eklenmez; gerçek antrenman verileri gösterilir.

Saha görüntüsü daha yatay bir 2:1 alana uyarlanır; yükseklik sınırı %62 olarak kalır. SVG ve işaret katmanı aynı yatay/dikey ölçeği kullanır; tıklamalar da bu iki ölçek üzerinden hesaplanır. Saklanan koordinatlar değişmez. Bu görünüm görselin özgün oranını yatayda yaklaşık %12 genişletir.
