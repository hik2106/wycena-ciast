// Odczyt i formatowanie liczb w polskim zapisie (ręcznie – toLocaleString różni się między Node a Safari).
const NBSP = ' ';

export function odczytajLiczbe(tekst) {
  const t = String(tekst ?? '').replace(/[\s ]/g, '');
  if (t === '') return null;
  if (!/^-?\d+([.,]\d+)?$/.test(t)) throw new Error('Nieprawidłowa liczba');
  return Number(t.replace(',', '.'));
}

// Zaokrągla do `miejsca`, potem składa znak (bez "-0,00"), separator tysięcy = spacja twarda.
function skladaj(x, miejsca, obetnijZera) {
  const w = Math.round(Math.abs(x) * 10 ** miejsca) / 10 ** miejsca;
  let [calk, ulam = ''] = w.toFixed(miejsca).split('.');
  if (obetnijZera) ulam = ulam.replace(/0+$/, '');
  calk = calk.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const minus = x < 0 && w !== 0 ? '-' : '';
  return minus + calk + (ulam ? ',' + ulam : '');
}

export function formatujLiczbe(x, miejsca = 2) {
  return miejsca === 'auto' ? skladaj(x, 1, true) : skladaj(x, miejsca, false);
}

export function formatujKwote(x) {
  return formatujLiczbe(x, 2) + ' zł';
}

export function formatujProcent(x) {
  return x === null || x === undefined ? '—' : formatujLiczbe(x, 1) + ' %';
}

export function formatujMnoznik(m) {
  return '×' + skladaj(m, 2, true);
}
