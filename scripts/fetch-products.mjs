/**
 * Pulls real skincare products from Open Beauty Facts (ODbL; images CC BY-SA)
 * into src/data/products.json and downloads front images to public/products.
 *
 *   node scripts/fetch-products.mjs            # refresh everything
 *   node scripts/fetch-products.mjs --no-images
 *
 * Only face-skincare products with a photo and an ingredient list are kept.
 * Each product keeps its OBF code + URL so the app can attribute the source
 * (https://world.openbeautyfacts.org/product/<code>).
 */
import fs from "node:fs/promises";
import path from "node:path";

const UA = "DailySkin15-dev/0.2 (https://github.com/dada-95/dailyskin15)";
const OUT_JSON = path.resolve("src/data/products.json");
const OUT_IMG = path.resolve("public/products");
const WANT_IMAGES = !process.argv.includes("--no-images");

const BRANDS = [
  "cosrx", "laneige", "sulwhasoo", "klairs", "benton", "missha", "innisfree",
  "la-roche-posay", "cerave", "avene", "bioderma", "vichy", "neutrogena",
  "the-ordinary", "paula-s-choice", "cetaphil",
];

/** Order matters: first matching rule wins. */
const CATEGORY_RULES = [
  ["sunscreen", /spf|sun ?screen|sunscreen|solaire|solar|\buv\b|sun cream|sun fluid|anthelios|photoderm|capital soleil|uvmune/i],
  ["cleanser", /cleanser|cleansing|lavante|wash|foam|gel nettoyant|nettoyant|micellar|micellaire|gel moussant|mousse|démaquillant|demaquillant|toleriane caring|hydrating facial cleanser|purifying gel|soap/i],
  ["exfoliant", /exfoliat|peeling|scrub|gommage|aha|bha|salicylic|glycolic|lactic acid|effaclar duo/i],
  ["mask", /mask|masque|sheet|sleeping pack|patch/i],
  ["toner", /toner|tonique|lotion tonique|essence|mist|brume|thermal spring water|eau thermale|hydra vegetal/i],
  ["serum", /serum|sérum|ampoule|booster|concentrate|drops|niacinamide|hyaluronic acid 2|retinol|vitamin c|caffeine solution|buffet|argireline|azelaic/i],
  ["eye", /eye|yeux|contour/i],
  ["moisturizer", /cream|crème|creme|moistur|hydrat|lotion|balm|baume|gel|fluid|fluide|emulsion|cica|toleriane|cicaplast|effaclar mat|hydro boost|pm facial|am facial|water bank|sensibio|atoderm|hydrabio|sébium|sebium/i],
];

const EXCLUDE = /handcreme|hand cream|travel size|lip|lèvre|après-soleil|after.?sun|apres-soleil|corpo|cuerpo|spray solaire|stick|tinted|teinté|teinte|con color|unifiant|sebo-régulateur|deep clean gentle facial scrub|shampoo|shampooing|hair|cheveux|body|corps|deodorant|déodorant|lipstick|mascara|foundation|fond de teint|nail|ongles|perfume|parfum|eau de|toothpaste|dentifrice|baby|bébé|bebe|intim|douche|shower|gel lavant|hand cream|crème mains|mains|pieds|feet|beard|rasage|shave|after.?shave|talc|wipes|lingettes|kids|enfant|lip balm|lips|lèvres|stick lèvres|blush|powder|poudre|concealer|primer|bronzer|brow|eyeliner|highlighter/i;

/** Ingredient keywords the matcher scores against (lowercase, INCI-ish). */
const ACTIVE_KEYS = {
  centella: /centella|madecassoside|asiaticoside|asiatic acid|cica/i,
  panthenol: /panthenol/i,
  niacinamide: /niacinamide/i,
  hyaluronic: /hyaluron/i,
  ceramide: /ceramide/i,
  salicylic: /salicylic acid|betaine salicylate|lha|capryloyl salicylic/i,
  aha: /glycolic acid|lactic acid|mandelic acid|citric acid/i,
  retinol: /retinol|retinal|retinyl|bakuchiol|retinaldehyde/i,
  vitaminC: /ascorbic|ascorbyl|ethyl ascorbic|tetrahexyldecyl/i,
  peptide: /peptide|palmitoyl/i,
  zinc: /zinc pca|zinc oxide|zinc gluconate/i,
  greenTea: /camellia sinensis/i,
  aloe: /aloe/i,
  squalane: /squalane|squalene/i,
  thermalWater: /thermal|eau thermale|aqua posae|vichy/i,
  fragrance: /fragrance|parfum|linalool|limonene|citronellol|geraniol|hexyl cinnamal|benzyl salicylate|eugenol|coumarin/i,
  alcohol: /\balcohol\b(?! denat\.?\s*free)|alcohol denat/i,
  mineralUv: /zinc oxide|titanium dioxide/i,
  chemicalUv: /ethylhexyl methoxycinnamate|octocrylene|avobenzone|butyl methoxydibenzoylmethane|homosalate|ethylhexyl salicylate|bemotrizinol|tinosorb|uvinul|tris-biphenyl triazine|diethylamino hydroxybenzoyl|drometrizole/i,
  oilFree: /./, // placeholder, computed below
};

