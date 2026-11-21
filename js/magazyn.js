// Zapis danych w telefonie (localStorage). `magazyn` to obiekt z getItem/setItem.
import { pusteDane } from './dane.js';
import { migruj } from './kopia.js';

export const KLUCZ = 'wycenaCiast.dane';
const KLUCZ_USZKODZONE = 'wycenaCiast.uszkodzone';

export function wczytaj(magazyn) {
  const surowe = magazyn.getItem(KLUCZ);
  if (surowe == null) return pusteDane();
  let obiekt;
  try { obiekt = JSON.parse(surowe); } catch { obiekt = null; }
  if (obiekt === null || typeof obiekt !== 'object' || Array.isArray(obiekt)) {
    try { magazyn.setItem(KLUCZ_USZKODZONE, surowe); } catch { /* brak miejsca – trudno */ }
    return { ...pusteDane(), uszkodzone: true };
  }
  return migruj(obiekt);
}

export function zapisz(magazyn, dane) {
  try {
    const { uszkodzone, ...czyste } = dane;
    magazyn.setItem(KLUCZ, JSON.stringify(czyste));
    return { ok: true };
  } catch {
    return { ok: false, blad: 'Nie udało się zapisać danych w telefonie' };
  }
}

export async function poprosOTrwalyMagazyn() {
  try {
    return (await globalThis.navigator?.storage?.persist?.()) === true;
  } catch {
    return false;
  }
}
