-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- Tabla de Árboles
create table public.arboles (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  descripcion text,
  imagen text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Personas
create table public.personas (
  id uuid primary key default uuid_generate_v4(),
  arbol_id uuid not null references public.arboles(id) on delete cascade,
  nombres text,
  apellidos text not null,
  foto text,
  cedula text,
  fecha_nacimiento date,
  lugar_nacimiento text,
  fecha_fallecimiento date,
  lugar_fallecimiento text,
  telefono text,
  celular text,
  email text,
  biografia text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Relaciones
create table public.relaciones (
  id uuid primary key default uuid_generate_v4(),
  arbol_id uuid not null references public.arboles(id) on delete cascade,
  persona_id_1 uuid not null references public.personas(id) on delete cascade,
  persona_id_2 uuid not null references public.personas(id) on delete cascade,
  tipo_relacion text not null check (tipo_relacion in ('padre', 'madre', 'hijo', 'hija', 'esposo', 'esposa', 'hermano', 'hermana')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table public.arboles enable row level security;
alter table public.personas enable row level security;
alter table public.relaciones enable row level security;

-- Políticas de lectura (Públicas - Acceso Anónimo)
create policy "Permitir lectura pública de arboles" on public.arboles for select using (true);
create policy "Permitir lectura pública de personas" on public.personas for select using (true);
create policy "Permitir lectura pública de relaciones" on public.relaciones for select using (true);

-- Políticas de escritura (Protegidas - Solo usuarios autenticados)
-- Se requiere que el usuario esté logueado (role = 'authenticated')
create policy "Permitir escritura a usuarios autenticados en arboles" on public.arboles for all using (auth.role() = 'authenticated');
create policy "Permitir escritura a usuarios autenticados en personas" on public.personas for all using (auth.role() = 'authenticated');
create policy "Permitir escritura a usuarios autenticados en relaciones" on public.relaciones for all using (auth.role() = 'authenticated');
