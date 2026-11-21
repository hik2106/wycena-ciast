// Kopia zapasowa: tworzenie i bezpieczne wczytywanie pliku .json.
// Wczytanie nigdy nie zmienia istniejących danych – zwraca nowy obiekt albo rzuca Error.
import { WERSJA_SCHEMATU, pusteDane, zapiszPrzepis, zmienUstawienia } from './dane.js';

const NIE_KOPIA = 'To nie jest plik kopii Wyceny Ciast';
const NOWSZA = 'Kopia pochodzi z nowszej wersji aplikacji – zaktualizuj aplikację';
const JEDNOSTKI = ['kg', 'l', 'szt'];
const DZIEN_MS = 24 * 60 * 60 * 1000;

export const nazwaPlikuKopii = (dzis) => `wycena-ciast-kopia-${dzis}.json`;

export function utworzKopie(dane) {
  const { uszkodzone, ...czyste } = dane;
  return JSON.stringify({ aplikacja: 'wycena-ciast', ...czyste }, null, 2);
}

// Migracje: klucz N = przejście z wersji N na N+1. Na razie brak (jest tylko wersja 1).
const MIGRACJE = {};

export function migruj(dane) {
  let d = structuredClone(dane);
  for (let w = d.wersja ?? 1; w < WERSJA_SCHEMATU; w++) {
    if (MIGRACJE[w]) d = MIGRACJE[w](d);
    d.wersja = w + 1;
  }
  d.ustawienia = { ...pusteDane().ustawienia, ...(d.ustawienia ?? {}) };
  return d;
}

const jestObiektem = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const skonczona = (x) => typeof x === 'number' && Number.isFinite(x);

function sprawdzSkladniki(lista) {
  if (!Array.isArray(lista)) throw new Error('skladniki');
  const ids = new Set();
  for (const s of lista) {
    if (!jestObiektem(s)) throw new Error('skladnik');
    if (typeof s.id !== 'string' || !s.id || ids.has(s.id)) throw new Error('id składnika');
    ids.add(s.id);
    if (typeof s.nazwa !== 'string' || !s.nazwa.trim()) throw new Error('nazwa składnika');
    if (!JEDNOSTKI.includes(s.jednostka)) throw new Error('jednostka');
    if (!skonczona(s.cena) || s.cena < 0) throw new Error('cena');
    if (typeof s.dataZmianyCeny !== 'string') throw new Error('dataZmianyCeny');
    if (typeof s.sprawdzCene !== 'boolean') throw new Error('sprawdzCene');
  }
}

function sprawdzPrzepisy(lista) {
  const ids = new Set();
  for (const p of lista) {
    if (!jestObiektem(p)) throw new Error('przepis');
    if (typeof p.id !== 'string' || !p.id || ids.has(p.id)) throw new Error('id przepisu');
    ids.add(p.id);
    if (!Array.isArray(p.czesci)) throw new Error('czesci');
    const idCzesci = new Set();
    for (const c of p.czesci) {
      if (!jestObiektem(c)) throw new Error('część');
      if (typeof c.id !== 'string' || !c.id || idCzesci.has(c.id)) throw new Error('id części');
      idCzesci.add(c.id);
      if (typeof c.nazwa !== 'string') throw new Error('nazwa części');
    }
    if (p.rzeczywisteCzasy !== undefined && !Array.isArray(p.rzeczywisteCzasy)) throw new Error('rzeczywisteCzasy');
    for (const e of p.rzeczywisteCzasy ?? []) {
      if (!jestObiektem(e) || typeof e.czescId !== 'string' || !skonczona(e.mnoznik) || e.mnoznik <= 0
        || !skonczona(e.minuty) || e.minuty < 0) throw new Error('rzeczywisty czas');
    }
  }
}

export function wczytajKopie(tekst) {
  let kopia;
  try {
    kopia = JSON.parse(tekst);
  } catch {
    throw new Error(NIE_KOPIA);
  }
  if (!jestObiektem(kopia) || kopia.aplikacja !== 'wycena-ciast') throw new Error(NIE_KOPIA);
  if (skonczona(kopia.wersja) && kopia.wersja > WERSJA_SCHEMATU) throw new Error(NOWSZA);
  try {
    if (!skonczona(kopia.wersja) || kopia.wersja < 1) throw new Error('wersja');
    if (!Array.isArray(kopia.przepisy)) throw new Error('przepisy');
    if (kopia.ostatniaKopia !== null && typeof kopia.ostatniaKopia !== 'string') throw new Error('ostatniaKopia');
    if (kopia.ustawienia !== undefined && !jestObiektem(kopia.ustawienia)) throw new Error('ustawienia');
    sprawdzSkladniki(kopia.skladniki);
    sprawdzPrzepisy(kopia.przepisy);
    const m = migruj(kopia);
    let d = { ...pusteDane(), skladniki: structuredClone(m.skladniki), ostatniaKopia: m.ostatniaKopia };
    d = zmienUstawienia(d, m.ustawienia);
    for (const p of m.przepisy) {
      if (!jestObiektem(p)) throw new Error('przepis');
      d = zapiszPrzepis(d, p);
    }
    return { dane: d, podsumowanie: { ciasta: d.przepisy.length, skladniki: d.skladniki.length } };
  } catch (e) {
    throw new Error(`${NIE_KOPIA} (${e.message})`);
  }
}

const dniOdEpoki = (data) => {
  const [r, m, d] = data.split('-').map(Number);
  return Date.UTC(r, m - 1, d) / DZIEN_MS;
};

export function czyPrzypomniecOKopii(dane, dzis) {
  if (dane.przepisy.length < 1) return false;
  if (dane.ostatniaKopia == null) return true;
  return dniOdEpoki(dzis) - dniOdEpoki(dane.ostatniaKopia) > 30;
}