function classify(name, categoriesTags = []) {
  const hay = `${name} ${categoriesTags.join(" ")}`;
  for (const [id, re] of CATEGORY_RULES) if (re.test(hay)) return id;
  return null;
}

function detectSpf(name) {
  const m = name.match(/spf\s?(\d{2})/i);
  return m ? Number(m[1]) : null;
}

function activesFor(ingredients) {
  const out = [];
  for (const [key, re] of Object.entries(ACTIVE_KEYS)) {
    if (key === "oilFree") continue;
    if (re.test(ingredients)) out.push(key);
  }
  if (!/\b(oil|huile)\b/i.test(ingredients) && !/butter/i.test(ingredients)) out.push("oilFree");
  return out;
}

function cleanName(name) {
  return name.replace(/\s+/g, " ").replace(/^[\s"']+|[\s"']+$/g, "").trim();
}

function titleBrand(brands) {
  const first = (brands || "").split(",")[0].trim();
  const known = {
    "la roche posay": "La Roche-Posay", "avéne": "Avène", "nestlé": "Cetaphil", "l'oréal": "Vichy",
    cosrx: "COSRX", "la roche-posay": "La Roche-Posay", cerave: "CeraVe", avene: "Avène",
    avène: "Avène", "the ordinary": "The Ordinary", "paula's choice": "Paula's Choice",
    laneige: "Laneige", sulwhasoo: "Sulwhasoo", klairs: "Klairs", benton: "Benton",
    missha: "Missha", innisfree: "innisfree", bioderma: "Bioderma", vichy: "Vichy",
    neutrogena: "Neutrogena", cetaphil: "Cetaphil",
  };
  return known[first.toLowerCase()] ?? first;
}

async function fetchBrand(brand) {
  const url = new URL("https://world.openbeautyfacts.org/api/v2/search");
  url.searchParams.set("brands_tags", brand);
  url.searchParams.set("fields", "code,product_name,product_name_en,brands,image_front_url,ingredients_text,ingredients_text_en,categories_tags,quantity,countries_tags");
  url.searchParams.set("page_size", "100");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${brand}: HTTP ${res.status}`);
  const data = await res.json();
  return data.products ?? [];
}

async function download(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) return false;
  await fs.writeFile(file, buf);
  return true;
}

const seen = new Set();
const products = [];
for (const brand of BRANDS) {
  const raw = await fetchBrand(brand).catch((e) => (console.error(e.message), []));
  for (const p of raw) {
    const name = cleanName(p.product_name_en || p.product_name || "");
    const ingredients = cleanName(p.ingredients_text_en || p.ingredients_text || "");
    if (!name || name.length < 4 || !p.image_front_url || ingredients.length < 40) continue;
    if (!/[a-zA-Z]{3}/.test(name) || /^\d+$/.test(name)) continue; // barcode-as-name
    if (EXCLUDE.test(name)) continue;
    const key = `${brand}:${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    const category = classify(name, p.categories_tags);
    if (!category || category === "eye") continue;
    seen.add(key);
    products.push({
      id: `obf-${p.code}`,
      code: p.code,
      brand: titleBrand(p.brands),
      name,
      category,
      quantity: p.quantity || null,
      spf: detectSpf(name),
      actives: activesFor(ingredients),
      ingredients,
      image: `/products/${p.code}.jpg`,
      imageSource: p.image_front_url,
      source: `https://world.openbeautyfacts.org/product/${p.code}`,
    });
  }
  console.log(`${brand}: kept ${products.length} so far`);
}

if (WANT_IMAGES) {
  await fs.mkdir(OUT_IMG, { recursive: true });
  let ok = 0;
  for (const p of products) {
    const file = path.join(OUT_IMG, `${p.code}.jpg`);
    try {
      await fs.access(file);
      ok++;
      continue;
    } catch {}
    if (await download(p.imageSource, file)) ok++;
    else p.image = null;
  }
  console.log(`images: ${ok}/${products.length}`);
}

const kept = products.filter((p) => p.image);
kept.sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.writeFile(
  OUT_JSON,
  JSON.stringify(
    {
      source: "Open Beauty Facts",
      license: "Database: ODbL 1.0 · Images: CC BY-SA 3.0",
      attribution: "https://world.openbeautyfacts.org",
      fetchedAt: new Date().toISOString(),
      products: kept,
    },
    null,
    2,
  ),
);
const byCat = {};
for (const p of kept) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
console.log(`wrote ${kept.length} products`, byCat);
