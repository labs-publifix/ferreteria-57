import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B09 · Fondo · Construcción, fijación y materiales. Regla de redacción del
// brief: conocimiento general, sin cifras de carga — cuánto aguanta cada
// taquete depende del muro y del fabricante, y se remite al empaque. Tabla
// muro / taquete / broca / uso típico. Muros frecuentes en casas del Bajío
// (block, tabique, concreto) sin generalizar.
export default defineArticle({
  topicId: "B09",
  slug: "tipos-de-taquetes-tablaroca-concreto-ladrillo-hueco",
  title: "Tipos de taquetes: cuál usar en tablaroca, concreto sólido o ladrillo hueco",
  seoTitle: "Tipos de taquetes: cuál usar en tablaroca y concreto",
  metaDescription:
    "Guía para elegir el taquete correcto en tablaroca, concreto sólido o ladrillo hueco y evitar que se caigan repisas, pantallas y cuadros.",
  keyword: "tipos de taquetes",
  secondaryKeywords: [
    "taquete para tablaroca",
    "taquete para ladrillo hueco",
    "taquete para concreto",
    "taquete expansivo",
    "taquete mariposa",
    "qué taquete usar",
  ],
  cluster: "construccion-fijacion-y-materiales",
  pillar: false,
  publishAt: "2026-10-13T09:00:00-06:00",
  updatedAt: "2026-10-13T09:00:00-06:00",
  intro:
    "Hay varios **tipos de taquetes** y cada uno está hecho para un muro: en concreto sólido y tabique macizo funciona un taquete de expansión (de plástico para cargas ligeras, metálico o ancla para las pesadas); en ladrillo o block hueco conviene un taquete que se abra detrás de la pared, y en tablaroca se usa un taquete especial para tablaroca, de mariposa o autoperforante. Antes de elegir, hay que saber de qué es tu muro. En esta guía te explicamos cómo identificarlo, qué taquete va en cada caso, cómo instalarlo paso a paso y qué cosas nunca deberías colgar con un taquete de plástico.",
  blocks: [
    { type: "h2", text: "Por qué se caen las cosas: taquete equivocado, no el tornillo" },
    {
      type: "p",
      text: "Cuando una repisa se viene abajo, lo primero que se culpa es al tornillo. Casi nunca es él. Un taquete funciona porque se **expande o se abre** dentro del muro y queda trabado; si el muro no le da dónde apoyarse, el tornillo sale con todo y taquete. Las fallas más comunes son:",
    },
    {
      type: "ul",
      items: [
        "**Taquete de plástico común en un muro hueco:** se expande en el vacío y no agarra nada.",
        "**Broca más ancha que el taquete:** el taquete gira en el agujero y nunca se aprieta.",
        "**Agujero poco profundo o lleno de polvo:** el taquete queda salido y el tornillo no lo abre por completo.",
        "**Tornillo que no corresponde:** muy delgado no expande el taquete; muy grueso lo rompe o agrieta el muro.",
        "**Demasiado peso para ese taquete o ese muro:** cada fabricante indica en el empaque para qué cargas y materiales sirve.",
      ],
    },
    {
      type: "p",
      text: "Por eso lo que sostiene el peso no es una pieza, sino el trío **broca, taquete y tornillo**, elegido para tu tipo de muro.",
    },

    { type: "h2", text: "Cómo identificar tu muro" },
    {
      type: "p",
      text: "En Querétaro y en el Bajío es común encontrar en la misma casa muros de block, de tabique rojo y elementos de concreto como losas, columnas y castillos, además de tablaroca en plafones y muros divisorios. Tres pruebas sencillas te dicen con qué estás trabajando:",
    },
    {
      type: "steps",
      items: [
        {
          title: "Golpea con los nudillos",
          text: "Un sonido sordo y firme indica muro macizo (concreto o tabique). Un sonido hueco, como de tambor, indica tablaroca o un muro con huecos por dentro.",
        },
        {
          title: "Haz una perforación de prueba",
          text: "Con una broca delgada, en un lugar que no se vea. Fíjate en el polvo y en cómo avanza: polvo gris y mucha resistencia de principio a fin es concreto; polvo rojizo y resistencia pareja es tabique macizo; si la broca atraviesa una capa y de pronto «se va» al vacío, el muro es hueco (block o tabique hueco); polvo blanco y una placa que se perfora muy fácil es tablaroca.",
        },
        {
          title: "Revisa el grosor y lo que hay detrás",
          text: "En tablaroca, busca los postes o canales del bastidor con un detector o golpeando cada pocos centímetros. Antes de perforar cualquier muro, revisa que no pasen por ahí tuberías ni cables: un detector ayuda, y como referencia, evita la línea vertical arriba y abajo de contactos y apagadores.",
        },
      ],
    },

    { type: "h2", text: "Taquetes por tipo de muro" },
    {
      type: "p",
      text: "Con el muro identificado, la elección es más fácil. Esta tabla resume la combinación más común. El diámetro de la broca y el tornillo correcto siempre vienen indicados en el empaque del taquete.",
    },
    {
      type: "table",
      caption: "Muro, taquete, broca y uso típico",
      headers: ["Tipo de muro", "Taquete", "Broca", "Uso típico"],
      rows: [
        ["Concreto sólido", "Taquete de expansión de plástico o nylon; para cargas pesadas, taquete expansivo metálico o ancla", "Para concreto (carburo), con percusión", "Repisas, soportes, gabinetes, puertas y rejas"],
        ["Tabique rojo macizo", "Taquete de expansión de plástico o nylon", "Para concreto o mampostería, con percusión suave", "Cuadros, repisas, cortineros, espejos"],
        ["Block o tabique hueco", "Taquete para muro hueco (de aletas o que se abre por detrás) o de nylon universal", "Para mampostería, con percusión suave", "Repisas ligeras, cortineros, accesorios de baño"],
        ["Tablaroca", "Taquete para tablaroca: mariposa, autoperforante o de palanca metálico", "Para madera o metal, sin percusión (el autoperforante no necesita broca)", "Cuadros, repisas ligeras, accesorios; lo pesado, al bastidor"],
      ],
    },
    {
      type: "callout",
      variant: "consejo",
      title: "La broca correcta es la mitad del trabajo",
      text: "Cada material pide su broca y el diámetro lo decide el taquete. En nuestra guía de [[B03|tipos de brocas]] te explicamos cómo elegirla y cómo marcar la profundidad con un pedazo de cinta.",
    },
    { type: "cta" },

    { type: "h2", text: "Tipos de taquetes: plástico, mariposa, expansivo metálico y ancla" },
    { type: "h3", text: "Taquete de plástico o nylon" },
    {
      type: "p",
      text: "Es el más común y el más económico. Al meter el tornillo, el taquete se abre y presiona las paredes del agujero, por eso **necesita un muro macizo**: concreto o tabique. Sirve para cargas ligeras y medianas como cuadros, repisas de uso normal, cortineros y accesorios. Algunos taquetes de nylon tienen aletas o un diseño «universal» que también trabaja en muros huecos; el empaque indica en qué materiales funciona cada uno.",
    },
    { type: "h3", text: "Taquete mariposa y taquetes para tablaroca" },
    {
      type: "p",
      text: "Están pensados para muros delgados y huecos. El **taquete mariposa** pasa por el agujero cerrado y, al apretar el tornillo, sus alas se abren detrás de la placa y la abrazan. El **taquete autoperforante para tablaroca** tiene una rosca ancha que se enrosca directamente en el panel. Para cargas mayores en tablaroca existe el **taquete de palanca metálico**, que se coloca de forma horizontal detrás del panel y reparte la fuerza en un área más grande.",
    },
    { type: "h3", text: "Taquete expansivo metálico" },
    {
      type: "p",
      text: "Es una camisa de metal que se abre dentro del agujero al apretar el tornillo o la tuerca. Aguanta más que uno de plástico y se usa en concreto y tabique macizo para cosas más pesadas: soportes, gabinetes, puertas, protecciones. Hay versiones para muro hueco que se abren por detrás de la pared.",
    },
    { type: "h3", text: "Ancla" },
    {
      type: "p",
      text: "Las anclas metálicas de expansión son para **concreto sólido** y cargas pesadas o que soportan esfuerzo constante: rejas, portones, barandales, estructuras. Requieren una broca del diámetro exacto, una perforación limpia y apretar la tuerca hasta que el ancla quede firme. Si lo que vas a fijar debe soportar el peso de personas, consúltalo con un especialista.",
    },
    {
      type: "p",
      text: "Encuentra estas piezas en nuestro catálogo: busca [taquetes](/buscar?q=taquete), [taquete mariposa](/buscar?q=taquete%20mariposa), [anclas](/buscar?q=ancla) y [tornillos](/buscar?q=tornillo), o revisa la categoría de [herramienta](" +
        catalogHref("herramienta") +
        ") para brocas, niveles y detectores.",
    },

    { type: "h2", text: "Cómo instalarlos paso a paso" },
    {
      type: "steps",
      items: [
        { title: "Marca y nivela", text: "Marca con lápiz dónde van los agujeros y revisa con un nivel que queden alineados. Confirma que no pasen tuberías ni cables por ahí." },
        { title: "Elige broca y profundidad", text: "Usa una broca del material del muro y del mismo diámetro que el taquete. Marca en la broca, con cinta, una profundidad un poco mayor que el largo del taquete." },
        { title: "Perfora derecho", text: "Sostén el taladro perpendicular al muro. Usa percusión solo en concreto y tabique; en tablaroca y azulejo, sin percusión." },
        { title: "Limpia el agujero", text: "Sopla o aspira el polvo. Un agujero con polvo deja el taquete salido o flojo." },
        { title: "Coloca el taquete", text: "Mételo a presión o con golpes suaves de martillo hasta que quede al ras del muro. Si entra demasiado flojo, la broca fue más ancha de lo necesario." },
        { title: "Atornilla sin forzar", text: "Usa el tornillo que indica el empaque y su largo: el del taquete más el grueso de lo que vas a colgar. Aprieta hasta que quede firme, sin pasarte: un taquete forzado se rompe o gira." },
      ],
    },
    {
      type: "p",
      text: "Para este trabajo necesitas pocas cosas: taladro, brocas, nivel, flexómetro, lápiz, martillo y desarmador. Si estás armando tu caja, revisa nuestra lista de [[B02|herramientas básicas para el hogar]].",
    },

    { type: "h2", text: "Peso y seguridad: qué no colgar con taquete de plástico" },
    {
      type: "p",
      text: "Cuánto aguanta un taquete no es un número fijo: depende del tipo de muro, de su estado, del tornillo y de cómo se instaló. El fabricante indica en el empaque para qué materiales y cargas está pensado cada taquete; respeta esa indicación y, si dudas, usa más puntos de fijación o un taquete de mayor capacidad.",
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "No cuelgues esto con taquete de plástico",
      text: "Pantallas y soportes de TV, alacenas y gabinetes de cocina, lavabos, calentadores, libreros pesados, barras de apoyo, pasamanos, hamacas, columpios y costales de box. Usa taquetes metálicos o anclas en concreto, o fíjalos al bastidor en tablaroca. Si de la fijación depende la seguridad de una persona, consulta a un especialista.",
    },
    {
      type: "ul",
      items: [
        "**En tablaroca, lo pesado va al bastidor.** Localiza los postes y atornilla ahí, o usa un taquete de palanca metálico.",
        "**Reparte el peso.** Una repisa con cuatro puntos de fijación trabaja mejor que con dos.",
        "**No reutilices un agujero dañado.** Si el borde se despostilló, mueve el punto unos centímetros.",
        "**Revisa de vez en cuando.** Un cuadro o una repisa que empieza a inclinarse está avisando.",
      ],
    },
    {
      type: "p",
      text: "Si no sabes de qué es tu muro o qué taquete conviene, tómale una foto al agujero de prueba y al objeto que vas a colgar y tráela al mostrador de Ferretería 57: te ayudamos a elegir la combinación correcta.",
    },
  ],
  faq: [
    {
      q: "¿Qué taquete se usa en tablaroca?",
      a: "En tablaroca se usa un taquete especial para muro hueco: el taquete mariposa, que abre sus alas detrás de la placa; el autoperforante para tablaroca, que se enrosca directo en el panel, o el de palanca metálico para cargas mayores. Un taquete de plástico común no sirve, porque no tiene dónde expandirse. Lo pesado conviene fijarlo a los postes del bastidor.",
    },
    {
      q: "¿Qué taquete sirve para tabique hueco?",
      a: "En tabique hueco o block conviene un taquete para muro hueco, que se abre o se traba detrás de la pared, o un taquete de nylon universal que el fabricante indique para huecos. Un taquete de plástico común suele expandirse en el vacío y quedar flojo. Perfora con broca para mampostería y percusión suave para no romper las paredes del tabique.",
    },
    {
      q: "¿Cómo sé cuánto peso aguanta un taquete?",
      a: "La capacidad la indica el fabricante en el empaque, y depende del tipo de muro, del tornillo y de una buena instalación. No hay una cifra que sirva para todos los casos. Si el objeto es pesado o crítico, usa taquetes metálicos o anclas en concreto, reparte el peso en varios puntos o fíjalo al bastidor en tablaroca.",
    },
    {
      q: "¿Qué broca uso para un taquete?",
      a: "Una broca del mismo diámetro que el taquete, que viene marcado en su empaque, y del material del muro: para concreto o mampostería en tabique y concreto, y para madera o metal en tablaroca. Perfora un poco más profundo que el largo del taquete y limpia el polvo antes de meterlo.",
    },
  ],
  guia: { titulo: "Guía de taquetes por tipo de muro" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B03", "B02", "B20", "B44", "B47"],
});
