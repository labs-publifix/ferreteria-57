# Club 57 Empresarial — guía de piloto y operación

Programa para que los colaboradores de una empresa compren en la tienda en línea con **cargo a su empresa**. La empresa se los descuenta vía nómina y paga a Ferretería 57 un **corte mensual**.

## Quién hace qué

| Quién | Dónde | Qué hace |
|---|---|---|
| Ferretería 57 (admin y operador) | Panel → Club 57 → Empresas | Aprueba solicitudes, define el convenio, da acceso al responsable, cierra cortes, responde observaciones, registra factura y pago, suspende o reactiva |
| Responsable de la empresa (normalmente RH) | `/empresa` (Portal Empresa) | Aprueba colaboradores y su línea, autoriza pedidos, confirma cada nómina, revisa y da conformidad al estado de cuenta |
| Colaborador | `/cuenta` → pestaña **Empresarial** y checkout | Se vincula con el código, compra con «Cargo a mi empresa», ve su crédito, sus pedidos y sus descuentos |

## 1. Antes del piloto (checklist técnico)

- [ ] Migraciones corridas en Supabase, en orden:
  - `20261127010000_club57_empresarial_empresas.sql`
  - `20261128010000_club57_empresarial_empleados.sql`
  - `20261129010000_club57_empresarial_pedidos.sql`
  - `20261130010000_club57_empresarial_nomina.sql`
  - `20261201010000_club57_empresarial_cortes.sql`
  - `20261202010000_club57_empresarial_puntos_empresa.sql`
- [ ] En Supabase → Storage existe el bucket **privado** `club57-facturas` (lo crea la última migración).
- [ ] Tarea diaria activa: `vercel.json` llama a `/api/cron/club57-avisos` todos los días a las 9:00 (CDMX). En Vercel debe existir `CRON_SECRET`.
- [ ] `APP_BASE_URL` (o la URL del sitio) apunta al dominio de producción: los enlaces de los correos la usan.
- [ ] `EMAIL_OVERRIDE` **no** está definida en producción. Solo se usa para pruebas: manda todos los correos a una sola bandeja.
- [ ] Textos legales validados por el abogado: términos del programa, aviso de privacidad y la autorización del colaborador para el descuento vía nómina. El texto actual de la autorización está en `lib/club57/empresas/empleados.ts` (`textoAutorizacion`).

## 2. Ensayo interno (antes de la empresa real)

Haz el recorrido completo con **cuentas del equipo**, nunca con clientes reales. Así ningún correo llega a alguien de fuera.

1. En `/club57/empresarial` envía una solicitud de una empresa de prueba. El responsable debe ser un correo del equipo.
2. En el panel completa el convenio con un límite bajo (por ejemplo $5,000) y 2 descuentos por compra. Luego **Aprobar y activar** y **Dar acceso**.
3. Con el correo del responsable crea la contraseña y entra a `/empresa`.
4. Con otra cuenta del equipo regístrate en `/cuenta?registro=1` marcando «Tengo código de empresa».
5. En el portal aprueba al colaborador con su línea.
6. Como colaborador, compra un producto barato eligiendo **«Cargo a mi empresa»**.
7. En el portal autoriza el pedido. Revisa que:
   - aparezca en Panel → Pedidos como «Autorizado · Cargo a empresa»;
   - en **Nómina** se vean sus descuentos;
   - en **Mi cuenta** se vea el crédito.
8. En la ficha de la empresa pulsa **Cerrar corte ahora**. En el portal descarga el PDF y los Excel y da tu conformidad.
9. Registra una factura de prueba con PDF y XML pequeños y comprueba que se descargan desde el portal. Después registra el pago.
10. En el portal, pestaña **Puntos**, confirma que los puntos de la empresa quedaron disponibles y canjea un artículo de prueba. Márcalo como entregado en Lealtad → Canjes. Luego da de baja la empresa de prueba.

## 3. Alta de la empresa piloto

1. La empresa llena la solicitud en `/club57/empresarial`, o Ferretería 57 la da de alta en **Nueva empresa**.
2. **Convenio** (ficha de la empresa):
   - límite de crédito;
   - día de corte;
   - plazo de pago (días después de la factura);
   - plazo para autorizar pedidos (días hábiles);
   - si exige número de empleado;
   - frecuencia de nómina;
   - descuentos por compra;
   - línea general sugerida (% del salario).
3. **Aprobar y activar:** se genera el código de la empresa (por ejemplo `F57-ACME-7K2Q`).
4. **Dar acceso:** el responsable recibe un correo para crear su contraseña.
5. El responsable comparte el código desde su portal (copiar, WhatsApp o correo). También puede **precargar** a su personal con el Excel de la plantilla: quien coincida por correo o número queda aprobado solo.

## 4. Operación del día a día

### Todos los días (automático, 9:00)

La tarea diaria:

- cancela los pedidos que la empresa no autorizó a tiempo y le manda un resumen de lo pendiente;
- aplica las nóminas que no se confirmaron en 3 días hábiles y avisa de las que vienen en 3 días;
- cierra los cortes cuyo día de corte ya pasó y avisa que el estado de cuenta está listo;
- da conformidad tácita a los cortes sin observaciones después de 3 días hábiles;
- suspende a las empresas con pago vencido y avisa al responsable y a cada colaborador.

