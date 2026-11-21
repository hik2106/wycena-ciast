// Drobne pomocniki interfejsu – bez logiki biznesowej.
import { odczytajLiczbe } from './liczby.js';

export function el(tag, atrybuty = {}, ...dzieci) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(atrybuty ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) e.setAttribute(k, '');
    else e.setAttribute(k, v);
  }
  const dodaj = (d) => {
    if (d === null || d === undefined || d === false) return;
    if (Array.isArray(d)) d.forEach(dodaj);
    else e.append(d instanceof Node ? d : document.createTextNode(String(d)));
  };
  dzieci.forEach(dodaj);
  return e;
}

let licznik = 0;

// Pole liczbowe z etykietą, jednostką i błędem pod polem.
// odczytaj() -> liczba albo null (wtedy błąd jest widoczny pod polem, a puste pole nieobowiązkowe daje null bez błędu).
export function poleLiczby({ etykieta, wartosc = '', min = 0, jednostka = '', wymagane = false }) {
  const id = `pole-${++licznik}`;
  const wejscie = el('input', {
    class: 'wpis', id, type: 'text', inputmode: 'decimal', autocomplete: 'off',
    value: wartosc === null || wartosc === undefined ? '' : String(wartosc).replace('.', ','),
  });
  const blad = el('div', { class: 'blad-tekst', role: 'alert', hidden: true });
  const pokaz = (tekst) => {
    blad.textContent = tekst ?? '';
    blad.hidden = !tekst;
    wejscie.classList.toggle('blad', !!tekst);
  };
  wejscie.addEventListener('input', () => pokaz(null));
  const element = el('div', { class: 'pole' },
    el('label', { for: id }, etykieta),
    jednostka
      ? el('div', { class: 'wpis-z-jednostka' }, wejscie, el('span', { class: 'jedn' }, jednostka))
      : wejscie,
    blad);
  function odczytaj() {
    let x;
    try { x = odczytajLiczbe(wejscie.value); } catch (e) { pokaz(e.message); return null; }
    if (x === null) { pokaz(wymagane ? 'Wpisz liczbę' : null); return null; }
    if (min !== null && min !== undefined && x < min) {
      pokaz(`Liczba nie może być mniejsza niż ${String(min).replace('.', ',')}`);
      return null;
    }
    pokaz(null);
    return x;
  }
  return { element, odczytaj };
}

// Własne okno „Tak / Anuluj” (zamiast confirm()).
export function potwierdz(tekst) {
  return new Promise((rozwiaz) => {
    const zamknij = (wynik) => { nakladka.remove(); rozwiaz(wynik); };
    const nakladka = el('div', { class: 'nakladka', role: 'dialog', 'aria-modal': 'true' },
      el('div', { class: 'okno' },
        el('h3', {}, tekst),
        el('div', { class: 'para' },
          el('button', { class: 'btn drugi', type: 'button', onclick: () => zamknij(false) }, 'Anuluj'),
          el('button', { class: 'btn glowny', type: 'button', onclick: () => zamknij(true) }, 'Tak'))));
    document.body.append(nakladka);
  });
}

let zegarKomunikatu = null;

// Pasek nad zakładkami na ok. 3 s. rodzaj: 'ok' | 'blad'.
export function komunikat(tekst, rodzaj = 'ok') {
  document.querySelector('.komunikat')?.remove();
  clearTimeout(zegarKomunikatu);
  const pasek = el('div', { class: `komunikat ${rodzaj === 'blad' ? 'blad' : 'ok'}`, role: 'status' }, tekst);
  document.body.append(pasek);
  zegarKomunikatu = setTimeout(() => pasek.remove(), 3000);
}
