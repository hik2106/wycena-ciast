// Ekran „Ustawienia” – na razie szkielet.
import { el } from '../ui.js';

export function rysuj(kontener, stan, nawiguj) {
  kontener.append(
    el('h1', {}, 'Ustawienia'),
    el('div', { class: 'notka n' }, 'W budowie'),
  );
}
