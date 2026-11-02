import { defineArticle } from "@/lib/blog/article-schema";

// B10 · Corto · Marca y Club 57. Regla de redacción del brief: los valores
// de Club 57 (cuánto se compra por punto, días de espera, puntos por
// referido) se configuran en el panel y pueden cambiar, así que aquí no se
// escribe ninguna cifra: el artículo explica cómo funciona y remite a la
// cuenta del miembro, donde cada compra muestra sus puntos y su fecha.
export default defineArticle({
  topicId: "B10",
  slug: "club-57-como-ganar-puntos-ferreteria-57",
  title: "Club 57: cómo funciona, cómo ganar puntos y qué recibes al registrarte",
  seoTitle: "Club 57 · Ferretería 57: cómo ganar puntos y beneficios",
  metaDescription:
    "Conoce Club 57, el programa de lealtad de Ferretería 57: cómo ganar puntos, referir amigos, descargar guías prácticas y acceder a promociones.",
  keyword: "club 57 ferretería 57",
  secondaryKeywords: [
    "programa de lealtad ferretería",
    "puntos ferretería querétaro",
    "guías descargables de ferretería",
    "promociones truper",
  ],
  cluster: "marca-y-club-57",
  pillar: false,
  publishAt: "2026-10-15T08:00:00-06:00",
  updatedAt: "2026-10-15T08:00:00-06:00",
  intro:
    "**Club 57 (Ferretería 57)** es el programa de lealtad gratuito de la tienda: te registras una vez, en línea o en el mostrador, y desde ese momento tus compras suman puntos que después cambias por artículos del catálogo de canje. Además, como miembro descargas gratis las guías prácticas en PDF de cada artículo del blog, ves las promociones exclusivas y ganas puntos extra cuando recomiendas a alguien. Aquí te explicamos cómo registrarte, cómo se ganan y se usan los puntos, y qué encuentras en tu cuenta.",
  blocks: [
    { type: "h2", text: "Qué es Club 57 (Ferretería 57)" },
    {
      type: "p",
      text: "Club 57 es la forma en que Ferretería 57 agradece a quienes compran seguido. No tiene costo ni tarjeta física: todo vive en tu cuenta del sitio, donde ves tu saldo de puntos, tu historial de compras y puntos, el catálogo de canje y las guías y promociones para miembros.",
    },
    {
      type: "p",
      text: "Funciona igual si compras en línea o en la tienda de Querétaro, así que no importa por dónde lo hagas: lo que cuenta es que la compra quede registrada a tu nombre.",
    },

    { type: "h2", text: "Cómo registrarte (en línea o en tienda)" },
    {
      type: "steps",
      items: [
        {
          title: "En línea",
          text: "Entra a [tu cuenta](/cuenta), elige «Crear cuenta» y escribe tu nombre, tu correo y una contraseña. Si alguien te recomendó, agrega su código de referido en el campo opcional. Al terminar ya eres miembro.",
        },
        {
          title: "En la tienda",
          text: "Pide en el mostrador que te den de alta en Club 57. El vendedor captura tu nombre, correo y teléfono y te entrega una contraseña temporal para entrar a tu cuenta. Después puedes cambiarla desde tu perfil.",
        },
        {
          title: "Entra a tu cuenta",
          text: "Con tu correo y contraseña inicias sesión en el sitio. Ahí aparece tu código de referido, tu saldo y tus guías.",
        },
      ],
    },
    { type: "cta" },

    { type: "h2", text: "Cómo ganar puntos y cuándo puedes canjearlos" },
    {
      type: "p",
      text: "Ganas puntos de dos formas: con tus **compras en línea**, cuando el pago queda confirmado (se calculan sobre el subtotal, sin el costo de envío), y con tus **compras en tienda**, cuando el vendedor las registra en tu cuenta. Por eso, al pagar en el mostrador, menciona que eres miembro de Club 57.",
    },
    {
      type: "p",
      text: "Los puntos de cada compra entran primero como **pendientes** y, después de unos días, pasan a **disponibles**. En la pestaña «Historial de compras y puntos» de tu cuenta ves cuántos puntos te dio cada compra y la fecha en que se liberan. La cantidad de puntos por compra y los días de espera son los vigentes en el programa y siempre se muestran en tu cuenta.",
    },
    {
      type: "p",
      text: "Con los puntos disponibles entras al **catálogo de canje**, eliges un artículo y lo recoges en la tienda. Al canjear, los puntos se descuentan al momento. Ten presente que los artículos canjeados no tienen devolución ni cambio, como explican los [términos y condiciones](/terminos).",
    },
    {
      type: "callout",
      variant: "nota",
      title: "Si una compra se cancela o se corrige",
      text: "Cuando una compra se devuelve, se cambia o se corrige, los puntos que generó se ajustan y en tu historial verás el movimiento con su motivo. Si esos puntos ya los habías usado, tu saldo puede quedar negativo por un tiempo y se compensa con tus siguientes compras.",
    },

    { type: "h2", text: "Recomienda a un amigo: puntos para los dos" },
    {
      type: "p",
      text: "En tu cuenta tienes un **código de referido**. Compártelo con familiares, vecinos o compañeros de obra: cuando alguien se registra con tu código y hace su primera compra, **los dos reciben puntos de bono**. Tu amigo puede escribir el código al crear su cuenta en línea o dárselo al vendedor al registrarse en la tienda.",
    },

    { type: "h2", text: "Guías prácticas en PDF: una por cada artículo del blog" },
    {
      type: "p",
      text: "Cada artículo del blog trae una **guía descargable** con lo esencial para tenerlo a la mano en la obra o en el taller: tablas, listas de verificación y pasos. Son gratuitas para miembros; solo inicia sesión y descárgala desde el artículo. Las que ya descargaste quedan en «Mis guías», dentro de tu cuenta.",
    },
    {
      type: "p",
      text: "Por ejemplo, la guía de [[B02|herramientas básicas para el hogar]] te da la lista para armar tu kit; la de [[B04|diferencia entre tubería ppr y pvc]] resume qué material usar en cada instalación, y la del [[B05|calibre de cable para casa]] te ayuda a elegir el cable correcto para cada aparato.",
    },

    { type: "h2", text: "Promociones solo para miembros" },
    {
      type: "p",
      text: "En tu cuenta aparecen tres tipos de promociones, cada una con su PDF descargable mientras está vigente:",
    },
    {
      type: "ul",
      items: [
        "**Promo Truper:** ofertas en productos Truper. Si no sabes cuál línea te conviene, revisa nuestra guía de [[B01|marcas truper]].",
        "**Promociones de Temporada:** ofertas pensadas para cada temporada del año.",
        "**Liquidaciones del Mes:** piezas limitadas a precio especial hasta agotar existencias.",
      ],
    },
    {
      type: "p",
      text: "Las promociones cambian a lo largo del año; la fecha de vigencia de cada una aparece en su tarjeta, así que vale la pena revisar tu cuenta de vez en cuando.",
    },
  ],
  faq: [
    {
      q: "¿Cómo me registro en Club 57?",
      a: "Puedes hacerlo en línea, desde la sección Mi cuenta del sitio, con tu nombre, correo y una contraseña; o en la tienda de Querétaro, donde el vendedor te da de alta y te entrega una contraseña temporal. En ambos casos el registro es gratuito y, si alguien te recomendó, puedes agregar su código de referido.",
    },
    {
      q: "¿Cómo se ganan puntos en Club 57?",
      a: "Con tus compras en línea, cuando se confirma el pago, y con tus compras en tienda, cuando el vendedor las registra en tu cuenta. Los puntos entran como pendientes y después de unos días pasan a disponibles. En tu historial ves cuántos puntos te dio cada compra y cuándo se liberan, y también ganas puntos de bono al recomendar a alguien.",
    },
    {
      q: "¿Qué beneficios tienen los miembros de Club 57?",
      a: "Los miembros ganan puntos con cada compra y los cambian por artículos del catálogo de canje que se recogen en tienda. También descargan gratis las guías prácticas en PDF de los artículos del blog, ven las promociones exclusivas (Promo Truper, Promociones de Temporada y Liquidaciones del Mes) y reciben puntos de bono al recomendar a un amigo.",
    },
  ],
  guia: { titulo: "Guía de bienvenida a Club 57" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B01", "B02", "B04", "B05", "B27"],
});
