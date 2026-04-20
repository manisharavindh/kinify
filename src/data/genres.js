export const GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Jazz', 'Classical',
  'Country', 'Folk', 'Metal', 'Punk', 'Indie', 'Alternative',
  'Blues', 'Soul', 'Reggae', 'Latin', 'World', 'Lo-fi', 'Soundtrack', 'Other'
];

export const GENRE_GRADIENTS = {
  'Pop': ['#ff6b9d', '#c44fd0'],
  'Rock': ['#e74c3c', '#8e44ad'],
  'Hip Hop': ['#f39c12', '#e74c3c'],
  'R&B': ['#834d9b', '#d04ed6'],
  'Electronic': ['#00d2ff', '#3a7bd5'],
  'Jazz': ['#f7971e', '#ffd200'],
  'Classical': ['#4ca1af', '#c4e0e5'],
  'Country': ['#dce35b', '#45b649'],
  'Folk': ['#a8c0ff', '#3f2b96'],
  'Metal': ['#434343', '#1a1a2e'],
  'Punk': ['#fc4a1a', '#f7b733'],
  'Indie': ['#ee9ca7', '#ffdde1'],
  'Alternative': ['#536976', '#292E49'],
  'Blues': ['#2193b0', '#6dd5ed'],
  'Soul': ['#ff9a9e', '#fecfef'],
  'Reggae': ['#11998e', '#38ef7d'],
  'Latin': ['#fc5c7d', '#6a82fb'],
  'World': ['#f093fb', '#f5576c'],
  'Lo-fi': ['#a18cd1', '#fbc2eb'],
  'Soundtrack': ['#667eea', '#764ba2'],
  'Other': ['#6a11cb', '#2575fc'],
};

export function getGenreGradient(genre) {
  const colors = GENRE_GRADIENTS[genre] || GENRE_GRADIENTS['Other'];
  return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
}
