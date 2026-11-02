import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B11 (hoja «Guías PDF»): 1 página con el árbol de decisión
// (¿qué intento primero?), los pasos de cada método, la lista de materiales
// y el recuadro de seguridad con químicos. Sin temperaturas exactas: cada
// destapacaños se usa como indica su etiqueta. Portada aparte.
export default defineGuide({
  topicId: "B11",
  slug: "como-destapar-tuberia-lavabo-sin-danar-pvc",
  titulo: "Guía de emergencia: lavabo tapado",
  subtitulo: "Qué intentar primero, cómo hacer cada método paso a paso y cómo usar un destapacaños sin dañar el PVC ni lastimarte.",
  paginas: [
    {
      titulo: "Lavabo tapado: qué intentar primero",
      intro: "Ve de lo más suave a lo más agresivo y no pases al siguiente método hasta probar el anterior. Casi siempre la obstrucción está en el tapón o en el sifón.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Si pasa esto…", "Haz esto"],
          anchos: [1, 1.5],
          filas: [
            ["El agua baja lento", "1. Saca y limpia el tapón. 2. Usa el chupón."],
            ["Sigue tapado después del chupón", "3. Desarma y limpia el sifón."],
            ["El sifón estaba limpio", "4. Pasa una sonda por el tubo de la pared."],
            ["Baja lento por jabón o grasa", "5. Destapacaños apto para PVC, como indica su etiqueta."],
            ["Se tapan varios desagües o el olor sigue", "Puede ser la tubería general: llama a un plomero."],
          ],
        },
        {
          type: "pasos",
          titulo: "Cada método, paso a paso",
          items: [
            {
              titulo: "Chupón",
              texto: "Sin tapón, tapa el rebosadero con un trapo húmedo, deja agua que cubra la copa y bombea con firmeza varias veces.",
            },
            {
              titulo: "Sifón",
              texto: "Cubeta debajo, afloja a mano las dos tuercas, limpia la curva, revisa los empaques y arma apretando a mano. Prueba que no gotee.",
            },
            {
              titulo: "Sonda",
              texto: "Con el sifón fuera, métela por el tubo de la pared girando la manivela, sin forzar en las curvas. Sácala, límpiala y repite.",
            },
          ],
        },
        {
          type: "checklist",
          titulo: "Ten a la mano",
          items: [
            "Chupón chico de copa plana",
            "Cubeta, trapos y cepillo",
            "Sonda delgada para lavabo",
            "Empaques o un sifón de repuesto",
            "Guantes y lentes de seguridad",
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Si usas destapacaños químico",
          items: [
            "Solo si la etiqueta dice que es apto para PVC; respeta cantidad y tiempo.",
            "Guantes, lentes y ventilación; niños y mascotas lejos.",
            "Nunca lo mezcles con otro destapacaños, con cloro ni con agua hirviendo.",
            "No uses el chupón después ni desarmes el sifón con el químico dentro.",
          ],
        },
      ],
    },
  ],
});
