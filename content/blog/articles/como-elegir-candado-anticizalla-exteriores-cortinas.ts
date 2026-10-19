import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B12 · Fondo · Seguridad y protección (pilar del clúster). Regla de
// redacción del brief: criterios generales de compra; no se promete
// «inviolable», no se citan estadísticas ni grados de seguridad específicos.
// Las medidas (diámetro del arco, ancho del cuerpo) se remiten al empaque.
// Contexto del Bajío solo cualitativo. Sin marcas: categorías y búsquedas.
export default defineArticle({
  topicId: "B12",
  slug: "como-elegir-candado-anticizalla-exteriores-cortinas",
  title: "Cómo elegir un candado anticizalla para exteriores y cortinas de negocio",
  seoTitle: "Candado anticizalla: cómo elegirlo para exterior",
  metaDescription:
    "Qué hace seguro a un candado anticizalla, cómo elegir tamaño, material y resistencia a la intemperie para cortinas, rejas y portones.",
  keyword: "candado anticizalla",
  secondaryKeywords: [
    "candado para cortina de negocio",
    "mejor candado para exterior",
    "candado resistente a la intemperie",
    "candado de alta seguridad",
    "candado para reja",
  ],
  cluster: "seguridad-y-proteccion",
  pillar: true,
  publishAt: "2026-10-20T08:00:00-06:00",
  updatedAt: "2026-10-20T08:00:00-06:00",
  intro:
    "Un **candado anticizalla** está diseñado para que su arco sea difícil de cortar con cizalla, la herramienta más usada para forzar candados. Lo logra con un arco de acero endurecido, un cuerpo que lo protege y un cierre que traba el arco por los dos lados. Para elegir el adecuado en una cortina de negocio, una reja o un portón hay que revisar cuatro cosas: qué tanto arco queda expuesto, de qué material es el cuerpo, si aguanta la intemperie y si su tamaño corresponde al portacandado donde lo vas a poner. Ningún candado es imposible de abrir; uno bien elegido retrasa y desanima a quien lo intenta, y eso es lo que buscas.",
  blocks: [
    { type: "h2", text: "Qué es un candado anticizalla y por qué importa" },
    {
      type: "p",
      text: "La forma más rápida de abrir un candado sin llave no es abrir la cerradura: es cortar el arco. Una cizalla grande corta sin esfuerzo el arco de un candado común, sobre todo si es delgado y queda mucho espacio libre entre el arco y el cuerpo. Un candado anticizalla combate justo eso:",
    },
    {
      type: "ul",
      items: [
        "**Arco de acero endurecido:** más difícil de cortar que un arco de acero sin tratamiento.",
        "**Arco protegido:** el cuerpo tiene hombros altos o cubre casi todo el arco, así que no hay dónde meter las mandíbulas de la cizalla.",
        "**Doble trabado:** el arco queda sujeto por los dos lados dentro del cuerpo, lo que también dificulta abrirlo haciendo palanca o girándolo.",
      ],
    },
    {
      type: "p",
      text: "En un negocio con cortina metálica, una bodega o un portón que da a la calle, el candado suele ser lo único entre la herramienta y lo que guardas. Por eso vale la pena elegirlo con criterio y no solo por el tamaño.",
    },
    {
      type: "callout",
      variant: "nota",
      title: "Ningún candado es inviolable",
      text: "Desconfía de cualquier producto que se anuncie como imposible de abrir. Un buen candado gana tiempo y hace más ruidoso y difícil el intento; la seguridad completa la dan también el portacandado, la iluminación, la cortina y las rutinas de cierre.",
    },

    { type: "h2", text: "Partes del candado: cuerpo, arco, protección y cerradura" },
    {
      type: "p",
      text: "Conocer las partes te ayuda a comparar dos candados en el mostrador, aunque se vean parecidos:",
    },
    {
      type: "ul",
      items: [
        "**Cuerpo:** la pieza que guarda el mecanismo. Un cuerpo macizo y ancho suele alojar un mecanismo más robusto y resistir mejor los golpes.",
        "**Arco o grillete:** la pieza en forma de U que pasa por el portacandado. Su grosor y su material son los que deciden qué tan difícil es cortarlo.",
        "**Protección del arco:** hombros, cubiertas o diseños de arco oculto que dejan poco arco a la vista. Es lo que distingue a un candado anticizalla.",
        "**Cerradura:** el cilindro donde entra la llave. Las de mayor seguridad usan llaves más complejas y piezas internas pensadas para dificultar la ganzúa; el empaque indica el tipo de cerradura.",
      ],
    },
    {
      type: "p",
      text: "Revisa también detalles prácticos: si la llave solo sale con el candado cerrado (así no lo dejas abierto por descuido), si trae tapa para el ojo de la llave y cuántas llaves incluye.",
    },
    { type: "cta" },
    {
      type: "p",
      text: "La guía se descarga gratis siendo miembro. Si todavía no lo eres, te contamos cómo funciona [[B10|Club 57 de Ferretería 57]] y qué recibes al registrarte.",
    },

    { type: "h2", text: "Materiales y acabados: el mejor candado para exterior" },
    {
      type: "p",
      text: "Un candado de exterior pasa el año entre sol, polvo y lluvia. En el Bajío, la temporada de lluvias y el polvo del resto del año son los que más castigan el mecanismo, así que el material importa tanto como la resistencia al corte.",
    },
    {
      type: "table",
      caption: "Materiales comunes del cuerpo y del arco",
      headers: ["Material", "Ventaja", "Lo que hay que cuidar"],
      rows: [
        ["Latón (cuerpo)", "No se oxida; aguanta bien la humedad", "Es más blando que el acero ante golpes"],
        ["Acero laminado o macizo (cuerpo)", "Muy resistente a golpes y palanca", "Necesita recubrimiento o funda para no oxidarse"],
        ["Acero endurecido (arco)", "Más difícil de cortar", "Si no tiene recubrimiento, puede oxidarse por fuera"],
        ["Acero inoxidable (arco o cuerpo)", "Resiste muy bien la corrosión", "Confirma en el empaque si además es endurecido"],
      ],
    },
    {
      type: "p",
      text: "Para un **candado resistente a la intemperie** busca acabados cromados o niquelados, funda o cubierta plástica que proteja el cuerpo y una tapa que cubra el ojo de la llave para que no entre agua ni polvo. El empaque indica si el candado está pensado para exterior; si no lo dice, piensa que es para interior.",
    },

    { type: "h2", text: "Tamaño del cuerpo y grosor del arco: cómo elegir" },
    {
      type: "p",
      text: "Más grande no siempre es mejor: el candado tiene que entrar en el portacandado y dejar el menor espacio libre posible. Sigue este orden:",
    },
    {
      type: "steps",
      items: [
        {
          title: "Mide el orificio del portacandado",
          text: "El arco debe pasar con holgura mínima. Un arco que no entra no sirve, y uno muy delgado para el orificio es más fácil de cortar.",
        },
        {
          title: "Elige el arco más grueso que quepa",
          text: "El grosor del arco se indica en el empaque. Entre dos candados que entren bien, el de arco más grueso y protegido resiste más.",
        },
        {
          title: "Prefiere arco corto",
          text: "Un arco corto deja poco espacio para meter herramientas. Usa arco largo solo cuando de verdad lo necesites, por ejemplo para una cadena o un pasador grueso.",
        },
        {
          title: "Compara el cuerpo",
          text: "Con arcos parecidos, el cuerpo más ancho y macizo suele tener un mecanismo más fuerte y aguanta mejor los golpes.",
        },
      ],
    },
    {
      type: "p",
      text: "Si tienes duda, llévanos una foto del portacandado o de la cortina con alguna referencia de tamaño, como una moneda junto al orificio. En la sección de [Cerrajería](" +
        catalogHref("cerrajeria") +
        ") y buscando [candado](/buscar?q=candado) ves las opciones disponibles.",
    },

    { type: "h2", text: "Cuál usar en cortina, reja, portón o bodega" },
    {
      type: "table",
      caption: "Qué candado conviene según el lugar",
      headers: ["Lugar", "Lo que conviene", "Revisa también"],
      rows: [
        ["Cortina metálica de negocio", "Candado anticizalla de arco corto o protegido que entre justo en las orejas de la cortina", "Que las orejas y el riel estén firmes y sin óxido"],
        ["Reja o puerta de herrería", "Candado de arco corto en portacandado soldado o atornillado por dentro", "Que los tornillos del portacandado no queden por fuera"],
        ["Portón con cadena", "Candado de arco largo y cadena de eslabón grueso de acero endurecido", "Que la cadena no sea más delgada que el arco del candado"],
        ["Bodega o cuarto de servicio", "Candado de cuerpo macizo con tapa para el ojo de la llave", "Quién tiene copia de la llave"],
      ],
    },
    {
      type: "p",
      text: "Un **candado para cortina de negocio** debe quedar justo en el portacandado, sin juego, para que no se pueda girar ni hacer palanca. Algunas cortinas usan, además, un pasador o chapa propia: combinarlos da una capa más de seguridad. Para cadenas y pasadores revisa [cadena](/buscar?q=cadena) y [pasador](/buscar?q=pasador).",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "El punto débil casi nunca es el candado",
      text: "Un candado excelente en un portacandado delgado o atornillado por fuera se vence quitando los tornillos o cortando la lámina. Antes de invertir en el candado, revisa que el portacandado, la aldaba o las orejas de la cortina sean igual de fuertes. Si hay que reforzar, en [Herrería](" +
        catalogHref("herreria") +
        ") encuentras lo necesario.",
    },

    { type: "h2", text: "Mantenimiento: lubricar y cuidar el cierre" },
    {
      type: "p",
      text: "Un candado de exterior que no se mantiene termina atorándose justo el día que tienes prisa. Con poco esfuerzo dura mucho más:",
    },
    {
      type: "ul",
      items: [
        "**Lubrica la cerradura y el arco** con un lubricante para cerraduras, como grafito o el que indique el fabricante. Evita aceites de cocina o grasas espesas: juntan polvo y terminan trabando el mecanismo. Busca [lubricante](/buscar?q=lubricante).",
        "**Hazlo antes y después de la temporada de lluvias**, y cada vez que la llave empiece a entrar con dificultad.",
        "**Ábrelo y ciérralo de vez en cuando** si es un candado que casi no se usa, para que el mecanismo no se pegue.",
        "**Limpia el polvo** del ojo de la llave y mantén la tapa cerrada.",
        "**No fuerces la llave.** Si se atora, lubrica y prueba de nuevo; forzarla puede romperla dentro del cilindro.",
      ],
    },
    {
      type: "p",
      text: "Si el arco o el cuerpo ya tienen óxido que se descarapela, o la llave gira con juego, es momento de cambiar el candado: un mecanismo dañado es más fácil de abrir y puede dejarte fuera.",
    },

    { type: "h2", text: "Mini auditoría de seguridad: 8 puntos de tu local o casa" },
    {
      type: "p",
      text: "Un **candado de alta seguridad** rinde más cuando el resto del acceso está a la altura. Revisa estos ocho puntos con calma, de preferencia de noche y desde la calle:",
    },
    {
      type: "ol",
      items: [
        "**Accesos:** cuenta todas las entradas (cortina, puerta, reja, portón, azotea) y confirma que cada una cierra bien.",
        "**Candados:** revisa que sean para exterior, que no tengan óxido y que el arco quede ajustado al portacandado.",
        "**Portacandados y aldabas:** firmes, sin tornillos por fuera y de un grosor parecido al del arco.",
        "**Cortinas:** que corran bien, que el riel y las orejas no estén flojos y que el pasador o la chapa funcionen.",
        "**Rejas y ventanas:** sin barrotes flojos ni soldaduras rotas.",
        "**Iluminación:** que la entrada quede bien iluminada de noche, sin rincones oscuros junto a la cortina o el portón.",
        "**Llaves:** sabes cuántas copias hay y quién las tiene; cambia el candado si una se perdió.",
        "**Rutina de cierre:** una sola persona responsable de revisar que todo quede cerrado, siempre en el mismo orden.",
      ],
    },
    {
      type: "p",
      text: "Anota lo que encuentres y atiende primero lo que esté roto o abierto, luego lo que esté débil. La guía descargable trae esta revisión ampliada a 20 puntos y un plan de mejora por prioridades. Para más opciones de protección, revisa la sección de [Seguridad](" +
        catalogHref("seguridad") +
        ").",
    },
  ],
  faq: [
    {
      q: "¿Qué significa que un candado sea anticizalla?",
      a: "Significa que está diseñado para que su arco sea difícil de cortar con cizalla. Suele combinar un arco de acero endurecido, un cuerpo que lo protege y deja poco arco a la vista y un cierre que lo traba por los dos lados. No lo hace imposible de abrir, pero sí más lento y difícil.",
    },
    {
      q: "¿Qué candado es mejor para una cortina metálica?",
      a: "Uno anticizalla de arco corto o protegido que entre justo en las orejas de la cortina, sin juego, para que no se pueda girar ni hacer palanca. Que sea para exterior y tenga tapa en el ojo de la llave. Revisa también que las orejas y el riel de la cortina estén firmes.",
    },
    {
      q: "¿Los candados de latón o de acero resisten la lluvia?",
      a: "El latón no se oxida y aguanta bien la humedad, aunque es más blando ante golpes. El acero es más resistente, pero necesita recubrimiento o funda para no oxidarse; el acero inoxidable resiste mejor la corrosión. En cualquier caso, busca uno indicado para exterior y lubrícalo antes y después de la temporada de lluvias.",
    },
  ],
  guia: { titulo: "Auditoría de seguridad básica para casa o negocio" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B02", "B01", "B22", "B26", "B34", "B36", "B45"],
});
