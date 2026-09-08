# Moffy — senin yapman gereken şeyler

Bu dosya sadece sana (teknik olmayan kurucuya) yazıldı.

## Şu an ne durumda?

Bu gece (2026-09-08 → 09) dokümandaki MVP özelliklerinin **hepsini** kurdum, test ettim, canlıya aldım. Canlı adres: **https://moffy.vercel.app**

Yapılanlar: giriş/kayıt, taste onboarding (film puanlama), TMDB film arama/detay, puanlama, kişisel öneri motoru (Moffy Match %), gerçek ana sayfa, arkadaşlar, gruplar (roller dahil), grup önerileri + filtreler, Main/Themed Pathway'ler + ilerleme takibi, profil sayfası. Hepsi gerçek verilerle test edildi.

Şu an bekleyen bir şey yok. `main` dalına her push'ta Vercel otomatik yeniden yayınlıyor.

## İsteğe bağlı, acil değil: Anthropic API anahtarı

Sadece "Moffy bu filmi neden önerdi" gibi kısa açıklamalar için — MVP'nin çekirdeği (öneri puanı) buna ihtiyaç duymuyor.

Zamanı gelince: [console.anthropic.com](https://console.anthropic.com) → hesap aç → ödeme yöntemi ekle → API anahtarı oluştur → bana ilet.

## Bilerek yapmadıklarım (küçük eksikler)

- Grup önerilerinde "sadece şu platformlarda olsun" filtresi yok (her film için ekstra TMDB sorgusu gerektiriyor, maliyetli — sonra eklenir).
- "En fazla X kişi izlemiş olsun" filtresi yerine basit "kimse izlememiş" seçeneği var.

## Bundan sonra ne olacak?

Dokümandaki §22'de "şimdilik yapma" denen kısımlar (fragman, bildirimler, izleme temaları, quiz, tartışma) — bunlara henüz dokunmadım, sıradaki adım değiller. Gerçek kullanıcı geri bildirimi almak, mevcut özellikleri cilalamak (görsel/UX ince ayar) daha öncelikli olabilir — sen karar ver.
