export type BeerType = 'IPA' | 'Stout' | 'Lager' | 'Pale Ale' | 'Pilsner' | 'Sour';
export type BeerColor = 'blonde' | 'ambrée' | 'brune' | 'noire' | 'blanche';

export interface Contenant {
  id: number;
  volume: number; // en cl
  stock: number;
  price: number; // prix pour ce contenant
}

export interface Beer {
  id: number;
  name: string;
  type?: BeerType;
  color: BeerColor;
  basePrice: number; // prix de base (pour 1L ou référence)
  pricePerLiter: number;
  imageUrl: string;
  contenants: Contenant[];
  inStock: boolean;
}

export interface User {
  id: string;
  clientId?: number; // ID in the client table (bigint)
  name: string;
  email: string;
  is_active?: boolean;
  role?: string;
}

export interface CartItem {
  id: number; // reservation id
  id_recipe: number;
  id_contening: number;
  volume: number; // volume du contenant en cl
  name: string;
  price: number;
  imageUrl: string;
  color: string;
  quantity: number;
  expires_at: string;
}

export interface Order {
  id: number;
  order_date: string;
  deliver_date?: string;
  amount: number;
  status: string;
  items: OrderItem[];
}

export interface OrderItem {
  beer_id?: number;
  name?: string;
  recipe_name?: string;
  quantity: number;
  price: number;
  subtotal?: number;
  imageUrl?: string;
}