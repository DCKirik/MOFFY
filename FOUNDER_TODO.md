# Moffy — senin yapman gereken şeyler

Bu dosya sadece sana (teknik olmayan kurucuya) yazıldı.

## Şu an ne durumda?

Bu gece (2026-09-08 → 09) dokümandaki MVP özelliklerinin **hepsini** kurdum, test ettim, canlıya aldım. Canlı adres: **https://moffy.vercel.app**

Yapılanlar: giriş/kayıt, taste onboarding (film puanlama), TMDB film arama/detay, puanlama, kişisel öneri motoru (Moffy Match %), gerçek ana sayfa, arkadaşlar, gruplar (roller dahil), grup önerileri + filtreler, Main/Themed Pathway'ler + ilerleme takibi, profil sayfası. Hepsi gerçek verilerle test edildi.

`main` dalına her push'ta Vercel otomatik yeniden yayınlıyor.

## ACİL: Vercel'de bir anahtar eksik kaldı

Deploy'u ilk kurduğumda `SUPABASE_SERVICE_ROLE_KEY` henüz elimde yoktu (onu daha sonra aldım), boş gitti. Bunun etkisini koda dayanıklılık ekleyerek engelledim (site artık çökmüyor) ama gerçek anahtar olmadan **film puanlama / onboarding / pathway oluşturma çalışmayacak**. Vercel panelinde bu tek alanı ben bir türlü kaydedemedim (tıklamalar tuhaf davrandı), senin yapman gerekiyor:

1. Gerçek anahtarı al: [Supabase API Keys sayfası](https://supabase.com/dashboard/project/jeozmirxgkpavyjlzfma/settings/api-keys) → **Secret keys** → göz ikonuna basıp göster, kopyala. (Bu anahtarı git'e/dokümana hiç yazmıyorum bilerek — sızmasın diye.)
2. [Vercel Environment Variables sayfası](https://vercel.com/moffy1/moffy/settings/environment-variables) → **SUPABASE_SERVICE_ROLE_KEY** satırının sağındaki **... → Edit**
3. Value kutusuna yapıştır, **Save**
4. Sonra: [Deployments](https://vercel.com/moffy1/moffy/deployments) → en üstteki deployment → **... → Redeploy** (env değişikliği yeni deploy ister)

2 dakika sürer. Bitince "yaptım" yaz, canlıda test ederim.

## İsteğe bağlı, acil değil: Anthropic API anahtarı

Sadece "Moffy bu filmi neden önerdi" gibi kısa açıklamalar için — MVP'nin çekirdeği (öneri puanı) buna ihtiyaç duymuyor.

Zamanı gelince: [console.anthropic.com](https://console.anthropic.com) → hesap aç → ödeme yöntemi ekle → API anahtarı oluştur → bana ilet.

## Bilerek yapmadıklarım (küçük eksikler)

- Grup önerilerinde "sadece şu platformlarda olsun" filtresi yok (her film için ekstra TMDB sorgusu gerektiriyor, maliyetli — sonra eklenir).
- "En fazla X kişi izlemiş olsun" filtresi yerine basit "kimse izlememiş" seçeneği var.

## Bundan sonra ne olacak?

Dokümandaki §22'de "şimdilik yapma" denen kısımlar (fragman, bildirimler, izleme temaları, quiz, tartışma) — bunlara henüz dokunmadım, sıradaki adım değiller. Gerçek kullanıcı geri bildirimi almak, mevcut özellikleri cilalamak (görsel/UX ince ayar) daha öncelikli olabilir — sen karar ver.
