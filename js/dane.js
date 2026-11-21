// Operacje na danych – czyste funkcje: zwracają nowy obiekt `dane`, nie zmieniają wejścia.
// Błędy: Error z polskim komunikatem dla użytkowniczki.
import { kluczMnoznika, szacujCzas } from './obliczenia.js';
import { formatujMnoznik, formatujLiczbe } from './liczby.js';

export const WERSJA_SCHEMATU = 1;
const JEDNOSTKI = ['kg', 'l', 'szt'];

export const pusteDane = () => ({
  wersja: WERSJA_SCHEMATU,
  ustawienia: { stawkaZaGodzine: 30, mocPiekarnikaKw: 2.0, cenaKwh: 1.10, docelowaMarza: 40 },
  skladniki: [],
  przepisy: [],
  ostatniaKopia: null,
});

export const nowyId = () => crypto.randomUUID();

const skala = (x, m) => Math.round(x * m * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;
const liczba = (x) => typeof x === 'number' && Number.isFinite(x);
const dodatnia = (x) => liczba(x) && x > 0;
const nieujemna = (x) => liczba(x) && x >= 0;
const ten = (a, b) => a.trim().toLocaleLowerCase('pl') === b.trim().toLocaleLowerCase('pl');

function sprawdzNazweSkladnika(dane, nazwa, pomijajId) {
  if (!nazwa) throw new Error('Podaj nazwę składnika');
  if (dane.skladniki.some((s) => s.id !== pomijajId && ten(s.nazwa, nazwa))) {
    throw new Error(`Składnik „${nazwa}” już jest w cenniku`);
  }
}
function sprawdzCene(cena) {
  if (!nieujemna(cena)) throw new Error('Cena musi być liczbą nie mniejszą niż 0');
}
function sprawdzJednostke(j) {
  if (!JEDNOSTKI.includes(j)) throw new Error('Jednostka musi być: kg, l albo szt');
}

export function dodajSkladnik(dane, { nazwa, jednostka, cena }, dzis) {
  const n = String(nazwa ?? '').trim();
  sprawdzNazweSkladnika(dane, n);
  sprawdzJednostke(jednostka);
  sprawdzCene(cena);
  const s = { id: nowyId(), nazwa: n, jednostka, cena, dataZmianyCeny: dzis, sprawdzCene: false };
  return { ...structuredClone(dane), skladniki: [...structuredClone(dane.skladniki), s] };
}

export function zmienSkladnik(dane, id, zmiany, dzis) {
  const stary = dane.skladniki.find((s) => s.id === id);
  if (!stary) throw new Error('Nie znaleziono składnika');
  const nowy = { ...stary };
  if ('nazwa' in zmiany) {
    nowy.nazwa = String(zmiany.nazwa ?? '').trim();
    sprawdzNazweSkladnika(dane, nowy.nazwa, id);
  }
  if ('jednostka' in zmiany) { sprawdzJednostke(zmiany.jednostka); nowy.jednostka = zmiany.jednostka; }
  if ('cena' in zmiany) {
    sprawdzCene(zmiany.cena);
    if (zmiany.cena !== stary.cena) { nowy.cena = zmiany.cena; nowy.dataZmianyCeny = dzis; nowy.sprawdzCene = false; }
  }
  const d = structuredClone(dane);
  d.skladniki = d.skladniki.map((s) => (s.id === id ? nowy : s));
  return d;
}

export const gdzieUzyty = (dane, skladnikId) => dane.przepisy
  .filter((p) => p.czesci.some((c) => c.pozycje.some((poz) => poz.skladnikId === skladnikId)))
  .map((p) => p.nazwa);

export function usunSkladnik(dane, id) {
  const gdzie = gdzieUzyty(dane, id);
  if (gdzie.length) throw new Error(`Składnik jest użyty w: ${gdzie.join(', ')}`);
  const d = structuredClone(dane);
  d.skladniki = d.skladniki.filter((s) => s.id !== id);
  return d;
}

function sprawdzOpcjonalna(x, etykieta) {
  if (x === null || x === undefined) return null;
  if (!dodatnia(x)) throw new Error(`${etykieta} musi być większa od 0 albo pusta`);
  return x;
}

export function zapiszPrzepis(dane, przepis) {
  const p = structuredClone(przepis);
  p.nazwa = String(p.nazwa ?? '').trim();
  if (!p.nazwa) throw new Error('Podaj nazwę ciasta');
  if (!Array.isArray(p.czesci) || p.czesci.length < 1) throw new Error('Ciasto musi mieć co najmniej jedną część');
  if (!nieujemna(p.czasPracyMin)) throw new Error('Czas pracy musi być liczbą nie mniejszą niż 0');
  p.cena = sprawdzOpcjonalna(p.cena, 'Cena');
  p.kawalki = sprawdzOpcjonalna(p.kawalki, 'Liczba kawałków');
  p.formaCm = sprawdzOpcjonalna(p.formaCm, 'Średnica formy');
  const stary = dane.przepisy.find((x) => x.id === p.id);
  p.czasPracySprawdz = !!p.czasPracySprawdz;
  if (stary && stary.czasPracyMin !== p.czasPracyMin) p.czasPracySprawdz = false;
  for (const c of p.czesci) {
    if (!nieujemna(c.czasPieczeniaMin)) throw new Error(`Czas pieczenia części „${c.nazwa}” musi być liczbą nie mniejszą niż 0`);
    c.sprawdzCzas = !!c.sprawdzCzas;
    const sc = stary?.czesci.find((x) => x.id === c.id);
    if (sc && sc.czasPieczeniaMin !== c.czasPieczeniaMin) c.sprawdzCzas = false;
    for (const poz of c.pozycje ?? []) {
      if (!dodatnia(poz.ilosc)) throw new Error('Ilość składnika musi być większa od 0');
      if (!dane.skladniki.some((s) => s.id === poz.skladnikId)) throw new Error('Wybrany składnik nie istnieje w cenniku');
    }
    c.pozycje = c.pozycje ?? [];
  }
  const idCzesci = new Set(p.czesci.map((c) => c.id));
  p.rzeczywisteCzasy = (p.rzeczywisteCzasy ?? []).filter((e) => idCzesci.has(e.czescId));
  const d = structuredClone(dane);
  d.przepisy = stary ? d.przepisy.map((x) => (x.id === p.id ? p : x)) : [...d.przepisy, p];
  return d;
}

export function usunPrzepis(dane, id) {
  const d = structuredClone(dane);
  d.przepisy = d.przepisy.filter((p) => p.id !== id);
  return d;
}

function znajdzPrzepis(dane, id) {
  const p = dane.przepisy.find((x) => x.id === id);
  if (!p) throw new Error('Nie znaleziono ciasta');
  return p;
}

export function duplikujPrzepis(dane, id) {
  const k = structuredClone(znajdzPrzepis(dane, id));
  const mapa = new Map();
  k.id = nowyId();
  k.nazwa = `${k.nazwa} (kopia)`;
  for (const c of k.czesci) { const nowy = nowyId(); mapa.set(c.id, nowy); c.id = nowy; }
  k.rzeczywisteCzasy = (k.rzeczywisteCzasy ?? []).map((e) => ({ ...e, czescId: mapa.get(e.czescId) }));
  const d = structuredClone(dane);
  d.przepisy.push(k);
  return { dane: d, nowyId: k.id };
}

export function zapiszRzeczywistyCzas(dane, przepisId, czescId, m, minuty) {
  if (!nieujemna(minuty)) throw new Error('Czas musi być liczbą nie mniejszą niż 0');
  const d = structuredClone(dane);
  const p = znajdzPrzepis(d, przepisId);
  const c = p.czesci.find((x) => x.id === czescId);
  if (!c) throw new Error('Nie znaleziono części ciasta');
  const klucz = kluczMnoznika(m);
  p.rzeczywisteCzasy = (p.rzeczywisteCzasy ?? [])
    .filter((e) => !(e.czescId === czescId && kluczMnoznika(e.mnoznik) === klucz));
  p.rzeczywisteCzasy.push({ czescId, mnoznik: klucz, minuty });
  c.sprawdzCzas = false;
  return d;
}

export function zapiszJakoNowy(dane, przepisId, m, nowaFormaCm) {
  if (!dodatnia(m)) throw new Error('Nieprawidłowy mnożnik');
  if (nowaFormaCm != null && !dodatnia(nowaFormaCm)) throw new Error('Nieprawidłowa średnica formy');
  const zrodlo = znajdzPrzepis(dane, przepisId);
  const n = structuredClone(zrodlo);
  const klucz = kluczMnoznika(m);
  const jednostki = new Map(dane.skladniki.map((s) => [s.id, s.jednostka]));
  n.id = nowyId();
  n.nazwa = nowaFormaCm != null
    ? `${zrodlo.nazwa} ${formatujLiczbe(nowaFormaCm, 'auto')} cm`
    : `${zrodlo.nazwa} ${formatujMnoznik(m)}`;
  n.czasPracyMin = szacujCzas(zrodlo.czasPracyMin, m);
  n.czasPracySprawdz = m !== 1 || !!zrodlo.czasPracySprawdz;
  n.cena = zrodlo.cena == null ? null : round2(zrodlo.cena * m);
  n.kawalki = zrodlo.kawalki == null ? null : Math.max(1, Math.round(zrodlo.kawalki * m));
  n.formaCm = nowaFormaCm ?? zrodlo.formaCm;
  n.czesci = n.czesci.map((c) => {
    const rzecz = (zrodlo.rzeczywisteCzasy ?? []).find((e) => e.czescId === c.id && kluczMnoznika(e.mnoznik) === klucz);
    const wynik = { ...c, id: nowyId() };
    wynik.pozycje = c.pozycje.map((poz) => ({
      ...poz,
      ilosc: jednostki.get(poz.skladnikId) === 'szt' ? poz.ilosc * m : Math.max(0.1, skala(poz.ilosc, m)),
    }));
    if (rzecz) { wynik.czasPieczeniaMin = rzecz.minuty; wynik.sprawdzCzas = false; }
    else { wynik.czasPieczeniaMin = szacujCzas(c.czasPieczeniaMin, m); wynik.sprawdzCzas = m !== 1 || !!c.sprawdzCzas; }
    return wynik;
  });
  n.rzeczywisteCzasy = [];
  const d = structuredClone(dane);
  d.przepisy.push(n);
  return { dane: d, nowyId: n.id };
}

const ETYKIETY_USTAWIEN = {
  stawkaZaGodzine: 'Stawka za godzinę', mocPiekarnikaKw: 'Moc piekarnika',
  cenaKwh: 'Cena prądu', docelowaMarza: 'Docelowa marża',
};

export function zmienUstawienia(dane, zmiany) {
  const d = structuredClone(dane);
  for (const [k, v] of Object.entries(zmiany)) {
    if (!(k in ETYKIETY_USTAWIEN)) continue;
    if (!nieujemna(v)) throw new Error(`${ETYKIETY_USTAWIEN[k]} musi być liczbą nie mniejszą niż 0`);
    if (k === 'docelowaMarza' && v > 99) throw new Error('Docelowa marża musi mieścić się w zakresie 0–99');
    d.ustawienia[k] = v;
  }
  return d;
}
