import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B04 · Pilar · Plomería y agua. Regla de redacción del brief: comparar
// por características generales (costo relativo, tipo de unión, uso). Sin
// límites numéricos de temperatura ni presión: se remiten a la ficha del
// fabricante. Contexto local del Bajío solo cualitativo.
// Lanzamiento: se publica al terminarse (el calendario decía 09/10/2026).
export default defineArticle({
  topicId: "B04",
  slug: "diferencias-tuberia-ppr-pvc-cpvc-cobre",
  title: "PPR, PVC, CPVC o cobre: diferencias entre tuberías y cuál conviene en tu proyecto",
  seoTitle: "Diferencias entre tubería PPR y PVC, CPVC o cobre",
  metaDescription:
    "Compara las tuberías PPR, PVC, CPVC y cobre: costo, resistencia, temperatura, instalación y en qué casos conviene cada una en tu casa u obra.",
  keyword: "diferencia entre tubería ppr y pvc",
  secondaryKeywords: [
    "tubería ppr vs cobre",
    "cpvc para agua caliente",
    "qué tubería usar para agua potable",
    "tubería para agua caliente",
    "ppr ventajas",
  ],
  cluster: "plomeria-y-agua",
  pillar: true,
  publishAt: "2026-10-08T12:00:00-06:00",
  updatedAt: "2026-10-09T12:00:00-06:00",
  intro:
    "La principal **diferencia entre tubería PPR y PVC** está en la temperatura y en la forma de unirlas: el PVC hidráulico es para agua fría y se pega con cemento, mientras que el PPR sirve para agua fría y caliente y se une por termofusión, con calor. El CPVC es la opción pegada para agua caliente, y el cobre es el material tradicional que se suelda. Elegir bien depende de tres cosas: qué agua va a pasar por el tubo, qué herramienta tienes o estás dispuesto a conseguir y cuánto quieres invertir. Aquí te explicamos cada material con sus ventajas, sus límites y en qué casos conviene.",
  blocks: [
    { type: "h2", text: "Cuatro materiales, cuatro formas de unir" },
    {
      type: "p",
      text: "Antes de comparar precios conviene entender cómo se une cada tubería, porque eso define qué herramienta necesitas, qué tan difícil es la instalación y qué tan fácil será repararla después:",
    },
    {
      type: "ul",
      items: [
        "**PVC hidráulico:** se pega con cemento para PVC. Rápido y sin herramienta especial.",
        "**CPVC:** también se pega, pero con su propio cemento, distinto al del PVC.",
        "**PPR:** se une por **termofusión**: una termofusora calienta el tubo y la conexión y, al juntarlos, quedan como una sola pieza.",
        "**Cobre:** se suelda con soplete, pasta para soldar y soldadura. Pide práctica y cuidado con la flama.",
      ],
    },
    {
      type: "callout",
      variant: "nota",
      title: "Temperaturas y presiones: en la ficha",
      text: "Cada tubería tiene límites de temperatura y presión que dependen del fabricante y del tipo exacto de tubo. No los repetimos aquí a propósito: revisa siempre la etiqueta o la ficha técnica antes de elegir, sobre todo si el tubo va a llevar agua caliente.",
    },

    { type: "h2", text: "PVC hidráulico: el más común para agua fría" },
    {
      type: "p",
      text: "El PVC hidráulico es el tubo blanco que ves en muchas instalaciones de agua fría: alimentación a tinacos, líneas de riego, salidas de agua en patios. Es ligero, económico y fácil de cortar y pegar, por eso es el más usado en reparaciones caseras.",
    },
    {
      type: "p",
      text: "**Ventajas:** costo bajo, instalación rápida y piezas fáciles de conseguir. **Límites:** no está hecho para agua caliente, y si queda expuesto al sol conviene protegerlo o pintarlo, porque la luz lo daña con el tiempo. **Al instalarlo:** corta recto, quita la rebaba, limpia las piezas y aplica el cemento en el tubo y en la conexión; respeta el tiempo de secado que indica el empaque antes de meter presión.",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Hidráulico no es sanitario",
      text: "El PVC para drenaje (sanitario) es otro producto, con otras paredes y otras conexiones. No lo uses para agua a presión ni al revés: revisa en la etiqueta para qué uso está hecho cada tubo.",
    },

    { type: "h2", text: "CPVC: agua caliente y fría, con unión pegada" },
    {
      type: "p",
      text: "El CPVC se parece al PVC, pero está hecho para soportar agua caliente. Por eso es una opción frecuente para la salida del calentador o del boiler cuando se prefiere una instalación pegada, sin termofusora ni soplete.",
    },
    {
      type: "p",
      text: "**Ventajas:** sirve para agua fría y caliente y se instala con herramienta sencilla: cortatubos, lija y su cemento. **Límites:** cuesta más que el PVC y es menos flexible, así que hay que cuidar los golpes durante la obra. **Error común:** usar el cemento del PVC. Cada material tiene el suyo y el empaque lo indica; mezclarlos puede provocar fugas en la unión.",
    },

    { type: "h2", text: "PPR: termofusión, durabilidad y la herramienta necesaria" },
    {
      type: "p",
      text: "El PPR (polipropileno) se ha vuelto muy popular para instalaciones nuevas de agua fría y caliente. Su gran ventaja es la unión: al termofusionar, el tubo y la conexión se funden y forman una sola pieza, sin pegamento ni rosca que pueda aflojarse. Además, no se oxida ni se corroe, y el sarro se le adhiere menos que a otros materiales.",
    },
    {
      type: "p",
      text: "**Ventajas:** uniones muy confiables, buena durabilidad y sirve para agua caliente según el tipo de tubo que indique la ficha. **Límites:** necesitas una termofusora con los dados de la medida que vas a usar, y la técnica pide un poco de práctica: calentar el tiempo justo, meter recto y no girar la pieza al unir. **Lo que necesitas:** [termofusora](/buscar?q=termofusora), cortatubos para PPR, tubos y [conexiones PPR](/buscar?q=ppr).",
    },
    { type: "cta" },

    { type: "h2", text: "Cobre: el clásico, con ventajas y costo" },
    {
      type: "p",
      text: "El cobre lleva décadas en las casas mexicanas. Aguanta bien el agua caliente, es rígido y, bien soldado, dura mucho. Por eso todavía se usa en muchas instalaciones y es común encontrarlo cuando se remodela una casa antigua.",
    },
    {
      type: "p",
      text: "**Ventajas:** resistencia y una larga trayectoria; sirve para agua fría y caliente. **Límites:** es la opción más cara de las cuatro y soldarlo bien requiere práctica, soplete y cuidado: trabaja con ventilación, lejos de materiales que se quemen y con un extintor a la mano. **Mantenimiento:** con agua dura acumula sarro por dentro con los años, igual que otros materiales metálicos.",
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Si vas a soldar",
      text: "Usa lentes y guantes, protege muros y madera con una placa o lámina, deja enfriar la pieza antes de tocarla y nunca sueldes una tubería con agua dentro ni con presión. Si no tienes experiencia, considera una unión que no use flama.",
    },

    { type: "h2", text: "Tabla comparativa: diferencias entre tubería PPR y PVC, CPVC y cobre" },
    {
      type: "p",
      text: "Esta tabla resume las diferencias generales. Los límites exactos de temperatura y presión dependen del fabricante: búscalos en la ficha técnica de cada tubo.",
    },
    {
      type: "table",
      caption: "Comparativa general de tuberías para agua",
      headers: ["Material", "Uso típico", "Cómo se une", "Herramienta", "Costo relativo"],
      rows: [
        ["PVC hidráulico", "Agua fría", "Cemento para PVC", "Cortatubos o segueta, lija", "El más bajo"],
        ["CPVC", "Agua fría y caliente", "Cemento para CPVC", "Cortatubos, lija", "Medio"],
        ["PPR", "Agua fría y caliente, según su tipo", "Termofusión", "Termofusora y dados, cortatubos", "Medio"],
        ["Cobre", "Agua fría y caliente", "Soldadura", "Soplete, cortatubos, lija, pasta para soldar", "El más alto"],
      ],
    },
    {
      type: "p",
      text: "En la práctica, para una reparación pequeña de agua fría, el PVC suele ser lo más sencillo. Para una instalación nueva de agua caliente y fría, el PPR ofrece uniones muy confiables si tienes o rentas la termofusora. El CPVC es útil cuando necesitas agua caliente con una instalación pegada, y el cobre conviene sobre todo cuando vas a reparar o ampliar una instalación que ya es de cobre.",
    },

    { type: "h2", text: "Qué conviene en una casa de Querétaro: agua dura y sarro" },
    {
      type: "p",
      text: "En muchas zonas del Bajío el agua trae minerales que con el tiempo dejan sarro en llaves, regaderas, calentadores y tuberías. Eso no significa que un material esté prohibido, pero sí conviene tomarlo en cuenta: los materiales plásticos como el PPR, el CPVC y el PVC no se corroen, y las uniones por termofusión no tienen rosca donde el sarro se acumule.",
    },
    {
      type: "p",
      text: "También influye el clima: en temporada de calor el sol pega fuerte en azoteas y patios, así que cualquier tubo plástico que quede a la intemperie debe ir protegido. Y si tu casa tiene tinaco en la azotea, revisa que los tramos expuestos estén bien sujetos y cubiertos. Si vas a instalar tinaco o cisterna nuevos, en nuestra guía para [[B07|instalar tinaco]] te explicamos capacidad, ubicación y accesorios.",
    },
    {
      type: "steps",
      items: [
        { title: "Define qué agua pasa", text: "Solo fría, o fría y caliente. Si va agua caliente, descarta el PVC hidráulico." },
        { title: "Revisa lo que ya tienes", text: "Si vas a reparar o ampliar, lo más sencillo suele ser seguir con el mismo material de la instalación." },
        { title: "Piensa en la herramienta", text: "Pegar requiere poco; termofusionar pide termofusora; soldar pide soplete y práctica." },
        { title: "Confirma en la ficha", text: "Antes de comprar, revisa en la etiqueta el uso, la temperatura y la presión para las que está hecho cada tubo." },
      ],
    },

    {
      type: "p",
      text: "Y un consejo honesto: cambiar un tramo visible de tubería es un buen trabajo de fin de semana, pero rehacer la instalación completa de una casa, mover la salida de un calentador o meter tubería dentro de muros ya terminados es trabajo para un plomero. Un error escondido en la pared se descubre tarde y sale caro. Si tu proyecto es grande, usa esta guía para entender las opciones y platicarlas con quien vaya a hacer la instalación.",
    },

    { type: "h2", text: "Lo que necesitas según el tipo de unión" },
    {
      type: "p",
      text: "Antes de ir a comprar, haz tu lista completa. Faltar una pieza a media instalación es la forma más común de dejar el agua cortada más tiempo del necesario:",
    },
    {
      type: "ul",
      items: [
        "**Unión pegada (PVC y CPVC):** tubo y conexiones del mismo material, cortatubos o segueta, lija o limpiador para quitar la rebaba, y el cemento que corresponde a cada material. Algunos fabricantes piden además un limpiador antes del cemento; el empaque lo indica.",
        "**Termofusión (PPR):** termofusora, dados de la medida del tubo, cortatubos para plástico, un trapo limpio y un marcador para señalar la profundidad de inserción. Deja que la termofusora llegue a su temperatura antes de empezar.",
        "**Soldadura (cobre):** soplete, soldadura, pasta para soldar, lija o fibra para limpiar el tubo, cortatubos para cobre y, por seguridad, extintor, lentes y guantes.",
        "**En cualquier caso:** cinta teflón para las roscas, llave ajustable o de perico para apretar conexiones roscadas y una cubeta y trapos para el agua que quede en la línea.",
      ],
    },
    {
      type: "p",
      text: "Si es tu primera vez con PPR o con cobre, haz una o dos uniones de prueba con pedazos de tubo antes de trabajar en la instalación real. Es la mejor forma de tomarle la medida a los tiempos sin arriesgar una fuga escondida en la pared.",
    },

    { type: "h2", text: "Errores comunes al instalar tubería" },
    {
      type: "ul",
      items: [
        "**No cerrar el agua en la llave de paso correcta.** Antes de cortar, cierra y abre una llave de la casa para confirmar que ya no sale agua.",
        "**Cortar chueco.** Un corte inclinado deja menos superficie de unión y es una fuga en potencia. El cortatubos da cortes más rectos que la segueta.",
        "**No limpiar las piezas.** Polvo, grasa o rebaba impiden que el cemento o la soldadura agarren bien.",
        "**Meter presión antes de tiempo.** El cemento y la termofusión necesitan reposo; respeta lo que indica el fabricante antes de abrir el agua.",
        "**Mezclar materiales sin la conexión adecuada.** Pegar PVC con CPVC o soldar a un plástico termina en fugas.",
        "**No probar antes de cerrar.** Abre el agua y revisa cada unión antes de resanar o cubrir la tubería.",
      ],
    },

    { type: "h2", text: "Cómo unir materiales distintos" },
    {
      type: "p",
      text: "Es común que en una casa convivan dos materiales: una instalación de cobre que se amplía con PPR, o un PVC que llega a un calentador. La regla es **nunca pegar ni soldar materiales distintos entre sí**: se unen con conexiones de transición o adaptadores roscados pensados para ese cambio de material. En las roscas, usa [cinta teflón](/buscar?q=cinta%20teflon) o el sellador que indique el fabricante, sin exagerar las vueltas.",
    },
    {
      type: "p",
      text: "Encuentra tubería, conexiones, cementos, cortatubos y cinta en nuestra categoría de [plomería](" +
        catalogHref("plomeria") +
        "). Si vas a armar tu caja para trabajos de plomería, revisa también nuestra lista de [[B02|herramientas básicas para el hogar]]. Y si no sabes qué material tienes en casa, llévanos un pedazo de tubo o una foto de la conexión: en el mostrador de Ferretería 57 te ayudamos a elegir las piezas correctas.",
    },
  ],
  faq: [
    {
      q: "¿Cuál es mejor, tubería PPR o cobre?",
      a: "Depende del proyecto. El PPR es más económico, no se corroe y sus uniones por termofusión quedan como una sola pieza, por eso es muy usado en instalaciones nuevas. El cobre es más caro y pide soldadura, pero conviene cuando reparas o amplías una instalación que ya es de cobre. En ambos casos, revisa en la ficha el uso para el que está hecho el tubo.",
    },
    {
      q: "¿Qué tubería se usa para agua caliente en casa?",
      a: "Para agua caliente se usan CPVC, PPR del tipo indicado para agua caliente y cobre. El PVC hidráulico no está hecho para agua caliente. La temperatura y la presión que soporta cada tubo dependen del fabricante, así que confirma en la etiqueta o en la ficha técnica antes de instalarlo a la salida del calentador o del boiler.",
    },
    {
      q: "¿Se puede unir tubería PVC con CPVC o con PPR?",
      a: "Sí, pero no pegándolas ni fusionándolas entre sí. Cada material tiene su propio método de unión, y para pasar de uno a otro se usan conexiones de transición o adaptadores roscados hechos para ese cambio. En las roscas se usa cinta teflón o el sellador que indique el fabricante. Si tienes dudas, llévanos una foto de la conexión y te ayudamos.",
    },
    {
      q: "¿Qué herramienta necesito para instalar tubería PPR?",
      a: "Una termofusora con los dados de la medida de tu tubo, un cortatubos para PPR y, si quieres, un marcador para señalar la profundidad de inserción. La técnica consiste en calentar tubo y conexión el tiempo que indica el fabricante, unirlos rectos y sin girar, y dejarlos enfriar antes de mover la pieza.",
    },
  ],
  guia: { titulo: "Comparador de tuberías: PPR, PVC, CPVC y cobre" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B07", "B10", "B11", "B13", "B14", "B02", "B01"],
});
