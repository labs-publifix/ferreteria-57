import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B01 · Pilar · Marca y Club 57. Regla de redacción del brief: describir
// cada marca solo con lo que muestra el catálogo; no afirmar qué línea
// cubre cada una ni garantías: se remite a la etiqueta o ficha. Por eso las
// marcas se comparan por criterio de uso (ocasional o diario), exigencia y
// presupuesto, no por listas de productos.
// Lanzamiento: publishAt el día de entrega del módulo (el calendario decía
// 09/10/2026; los 8 de lanzamiento se publican al terminarse).
export default defineArticle({
  topicId: "B01",
  slug: "marcas-truper-pretul-foset-volteck-guia",
  title: "Truper, Pretul, Foset, Volteck y más: guía de marcas para elegir herramienta y material",
  seoTitle: "Marcas Truper: Pretul, Foset, Volteck y cuál elegir",
  metaDescription:
    "Qué es cada marca de la familia Truper (Pretul, Foset, Volteck, Fiero, Hermex y Klintek), para qué sirve y cómo elegir según tu trabajo y presupuesto.",
  keyword: "marcas truper",
  secondaryKeywords: [
    "pretul vs truper",
    "qué es pretul",
    "volteck material eléctrico",
    "foset herramientas",
    "hermex",
    "fiero",
    "klintek",
  ],
  cluster: "marca-y-club-57",
  pillar: true,
  publishAt: "2026-10-08T11:00:00-06:00",
  updatedAt: "2026-10-09T12:30:00-06:00",
  intro:
    "En Ferretería 57 todo lo que vendemos es de la familia Truper: la marca Truper y las demás **marcas Truper** del grupo: Pretul, Foset, Volteck, Fiero, Hermex y Klintek. No compiten entre sí: cada una responde a un tipo de comprador. La forma más sencilla de elegir es contestar tres preguntas: qué tan seguido vas a usar la herramienta, qué tan pesado es el trabajo y cuánto quieres invertir hoy. Con esas respuestas casi siempre queda clara la marca. En esta guía te explicamos cómo leer la familia completa, cuándo conviene pagar un poco más y cuándo no hace falta.",
  blocks: [
    { type: "h2", text: "La familia de marcas Truper que vendemos en Ferretería 57" },
    {
      type: "p",
      text: "Cuando entras a la tienda o recorres el catálogo en línea, vas a ver varios nombres en las etiquetas. Es normal preguntarse si son productos distintos, imitaciones o líneas de calidad muy diferente. La respuesta corta: son marcas de un mismo grupo, y cada una tiene su lugar. Saberlo te ahorra dinero, porque evita pagar por una herramienta pensada para uso diario cuando solo la vas a sacar dos veces al año, y también evita el error contrario: comprar lo más barato para un trabajo que lo va a exigir todos los días.",
    },
    {
      type: "p",
      text: "Las siete marcas que vas a encontrar con nosotros son **Truper, Pretul, Foset, Volteck, Fiero, Hermex y Klintek**. No todas están en todas las categorías ni todos los productos están siempre en exhibición, pero las manejamos todas. Si buscas algo que no ves en el anaquel o en el sitio, pregúntanos en el mostrador: muchas veces se puede conseguir.",
    },
    {
      type: "callout",
      variant: "nota",
      title: "La etiqueta manda",
      text: "Esta guía te ayuda a decidir entre marcas, pero lo que define si un producto sirve para tu trabajo es su etiqueta o su ficha: ahí vienen el uso para el que está pensado, sus medidas y sus características. Ante la duda, compara dos fichas lado a lado antes de comprar.",
    },

    { type: "h2", text: "Truper: la marca principal y qué ofrece" },
    {
      type: "p",
      text: "Truper es la marca que da nombre a la familia y la que más vas a ver en el catálogo. Aparece en herramienta manual, herramienta eléctrica, jardinería, plomería, pintura y prácticamente cualquier área de una ferretería. Por eso, si no sabes por dónde empezar, Truper es el punto de partida natural: casi siempre hay un modelo para lo que necesitas. Si vas a pintar, en nuestra guía de [[B08|brocha o rodillo]] te explicamos qué herramienta conviene según la pintura.",
    },
    {
      type: "p",
      text: "Lo que conviene entender es que **dentro de Truper también hay niveles**. No todas las pinzas, martillos o taladros Truper son iguales: hay modelos sencillos y modelos más robustos. La diferencia está en la ficha: material, acabado, potencia en el caso de las eléctricas y accesorios incluidos. Elegir bien es elegir el modelo correcto, no solo la marca.",
    },
    {
      type: "p",
      text: "Si vas a armar tu caja desde cero, empieza por nuestra lista de [[B02|herramientas básicas para el hogar]]: con Truper puedes tener todo de una misma familia: [herramienta](" +
        catalogHref("herramienta") +
        "), [jardinería](" +
        catalogHref("jardineria") +
        ") y [plomería](" +
        catalogHref("plomeria") +
        "). Y si vas a perforar muros, antes de elegir el taladro revisa nuestra guía de [[B03|tipos de brocas]]: la broca correcta importa tanto como la marca.",
    },
    { type: "cta" },

    { type: "h2", text: "Una por una: Pretul, Foset, Volteck, Fiero, Hermex y Klintek" },
    {
      type: "p",
      text: "Aquí va lo que te podemos decir con certeza de cada marca y, sobre todo, qué revisar en cada producto. No vamos a prometerte líneas completas ni garantías que no estén escritas en la etiqueta: lo que sí podemos hacer es ayudarte a leerla.",
    },
    { type: "h3", text: "Pretul" },
    {
      type: "p",
      text: "Pretul es la marca de la familia con precios más accesibles. Está pensada para quien necesita resolver una reparación en casa sin hacer una gran inversión: colgar repisas, apretar una llave, armar un mueble. Para uso ocasional cumple muy bien. Si la herramienta va a trabajar todos los días, compara antes con el modelo Truper equivalente.",
    },
    { type: "h3", text: "Volteck" },
    {
      type: "p",
      text: "Volteck es la marca de la familia para material eléctrico. La vas a encontrar sobre todo en nuestra categoría de [eléctrico](" +
        catalogHref("electrico") +
        "). En este tipo de producto la etiqueta es especialmente importante: indica para qué carga y qué uso está hecho cada artículo. Para elegir el cable correcto, en nuestra guía de [[B05|calibre de cable para casa]] te explicamos cómo calcularlo. Si vas a modificar una instalación, que un electricista la revise.",
    },
    { type: "h3", text: "Foset" },
    {
      type: "p",
      text: "Foset es otra marca de la familia Truper. Para saber si el producto que tienes enfrente es el que buscas, revisa en su ficha el uso para el que está pensado y compáralo con las alternativas de la misma categoría. En el catálogo puedes ver todo lo que tenemos de la marca con una búsqueda: [productos Foset](/buscar?q=Foset).",
    },
    { type: "h3", text: "Fiero" },
    {
      type: "p",
      text: "Fiero también pertenece a la familia. Igual que con cualquier marca, el criterio es el mismo: qué uso indica la ficha, qué tan seguido lo vas a usar y qué tan exigente es tu trabajo. Puedes ver lo que manejamos en [productos Fiero](/buscar?q=Fiero).",
    },
    { type: "h3", text: "Hermex y Klintek" },
    {
      type: "p",
      text: "Hermex y Klintek completan la familia. Si llegas a ellas buscando algo concreto, la ficha te dice para qué sirve cada producto; si dudas entre dos opciones, en el mostrador te ayudamos a compararlas. Búscalas en el catálogo: [productos Hermex](/buscar?q=Hermex) y [productos Klintek](/buscar?q=Klintek).",
    },

    { type: "h2", text: "Truper vs Pretul: cuándo conviene pagar más y cuándo no" },
    {
      type: "p",
      text: "Esta es la pregunta que más nos hacen en el mostrador. No hay una respuesta única, porque depende de ti, no de la marca. Lo que sí hay es un criterio claro con tres preguntas:",
    },
    {
      type: "steps",
      items: [
        {
          title: "¿Qué tan seguido la vas a usar?",
          text: "Si es para una reparación de vez en cuando, Pretul suele ser suficiente. Si la vas a usar varias veces por semana o es tu herramienta de trabajo, el modelo Truper equivalente aguanta mejor el ritmo.",
        },
        {
          title: "¿Qué tan pesado es el trabajo?",
          text: "Apretar un tornillo de un mueble no es lo mismo que aflojar una tuerca oxidada. Cuanto más fuerza, calor o desgaste vaya a recibir la herramienta, más conviene subir de nivel.",
        },
        {
          title: "¿Cuánto quieres invertir hoy?",
          text: "A veces conviene empezar con lo básico y mejorar después solo las herramientas que más usas. Así el dinero se va a lo que de verdad trabaja.",
        },
      ],
    },
    {
      type: "p",
      text: "Un ejemplo ilustrativo: si cuelgas un cuadro al año, un desarmador Pretul resuelve. Si eres técnico y abres y cierras equipos todos los días, el desarmador sufre mucho más, y ahí sí vale la pena el modelo más robusto. Ninguna de las dos compras es un error: el error es elegir sin pensar en el uso.",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Mezclar marcas está bien",
      text: "No hace falta que toda tu caja sea de una sola marca. Muchos clientes tienen Truper en las herramientas que usan diario y Pretul en las de uso esporádico. Es una forma inteligente de gastar.",
    },

    { type: "h2", text: "Tu tarea y la marca que conviene" },
    {
      type: "p",
      text: "Esta tabla resume el criterio. Es orientativa: la decisión final la da la ficha del producto y el uso que le vas a dar.",
    },
    {
      type: "table",
      caption: "Qué marca revisar primero según la tarea",
      headers: ["Tu tarea", "Marca que conviene revisar", "Por qué"],
      rows: [
        ["Reparaciones de vez en cuando en casa", "Pretul o Truper", "Para uso ocasional, Pretul cuida tu presupuesto; Truper si quieres un modelo más robusto."],
        ["Trabajo diario en taller u obra", "Truper", "El uso constante pide modelos más robustos; compara las fichas dentro de la marca."],
        ["Material para una instalación eléctrica", "Volteck", "Es la marca de la familia para material eléctrico; revisa en la etiqueta el uso indicado."],
        ["Armar tu primera caja de herramientas", "Truper y Pretul", "Combina: robusto en lo que más usarás, básico en lo esporádico."],
        ["Buscas algo de Foset, Fiero, Hermex o Klintek", "La marca que buscas", "Revisa la ficha del producto y compárala con alternativas de la misma categoría."],
      ],
    },
    {
      type: "p",
      text: "Si todavía no sabes qué necesitas, empieza por la herramienta que más vas a usar y elige ahí el mejor modelo que te permita tu presupuesto. Lo demás se completa con el tiempo.",
    },

    { type: "h2", text: "Cómo leer la etiqueta o la ficha de cualquier marca" },
    {
      type: "p",
      text: "La marca te orienta, pero la información que decide está en el producto. Ya sea Truper, Pretul o cualquier otra marca de la familia, revisa siempre estos puntos antes de pagar:",
    },
    {
      type: "ul",
      items: [
        "**Uso indicado.** Muchas etiquetas dicen para qué está pensado el producto: uso doméstico, uso general o trabajo más exigente. Es el dato más útil para comparar entre marcas.",
        "**Material y acabado.** En herramienta manual, el material de la parte que trabaja y el del mango dicen mucho de cómo va a aguantar el uso. Compara dos modelos y fíjate en qué cambia.",
        "**Medidas y compatibilidad.** Diámetros, largos, tipo de cuerda o de conexión: si el producto se va a unir con otro, confirma que las medidas coincidan. Lleva la pieza vieja si la tienes.",
        "**Qué incluye.** Algunos productos traen accesorios, estuche o repuestos y otros no. Dos precios distintos a veces se explican por lo que viene en la caja.",
        "**Clave del producto.** La clave de la ficha o la etiqueta identifica el modelo exacto. Si vas a comprar otra pieza igual o a pedir uno que no está en exhibición, con la clave lo encontramos rápido.",
      ],
    },
    {
      type: "p",
      text: "Si el producto indica garantía o condiciones de uso, vienen en su empaque o en su ficha. Guarda el empaque y tu comprobante de compra mientras usas la herramienta las primeras veces: si algo no funciona como debe, te ayudamos a revisarlo.",
    },

    { type: "h2", text: "Errores comunes al elegir entre marcas" },
    {
      type: "p",
      text: "En el mostrador vemos los mismos tropiezos una y otra vez. Ninguno es grave, pero todos cuestan dinero o tiempo:",
    },
    {
      type: "ul",
      items: [
        "**Comprar por precio sin pensar en el uso.** La opción más económica es perfecta para un trabajo esporádico y se queda corta en uno diario. Al revés también pasa: pagar de más por algo que casi no vas a usar.",
        "**Elegir solo por la marca y no por el modelo.** Dentro de una misma marca hay modelos muy distintos. Lee la ficha del modelo concreto que te vas a llevar.",
        "**Olvidar los consumibles.** Brocas, discos, lijas o cintas se gastan. A veces conviene invertir más en la herramienta y comprar los consumibles según lo que vayas necesitando.",
        "**No preguntar.** Si dudas entre dos productos, pregúntanos. Comparar dos fichas con alguien que las conoce toma un par de minutos y evita una segunda vuelta a la tienda.",
      ],
    },

    { type: "h2", text: "Cómo encontrar cada marca en nuestro catálogo" },
    {
      type: "p",
      text: "En el sitio puedes buscar por marca: escribe el nombre en el buscador y verás todo lo que tenemos en línea de esa marca. Por ejemplo: [Truper](/buscar?q=Truper) o [Pretul](/buscar?q=Pretul). Dentro de cada producto, la ficha te muestra la marca, la clave y sus características, para que compares con calma.",
    },
    {
      type: "p",
      text: "Recuerda que no todo lo que vendemos está publicado en línea ni en exhibición al mismo tiempo. Si no encuentras un producto, pregúntanos: como trabajamos con toda la familia Truper, muchas veces lo podemos conseguir. También te ayudamos a elegir entre dos modelos si tienes dudas.",
    },
    {
      type: "p",
      text: "Puedes ver y comprar en la tienda, en Lateral Carretera Federal 57 No. 230, Casa Blanca, en Querétaro, o pedir en línea con envío local. En el mostrador te asesoramos sin compromiso: llévate la marca que de verdad le conviene a tu trabajo.",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Antes de comprar, tres datos",
      text: "Lleva anotado para qué lo vas a usar, cada cuánto y en qué material o superficie. Con esos tres datos te podemos recomendar marca y modelo en un par de minutos.",
    },
  ],
  faq: [
    {
      q: "¿Qué diferencia hay entre Truper y Pretul?",
      a: "Las dos son de la misma familia. Pretul es la marca con precios más accesibles, pensada para uso ocasional en casa; Truper es la marca principal y ofrece modelos para un uso más frecuente o exigente. La mejor elección depende de qué tan seguido vas a usar la herramienta y qué tan pesado es el trabajo; las características de cada producto vienen en su etiqueta o ficha.",
    },
    {
      q: "¿Qué marcas pertenecen a Truper?",
      a: "En Ferretería 57 manejamos la familia completa: Truper, Pretul, Foset, Volteck, Fiero, Hermex y Klintek. Todas forman parte del mismo grupo. No todos los productos están publicados en línea ni en exhibición al mismo tiempo, así que si buscas algo de alguna de estas marcas y no lo ves, pregúntanos en el mostrador o por mensaje.",
    },
    {
      q: "¿Qué marca conviene para uso doméstico y cuál para uso diario de taller?",
      a: "Para reparaciones ocasionales en casa, Pretul suele ser suficiente y cuida tu presupuesto. Para el uso diario de un taller u obra conviene revisar los modelos Truper, que están pensados para un ritmo de trabajo mayor. Muchos clientes combinan las dos: lo que más usan, de un modelo robusto; lo esporádico, de uno básico.",
    },
    {
      q: "¿Dónde compro marcas Truper en Querétaro?",
      a: "En Ferretería 57 manejamos toda la familia Truper. Puedes visitarnos en Lateral Carretera Federal 57 No. 230, Casa Blanca, en Querétaro, o comprar en línea con envío local. Si no encuentras un producto en el sitio, pregúntanos: muchas veces lo podemos conseguir aunque no esté publicado ni en exhibición.",
    },
  ],
  guia: { titulo: "Guía de marcas Truper: cuál elegir según tu trabajo" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B03", "B02", "B05", "B08", "B10"],
});
