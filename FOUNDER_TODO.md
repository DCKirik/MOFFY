# Moffy — senin yapman gereken şeyler

Bu dosya sadece sana (teknik olmayan kurucuya) yazıldı. Aşağıdaki maddeler dışında hiçbir şey yapman gerekmiyor — geri kalan her şeyi ben hallediyorum.

## Şu an ne durumda?

Bu gece MOFFY'nin altyapısını kurdum: proje iskeleti, marka renkleri/tasarım sistemi, veritabanı şeması, giriş/kayıt ekranları, üst ve alt menü, tüm sayfa iskeletleri. Veritabanı gerçek ve canlı (senin yeni Supabase hesabında), gerçek kayıt testiyle doğrulandı. TMDB API anahtarı da alındı ve eklendi. Tek bir şey kaldı.

## GitHub'a yükleme izni — ACİL, işler bilgisayarında kalıyor, GitHub'a çıkmıyor

Bu bilgisayarda GitHub'a `akirik28` hesabıyla giriş yapılmış ama `DCKirik/MOFFY` deposu ona ait değil, yazma izni yok. Muhtemelen `DCKirik` senin asıl kişisel hesabın.

Terminalde şunu çalıştır (veya buradaki mesajdaki Run düğmesine bas), tarayıcı açılınca **DCKirik** hesabınla giriş yapıp "Authorize" de:

```bash
gh auth login
```

Bitince "yaptım" yaz.

## Anthropic API anahtarı — ACİL DEĞİL, şimdilik atlanabilir

Bu sadece "Moffy bu filmi neden önerdi" gibi kısa açıklamalar için, MVP'nin çekirdeği (öneri puanı) buna hiç ihtiyaç duymuyor. İstersen şimdi, istersen haftalar sonra hallederiz.

Zamanı gelince: [console.anthropic.com](https://console.anthropic.com) → hesap aç → ödeme yöntemi ekle (ücretli, kullandığın kadar öder gibi) → API anahtarı oluştur → bana ilet.

## Bundan sonra ne olacak?

`gh auth login` tamamlanınca: işleri GitHub'a yüklerim, Vercel'e bağlar, sana canlı bir link veririm. Ondan sonra sırayla: film arama, kişisel öneriler, arkadaşlar, gruplar, pathway'ler — dokümandaki her özelliği tek tek, her biri çalışır ve test edilir halde ekleyeceğim.
