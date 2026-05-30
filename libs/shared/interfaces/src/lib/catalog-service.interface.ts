export interface CatalogService {
  id: string;
  title: string;
  price: number;
  currency: string;
  duration: { value: number; unitText: string };
}
