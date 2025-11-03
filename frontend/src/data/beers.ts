import type { Beer } from '@/types';

export const beerImage = 'https://cdn.pixabay.com/photo/2020/04/18/04/24/beer-5057609_640.jpg';

export const beers: Beer[] = [
  {
    id: 1,
    name: 'Cosmic Haze',
    type: 'IPA',
    color: 'Blonde',
    price: 7.50,
    imageUrl: beerImage,
    inStock: true,
  },
  {
    id: 2,
    name: 'Midnight Stout',
    type: 'Stout',
    color: 'Dark',
    price: 8.00,
    imageUrl: 'https://cdn.pixabay.com/photo/2020/10/30/18/35/beer-5699482_640.jpg',
    inStock: true,
  },
  {
    id: 3,
    name: 'Golden Lager',
    type: 'Lager',
    color: 'Blonde',
    price: 5.50,
    imageUrl: 'https://cdn.pixabay.com/photo/2015/05/09/12/39/beer-759627_640.png',
    inStock: false,
  },
  {
    id: 4,
    name: 'Amber Trail Ale',
    type: 'Pale Ale',
    color: 'Amber',
    price: 6.50,
    imageUrl: beerImage,
    inStock: true,
  },
  {
    id: 5,
    name: 'Crisp Pils',
    type: 'Pilsner',
    color: 'Blonde',
    price: 6.00,
    imageUrl: beerImage,
    inStock: true,
  },
  {
    id: 6,
    name: 'Ruby Sour',
    type: 'Sour',
    color: 'Amber',
    price: 9.00,
    imageUrl: beerImage,
    inStock: true,
  },
  {
    id: 7,
    name: 'Galaxy IPA',
    type: 'IPA',
    color: 'Blonde',
    price: 8.50,
    imageUrl: beerImage,
    inStock: false,
  },
  {
    id: 8,
    name: 'Velvet Night',
    type: 'Stout',
    color: 'Dark',
    price: 9.50,
    imageUrl: beerImage,
    inStock: true,
  },
  {
    id: 9,
    name: 'Sunset Pale Ale',
    type: 'Pale Ale',
    color: 'Amber',
    price: 7.00,
    imageUrl: beerImage,
    inStock: true,
  },
  {
    id: 10,
    name: 'Czech Classic',
    type: 'Pilsner',
    color: 'Blonde',
    price: 6.25,
    imageUrl: beerImage,
    inStock: true,
  }
];

export const beerTypes = [...new Set(beers.map(b => b.type))];
export const beerColors = [...new Set(beers.map(b => b.color))];
export const maxPrice = Math.ceil(Math.max(...beers.map(b => b.price)));
