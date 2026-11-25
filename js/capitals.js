// Capitales : on retient la capitale politique et administrative (siège des institutions),
// pas la capitale économique ; la remarque « c2 » précise les cas particuliers.
const FIX = {
  '068': { c: 'La Paz', c2: 'Siège du gouvernement ; Sucre est la capitale constitutionnelle' },
  '458': { c: 'Putrajaya', c2: 'Capitale administrative ; Kuala Lumpur reste la capitale officielle' },
  '144': { c: 'Sri Jayawardenepura Kotte', c2: 'Colombo est la capitale économique' },
  '748': { n: 'Eswatini', c: 'Mbabane', c2: 'Capitale administrative ; Lobamba est la capitale royale et législative' },
  '500': { c: 'Brades', c2: 'Plymouth, l’ancienne capitale, a été abandonnée après l’éruption de 1997' },
  '674': { c: 'Saint-Marin' },
  '528': { c2: 'Capitale constitutionnelle ; le gouvernement siège à La Haye' },
  '204': { c2: 'Capitale officielle ; le gouvernement siège à Cotonou' },
  '384': { c2: 'Abidjan est la capitale économique' },
  '834': { c2: 'Dar es Salam est la capitale économique' },
  '566': { c2: 'Lagos est la capitale économique' },
  '108': { c2: 'Bujumbura est la capitale économique' },
  '710': { c2: 'Capitale administrative ; Le Cap est la capitale législative et Bloemfontein la capitale judiciaire' },
  '104': { c2: 'Rangoun (Yangon) est l’ancienne capitale et la ville principale' },
  '360': { c2: 'Nusantara, la future capitale, est en construction' },
  '376': { c2: 'Statut contesté : la plupart des ambassades sont à Tel-Aviv' },
  '887': { c2: 'Le gouvernement reconnu siège à Aden' },
};
export function fixCapitals(info) {
  for (const [id, f] of Object.entries(FIX)) if (info[id]) Object.assign(info[id], f);
  return info;
}
