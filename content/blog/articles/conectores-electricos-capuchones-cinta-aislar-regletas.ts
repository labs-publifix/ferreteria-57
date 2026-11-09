import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B16 · Corto · Electricidad e iluminación. Regla de redacción del brief:
// conocimiento general; la capacidad de cada conector (calibres, número de
// cables, corriente) se remite al empaque. Empalmes siempre con la energía
// desconectada y comprobada con probador, y dentro de cajas de registro.
export default defineArticle({
  topicId: "B16",
  slug: "conectores-electricos-capuchones-cinta-aislar-regletas",
  title: "Conectores eléctricos: cuándo usar capuchones, cinta de aislar o regletas (clemas)",
  seoTitle: "Conectores eléctricos: capuchones, regletas y cinta",
  metaDescription:
    "Cuándo usar capuchones, regletas (clemas) o cinta de aislar para unir cables de forma segura en casa o taller. Ventajas y errores comunes.",
  keyword: "conectores eléctricos",
  secondaryKeywords: [
    "cómo unir cables eléctricos",
    "capuchones eléctricos",
    "regletas clemas",
    "empalmar cables",
    "cinta de aislar o capuchón",
  ],
  cluster: "electricidad-e-iluminacion",
  pillar: false,
  publishAt: "2026-10-29T08:00:00-06:00",
  updatedAt: "2026-10-29T08:00:00-06:00",
  intro:
    "Los **conectores eléctricos** sirven para unir cables de forma firme y aislada, y elegir el correcto depende de qué vas a conectar. Los capuchones (conectores de rosca) son la opción común para unir cables dentro de una caja de registro; las regletas o clemas y los conectores de palanca convienen cuando hay que conectar varios cables, mezclar cable sólido con flexible o poder desconectar después; y la cinta de aislar sirve para reforzar el aislamiento, no para sostener un empalme. Aquí te explicamos cuándo usar cada uno, qué revisar en el empaque y dónde deben quedar los empalmes.",
  blocks: [
    { type: "h2", text: "Por qué importa el empalme: calor y falsos contactos" },
    {
      type: "p",
      text: "Un empalme es el punto más débil de un circuito. Si los cables quedan flojos, la corriente pasa por una superficie pequeña, la unión se calienta y aparece un falso contacto: chispas, focos que parpadean o un aparato que se apaga solo. Con el tiempo, ese calor reseca el aislamiento y puede terminar en un corto. Te explicamos cómo detectar estas fallas en la guía sobre el [[B15|diablito eléctrico: peligro y falsos contactos]].",
    },
    {
      type: "p",
      text: "Un buen empalme tiene tres cualidades: los cables quedan **bien apretados**, el metal queda **totalmente cubierto** y la unión queda **dentro de una caja**, protegida de golpes. El conector correcto resuelve las dos primeras; la tercera depende de dónde lo instales.",
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "Siempre sin corriente",
      text: "Antes de tocar cualquier cable, apaga la pastilla del circuito y comprueba con un probador de voltaje que no hay corriente. Si no sabes qué pastilla corresponde, apaga el interruptor general. Si la instalación no está clara, llama a un electricista.",
    },

    { type: "h2", text: "Capuchones o conectores de rosca" },
    {
      type: "p",
      text: "Los **capuchones** son pequeños conos de plástico con un resorte metálico en espiral por dentro. Se colocan sobre las puntas peladas de los cables y se giran hasta que aprietan. Son el conector más común para unir cables sólidos dentro de las cajas de apagadores, contactos y lámparas.",
    },
    {
      type: "ul",
      items: [
        "**Cuándo usarlos:** para unir dos o más cables sólidos de la instalación dentro de una caja de registro.",
        "**Qué revisar:** cada tamaño de capuchón admite cierta combinación de calibres y número de cables. Esa información viene en el empaque y suele distinguirse por color.",
        "**Cómo saber si quedó bien:** al jalar suavemente cada cable, ninguno se sale, y no se ve cobre fuera del capuchón.",
      ],
    },

    { type: "h2", text: "Regletas (clemas) y conectores de palanca" },
    {
      type: "p",
      text: "Las **regletas**, también llamadas **clemas**, son tiras con varios bornes; cada cable se sujeta con un tornillo. Los **conectores de palanca** funcionan parecido, pero en lugar de tornillo tienen una pequeña palanca que se levanta, se mete el cable y se baja para fijarlo.",
    },
    {
      type: "ul",
      items: [
        "**Cuándo convienen:** cuando hay que unir varios cables en un solo punto, cuando se mezcla cable sólido con cable flexible (por ejemplo, el de una lámpara) o cuando la conexión se va a revisar o desconectar después.",
        "**Ventaja:** cada cable queda sujeto por separado, así que es más fácil hacer y revisar la conexión.",
        "**Qué revisar:** el empaque indica qué calibres y tipos de cable aceptan y qué corriente soportan. Un conector que no está hecho para cable flexible puede no sujetarlo bien.",
        "**Cuidado con los tornillos:** en las regletas, aprieta bien y vuelve a revisar después de un tiempo; un tornillo flojo es un falso contacto.",
      ],
    },

    { type: "h2", text: "Cinta de aislar: para qué sí y para qué no" },
    {
      type: "p",
      text: "La **cinta de aislar** es útil, pero no es un conector. Su trabajo es cubrir y proteger, no sostener. Un empalme hecho solo con cables torcidos y cinta se afloja con el calor y el tiempo, y es una de las causas más comunes de falsos contactos.",
    },
    {
      type: "table",
      caption: "Cinta de aislar: usos correctos e incorrectos",
      headers: ["Sí", "No"],
      rows: [
        ["Reforzar el aislamiento de un empalme ya hecho con conector", "Sostener un empalme de cables torcidos"],
        ["Identificar cables por color", "Reparar un cable pelado, aplastado o quemado"],
        ["Proteger temporalmente una punta mientras trabajas", "Dejar un empalme expuesto fuera de una caja"],
      ],
    },
    {
      type: "p",
      text: "Si un cable está dañado, se cambia el tramo o se hace un empalme nuevo con conector dentro de una caja. La cinta sola no es reparación.",
    },

    { type: "h2", text: "Tabla: cómo elegir conectores eléctricos según el calibre y la aplicación" },
    {
      type: "p",
      text: "Esta tabla es orientativa. Antes de comprar, revisa en el empaque que el conector acepte el calibre y el número de cables que vas a unir. Si no sabes qué calibre tienes, lo encuentras impreso en el forro; te explicamos cómo leerlo en la guía de [[B05|calibre de cable para casa]].",
    },
    {
      type: "table",
      caption: "Qué conector usar según el cable y la aplicación (orientativo)",
      headers: ["Cable", "Aplicación", "Conector recomendado"],
      rows: [
        ["Sólido de iluminación o contactos", "Unir cables dentro de la caja de un apagador, contacto o lámpara", "Capuchón del tamaño que indique el empaque"],
        ["Sólido con flexible", "Conectar una lámpara o luminaria a la instalación", "Conector de palanca que acepte ambos tipos de cable"],
        ["Varios cables en un punto", "Luminarias con varias salidas, tableros o conexiones que se revisarán después", "Regleta (clema) o conector de palanca de varias entradas"],
        ["Grueso, de equipos de carga alta", "Minisplit, boiler o calentador eléctrico", "El que indique el manual del equipo; lo instala un electricista"],
        ["Cualquiera", "Reforzar el aislamiento de un empalme bien hecho", "Cinta de aislar, nunca sola"],
      ],
    },
    { type: "cta" },

    { type: "h2", text: "Dónde deben quedar los empalmes: cajas de registro" },
    {
      type: "p",
      text: "Todo empalme debe quedar **dentro de una caja de registro con su tapa**: la caja de un apagador, de un contacto, de una lámpara o una caja de registro instalada para eso. Ahí el empalme queda protegido de golpes, de la humedad y de que alguien lo toque, y se puede revisar cuando haga falta.",
    },
    {
      type: "ul",
      items: [
        "No dejes empalmes **dentro del muro** sin caja ni **colgando** fuera de ella.",
        "No metas más cables y conectores de los que caben cómodamente en la caja; si no cierra bien, hace falta una caja más grande.",
        "En exteriores o zonas húmedas, usa cajas y conectores indicados para ese uso en su empaque.",
        "Si encuentras empalmes expuestos en tu casa, pide a un electricista que los revise y los lleve a una caja.",
      ],
    },
    {
      type: "p",
      text: "En nuestra categoría de [eléctrico](" +
        catalogHref("electrico") +
        ") encuentras [capuchones](/buscar?q=capuchon), [regletas](/buscar?q=regleta), [conectores de palanca](/buscar?q=conector%20de%20palanca), [cinta de aislar](/buscar?q=cinta%20de%20aislar) y [probadores de voltaje](/buscar?q=probador%20de%20voltaje), y en [herramienta](" +
        catalogHref("herramienta") +
        ") las [pinzas](/buscar?q=pinzas) para pelar y apretar. Si llevas un pedazo del cable al mostrador, te ayudamos a elegir el tamaño correcto.",
    },
  ],
  faq: [
    {
      q: "¿Cómo se empalman dos cables de forma segura?",
      a: "Apaga la pastilla y comprueba con un probador de voltaje que no hay corriente. Pela la medida que indique el conector, une los cables con un capuchón o un conector de palanca del tamaño correcto y jala suavemente cada cable para confirmar que quedó firme. El empalme debe quedar dentro de una caja de registro con tapa. Si dudas, llama a un electricista.",
    },
    {
      q: "¿Es suficiente la cinta de aislar para unir cables?",
      a: "No. La cinta de aislar cubre y protege, pero no sostiene los cables. Un empalme de cables torcidos con cinta se afloja con el tiempo y el calor, y puede convertirse en un falso contacto. Primero une los cables con un conector adecuado y, si quieres, usa la cinta para reforzar el aislamiento.",
    },
    {
      q: "¿Qué es una regleta o clema?",
      a: "Es una tira de plástico con varios bornes metálicos donde cada cable se sujeta con un tornillo. Sirve para unir varios cables en un punto, para mezclar cable sólido con flexible o para conexiones que se van a revisar después. El empaque indica qué calibres y qué corriente soporta. Debe quedar dentro de una caja y con los tornillos bien apretados.",
    },
  ],
  guia: { titulo: "Guía rápida de empalmes y conectores" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B05", "B15", "B25", "B38", "B50"],
});
