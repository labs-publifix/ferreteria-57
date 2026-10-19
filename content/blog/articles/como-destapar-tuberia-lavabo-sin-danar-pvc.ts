import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B11 · Fin de semana · Plomería y agua. Regla de redacción del brief:
// conocimiento general; cada destapacaños se usa como indica su etiqueta y
// no se dan temperaturas exactas. Orden de menor a mayor agresividad
// (mecánico antes que químico). Sin marcas: búsquedas y categorías reales.
export default defineArticle({
  topicId: "B11",
  slug: "como-destapar-tuberia-lavabo-sin-danar-pvc",
  title: "Cómo destapar la tubería del lavabo de forma segura sin dañar el PVC",
  seoTitle: "Cómo destapar un lavabo sin dañar la tubería de PVC",
  metaDescription:
    "Destapa tu lavabo paso a paso con chupón, sonda o limpieza del sifón, sin dañar el PVC y con las precauciones al usar destapacaños.",
  keyword: "cómo destapar un lavabo",
  secondaryKeywords: [
    "destapar tubería del lavabo",
    "destapacaños seguro para pvc",
    "chupón para lavabo",
    "limpiar sifón del lavabo",
    "lavabo tapado qué hacer",
  ],
  cluster: "plomeria-y-agua",
  pillar: false,
  publishAt: "2026-10-17T08:00:00-06:00",
  updatedAt: "2026-10-17T08:00:00-06:00",
  intro:
    "Si te preguntas **cómo destapar un lavabo** sin dañar la tubería, la regla es ir de lo más suave a lo más agresivo: primero limpia el tapón, luego usa el chupón, después desarma y limpia el sifón y, si sigue tapado, pasa una sonda. Los destapacaños químicos van al final, solo si la etiqueta dice que sirven para tu tubería y siguiendo sus instrucciones al pie de la letra. Aquí te explicamos cada método paso a paso, qué evitar para no dañar el PVC y cómo saber cuándo ya es trabajo de un plomero.",
  blocks: [
    { type: "h2", text: "Por qué se tapa el lavabo" },
    {
      type: "p",
      text: "El lavabo del baño se tapa poco a poco, no de un día para otro. Lo que baja por la coladera se va pegando a las paredes del tubo y del sifón hasta que el agua ya no pasa. Las causas más comunes son:",
    },
    {
      type: "ul",
      items: [
        "**Cabello:** es el principal culpable. Se enreda en el tapón y en la primera curva del tubo y atrapa todo lo demás.",
        "**Jabón, pasta de dientes y cosméticos:** forman una capa pegajosa que se endurece con el tiempo y va cerrando el paso.",
        "**Sarro:** donde el agua trae muchos minerales, como en buena parte del Bajío, el sarro se acumula en el tapón y en las uniones y hace que la mugre se pegue con más facilidad.",
      ],
    },
    {
      type: "p",
      text: "Antes de cualquier método, revisa el **tapón** de la coladera. Se saca girándolo o soltando por debajo la varilla que lo sube y baja. Muchas veces trae cabello pegado y basta limpiarlo para que el agua vuelva a correr.",
    },

    { type: "h2", text: "Método 1: cómo destapar un lavabo con chupón" },
    {
      type: "p",
      text: "El chupón (también llamado bomba o destapador de ventosa) empuja y jala el agua dentro del tubo para aflojar la obstrucción. Para lavabo conviene uno de copa plana y de tamaño chico, que selle bien sobre la coladera. Lo encuentras en la sección de [Plomería](" +
        catalogHref("plomeria") +
        ") o buscando [chupón](/buscar?q=chupon).",
    },
    {
      type: "steps",
      items: [
        { title: "Quita el tapón", text: "Sácalo y límpialo. Con el tapón puesto el chupón no hace efecto." },
        {
          title: "Tapa el rebosadero",
          text: "Es el orificio que tiene el lavabo cerca del borde. Cúbrelo con un trapo húmedo y sostenlo con la mano; si no, el aire se escapa por ahí y el chupón pierde fuerza.",
        },
        {
          title: "Deja agua en la taza",
          text: "Debe haber suficiente agua para cubrir la copa del chupón. El chupón trabaja empujando agua, no aire.",
        },
        {
          title: "Bombea con firmeza",
          text: "Coloca la copa sobre la coladera, presiona y jala varias veces seguidas sin despegarla. Luego retírala de golpe y observa si el agua baja.",
        },
        { title: "Repite y enjuaga", text: "Si baja lento, repite un par de veces más y deja correr agua de la llave para arrastrar lo que se aflojó." },
      ],
    },
    { type: "cta" },
    {
      type: "p",
      text: "La guía se descarga gratis siendo miembro. Si todavía no lo eres, te contamos cómo funciona [[B10|Club 57 de Ferretería 57]] y qué recibes al registrarte.",
    },

    { type: "h2", text: "Método 2: limpiar el sifón o trampa" },
    {
      type: "p",
      text: "El sifón (también llamado céspol o trampa) es la pieza curva que está debajo del lavabo. Guarda un poco de agua para frenar los malos olores del drenaje, y en su curva se acumula el cabello. En la mayoría de los lavabos se desarma a mano, con dos tuercas de plástico, sin herramienta.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Prepara el área",
          text: "Pon una cubeta debajo del sifón y ten trapos a la mano: al aflojarlo va a salir el agua que tiene dentro. Usa guantes.",
        },
        {
          title: "Afloja las tuercas",
          text: "Gíralas a mano hacia la izquierda. Si están duras, usa unas pinzas con un trapo de por medio para no rayarlas ni romperlas.",
        },
        {
          title: "Saca y limpia el sifón",
          text: "Vacíalo en la cubeta, saca la mugre con un cepillo o un alambre sin punta y enjuágalo. Revisa también el tramo de tubo que entra a la pared, hasta donde alcances.",
        },
        {
          title: "Revisa los empaques",
          text: "Cada tuerca lleva un empaque o arandela. Si está aplastado, cuarteado o falta, cámbialo: es la causa más común de goteras después de limpiar el sifón.",
        },
        {
          title: "Arma y prueba",
          text: "Vuelve a colocar el sifón y aprieta las tuercas a mano, firmes pero sin forzarlas. Abre la llave y revisa con un papel seco que no gotee ninguna unión.",
        },
      ],
    },
    {
      type: "p",
      text: "Si el sifón está roto, cuarteado o las roscas ya no aprietan, lo más práctico es cambiarlo por uno nuevo. Llévate el viejo a la tienda o toma una foto para que coincida con la medida de tu lavabo; lo encuentras buscando [sifón](/buscar?q=sifon).",
    },

    { type: "h2", text: "Método 3: sonda o guía mecánica" },
    {
      type: "p",
      text: "Si el sifón estaba limpio y el agua sigue sin bajar, la obstrucción está más adentro, en el tubo que va a la pared. Ahí entra la [sonda](/buscar?q=sonda): un cable flexible que se mete en el tubo y se gira para atrapar o romper lo que tapa el paso.",
    },
    {
      type: "ul",
      items: [
        "**Métela por el tubo de la pared, no por la coladera.** Con el sifón desarmado llegas directo a la obstrucción y no rayas la porcelana del lavabo.",
        "**Avanza girando, sin forzar.** Al sentir resistencia, gira la manivela para que la punta se enganche. Si empujas con fuerza en una curva, puedes dañar las uniones del PVC.",
        "**Saca y limpia.** Retira la sonda poco a poco: normalmente sale con cabello y mugre pegados. Repite hasta que entre sin resistencia.",
      ],
    },

    { type: "h2", text: "Destapacaños químicos: cuándo sí, cuándo no y precauciones" },
    {
      type: "p",
      text: "Los destapacaños químicos disuelven grasa, jabón y cabello, pero son productos fuertes que pueden quemar la piel y los ojos y, mal usados, dañar la tubería. Por eso van después de los métodos mecánicos, no antes.",
    },
    {
      type: "ul",
      items: [
        "**Cuándo sí:** cuando el agua baja lento por residuos de jabón o grasa y el sifón ya está limpio, siempre que la etiqueta diga que el producto es apto para tuberías de PVC.",
        "**Cuándo no:** si el lavabo está completamente tapado y con agua estancada, porque el químico se queda ahí sin llegar a la obstrucción. Tampoco si ya usaste otro destapacaños, ni si vas a desarmar el sifón después.",
        "**Cómo usarlo:** la cantidad, el tiempo de espera y el enjuague los marca la etiqueta de cada producto. Respétalos; poner más no destapa más rápido.",
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Antes de usar un destapacaños",
      text: "Usa [guantes](/buscar?q=guantes) y [lentes de seguridad](/buscar?q=lentes%20de%20seguridad), abre la ventana o enciende el extractor y mantén a niños y mascotas lejos. Nunca mezcles dos destapacaños ni un destapacaños con cloro u otro limpiador: pueden reaccionar y soltar gases peligrosos. No uses el chupón después de echar el químico, porque puede salpicarte. Si el producto no funcionó, avísale al plomero qué usaste antes de que trabaje.",
    },

    { type: "h2", text: "Qué evitar para no dañar el PVC" },
    {
      type: "ul",
      items: [
        "**Agua hirviendo directa en el tubo.** Las tuberías de PVC no están hechas para agua tan caliente: pueden deformarse o aflojar sus uniones pegadas. Si quieres ayudar a soltar grasa, usa agua caliente de la llave, no recién hervida.",
        "**Mezclar productos.** Ni dos destapacaños ni destapacaños con cloro, vinagre u otros limpiadores.",
        "**Forzar con alambres rígidos o desarmadores.** Pueden perforar el tubo o rayar la porcelana. Para llegar lejos está la sonda.",
        "**Apretar de más las tuercas del sifón.** Con la mano basta; con pinzas y mucha fuerza se rompen las roscas o se aplastan los empaques.",
      ],
    },
    {
      type: "p",
      text: "Si no sabes de qué material es tu tubería o vas a cambiar un tramo, revisa nuestra guía sobre la [[B04|diferencia entre tubería ppr y pvc]] para saber cuál tienes y cómo se une cada una.",
    },

    { type: "h2", text: "Cómo evitar que se vuelva a tapar" },
    {
      type: "ul",
      items: [
        "**Pon una coladera o rejilla** que atrape el cabello y límpiala seguido.",
        "**Limpia el tapón** cada semana o cada dos semanas, según el uso del lavabo.",
        "**Deja correr agua** un momento después de lavarte los dientes, rasurarte o lavar algo con jabón, para que los residuos no se queden en el sifón.",
        "**No tires restos de comida, grasa, pelusa ni cosméticos espesos** por la coladera.",
        "**Revisa el sifón** de vez en cuando, sobre todo si el agua empieza a bajar más lento: limpiarlo a tiempo es mucho más fácil que destaparlo.",
      ],
    },
    {
      type: "callout",
      variant: "nota",
      title: "Cuándo llamar a un plomero",
      text: "Si se tapan varios desagües a la vez (lavabo, regadera y fregadero), si oyes gorgoteos en otras salidas cuando usas el lavabo, si el agua sube por otra coladera o si el mal olor sigue aunque el sifón esté limpio, el problema puede estar en la tubería general o en el drenaje de la casa. En esos casos lo más seguro es llamar a un plomero.",
    },
    {
      type: "p",
      text: "En Ferretería 57 tenemos lo necesario para destapar y dar mantenimiento al lavabo: chupones, sondas, sifones, empaques y equipo de [Seguridad](" +
        catalogHref("seguridad") +
        "). Si no sabes qué sifón te sirve, llévanos el viejo o una foto y te ayudamos en el mostrador.",
    },
  ],
  faq: [
    {
      q: "¿Cómo destapar un lavabo sin químicos?",
      a: "Primero saca y limpia el tapón, que suele tener cabello pegado. Si sigue tapado, usa un chupón tapando el rebosadero con un trapo húmedo. Si no funciona, desarma el sifón de abajo con una cubeta debajo, límpialo y vuelve a armarlo. Si el tubo de la pared sigue tapado, pasa una sonda girándola sin forzar.",
    },
    {
      q: "¿El destapacaños daña la tubería de PVC?",
      a: "Depende del producto y de cómo se use. Hay destapacaños indicados para tuberías de PVC y otros que no; la etiqueta lo dice. Úsalo solo si es apto para tu tubería, en la cantidad y el tiempo que marca, sin mezclarlo con otros productos y nunca junto con agua hirviendo, que puede deformar el tubo.",
    },
    {
      q: "¿Cómo se limpia el sifón del lavabo?",
      a: "Coloca una cubeta debajo, afloja a mano las dos tuercas del sifón y retíralo. Vacía el agua, saca el cabello y la mugre con un cepillo y enjuágalo. Revisa que los empaques estén en buen estado, vuelve a armarlo apretando a mano y abre la llave para comprobar que no gotee ninguna unión.",
    },
  ],
  guia: { titulo: "Guía de emergencia: lavabo tapado" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B04", "B07", "B13", "B19", "B29", "B32"],
});
