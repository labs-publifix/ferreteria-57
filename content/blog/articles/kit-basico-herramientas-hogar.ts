import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B02 · Pilar · Herramientas y mantenimiento. Regla de redacción del brief:
// conocimiento general estable, sin precios (se remite al catálogo) y solo
// herramientas que existan en el catálogo. Medidas y capacidades se
// remiten a la etiqueta o ficha de cada producto.
// Lanzamiento: se publica al terminarse (el calendario decía 09/10/2026).
export default defineArticle({
  topicId: "B02",
  slug: "kit-basico-herramientas-hogar",
  title: "Kit básico de herramientas para el hogar: las 15 que sí necesitas (y cuáles dejar para después)",
  seoTitle: "Herramientas básicas para el hogar: las 15 esenciales",
  metaDescription:
    "Arma tu caja de herramientas sin gastar de más: 15 herramientas básicas para el hogar, en tres niveles de inversión, con consejos para elegir cada una.",
  keyword: "herramientas básicas para el hogar",
  secondaryKeywords: [
    "caja de herramientas básica",
    "qué herramientas necesito en casa",
    "kit de herramientas para principiantes",
    "herramientas esenciales",
  ],
  cluster: "herramientas-y-mantenimiento",
  pillar: true,
  publishAt: "2026-10-08T11:30:00-06:00",
  updatedAt: "2026-10-08T11:30:00-06:00",
  intro:
    "Las **herramientas básicas para el hogar** son quince, y no hace falta comprarlas todas el mismo día. Con siete herramientas manuales resuelves la mayoría de las reparaciones de una casa: martillo, desarmadores, pinzas, flexómetro, nivel, cutter y llave ajustable. Cuando empiezas a hacer más cosas, sumas un juego de llaves, serrucho, segueta, pistola de silicón y un taladro. Y si te animas a proyectos, llegan el rotomartillo, la caladora y el multímetro. En esta guía te decimos para qué sirve cada una, qué revisar al comprarla y el error más común, para que armes tu caja sin gastar de más.",
  blocks: [
    { type: "h2", text: "Antes de comprar: qué vas a reparar realmente" },
    {
      type: "p",
      text: "El error más caro al armar una caja de herramientas es comprar por catálogo y no por necesidad. Antes de elegir, piensa en lo que de verdad pasa en tu casa: ¿cuelgas cuadros y repisas? ¿Aprietas bisagras y manijas? ¿Cambias regaderas o llaves? ¿Armas muebles? ¿Te toca reparar un contacto o un apagador? Cada respuesta apunta a una herramienta distinta.",
    },
    {
      type: "p",
      text: "Por eso organizamos la lista en tres niveles. El **nivel 1** cubre lo indispensable y conviene tenerlo en cualquier casa. El **nivel 2** llega cuando ya haces más cosas por tu cuenta. El **nivel 3** es para proyectos más grandes. Ir por niveles te deja repartir la inversión en el tiempo y comprar cada herramienta cuando ya sabes qué uso le vas a dar.",
    },
    {
      type: "p",
      text: "Un ejemplo: si vives en un departamento y lo que más haces es colgar cosas, armar muebles y apretar alguna llave que gotea, el nivel 1 y un taladro te cubren casi todo. Si tienes casa con patio, cochera o haces arreglos de carpintería, el nivel 2 completo te va a servir pronto. Y si estás por remodelar, vale la pena pensar desde ahora en el nivel 3. Haz tu lista antes de venir: comprar con un plan siempre sale más barato.",
    },
    {
      type: "callout",
      variant: "nota",
      title: "Sobre precios y medidas",
      text: "No ponemos precios porque cambian con frecuencia: los vigentes están en el catálogo. Las medidas, capacidades y usos de cada herramienta vienen en su etiqueta o ficha; ahí está lo que de verdad la distingue de otra.",
    },

    { type: "h2", text: "Nivel 1: las herramientas básicas para el hogar que no pueden faltar" },
    {
      type: "p",
      text: "Con estas siete resuelves la mayoría de las reparaciones de todos los días. Si vas a empezar de cero, empieza aquí.",
    },
    { type: "h3", text: "1. Martillo" },
    {
      type: "p",
      text: "**Para qué sirve:** clavar, desclavar y ajustar piezas a golpes suaves. **Qué buscar:** un mango que no resbale y un peso cómodo para tu mano; el de uña te deja sacar clavos. **Error común:** usarlo para golpear desarmadores o cinceles que no están hechos para eso. Ve los modelos en [martillos](/buscar?q=martillo).",
    },
    { type: "h3", text: "2. Juego de desarmadores" },
    {
      type: "p",
      text: "**Para qué sirve:** apretar y aflojar tornillos en muebles, chapas, contactos y aparatos. **Qué buscar:** un juego con punta plana y de cruz en varios tamaños; las puntas deben entrar justas en el tornillo. **Error común:** usar una punta más chica que la cabeza del tornillo, que acaba barriéndola. Encuéntralos en [desarmadores](/buscar?q=desarmador).",
    },
    { type: "h3", text: "3. Pinzas" },
    {
      type: "p",
      text: "**Para qué sirve:** sujetar, doblar y cortar alambre o cable. Para empezar, unas de electricista cubren casi todo; unas de punta ayudan en espacios reducidos. **Qué buscar:** que cierren parejo y que el corte sea limpio. **Error común:** usarlas como llave para tuercas: redondean las esquinas. Revisa las opciones en [pinzas](/buscar?q=pinzas).",
    },
    { type: "h3", text: "4. Flexómetro" },
    {
      type: "p",
      text: "**Para qué sirve:** medir antes de comprar o cortar: muebles, cortinas, repisas, tubos. **Qué buscar:** una cinta fácil de leer, con freno, y un largo que te alcance para medir una habitación; el dato viene en la etiqueta. **Error común:** soltar la cinta de golpe; el gancho se afloja y la medida deja de ser exacta. Velos en [flexómetros](/buscar?q=flexometro).",
    },
    { type: "h3", text: "5. Nivel" },
    {
      type: "p",
      text: "**Para qué sirve:** dejar derecho lo que cuelgas o instalas: cuadros, repisas, soportes. **Qué buscar:** burbujas fáciles de ver y un cuerpo que no se doble. **Error común:** confiar en el ojo; una repisa que parece derecha casi nunca lo está.",
    },
    { type: "h3", text: "6. Cutter" },
    {
      type: "p",
      text: "**Para qué sirve:** cortar cartón, cinta, plástico delgado o tablaroca. **Qué buscar:** un cuerpo firme, seguro para la hoja y repuestos fáciles de conseguir. **Error común:** seguir usando una hoja sin filo: obliga a hacer fuerza y es cuando ocurren los cortes en la mano.",
    },
    { type: "h3", text: "7. Llave ajustable" },
    {
      type: "p",
      text: "**Para qué sirve:** apretar tuercas de distintos tamaños, como las de la regadera, el lavabo o un mueble. **Qué buscar:** que la mordaza abra y cierre suave y no tenga juego. **Error común:** dejarla floja sobre la tuerca: se resbala y la redondea. Ajústala bien antes de girar.",
    },
    { type: "cta" },

    { type: "h2", text: "Nivel 2: cuando ya haces más cosas" },
    {
      type: "p",
      text: "Si ya resolviste lo básico y quieres hacer más por tu cuenta, estas cinco abren muchas posibilidades.",
    },
    { type: "h3", text: "8. Juego de llaves" },
    {
      type: "p",
      text: "**Para qué sirve:** apretar tuercas y tornillos con firmeza, sin el juego de una llave ajustable. **Qué buscar:** un juego con las medidas que más usas y que indique si es milimétrico o en pulgadas. **Error común:** mezclar medidas parecidas de distinto sistema: la llave entra, pero se barre la tuerca.",
    },
    { type: "h3", text: "9. Serrucho" },
    {
      type: "p",
      text: "**Para qué sirve:** cortar madera: tablas, polines, repisas. **Qué buscar:** un mango cómodo y un dentado adecuado para el corte que harás; la ficha lo indica. **Error común:** forzarlo: un buen serrucho corta con el movimiento, no con la presión.",
    },
    { type: "h3", text: "10. Segueta" },
    {
      type: "p",
      text: "**Para qué sirve:** cortar metal y plástico: tubo, varilla delgada, perfiles. **Qué buscar:** un arco firme y hojas de repuesto adecuadas al material. **Error común:** poner la hoja al revés; los dientes deben apuntar hacia adelante, en el sentido del corte.",
    },
    { type: "h3", text: "11. Pistola de silicón" },
    {
      type: "p",
      text: "**Para qué sirve:** sellar juntas en baño, cocina, ventanas y tinas. **Qué buscar:** que empuje el cartucho sin trabarse y que libere la presión al soltar el gatillo. **Error común:** aplicar sobre una superficie húmeda o sucia; el sello no pega y hay que repetirlo.",
    },
    { type: "h3", text: "12. Taladro" },
    {
      type: "p",
      text: "**Para qué sirve:** perforar muros, madera o metal y, con la punta adecuada, atornillar. Es la primera herramienta eléctrica que conviene comprar. **Qué buscar:** control de velocidad y, si vas a perforar tabique o concreto, función de percusión; la ficha indica para qué materiales sirve. **Error común:** usar cualquier broca: cada material pide la suya. Antes de perforar, lee nuestra guía de [[B03|tipos de brocas]] y revisa los modelos en [taladros](/buscar?q=taladro).",
    },

    { type: "h2", text: "Nivel 3: para proyectos" },
    {
      type: "p",
      text: "Estas tres no son para todas las casas, pero si remodelas, instalas o haces trabajos frecuentes, te van a ahorrar mucho tiempo.",
    },
    { type: "h3", text: "13. Rotomartillo" },
    {
      type: "p",
      text: "**Para qué sirve:** perforar concreto y piedra con mucha menos fuerza que un taladro común. **Qué buscar:** el tipo de broca que acepta y sus funciones; la ficha indica si también cincela. **Error común:** comprarlo cuando solo perforas tabique de vez en cuando: un taladro con percusión suele bastar.",
    },
    { type: "h3", text: "14. Caladora" },
    {
      type: "p",
      text: "**Para qué sirve:** hacer cortes rectos o curvos en madera, triplay y algunos plásticos o metales delgados. **Qué buscar:** control de velocidad y hojas fáciles de cambiar. **Error común:** usar una sola hoja para todo; cada material pide un tipo de hoja, y lo dice su empaque.",
    },
    { type: "h3", text: "15. Multímetro" },
    {
      type: "p",
      text: "**Para qué sirve:** revisar si llega corriente a un contacto, si una pila sirve o si un fusible está fundido. **Qué buscar:** una pantalla fácil de leer y puntas en buen estado. **Error común:** medir sin saber en qué escala hacerlo; lee el instructivo antes. Si vas a modificar una instalación eléctrica, que la revise un electricista. Ve las opciones en [multímetros](/buscar?q=multimetro).",
    },
    {
      type: "table",
      caption: "Las 15 herramientas básicas por nivel",
      headers: ["Nivel", "Herramientas", "Cuándo dar el paso"],
      rows: [
        ["1. Indispensable", "Martillo, desarmadores, pinzas, flexómetro, nivel, cutter y llave ajustable", "Desde el primer día en cualquier casa"],
        ["2. Haces más cosas", "Juego de llaves, serrucho, segueta, pistola de silicón y taladro", "Cuando ya resuelves reparaciones por tu cuenta"],
        ["3. Proyectos", "Rotomartillo, caladora y multímetro", "Cuando remodelas, instalas o trabajas seguido"],
      ],
    },

    { type: "h2", text: "Seguridad: lo que también va en la caja" },
    {
      type: "p",
      text: "Una caja de herramientas completa incluye lo que te protege mientras trabajas. No son herramientas, pero evitan la mayoría de los accidentes caseros, y cuestan mucho menos que una visita al médico:",
    },
    {
      type: "ul",
      items: [
        "**Lentes de seguridad.** Al perforar, cortar o lijar saltan partículas. Úsalos siempre que trabajes con taladro, segueta, caladora o cincel.",
        "**Guantes de trabajo.** Protegen al cargar material, al cortar y al manejar piezas con filo. Para trabajos eléctricos, revisa en la etiqueta para qué uso están pensados.",
        "**Cubrebocas.** Al perforar concreto o tabique, o al lijar, el polvo fino se queda en el aire. Un cubrebocas sencillo hace la diferencia.",
        "**Protección auditiva.** Si vas a usar rotomartillo o caladora por un buen rato, unos tapones o una orejera cuidan tu oído.",
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Antes de cada trabajo",
      text: "Corta la corriente desde el interruptor antes de tocar un contacto o un apagador, revisa que el cable de tus herramientas eléctricas no tenga cortes y desconéctalas antes de cambiar una broca o una hoja. Si un trabajo eléctrico te genera dudas, llama a un electricista.",
    },

    { type: "h2", text: "Cómo elegir calidad sin pagar de más" },
    {
      type: "p",
      text: "No todas las herramientas merecen la misma inversión. La regla que más repetimos en el mostrador: **invierte más en lo que vas a usar seguido y empieza con lo básico en lo esporádico**. Un juego de desarmadores se usa todo el tiempo y conviene que sea bueno; una caladora que usarás un par de veces puede ser un modelo sencillo.",
    },
    {
      type: "ul",
      items: [
        "**Revisa la ficha, no solo la marca.** Dentro de una misma marca hay modelos sencillos y otros más robustos. Si dudas entre Truper y Pretul, nuestra guía de [[B01|marcas truper]] explica cuándo conviene cada una.",
        "**Prueba el agarre.** Una herramienta incómoda se queda en la caja. En la tienda puedes tomarla en la mano antes de comprar.",
        "**Piensa en los consumibles.** Brocas, hojas de segueta, hojas de cutter y cartuchos de silicón se gastan. Que sean fáciles de conseguir importa tanto como la herramienta.",
        "**No compres un kit enorme por compromiso.** Un juego con decenas de piezas que no vas a usar sale más caro que comprar bien las que sí necesitas.",
      ],
    },

    { type: "h2", text: "Cómo guardar y ordenar tu caja" },
    {
      type: "p",
      text: "Una caja ordenada se usa más y dura más. Unas cuantas costumbres hacen la diferencia:",
    },
    {
      type: "steps",
      items: [
        { title: "Un lugar para cada cosa", text: "Agrupa por uso: medir y marcar, apretar y aflojar, cortar. Así encuentras todo sin vaciar la caja." },
        { title: "Lejos de la humedad", text: "El óxido es el enemigo de las herramientas. Guárdalas secas y, si se mojan, sécalas antes de cerrar la caja." },
        { title: "Filos protegidos", text: "Retrae la hoja del cutter y protege los dientes del serrucho y la segueta: duran más y evitas cortes al meter la mano." },
        { title: "Las eléctricas, con su estuche", text: "Guarda taladro y caladora con sus accesorios y revisa el cable antes de cada uso." },
      ],
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Arma tu kit con asesoría",
      text: "Si no sabes por dónde empezar, ven al mostrador de Ferretería 57 con la lista de lo que quieres reparar. Te ayudamos a armar tu kit por niveles, con lo que de verdad vas a usar.",
    },
    {
      type: "p",
      text: "Encuentra todo en nuestra categoría de [herramienta](" + catalogHref("herramienta") + ") o pregúntanos en la tienda.",
    },
  ],
  faq: [
    {
      q: "¿Qué herramientas básicas debe tener una casa?",
      a: "Para empezar, siete: martillo, juego de desarmadores, pinzas, flexómetro, nivel, cutter y llave ajustable. Con ellas resuelves la mayoría de las reparaciones de todos los días. Después puedes sumar un juego de llaves, serrucho, segueta, pistola de silicón y un taladro, y para proyectos más grandes, rotomartillo, caladora y multímetro.",
    },
    {
      q: "¿Cuánto cuesta armar una caja de herramientas básica?",
      a: "Depende de los modelos que elijas y de cuántos niveles armes. Los precios cambian con frecuencia, así que los vigentes están en nuestro catálogo en línea. Una buena estrategia es empezar con las siete indispensables, invertir más en las que usarás seguido y sumar las demás cuando las necesites.",
    },
    {
      q: "¿Qué herramienta eléctrica conviene comprar primero?",
      a: "El taladro. Con las brocas correctas perfora madera, metal y muros, y con una punta de desarmador también atornilla. Si vas a perforar tabique o concreto, revisa en la ficha que tenga función de percusión. El rotomartillo conviene después, solo si perforas concreto con frecuencia.",
    },
    {
      q: "¿Conviene comprar un kit armado o pieza por pieza?",
      a: "Un kit armado es práctico si incluye las herramientas que de verdad vas a usar. Si trae muchas piezas que no necesitas, sale mejor comprar pieza por pieza, empezando por las indispensables. En el mostrador te ayudamos a comparar y a armar tu kit según lo que vas a reparar.",
    },
  ],
  guia: { titulo: "Checklist: caja de herramientas básica del hogar" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B01", "B03", "B09", "B10", "B20"],
});
