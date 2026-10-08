# Roadmap de desarrollo — Ferretería 57

Pendientes acordados con el cliente. Solo planeación: nada de esto está en
desarrollo todavía. Actualizado: 7 de octubre de 2026.

## En curso: Blog (5 fases)

- **Fase 1 — backlog en /admin/blog (vista de lectura).** Tabla
  `blog_topics`, seed del lote 1 (58 temas), estado derivado y
  descartar/restaurar.
- Fases 2–5: blog público, artículos, guías PDF y programación automática.

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
