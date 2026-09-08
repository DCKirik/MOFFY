# Moffy — senin yapman gereken şeyler

Bu dosya sadece sana (teknik olmayan kurucuya) yazıldı.

## Şu an ne durumda?

Bu akşamki altyapı bitti ve canlı: **https://moffy.vercel.app**

- Proje iskeleti, marka renkleri/tasarım sistemi ✅
- Veritabanı (Supabase) + güvenlik kuralları — canlı, gerçek kayıtla test edildi ✅
- Giriş / kayıt ekranları ✅
- TMDB film verisi anahtarı — alındı, eklendi ✅
- Üst/alt menü, tüm sayfa iskeletleri ✅
- GitHub'a yüklendi, Vercel'e bağlandı, otomatik deploy çalışıyor ✅

Şu an bekleyen bir şey yok. `main` dalına her push'ta Vercel otomatik yeniden yayınlıyor.

## İsteğe bağlı, acil değil: Anthropic API anahtarı

Sadece "Moffy bu filmi neden önerdi" gibi kısa açıklamalar için — MVP'nin çekirdeği (öneri puanı) buna ihtiyaç duymuyor. İstersen haftalar sonra da olur.

Zamanı gelince: [console.anthropic.com](https://console.anthropic.com) → hesap aç → ödeme yöntemi ekle → API anahtarı oluştur → bana ilet.

## Bundan sonra ne olacak?

Sırayla, her biri çalışır ve test edilir halde: taste onboarding (film puanlama), film arama/detay (TMDB), kişisel öneriler (Moffy Match), arkadaşlar, gruplar, grup önerileri, pathway'ler. Dokümandaki (`docs/superpowers/specs/`) plana göre tek tek ilerliyorum.
