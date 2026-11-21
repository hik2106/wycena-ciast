// Ekran „Ciasto” – na razie szkielet.
import { el } from '../ui.js';

export function rysuj(kontener, stan, nawiguj) {
  kontener.append(
    el('h1', {}, 'Ciasto'),
    el('div', { class: 'notka n' }, 'W budowie'),
  );
}
