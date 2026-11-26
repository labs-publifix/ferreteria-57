import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B59 (artículo especial para empresas): pág. 1, cómo funciona
// del convenio al pago; pág. 2, qué se define en el convenio y los controles
// de Recursos Humanos; pág. 3, la rutina de cada mes, los puntos de la
// empresa y cómo unirse. Sin cifras: las condiciones se pactan en el convenio.
export default defineGuide({
  topicId: "B59",
  slug: "club-57-empresarial-prestacion-para-empresas",
  titulo: "Guía para empresas: cómo funciona Club 57 Empresarial",
  subtitulo: "La prestación para que tus colaboradores compren herramienta y material con cargo a tu empresa y lo paguen vía nómina.",
  paginas: [
    {
      titulo: "Del convenio al pago",
      intro: "Tu empresa firma un convenio con Ferretería 57. Tus colaboradores compran en la tienda en línea con «Cargo a mi empresa», tú autorizas cada pedido, lo descuentas vía nómina y pagas una sola factura al mes.",
      bloques: [
        {
          type: "pasos",
          titulo: "Seis pasos",
          items: [
            { titulo: "Convenio", texto: "Acordamos límite de crédito, día de corte, plazo de pago, plazo para autorizar, frecuencia de nómina y descuentos por compra." },
            { titulo: "Acceso al portal", texto: "Recibes el código de tu empresa; el responsable crea su contraseña y entra al Portal Empresa." },
            { titulo: "Invitas a tu equipo", texto: "Compartes el código por WhatsApp o correo, o precargas a tu personal con la plantilla de Excel." },
            { titulo: "Apruebas a cada colaborador", texto: "Defines su línea: un porcentaje de su salario neto o un monto fijo. El salario solo lo ve tu empresa." },
            { titulo: "Compran y autorizas", texto: "Eligen «Cargo a mi empresa» al pagar; tú autorizas o rechazas cada pedido desde el portal." },
            { titulo: "Descuentas y pagas", texto: "Aplicas los descuentos con el Excel de nómina y pagas la factura del corte en el plazo acordado." },
          ],
        },
        {
          type: "consejo",
          titulo: "El cliente es la empresa",
          texto: "El colaborador no paga en caja: al entregar el pedido, la tienda solo pide identificación. Los precios son los mismos de la tienda en línea.",
        },
      ],
    },
    {
      titulo: "Convenio y controles",
      intro: "Las condiciones se pactan con cada empresa y quedan visibles en tu portal.",
      bloques: [
        {
          type: "tabla",
          titulo: "Qué se define en el convenio",
          columnas: ["Concepto", "Qué significa"],
          anchos: [0.8, 1.6],
          filas: [
            ["Límite de crédito", "Lo máximo que tu empresa puede deber a Ferretería 57 al mismo tiempo."],
            ["Día de corte", "El día del mes en que se cierra el estado de cuenta."],
            ["Plazo de pago", "Los días que tienes para pagar después de la factura."],
            ["Plazo para autorizar", "Los días hábiles para autorizar un pedido; si no, se cancela solo."],
            ["Frecuencia de nómina", "Semanal, quincenal o mensual: define cuándo se aplica cada descuento."],
            ["Descuentos por compra", "En cuántas nóminas se reparte cada compra."],
            ["Número de empleado", "Si tu empresa lo pide al vincularse (opcional)."],
          ],
        },
        {
          type: "checklist",
          titulo: "Controles de Recursos Humanos",
          items: [
            "Apruebas a cada colaborador antes de que pueda comprar.",
            "Su línea nunca pasa del total de su salario.",
            "Autorizas o rechazas cada pedido, uno por uno o en bloque.",
            "Revisas el estado de cuenta antes de que se facture.",
            "Das de baja al instante; el saldo pendiente queda indicado para el finiquito.",
            "Cada colaborador autoriza por escrito el descuento vía nómina.",
          ],
        },
      ],
    },
    {
      titulo: "Cada mes y los puntos de tu empresa",
      bloques: [
        {
          type: "pasos",
          titulo: "La rutina del mes",
          items: [
            { titulo: "Autoriza los pedidos", texto: "Recibes un resumen diario de lo que está en espera." },
            { titulo: "Antes de cada nómina", texto: "Descarga el Excel de descuentos y, después, confirma lo aplicado." },
            { titulo: "Día de corte", texto: "Revisa el estado de cuenta en PDF y Excel; da tu conformidad u observa un pedido." },
            { titulo: "Factura y pago", texto: "Descarga la factura en PDF y XML y paga en el plazo; se libera tu crédito." },
          ],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Puntos Club 57 de tu empresa",
          texto: "Las compras con cargo a tu empresa suman puntos para tu empresa: pendientes al autorizar, disponibles al pagar el corte. Se canjean por artículos del catálogo; no son saldo a favor ni se ceden a colaboradores.",
          mitad: true,
        },
        {
          type: "callout",
          variante: "nota",
          titulo: "Si un pago se vence",
          texto: "Las compras con cargo a tu empresa se pausan y se reactivan solas al registrarse el pago.",
          mitad: true,
        },
        {
          type: "pasos",
          titulo: "Cómo unirte",
          items: [
            { titulo: "Solicitud", texto: "Llénala en ferreteria57.com/club57/empresarial." },
            { titulo: "Convenio", texto: "Definimos juntos límites, día de corte y plazos." },
            { titulo: "Arranque", texto: "Recibes tu acceso y tu código para invitar a tu equipo." },
          ],
        },
      ],
    },
  ],
});
