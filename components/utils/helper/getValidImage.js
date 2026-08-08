// Sitewide chrome (logo, developer-logo thumbnail, amenity-icon sprites) and
// SquareYards' "similar projects" rail / agent profile pics (which leak into
// a listing's own images array — see view-model.ts's validImages()) occasionally
// ride along in a scraped image list with a real photo extension, so the
// extension check alone doesn't exclude them — mirrors view-model.ts's
// validImages() CHROME_PATH_RE.
const CHROME_PATH_RE = /\/assets\/images\/|\/developerlogo\/|\/tn-projectflagship\/|\/connect\/profilepic\//i;

const getValidImage = (images = []) => {
  return images.find((url) =>
    typeof url === "string" &&
    /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) &&
    !CHROME_PATH_RE.test(url)
  );
};
export default getValidImage;