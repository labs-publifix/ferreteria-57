import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B17 (hoja «Guías PDF»): checklist + calendario en 1 página:
// purga en 8 pasos y calendario anual con espacios para anotar la fecha.
// Procedimiento general para boiler de depósito; los detalles los indica el
// manual. Frecuencia como regla práctica, sin cifras de dureza. Portada
// aparte (2 páginas en total).
export default defineGuide({
  topicId: "B17",
  slug: "como-purgar-boiler-calentador-de-agua-sarro",
  titulo: "Calendario y checklist de mantenimiento del boiler",
  subtitulo: "Los 8 pasos para purgar un boiler de depósito y un calendario para anotar cada mantenimiento del año.",
  paginas: [
    {
      titulo: "Purga tu boiler y lleva el registro",
      intro: "Para boiler de depósito. Antes de empezar, lee el manual de tu equipo: ahí viene cómo apagarlo y encenderlo y cualquier indicación del fabricante.",
      bloques: [
        {
          type: "checklist",
          titulo: "Purga en 8 pasos",
          items: [
            "1. Apaga el boiler (perilla en apagado o piloto y llave de gas cerrada, o pastilla apagada si es eléctrico)",
            "2. Cierra la llave de entrada de agua fría y deja enfriar el agua, de preferencia de un día para otro",
            "3. Abre una llave de agua caliente de la casa para aliviar la presión",
            "4. Conecta una manguera a la válvula de drenado y llévala a una coladera, más abajo que la válvula",
            "5. Abre la válvula y deja salir el agua con sedimento hasta vaciar el tanque",
            "6. Abre un poco la entrada de agua fría para enjuagar el fondo, hasta que el agua salga clara",
            "7. Cierra la válvula, retira la manguera y llena el tanque hasta que la llave de agua caliente dé un chorro sin aire",
            "8. Enciende siguiendo el manual y revisa que no haya fugas en válvulas y conexiones",
          ],
        },
        {
          type: "tabla",
          titulo: "Calendario anual (anota la fecha de cada revisión)",
          columnas: ["Revisión", "Cuándo (regla práctica)", "Fecha", "Fecha"],
          anchos: [2, 2.2, 1, 1],
          filas: [
            ["Purga del tanque", "Al menos una vez al año; más seguido con agua dura", "__ / __ / ____", "__ / __ / ____"],
            ["Fugas en conexiones y válvula de drenado", "Cada vez que purgues", "__ / __ / ____", "__ / __ / ____"],
            ["Válvula de alivio", "Cada vez que purgues; si gotea, técnico", "__ / __ / ____", "__ / __ / ____"],
            ["Ánodo de sacrificio", "Según el manual o con el técnico", "__ / __ / ____", "__ / __ / ____"],
            ["Quemador, flama y ventilación", "Una vez al año, con el técnico", "__ / __ / ____", "__ / __ / ____"],
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Si huele a gas",
          mitad: true,
          items: [
            "No enciendas luces, cerillos ni aparatos",
            "Cierra la llave de gas si es seguro",
            "Ventila, sal de la casa y llama desde afuera",
          ],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Llama a un técnico si…",
          mitad: true,
          items: [
            "El tanque gotea por el cuerpo o la base",
            "La flama es amarilla o hay hollín",
            "La válvula de alivio descarga seguido",
          ],
        },
      ],
    },
  ],
});
