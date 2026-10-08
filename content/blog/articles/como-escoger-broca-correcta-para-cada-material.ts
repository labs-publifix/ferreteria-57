import { catalogHref, catalogName } from "@/content/blog/catalog-links";
import { defineArticle } from "@/lib/blog/article-schema";

// B03 · Pilar · Construcción, fijación y materiales. Brief: hoja "Briefs
// SEO" de docs/blog/backlog_blog_ferreteria57.xlsx. Regla de redacción:
// conocimiento general estable; diámetros y velocidades se remiten al
// empaque de la broca y al manual del taladro (sin cifras ni normas).
export default defineArticle({
  topicId: "B03",
  slug: "como-escoger-broca-correcta-para-cada-material",
  title: "Cómo escoger el tamaño y tipo de broca correcto para cada material",
  seoTitle: "Cómo escoger la broca correcta según el material",
  metaDescription:
    "Aprende qué broca usar en concreto, madera, metal, tablaroca o azulejo, cómo elegir el diámetro y evita dañar tus muros o romper el material.",
  keyword: "tipos de brocas",
  secondaryKeywords: [
    "qué broca usar para concreto",
    "broca para pared",
    "brocas para metal",
    "brocas para madera",
    "broca para azulejo",
    "tamaño de broca para taquete",
  ],
  cluster: "construccion-fijacion-y-materiales",
  pillar: true,
  // Lanzamiento: se publica junto con B01 (el calendario decía 09/10/2026).
  publishAt: "2026-10-08T11:00:00-06:00",
  updatedAt: "2026-10-08T11:30:00-06:00",
  intro:
    "Hay muchos **tipos de brocas** y cada una está hecha para un material: para concreto y tabique usa una broca de carburo de tungsteno con percusión; para madera, una broca de punta, de paleta o una sierra copa; para metal, una broca HSS; para azulejo y porcelanato, una broca específica para cerámica y sin percusión; y para tablaroca, una broca para madera o metal sin golpe. El tamaño lo decide el taquete: la broca debe tener su mismo diámetro y perforar un poco más profundo que su largo. Aquí te explicamos cómo reconocer cada una y cómo usarla sin romper nada.",
  blocks: [
    { type: "h2", text: "Por qué importa elegir la broca correcta" },
    {
      type: "p",
      text: "Una broca equivocada casi nunca falla de golpe: falla poco a poco. Primero tarda mucho en avanzar, luego se calienta, después pierde el filo y al final deja un agujero más ancho de lo que necesitabas o no perfora nada. Mientras tanto, tú haces más presión, el taladro trabaja forzado y el material sufre.",
    },
    { type: "p", text: "Estos son los daños más comunes cuando la broca no corresponde al material:" },
    {
      type: "ul",
      items: [
        "**Muros despostillados o agrietados.** Una broca para madera en concreto no corta: raspa. Con la presión, el borde del agujero se rompe y el taquete ya no queda firme.",
        "**Azulejos y porcelanatos estrellados.** La percusión o una punta que patina sobre el esmalte pueden partir la pieza completa, y reponer un azulejo es mucho más caro que una broca adecuada.",
        "**Metal endurecido y brocas quemadas.** Si perforas acero con una broca que no es para metal, o con demasiada velocidad, la punta se pone azul y pierde el filo para siempre.",
        "**Madera astillada.** Una broca para concreto en madera arranca fibras en lugar de cortarlas y deja la salida del agujero rota.",
        "**Taquetes flojos.** Si el diámetro no coincide con el del taquete, este gira en el agujero o no entra, y lo que cuelgues no quedará seguro.",
      ],
    },
    {
      type: "p",
      text: "Elegir bien no es complicado: basta con identificar el material, escoger la familia de broca que le corresponde y respetar lo que indica el empaque. Ese es el orden que seguiremos en esta guía.",
    },

    { type: "h2", text: "Tipos de brocas por material: concreto, madera, metal, azulejo y tablaroca" },
    {
      type: "p",
      text: "Antes de comprar, toca el muro o la pieza que vas a perforar y pregúntate de qué está hecha. En casa, lo más común es encontrar concreto, tabique, block, madera, tablaroca, azulejo y lámina o perfiles metálicos. Cada uno tiene su broca.",
    },
    { type: "h3", text: "Concreto, tabique y mampostería" },
    {
      type: "p",
      text: "Para muros de concreto, tabique rojo, block y piedra se usa una broca con punta de **carburo de tungsteno**: una pastilla muy dura soldada en la punta, que se reconoce porque es más ancha que el cuerpo y tiene forma de cuña. Esta broca trabaja junto con la **percusión** del taladro, es decir, un golpeteo rápido que va triturando el material mientras la broca gira y saca el polvo por sus estrías.",
    },
    {
      type: "p",
      text: "En Querétaro y en buena parte del Bajío muchas casas tienen muros de concreto y de tabique, materiales duros en los que una broca para mampostería hace toda la diferencia. Si tu muro es de tabique hueco o block, la broca es la misma, pero el taquete cambia: en esos muros conviene un taquete pensado para huecos, porque uno común puede no tener dónde expandirse.",
    },
    { type: "h3", text: "Madera" },
    {
      type: "p",
      text: "Para madera hay tres opciones principales, según el tamaño y el acabado del agujero:",
    },
    {
      type: "ul",
      items: [
        "**Broca de punta (o de centro).** Tiene una punta fina al centro que se clava y guía la perforación, y dos filos laterales que cortan limpio. Es la indicada para agujeros de tornillos, pijas y tarugos.",
        "**Broca de paleta (o de pala).** Es plana, con una punta al centro. Sirve para agujeros más anchos, por ejemplo para pasar cables o tubería por un mueble. Es rápida, aunque el acabado es más rústico.",
        "**Sierra copa.** Es un anillo con dientes y una broca guía al centro. Corta un círculo completo y es la opción para agujeros grandes, como los de una chapa, una salida de tubo o una caja eléctrica en un mueble.",
      ],
    },
    { type: "h3", text: "Metal" },
    {
      type: "p",
      text: "Para lámina, perfiles, ángulos y la mayoría de los metales de uso común se usa una broca de **acero rápido**, conocida como **HSS** por sus siglas en inglés. Tiene punta cónica y estrías en espiral a todo lo largo. Algunas traen recubrimientos (como titanio o cobalto) que las hacen durar más en metales duros. El metal se perfora siempre **sin percusión**, con velocidad moderada y, en piezas gruesas, con unas gotas de aceite de corte para que la broca no se caliente.",
    },
    {
      type: "p",
      text: "Las brocas HSS también perforan madera y plástico sin problema, así que son una buena base para la caja de herramientas. Lo que no hacen bien es perforar concreto: ahí se desafilan en segundos.",
    },
    { type: "h3", text: "Vidrio, azulejo y porcelanato" },
    {
      type: "p",
      text: "Para azulejo, porcelanato y vidrio se usa una **broca para cerámica o vidrio**, con punta de carburo en forma de lanza o, en materiales muy duros como el porcelanato, una broca de recubrimiento de diamante. La regla de oro es perforar **sin percusión**, con poca velocidad y presión suave: el golpeteo es lo que estrella las piezas.",
    },
    {
      type: "p",
      text: "Si después del azulejo hay concreto o tabique, perfora primero la pieza con la broca para cerámica y, una vez que atravesaste el esmalte, cambia a la broca para concreto y activa la percusión para el resto del muro.",
    },
    { type: "h3", text: "Tablaroca" },
    {
      type: "p",
      text: "La tablaroca es suave, así que no necesita una broca especial: una broca para madera o una HSS la perforan sin esfuerzo y **sin percusión**. Lo importante en tablaroca no es la broca, sino el taquete: como el panel es delgado y hueco por detrás, necesita un taquete especial para tablaroca que se abra o se ancle detrás del panel. Si vas a colgar algo pesado, lo más seguro es localizar el bastidor metálico o de madera que hay detrás y fijar ahí.",
    },
    {
      type: "table",
      caption: "Qué broca usar según el material",
      headers: ["Material", "Broca", "Consejo de uso"],
      rows: [
        ["Concreto, tabique y piedra", "Carburo de tungsteno para mampostería", "Con percusión. Saca la broca de vez en cuando para limpiar el polvo del agujero."],
        ["Block y tabique hueco", "Carburo de tungsteno para mampostería", "Con percusión suave; usa un taquete para muro hueco."],
        ["Madera", "De punta, de paleta o sierra copa", "Sin percusión. Apoya una tabla por detrás para que la salida no se astille."],
        ["Metal y lámina", "Acero rápido (HSS)", "Sin percusión, velocidad moderada y aceite de corte en piezas gruesas."],
        ["Azulejo y porcelanato", "Para cerámica o de diamante", "Sin percusión, poca velocidad y presión suave hasta cruzar el esmalte."],
        ["Vidrio", "Para vidrio (punta de lanza)", "Sin percusión, muy despacio y con agua para enfriar la zona."],
        ["Tablaroca", "Para madera o HSS", "Sin percusión; el agarre lo da el taquete para tablaroca."],
      ],
    },
    { type: "cta" },

    { type: "h2", text: "Partes de una broca: vástago, punta, estrías y recubrimientos" },
    {
      type: "p",
      text: "Conocer las partes de una broca te ayuda a reconocerla en el anaquel y a saber si todavía sirve. Toda broca tiene, de atrás hacia adelante, tres zonas:",
    },
    {
      type: "ul",
      items: [
        "**Vástago.** Es la parte lisa que entra en el mandril del taladro. La mayoría son cilíndricos; algunos son hexagonales para que no patinen, y los rotomartillos usan un vástago con ranuras (conocido como SDS) que solo entra en esas máquinas.",
        "**Estrías.** Son los canales en espiral del cuerpo. Su trabajo es sacar el polvo o la viruta del agujero. Si se tapan, la broca se calienta y avanza menos.",
        "**Punta.** Es la parte que corta. En las de concreto es una pastilla de carburo en forma de cuña; en las de metal, un cono afilado; en las de madera, una punta fina que guía el corte.",
      ],
    },
    {
      type: "p",
      text: "Los **recubrimientos** son la capa de color que traen algunas brocas. Un acabado dorado suele indicar titanio, que reduce la fricción; uno con cobalto aguanta más calor en metales duros; y el diamante se reserva para porcelanato, vidrio y piedra muy dura. El tipo de material para el que sirve cada broca viene impreso en su empaque: léelo antes de comprar, porque dos brocas pueden verse parecidas y estar hechas para trabajos muy distintos.",
    },
    {
      type: "callout",
      variant: "nota",
      text: "Una broca para concreto desgastada se reconoce porque la pastilla de la punta se ve redondeada o despostillada. Una de metal, porque la punta brilla o cambió de color. Si avanza muy lento aunque uses la técnica correcta, es momento de cambiarla.",
    },

    { type: "h2", text: "Cómo elegir el diámetro y la profundidad: broca, taquete y tornillo" },
    {
      type: "p",
      text: "Para colgar algo en un muro de concreto o tabique, lo que realmente sostiene el peso es el trío **broca, taquete y tornillo**. Si uno de los tres no corresponde, el conjunto falla. La regla general es sencilla:",
    },
    {
      type: "ol",
      items: [
        "**Elige primero el taquete** según el muro y el peso de lo que vas a colgar.",
        "**Usa una broca del mismo diámetro que el taquete.** La medida viene marcada en el empaque del taquete y en el cuerpo o empaque de la broca.",
        "**Perfora un poco más profundo que el largo del taquete**, para que entre completo y el polvo que quede al fondo no lo empuje hacia afuera.",
        "**Escoge el tornillo que indica el empaque del taquete**: si es muy delgado, el taquete no se expande; si es muy grueso, puede romperlo o agrietar el muro.",
      ],
    },
    {
      type: "p",
      text: "Si la broca es más ancha que el taquete, este quedará flojo y girará cuando atornilles. Si es más delgada, el taquete no entrará o se doblará al meterlo a golpes. En caso de duda, lleva el taquete contigo al mostrador y compáralo contra la broca: el cuerpo del taquete y la broca deben verse del mismo grosor.",
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Marca la profundidad antes de perforar",
      text: "Pon el taquete junto a la broca, mide su largo y enrolla un pedazo de cinta adhesiva en la broca un poco más atrás de esa medida. Cuando la cinta toque el muro, ya tienes la profundidad correcta. Algunos taladros traen un tope de profundidad que hace lo mismo.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Marca y revisa el punto",
          text: "Marca con lápiz dónde va el agujero y asegúrate de que no pasen tuberías ni cables por ahí. Si tienes un detector de metales, úsalo.",
        },
        {
          title: "Coloca la broca correcta",
          text: "Pon en el taladro la broca del material y del diámetro del taquete. Apriétala bien en el mandril y marca la profundidad.",
        },
        {
          title: "Empieza despacio",
          text: "Inicia a baja velocidad y sin percusión hasta que la broca muerda la superficie y no se mueva del punto marcado.",
        },
        {
          title: "Perfora con la técnica del material",
          text: "En concreto y tabique activa la percusión; en azulejo, metal, madera y tablaroca, déjala apagada. Mantén el taladro derecho, sin ladearlo.",
        },
        {
          title: "Limpia el agujero",
          text: "Saca la broca girando, sopla o aspira el polvo y revisa que el agujero quede limpio hasta el fondo.",
        },
        {
          title: "Coloca taquete y tornillo",
          text: "Mete el taquete hasta que quede al ras del muro, coloca la pieza y atornilla con el tornillo que indica el empaque, sin forzar de más.",
        },
      ],
    },

    { type: "h2", text: "Taladro, taladro percutor o rotomartillo: cuál va con cada broca" },
    {
      type: "p",
      text: "La broca y la herramienta trabajan en equipo. Una buena broca para concreto en un taladro sin percusión avanzará muy poco, y una broca para azulejo en un rotomartillo romperá la pieza. Así se reparten el trabajo:",
    },
    {
      type: "ul",
      items: [
        "**Taladro (sin percusión).** Solo gira. Es el indicado para madera, metal, plástico, tablaroca, azulejo y vidrio. También sirve como desarmador si tiene control de velocidad y de torque.",
        "**Taladro percutor (o rotomartillo ligero).** Gira y además golpea. Tiene un selector para activar o desactivar la percusión, así que sirve tanto para concreto y tabique como para los demás materiales. Es la opción más versátil para casa.",
        "**Rotomartillo.** Su golpe es mucho más fuerte y usa brocas de vástago SDS. Es la herramienta para perforar mucho concreto, hacer agujeros grandes o trabajar a diario en obra.",
      ],
    },
    {
      type: "table",
      caption: "Qué herramienta usar con cada tipo de broca",
      headers: ["Herramienta", "Brocas con las que trabaja", "Ideal para"],
      rows: [
        ["Taladro", "Madera, HSS, cerámica y vidrio", "Muebles, metal, tablaroca y azulejo"],
        ["Taladro percutor", "Todas las anteriores y mampostería", "Casa y mantenimiento, incluidos muros de concreto"],
        ["Rotomartillo", "Mampostería con vástago SDS", "Obra y perforación frecuente de concreto"],
      ],
    },
    {
      type: "p",
      text: "La velocidad adecuada para cada broca y cada material viene en el manual del taladro y, muchas veces, en el empaque de la broca. Como regla general, a mayor diámetro y mayor dureza del material, menor velocidad.",
    },

    { type: "h2", text: "Errores comunes al perforar (y cómo evitarlos)" },
    {
      type: "p",
      text: "La mayoría de los problemas al perforar no vienen de la broca, sino de cómo se usa. Estos son los errores que más vemos en el mostrador:",
    },
    {
      type: "ul",
      items: [
        "**Usar demasiada velocidad.** Calienta la broca y le quita el filo, sobre todo en metal. Empieza lento y sube solo si el material lo permite.",
        "**Empujar con todo el cuerpo.** La presión debe ser firme y constante, no excesiva. Si tienes que apoyarte con todo tu peso, la broca no es la correcta o ya está desgastada.",
        "**No marcar el punto.** La broca patina, sobre todo en azulejo y metal. Marca con lápiz y, en metal, haz una pequeña marca con un punzón para que la broca no se mueva.",
        "**No limpiar el polvo.** El polvo atorado en el agujero frena la broca y luego impide que el taquete entre completo. Saca la broca de vez en cuando mientras perforas y limpia al terminar.",
        "**Dejar la percusión encendida en el material equivocado.** En azulejo, vidrio, madera y metal, la percusión solo daña. Revisa el selector antes de empezar.",
        "**Ladear el taladro.** Un agujero chueco hace que el taquete quede torcido y lo que cuelgues no quede nivelado. Mantén el taladro perpendicular al muro.",
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Antes de perforar, revisa qué hay detrás del muro",
      text: "Evita perforar en línea recta arriba o abajo de contactos, apagadores y llaves de agua, porque por ahí suelen pasar cables y tuberías. Usa lentes de seguridad para protegerte del polvo y de las astillas, y desconecta el taladro antes de cambiar la broca. Si el trabajo es en una instalación eléctrica, de gas o en un muro de carga, consulta a un profesional.",
    },
    {
      type: "p",
      // Taquete y tornillo no tienen categoría propia en el catálogo: se
      // quedan en la búsqueda. Brocas, taladros, rotomartillos y sierras copa
      // viven en Herramienta (content/blog/catalog-links.ts).
      text: `Con la broca correcta, la técnica adecuada y el trío completo de broca, [taquete](/buscar?q=taquete) y [tornillo](/buscar?q=tornillo), cualquier perforación en casa queda firme a la primera. Brocas, taladros, rotomartillos y sierras copa los encuentras en nuestra categoría de [${catalogName("herramienta")}](${catalogHref("herramienta")}); si dudas entre una broca Truper y una Pretul, nuestra guía de [[B01|marcas truper]] te ayuda a decidir según el uso. Si estás armando tu caja desde cero, revisa también nuestra lista de [[B02|herramientas básicas para el hogar]]. Y si tienes dudas, llévanos el taquete o una foto del muro: en el mostrador de Ferretería 57 te ayudamos a elegir.`,
    },
  ],
  faq: [
    {
      q: "¿Qué broca se usa para perforar concreto?",
      a: "Para concreto se usa una broca para mampostería con punta de carburo de tungsteno, que se reconoce por la pastilla en forma de cuña en la punta. Funciona con un taladro percutor o un rotomartillo con la percusión activada, porque el golpeteo es lo que va triturando el concreto. Saca la broca de vez en cuando para limpiar el polvo y respeta la velocidad que indica el manual de tu taladro.",
    },
    {
      q: "¿Cómo sé qué diámetro de broca necesito para un taquete?",
      a: "La broca debe tener el mismo diámetro que el taquete, y esa medida viene marcada en el empaque del taquete y en la broca. Perfora un poco más profundo que el largo del taquete para que entre completo. Si tienes dudas, compara el taquete contra la broca: deben verse del mismo grosor. Después usa el tornillo que recomienda el mismo empaque del taquete.",
    },
    {
      q: "¿Se puede usar la misma broca para madera y para metal?",
      a: "Sí, en parte. Una broca HSS para metal también perfora madera y plástico, así que es muy práctica para tener en casa. Al revés no funciona: una broca para madera se desafila rápido en metal. Para acabados finos en madera conviene una broca de punta, y para agujeros grandes, una broca de paleta o una sierra copa.",
    },
  ],
  guia: { titulo: "Tabla rápida: broca, taquete y tornillo por material" },
  relatedTopicIds: ["B09", "B20", "B42", "B47", "B02", "B01"],
});
