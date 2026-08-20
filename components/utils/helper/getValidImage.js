// Sitewide chrome (logo, developer-logo thumbnail, amenity-icon sprites) and
// SquareYards' "similar projects" rail / agent profile pics (which leak into
// a listing's own images array — see view-model.ts's validImages()) occasionally
// ride along in a scraped image list with a real photo extension, so the
// extension check alone doesn't exclude them — mirrors view-model.ts's
// validImages() CHROME_PATH_RE.
const CHROME_PATH_RE = /\/assets\/images\/|\/ui-assets\/images\/|\/developerlogo\/|\/tn-projectflagship\/|\/connect\/profilepic\//i;

// Cover-image ranking — mirrors view-model.ts's validImages() COVER_BOOST_RE /
// COVER_DEMOTE_RE: scraped filenames encode a category, and the feed
// near-universally puts the location map (or a floor-plan/site-plan/spec
// drawing) first, never an actual building photo. Boost real building shots
// so the card cover isn't a map or an architectural drawing.
const COVER_BOOST_RE = [
  /-tower-view/i,
  /-apartment-exteriors/i,
  /-villa-view/i,
  /-commercial-exteriors/i,
  /-project-large-image/i,
  /-entrance-view/i,
  /-clubhouse-external-image/i,
];
const COVER_DEMOTE_RE = /-location-image|-floor-plans?|-specification|-site-plan|-master-plan-image/i;

function coverRank(url) {
  for (let i = 0; i < COVER_BOOST_RE.length; i++) if (COVER_BOOST_RE[i].test(url)) return i;
  if (COVER_DEMOTE_RE.test(url)) return 100;
  return 50;
}

const getValidImage = (images = []) => {
  const candidates = images.filter(
    (url) =>
      typeof url === "string" &&
      /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) &&
      !CHROME_PATH_RE.test(url)
  );
  candidates.sort((a, b) => coverRank(a) - coverRank(b));
  return candidates[0];
};
export default getValidImage;