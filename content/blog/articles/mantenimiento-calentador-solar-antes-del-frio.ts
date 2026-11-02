import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B14 · Fin de semana · Plomería y agua. Regla de redacción del brief:
// conocimiento general; intervalos y procedimientos exactos se remiten al
// manual del equipo, sin cifras. Trabajo en azotea con advertencias de
// caídas y quemaduras, y cuándo llamar a un técnico. Contexto del Bajío
// solo cualitativo. Sin marcas: categorías y búsquedas.
export default defineArticle({
  topicId: "B14",
  slug: "mantenimiento-calentador-solar-antes-del-frio",
  title: "Mantenimiento preventivo del calentador solar antes de la temporada de frío",
  seoTitle: "Mantenimiento calentador solar: qué revisar antes del frío",
  metaDescription:
    "Revisa y da mantenimiento a tu calentador solar antes de la temporada de frío: limpieza, fugas, sarro, válvulas y accesorios que conviene cambiar.",
  keyword: "mantenimiento calentador solar",
  secondaryKeywords: [
    "limpiar calentador solar",
    "calentador solar no calienta",
    "ánodo de sacrificio",
    "válvula de alivio calentador solar",
    "revisión calentador solar invierno",
  ],
  cluster: "plomeria-y-agua",
  pillar: false,
  publishAt: "2026-10-24T08:00:00-06:00",
  updatedAt: "2026-10-24T08:00:00-06:00",
  intro:
    "**Mantenimiento calentador solar** antes del frío: es una revisión sencilla que puedes hacer en una mañana para limpiar los tubos o el colector, buscar fugas y tubos dañados, revisar el aislamiento de la tubería, purgar el sarro y comprobar que las válvulas funcionen. La temporada de frío es justo cuando más agua caliente vas a necesitar y cuando el sol calienta menos horas, así que cualquier falla se nota más. Aquí te explicamos qué revisar, qué piezas se desgastan, qué es el ánodo de sacrificio y cómo trabajar en la azotea sin riesgos. Los intervalos y pasos exactos de tu equipo siempre los marca su manual.",
  blocks: [
    { type: "h2", text: "Mantenimiento calentador solar: por qué revisarlo antes del frío" },
    {
      type: "p",
      text: "En buena parte del Bajío los días siguen soleados en otoño e invierno, pero las mañanas y las noches son frías: el agua de la red llega más fría al calentador y en casa se usa más agua caliente. Un calentador con tubos sucios, una fuga pequeña o mucho sarro rinde menos justo cuando más lo necesitas.",
    },
    {
      type: "p",
      text: "Además, revisar a tiempo te deja conseguir con calma las piezas que se gastaron, en vez de buscarlas el día que te quedaste sin agua caliente.",
    },

    { type: "h2", text: "Revisión rápida: tubos o colectores, soportes y vidrios" },
    {
      type: "p",
      text: "La mayoría de los calentadores solares de casa son de **tubos de vidrio al vacío** con un termotanque arriba; otros usan un **colector plano**, una placa con vidrio. En ambos casos, revisa:",
    },
    {
      type: "ul",
      items: [
        "**Tubos rotos o estrellados:** un tubo dañado deja de calentar y puede tirar agua. En muchos tubos al vacío, la base plateada se vuelve blanca o lechosa cuando el tubo perdió el vacío; tu manual explica cómo identificarlo.",
        "**Polvo y suciedad:** el polvo de la temporada seca reduce el sol que llega al agua. Limpia con agua y un paño suave, sin químicos abrasivos, temprano en la mañana o al atardecer, cuando los vidrios están fríos.",
        "**Sellos de los tubos:** los anillos de hule donde el tubo entra al termotanque se resecan con el sol. Si ves goteo en esa unión, hay que cambiarlos.",
        "**Soportes y anclajes:** que no tengan óxido ni tornillos flojos y que el equipo siga firme. El viento y las lluvias del verano aflojan los anclajes.",
      ],
    },
    { type: "cta" },
    {
      type: "p",
      text: "La guía se descarga gratis siendo miembro. Si todavía no lo eres, te contamos cómo funciona [[B10|Club 57 de Ferretería 57]] y qué recibes al registrarte.",
    },

    { type: "h2", text: "Tuberías, aislamiento y fugas" },
    {
      type: "p",
      text: "El agua caliente pierde calor en el camino del termotanque a la regadera. Por eso la tubería de salida debe ir **forrada con aislante**, y ese aislante es lo primero que el sol destruye: se cuartea, se deshace o se cae.",
    },
    {
      type: "ul",
      items: [
        "Cambia el [aislante para tubería](/buscar?q=aislante) que esté roto o expuesto y protégelo del sol si queda a la intemperie.",
        "Busca manchas de humedad, goteo o sarro blanco en las conexiones: casi siempre indican una fuga pequeña.",
        "Confirma que la tubería de agua caliente sea del material correcto. El PVC hidráulico no es para agua caliente; si tienes dudas, revisa la [[B04|diferencia entre tubería ppr y pvc]] y cuál aguanta el calor.",
        "Las mangueras que conectan el calentador deben ser las indicadas para agua caliente, no mangueras comunes.",
        "Si vuelves a armar una conexión roscada, sella la rosca con [[B13|cinta teflón]] bien aplicada.",
      ],
    },

    { type: "h2", text: "Sarro: señales y cómo prevenirlo" },
    {
      type: "p",
      text: "El agua de muchas zonas del Bajío trae minerales que se acumulan dentro del termotanque y de los tubos como sarro. Con el tiempo, ese sarro ocupa espacio, aísla el agua del calor y tapa conexiones.",
    },
    {
      type: "ul",
      items: [
        "**Señales:** el agua sale menos caliente o se acaba antes, baja la presión, hay ruidos en el tanque o salen partículas blancas por la regadera.",
        "**Purga:** la mayoría de los termotanques tienen una válvula de drenado para sacar el agua con sedimento. Cuándo y cómo hacerlo lo indica el manual del equipo; hazlo con el agua fría, temprano.",
        "**Prevención:** filtrar el agua antes del tinaco y revisar el sarro en cada mantenimiento ayuda a que el equipo dure más.",
      ],
    },

    { type: "h2", text: "Válvulas, llaves de paso y accesorios que se desgastan" },
    {
      type: "table",
      caption: "Piezas que conviene revisar",
      headers: ["Pieza", "Qué revisar", "Señal de cambio"],
      rows: [
        ["Llaves de paso de entrada y salida", "Que abran y cierren completas", "Están duras, gotean o no cierran"],
        ["Válvula de alivio", "Que esté libre y sin goteo constante", "Gotea todo el tiempo o está trabada"],
        ["Válvula de drenado", "Que abra y vuelva a cerrar bien", "Gotea después de purgar"],
        ["Sellos de los tubos", "Unión del tubo con el termotanque", "Goteo, hule reseco o cuarteado"],
        ["Mangueras y conexiones", "Estado del material y de las roscas", "Agrietadas, endurecidas o con sarro"],
      ],
    },
    {
      type: "p",
      text: "La **válvula de alivio** es de seguridad: deja salir agua si la presión o la temperatura suben de más. Nunca la tapes ni la quites. Si gotea sin parar o está trabada, cámbiala por la que indique el fabricante. Encuentra [llaves de paso](/buscar?q=llave%20de%20paso), conexiones y [tubería PPR](/buscar?q=ppr) en la sección de [Plomería](" +
        catalogHref("plomeria") +
        ").",
    },

    { type: "h2", text: "Ánodo de sacrificio y cuándo cambiarlo" },
    {
      type: "p",
      text: "Muchos termotanques metálicos tienen un **ánodo de sacrificio**: una varilla de metal, normalmente de magnesio, que se gasta en lugar del tanque y lo protege de la corrosión. Cuando el ánodo se termina, el tanque empieza a oxidarse por dentro.",
    },
    {
      type: "p",
      text: "Cada cuánto se revisa depende del equipo y del agua: con agua dura se gasta más rápido. El manual indica dónde está y cuándo revisarlo. Para cambiarlo hay que vaciar el tanque, así que si no tienes experiencia es trabajo para un técnico; usa siempre el ánodo que corresponde a tu modelo.",
    },

    { type: "h2", text: "Seguridad al trabajar en azotea" },
    {
      type: "callout",
      variant: "seguridad",
      title: "Antes de subir",
      text: "No subas con lluvia, con viento ni con la azotea mojada. Usa una escalera firme, que alguien te la sostenga, y calzado antiderrapante. No te recargues ni te apoyes en los tubos de vidrio. Trabaja temprano: a mediodía el agua del termotanque y las conexiones pueden estar muy calientes y quemar.",
    },
    {
      type: "p",
      text: "Llama a un técnico si hay que cambiar un tubo o vaciar el termotanque, si el tanque gotea, si la válvula de alivio descarga sin parar o si tu equipo es presurizado. Y si el calentador solar trabaja junto con un boiler de gas, cualquier revisión de la parte de gas es exclusivamente para un técnico.",
    },
  ],
  faq: [
    {
      q: "¿Cada cuánto se da mantenimiento a un calentador solar?",
      a: "Conviene hacer una revisión general al menos una vez al año, de preferencia antes de la temporada de frío, y revisar los tubos después de granizadas o vientos fuertes. La purga del sarro y la revisión del ánodo tienen sus propios intervalos, que dependen del equipo y del agua; el manual del fabricante los indica.",
    },
    {
      q: "¿Por qué mi calentador solar no calienta bien?",
      a: "Las causas más comunes son tubos o colector sucios, un tubo roto o que perdió el vacío, mucho sarro dentro del termotanque, aislamiento dañado en la tubería de salida o una fuga. También influye que en temporada de frío el sol calienta menos horas. Revisa estos puntos y, si todo está bien, consulta a un técnico.",
    },
    {
      q: "¿Qué es el ánodo de sacrificio y cuándo se cambia?",
      a: "Es una varilla metálica dentro del termotanque que se desgasta en lugar del tanque para protegerlo de la corrosión. Se cambia cuando está muy consumida; cada cuánto revisarlo depende del equipo y de qué tan dura es el agua, y lo indica el manual. Como hay que vaciar el tanque, conviene que lo haga un técnico.",
    },
  ],
  guia: { titulo: "Calendario anual de mantenimiento del calentador solar" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B04", "B13", "B07", "B17", "B22", "B23"],
});
