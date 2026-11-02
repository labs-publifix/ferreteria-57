# Directorio de socios comerciales (Club 57)

Directorio de comercios de Querétaro con dos niveles de acceso: el público ve
quiénes son y los miembros activos de Club 57 ven cómo contactarlos.

## Puesta en marcha

1. Correr en el SQL Editor de Supabase la migración
   `supabase/migrations/20261102010000_club57_directorio_socios.sql`
   (idempotente: se puede correr más de una vez).
2. Correr el seed `supabase/seed/directorio-socios.sql` (24 socios del archivo
   `Directorio_Socios_Comerciales_normalizado.xlsx`). También es idempotente:
   re-ejecutarlo no duplica socios ni pisa lo editado en el admin.
3. Si el Excel cambia, regenerar el CSV y el SQL con `npm run seed:directorio`.

## Dónde está cada cosa

| Pantalla | Ruta | Quién |
|---|---|---|
| Teaser en el home | `/` (después de Club 57; solo con 4 o más socios publicados) | Todos |
| Directorio público | `/directorio` (buscador, filtro por giro, paginación de 12) | Todos |
| Socios Comerciales | `/cuenta?tab=socios` | Miembros activos |
| Admin | `/admin/lealtad/socios` (+ `nuevo`, `[id]`, `giros`, `importar`) | Admin y operador |

## Protección de los datos de contacto

- El público solo lee la vista `club57_partners_publicos`: id, nombre
  comercial, slug, giro, logo, municipio y colonia. Teléfono, correo,
  dirección, contacto y notas no existen en esa vista; la tabla
  `club57_partners` no tiene ninguna política para anon ni para miembros.
- Los miembros leen con `club57_directorio_miembros()`, que valida la
  membresía en la base y solo trae el contacto de los socios con
  consentimiento.
- `/cuenta` solo llama a esa función cuando la sesión es de un miembro
  activo; para cualquier otra sesión no se pide nada.
- Las notas internas solo se leen en el admin (RLS `is_admin()`).

## Decisiones conservadoras (documentadas)

- **Miembro activo** = la misma definición del programa: una fila en
  `club57_members` para el usuario de la sesión, con la cuenta sin
  desactivar (`banned_until`). Función `is_active_club57_member()`.
- **Consentimiento (LFPDPPP).** Los datos de contacto solo se comparten con
  miembros si el socio autorizó (`consentimiento_datos` + fecha). El Excel
  indica que esa autorización está pendiente, así que **el seed carga los 24
  socios sin consentimiento**: los miembros los ven, pero sin teléfono,
  correo ni dirección, con el aviso «Estamos confirmando con este socio la
  autorización…». Se marca en la edición del socio o en la carga masiva
  (columna `CONSENTIMIENTO` = SI, con «Actualizar» en los duplicados).
- **Giro «Por definir».** El socio queda sin giro, visible en el admin con el
  aviso «pendiente de completar», y no se publica hasta asignarle uno.
- **Eliminar** es soft delete (`eliminado_at`), restaurable desde el filtro
  «Eliminados». El borrado físico solo lo hace el admin completo y solo de un
  socio que ya está en «Eliminados».
- **Desactivar un giro** deja de publicar a sus socios (la vista solo une giros
  activos); el admin lo confirma antes.
- **Carga masiva, actualización de duplicados:** una celda vacía nunca borra un
  dato guardado; solo se actualiza lo que la fila trae.
- **LOGO_URL** se descarga en el servidor solo por https, sin redirecciones, a
  un host con IP pública, con tiempo límite y máximo 2 MB; si falla, el socio
  se queda con el avatar de iniciales y el resumen lo indica.
- **Logos:** PNG, JPG, WebP o SVG de hasta 2 MB, validados por la firma del
  archivo; los SVG con scripts o eventos se rechazan. PNG/JPG/WebP se dejan
  cuadrados (512 px) en el navegador, recortando al centro o ajustando el logo
  completo con margen. La subida va por `/api/admin/lealtad/socios/[id]/logo`
  (las Server Actions se cortan en 1 MB).
- **SEO del home:** se agregó el JSON-LD del teaser (solo campos públicos) sin
  cambiar el title ni la description del home, que ya están orientados a
  Ferretería 57 en Querétaro.
