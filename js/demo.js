// Dane DEMONSTRACYJNE – w całości fikcyjne (nie pochodzą od żadnej firmy ani klientki).
import { pusteDane, dodajSkladnik, zapiszPrzepis, nowyId } from './dane.js';

const DZIEN = '2026-11-01';

const SKLADNIKI = [
  { nazwa: 'Mąka pszenna', jednostka: 'kg', cena: 2.8 },
  { nazwa: 'Masło', jednostka: 'kg', cena: 33 },
  { nazwa: 'Jajka', jednostka: 'szt', cena: 0.9 },
  { nazwa: 'Cukier', jednostka: 'kg', cena: 4.5 },
  { nazwa: 'Ser twarogowy', jednostka: 'kg', cena: 22 },
  { nazwa: 'Jabłka', jednostka: 'kg', cena: 5 },
  { nazwa: 'Czekolada gorzka', jednostka: 'kg', cena: 42 },
  { nazwa: 'Maliny mrożone', jednostka: 'kg', cena: 30 },
];

export function daneDemo() {
  let dane = pusteDane();
  for (const s of SKLADNIKI) dane = dodajSkladnik(dane, s, DZIEN);
  const id = (nazwa) => dane.skladniki.find((s) => s.nazwa === nazwa).id;
  const poz = (nazwa, ilosc) => ({ skladnikId: id(nazwa), ilosc });
  const czesc = (nazwa, czasPieczeniaMin, pozycje) => ({ id: nowyId(), nazwa, czasPieczeniaMin, pozycje });
  const przepis = (p) => ({ id: nowyId(), czasPracySprawdz: false, rzeczywisteCzasy: [], ...p });

  const przepisy = [
    przepis({
      nazwa: 'Sernik waniliowy', czasPracyMin: 60, cena: 90, kawalki: 12, formaCm: 24,
      czesci: [
        czesc('Spód', 15, [poz('Mąka pszenna', 250), poz('Masło', 125), poz('Cukier', 60)]),
        czesc('Masa serowa', 60, [poz('Ser twarogowy', 1000), poz('Jajka', 4), poz('Cukier', 180)]),
      ],
    }),
    przepis({
      nazwa: 'Szarlotka z kruszonką', czasPracyMin: 75, cena: 95, kawalki: 12, formaCm: 24,
      czesci: [
        czesc('Ciasto', 40, [poz('Mąka pszenna', 300), poz('Masło', 200), poz('Jajka', 2), poz('Cukier', 120)]),
        czesc('Nadzienie', 0, [poz('Jabłka', 1200)]),
      ],
    }),
    przepis({
      nazwa: 'Tort czekoladowy', czasPracyMin: 150, cena: 90, kawalki: 14, formaCm: 20,
      czesci: [
        czesc('Biszkopt', 35, [poz('Mąka pszenna', 200), poz('Jajka', 6), poz('Cukier', 200), poz('Czekolada gorzka', 150)]),
        czesc('Krem', 0, [poz('Masło', 400), poz('Czekolada gorzka', 400), poz('Cukier', 100)]),
      ],
    }),
    przepis({
      nazwa: 'Brownie z malinami', czasPracyMin: 30, cena: null, kawalki: 16, formaCm: null,
      czesci: [
        czesc('Brownie', 30, [poz('Czekolada gorzka', 200), poz('Masło', 180), poz('Jajka', 3), poz('Cukier', 150),
          poz('Mąka pszenna', 100), poz('Maliny mrożone', 150)]),
      ],
    }),
  ];
  for (const p of przepisy) dane = zapiszPrzepis(dane, p);
  return dane;
}