### Ferretería 57

- **Pedidos:** filtro **Pago → Club 57 Empresarial**.
  - Un pedido «En espera de autorización» **no se prepara** y solo se puede cancelar.
  - Al autorizarse se prepara igual que cualquier pedido. No se cobra al entregar: **pide identificación**.
- **Cortes y facturación** (Panel → Empresas → Cortes y facturación):
  - **En revisión:** responder observaciones. Si un pedido no corresponde, cancélalo en Pedidos antes de facturar.
  - **Por facturar:** emitir la factura por los medios habituales con base en el estado de cuenta y registrarla (folio, fecha, monto, PDF y XML).
  - **Por cobrar / Vencidos:** registrar el pago. La empresa se reactiva sola si estaba suspendida por ese pago.
- **Canjes de puntos de empresas** (Panel → Club 57 → Canjes, sección «Canjes de empresas»): preparar el artículo, entregarlo en tienda y marcarlo como entregado. Si se cancela, los puntos regresan a la empresa.

### Empresa (responsable)

- **Pedidos:** autorizar o rechazar con motivo (uno por uno o en bloque).
- **Nómina:** descargar el Excel antes de cada fecha de pago. Después confirmar lo que se descontó: «Se aplicó», «Monto distinto» o «No se aplicó». Lo que falte pasa a la siguiente nómina del colaborador.
- **Estados de cuenta:** dar conformidad u observar un pedido. Pagar la factura antes de la fecha límite.
- **Empleados:** aprobar, ajustar la línea y dar de baja. En las bajas, el saldo pendiente queda indicado para el finiquito.
- **Puntos:** ver el saldo de puntos de la empresa y canjearlos por artículos del catálogo de canje.

## 5. Reglas clave

- **Línea del colaborador:** un % del salario neto o un monto fijo. Nunca más del 100 % del salario. El salario solo lo ve la empresa.
- **Crédito revolvente:** cada compra se reparte en N descuentos de nómina. El crédito del colaborador se libera con cada descuento aplicado.
- **Crédito de la empresa con Ferretería 57:** suman los pedidos en espera y los autorizados cuyo corte no se ha pagado. Se libera al registrar el pago.
- **Puntos Club 57:**
  - Las compras con «Cargo a mi empresa» suman puntos **a favor de la empresa**, no del colaborador.
  - Se generan como pendientes al autorizarse el pedido y se liberan cuando se paga su corte. Si el pedido se cancela, se revierten.
  - La empresa solo los usa para canjear artículos del catálogo de canje: nunca como saldo a favor, y no puede cederlos a sus colaboradores.
  - Las compras que el colaborador paga con tarjeta suman a su propia cuenta de Club 57, como cualquier miembro. Una baja no le quita sus puntos.
- **Cancelaciones:**
  - En espera: el colaborador, la empresa o la tienda la cancelan; el stock y el crédito regresan.
  - Autorizado y antes de facturar: sale del estado de cuenta.
  - Después de facturar: el estado de cuenta no cambia y queda saldo a favor de la empresa en el siguiente corte.
- **Bajas:**
  - Colaborador: sus pedidos en espera se cancelan; lo autorizado se queda en el corte.
  - Empresa: sus pedidos en espera se cancelan.

## 6. Correos del programa

| Evento | Destinatario |
|---|---|
| Solicitud de afiliación recibida | Ferretería 57 y el solicitante |
| Acceso al portal (con el código) | Responsable |
| Colaborador pide vincularse | Responsable |
| Colaborador aprobado (bienvenida, cómo comprar y aviso de WhatsApp) / rechazado / baja | Colaborador |
| Pedido en espera de autorización | Colaborador y responsable |
| Recordatorio diario de pedidos pendientes y vencidos | Responsable |
| Pedido autorizado (con su plan de descuentos) | Colaborador y Ferretería 57 |
| Pedido rechazado, vencido o cancelado | Colaborador |
| Nómina próxima (con el Excel) | Responsable |
| Estado de cuenta listo | Responsable y Ferretería 57 |
| Factura registrada / pago registrado (con los puntos liberados de la empresa) | Responsable |
| Canje de puntos de la empresa | Ferretería 57 y responsable |
| Empresa suspendida (por pago vencido o desde el panel), reactivada o dada de baja | Responsable y colaboradores activos |

## 7. «¿No encuentras tu producto?»

Aparece:

- en la búsqueda sin resultados o con menos de 6;
- al final de cada categoría;
- en la pestaña Empresarial;
- en el correo de bienvenida del colaborador.

Abre WhatsApp al número de la tienda (442 778 2708) con el mensaje ya escrito: lo que buscó la persona, la categoría o su empresa. Con eso, Ferretería 57 da de alta el producto y el colaborador lo compra con «Cargo a mi empresa».

## 8. Criterios para cerrar el piloto

- Al menos un ciclo completo:
  - pedidos autorizados y entregados;
  - una nómina confirmada;
  - un corte conciliado, facturado y pagado.
- Sin diferencias entre el estado de cuenta y la factura.
- Comentarios de la empresa y de los colaboradores recogidos.
- Textos legales publicados antes de abrir el programa a más empresas.
