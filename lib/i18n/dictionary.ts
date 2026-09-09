export type UiLanguage = "en" | "tr" | "fr";

export const UI_LANGUAGES: { code: UiLanguage; name: string }[] = [
  { code: "en", name: "English" },
  { code: "tr", name: "Türkçe" },
  { code: "fr", name: "Français" },
];

// Deliberately scoped to app chrome — nav, page headers, common actions,
// auth forms — not every string in the app (movie titles/overviews/cast
// come from TMDB in their own language regardless of UI language, and
// translating that is a fundamentally different, much bigger problem).
const dictionary = {
  nav_home: { en: "Home", tr: "Ana Sayfa", fr: "Accueil" },
  nav_reels: { en: "Reels", tr: "Reels", fr: "Reels" },
  nav_discover: { en: "Discover", tr: "Keşfet", fr: "Découvrir" },
  nav_groups: { en: "Groups", tr: "Gruplar", fr: "Groupes" },
  nav_pathways: { en: "Pathways", tr: "Yolculuklar", fr: "Parcours" },
  nav_friends: { en: "Friends", tr: "Arkadaşlar", fr: "Amis" },
  nav_search: { en: "Search", tr: "Ara", fr: "Rechercher" },
  nav_profile: { en: "Profile", tr: "Profil", fr: "Profil" },

  home_popular: { en: "This Week's Popular Movies", tr: "Bu Haftanın Popüler Filmleri", fr: "Films populaires cette semaine" },
  home_best_match: { en: "Your Best Match", tr: "En İyi Eşleşmen", fr: "Votre meilleure correspondance" },
  home_recommended: { en: "Recommended For You", tr: "Senin İçin Önerilenler", fr: "Recommandé pour vous" },

  discover_title: { en: "Discover", tr: "Keşfet", fr: "Découvrir" },
  discover_subtitle: { en: "Browse the full Moffy catalog.", tr: "Moffy'nin tüm film kataloğuna göz at.", fr: "Parcourez tout le catalogue Moffy." },
  discover_by_language: { en: "Browse by language — best-rated first.", tr: "Dile göre keşfet — en yüksek puanlılar önce.", fr: "Parcourir par langue — les mieux notés d'abord." },
  discover_genre: { en: "Genre", tr: "Tür", fr: "Genre" },
  discover_language: { en: "Language", tr: "Dil", fr: "Langue" },
  discover_all: { en: "All", tr: "Tümü", fr: "Tous" },

  search_title: { en: "Search", tr: "Ara", fr: "Rechercher" },
  search_placeholder: {
    en: "Search for a movie, studio, or keyword...",
    tr: "Film, stüdyo veya anahtar kelime ara...",
    fr: "Rechercher un film, un studio ou un mot-clé...",
  },
  search_start_prompt: {
    en: "Search for a title, studio, or keyword to get started.",
    tr: "Başlamak için bir film adı, stüdyo veya anahtar kelime ara.",
    fr: "Recherchez un titre, un studio ou un mot-clé pour commencer.",
  },
  search_no_results: { en: "No results for", tr: "Sonuç bulunamadı:", fr: "Aucun résultat pour" },

  profile_rated: { en: "Rated", tr: "Puanlanan", fr: "Notés" },
  profile_watched: { en: "Watched", tr: "İzlenen", fr: "Regardés" },
  profile_saved: { en: "Saved", tr: "Kaydedilen", fr: "Enregistrés" },
  profile_your_taste: { en: "Your Taste", tr: "Zevkin", fr: "Vos goûts" },
  profile_recently_rated: { en: "Recently Rated", tr: "Son Puanlananlar", fr: "Notés récemment" },
  profile_app_language: { en: "App Language", tr: "Uygulama Dili", fr: "Langue de l'application" },
  profile_log_out: { en: "Log out", tr: "Çıkış yap", fr: "Se déconnecter" },
  profile_no_ratings: {
    en: "You haven't rated any movies yet — search or discover to get started.",
    tr: "Henüz hiç film puanlamadın — başlamak için ara veya keşfet.",
    fr: "Vous n'avez encore noté aucun film — recherchez ou explorez pour commencer.",
  },

  groups_title: { en: "Groups", tr: "Gruplar", fr: "Groupes" },
  friends_title: { en: "Friends", tr: "Arkadaşlar", fr: "Amis" },

  auth_login_title: { en: "Log in to Moffy", tr: "Moffy'ye giriş yap", fr: "Connexion à Moffy" },
  auth_signup_title: { en: "Create your Moffy account", tr: "Moffy hesabı oluştur", fr: "Créez votre compte Moffy" },
  auth_email: { en: "Email", tr: "E-posta", fr: "E-mail" },
  auth_password: { en: "Password", tr: "Şifre", fr: "Mot de passe" },
  auth_login_button: { en: "Log in", tr: "Giriş yap", fr: "Se connecter" },
  auth_signup_button: { en: "Sign up", tr: "Kayıt ol", fr: "S'inscrire" },
  auth_no_account: { en: "No account yet?", tr: "Hesabın yok mu?", fr: "Pas encore de compte ?" },
  auth_has_account: { en: "Already have an account?", tr: "Zaten hesabın var mı?", fr: "Vous avez déjà un compte ?" },

  welcome_tagline: {
    en: "Discover what to watch, rate it, and build watchlists with friends.",
    tr: "Ne izleyeceğini keşfet, puanla, arkadaşlarınla izleme listeleri oluştur.",
    fr: "Découvrez quoi regarder, notez-le, et créez des listes avec vos amis.",
  },
  welcome_get_started: { en: "Get Started", tr: "Başla", fr: "Commencer" },
  welcome_log_in: { en: "Log In", tr: "Giriş Yap", fr: "Se connecter" },

  onboarding_language_title: {
    en: "Which language would you like to use?",
    tr: "Hangi dili kullanmak istersin?",
    fr: "Quelle langue souhaitez-vous utiliser ?",
  },
  onboarding_language_subtitle: {
    en: "You can change this later from your profile.",
    tr: "Bunu daha sonra profilinden değiştirebilirsin.",
    fr: "Vous pourrez le changer plus tard depuis votre profil.",
  },
} as const;

export type TranslationKey = keyof typeof dictionary;

export function t(lang: UiLanguage, key: TranslationKey): string {
  return dictionary[key][lang] ?? dictionary[key].en;
}
