import { defineArticle } from "@/lib/blog/article-schema";
import { catalogHref } from "@/content/blog/catalog-links";

// B05 · Pilar · Electricidad e iluminación. Regla de redacción del brief: la
// regla práctica 14/12/10 AWG ↔ 15/20/30 A va presentada como orientativa,
// sin números de norma, y siempre con el aviso de que un electricista valida
// la instalación. Los watts de los aparatos son ejemplos ilustrativos: el
// dato real está en la placa o el manual. Sin recomendar tocar el centro de
// carga. Contexto local del Bajío solo cualitativo.
// Lanzamiento: se publica al terminarse (el calendario decía 09/10/2026).
export default defineArticle({
  topicId: "B05",
  slug: "calibre-de-cable-electrico-para-cada-electrodomestico",
  title: "Calibre de cables eléctricos: cuál usar para cada electrodoméstico y cada circuito",
  seoTitle: "Calibre de cable para casa: cuál usar por electrodoméstico",
  metaDescription:
    "Qué calibre de cable necesitas para contactos, iluminación, minisplit, refrigerador y más. Cómo calcular por amperes y evita sobrecargas.",
  keyword: "calibre de cable para casa",
  secondaryKeywords: [
    "qué calibre de cable usar",
    "cable calibre 12 o 14",
    "calibre de cable para minisplit",
    "tabla de calibres de cable awg",
    "cable thw",
  ],
  cluster: "electricidad-e-iluminacion",
  pillar: true,
  publishAt: "2026-10-08T16:00:00-06:00",
  updatedAt: "2026-10-08T16:00:00-06:00",
  intro:
    "El **calibre de cable para casa** se elige según la corriente, en amperes, que va a pasar por el circuito. Como regla práctica orientativa, el cable calibre 14 se usa en circuitos de 15 amperes (normalmente iluminación), el calibre 12 en circuitos de 20 amperes (contactos de uso general, cocina, lavadora) y el calibre 10 en circuitos de 30 amperes (equipos grandes como algunos minisplits o calentadores eléctricos). Para saber cuántos amperes pide un aparato basta una división: watts entre volts. En esta guía te explicamos cómo hacer ese cálculo, cómo leer el calibre en el forro del cable, qué tipo de cable conviene y en qué casos lo mejor es llamar a un electricista.",
  blocks: [
    {
      type: "callout",
      variant: "seguridad",
      title: "Antes de empezar",
      text: "Las tablas y ejemplos de este artículo son orientativos y sirven para entender tu instalación y comprar con criterio. El calibre definitivo depende de la carga real, la distancia del recorrido y cómo esté hecha tu instalación: una instalación nueva o una modificación la valida siempre un electricista. Trabaja siempre con la pastilla del circuito apagada.",
    },

    { type: "h2", text: "Por qué el calibre importa: calor, caídas de voltaje y riesgo de incendio" },
    {
      type: "p",
      text: "Un cable eléctrico funciona como una tubería para la corriente. Si el cable es demasiado delgado para lo que se conecta, la corriente encuentra más resistencia y esa resistencia se convierte en **calor**. Un cable que se calienta de más reseca y agrieta su aislamiento con el tiempo, afloja los empalmes y, en el peor caso, puede provocar un corto o un incendio dentro del muro, donde nadie lo ve.",
    },
    {
      type: "p",
      text: "El segundo problema es la **caída de voltaje**. En recorridos largos con un cable delgado, al aparato le llega menos voltaje del que necesita: los focos bajan de intensidad cuando arranca otro equipo, los motores trabajan forzados y se calientan, y algunos aparatos electrónicos fallan o se reinician. Por eso un mismo aparato puede pedir un calibre más grueso si está lejos del centro de carga.",
    },
    {
      type: "p",
      text: "El tercer punto es la **protección**. Cada circuito tiene una pastilla (interruptor termomagnético) que se bota cuando pasa más corriente de la que el cable aguanta. Esa pastilla se elige para proteger el cable, no el aparato. Si alguien pone una pastilla más grande para que «ya no se bote», el cable queda sin protección real. La señal de que un circuito se quedó corto no se arregla con una pastilla mayor: se arregla revisando la carga y, si hace falta, con un circuito nuevo hecho por un electricista.",
    },

    { type: "h2", text: "Cómo leer el calibre: AWG, sección y capacidad en amperes" },
    {
      type: "p",
      text: "En México el calibre del cable se expresa casi siempre en **AWG** (calibre americano). Lo primero que hay que saber es que funciona al revés de lo que uno esperaría: **entre más pequeño el número, más grueso el cable**. Un calibre 10 es más grueso que un 12, y el 12 es más grueso que el 14.",
    },
    {
      type: "p",
      text: "El calibre viene impreso a lo largo del forro del cable, junto con otros datos: el tipo de aislamiento (por ejemplo THW o THHW-LS), la temperatura máxima de operación, el voltaje del aislamiento y, en muchos casos, la **sección** en milímetros cuadrados, que es otra forma de expresar el grosor del conductor. Si tienes un pedazo de cable y no sabes qué es, busca esa leyenda impresa: es la forma más confiable de identificarlo.",
    },
    {
      type: "p",
      text: "La **capacidad en amperes** es cuánta corriente puede llevar el cable sin calentarse de más. Esa cifra cambia según el tipo de aislamiento, si el cable va dentro de tubería con otros cables y la temperatura del lugar, y viene en la ficha técnica del fabricante. Para uso doméstico, la regla práctica orientativa que se usa para elegir es esta:",
    },
    {
      type: "table",
      caption: "Regla práctica orientativa: calibre, pastilla y usos comunes en casa",
      headers: ["Calibre (AWG)", "Circuito (pastilla)", "Usos comunes"],
      rows: [
        ["14", "15 A", "Circuitos de iluminación"],
        ["12", "20 A", "Contactos de uso general, cocina, lavadora, refrigerador"],
        ["10", "30 A", "Equipos grandes con circuito propio: algunos minisplits, boiler o calentador eléctrico"],
      ],
    },
    {
      type: "callout",
      variant: "nota",
      title: "Cable y pastilla van juntos",
      text: "La regla se lee en las dos direcciones: un cable calibre 14 va con una pastilla de 15 A, y una pastilla de 20 A pide al menos cable calibre 12. Nunca pongas una pastilla mayor sobre un cable delgado. Para cargas más grandes que las de la tabla, el calibre y la protección los define un electricista.",
    },
    { type: "cta" },

    { type: "h2", text: "Fórmula fácil: watts ÷ volts = amperes (ejemplo resuelto)" },
    {
      type: "p",
      text: "Para saber qué **calibre de cable para casa** necesita un aparato, primero hay que saber cuántos amperes consume. Todos los aparatos traen una placa o etiqueta (atrás, abajo o dentro de la puerta) y un manual con su consumo en **watts (W)** o directamente en **amperes (A)**. Si trae amperes, ya tienes el dato. Si trae watts, usa esta división:",
    },
    {
      type: "p",
      text: "**Amperes = watts ÷ volts.** En una casa en México, los contactos comunes trabajan a 127 volts, que es la cifra que usamos en los ejemplos. Algunos equipos grandes, como ciertos minisplits o estufas eléctricas, trabajan a un voltaje mayor: la placa del aparato lo indica y, en ese caso, la conexión la hace un electricista.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Busca los watts en la placa",
          text: "Ejemplo ilustrativo: un horno de microondas cuya placa dice 1,200 W. El dato real de tu aparato es el que trae su etiqueta.",
        },
        {
          title: "Divide entre los volts",
          text: "1,200 W ÷ 127 V = 9.4 A, aproximadamente. Ese es el consumo del aparato funcionando.",
        },
        {
          title: "Deja margen de seguridad",
          text: "Si el aparato va a trabajar mucho tiempo seguido (carga continua), como regla práctica no cargues el circuito más allá de alrededor del 80 % de su capacidad. En un circuito de 15 A eso es unos 12 A; en uno de 20 A, unos 16 A.",
        },
        {
          title: "Suma lo que comparte el circuito",
          text: "Si en el mismo circuito también están el refrigerador y la cafetera, suma sus amperes. Si el total pasa del margen, el circuito se queda corto aunque cada aparato por separado parezca poco.",
        },
        {
          title: "Elige el calibre",
          text: "Con el total en amperes, ubica el circuito en la tabla: hasta el margen de 15 A, calibre 14; hasta el de 20 A, calibre 12; hasta el de 30 A, calibre 10. Si el recorrido es largo, sube un calibre y consúltalo con un electricista.",
        },
      ],
    },
    {
      type: "p",
      text: "En el ejemplo, el microondas solo (unos 9.4 A) cabría en un circuito de 15 A, pero en una cocina casi nunca está solo: por eso los contactos de cocina suelen ir en circuitos de 20 A con cable calibre 12. Este cálculo te ayuda a llegar a la ferretería con la información correcta. No sustituye la revisión de un electricista cuando vas a hacer un circuito nuevo.",
    },

    { type: "h2", text: "Tabla orientativa: calibre de cable para casa, uso por uso" },
    {
      type: "p",
      text: "Esta tabla resume qué calibre se usa con más frecuencia en cada parte de una casa. Es una guía para entender tu instalación, no una especificación: el dato que manda es el de la placa y el manual de cada aparato, y la distancia del recorrido puede pedir un calibre más grueso.",
    },
    {
      type: "table",
      caption: "Calibre orientativo por uso (circuitos a 127 V salvo que la placa diga otra cosa)",
      headers: ["Uso", "Calibre orientativo", "Notas"],
      rows: [
        ["Iluminación", "14", "Circuito de 15 A. Con focos LED la carga es baja, pero se respeta el calibre del circuito."],
        ["Contactos de uso general", "12", "Circuito de 20 A. Recámaras, sala y estudio."],
        ["Contactos de cocina", "12", "Circuito de 20 A. Ahí se juntan microondas, cafetera, licuadora y refrigerador."],
        ["Refrigerador", "12", "De preferencia en su propio contacto, sin extensiones ni multicontactos."],
        ["Lavadora", "12", "Circuito de 20 A con tierra física. Si tiene secadora eléctrica, revisa la placa."],
        ["Minisplit", "Según la placa: 12 o 10", "Siempre en circuito propio. Depende de la capacidad y del voltaje del equipo; el manual indica el calibre y la pastilla."],
        ["Boiler o calentador eléctrico", "Según la placa: 10 o más grueso", "Circuito propio. Son cargas altas y continuas: instalación por electricista."],
        ["Estufa u horno eléctrico", "Según la placa", "Circuito propio y, a menudo, a un voltaje mayor. Instalación por electricista."],
      ],
    },
    {
      type: "callout",
      variant: "consejo",
      title: "Minisplit y boiler: la placa manda",
      text: "Para el calibre de cable de un minisplit o un boiler eléctrico, el manual de instalación del fabricante casi siempre indica el calibre mínimo y la pastilla recomendada. Tráenos ese dato o una foto de la placa y te ayudamos a encontrar el cable y la protección correspondientes.",
    },
    {
      type: "p",
      text: "En el Bajío es cada vez más común que una casa sume un minisplit para la temporada de calor o un calentador eléctrico a una instalación que se pensó para menos aparatos. Ese es justo el momento de revisar: un equipo nuevo de carga alta debe ir en su propio circuito, con su cable y su pastilla, y no colgado de un contacto que ya existe.",
    },

    { type: "h2", text: "Tipos de cable (THW, THHW-LS, flexible) y colores" },
    {
      type: "p",
      text: "Además del calibre, el **tipo de aislamiento** define dónde se puede usar el cable. Las letras impresas en el forro lo indican. Estos son los que más vas a encontrar para una casa:",
    },
    {
      type: "ul",
      items: [
        "**THW:** el cable más común para instalaciones dentro de tubería (poliducto o tubo conduit). Su aislamiento es resistente al calor y a la humedad. Es la opción típica para cablear contactos y apagadores.",
        "**THHW-LS:** también para instalaciones en tubería, con aislamiento resistente al calor y a la humedad; las letras LS indican que emite poco humo en caso de incendio, por eso se prefiere en interiores y espacios cerrados.",
        "**Alambre y cable:** el alambre tiene un solo hilo y es más rígido; el cable tiene varios hilos y es más fácil de pasar por la tubería y de doblar en las cajas.",
        "**Cable flexible o de uso rudo:** varios conductores dentro de una cubierta. Es para extensiones y para conectar aparatos y herramientas, no para dejarlo fijo dentro del muro en lugar del cable de instalación.",
      ],
    },
    {
      type: "p",
      text: "Revisa siempre en el forro o en el empaque el tipo, la temperatura y el voltaje del aislamiento. Puedes ver lo que tenemos con una búsqueda de [cable THW](/buscar?q=cable%20thw) o en nuestra categoría de [eléctrico](" +
        catalogHref("electrico") +
        "). Si quieres saber qué marca de la familia corresponde al material eléctrico, en nuestra guía de [[B01|marcas truper]] lo explicamos.",
    },
    { type: "h3", text: "Colores: para saber qué es cada cable" },
    {
      type: "p",
      text: "Los colores del forro ayudan a identificar la función de cada conductor y hacen más segura cualquier reparación futura. La convención más usada en casas en México es:",
    },
    {
      type: "ul",
      items: [
        "**Verde o desnudo:** tierra física. Protege a las personas si un aparato tiene una falla en su carcasa.",
        "**Blanco o gris:** neutro, el conductor de regreso.",
        "**Negro, rojo u otro color:** fase, el que lleva la corriente. Es el que se corta con el apagador y el que hay que tratar con más cuidado.",
      ],
    },
    {
      type: "p",
      text: "En una casa con instalación antigua los colores pueden no respetarse. Antes de tocar nada, apaga la pastilla y confirma con un probador de voltaje que no hay corriente; no te guíes solo por el color.",
    },

    { type: "h2", text: "Errores comunes al elegir el calibre de cable" },
    {
      type: "ul",
      items: [
        "**Cambiar la pastilla por una más grande** porque «se bota mucho». La pastilla protege el cable: si se bota, el circuito está pidiendo más de lo que puede dar.",
        "**Conectar equipos grandes a un contacto común.** Un minisplit, un boiler o una secadora deben tener su propio circuito.",
        "**Usar extensiones delgadas para aparatos de alto consumo.** Una extensión también tiene calibre; un calentador o una herramienta potente pide una extensión gruesa y lo más corta posible.",
        "**Empalmar cables de distinto calibre** para «alargar» un circuito. El circuito vale lo que vale su tramo más delgado.",
        "**Ignorar la distancia.** En recorridos largos (un taller al fondo del terreno, una bomba en la azotea) conviene un calibre más grueso para evitar la caída de voltaje.",
        "**Reutilizar cable viejo sin revisarlo.** Si el forro está reseco, quebradizo o con zonas oscurecidas por calor, ya no es seguro.",
      ],
    },

    { type: "h2", text: "Cuándo llamar a un electricista" },
    {
      type: "p",
      text: "Cambiar un contacto o un apagador por otro igual es una reparación que mucha gente hace en casa con la pastilla apagada. Pero hay situaciones en las que lo correcto es llamar a un electricista:",
    },
    {
      type: "ul",
      items: [
        "Vas a **agregar un circuito nuevo** o instalar un equipo de carga alta (minisplit, boiler, estufa eléctrica).",
        "Necesitas **modificar el centro de carga**: agregar o cambiar pastillas, o reorganizar circuitos.",
        "Una pastilla **se bota seguido** aunque no hayas conectado nada nuevo.",
        "Notas **olor a quemado**, contactos o apagadores tibios, chispas al conectar o focos que parpadean cuando arranca otro aparato.",
        "La instalación es **antigua**, sin tierra física, o no sabes de qué calibre son los cables.",
        "El equipo trabaja a un voltaje mayor al de los contactos comunes.",
      ],
    },
    {
      type: "callout",
      variant: "seguridad",
      title: "El centro de carga no es un trabajo de fin de semana",
      text: "Dentro del centro de carga hay partes que siguen con corriente aunque apagues todas las pastillas. No lo abras ni lo modifiques tú mismo: es el trabajo que más conviene dejar en manos de un electricista.",
    },
    {
      type: "p",
      text: "Cuando el electricista ya te dijo qué necesitas, en Ferretería 57 encuentras el material: cable THW y THHW-LS, cable de uso rudo, [interruptores termomagnéticos](/buscar?q=interruptor%20termomagnetico), [centros de carga](/buscar?q=centro%20de%20carga), conectores, cinta de aislar y apagadores en nuestra categoría de [eléctrico](" +
        catalogHref("electrico") +
        "), y focos y luminarias en [iluminación](" +
        catalogHref("iluminacion") +
        "). Si tienes la placa del aparato o la lista del electricista, tráela al mostrador y te ayudamos a armar el pedido completo.",
    },
  ],
  faq: [
    {
      q: "¿Qué calibre de cable se usa para los contactos de una casa?",
      a: "Para los contactos de uso general, como regla práctica orientativa se usa cable calibre 12 en un circuito protegido con una pastilla de 20 amperes. Los circuitos de iluminación suelen ir en calibre 14 con pastilla de 15 amperes. Los equipos grandes, como un minisplit o un boiler eléctrico, van en su propio circuito con el calibre que indique su manual. Una instalación nueva la valida un electricista.",
    },
    {
      q: "¿Qué pasa si uso un cable de menor calibre del necesario?",
      a: "El cable se calienta más de lo que debe. Con el tiempo el aislamiento se reseca y se agrieta, los empalmes se aflojan y aumenta el riesgo de un corto o de un incendio dentro del muro. También puede haber caída de voltaje: focos que bajan de intensidad y motores que trabajan forzados. Si la pastilla no corresponde al cable, puede que ni siquiera se bote a tiempo.",
    },
    {
      q: "¿Cómo calculo el calibre según los watts de un aparato?",
      a: "Divide los watts de la placa del aparato entre los volts: en contactos comunes, 127. Por ejemplo, ilustrativo, 1,200 W ÷ 127 V da unos 9.4 amperes. Suma los amperes de todo lo que comparte el circuito, deja margen para cargas continuas y ubica el resultado en la regla práctica: 15 A con calibre 14, 20 A con calibre 12 y 30 A con calibre 10.",
    },
    {
      q: "¿Cable calibre 12 o 14 para una casa?",
      a: "Los dos se usan, pero en circuitos distintos. El calibre 14 se usa en circuitos de 15 amperes, normalmente iluminación. El calibre 12 es más grueso y se usa en circuitos de 20 amperes, como contactos de cocina, lavadora y refrigerador. Si dudas en un contacto de uso general, el 12 da más holgura, siempre con la pastilla que le corresponde al circuito.",
    },
  ],
  guia: { titulo: "Tabla de calibres: qué cable para cada aparato" },
  // Sugeridos por docs/blog/mapa-enlaces.csv; solo se muestran los ya publicados.
  relatedTopicIds: ["B01", "B10", "B15", "B16", "B21", "B02"],
});
