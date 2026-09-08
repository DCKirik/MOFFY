# Moffy — senin yapman gereken şeyler

Bu dosya sadece sana (teknik olmayan kurucuya) yazıldı. Kodla ilgili hiçbir şey bilmene gerek yok. Aşağıdaki maddeler dışında hiçbir şey yapman gerekmiyor — geri kalan her şeyi ben hallediyorum.

## Şu an ne durumda?

Bu gece MOFFY'nin altyapısını kurdum: proje iskeleti, marka renkleri/tasarım sistemi, veritabanı şeması, giriş/kayıt ekranları, üst ve alt menü, tüm sayfa iskeletleri. Hepsi GitHub'a kaydedildi. İki yerde tıkandım — ikisi de sadece senin yapabileceğin şeyler (hesap açma / silme / ödeme benim erişimimde yok, bilerek kısıtlı).

## 1) Supabase (veritabanı) — ACİL, bunsuz devam edemiyorum

Ücretsiz hesabında zaten 2 proje var, limit bu. MOFFY için üçüncü projeyi açamıyorum. Elindeki "stem & buds" adlı proje aylardır kapalı (inactive) duruyor.

Şunu denedim: onu "restore" edip içindeki veriyi sana yedeklemeyi denedim, ama restore isteği de aynı limite takıldı — API üzerinden içine giremiyorum. Proje **silme** yetkisi de elimdeki araçta hiç yok (bilerek öyle, güvenlik için).

Senin yapman gerekenler (birini seç):

- **Veri önemli değilse (önerim):** [supabase.com](https://supabase.com) → giriş yap → **stem & buds** projesi → Project Settings → General → sayfanın en altında **Delete Project**. Bana "sildim" yaz, MOFFY'nin veritabanını 2 dakikada kurarım.
- **Veri lazımsa:** Aynı panelden o projenin üstünde bir **Restore** butonu olabilir, dener misin? Sana da aynı limit hatasını verirse (muhtemelen verir), veriyi kurtarmanın tek yolu Supabase'de geçici olarak ücretli plana geçmek (bu ödeme adımını ben atamam, kartını gerektirir). Geçince haber ver, ben devam ederim.

## 2) TMDB API anahtarı — ACİL, film arama/veri bunsuz çalışmıyor

MOFFY'nin film bilgilerini (afiş, konu, oyuncular, puanlar) çektiği yer TMDB. Ücretsiz, kredi kartı istemiyor.

1. [themoviedb.org](https://www.themoviedb.org) → ücretsiz hesap aç.
2. Hesap ayarları → **API** → bir anahtar iste (kişisel/geliştirici kullanımı yeterli, 2 dakika sürer).
3. Sana verdiği anahtarı buraya, sohbete yapıştır — ben güvenli şekilde koda ekleyeceğim, GitHub'a asla çıplak yazılmayacak.

## 3) Anthropic API anahtarı — ACİL DEĞİL, şimdilik atlanabilir

Bu sadece "Moffy bu filmi neden önerdi" gibi kısa açıklamalar için, MVP'nin çekirdeği (öneri puanı) buna hiç ihtiyaç duymuyor. İstersen şimdi, istersen haftalar sonra hallederiz.

Zamanı gelince: [console.anthropic.com](https://console.anthropic.com) → hesap aç → ödeme yöntemi ekle (ücretli, kullandığın kadar öder gibi) → API anahtarı oluştur → bana ilet.

## Bundan sonra ne olacak?

1 ve 2 tamamlanınca haber ver — veritabanını gerçek verilerle kurar, giriş/kayıt ekranlarını gerçekten çalışır hale getirir, Vercel'e bağlar ve sana canlı bir link veririm. Ondan sonra sırayla: film arama, kişisel öneriler, arkadaşlar, gruplar, pathway'ler — dokümandaki her özelliği tek tek, her biri çalışır ve test edilir halde ekleyeceğim.
