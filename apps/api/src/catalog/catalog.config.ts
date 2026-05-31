import { CatalogService } from '@five-of-heart/shared/interfaces';

// Seeded from apps/fiveOfHeart/public/data/healthcare.json.
// Uses the top-level price.value as the canonical price (open P1: per-office pricing not represented here).
// Item 10 (enterprise quote "Sur devis") excluded — price is non-numeric and cannot be represented as CatalogService.price.
export const CATALOG_SERVICES: CatalogService[] = [
  {
    id: '1',
    title: 'Soins énergétiques',
    price: 45,
    currency: 'EUR',
    duration: { value: 45, unitText: 'min' },
  },
  {
    id: '2',
    title: 'Massage Holistique',
    price: 65,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
  {
    id: '3',
    title: 'Massage Prénatal',
    price: 60,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
  {
    id: '4',
    title: 'Barrage des brûlures',
    price: 35,
    currency: 'EUR',
    duration: { value: 30, unitText: 'min' },
  },
  {
    id: '5',
    title: 'Massage Knap',
    price: 45,
    currency: 'EUR',
    duration: { value: 45, unitText: 'min' },
  },
  {
    id: '6',
    title: "Bougies d'oreille Hopi",
    price: 40,
    currency: 'EUR',
    duration: { value: 30, unitText: 'min' },
  },
  {
    id: '7',
    title: 'Micro massage crânien',
    price: 45,
    currency: 'EUR',
    duration: { value: 45, unitText: 'min' },
  },
  {
    id: '8',
    title: 'Pierres chaudes',
    price: 60,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
  {
    id: '9',
    title: 'Massage en duo',
    price: 130,
    currency: 'EUR',
    duration: { value: 60, unitText: 'min' },
  },
];
