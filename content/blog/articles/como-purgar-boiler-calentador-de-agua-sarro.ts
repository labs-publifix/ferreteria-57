import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B17 · Fin de semana · Plomería y agua. Regla de redacción del brief:
// procedimiento general para boiler de depósito; los detalles (posición de la
// perilla, tiempos, presión) los indica el manual del fabricante. Sin cifras de
// dureza del agua; frecuencia como regla práctica («al menos una vez al año»).
// Contexto del Bajío solo cualitativo. El boiler de paso se limpia distinto y
// solo se menciona. El seoTitle del brief no contiene la keyword como frase,
// así que se ajustó para que la lleve.
export default defineArticle({
  topicId: "B17",
  slug: "como-purgar-boiler-calentador-de-agua-sarro",
  title: "Cómo purgar un boiler (calentador de agua) para quitarle el sarro",
  seoTitle: "Purgar boiler: cómo quitarle el sarro paso a paso",
  metaDescription:
    "Aprende a purgar tu boiler para eliminar sedimentos y sarro: pasos, frecuencia, seguridad y señales de que necesita revisión del técnico.",
  keyword: "purgar boiler",
  secondaryKeywords: [
    "cómo limpiar un boiler",
    "sarro en el boiler",
    "drenar calentador de agua",
    "cada cuánto purgar el boiler",
    "mantenimiento de boiler de depósito",
  ],
  cluster: "plomeria-y-agua",
  pillar: false,
  publishAt: "2026-10-31T08:00:00-06:00",
  updatedAt: "2026-10-31T08:00:00-06:00",
  intro:
    "Cuando alguien busca cómo **purgar boiler** en casa, lo que quiere es sacar el sedimento y el sarro que se juntan en el fondo del tanque. Purgar es vaciar el agua del boiler por su válvula de drenado hasta que salga limpia: se apaga el gas o la luz, se cierra la entrada de agua fría, se deja enfriar, se alivia la presión, se drena con una manguera y se vuelve a llenar antes de encenderlo. Es un trabajo de fin de semana que alarga la vida del equipo. Aquí te explicamos cada paso, qué revisar al terminar, cada cuánto repetirlo y cuándo llamar a un técnico.",
  blocks: [
    { type: "h2", text: "Por qué se acumula sarro en el boiler" },
    {
      type: "p",
      text: "El agua de muchas zonas del Bajío trae minerales disueltos. Al calentarse, una parte de esos minerales se separa y se asienta en el fondo del tanque como un polvo blanco o arenoso, junto con la tierra que llega por la red o desde el tinaco. Con los meses, esa capa crece y se endurece: eso es el sarro.",
    },
    {
      type: "ul",
      items: [
        "**El agua tarda más en calentarse** porque el sarro aísla el fondo del tanque, que es donde está el calor.",
        "**El boiler hace ruidos**: golpeteos o tronidos cuando enciende, que son burbujas de vapor que se forman debajo del sedimento.",
        "**El agua caliente se acaba antes**, porque el sedimento ocupa espacio dentro del tanque.",
        "**Salen partículas blancas** por la regadera o las llaves y se tapan los aireadores.",
      ],
    },
    {
      type: "callout",
      variant: "nota",
      title: "Boiler de depósito o de paso",
      text: "Esta guía es para el boiler de depósito, el que tiene un tanque que guarda agua caliente. Los calentadores de paso (instantáneos) no tienen tanque y se limpian de otra manera, desincrustando el serpentín: en ese caso sigue el manual o pide el servicio a un técnico.",
    },

    { type: "h2", text: "Antes de empezar: seguridad con gas, agua caliente y presión" },
    {
      type: "p",
      text: "Purgar un boiler es sencillo, pero se trabaja con gas, con agua muy caliente y con un tanque a presión. Antes de tocar cualquier válvula, lee el manual de tu equipo: ahí viene cómo se apaga, dónde está la válvula de drenado y cualquier indicación particular del fabricante.",
    },
    {
      type: "ul",
      items: [
        "**Apaga el boiler.** En uno de gas, gira la perilla a la posición de apagado o piloto que indique el manual y cierra la llave de gas del equipo. En uno eléctrico, apaga su pastilla.",
        "**Cierra la entrada de agua fría** con la llave de paso que llega al boiler.",
        "**Deja enfriar el agua.** El agua del tanque puede quemar. Lo más práctico es apagarlo en la noche y purgarlo a la mañana siguiente.",
        "**Alivia la presión** abriendo una llave de agua caliente dentro de la casa, para que entre aire y el tanque pueda vaciarse.",
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Si huele a gas, detente",
      text: "Si al acercarte al boiler percibes olor a gas, no enciendas luces, cerillos ni aparatos, y no desconectes nada. Cierra la llave de gas si puedes hacerlo sin riesgo, abre puertas y ventanas, sal de la casa y llama desde afuera a tu proveedor de gas o al número de emergencias.",
    },
    { type: "cta" },

    { type: "h2", text: "Materiales y herramientas" },
    {
      type: "ul",
      items: [
        "[Manguera](/buscar?q=manguera) de jardín que llegue hasta una coladera, el patio o la calle.",
        "Cubeta para las primeras salidas de agua y para revisar qué tan sucia sale.",
        "[Guantes](/buscar?q=guantes) y lentes de protección.",
        "Llave perica o de tuercas, por si la válvula de drenado lo requiere.",
        "[Cinta teflón](/buscar?q=cinta%20teflon), por si cambias la válvula de drenado roscada.",
        "Trapo y linterna para revisar fugas al terminar.",
      ],
    },
    {
      type: "p",
      text: "Si la válvula de drenado está dañada o no cierra bien, conviene tener a la mano una de repuesto. Revisa en el manual o en la válvula vieja cuál es la medida correcta.",
    },

    { type: "h2", text: "Purgar boiler de depósito: paso a paso" },
    {
      type: "steps",
      items: [
        { title: "Conecta la manguera", text: "Enróscala en la válvula de drenado, en la parte baja del tanque, y lleva el otro extremo a una coladera o al exterior, más abajo que la válvula. El agua puede salir caliente: que no apunte a plantas, personas ni mascotas." },
        { title: "Abre la válvula de drenado", text: "Ábrela despacio. Al principio el agua sale turbia o con arena blanca; es el sedimento." },
        { title: "Deja que se vacíe", text: "Con la llave de agua caliente de la casa abierta, el tanque se vacía por completo o casi. Si el agua deja de salir antes de tiempo, puede que el sedimento tape la válvula: ciérrala, abre un momento la entrada de agua fría y vuelve a intentar." },
        { title: "Enjuaga el fondo", text: "Con la válvula de drenado abierta, abre poco a poco la entrada de agua fría. El chorro remueve el sedimento del fondo. Repite hasta que el agua salga clara en la cubeta." },
        { title: "Cierra y retira la manguera", text: "Cierra la válvula de drenado, quita la manguera y revisa que no gotee." },
        { title: "Llena el tanque", text: "Abre por completo la entrada de agua fría con la llave de agua caliente de la casa todavía abierta. Cuando salga un chorro continuo, sin aire, el tanque está lleno: cierra esa llave." },
        { title: "Enciende el boiler", text: "Abre la llave de gas y enciende siguiendo el manual, o restablece la pastilla si es eléctrico. Nunca lo enciendas con el tanque vacío." },
      ],
    },
    {
      type: "p",
      text: "Si tu casa tiene calentador solar con el boiler como respaldo, aprovecha el fin de semana para revisar también el termotanque; te explicamos qué ver en la guía de [[B14|mantenimiento calentador solar]].",
    },

    { type: "h2", text: "Qué revisar después: válvulas, fugas y ánodo" },
    {
      type: "ul",
      items: [
        "**Válvula de drenado.** Que cierre por completo y no gotee. Si es de plástico y está reseca o rota, cámbiala; en la rosca se usa [[B13|cinta teflón]], aplicada en el sentido correcto.",
        "**Conexiones de entrada y salida.** Pasa un trapo seco por las tuercas y los conectores: cualquier humedad es una fuga que hay que apretar o corregir.",
        "**Tubería de salida.** El agua caliente necesita tubería hecha para eso. Si ves tramos deformados o reparados con material para agua fría, revisa la [[B04|diferencia entre tubería ppr y pvc]] y cámbialos.",
        "**Válvula de alivio.** Es la válvula de seguridad del tanque. Si gotea siempre o descarga seguido, que la revise un técnico; no la tapes ni la quites.",
        "**Ánodo de sacrificio.** Es una barra metálica que protege el tanque por dentro y se desgasta con el tiempo. Cuándo revisarlo y cómo cambiarlo lo indica el manual; si no te sientes seguro, pide el servicio.",
      ],
    },
    {
      type: "p",
      text: "En nuestra categoría de [plomería](" +
        catalogHref("plomeria") +
        ") encuentras [llaves de paso](/buscar?q=llave%20de%20paso), [válvulas de drenado](/buscar?q=valvula%20de%20drenado), [ánodos](/buscar?q=anodo) y conectores, y en [herramienta](" +
        catalogHref("herramienta") +
        ") las llaves para trabajar con comodidad.",
    },

    { type: "h2", text: "Cada cuánto repetirlo y señales de falla" },
    {
      type: "p",
      text: "Como regla práctica, purga el boiler **al menos una vez al año**. Con agua dura, como la de muchas casas del Bajío, conviene hacerlo con más frecuencia, sobre todo si notas ruidos o partículas blancas. Una buena costumbre es hacerlo antes de la temporada de frío, cuando más se usa el agua caliente.",
    },
    {
      type: "p",
      text: "Llama a un técnico si después de purgar sigue alguna de estas señales:",
    },
    {
      type: "ul",
      items: [
        "El tanque **gotea** por el cuerpo o por la base, no por una conexión.",
        "El agua sale **oxidada** o con olor desagradable aunque ya la drenaste.",
        "La **flama** se ve amarilla, el piloto se apaga solo o hay hollín alrededor del quemador.",
        "La válvula de alivio **descarga** seguido.",
        "Los **ruidos** fuertes continúan aunque el agua ya sale limpia.",
      ],
    },
    {
      type: "p",
      text: "Purgar a tiempo no hace milagros con un boiler viejo, pero en uno en buen estado ayuda a que caliente mejor, gaste menos y dure más.",
    },
  ],
  faq: [
    {
      q: "¿Cada cuánto se debe purgar un boiler?",
      a: "Como regla práctica, al menos una vez al año. Con agua dura, como la de muchas zonas del Bajío, conviene hacerlo más seguido, sobre todo si el boiler hace ruidos o salen partículas blancas por las llaves. Un buen momento es antes de la temporada de frío. El manual del fabricante puede indicar una frecuencia específica para tu equipo.",
    },
    {
      q: "¿Cómo se vacía un calentador de agua?",
      a: "Apágalo, cierra la entrada de agua fría y deja que el agua se enfríe. Abre una llave de agua caliente de la casa para aliviar la presión, conecta una manguera a la válvula de drenado y llévala a una coladera. Abre la válvula hasta vaciar el tanque, ciérrala, vuelve a llenarlo por completo y solo entonces enciéndelo.",
    },
    {
      q: "¿Por qué hace ruidos mi boiler?",
      a: "Lo más común es el sedimento acumulado en el fondo del tanque. El agua queda atrapada bajo esa capa, se calienta de más y forma burbujas que truenan o golpetean. Purgar el boiler suele reducir el ruido. Si sigue después de drenarlo o viene acompañado de fugas, flama amarilla u olor a gas, llama a un técnico.",
    },
  ],
  guia: { titulo: "Calendario y checklist de mantenimiento del boiler" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B04", "B13", "B14", "B22", "B23"],
});
