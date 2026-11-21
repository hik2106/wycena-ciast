// Start aplikacji: stan, router (location.hash), rejestracja service workera.
import { wczytaj, zapisz, poprosOTrwalyMagazyn, KLUCZ } from './magazyn.js';
import { daneDemo } from './demo.js';
import { el, komunikat } from './ui.js';
import * as ciasta from './ekrany/ciasta.js';
import * as ciasto from './ekrany/ciasto.js';
import * as edycja from './ekrany/edycja.js';
import * as skladniki from './ekrany/skladniki.js';
import * as ustawienia from './ekrany/ustawienia.js';

const magazyn = globalThis.localStorage;
const kontener = document.getElementById('ekran');

function wczytajDane() {
  const dane = wczytaj(magazyn);
  const pusty = magazyn.getItem(KLUCZ) == null;
  // Dane demonstracyjne tylko z ?demo i tylko przy pustym magazynie; same z siebie nie zapisują się.
  return pusty && new URLSearchParams(location.search).has('demo') ? daneDemo() : dane;
}

export const stan = {
  dane: wczytajDane(),
  zapisz(noweDane) {
    const wynik = zapisz(magazyn, noweDane);
    if (!wynik.ok) { komunikat(wynik.blad, 'blad'); return wynik; }
    stan.dane = noweDane;
    przerysuj();
    return wynik;
  },
};

export const nawiguj = (hash) => { location.hash = hash; };

const TRASY = {
  ciasta: { modul: ciasta, zakladka: 'ciasta' },
  ciasto: { modul: ciasto, zakladka: 'ciasta' },
  edycja: { modul: edycja, zakladka: 'ciasta' },
  skladniki: { modul: skladniki, zakladka: 'skladniki' },
  ustawienia: { modul: ustawienia, zakladka: 'ustawienia' },
};

function trasa() {
  const [, nazwa, ...reszta] = location.hash.replace(/^#/, '').split('/');
  const id = reszta.length ? decodeURIComponent(reszta.join('/')) : null;
  const maId = nazwa === 'ciasto' || nazwa === 'edycja';
  if (!(nazwa in TRASY) || (maId && !id)) return { nazwa: 'ciasta', id: null };
  return { nazwa, id: maId ? id : null };
}

export function przerysuj() {
  const { nazwa, id } = trasa();
  kontener.replaceChildren();
  if (stan.dane.uszkodzone) {
    kontener.append(el('div', { class: 'notka r' },
      'Nie udało się odczytać zapisanych danych. Wczytaj kopię zapasową w Ustawieniach.'));
  }
  TRASY[nazwa].modul.rysuj(kontener, stan, nawiguj, id);
  for (const a of document.querySelectorAll('.pasek > a')) {
    const aktywna = a.dataset.zakladka === TRASY[nazwa].zakladka;
    a.classList.toggle('on', aktywna);
    if (aktywna) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', przerysuj);
przerysuj();
poprosOTrwalyMagazyn();

const bezpiecznyAdres = location.protocol === 'https:' || location.hostname === 'localhost';
if ('serviceWorker' in navigator && bezpiecznyAdres) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* aplikacja działa i bez offline */ });
}
