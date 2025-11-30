import type { Beer } from '@/types';
import { createClient } from '@supabase/supabase-js'

export const beerImage = 'https://cdn.pixabay.com/photo/2020/04/18/04/24/beer-5057609_640.jpg';

// 1. Initialisation du client Supabase
// Note: Idéalement, mets ces clés dans un fichier .env (voir note en bas)
const supabase = createClient(
  "http://localhost:8000", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE"
)

export const getBeerColors = async () => {
  // 1. The SQL equivalent: SELECT color FROM recipe
  const { data, error } = await supabase
    .from('recipe')
    .select('color');

  if (error) {
    console.error('Error loading colors:', error);
    return [];
  }

  // 2. Data comes back as objects: [{ color: 'Blonde' }, { color: 'IPA' }, ...]
  // We map them to strings, then use Set to dedup.
  const uniqueColors = [...new Set(data.map((item: any) => item.color))];

  return uniqueColors;
}

export const beerColors = getBeerColors();
console.log(beerColors)


export const maxPrice = 20;
