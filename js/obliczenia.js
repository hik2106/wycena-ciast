// Obliczenia kosztów, czasów i marży – czysty moduł, bez DOM.
import { formatujLiczbe } from './liczby.js';

export const MNOZNIK_MIN = 0.25;
export const MNOZNIK_MAX = 3;
export const MNOZNIK_KROK = 0.25;

export const kluczMnoznika = (m) => Math.round(m * 100) / 100;

// Jedyne miejsce z regułą szacowania czasu przy innym mnożniku niż 1.
export function szacujCzas(bazaMin, m) {
  if (m === 1) return bazaMin;
  if (bazaMin === 0) return 0;
  return Math.max(5, Math.round((bazaMin * (1 + 0.5 * (m - 1))) / 5) * 5);
}

export const mnoznikFormy = (dPrzepisu, dNowa) => kluczMnoznika((dNowa / dPrzepisu) ** 2);

export function jednostkaIlosci(jednostkaCeny) {
  return { kg: 'g', l: 'ml', szt: 'szt' }[jednostkaCeny];
}

export function iloscPoPrzeliczeniu(ilosc, jednostka, m) {
  const x = ilosc * m;
  if (jednostka !== 'szt') return `${formatujLiczbe(x, 'auto')} ${jednostkaIlosci(jednostka)}`;
  const r = Math.round(x * 1e9) / 1e9;
  const dol = Math.floor(r);
  return Number.isInteger(r) ? `${r} szt` : `${dol}–${dol + 1} szt`;
}

export function podpowiedzCeny(kosztRazem, marzaProc) {
  if (marzaProc >= 100 || marzaProc < 0) return null;
  return Math.ceil(kosztRazem / (1 - marzaProc / 100));
}

export function kolorMarzy(marza, docelowa) {
  if (marza === null || marza === undefined) return 'brak';
  if (marza < 0) return 'czerwony';
  return marza < docelowa ? 'zolty' : 'zielony';
}

function czasPieczenia(przepis, czesc, m) {
  const rzecz = (przepis.rzeczywisteCzasy ?? []).find(
    (e) => e.czescId === czesc.id && kluczMnoznika(e.mnoznik) === kluczMnoznika(m));
  let minuty; let zrodlo;
  if (rzecz) { minuty = rzecz.minuty; zrodlo = 'rzeczywisty'; }
  else if (m === 1) { minuty = czesc.czasPieczeniaMin; zrodlo = 'baza'; }
  else { minuty = szacujCzas(czesc.czasPieczeniaMin, m); zrodlo = 'szacunek'; }
  return { minuty, zrodlo, sprawdz: !!czesc.sprawdzCzas || zrodlo === 'szacunek' };
}

export function podsumujPrzepis(przepis, skladnikiPoId, ustawienia, m = 1) {
  const brakujaceSkladniki = [];
  let kosztSkladnikow = 0;
  const czesci = przepis.czesci.map((czesc) => ({
    id: czesc.id,
    nazwa: czesc.nazwa,
    pozycje: czesc.pozycje.map((poz) => {
      const s = skladnikiPoId.get(poz.skladnikId);
      if (!s) {
        if (!brakujaceSkladniki.includes(poz.skladnikId)) brakujaceSkladniki.push(poz.skladnikId);
        return { skladnikId: poz.skladnikId, nazwa: '(usunięty składnik)',
          iloscTekst: formatujLiczbe(poz.ilosc * m, 'auto'), koszt: 0 };
      }
      const koszt = (s.jednostka === 'szt' ? poz.ilosc : poz.ilosc / 1000) * m * s.cena;
      kosztSkladnikow += koszt;
      return { skladnikId: s.id, nazwa: s.nazwa, iloscTekst: iloscPoPrzeliczeniu(poz.ilosc, s.jednostka, m), koszt };
    }),
    czasPieczenia: czasPieczenia(przepis, czesc, m),
  }));

  const baza = m === 1;
  const minutyPracy = baza ? przepis.czasPracyMin : szacujCzas(przepis.czasPracyMin, m);
  const czasPracy = { minuty: minutyPracy, zrodlo: baza ? 'baza' : 'szacunek',
    sprawdz: !!przepis.czasPracySprawdz || !baza };

  const kosztPracy = (minutyPracy / 60) * ustawienia.stawkaZaGodzine;
  const minutyPieczenia = czesci.reduce((suma, c) => suma + c.czasPieczenia.minuty, 0);
  const kosztPradu = (minutyPieczenia / 60) * ustawienia.mocPiekarnikaKw * ustawienia.cenaKwh;
  const kosztRazem = kosztSkladnikow + kosztPracy + kosztPradu;

  const cena = przepis.cena === null || przepis.cena === undefined ? null : przepis.cena * m;
  const maCene = cena !== null && cena !== 0;
  const kawalki = przepis.kawalki === null || przepis.kawalki === undefined ? null : przepis.kawalki * m;

  return {
    m, czesci, czasPracy,
    kosztSkladnikow, kosztPracy, kosztPradu, kosztRazem,
    cena,
    zysk: maCene ? cena - kosztRazem : null,
    marza: maCene ? ((cena - kosztRazem) / cena) * 100 : null,
    podpowiedzCeny: podpowiedzCeny(kosztRazem, ustawienia.docelowaMarza),
    kawalki,
    kosztKawalka: kawalki ? kosztRazem / kawalki : null,
    brakujaceSkladniki,
  };
}
