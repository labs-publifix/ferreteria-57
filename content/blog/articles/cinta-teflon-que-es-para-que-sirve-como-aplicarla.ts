import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B13 · Corto · Plomería y agua. Regla de redacción del brief: conocimiento
// general; el número de vueltas no se da como cifra (se dice «varias
// vueltas» y se remite al empaque). La cinta para gas es un producto
// específico y las instalaciones de gas las revisa un técnico. Sin marcas.
export default defineArticle({
  topicId: "B13",
  slug: "cinta-teflon-que-es-para-que-sirve-como-aplicarla",
  title: "Cinta teflón: qué es, para qué sirve y cómo aplicarla correctamente",
  seoTitle: "Cinta teflón: para qué sirve y cómo se aplica bien",
  metaDescription:
    "Aprende qué es la cinta teflón, en qué roscas se usa, cuántas vueltas dar y los errores que provocan fugas. Guía visual de plomería básica.",
  keyword: "cinta teflón",
  secondaryKeywords: [
    "cómo poner cinta teflón",
    "para qué sirve la cinta de teflón",
    "cuántas vueltas de teflón",
    "cinta teflón para gas",
    "cinta teflón fuga",
  ],
  cluster: "plomeria-y-agua",
  pillar: false,
  publishAt: "2026-10-22T08:00:00-06:00",
  updatedAt: "2026-10-22T08:00:00-06:00",
  intro:
    "La **cinta teflón** es una cinta delgada que se enrolla en la rosca macho de una conexión para que selle sin fugas al apretarla. Sirve en roscas de agua, como las de una llave de paso, un niple o el brazo de la regadera, y no se usa en conexiones que sellan con empaque. Para que funcione hay que enrollarla en el mismo sentido en que se aprieta la rosca, con la cinta estirada y con las vueltas suficientes para cubrir los hilos sin que sobre. Aquí te explicamos qué hace, dónde sí y dónde no se usa, cómo aplicarla paso a paso y los errores que provocan fugas.",
  blocks: [
    { type: "h2", text: "Qué es la cinta teflón (PTFE) y qué hace" },
    {
      type: "p",
      text: "Está hecha de PTFE, el mismo material antiadherente de algunos sartenes. No es un pegamento: no une las piezas, las **sella**. Al apretar la conexión, la cinta se aplasta entre los hilos de la rosca y rellena los pequeños huecos por donde se escaparía el agua. Además lubrica la rosca, así que la conexión se aprieta más parejo y después es más fácil desarmarla.",
    },
    {
      type: "p",
      text: "Funciona en **roscas cónicas**, las que se van haciendo más angostas hacia la punta y quedan más firmes mientras más se aprietan. Son las de la mayoría de conexiones roscadas de agua en casa.",
    },

    { type: "h2", text: "Dónde sí y dónde no se usa" },
    {
      type: "table",
      caption: "Usos de la cinta teflón en casa",
      headers: ["Sí se usa", "No se usa"],
      rows: [
        ["Niples, codos y coples roscados de agua", "Conexiones que sellan con empaque o arandela de hule"],
        ["Llaves de paso y llaves de nariz roscadas", "Tuercas del sifón del lavabo o del fregadero"],
        ["Brazo de la regadera", "Mangueras flexibles y de lavadora con empaque"],
        ["Adaptadores roscados entre materiales distintos", "Uniones pegadas o termofusionadas, que no tienen rosca"],
      ],
    },
    {
      type: "p",
      text: "Donde ya hay un empaque, la cinta estorba: impide que el empaque asiente bien y termina causando la fuga que querías evitar. Por eso, al limpiar el sifón como te contamos en la guía de [[B11|cómo destapar un lavabo]], las tuercas se arman solo con su empaque. Si estás uniendo tubos de distinto material, revisa la [[B04|diferencia entre tubería ppr y pvc]] para saber qué conexión de transición lleva rosca.",
    },
    { type: "cta" },
    {
      type: "p",
      text: "La guía se descarga gratis siendo miembro. Si todavía no lo eres, te contamos cómo funciona [[B10|Club 57 de Ferretería 57]] y qué recibes al registrarte.",
    },

    { type: "h2", text: "Cómo poner cinta teflón paso a paso" },
    {
      type: "steps",
      items: [
        {
          title: "Limpia la rosca",
          text: "Quita la cinta vieja, la tierra y el sarro con un cepillo o un trapo. La rosca debe quedar limpia y seca.",
        },
        {
          title: "Empieza en el segundo hilo",
          text: "Deja libre el primer hilo de la punta. Así la cinta no se mete al tubo, donde podría tapar un filtro o una llave.",
        },
        {
          title: "Enrolla en el sentido en que se aprieta",
          text: "Mira la punta del tubo de frente y enrolla en el sentido de las manecillas del reloj. Al enroscar la conexión, la cinta se aprieta en lugar de desenrollarse.",
        },
        {
          title: "Mantén la cinta estirada",
          text: "Jala la cinta con un poco de tensión para que se pegue a la rosca y marque los hilos, sin arrugas ni pliegues.",
        },
        {
          title: "Da varias vueltas y corta",
          text: "Las vueltas dependen del grosor de la cinta y del tamaño de la rosca; el empaque lo indica. La rosca debe quedar cubierta y todavía debe verse el dibujo de los hilos. Corta la cinta con la mano y alísala con los dedos.",
        },
      ],
    },
    {
      type: "p",
      text: "Después, enrosca a mano y termina de apretar con la llave adecuada, firme pero sin forzar. En la sección de [Plomería](" +
        catalogHref("plomeria") +
        ") encuentras [cinta teflón](/buscar?q=cinta%20teflon) y conexiones, y en [Herramienta](" +
        catalogHref("herramienta") +
        ") las llaves para apretarlas.",
    },

    { type: "h2", text: "Tipos de cinta teflón: estándar, de mayor densidad y para gas" },
    {
      type: "ul",
      items: [
        "**Estándar:** la más común, delgada. Sirve para la mayoría de roscas de agua en casa.",
        "**De mayor densidad o grosor:** más resistente, útil en roscas más grandes o metálicas; llenas la rosca con menos vueltas.",
        "**Para gas:** es un producto específico, hecho y marcado para ese uso; el empaque lo dice. La cinta para agua no se usa en gas.",
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Las conexiones de gas, con un técnico",
      text: "Aunque exista cinta para gas, una fuga de gas es peligrosa. Las instalaciones y reparaciones de gas debe hacerlas o revisarlas un técnico. Si hueles a gas, no enciendas nada, ventila y llama a tu proveedor.",
    },

    { type: "h2", text: "Errores comunes que causan fugas" },
    {
      type: "ul",
      items: [
        "**Enrollarla al revés:** al apretar, la cinta se desenrolla y se amontona fuera de la rosca.",
        "**Demasiadas vueltas:** la conexión no entra completa o, en piezas de plástico, puede rajar la rosca hembra.",
        "**Muy pocas vueltas:** quedan huecos entre los hilos y gotea.",
        "**Aflojar para acomodar la pieza:** si ya apretaste y la regresas un poco para alinearla, el sello se rompe. Mejor desarma, cambia la cinta y vuelve a armar.",
        "**Ponerla sobre cinta vieja o sucia:** siempre limpia la rosca antes.",
        "**Usarla en conexiones con empaque:** ahí sobra y provoca la fuga.",
      ],
    },
    {
      type: "p",
      text: "Si vas a armar las conexiones de un tinaco o una bomba, en la guía para [[B07|instalar tinaco]] tienes la lista de piezas que conviene tener a la mano.",
    },

    { type: "h2", text: "Alternativa: pasta selladora para roscas" },
    {
      type: "p",
      text: "La [pasta selladora](/buscar?q=sellador%20de%20roscas) se unta en la rosca macho en lugar de la cinta. Rellena bien los hilos y es práctica en roscas metálicas o difíciles de enrollar. Revisa en el empaque si sirve para la tubería que tienes, especialmente si es de plástico, y cuánto tiempo hay que esperar antes de abrir el agua. Algunos fabricantes indican usar cinta y pasta juntas; si el empaque no lo dice, usa una sola.",
    },
  ],
  faq: [
    {
      q: "¿Para qué sirve la cinta teflón?",
      a: "Sirve para sellar las roscas de las conexiones de agua. Al apretar la conexión, la cinta rellena los huecos entre los hilos para que no haya fugas, y además lubrica la rosca para apretarla parejo. Se usa en niples, codos, llaves de paso o el brazo de la regadera; no en conexiones que sellan con empaque.",
    },
    {
      q: "¿En qué dirección se enrolla la cinta teflón?",
      a: "En el mismo sentido en que se aprieta la conexión. Mirando la punta del tubo de frente, se enrolla en el sentido de las manecillas del reloj, empezando en el segundo hilo y con la cinta estirada. Así, al enroscar la pieza la cinta se aprieta en lugar de desenrollarse.",
    },
    {
      q: "¿Se puede usar cinta teflón en conexiones de gas?",
      a: "Solo la cinta hecha específicamente para gas, que lo indica en su empaque; la cinta común para agua no se usa en gas. Aun así, las instalaciones y reparaciones de gas debe hacerlas o revisarlas un técnico, porque una fuga es peligrosa. Si hueles a gas, ventila, no enciendas nada y llama a tu proveedor.",
    },
  ],
  guia: { titulo: "Plomería básica visual: guía de cinta teflón y sellado de roscas" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B04", "B07", "B11", "B17", "B19", "B22", "B23", "B29", "B32"],
});
