export interface Product {
  price:
    | {
        value: number | string;
        currency: string;
      }
    | 'Sur devis';
  bookingUrl: string;
}

export interface Healthcare {
  id: number;
  title: string;
  description: string;
  img: string;
  duration: {
    value: number;
    unitText: string;
  };
  audience: string;
  products: {
    [office: string]: Product;
  };
}
