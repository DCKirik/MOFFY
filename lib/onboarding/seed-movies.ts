// Broadly recognizable movies across genres/eras, used to seed a new
// user's taste profile at signup (spec §3: cold-start reduction).
// TMDB ids verified live against the API, not guessed.
export const ONBOARDING_SEED_MOVIES = [
  { id: 278, title: "The Shawshank Redemption" },
  { id: 155, title: "The Dark Knight" },
  { id: 680, title: "Pulp Fiction" },
  { id: 13, title: "Forrest Gump" },
  { id: 603, title: "The Matrix" },
  { id: 27205, title: "Inception" },
  { id: 597, title: "Titanic" },
  { id: 8587, title: "The Lion King" },
  { id: 862, title: "Toy Story" },
  { id: 496243, title: "Parasite" },
  { id: 313369, title: "La La Land" },
  { id: 238, title: "The Godfather" },
  { id: 329, title: "Jurassic Park" },
  { id: 299534, title: "Avengers: Endgame" },
  { id: 419430, title: "Get Out" },
  { id: 57892, title: "Vizontele" },
  { id: 31060, title: "Recep İvedik" },
  { id: 27275, title: "G.O.R.A." },
  { id: 26900, title: "Eşkıya" },
  { id: 265169, title: "Kış Uykusu" },
] as const;

export const ONBOARDING_MIN_RATINGS = 5;
