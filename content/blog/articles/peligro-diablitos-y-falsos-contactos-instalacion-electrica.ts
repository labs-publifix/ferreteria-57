import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B15 · Fondo · Electricidad e iluminación. Regla de redacción del brief: solo
// riesgos y soluciones seguras; sin instrucciones de conexiones clandestinas,
// sin estadísticas ni números de norma, y siempre recomendando a un
// electricista para lo que toca el centro de carga o el cableado. Tono
// preventivo, sin alarmismo. El seoTitle del brief («Diablitos y falsos
// contactos: riesgos de tu instalación») no contiene la keyword como frase,
// así que se ajustó para que la lleve.
export default defineArticle({
  topicId: "B15",
  slug: "peligro-diablitos-y-falsos-contactos-instalacion-electrica",
  title: "El peligro de los diablitos y falsos contactos: por qué actualizar tu instalación eléctrica",
  seoTitle: "Diablito eléctrico: peligro y falsos contactos en casa",
  metaDescription:
    "Por qué las derivaciones improvisadas, los diablitos y los falsos contactos son un riesgo en casa, y cómo saber si debes actualizar tu instalación.",
  keyword: "diablito eléctrico peligro",
  secondaryKeywords: [
    "falso contacto qué hacer",
    "sobrecarga de contactos",
    "multicontacto peligro",
    "cuándo cambiar la instalación eléctrica",
    "señales de instalación eléctrica deficiente",
  ],
  cluster: "electricidad-e-iluminacion",
  pillar: false,
  publishAt: "2026-10-27T08:00:00-06:00",
  updatedAt: "2026-10-29T08:00:00-06:00",
  intro:
    "El **diablito eléctrico**, peligro poco visible en muchas casas, hace que un solo contacto, o un cable que no fue pensado para eso, cargue con más aparatos de los que puede alimentar. Lo mismo pasa con un falso contacto: una conexión floja que se calienta cada vez que pasa corriente. Ninguno de los dos avisa con un estruendo; avisan con contactos tibios, olor a plástico caliente, focos que parpadean o una pastilla que se bota seguido. En esta guía te explicamos qué son, qué riesgos generan, qué señales revisar en tu casa o negocio, en qué orden conviene actualizar la instalación y cuándo es momento de llamar a un electricista.",
  blocks: [
    { type: "h2", text: "Qué es un diablito y qué es un falso contacto" },
    {
      type: "p",
      text: "En México, «diablito» se usa para varias cosas, y conviene separarlas. En casa, casi siempre se refiere a las **derivaciones improvisadas**: el adaptador que convierte un contacto en tres, la extensión conectada a otra extensión, el multicontacto sin protección del que cuelgan la televisión, el horno de microondas y el calentador, o un cable empalmado «al aire» para llevar corriente a donde no hay contacto. La palabra también nombra la conexión clandestina a la red pública. Esa es ilegal y extremadamente peligrosa, y no hay forma segura de hacerla: aquí solo hablamos de riesgos y de soluciones.",
    },
    {
      type: "p",
      text: "Un **falso contacto** es una conexión eléctrica que no aprieta bien. Puede estar en el contacto de la pared (las laminillas internas se abrieron y la clavija baila), en la propia clavija de un aparato, en un empalme mal hecho dentro de una caja, en un tornillo flojo de un apagador o en el centro de carga. Cuando la conexión es débil, la corriente pasa por una superficie muy pequeña, se forma un pequeño arco y esa zona se calienta. Por eso un falso contacto suele dar la cara con chispas al conectar, con un aparato que se apaga y se prende solo o con una clavija que sale caliente.",
    },
    {
      type: "p",
      text: "Los dos problemas suelen ir juntos: un contacto viejo y flojo al que además se le conectó un adaptador con varios aparatos es la combinación típica de una instalación que ya pide revisión.",
    },

    { type: "h2", text: "Diablito eléctrico: peligro de sobrecalentamiento, cortos e incendios" },
    {
      type: "p",
      text: "Cada cable y cada contacto están hechos para una cantidad máxima de corriente. Cuando se conectan más aparatos de los que el circuito soporta, la corriente aumenta y el cable se calienta. Si el cable además es delgado para lo que alimenta, el calor es mayor. Te explicamos cómo se relacionan el grosor del cable y la carga en nuestra guía de [[B05|calibre de cable para casa]].",
    },
    {
      type: "ul",
      items: [
        "**Sobrecalentamiento.** El calor reseca y agrieta el aislamiento del cable y de las clavijas. Con el tiempo, el plástico se ablanda, se deforma o se oscurece.",
        "**Cortos circuitos.** Cuando el aislamiento se daña, los conductores pueden tocarse entre sí o con una parte metálica. El resultado es un chispazo, un apagón del circuito o un aparato dañado.",
        "**Incendios.** El riesgo más serio. Un empalme caliente dentro del muro, detrás de un mueble o bajo una alfombra puede encender lo que tiene alrededor sin que nadie lo vea a tiempo.",
        "**Descargas eléctricas.** Un cable pelado, una caja sin tapa o un aparato sin tierra física pueden dar toques a quien los toque.",
        "**Aparatos dañados.** Los falsos contactos generan cortes y regresos de corriente muy rápidos que afectan a motores y a equipos electrónicos.",
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "La pastilla no siempre te salva",
      text: "La pastilla (interruptor termomagnético) protege el cable de una sobrecarga, pero un falso contacto puede calentarse mucho sin que pase suficiente corriente para que se bote. Además, si alguien cambió la pastilla por una más grande para que «ya no se bote», el cable queda sin protección real. Que la pastilla no se bote no quiere decir que la instalación esté bien.",
    },
    { type: "cta" },

    { type: "h2", text: "Señales de alerta en tu casa o negocio" },
    {
      type: "p",
      text: "La mayoría de las instalaciones con problemas dan señales antes de fallar. Si reconoces una o varias de estas, vale la pena revisar con calma:",
    },
    {
      type: "ul",
      items: [
        "Contactos, apagadores o clavijas **tibios o calientes** al tacto.",
        "**Olor a plástico quemado** cerca de un contacto, del centro de carga o de un aparato.",
        "Marcas **oscuras o amarillentas** alrededor de un contacto o en la clavija.",
        "**Chispas** al conectar o desconectar un aparato.",
        "Clavijas que **bailan o se caen** del contacto.",
        "Focos que **parpadean o bajan de intensidad** cuando arranca el refrigerador, la lavadora o el microondas.",
        "Una pastilla que **se bota seguido** sin que hayas conectado nada nuevo.",
        "**Zumbidos o chasquidos** en contactos, apagadores o el centro de carga.",
        "Extensiones y adaptadores que se volvieron **permanentes** porque «no alcanzan los contactos».",
        "Cables **expuestos**, empalmes con cinta vieja o cajas sin tapa.",
      ],
    },
    {
      type: "p",
      text: "En un negocio las señales son las mismas, pero el riesgo crece porque suele haber más equipos trabajando muchas horas: refrigeradores, compresores, cafeteras, cajas registradoras o herramientas. Un taller o una cocina con multicontactos encadenados es una instalación que ya se quedó chica.",
    },

    { type: "h2", text: "Qué revisar: contactos, clavijas, extensiones, centro de carga y cableado" },
    {
      type: "p",
      text: "Una revisión visual no requiere abrir nada ni herramientas especiales. Hazla con calma, de preferencia con buena luz y sin tocar partes metálicas:",
    },
    {
      type: "table",
      caption: "Qué revisar y qué te dice cada señal",
      headers: ["Dónde", "Qué revisar", "Qué hacer si ves un problema"],
      rows: [
        ["Contactos", "Que la clavija entre firme, que no estén flojos en la pared y que no tengan marcas de calor", "Deja de usarlo y cámbialo, con la pastilla apagada, o pide que lo cambie un electricista"],
        ["Clavijas y cables de aparatos", "Que no estén rotas, aplastadas, peladas ni calientes", "Cambia la clavija o el cable completo; no lo arregles con cinta"],
        ["Extensiones y multicontactos", "Cuántos aparatos cuelgan de ellos, si se calientan y si tienen protección", "Reparte la carga y usa multicontactos con protección contra sobrecarga"],
        ["Centro de carga", "Pastillas que se botan seguido, olor, zumbido o calor en la tapa", "No lo abras: llama a un electricista"],
        ["Cableado visible", "Forros resecos, empalmes al aire, cables sin tubería ni caja", "Pide una revisión; un empalme expuesto es un riesgo directo"],
      ],
    },
    {
      type: "p",
      text: "Para saber cuánto pide un aparato, la placa o la etiqueta trae su consumo en watts o en amperes; con ese dato puedes repartir mejor los equipos entre contactos de distintos circuitos. Si quieres confirmar si un contacto tiene corriente antes de cambiarlo, un probador de voltaje sin contacto ayuda a no trabajar a ciegas.",
    },

    { type: "h2", text: "Qué sí hacer: orden de prioridades para actualizar" },
    {
      type: "p",
      text: "No hace falta rehacer toda la instalación de un día para otro. Lo que sí conviene es atender primero lo que representa un riesgo inmediato y después lo que mejora la seguridad a largo plazo:",
    },
    {
      type: "steps",
      items: [
        {
          title: "Atiende lo urgente hoy",
          text: "Si hay olor a quemado, chispas, un contacto derretido o un cable pelado, desconecta lo que esté conectado ahí, apaga la pastilla de ese circuito y no lo vuelvas a usar hasta que se revise.",
        },
        {
          title: "Quita los diablitos y las extensiones encadenadas",
          text: "Reparte los aparatos entre contactos de distintos circuitos. Los equipos de consumo alto (microondas, calentador, plancha, secadora de pelo, herramientas) van directo a un contacto de pared, nunca en un adaptador.",
        },
        {
          title: "Cambia contactos y clavijas dañados",
          text: "Un contacto flojo o con marcas de calor se reemplaza completo. Es una reparación sencilla con la pastilla apagada, pero si no estás seguro, que la haga un electricista.",
        },
        {
          title: "Revisa la protección",
          text: "Pide que un electricista confirme que cada pastilla corresponde al cable de su circuito y que la instalación tiene tierra física, sobre todo en cocina, lavado y baño.",
        },
        {
          title: "Planea lo que hace falta",
          text: "Si los contactos no alcanzan, la solución es agregar contactos o un circuito nuevo, no más adaptadores. Esa ampliación la diseña y la hace un electricista.",
        },
      ],
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Antes de comprar más extensiones",
      text: "Si cada mes compras otra extensión u otro adaptador, tu casa te está diciendo que le faltan contactos. Una visita de un electricista para agregar los que hacen falta suele resolver de raíz lo que las extensiones solo esconden.",
    },

    { type: "h2", text: "Productos seguros que sí puedes usar" },
    {
      type: "p",
      text: "Usar extensiones y multicontactos no es malo; el problema es usarlos de forma permanente o para más carga de la que soportan. Estas son las opciones seguras para el día a día:",
    },
    {
      type: "ul",
      items: [
        "[Multicontactos](/buscar?q=multicontacto) **con protección contra sobrecarga** e interruptor, para equipos de bajo consumo como computadoras, cargadores o televisión. Revisa en el empaque la carga máxima que soportan.",
        "[Extensiones](/buscar?q=extension) **de uso rudo** del calibre adecuado para lo que vas a conectar, lo más cortas posible y siempre extendidas por completo, nunca enrolladas mientras se usan.",
        "**Contactos y clavijas de repuesto** para cambiar los que están flojos o dañados.",
        "[Probadores de voltaje](/buscar?q=probador%20de%20voltaje) **sin contacto** para confirmar que no hay corriente antes de trabajar.",
        "**Cinta de aislar** solo para aislar un empalme bien hecho, nunca como reparación de un cable dañado. Te explicamos cuándo usar cinta, capuchones o regletas en la guía de [[B16|conectores eléctricos]].",
        "[Centros de carga](/buscar?q=centro%20de%20carga) e [interruptores termomagnéticos](/buscar?q=interruptor%20termomagnetico), **solo cuando** el electricista ya te dijo exactamente cuáles necesitas.",
      ],
    },
    {
      type: "p",
      text: "Todo esto lo encuentras en nuestra categoría de [eléctrico](" +
        catalogHref("electrico") +
        "), y focos y luminarias en [iluminación](" +
        catalogHref("iluminacion") +
        "). Si llegas al mostrador con la placa del aparato o con la lista del electricista, te ayudamos a elegir el material correcto.",
    },

    { type: "h2", text: "Cuándo llamar a un electricista" },
    {
      type: "p",
      text: "Cambiar un contacto o una clavija por otro igual es una reparación que mucha gente hace en casa con la pastilla apagada. En estos casos, en cambio, lo correcto es llamar a un electricista:",
    },
    {
      type: "ul",
      items: [
        "Hay **olor a quemado, chispas o calor** que no se van al desconectar los aparatos.",
        "Una pastilla **se bota seguido** o una pastilla se calienta.",
        "Necesitas **más contactos** o un **circuito nuevo** para un equipo grande.",
        "La instalación es **antigua**, no tiene tierra física o no sabes cómo está hecha.",
        "Encontraste **empalmes dentro de los muros**, cables sin tubería o cajas sin tapa.",
        "Vas a **remodelar** o a convertir un espacio en negocio o taller.",
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "El centro de carga no se abre en casa",
      text: "Dentro del centro de carga hay partes que siguen con corriente aunque apagues todas las pastillas. No lo abras ni lo modifiques: revisarlo es trabajo de un electricista.",
    },
    {
      type: "p",
      text: "Actualizar una instalación no es un gasto de lujo: es lo que permite que la casa o el negocio aguanten los aparatos que hoy usamos sin depender de adaptadores. Empieza por las señales de alerta, quita los diablitos y deja lo demás en manos de un profesional.",
    },
  ],
  faq: [
    {
      q: "¿Por qué es peligroso conectar varios aparatos en un solo contacto?",
      a: "Porque todos los aparatos jalan corriente del mismo contacto y del mismo cable. Si la suma pasa de lo que soportan, se calientan; con el tiempo el aislamiento se daña y aumenta el riesgo de un corto o de un incendio. Los aparatos de consumo alto, como el microondas o un calentador, van directo a un contacto de pared, sin adaptadores ni extensiones.",
    },
    {
      q: "¿Cómo sé si mi instalación eléctrica necesita actualizarse?",
      a: "Las señales más comunes son contactos o clavijas calientes, olor a quemado, chispas al conectar, focos que parpadean cuando arranca otro aparato, pastillas que se botan seguido y la necesidad de usar extensiones de forma permanente. Si la instalación es antigua o no tiene tierra física, también conviene pedir una revisión a un electricista.",
    },
    {
      q: "¿Qué es un falso contacto y cómo se corrige?",
      a: "Es una conexión floja: la clavija baila en el contacto, un tornillo no aprieta o un empalme quedó mal hecho. Se calienta y puede soltar chispas. Si está en un contacto o en una clavija, se corrige cambiándolos por piezas nuevas con la pastilla apagada. Si está dentro de un muro, en un empalme o en el centro de carga, lo corrige un electricista.",
    },
    {
      q: "¿Los multicontactos son peligrosos?",
      a: "No por sí mismos. Un multicontacto con protección contra sobrecarga es seguro para equipos de bajo consumo, como computadoras, cargadores o televisión. El peligro está en conectarle aparatos de consumo alto, en encadenar uno con otro o en usarlo de forma permanente porque faltan contactos. Revisa en el empaque la carga máxima que soporta.",
    },
  ],
  guia: { titulo: "Señales de alerta en tu instalación eléctrica" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B05", "B16", "B21", "B38", "B50", "B02"],
});
