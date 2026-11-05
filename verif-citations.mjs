// Vérifie que chaque citation de index.html figure à la page indiquée du texte extrait de sa source.
// Les textes extraits sont dans sources/raw/<clé>.txt et sources/txt/<clé>.txt (pdftotext, pages séparées par \f).
// Usage : node verif-citations.mjs
import fs from "node:fs";
const html = fs.readFileSync("index.html", "utf8");
const js = html.split("<script>")[1].split("/* ---------- Index")[0];
const { S, ARBRE } = new Function(js.replace(/^const /gm, "var ") + "; return { S, ARBRE };")();
const norm = s => s.normalize("NFKC").replace(/[’‘`]/g, "'").replace(/[“”«»"]/g, '"').replace(/[–—]/g, "-")
  .replace(/­/g, "").replace(/[•]/g, " ").replace(/-\s*\n\s*/g, "-").replace(/\s+/g, " ").replace(/ ?" ?/g, '"').toLowerCase().trim();
// Nom du fichier extrait quand il diffère de la clé de source.
const FICHIER = { c1: "c1-2026", c3: "c3-2023", frC2: "fr-c2-2024", mathsC2: "maths-c2-2024", frC3: "fr-c3-2025", mathsC3: "maths-c3-2025", csen: "csenExpl", icem: "icem20", abcCond: "abcCondorcet" };
const cache = {};
function pages(k) {
  if (!cache[k]) {
    cache[k] = ["raw", "txt"].map(d => { const f = `sources/${d}/${FICHIER[k] || k}.txt`; return fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\f") : null; }).filter(Boolean);
  }
  return cache[k];
}
function trouve(txt, k, p) {
  const morceaux = txt.split(/\s*\[…\]\s*/).map(norm).filter(Boolean);
  return pages(k).some(pp => {
    const zone = p ? pp[p - 1] || "" : pp.join(" ");
    const z = norm(zone), z2 = z.replace(/[ -]/g, "");
    return morceaux.every(m => z.includes(m) || z2.includes(m.replace(/[ -]/g, "")));
  });
}
let n = 0, ko = [];
(function w(nd) {
  const test = (txt, k, p, ou) => { n++; if (!trouve(txt, k, p)) ko.push(`${nd.id} [${ou}] ${k} p.${p} : ${txt.slice(0, 90)}…`); };
  (nd.q || []).forEach(([t, k, p]) => test(t, k, p, "citation"));
  (nd.echos || []).forEach(([t, , k, p]) => test(t, k, p, "écho"));
  if (nd.classe) ["mat", "elem"].forEach(c => (nd.classe[c] || []).forEach(([t, k, p]) => { if (k) test(t, k, p, "en classe"); }));
  (nd.e || []).forEach(w);
})(ARBRE);
console.log(`${n} citations vérifiées, ${ko.length} introuvables`);
ko.forEach(l => console.log(" - " + l));
process.exit(ko.length ? 1 : 0);
