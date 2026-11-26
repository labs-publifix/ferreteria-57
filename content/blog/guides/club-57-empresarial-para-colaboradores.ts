import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B60 (artículo especial para colaboradores): pág. 1, cómo
// afiliarse y qué tener a la mano; pág. 2, cómo comprar con «Cargo a mi
// empresa», cómo se descuenta de la nómina y qué pasa con los puntos.
// Sin cifras: la línea, los descuentos y los plazos los define cada empresa.
export default defineGuide({
  topicId: "B60",
  slug: "club-57-empresarial-para-colaboradores",
  titulo: "Guía para colaboradores: cómo afiliarte a Club 57 Empresarial",
  subtitulo: "Compra herramienta y material sin pagar al momento y págalo vía nómina, con el beneficio que te da tu empresa.",
  paginas: [
    {
      titulo: "Cómo afiliarte",
      intro: "Si tu empresa tiene convenio con Club 57 Empresarial, tienes una línea de crédito para comprar en la tienda en línea con «Cargo a mi empresa». El importe se descuenta de tu nómina en varios pagos.",
      bloques: [
        {
          type: "checklist",
          titulo: "Antes de empezar, ten a la mano",
          items: [
            "El código de tu empresa (te lo da Recursos Humanos).",
            "Tu correo y una contraseña para tu cuenta de Club 57.",
            "Tu número de empleado, si tu empresa lo pide.",
          ],
        },
        {
          type: "pasos",
          titulo: "Cuatro pasos",
          items: [
            { titulo: "Pide el código", texto: "Recursos Humanos o el responsable del programa te lo comparte por WhatsApp o correo." },
            {
              titulo: "Regístrate o entra a tu cuenta",
              texto: "En ferreteria57.com/cuenta crea tu cuenta y marca «Tengo código de empresa». Si ya eres miembro, escribe el código en la pestaña Empresarial.",
            },
            { titulo: "Da tu autorización", texto: "Aceptas que tu empresa vea los pedidos que hagas con cargo a ella y te los descuente vía nómina." },
            { titulo: "Espera tu aprobación", texto: "Tu empresa te asigna tu línea de crédito y te avisamos por correo. Desde ese momento ya puedes comprar." },
          ],
        },
        {
          type: "consejo",
          titulo: "Sigues siendo miembro de Club 57",
          texto: "Tu cuenta es la misma: tus guías, tus promociones y los puntos de tus compras con tarjeta siguen ahí.",
        },
      ],
    },
    {
      titulo: "Cómo comprar y cómo se paga",
      bloques: [
        {
          type: "pasos",
          titulo: "Tu compra con cargo a tu empresa",
          items: [
            { titulo: "Elige tus productos", texto: "Agrégalos al carrito en la tienda en línea." },
            { titulo: "Paga con «Cargo a mi empresa»", texto: "Ahí mismo ves tu crédito disponible." },
            { titulo: "Espera la autorización", texto: "Mientras tanto puedes cancelar el pedido desde tu cuenta. Al autorizarse te llega un correo con tus fechas de descuento." },
            { titulo: "Recoge o recibe", texto: "En tienda solo te piden identificación: no pagas nada en caja." },
          ],
        },
        {
          type: "tabla",
          titulo: "Qué ves en la pestaña Empresarial de tu cuenta",
          columnas: ["Dato", "Para qué te sirve"],
          anchos: [0.9, 1.5],
          filas: [
            ["Crédito disponible", "Saber cuánto puedes comprar hoy."],
            ["Pedidos con cargo a tu empresa", "Ver si cada pedido está en espera, autorizado o cancelado."],
            ["Por descontar vía nómina", "La fecha y el monto de cada descuento pendiente."],
          ],
        },
        {
          type: "callout",
          variante: "nota",
          titulo: "Tu crédito se recupera",
          texto: "Cada compra se reparte en los descuentos que acordó tu empresa. Con cada descuento aplicado, esa parte vuelve a tu línea.",
          mitad: true,
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Tus puntos",
          texto: "Las compras con «Cargo a mi empresa» suman puntos para tu empresa. Lo que pagas con tarjeta suma a tu cuenta y es tuyo.",
          mitad: true,
        },
      ],
    },
  ],
});
