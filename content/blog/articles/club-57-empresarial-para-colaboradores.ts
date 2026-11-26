import { defineArticle } from "@/lib/blog/article-schema";

// B60 · Corto · Marca y Club 57 · Artículo especial (fuera del calendario).
// Para colaboradores de empresas con convenio: cómo afiliarse, cómo comprar
// con «Cargo a mi empresa», cómo se descuenta de la nómina y qué pasa con
// los puntos. Sin cifras: la línea, los descuentos y los plazos los define
// cada empresa en su convenio y se ven en la cuenta del colaborador.
export default defineArticle({
  topicId: "B60",
  slug: "club-57-empresarial-para-colaboradores",
  title: "Club 57 Empresarial para colaboradores: cómo afiliarte y comprar con cargo a tu empresa",
  seoTitle: "Club 57 Empresarial para colaboradores: cómo afiliarte",
  metaDescription:
    "Si tu empresa tiene convenio con Club 57 Empresarial, compra herramienta y material sin pagar al momento y págalo vía nómina. Así te afilias.",
  keyword: "club 57 empresarial para colaboradores",
  secondaryKeywords: [
    "comprar con cargo a mi empresa",
    "descuento vía nómina",
    "prestación para empleados",
    "código de empresa club 57",
  ],
  cluster: "marca-y-club-57",
  pillar: false,
  publishAt: "2026-11-26T08:00:00-06:00",
  updatedAt: "2026-11-26T08:00:00-06:00",
  intro:
    "**Club 57 Empresarial para colaboradores** es el beneficio que tienes si tu empresa firmó un convenio con Ferretería 57: compras herramienta y material en la tienda en línea **sin pagar en el momento** y el importe se descuenta de tu nómina, repartido en varios pagos. Para empezar solo necesitas el código de tu empresa y tu cuenta de Club 57. Aquí te explicamos cómo afiliarte, cómo hacer tu primera compra con «Cargo a mi empresa», cómo funcionan los descuentos y qué pasa con tus puntos.",
  blocks: [
    { type: "h2", text: "Qué es Club 57 Empresarial para colaboradores" },
    {
      type: "p",
      text: "Es una prestación que tu empresa te ofrece junto con Ferretería 57. Tienes una **línea de crédito** que define tu empresa y la usas para comprar en la tienda en línea eligiendo «Cargo a mi empresa». No necesitas tarjeta ni efectivo: tu empresa autoriza el pedido, lo descuenta de tu nómina y le paga a la tienda. Pagas el mismo precio de la tienda, solo que repartido en tus descuentos.",
    },
    {
      type: "p",
      text: "Sigues siendo miembro de [[B10|club 57 ferretería 57]] con todos tus beneficios: si un día prefieres pagar con tarjeta, esa compra suma puntos a tu cuenta como siempre.",
    },

    { type: "h2", text: "Cómo afiliarte en cuatro pasos" },
    {
      type: "steps",
      items: [
        {
          title: "Pide el código de tu empresa",
          text: "Recursos Humanos o el responsable del programa te lo comparte por WhatsApp o correo.",
        },
        {
          title: "Regístrate o entra a tu cuenta",
          text: "Si aún no tienes cuenta, entra a [tu cuenta](/cuenta), elige crear una y marca «Tengo código de empresa». Si ya eres miembro, escribe el código en la pestaña Empresarial.",
        },
        {
          title: "Da tu autorización",
          text: "Aceptas que tu empresa vea los pedidos que hagas con cargo a ella y que te descuente su importe vía nómina. Si tu empresa lo pide, también escribes tu número de empleado.",
        },
        {
          title: "Espera tu aprobación",
          text: "Tu empresa revisa tu solicitud, te asigna tu línea de crédito y te avisamos por correo. Si tu empresa ya te había registrado con su lista de personal, quedas aprobado al momento.",
        },
      ],
    },
    { type: "cta" },

    { type: "h2", text: "Cómo comprar con cargo a tu empresa" },
    {
      type: "ol",
      items: [
        "Agrega tus productos al carrito, desde [herramienta](/categoria/herramienta) hasta [pintura](/categoria/pintura) o [plomería](/categoria/plomeria).",
        "Al pagar, elige **«Cargo a mi empresa»**. Ahí mismo ves tu crédito disponible.",
        "Tu pedido queda **en espera de autorización**. Mientras espera, puedes cancelarlo desde tu cuenta.",
        "Cuando tu empresa lo autoriza, te llega un correo con las fechas de tus descuentos y la tienda prepara tu pedido.",
        "Lo recoges en la tienda o te lo enviamos. Al entregarlo solo te pedimos identificación: no pagas nada en caja.",
      ],
    },
    {
      type: "p",
      text: "Si tu empresa no autoriza un pedido en el plazo de su convenio, o lo rechaza, se cancela solo y te avisamos. El crédito que había apartado vuelve a tu línea.",
    },

    { type: "h2", text: "Cómo se descuenta de tu nómina" },
    {
      type: "p",
      text: "Cada compra se reparte en el número de descuentos que acordó tu empresa y se aplica en tus fechas de pago. Tu crédito es **revolvente**: con cada descuento aplicado, esa parte vuelve a tu línea, así que no tienes que esperar a terminar de pagar para volver a comprar.",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Ejemplo",
      text: "Compras con cargo a tu empresa y tu compra se reparte en dos descuentos. Al autorizarse, se aparta de tu crédito; en tu primera nómina se aplica la primera mitad y esa parte vuelve a tu línea; con el segundo descuento recuperas tu línea completa.",
    },
    {
      type: "p",
      text: "En la pestaña **Empresarial** de tu cuenta ves tu crédito disponible, tus pedidos con cargo a tu empresa y lo que falta por descontar, con su fecha. Si en una nómina el descuento no se aplicó completo, lo que falta pasa a la siguiente.",
    },

    { type: "h2", text: "Tus puntos Club 57" },
    {
      type: "p",
      text: "Las compras con «Cargo a mi empresa» suman puntos Club 57 **a favor de tu empresa**, no de tu cuenta. En cambio, todo lo que pagas con tarjeta sigue sumando puntos a tu propia cuenta de Club 57, y esos puntos son tuyos aunque algún día dejes la empresa.",
    },

    { type: "h2", text: "Ideas para aprovechar el beneficio" },
    {
      type: "ul",
      items: [
        "**Arreglos en casa:** lo que hace falta para el mantenimiento de tu hogar, sin esperar a juntar.",
        "**Ese proyecto pendiente:** el material para empezarlo ya y pagarlo en tus quincenas.",
        "**Herramienta para tu oficio:** si quieres armar o completar tu equipo, revisa el [[B02|kit básico de herramientas para el hogar]].",
        "**Lo que no encuentres:** el botón «¿No encuentras tu producto?» abre WhatsApp con la tienda y el mensaje ya escrito; lo damos de alta y lo compras con «Cargo a mi empresa».",
      ],
    },
    {
      type: "p",
      text: "¿Eres de Recursos Humanos o tu empresa todavía no tiene convenio? En [[B59|club 57 empresarial]] explicamos cómo funciona el programa para empresas.",
    },
  ],
  faq: [
    {
      q: "¿Cómo me afilio a Club 57 Empresarial?",
      a: "Pide a Recursos Humanos el código de tu empresa. Regístrate en Mi cuenta del sitio marcando «Tengo código de empresa», o escribe el código en la pestaña Empresarial si ya eres miembro. Aceptas la autorización de descuento vía nómina y, cuando tu empresa te aprueba y asigna tu línea, te avisamos por correo.",
    },
    {
      q: "¿Cuánto puedo comprar con cargo a mi empresa?",
      a: "Hasta tu línea de crédito, que define tu empresa: puede ser un porcentaje de tu salario o un monto fijo, y nunca pasa del total de tu salario. Tu crédito disponible aparece al pagar y en la pestaña Empresarial de tu cuenta, y se recupera con cada descuento aplicado en tu nómina.",
    },
    {
      q: "¿Puedo cancelar un pedido con cargo a mi empresa?",
      a: "Sí. Mientras el pedido está en espera de autorización puedes cancelarlo desde tu cuenta y el crédito vuelve a tu línea. Una vez que tu empresa lo autoriza, para cualquier cambio habla con Recursos Humanos o escríbenos por WhatsApp.",
    },
    {
      q: "¿Qué pasa si dejo la empresa?",
      a: "Tus pedidos que aún esperaban autorización se cancelan y ya no podrás elegir «Cargo a mi empresa». Lo que falte por descontar queda indicado para tu finiquito. Tu cuenta de Club 57 sigue activa, con los puntos de tus compras con tarjeta.",
    },
  ],
  guia: { titulo: "Guía para colaboradores: cómo afiliarte a Club 57 Empresarial" },
  relatedTopicIds: ["B59", "B10", "B02"],
});
