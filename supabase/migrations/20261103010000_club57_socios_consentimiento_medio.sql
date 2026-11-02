-- Club 57 — Directorio de socios: trazabilidad de la autorización de datos.
--
-- Además de la fecha (consentimiento_fecha), cada autorización guarda:
--   - consentimiento_medio: cómo autorizó el socio (firma en papel,
--     WhatsApp, correo, formulario, verbal u otro).
--   - consentimiento_registrado_por: quién del personal la registró.
-- Al retirar la autorización se limpian los tres datos.
--
-- El medio es opcional en la base (los socios marcados antes de esta
-- migración no lo tienen); el panel lo pide al registrar una autorización
-- nueva, individual o por selección múltiple.
--
-- Requiere 20261102010000_club57_directorio_socios.sql. Idempotente.

alter table public.club57_partners
  add column if not exists consentimiento_medio text,
  add column if not exists consentimiento_registrado_por uuid references public.profiles (id) on delete set null;

alter table public.club57_partners drop constraint if exists club57_partners_consentimiento_medio_check;
alter table public.club57_partners
  add constraint club57_partners_consentimiento_medio_check check (
    consentimiento_medio is null
    or (consentimiento_datos and consentimiento_medio in ('firma', 'whatsapp', 'correo', 'formulario', 'verbal', 'otro'))
  );

alter table public.club57_partners drop constraint if exists club57_partners_consentimiento_registro_check;
alter table public.club57_partners
  add constraint club57_partners_consentimiento_registro_check check (
    consentimiento_datos or consentimiento_registrado_por is null
  );

create index if not exists club57_partners_consentimiento_idx on public.club57_partners (consentimiento_datos);
