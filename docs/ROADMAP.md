# Roadmap de desarrollo — Ferretería 57

Pendientes acordados con el cliente. Solo planeación: nada de esto está en
desarrollo todavía. Actualizado: 7 de octubre de 2026.

## En curso: Blog (5 fases)

- **Fase 1 — backlog en /admin/blog (vista de lectura).** Tabla
  `blog_topics`, seed del lote 1 (58 temas), estado derivado y
  descartar/restaurar.
- **Fase 2 — blog público.** /blog, categorías, artículo con índice y CTA
  de la guía (Club 57), SEO completo (JSON-LD, sitemap, RSS, OG), sección
  en el home y artículo piloto B03 (programado; fecha real en Fase 5).
- **Fase 3 — publicación programada y calidad.** Reloj inyectable
  (`BLOG_NOW_OVERRIDE`, solo fuera de producción), RSS dinámico, noindex sin
  publicados, `blog:check` (prebuild + CI), `blog:links` con el mapa de
  enlaces, `blog:new` y enlaces reales al catálogo. Sin cron ni avisos.
- **Fase 4 — guías PDF y flujo editorial.** `blog:next` (Excel + repo),
  guía por artículo (`content/blog/guides`, PDF de marca generado al
  descargar), descarga solo para miembros con límite por hora y registro en
  `blog_guide_downloads`, «Mis guías» en /cuenta, vista previa para admin,
  `blog:pdf`, `blog:verify` y la skill `blog-articulo`. Guía piloto de B03.
- Fase 5: artículos de lanzamiento (B01–B08) con sus guías y fechas reales.

## Pendientes del cliente

1. **Recuperación de contraseña para el admin.** Hoy no existe un flujo de
   "olvidé mi contraseña" en `/admin/login` (el de clientes en `/cuenta` sí
   existe y ya funciona con `verifyOtp` / token_hash).
2. **Descuentos en lote por categoría con vigencia por calendario.** Aplicar
   un descuento a todos los productos de una o varias categorías, con fecha
   de inicio y fin elegidas en un calendario, y que al terminar el periodo
   los precios regresen solos a su valor normal.
3. **Sección pública "Promociones de Temporada" (e-commerce).** No tiene
   relación con las promociones de Club 57. Se administra desde el admin:
   - elegir productos ("jalar" productos) y asignarles descuento;
   - mostrarlos en una vista propia con un punto de entrada desde el home;
   - el precio con descuento debe verse igual en todo el sitio (tarjetas,
     ficha de producto, carrito, checkout, correos de pedido);
   - no debe romper la integración con Mercado Pago (el monto cobrado debe
     coincidir con el precio con descuento).
   - Nota técnica: conviene diseñarla junto con el punto 2, con una sola
     fuente de verdad del "precio vigente" para no duplicar reglas.

## Mejoras técnicas detectadas (aviso por email de Club 57)

- **Rebotes y quejas.** Registrar con un webhook del proveedor de correo los
  correos que rebotan o se marcan como spam y excluirlos de los avisos.
- **Destino después del login.** Llevar al miembro directo a "Promociones
  para miembros" al entrar desde el correo (hoy llega a `/cuenta` y debe
  bajar hasta esa sección).
- **Logo en correos de pedidos y canjes.** Hoy va incrustado en el correo
  (base64) y Gmail suele bloquearlo; servirlo desde el sitio, como ya lo
  hacen los avisos de Club 57.
- **Indicador "Hoy se enviaron X de Y".** Incluir también los correos
  transaccionales en el conteo del panel (el envío ya respeta el uso real
  de la cuenta; solo falta reflejarlo en la UI).
