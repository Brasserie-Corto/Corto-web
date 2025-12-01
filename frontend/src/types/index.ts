export type BeerType = 'IPA' | 'Stout' | 'Lager' | 'Pale Ale' | 'Pilsner' | 'Sour';
export type BeerColor = 'blonde' | 'ambrée' | 'brune' | 'noire' | 'blanche';

export interface Beer {
  id: number;
  name: string;
  type: BeerType;
  color: BeerColor;
  price: number;
  imageUrl: string;
  total_quantity: number;
  inStock: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  is_active?: boolean;
  role?: string;
}