import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B08 · Pilar · Pintura, sellado e impermeabilización. Regla de redacción del
// brief: conocimiento general estable; sin marcas de pintura (ninguna ajena al
// catálogo); los largos de felpa se remiten a la etiqueta del rodillo. Tabla
// de decisión de 3 columnas (superficie / pintura / herramienta) y aclaración
// base agua vs base solvente con ventilación. Lanzamiento: se publica al
// terminarse.
export default defineArticle({
  topicId: "B08",
  slug: "brocha-o-rodillo-segun-pintura-vinilica-esmalte",
  title: "Brocha o rodillo: qué necesitas según la pintura (vinílica vs esmalte)",
  seoTitle: "Brocha o rodillo: cuál usar con pintura vinílica o esmalte",
  metaDescription:
    "Elige la brocha o rodillo correcto según uses pintura vinílica o esmalte, el tipo de superficie y el acabado que buscas. Guía práctica.",
  keyword: "brocha o rodillo",
  secondaryKeywords: [
    "qué rodillo usar para pintar paredes",
    "brocha para esmalte",
    "diferencia pintura vinílica y esmalte",
    "rodillo de felpa o espuma",
    "cómo pintar una pared",
  ],
  cluster: "pintura-sellado-e-impermeabilizacion",
  pillar: true,
  publishAt: "2026-10-09T12:30:00-06:00",
  updatedAt: "2026-10-09T12:30:00-06:00",
  intro:
    "¿**Brocha o rodillo**? La respuesta corta: el rodillo es para superficies grandes, como muros y plafones, y la brocha es para orillas, esquinas, marcos, rejas y piezas pequeñas. Pero la herramienta correcta también depende de la pintura. Con pintura vinílica, que es base agua, conviene un rodillo de felpa y una brocha de cerdas sintéticas; con esmalte, que suele ser base solvente, conviene un rodillo de felpa corta o de espuma y una brocha de cerdas naturales. En esta guía te explicamos la diferencia entre las dos pinturas, cómo elegir rodillo y brocha, qué accesorios completan el trabajo y los errores que arruinan el acabado.",
  blocks: [
    { type: "h2", text: "Vinílica vs esmalte: qué es cada una y dónde se usa" },
    {
      type: "p",
      text: "Antes de elegir herramienta hay que saber qué pintura vas a usar, porque cada una se comporta distinto al aplicarla, al secar y al limpiar.",
    },
    { type: "h3", text: "Pintura vinílica" },
    {
      type: "p",
      text: "Es la pintura más usada en casa. Es **base agua**: se diluye y se limpia con agua, tiene poco olor y seca relativamente rápido. Se usa sobre todo en muros y plafones, de interior o de exterior según lo que indique la etiqueta. Su acabado suele ser mate o satinado.",
    },
    { type: "h3", text: "Esmalte" },
    {
      type: "p",
      text: "Es una pintura que forma una capa más dura y resistente al lavado, a los golpes y a la humedad. Por eso se usa en **herrería, puertas, ventanas, muebles de madera, rejas y zonas de mucho uso**. Su acabado suele ser brillante o semibrillante. La mayoría de los esmaltes tradicionales son **base solvente**: se diluyen y se limpian con el solvente que indica su etiqueta, huelen fuerte y tardan más en secar. También hay esmaltes base agua; la etiqueta lo dice.",
    },
    {
      type: "table",
      caption: "Diferencia entre pintura vinílica y esmalte",
      headers: ["Rasgo", "Vinílica", "Esmalte"],
      rows: [
        ["Base", "Agua", "Generalmente solvente (también los hay base agua)"],
        ["Dónde se usa", "Muros y plafones", "Metal, madera, puertas, rejas, zonas de mucho uso"],
        ["Acabado", "Mate o satinado", "Brillante o semibrillante, más duro"],
        ["Olor", "Bajo", "Fuerte en los base solvente"],
        ["Limpieza de herramienta", "Agua y jabón", "El solvente que indica la etiqueta"],
        ["Secado", "Más rápido", "Más lento"],
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Ventila siempre con base solvente",
      text: "Al pintar con esmalte o cualquier producto base solvente, abre puertas y ventanas, no pintes cerca de flama ni de aparatos encendidos y usa guantes y lentes. Guarda los trapos y solventes lejos del calor. Con vinílica también conviene ventilar, aunque el olor sea menor.",
    },

    { type: "h2", text: "Rodillos: felpa corta, media y larga, y espuma" },
    {
      type: "p",
      text: "El rodillo es la herramienta para cubrir superficies grandes de forma pareja y rápida. Lo que más importa al elegirlo es el **largo de la felpa**, porque define cuánta pintura carga y qué tan bien entra en los poros de la superficie. Cada fabricante indica en la etiqueta el largo de felpa y la superficie para la que está hecho; como regla general:",
    },
    {
      type: "ul",
      items: [
        "**Felpa corta:** para superficies lisas, como muros con aplanado fino, puertas o muebles. Deja un acabado fino y es la indicada para esmaltes en superficies grandes.",
        "**Felpa media:** la de uso general para muros con textura ligera. Es la más común para pintura vinílica en interiores.",
        "**Felpa larga:** para superficies rugosas, como block, aplanados rústicos, fachadas o bardas. Carga más pintura y llega al fondo de la textura.",
        "**Espuma:** para superficies lisas y pequeñas con esmalte, como puertas, tablas o muebles. Deja un acabado muy liso, pero en muros grandes con vinílica puede dejar burbujas.",
      ],
    },
    {
      type: "p",
      text: "Además del rodillo grande, un **mini rodillo** es muy útil para puertas, marcos anchos y espacios estrechos, como detrás de un mueble o del escusado.",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Cómo saber qué rodillo usar para pintar paredes",
      text: "Pasa la mano por el muro. Si se siente liso, usa felpa corta o media; si se siente rugoso o con textura marcada, usa felpa larga. En caso de duda, la felpa media es la más versátil para paredes con vinílica.",
    },
    { type: "cta" },

    { type: "h2", text: "Brochas: cerdas naturales vs sintéticas y anchos" },
    {
      type: "p",
      text: "La brocha sirve para lo que el rodillo no alcanza: recortar orillas y esquinas, pintar marcos, molduras, rejas, herrería y piezas pequeñas. Hay dos tipos de cerdas y cada una va mejor con una pintura:",
    },
    {
      type: "ul",
      items: [
        "**Cerdas sintéticas (nylon o poliéster):** son las indicadas para pintura vinílica y otras pinturas base agua. No absorben el agua, mantienen la forma y dejan un trazo parejo.",
        "**Cerdas naturales:** son las tradicionales para esmalte base solvente. Retienen bien la pintura y la extienden sin marcar. Con pintura base agua tienden a abrirse y a perder la forma.",
      ],
    },
    {
      type: "p",
      text: "El **ancho** viene marcado en el mango y se elige según la pieza: una brocha angosta para marcos, molduras y detalles; una mediana para puertas, rejas y recortes en muros; y una ancha para superficies planas que no se pueden pintar con rodillo. Una brocha de punta inclinada (sesgada) facilita recortar en línea recta junto al techo o a los marcos.",
    },
    {
      type: "p",
      text: "Una brocha de buena calidad no suelta pelos, tiene las cerdas bien sujetas al casquillo y termina en punta pareja. En la familia Truper encuentras brochas, rodillos y accesorios para pintar en distintos niveles de precio; en nuestra guía de [[B01|marcas truper]] te explicamos cómo elegir entre las marcas según cuánto la vas a usar.",
    },

    { type: "h2", text: "Tabla: brocha o rodillo según superficie y pintura" },
    {
      type: "p",
      text: "Esta tabla resume la decisión. Busca tu superficie, la pintura que vas a usar y la herramienta que conviene:",
    },
    {
      type: "table",
      caption: "Superficie + pintura → herramienta recomendada",
      headers: ["Superficie", "Pintura", "Herramienta recomendada"],
      rows: [
        ["Muro interior liso", "Vinílica", "Rodillo de felpa corta o media + brocha sintética para recortar"],
        ["Muro con textura o aplanado rústico", "Vinílica", "Rodillo de felpa larga + brocha sintética"],
        ["Plafón", "Vinílica", "Rodillo de felpa media con extensión + brocha sintética para orillas"],
        ["Fachada o barda de block", "Vinílica para exterior", "Rodillo de felpa larga con extensión + brocha ancha sintética"],
        ["Puerta de madera", "Esmalte", "Mini rodillo de espuma o felpa corta + brocha de cerdas naturales"],
        ["Herrería, rejas y protecciones", "Esmalte", "Brocha de cerdas naturales; mini rodillo en partes planas"],
        ["Mueble o tabla pequeña", "Esmalte", "Rodillo de espuma + brocha de cerdas naturales angosta"],
        ["Marcos, molduras y zoclos", "Vinílica o esmalte", "Brocha angosta del tipo de cerda que corresponda a la pintura"],
      ],
    },
    {
      type: "p",
      text: "Si la superficie tiene salitre o humedad, la herramienta no va a salvar el acabado: primero hay que resolver el problema. En nuestra guía sobre el [[B06|salitre en paredes]] te explicamos cómo limpiarlo y sellarlo antes de pintar.",
    },

    { type: "h2", text: "Accesorios que completan el trabajo" },
    {
      type: "p",
      text: "Con brocha y rodillo no basta. Estos accesorios hacen el trabajo más rápido, más limpio y con mejor acabado:",
    },
    {
      type: "ul",
      items: [
        "**Charola para pintura:** para cargar el rodillo de forma pareja. Su zona inclinada sirve para escurrir el exceso.",
        "**Extensión para rodillo:** para plafones y muros altos sin subir y bajar de la escalera a cada rato.",
        "**Cinta de enmascarar (masking):** protege marcos, contactos, zoclos y vidrios para lograr líneas limpias.",
        "**Plástico o cartón para cubrir:** para pisos y muebles.",
        "**Espátula y lija:** para resanar hoyos, quitar pintura suelta y emparejar la superficie antes de pintar.",
        "**Cubeta, palo para mezclar y trapo:** para mezclar bien la pintura y limpiar escurrimientos al momento.",
        "**Guantes y lentes:** sobre todo al pintar plafones y al trabajar con esmaltes y solventes.",
      ],
    },
    {
      type: "p",
      text: "Encuentra pinturas, brochas y accesorios en nuestra categoría de [pintura](" +
        catalogHref("pintura") +
        "), o busca directamente [brocha](/buscar?q=brocha), [rodillo](/buscar?q=rodillo), [charola para pintura](/buscar?q=charola) y [cinta masking](/buscar?q=cinta%20masking).",
    },

    { type: "h2", text: "Sellador, primario y número de manos" },
    {
      type: "p",
      text: "La herramienta correcta luce más cuando la superficie está bien preparada. En muros nuevos, resanados o muy porosos, un **sellador** antes de la vinílica ayuda a que la pintura no se absorba de forma dispareja y rinda más. En metal, un **primario anticorrosivo** antes del esmalte protege contra el óxido y mejora la adherencia; en madera nueva, el fabricante del esmalte suele indicar qué fondo usar. Cada producto dice en su etiqueta sobre qué superficie va y cuánto tiempo esperar antes de la siguiente capa.",
    },
    {
      type: "p",
      text: "En cuanto al número de manos, lo normal es dar **dos capas delgadas** en lugar de una gruesa: se seca mejor, cubre más parejo y no escurre. Si cambias un color oscuro por uno claro, puede hacer falta una tercera mano o un sellador de fondo. Usa la misma herramienta en todas las capas para que la textura del acabado sea igual en todo el muro.",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Antes de estrenar un rodillo",
      text: "Pasa una cinta adhesiva por la felpa o lávalo con agua y déjalo secar antes de usarlo: así se desprenden las pelusas sueltas y no terminan pegadas en el muro. Haz lo mismo con una brocha nueva, sacudiéndola y pasando los dedos entre las cerdas.",
    },

    { type: "h2", text: "Cómo pintar una pared paso a paso" },
    {
      type: "steps",
      items: [
        { title: "Prepara la superficie", text: "Retira polvo, grasa y pintura suelta. Resana hoyos y grietas, deja secar y lija lo que quede disparejo." },
        { title: "Protege lo que no vas a pintar", text: "Cubre pisos y muebles, y pon cinta de enmascarar en marcos, zoclos y contactos." },
        { title: "Mezcla la pintura", text: "Revuélvela bien y, si hace falta diluir, hazlo solo en la proporción que indica la etiqueta." },
        { title: "Recorta con brocha", text: "Pinta primero una franja en las orillas, esquinas y junto al techo y los marcos, donde el rodillo no llega." },
        { title: "Pasa el rodillo", text: "Carga el rodillo, escúrrelo en la charola y pinta en tramos, cubriendo el muro en franjas que se encimen un poco. Trabaja mientras la orilla anterior sigue fresca para que no queden marcas." },
        { title: "Respeta el tiempo entre capas", text: "Deja secar el tiempo que indica la etiqueta antes de la segunda mano. Retira la cinta cuando la última capa todavía esté un poco fresca para que no se desprenda la pintura." },
      ],
    },

    { type: "h2", text: "Errores que arruinan el acabado" },
    {
      type: "ul",
      items: [
        "**No preparar la superficie.** Pintar sobre polvo, grasa, salitre o pintura suelta hace que la nueva capa se desprenda.",
        "**Usar la brocha equivocada.** Una brocha de cerdas naturales con vinílica se abre y deja marcas; una sintética con esmalte base solvente puede maltratarse.",
        "**Cargar demasiado el rodillo.** Provoca escurrimientos y salpicaduras. Escúrrelo siempre en la charola.",
        "**Presionar demasiado.** El rodillo deja marcas en las orillas; deja que la felpa haga el trabajo.",
        "**No recortar primero.** Si recortas al final, las orillas quedan con otro tono o textura.",
        "**Dar la segunda mano antes de tiempo.** La capa de abajo se levanta o queda pegajosa.",
        "**Pintar con poca luz o al sol directo.** Con poca luz no ves las fallas; con sol fuerte la pintura seca demasiado rápido y quedan marcas.",
        "**Dejar secar la herramienta con pintura.** Lava brochas y rodillos al terminar: con agua si usaste vinílica y con el solvente indicado si usaste esmalte.",
      ],
    },
    {
      type: "p",
      text: "Si tienes dudas sobre qué herramienta conviene para tu proyecto, cuéntanos qué vas a pintar y con qué pintura en el mostrador de Ferretería 57, y te ayudamos a armar la lista completa.",
    },
  ],
  faq: [
    {
      q: "¿Qué rodillo se usa para pintura vinílica?",
      a: "Para pintura vinílica en muros se usa un rodillo de felpa. En paredes lisas o con textura ligera, la felpa corta o media es la más común; en superficies rugosas, como block o aplanado rústico, conviene felpa larga. El largo exacto de felpa y la superficie para la que sirve vienen en la etiqueta del rodillo. Para orillas y esquinas, complementa con una brocha de cerdas sintéticas.",
    },
    {
      q: "¿Qué brocha es mejor para esmalte?",
      a: "Para esmalte base solvente, la brocha tradicional es la de cerdas naturales: retiene bien la pintura y la extiende sin dejar marcas. Si el esmalte es base agua, conviene una brocha de cerdas sintéticas. El ancho depende de la pieza: angosta para marcos y molduras, mediana para puertas y rejas. Al terminar, límpiala con el solvente que indique la etiqueta del esmalte.",
    },
    {
      q: "¿Cuál es la diferencia entre pintura vinílica y esmalte?",
      a: "La vinílica es base agua, tiene poco olor, seca rápido y se usa sobre todo en muros y plafones, con acabado mate o satinado. El esmalte forma una capa más dura y resistente al lavado y a la humedad, con acabado brillante o semibrillante, y se usa en metal, madera, puertas y rejas. La mayoría de los esmaltes son base solvente, huelen más y piden buena ventilación.",
    },
    {
      q: "¿Rodillo de felpa o de espuma?",
      a: "El rodillo de felpa es el indicado para muros y plafones, sobre todo con pintura vinílica, porque carga más pintura y se adapta a la textura. El rodillo de espuma deja un acabado muy liso y funciona mejor con esmalte en superficies lisas y pequeñas, como puertas, tablas o muebles. En muros grandes con vinílica, la espuma puede dejar burbujas.",
    },
  ],
  guia: { titulo: "Guía rápida: qué herramienta usar según tu pintura" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B01", "B06", "B24", "B30", "B31", "B02"],
});
