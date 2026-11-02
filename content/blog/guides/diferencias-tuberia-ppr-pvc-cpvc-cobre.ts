import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B04 (hoja «Guías PDF»): pág. 1, tabla comparativa (uso,
// temperatura, unión, herramienta, costo relativo); pág. 2, «¿qué tubería
// uso?» como ruta de preguntas y la lista de materiales por tipo de unión.
// El árbol de decisión va como pasos numerados en texto (el formato de la
// guía no dibuja flechas). Sin límites numéricos de temperatura ni presión:
// se remiten a la ficha del fabricante. Portada aparte (3 páginas en total).
export default defineGuide({
  topicId: "B04",
  slug: "diferencias-tuberia-ppr-pvc-cpvc-cobre",
  titulo: "Comparador de tuberías: PPR, PVC, CPVC y cobre",
  subtitulo: "Las diferencias entre las cuatro tuberías de agua más comunes y una ruta de preguntas para elegir la tuya sin equivocarte.",
  paginas: [
    {
      titulo: "Las 4 tuberías, lado a lado",
      intro: "Comparación general. La temperatura y la presión exactas que soporta cada tubo dependen del fabricante: revísalas siempre en la etiqueta o en la ficha técnica.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Material", "Uso típico", "Temperatura", "Cómo se une", "Herramienta", "Costo relativo"],
          anchos: [1, 1.15, 1.2, 1.1, 1.45, 0.95],
          filas: [
            ["PVC hidráulico", "Agua fría a presión", "Solo agua fría", "Cemento para PVC", "Cortatubos o segueta, lija", "El más bajo"],
            ["CPVC", "Agua fría y caliente", "Fría y caliente, según la ficha", "Cemento para CPVC", "Cortatubos, lija", "Medio"],
            ["PPR", "Instalaciones nuevas de agua fría y caliente", "Según el tipo de tubo: revisa la ficha", "Termofusión", "Termofusora y dados, cortatubos", "Medio"],
            ["Cobre", "Agua fría y caliente; ampliar instalaciones de cobre", "Fría y caliente, según la ficha", "Soldadura", "Soplete, pasta para soldar, cortatubos", "El más alto"],
          ],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Dos reglas que evitan fugas",
          items: [
            "Nunca pegues ni sueldes materiales distintos entre sí: usa una conexión de transición o un adaptador roscado.",
            "El PVC para drenaje (sanitario) es otro producto: no lo uses para agua a presión.",
          ],
        },
        {
          type: "consejo",
          titulo: "Agua dura en el Bajío",
          texto: "Si en tu casa se forma sarro en llaves y regaderas, toma en cuenta que los materiales plásticos no se corroen y que las uniones por termofusión no tienen rosca donde se acumule. Protege del sol cualquier tubo plástico expuesto.",
        },
      ],
    },
    {
      titulo: "¿Qué tubería uso?",
      intro: "Contesta en orden. La primera respuesta que te dé una opción es tu punto de partida; confírmala en la ficha antes de comprar.",
      bloques: [
        {
          type: "pasos",
          items: [
            { titulo: "¿Vas a reparar o ampliar una instalación que ya existe?", texto: "Sí: sigue con el mismo material que ya tienes. Es lo más sencillo y evita transiciones. No: pasa a la siguiente pregunta." },
            { titulo: "¿Va a pasar agua caliente?", texto: "No, solo fría: el PVC hidráulico es la opción más económica y fácil de instalar. Sí: pasa a la siguiente pregunta." },
            { titulo: "¿Tienes o puedes conseguir una termofusora?", texto: "Sí: el PPR del tipo indicado para agua caliente da uniones de una sola pieza. No: pasa a la siguiente pregunta." },
            { titulo: "¿Prefieres una instalación pegada, sin flama?", texto: "Sí: CPVC con su propio cemento. No, y tienes práctica soldando: cobre." },
          ],
        },
        {
          type: "tabla",
          titulo: "Materiales por tipo de unión",
          columnas: ["Tipo de unión", "Lo que necesitas"],
          anchos: [1, 3],
          filas: [
            ["Pegada (PVC y CPVC)", "Tubo y conexiones del mismo material, cortatubos o segueta, lija o limpiador, el cemento de cada material"],
            ["Termofusión (PPR)", "Termofusora, dados de la medida del tubo, cortatubos para plástico, trapo limpio, marcador"],
            ["Soldadura (cobre)", "Soplete, soldadura, pasta para soldar, lija o fibra, cortatubos para cobre, extintor, lentes y guantes"],
            ["Roscas y transiciones", "Conexión de transición o adaptador roscado, cinta teflón, llave ajustable"],
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Antes de cortar",
          items: [
            "Cierra la llave de paso y abre una llave de la casa para confirmar que ya no sale agua.",
            "Respeta el tiempo de secado o enfriado que indica el fabricante antes de volver a meter presión.",
            "Prueba cada unión con el agua abierta antes de resanar o cubrir la tubería.",
          ],
        },
      ],
    },
  ],
});
