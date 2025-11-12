-- Crear tabla roles_cliente si no existe
CREATE TABLE IF NOT EXISTS public.roles_cliente (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying(100) NOT NULL,
  descripcion text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT roles_cliente_pkey PRIMARY KEY (id),
  CONSTRAINT roles_cliente_nombre_key UNIQUE (nombre)
) TABLESPACE pg_default;

-- Insertar roles comunes si no existen
INSERT INTO public.roles_cliente (nombre, descripcion)
VALUES 
  ('Demandante', 'Cliente que inicia la demanda'),
  ('Demandado', 'Cliente que es demandado'),
  ('Actor', 'Cliente que ejerce la acción judicial'),
  ('Accionado', 'Cliente contra quien se dirige la acción'),
  ('Querellante', 'Cliente que presenta querella'),
  ('Querellado', 'Cliente contra quien se presenta la querella'),
  ('Apelante', 'Cliente que interpone apelación'),
  ('Apelado', 'Cliente contra quien se apela')
ON CONFLICT (nombre) DO NOTHING;
