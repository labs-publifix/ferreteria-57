import { defineArticle } from "@/lib/blog/article-schema";

// B59 · Fondo · Marca y Club 57 · Artículo especial (fuera del calendario).
// Para empresas: qué es Club 57 Empresarial, sus beneficios y cómo funciona
// del convenio al pago. Regla de redacción: las condiciones del convenio
// (límite, plazos, descuentos) se pactan con cada empresa y los valores de
// Club 57 se configuran en el panel, así que no se escribe ninguna cifra ni
// precio; todo se explica con estados y se remite al convenio y al portal.
export default defineArticle({
  topicId: "B59",
  slug: "club-57-empresarial-prestacion-para-empresas",
  title: "Club 57 Empresarial: la prestación para que tus colaboradores compren herramienta y material",
  seoTitle: "Club 57 Empresarial: prestación para tus colaboradores",
  metaDescription:
    "Con Club 57 Empresarial tus colaboradores compran herramienta y material con cargo a tu empresa y lo pagan vía nómina. Así funciona el programa.",
  keyword: "club 57 empresarial",
  secondaryKeywords: [
    "prestación para empleados",
    "compras con descuento vía nómina",
    "crédito para colaboradores",
    "beneficios para empleados querétaro",
  ],
  cluster: "marca-y-club-57",
  pillar: false,
  publishAt: "2026-11-26T08:00:00-06:00",
  updatedAt: "2026-11-26T08:00:00-06:00",
  intro:
    "**Club 57 Empresarial** es el programa de Ferretería 57 para que los colaboradores de una empresa compren herramienta y material en la tienda en línea **con cargo a su empresa**, sin pagar en el momento. La empresa autoriza cada pedido, lo recupera vía nómina en los descuentos que acuerde y paga a Ferretería 57 una sola factura al mes. Es una prestación que tu equipo usa en su casa y en su trabajo, y que Recursos Humanos controla desde un portal propio. Aquí te explicamos qué gana tu empresa, cómo funciona paso a paso y cómo unirte.",
  blocks: [
    { type: "h2", text: "Qué es Club 57 Empresarial" },
    {
      type: "p",
      text: "Es una vertiente de [[B10|club 57 ferretería 57]], el programa de lealtad de la tienda, pensada para empresas. Ferretería 57 firma un **convenio** con tu empresa y, a partir de ahí, tus colaboradores pueden elegir «Cargo a mi empresa» como forma de pago en la tienda en línea. Ellos no usan tarjeta ni efectivo: el importe se descuenta de su nómina en los pagos que tu empresa decida.",
    },
    {
      type: "p",
      text: "Para Ferretería 57 el cliente es la empresa. Por eso nada se compra sin tu autorización, el crédito tiene un límite que tú acuerdas y todo lo que tu equipo compra en el mes llega en un solo estado de cuenta, listo para revisar antes de facturarse. Los precios son los mismos de la tienda en línea.",
    },

    { type: "h2", text: "Beneficios de Club 57 Empresarial para tu empresa" },
    {
      type: "table",
      caption: "Qué gana tu empresa con el programa",
      headers: ["Beneficio", "Qué significa en la práctica"],
      rows: [
        ["**Una prestación que se usa**", "Herramienta y material para arreglos en casa, proyectos pendientes o el oficio de cada colaborador."],
        ["**Tú apruebas**", "Decides quién participa y autorizas cada pedido antes de que se prepare."],
        ["**Tú pones los límites**", "Una línea de crédito por colaborador y un límite total para tu empresa."],
        ["**Una factura al mes**", "Todas las compras del equipo en un solo estado de cuenta, con su detalle en Excel."],
        ["**Excel para nómina**", "Antes de cada fecha de pago descargas los descuentos de cada colaborador."],
        ["**Puntos para tu empresa**", "Las compras con cargo a tu empresa suman puntos Club 57 que tu empresa canjea en el catálogo."],
      ],
    },
    {
      type: "p",
      text: "Y para tus colaboradores el beneficio es directo: se llevan hoy lo que necesitan, lo pagan poco a poco y ven en su cuenta cuánto crédito les queda. Les contamos todo en [[B60|club 57 empresarial para colaboradores]], un artículo que puedes compartir con tu equipo.",
    },
    { type: "cta" },

    { type: "h2", text: "Cómo funciona, paso a paso" },
    {
      type: "steps",
      items: [
        {
          title: "Convenio",
          text: "Acordamos el límite de crédito de tu empresa, el día de corte, el plazo de pago, los días hábiles que tienes para autorizar pedidos, tu frecuencia de nómina y en cuántos descuentos se reparte cada compra.",
        },
        {
          title: "Acceso al Portal Empresa",
          text: "Al activarse el convenio recibes el código de tu empresa y la persona responsable (normalmente Recursos Humanos) recibe un correo para crear su contraseña y entrar al portal.",
        },
        {
          title: "Invitas a tu equipo",
          text: "Compartes el código por WhatsApp o correo desde el portal. También puedes precargar a tu personal con la plantilla de Excel: quien coincida por correo o número de empleado queda aprobado al registrarse.",
        },
        {
          title: "Apruebas a cada colaborador",
          text: "Defines su línea: un porcentaje de su salario neto o un monto fijo. El salario solo lo ve tu empresa y la línea nunca pasa del total del salario.",
        },
        {
          title: "Compran y autorizas",
          text: "El colaborador elige «Cargo a mi empresa» al pagar. El pedido queda en espera y tú lo autorizas o lo rechazas con motivo, uno por uno o varios a la vez. Si no lo autorizas en el plazo del convenio, se cancela solo.",
        },
        {
          title: "Descuentas vía nómina",
          text: "Antes de cada fecha de pago descargas el Excel de descuentos y, después, confirmas lo que se aplicó. Lo que falte pasa a la siguiente nómina del colaborador.",
        },
      ],
    },
    {
      type: "p",
      text: "Un pedido autorizado se prepara como cualquier otro: el colaborador lo recoge en la tienda o se le envía. Al entregarlo, Ferretería 57 pide identificación y no se cobra nada en caja.",
    },

    { type: "h2", text: "Control total para Recursos Humanos" },
    {
      type: "p",
      text: "El Portal Empresa reúne todo lo que necesitas para administrar la prestación sin hojas sueltas ni llamadas:",
    },
    {
      type: "ul",
      items: [
        "**Empleados:** apruebas solicitudes, ajustas la línea de cada colaborador y das de baja. En una baja, el saldo pendiente queda indicado para el finiquito.",
        "**Pedidos:** ves lo que está en espera de autorización y el historial de lo que autorizaste o rechazaste. Además recibes un resumen diario de lo pendiente.",
        "**Nómina:** el Excel de descuentos de cada fecha de pago y la confirmación de lo aplicado: «Se aplicó», «Monto distinto» o «No se aplicó».",
        "**Estados de cuenta:** tu corte en PDF y Excel, la factura en PDF y XML y tu crédito disponible con Ferretería 57.",
        "**Puntos:** el saldo de puntos de tu empresa y el catálogo de canje.",
      ],
    },
    {
      type: "p",
      text: "El crédito de cada colaborador es **revolvente**: cada compra se reparte en los descuentos que acordaste y, con cada descuento aplicado, esa parte de su línea vuelve a estar disponible. Así no tienen que esperar a terminar de pagar para volver a comprar, y tu empresa nunca presta más de lo que definió.",
    },
    {
      type: "callout",
      variant: "nota",
      title: "Cada colaborador da su autorización",
      text: "Al vincularse con el código, el colaborador acepta que tu empresa vea los pedidos que haga con cargo a ella y que le descuente su importe vía nómina. Lo que paga con tarjeta sigue siendo solo suyo.",
    },

    { type: "h2", text: "El corte mensual y la factura" },
    {
      type: "p",
      text: "Cada mes, en el día de corte del convenio, todas las compras autorizadas se juntan en un **estado de cuenta**. Lo descargas en PDF y en Excel y tienes unos días hábiles para dar tu conformidad u observar algún pedido; si no hay observaciones en ese plazo, el corte se da por conforme. Con eso Ferretería 57 emite la factura por sus medios habituales y la puedes descargar en PDF y XML desde tu portal.",
    },
    {
      type: "p",
      text: "Pagas dentro del plazo acordado y, al registrarse tu pago, se libera tu crédito con Ferretería 57. Si un pago se vence, las compras con cargo a tu empresa se pausan y se reactivan solas en cuanto se registra el pago.",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Si un pedido no corresponde",
      text: "Obsérvalo durante la revisión: si se cancela antes de facturar, sale del estado de cuenta. Si se cancela después de facturado, el estado de cuenta ya no cambia y queda como saldo a favor de tu empresa en el siguiente corte.",
    },

    { type: "h2", text: "Puntos Club 57 a favor de tu empresa" },
    {
      type: "p",
      text: "Las compras que tu equipo hace con cargo a tu empresa suman **puntos Club 57 para tu empresa**. Entran como pendientes al autorizarse cada pedido y quedan disponibles cuando pagas el corte del mes; si un pedido se cancela, sus puntos se revierten.",
    },
    {
      type: "p",
      text: "Tu empresa usa esos puntos para canjear artículos del catálogo de canje desde la pestaña Puntos del portal y los recoge en la tienda. No se convierten en saldo a favor ni se pueden ceder a los colaboradores. Por su parte, lo que cada colaborador paga con tarjeta sigue sumando a su propia cuenta de Club 57, como cualquier miembro.",
    },

    { type: "h2", text: "Cómo unir a tu empresa a Club 57 Empresarial" },
    {
      type: "steps",
      items: [
        {
          title: "Llena la solicitud",
          text: "En la página de [Club 57 Empresarial](/club57/empresarial) captura los datos de tu empresa y de la persona responsable del programa.",
        },
        {
          title: "Definimos el convenio",
          text: "Ferretería 57 se pone en contacto para acordar el límite de crédito, el día de corte, los plazos y la forma de descuento.",
        },
        {
          title: "Arranca tu equipo",
          text: "Recibes el acceso al portal y el código de tu empresa. Lo compartes, apruebas a tus colaboradores y empiezan a comprar.",
        },
      ],
    },
    {
      type: "p",
      text: "Mientras tanto, tu equipo puede conocer el catálogo: desde [herramienta](/categoria/herramienta) y [plomería](/categoria/plomeria) hasta [pintura](/categoria/pintura) y [material eléctrico](/categoria/electrico). Si algo no aparece, el botón «¿No encuentras tu producto?» abre WhatsApp con la tienda para pedirlo.",
    },
  ],
  faq: [
    {
      q: "¿Qué es Club 57 Empresarial?",
      a: "Es el programa de Ferretería 57 para que los colaboradores de una empresa compren herramienta y material en la tienda en línea con cargo a su empresa. La empresa autoriza cada pedido, lo descuenta vía nómina en los pagos que acuerde y paga a Ferretería 57 una sola factura al mes. Todo se administra desde el Portal Empresa.",
    },
    {
      q: "¿Cómo controla mi empresa lo que compran los colaboradores?",
      a: "Con varios candados: tu empresa aprueba a cada colaborador y define su línea de crédito, autoriza cada pedido antes de que se prepare y tiene un límite total con Ferretería 57. Además revisa el estado de cuenta de cada mes antes de que se facture y puede observar cualquier pedido que no corresponda.",
    },
    {
      q: "¿Cómo se descuenta de la nómina?",
      a: "Cada compra se reparte en los descuentos que tu empresa acordó en el convenio. Antes de cada fecha de pago descargas desde el portal un Excel con lo que hay que descontar a cada colaborador y, después, confirmas lo que se aplicó. Si un descuento no se aplicó completo, lo que falta pasa a su siguiente nómina.",
    },
    {
      q: "¿Quién se queda con los puntos Club 57 de estas compras?",
      a: "Los puntos de las compras con cargo a la empresa son de la empresa. Quedan disponibles al pagar cada corte y la empresa los canjea por artículos del catálogo de canje; no se convierten en saldo a favor ni se ceden a los colaboradores. Lo que cada colaborador paga con tarjeta suma a su propia cuenta de Club 57.",
    },
  ],
  guia: { titulo: "Guía para empresas: cómo funciona Club 57 Empresarial" },
  relatedTopicIds: ["B60", "B10", "B02"],
});
