-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- DELETING OLD TABLES
DROP TABLE IF EXISTS public.content    CASCADE;
DROP TABLE IF EXISTS public.stocked    CASCADE;
DROP TABLE IF EXISTS public.contains   CASCADE;
DROP TABLE IF EXISTS public.comment    CASCADE;
DROP TABLE IF EXISTS public.like       CASCADE;
DROP TABLE IF EXISTS public.beer       CASCADE;
DROP TABLE IF EXISTS public.command    CASCADE;
DROP TABLE IF EXISTS public.client     CASCADE;
DROP TABLE IF EXISTS public.contening  CASCADE;
DROP TABLE IF EXISTS public.recipe     CASCADE;
DROP TABLE IF EXISTS public.ingredient CASCADE;





-- CREATE NEW TABLES 
CREATE TABLE public.ingredient (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  price_kg numeric NOT NULL,
  bio boolean DEFAULT false,
  CONSTRAINT ingredient_pkey PRIMARY KEY (id)
);
CREATE TABLE public.recipe (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  description text,
  color text NOT NULL,
  flavor bigint NOT NULL,
  impatage json NOT NULL,
  boiling json NOT NULL,
  fermentation json NOT NULL,
  price FLOAT4 CHECK (price > 0),
  image text GENERATED ALWAYS AS ('beer/images/main/' || id::text || '.png') STORED,
  CONSTRAINT recipe_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contening (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  volume bigint,
  CONSTRAINT contening_pkey PRIMARY KEY (id)
);
CREATE TABLE public.client (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  lastname text NOT NULL,
  mail text NOT NULL,
  phone text NOT NULL,
  address text,
  is_active boolean DEFAULT false,
  role text DEFAULT 'user',
  CONSTRAINT client_pkey PRIMARY KEY (id)
);
CREATE TABLE public.beer (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  brew_date timestamp with time zone NOT NULL,
  bottling_date timestamp with time zone NOT NULL,
  id_recipe bigint NOT NULL,
  CONSTRAINT beer_pkey PRIMARY KEY (id),
  CONSTRAINT beer_id_recipe_fkey FOREIGN KEY (id_recipe) REFERENCES public.recipe(id)
);
CREATE TABLE public.command (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  deliver_date timestamp with time zone,
  amount bigint NOT NULL,
  status text DEFAULT ''::text,
  id_client bigint,
  CONSTRAINT command_pkey PRIMARY KEY (id),
  CONSTRAINT command_id_client_fkey FOREIGN KEY (id_client) REFERENCES public.client(id)
);
CREATE TABLE public.comment (
  id_recipe bigint NOT NULL,
  id_client bigint NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comment_pkey PRIMARY KEY (id_recipe, id_client),
  CONSTRAINT comment_id_client_fkey FOREIGN KEY (id_client) REFERENCES public.client(id),
  CONSTRAINT comment_id_recipe_fkey FOREIGN KEY (id_recipe) REFERENCES public.recipe(id)
);
CREATE TABLE public.contains (
  id_recipe bigint NOT NULL,
  id_ingredient bigint NOT NULL,
  quantity_kg numeric NOT NULL,
  CONSTRAINT contains_pkey PRIMARY KEY (id_recipe, id_ingredient),
  CONSTRAINT contains_id_recipe_fkey FOREIGN KEY (id_recipe) REFERENCES public.recipe(id),
  CONSTRAINT contains_id_ingredient_fkey FOREIGN KEY (id_ingredient) REFERENCES public.ingredient(id)
);
CREATE TABLE public.content (
  id_beer bigint NOT NULL,
  id_contening bigint NOT NULL,
  id_comand bigint NOT NULL,
  quantity bigint NOT NULL,
  CONSTRAINT content_pkey PRIMARY KEY (id_beer, id_contening, id_comand),
  CONSTRAINT content_id_beer_fkey FOREIGN KEY (id_beer) REFERENCES public.beer(id),
  CONSTRAINT content_id_contening_fkey FOREIGN KEY (id_contening) REFERENCES public.contening(id),
  CONSTRAINT content_id_comand_fkey FOREIGN KEY (id_comand) REFERENCES public.command(id)
);
CREATE TABLE public.like (
  id_recipe bigint NOT NULL,
  id_client bigint NOT NULL,
  CONSTRAINT like_pkey PRIMARY KEY (id_recipe, id_client),
  CONSTRAINT like_id_recipe_fkey FOREIGN KEY (id_recipe) REFERENCES public.recipe(id),
  CONSTRAINT like_id_client_fkey FOREIGN KEY (id_client) REFERENCES public.client(id)
);
CREATE TABLE public.stocked (
  id_beer bigint NOT NULL,
  id_contening bigint NOT NULL,
  quantity bigint NOT NULL,
  CONSTRAINT stocked_pkey PRIMARY KEY (id_beer, id_contening),
  CONSTRAINT stocked_id_beer_fkey FOREIGN KEY (id_beer) REFERENCES public.beer(id),
  CONSTRAINT stocked_id_contening_fkey FOREIGN KEY (id_contening) REFERENCES public.contening(id)
);

CREATE TABLE public.reservation (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_client bigint NOT NULL,
  id_recipe bigint NOT NULL,
  id_contening bigint NOT NULL DEFAULT 1,
  quantity bigint NOT NULL DEFAULT 1,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reservation_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_id_client_fkey FOREIGN KEY (id_client) REFERENCES public.client(id),
  CONSTRAINT reservation_id_recipe_fkey FOREIGN KEY (id_recipe) REFERENCES public.recipe(id),
  CONSTRAINT reservation_id_contening_fkey FOREIGN KEY (id_contening) REFERENCES public.contening(id)
);





-- VIEWS to avoid complex requests in the frontend code
-- CREATE VIEW detailed_recipes AS
-- SELECT r.id, r.price, r.name, r.image, s.quantity, s.id_contening
-- FROM recipe r
-- INNER JOIN beer b on b.id_recipe = r.id 
-- INNER JOIN contains c ON r.id = c.id_recipe
-- INNER JOIN ingredient i ON c.id_ingredient = i.id
-- INNER JOIN stocked s on s.id_beer = b.id
-- GROUP BY r.id, s.quantity, s.id_contening
-- HAVING s.id_contening = 1
-- ORDER BY r.id;



CREATE VIEW detailed_recipes AS
SELECT 
    r.id, 
    r.price, 
    r.name, 
    r.image, 
    SUM(s.quantity) as total_quantity,
    s.id_contening,
    r.color
FROM recipe r
INNER JOIN beer b ON b.id_recipe = r.id 
INNER JOIN stocked s ON s.id_beer = b.id
WHERE s.id_contening = 1
GROUP BY 
    r.id, 
    r.price, 
    r.name, 
    r.image, 
    s.id_contening
ORDER BY r.id;


-- Vue pour le stock disponible (stock réel - réservations actives)
CREATE VIEW available_stock AS
SELECT 
    dr.id,
    dr.price,
    dr.name,
    dr.image,
    dr.color,
    dr.id_contening,
    dr.total_quantity,
    COALESCE(
        dr.total_quantity - (
            SELECT COALESCE(SUM(r.quantity), 0)
            FROM reservation r
            WHERE r.id_recipe = dr.id 
            AND r.id_contening = dr.id_contening
            AND r.expires_at > NOW()
        ), 
        dr.total_quantity
    ) as available_quantity
FROM detailed_recipes dr;