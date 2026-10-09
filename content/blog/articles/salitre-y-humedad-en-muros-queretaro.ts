import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B06 · Pilar · Pintura, sellado e impermeabilización. Regla de redacción del
// brief: procedimiento general; tiempos de secado y dosificación se remiten a
// la etiqueta de cada producto. Sin fechas ni cifras de clima: el contexto de
// Querétaro y el Bajío es solo cualitativo. Si hay fuga o humedad
// estructural, se deriva a un especialista. Sin marcas de producto: enlaces a
// categorías y búsquedas del catálogo.
export default defineArticle({
  topicId: "B06",
  slug: "salitre-y-humedad-en-muros-queretaro",
  title: "Salitre y humedad en muros en Querétaro: cómo protegerlos y eliminarlos paso a paso",
  seoTitle: "Salitre en paredes en Querétaro: cómo quitarlo y evitarlo",
  metaDescription:
    "Por qué sale salitre en tus muros, cómo eliminarlo y qué productos usar para proteger tu casa de la humedad en Querétaro. Guía paso a paso.",
  keyword: "salitre en paredes",
  secondaryKeywords: [
    "cómo quitar el salitre de las paredes",
    "humedad en muros qué hacer",
    "impermeabilizar muros interiores",
    "anti salitre",
    "pintura para salitre",
    "humedad por capilaridad",
  ],
  cluster: "pintura-sellado-e-impermeabilizacion",
  pillar: true,
  publishAt: "2026-10-09T08:00:00-06:00",
  updatedAt: "2026-10-09T08:00:00-06:00",
  intro:
    "El **salitre en paredes** es ese polvo o costra blanca que aparece en la parte baja de los muros, ampolla la pintura y hace que el aplanado se desmorone. No es suciedad: son sales que el agua arrastra desde adentro del muro y que se quedan en la superficie cuando esa agua se evapora. Por eso la regla número uno es que el salitre no se quita de verdad mientras no se corte la humedad que lo provoca. En esta guía te explicamos cómo encontrar el origen de la humedad, cómo limpiar y reparar el muro en el orden correcto, qué productos usar en cada caso y cómo distinguir el salitre del moho.",
  blocks: [
    { type: "h2", text: "Qué es el salitre y por qué aparece" },
    {
      type: "p",
      text: "Los materiales de un muro (tabique, block, cemento, arena, el mismo suelo) contienen sales minerales. Cuando el agua entra al muro, disuelve esas sales y viaja con ellas hacia la superficie. Al llegar al aire, el agua se evapora y las sales se quedan afuera, cristalizadas. Ese es el salitre: **sales más humedad**. Sin una de las dos, no aparece.",
    },
    {
      type: "p",
      text: "Las señales más comunes son fáciles de reconocer:",
    },
    {
      type: "ul",
      items: [
        "Polvo blanco o cristales que se desprenden al pasar la mano.",
        "Pintura que se ampolla, se infla o se descascara, sobre todo cerca del piso.",
        "Aplanado que suena hueco o se deshace como arena.",
        "Una línea de mancha a cierta altura del muro, que sube y baja según la temporada.",
      ],
    },
    {
      type: "p",
      text: "En Querétaro y en el resto del Bajío es un problema muy común. La temporada de lluvias pone a prueba azoteas, bardas y cimientos, y cuando llega la temporada seca el muro empieza a secarse y las sales salen a la superficie. Por eso mucha gente nota que el salitre «florece» después de las lluvias, aunque el agua haya entrado semanas antes.",
    },
    {
      type: "callout",
      variant: "nota",
      title: "Pintar encima no lo resuelve",
      text: "Si pintas sobre salitre o sobre un muro húmedo, la pintura se vuelve a ampollar: la humedad sigue empujando sales desde adentro. El orden correcto es siempre cortar la humedad, dejar secar, limpiar, sellar y al final pintar.",
    },

    { type: "h2", text: "Primero encuentra el origen: fuga, capilaridad, lluvia o condensación" },
    {
      type: "p",
      text: "Antes de comprar cualquier producto, dedica un rato a investigar de dónde viene el agua. La forma y la ubicación de la mancha dicen mucho:",
    },
    {
      type: "table",
      caption: "Cómo reconocer el origen de la humedad",
      headers: ["Origen", "Cómo se ve", "Qué revisar"],
      rows: [
        [
          "Capilaridad (humedad que sube del suelo)",
          "Franja en la parte baja del muro, pareja a lo largo, con salitre en el borde superior",
          "Jardineras pegadas al muro, patios o banquetas que encharcan, falta de impermeabilización en el desplante",
        ],
        [
          "Filtración por lluvia",
          "Manchas en la parte alta, en esquinas con la losa o junto a ventanas; empeoran cuando llueve",
          "Azotea, pretiles, bajadas pluviales, grietas en fachada y sellos de ventanas",
        ],
        [
          "Fuga de tubería",
          "Mancha localizada que crece y no depende del clima; a veces se siente tibia si es agua caliente",
          "Tuberías que pasan por el muro, conexiones del baño o la cocina, el medidor de agua",
        ],
        [
          "Condensación",
          "Humedad en baños, cocinas y recámaras poco ventiladas; suele traer moho en esquinas y detrás de muebles",
          "Ventilación, extractores, muebles pegados a muros fríos",
        ],
      ],
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Prueba rápida para descartar una fuga",
      text: "Cierra todas las llaves de la casa y que nadie use agua. Revisa el medidor: si sigue avanzando, hay una fuga en algún punto de la instalación. Si la mancha está junto a una tubería y el medidor se mueve, el primer paso es reparar esa fuga.",
    },
    {
      type: "p",
      text: "En muchas casas el salitre tiene más de un origen: por ejemplo, una jardinera pegada a la barda que mantiene húmeda la base, y además una bajada de agua que se tapa en temporada de lluvias. Vale la pena revisar todo antes de empezar.",
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Cuándo llamar a un especialista",
      text: "Si hay una fuga dentro del muro o en el piso, si la humedad no se explica con nada de lo anterior, si hay grietas que crecen o si el muro se ve dañado en su estructura, llama a un plomero o a un especialista en impermeabilización antes de reparar el acabado. Arreglar la superficie sin resolver la causa solo pospone el problema.",
    },
    { type: "cta" },

    { type: "h2", text: "Cómo quitar el salitre en paredes paso a paso" },
    {
      type: "p",
      text: "Una vez que encontraste y corregiste el origen de la humedad, sigue este orden. Los tiempos de secado y la forma de preparar cada producto cambian según el fabricante: respeta siempre lo que indica la etiqueta.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Protégete",
          text: "Usa guantes, lentes de seguridad y mascarilla o respirador para polvo. Raspar salitre y aplanado levanta mucho polvo. Cubre el piso y retira muebles.",
        },
        {
          title: "Raspa lo que está suelto",
          text: "Con una espátula o rasqueta, quita la pintura ampollada y el aplanado que se desmorona hasta llegar a una superficie firme. Si el aplanado suena hueco al golpearlo, también hay que retirarlo.",
        },
        {
          title: "Cepilla en seco",
          text: "Con un cepillo de alambre o de cerda dura, retira el salitre en seco. No mojes el muro para limpiarlo: el agua vuelve a disolver las sales y las mete otra vez en el muro.",
        },
        {
          title: "Limpia el polvo",
          text: "Retira el polvo con una brocha seca o un trapo apenas húmedo. Si usas un limpiador para salitre, aplícalo solo como indica su etiqueta.",
        },
        {
          title: "Deja secar el muro",
          text: "Es el paso que más se salta y el más importante. El muro debe quedar seco al tacto y sin manchas oscuras. Puede tardar varios días; si vuelve a salir salitre mientras se seca, cepíllalo otra vez.",
        },
        {
          title: "Repara el aplanado",
          text: "Rellena las zonas que retiraste con mortero o con el resanador indicado para exteriores o zonas húmedas. Si usas un aditivo impermeabilizante para mortero, respeta la dosificación de la etiqueta. Deja curar el tiempo que indique el fabricante.",
        },
        {
          title: "Sella y pinta",
          text: "Aplica un sellador o fijador para muros con salitre, y después la pintura o el impermeabilizante que corresponda. Respeta el tiempo entre capas de cada producto.",
        },
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "No mezcles productos de limpieza",
      text: "Algunos limpiadores para salitre son ácidos. Úsalos solo como indica la etiqueta, en un lugar ventilado, con guantes y lentes, y nunca los mezcles con cloro, amoníaco ni otros limpiadores: la mezcla puede liberar gases tóxicos.",
    },

    { type: "h2", text: "Productos según el caso: sellador, impermeabilizante, pintura y aditivos" },
    {
      type: "p",
      text: "No existe un solo producto «anti salitre» que sirva para todo. Lo que conviene depende de dónde está el muro y de qué tan grave es el daño. Estos son los grupos de productos que vas a encontrar y para qué sirve cada uno:",
    },
    {
      type: "table",
      caption: "Qué producto usar y para qué",
      headers: ["Producto", "Para qué sirve", "Ten en cuenta"],
      rows: [
        [
          "Sellador o fijador para muros con salitre",
          "Consolida la superficie y bloquea las sales antes de pintar",
          "Va sobre el muro limpio y seco; revisa en la etiqueta si es para interior, exterior o ambos",
        ],
        [
          "Impermeabilizante para muros",
          "Protege fachadas y bardas de la lluvia; algunos son para interiores",
          "Elige según si el muro es interior o exterior; no sustituye corregir una fuga",
        ],
        [
          "Pintura para muros con humedad",
          "Acabado final; las hay pensadas para exteriores o para zonas húmedas",
          "Usa la que el fabricante recomienda sobre su sellador; no la apliques sobre muro húmedo",
        ],
        [
          "Aditivo impermeabilizante para mortero",
          "Hace que el mortero del aplanado nuevo absorba menos agua",
          "Se mezcla con el mortero en la proporción que indica la etiqueta",
        ],
        [
          "Limpiador para salitre",
          "Ayuda a retirar los residuos de sales después de cepillar",
          "Solo como indica la etiqueta, con protección y sin mezclar con otros productos",
        ],
      ],
    },
    {
      type: "p",
      text: "Para que el sistema funcione, conviene usar sellador y pintura del mismo fabricante o, al menos, confirmar en la etiqueta que son compatibles. Encuentra selladores, impermeabilizantes y pinturas en nuestra categoría de [pintura](" +
        catalogHref("pintura") +
        "), y busca [impermeabilizante](/buscar?q=impermeabilizante) o [sellador](/buscar?q=sellador) para ver todas las opciones.",
    },
    { type: "h3", text: "Muro interior o exterior" },
    {
      type: "p",
      text: "En un **muro exterior** (fachada o barda), el objetivo es que la lluvia no entre: sella grietas, repara el aplanado y protege con un impermeabilizante o una pintura para exteriores. En un **muro interior** con humedad que viene de afuera o del suelo, el acabado debe dejar que el muro termine de secarse: no lo encierres con capas gruesas si la causa no está resuelta. Para **impermeabilizar muros interiores** de baños o zonas que se mojan, busca productos indicados para interiores y sigue la etiqueta.",
    },
    { type: "h3", text: "Herramienta que vas a necesitar" },
    {
      type: "ul",
      items: [
        "[Cepillo de alambre](/buscar?q=cepillo%20de%20alambre) o de cerda dura.",
        "[Espátula](/buscar?q=espatula) o rasqueta.",
        "Llana y cuchara de albañil si vas a reparar aplanado.",
        "Brocha y rodillo para sellador y pintura.",
        "[Guantes](/buscar?q=guantes), lentes y [mascarilla](/buscar?q=mascarilla) o respirador para polvo; los encuentras en nuestra categoría de [seguridad](" +
          catalogHref("seguridad") +
          ").",
      ],
    },

    { type: "h2", text: "Prevención: azotea, bajadas, juntas, jardineras y drenaje" },
    {
      type: "p",
      text: "La mejor forma de evitar que el salitre en paredes regrese es que el agua no llegue al muro. Antes de cada temporada de lluvias, revisa estos puntos:",
    },
    {
      type: "ul",
      items: [
        "**Azotea:** que el impermeabilizante esté completo, sin grietas ni ampollas, y que el agua escurra hacia las bajadas sin encharcarse.",
        "**Bajadas pluviales y coladeras:** límpialas de hojas y tierra; una bajada tapada desborda el agua contra la fachada.",
        "**Pretiles y juntas:** sella las grietas y las uniones entre losa y muro, y alrededor de ventanas.",
        "**Jardineras:** si están pegadas al muro, mantienen la base mojada todo el tiempo. Sepáralas, impermeabiliza la cara que toca el muro o riega con cuidado.",
        "**Patios y banquetas:** el piso debe tener pendiente para alejar el agua del muro; un charco permanente junto a la barda alimenta la humedad por capilaridad.",
        "**Ventilación:** en baños y cocinas, ventila o usa extractor para que el vapor no se condense en los muros.",
      ],
    },
    {
      type: "p",
      text: "Si la humedad por capilaridad viene del desplante del muro (la base que está en contacto con el suelo), la solución de fondo es una barrera contra la humedad en esa zona. Es un trabajo de obra que conviene hacer con un especialista.",
    },

    { type: "h2", text: "Salitre vs moho: cómo distinguirlos" },
    {
      type: "p",
      text: "Los dos aparecen por humedad, pero no son lo mismo ni se tratan igual. El salitre son sales minerales; el moho es un hongo que crece en superficies húmedas y con poca ventilación.",
    },
    {
      type: "table",
      caption: "Diferencias entre salitre y moho",
      headers: ["Rasgo", "Salitre", "Moho"],
      rows: [
        ["Color", "Blanco", "Negro, verde o gris, en puntos o manchas"],
        ["Textura", "Polvo o cristales que crujen y se desprenden", "Mancha que se embarra al tallarla"],
        ["Olor", "No huele", "Huele a humedad o a encerrado"],
        ["Dónde aparece", "Parte baja del muro, fachadas y bardas", "Esquinas, techos de baño, detrás de muebles, zonas sin ventilación"],
        ["Causa principal", "Agua que atraviesa el muro", "Condensación y falta de ventilación"],
        ["Cómo se trata", "Cortar la humedad, cepillar en seco, sellar y pintar", "Limpiador para moho según la etiqueta, secar y mejorar la ventilación"],
      ],
    },
    {
      type: "p",
      text: "Muchas veces aparecen juntos, sobre todo en baños y recámaras orientadas a la sombra. En ese caso, resuelve primero la humedad y la ventilación, limpia cada problema con su producto (nunca mezclados) y al final aplica un acabado indicado para zonas húmedas.",
    },
    {
      type: "p",
      text: "Para el resane y la pintura, revisa también nuestra categoría de [herramienta](" +
        catalogHref("herramienta") +
        "). Y si tienes dudas sobre qué producto conviene en tu caso, tómale una foto al muro y llévala al mostrador de Ferretería 57: te ayudamos a armar la lista de materiales.",
    },
  ],
  faq: [
    {
      q: "¿Qué causa el salitre en las paredes?",
      a: "El salitre aparece cuando el agua atraviesa el muro, disuelve las sales minerales de los materiales y las deja en la superficie al evaporarse. El agua puede venir del suelo (humedad por capilaridad), de la lluvia que se filtra por la azotea o la fachada, de una fuga de tubería o de la condensación. Sin humedad no hay salitre, por eso lo primero es encontrar su origen.",
    },
    {
      q: "¿Cómo se quita el salitre y se evita que regrese?",
      a: "Primero corrige el origen de la humedad. Después raspa la pintura y el aplanado sueltos, cepilla el salitre en seco, limpia el polvo y deja secar el muro por completo. Repara el aplanado, aplica un sellador para muros con salitre y al final pinta. Para que no regrese, mantén la azotea impermeabilizada, las bajadas limpias y aleja el agua de la base de los muros.",
    },
    {
      q: "¿Qué pintura o sellador sirve para muros con humedad?",
      a: "Sobre un muro que tuvo salitre conviene un sistema: primero un sellador o fijador para muros con salitre y después una pintura para exteriores o zonas húmedas, de preferencia del mismo fabricante. En fachadas y bardas, un impermeabilizante para muros protege de la lluvia. Ningún producto funciona si el muro sigue mojado: la causa de la humedad se corrige antes.",
    },
    {
      q: "¿Se puede pintar sobre el salitre?",
      a: "No. Si pintas sobre salitre o sobre un muro húmedo, la humedad sigue empujando sales desde adentro y la pintura se vuelve a ampollar y a descascarar en poco tiempo. Hay que cepillar el salitre en seco, dejar secar el muro, aplicar un sellador indicado para salitre y después pintar, respetando los tiempos de la etiqueta.",
    },
  ],
  guia: { titulo: "Guía visual: salitre y humedad, diagnóstico y reparación" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B08", "B24", "B30", "B41", "B43", "B02", "B04"],
});
