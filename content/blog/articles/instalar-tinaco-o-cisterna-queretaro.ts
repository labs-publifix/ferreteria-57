import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B07 · Pilar · Plomería y agua. Regla de redacción del brief: el cálculo de
// capacidad usa un consumo por persona ilustrativo, declarado como ejemplo e
// invitando a ajustarlo. Cortes de agua en general, sin datos de colonias ni
// cifras de clima. Altura y presión en lenguaje simple, sin fórmulas. Sin
// marcas de tinacos ni bombas: búsquedas y categoría de plomería.
// Lanzamiento: se publica al terminarse.
export default defineArticle({
  topicId: "B07",
  slug: "instalar-tinaco-o-cisterna-queretaro",
  title: "Tinaco o cisterna en Querétaro: qué considerar para instalarlo y no quedarte sin agua",
  seoTitle: "Instalar tinaco o cisterna en Querétaro: guía completa",
  metaDescription:
    "Qué considerar para instalar un tinaco o cisterna en Querétaro: capacidad, ubicación, bomba y accesorios para no quedarte sin agua en los cortes.",
  keyword: "instalar tinaco",
  secondaryKeywords: [
    "cisterna o tinaco cuál conviene",
    "capacidad de tinaco por persona",
    "tinaco y bomba",
    "altura del tinaco para buena presión",
    "cortes de agua querétaro",
    "tandeos de agua",
  ],
  cluster: "plomeria-y-agua",
  pillar: true,
  publishAt: "2026-10-09T12:00:00-06:00",
  updatedAt: "2026-10-09T12:00:00-06:00",
  intro:
    "Antes de **instalar tinaco** o cisterna hay que resolver cuatro cosas: si te conviene uno, otro o los dos; qué capacidad necesita tu familia; dónde va a quedar y con qué base; y qué accesorios completan la instalación. En Querétaro y en buena parte del Bajío los cortes de agua y los tandeos son parte de la vida diaria, así que la idea es tener reserva suficiente para pasar esos días sin preocuparte. En esta guía te explicamos cómo decidir, cómo calcular la capacidad con un ejemplo que puedes ajustar a tu casa, qué piezas no pueden faltar y cómo darle mantenimiento.",
  blocks: [
    { type: "h2", text: "Tinaco, cisterna o ambos: cómo decidir" },
    {
      type: "p",
      text: "Los dos guardan agua, pero funcionan distinto:",
    },
    {
      type: "ul",
      items: [
        "**Tinaco:** depósito que va en alto, normalmente en la azotea. El agua baja a la casa por gravedad, sin necesidad de electricidad. Su capacidad es limitada por el peso que puede cargar la azotea.",
        "**Cisterna:** depósito que va enterrado o a nivel de piso. Puede guardar mucha más agua, pero necesita una bomba para subirla al tinaco o para mandarla con presión a la casa.",
      ],
    },
    {
      type: "table",
      caption: "Qué conviene según tu situación",
      headers: ["Situación", "Lo que suele convenir", "Por qué"],
      rows: [
        ["El agua llega casi todos los días y los cortes son cortos", "Solo tinaco", "Es la opción más sencilla y no depende de la luz"],
        ["Hay tandeos o cortes de varios días", "Cisterna y tinaco", "La cisterna guarda la reserva grande y el tinaco reparte el agua por gravedad"],
        ["La azotea no aguanta un tinaco grande", "Cisterna con bomba", "La reserva queda abajo, donde el peso no es problema"],
        ["Casa nueva o remodelación completa", "Planear los dos desde el inicio", "Es más fácil dejar listas las tuberías y la conexión eléctrica de la bomba"],
      ],
    },
    {
      type: "p",
      text: "El sistema más común en casas del Bajío es el combinado: el agua de la red llena la cisterna, una bomba la sube al tinaco y el tinaco alimenta la casa. Así, aunque el agua de la calle llegue solo algunos días, la cisterna conserva la reserva y el tinaco mantiene el servicio.",
    },

    { type: "h2", text: "Cómo calcular la capacidad según el número de personas" },
    {
      type: "p",
      text: "El cálculo es sencillo: **personas × consumo por persona al día × días de reserva**. El dato que más cambia de una casa a otra es el consumo por persona, porque depende de cuántos baños hay, si hay lavadora, jardín o regaderas largas. Lo ideal es que uses tu propio dato: revisa en tus recibos de agua cuántos litros consume tu casa y divídelo entre los días del periodo y el número de personas.",
    },
    {
      type: "callout",
      variant: "nota",
      title: "El ejemplo es ilustrativo",
      text: "Para los números de esta guía usamos un consumo de ejemplo de 150 litros por persona al día. No es un dato oficial ni una medición: es un supuesto para hacer el cálculo. Cámbialo por el de tu casa y el resultado será más preciso.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Cuenta a las personas",
          text: "Ejemplo: una familia de 4 personas.",
        },
        {
          title: "Multiplica por el consumo diario",
          text: "4 personas × 150 litros (ejemplo) = 600 litros al día.",
        },
        {
          title: "Decide cuántos días de reserva quieres",
          text: "Piensa en cuánto suelen durar los cortes donde vives. Si son de dos días: 600 × 2 = 1,200 litros.",
        },
        {
          title: "Elige la capacidad comercial",
          text: "Busca el tinaco, la cisterna o la combinación que sume esa cantidad o un poco más. Las capacidades disponibles cambian según el fabricante.",
        },
      ],
    },
    {
      type: "table",
      caption: "Litros de reserva con el consumo de ejemplo (150 litros por persona al día)",
      headers: ["Personas", "Al día", "1 día de reserva", "2 días", "3 días"],
      rows: [
        ["2", "300 L", "300 L", "600 L", "900 L"],
        ["3", "450 L", "450 L", "900 L", "1,350 L"],
        ["4", "600 L", "600 L", "1,200 L", "1,800 L"],
        ["5", "750 L", "750 L", "1,500 L", "2,250 L"],
        ["6", "900 L", "900 L", "1,800 L", "2,700 L"],
      ],
    },
    {
      type: "p",
      text: "Si el resultado es más de lo que puede cargar tu azotea, reparte: deja la reserva grande en la cisterna y usa un tinaco de menor capacidad arriba. Ahorrar agua también cuenta: revisar fugas, cerrar la llave mientras te enjabonas y juntar cargas completas en la lavadora hace que la misma reserva dure más días.",
    },
    { type: "cta" },

    { type: "h2", text: "Dónde instalarlo: base, nivel, altura y acceso" },
    { type: "h3", text: "Una base firme y nivelada" },
    {
      type: "p",
      text: "Cada litro de agua pesa alrededor de un kilo, así que un tinaco lleno pesa, en kilos, casi lo mismo que su capacidad en litros. Por eso necesita una base **firme, plana y nivelada** que cubra todo el fondo del tinaco, normalmente de concreto o de block con una losa encima. Nunca lo apoyes sobre ladrillos sueltos, tablas o en la orilla de la azotea. Si no estás seguro de que tu losa aguante el peso, consulta a un albañil o a un especialista antes de subirlo.",
    },
    { type: "h3", text: "La altura y la presión, en simple" },
    {
      type: "p",
      text: "Con un tinaco, la presión del agua en la casa depende de qué tan alto está el agua respecto a la llave o regadera: **entre más alto, más presión**. Si el tinaco queda casi a la misma altura que la regadera del último piso, el agua va a salir con muy poca fuerza.",
    },
    {
      type: "p",
      text: "Como referencia práctica, conviene que la base del tinaco quede por lo menos un par de metros por encima de la salida de agua más alta de la casa. Si eso no es posible, o si tienes un calentador de paso que pide más presión para encender (revisa su manual), la solución es una **bomba presurizadora** a la salida del tinaco o de la cisterna.",
    },
    { type: "h3", text: "Acceso y protección" },
    {
      type: "ul",
      items: [
        "Deja espacio alrededor para revisar las conexiones y abrir la tapa con comodidad.",
        "La tapa debe cerrar bien para que no entren polvo, hojas, insectos ni luz.",
        "En la cisterna, la tapa debe ser segura para que nadie, en especial niños, pueda abrirla o caer.",
        "Mantén la cisterna lejos de fosas sépticas, drenajes y zonas donde se encharque agua sucia.",
      ],
    },

    { type: "h2", text: "Accesorios que no pueden faltar: flotador, válvulas, filtro, conexiones y bomba" },
    {
      type: "p",
      text: "El tinaco o la cisterna son solo una parte de la compra. Para que la instalación funcione bien y sin fugas necesitas un conjunto de piezas. Esta es la lista completa:",
    },
    {
      type: "table",
      caption: "Componentes de una instalación de tinaco y cisterna",
      headers: ["Pieza", "Para qué sirve"],
      rows: [
        ["Flotador o válvula de llenado", "Cierra la entrada de agua cuando el tinaco o la cisterna se llenan; evita que se desborden"],
        ["Válvulas de paso (llaves de esfera)", "Permiten cerrar la entrada y la salida para dar mantenimiento sin vaciar toda la instalación"],
        ["Multiconector o conexiones de salida", "Unen el tinaco con la tubería de la casa y con el jarro de aire"],
        ["Jarro de aire (tubo de ventilación)", "Deja salir el aire de la tubería para que el agua fluya parejo"],
        ["Filtro de sedimentos", "Retiene tierra y partículas antes de que lleguen a llaves, regaderas y calentador"],
        ["Tubería y conexiones", "Llevan el agua de la red a la cisterna, de la cisterna al tinaco y del tinaco a la casa"],
        ["Bomba para subir agua", "Lleva el agua de la cisterna al tinaco"],
        ["Control de nivel (flotador eléctrico o electronivel)", "Enciende y apaga la bomba según el nivel del agua, para que no trabaje en seco ni desborde el tinaco"],
        ["Válvula de pie (pichancha)", "Va en la punta del tubo de succión dentro de la cisterna; mantiene el agua en el tubo y filtra lo grueso"],
        ["Bomba presurizadora (opcional)", "Da presión a la casa cuando el tinaco no tiene suficiente altura"],
        ["Cinta teflón o sellador para roscas", "Sella las uniones roscadas para que no goteen"],
      ],
    },
    {
      type: "p",
      text: "Para la tubería, elige el material según el uso: en nuestra comparación de tuberías te explicamos la [[B04|diferencia entre tubería ppr y pvc]], CPVC y cobre. Encuentra conexiones, válvulas, flotadores y tubería en nuestra categoría de [plomería](" +
        catalogHref("plomeria") +
        "), y busca [tinaco](/buscar?q=tinaco), [flotador](/buscar?q=flotador), [bomba de agua](/buscar?q=bomba%20de%20agua) o [cinta teflón](/buscar?q=cinta%20teflon) para ver lo que tenemos. Si no encuentras algo en línea, pregúntanos en el mostrador.",
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Bomba y electricidad",
      text: "La bomba necesita una conexión eléctrica protegida de la lluvia, con tierra física y en un circuito adecuado para su consumo: revisa la placa y el manual. Si hay que hacer una instalación eléctrica nueva para la bomba, que la haga un electricista.",
    },

    { type: "h2", text: "Mantenimiento y limpieza periódica" },
    {
      type: "p",
      text: "Con el tiempo se juntan en el fondo tierra, sarro y sedimentos, sobre todo cuando el agua llega con arrastre después de un corte. Por eso se recomienda lavar el tinaco y la cisterna **al menos dos veces al año**, y antes si ves agua turbia, sedimento o mal olor. El procedimiento general es:",
    },
    {
      type: "steps",
      items: [
        { title: "Cierra la entrada", text: "Cierra la válvula de llenado y deja que el nivel baje usando el agua en la casa." },
        { title: "Vacía el resto", text: "Abre el desagüe o retira el agua que queda con una cubeta, sin dejar que la bomba trabaje en seco." },
        { title: "Talla las paredes y el fondo", text: "Usa un cepillo de cerda suave o una esponja. Evita fibras metálicas y abrasivos que rayen el interior." },
        { title: "Enjuaga y retira el sedimento", text: "Saca toda el agua sucia y los residuos del fondo." },
        { title: "Desinfecta", text: "Usa el desinfectante o el cloro como indican su etiqueta y el fabricante del tinaco, y enjuaga después." },
        { title: "Llena y revisa", text: "Abre la entrada, revisa que el flotador cierre bien y que no haya fugas en las conexiones." },
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Nunca entres solo a una cisterna",
      text: "Una cisterna es un espacio cerrado con poca ventilación. Ventílala antes de entrar, hazlo siempre con otra persona afuera, no mezcles productos de limpieza y desconecta la bomba. Si no te sientes seguro, contrata un servicio de limpieza de cisternas.",
    },
    {
      type: "p",
      text: "Aprovecha cada limpieza para revisar el flotador, las válvulas, el filtro y el estado de la tapa. Cambiar a tiempo un flotador que ya no cierra bien evita desbordes y desperdicio de agua.",
    },

    { type: "h2", text: "Checklist para instalar tinaco o cisterna" },
    {
      type: "ul",
      items: [
        "Calculé la capacidad con el número de personas, mi consumo real o el de ejemplo, y los días de reserva que necesito.",
        "Decidí si voy con tinaco, cisterna o los dos.",
        "Confirmé que la azotea o el lugar elegido aguantan el peso del depósito lleno.",
        "Preparé una base firme, plana y nivelada que cubre todo el fondo.",
        "El tinaco queda lo bastante alto para dar buena presión, o ya consideré una bomba presurizadora.",
        "Tengo flotador, válvulas de entrada y salida, conexiones, jarro de aire y filtro.",
        "Si hay cisterna: bomba, control de nivel, válvula de pie y conexión eléctrica protegida.",
        "Tengo la tubería del material correcto y cinta teflón para las roscas.",
        "Probé todas las uniones con el agua abierta antes de dar por terminada la instalación.",
        "Anoté cuándo toca la siguiente limpieza.",
      ],
    },
    {
      type: "p",
      text: "Instalar un tinaco en una base ya preparada y conectarlo a una tubería existente es un trabajo que mucha gente hace en casa. Construir una cisterna, reforzar una azotea o hacer la instalación eléctrica de la bomba son trabajos para un especialista. Si tienes dudas, trae al mostrador de Ferretería 57 las medidas y una foto de tu instalación, y te ayudamos a armar la lista completa de piezas.",
    },
  ],
  faq: [
    {
      q: "¿Qué capacidad de tinaco o cisterna necesito para mi familia?",
      a: "Multiplica el número de personas por el consumo diario por persona y por los días de reserva que quieres tener. Con un consumo de ejemplo de 150 litros por persona al día, una familia de 4 usa unos 600 litros diarios; para dos días de reserva necesitaría unos 1,200 litros. Ajusta el cálculo con el consumo real de tu casa, que aparece en tus recibos de agua.",
    },
    {
      q: "¿A qué altura debo instalar el tinaco para tener buena presión?",
      a: "Entre más alto quede el tinaco respecto a las llaves y regaderas, más presión tendrás. Como referencia práctica, conviene que su base quede por lo menos un par de metros por encima de la salida de agua más alta de la casa. Si no se puede, o si tu calentador pide más presión según su manual, una bomba presurizadora resuelve el problema.",
    },
    {
      q: "¿Cada cuánto se debe lavar un tinaco o cisterna?",
      a: "Se recomienda lavarlos al menos dos veces al año, y antes si notas agua turbia, sedimento en el fondo o mal olor. Hay que vaciarlos, tallar con cepillo suave, enjuagar, desinfectar como indica la etiqueta del producto y revisar el flotador y las válvulas. Nunca entres solo a una cisterna: ventílala y hazlo con alguien afuera.",
    },
    {
      q: "¿Qué conviene más, cisterna o tinaco?",
      a: "Depende de los cortes de agua donde vives. Si el agua llega casi todos los días, un tinaco suele ser suficiente y no depende de la luz. Si hay tandeos o cortes de varios días, lo más práctico es combinar los dos: la cisterna guarda la reserva grande y una bomba sube el agua al tinaco, que reparte por gravedad a toda la casa.",
    },
  ],
  guia: { titulo: "Checklist de instalación de tinaco o cisterna" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B04", "B13", "B18", "B23", "B06", "B05"],
});
