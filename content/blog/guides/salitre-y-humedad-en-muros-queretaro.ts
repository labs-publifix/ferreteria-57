import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B06 (hoja «Guías PDF»): pág. 1, diagnóstico (¿salitre, moho o
// fuga?) en preguntas sí/no; pág. 2, checklist de reparación paso a paso con
// materiales. Los tiempos de secado y la dosificación se remiten a la
// etiqueta de cada producto (regla de redacción). Sin cifras de clima.
// Portada aparte (3 páginas en total).
export default defineGuide({
  topicId: "B06",
  slug: "salitre-y-humedad-en-muros-queretaro",
  titulo: "Guía visual: salitre y humedad, diagnóstico y reparación",
  subtitulo: "Descubre si tu muro tiene salitre, moho o una fuga, y repáralo en el orden correcto para que la mancha no regrese.",
  paginas: [
    {
      titulo: "¿Salitre, moho o fuga?",
      intro: "Contesta en orden. La primera respuesta que coincida con tu muro te dice qué tienes y por dónde empezar.",
      bloques: [
        {
          type: "pasos",
          items: [
            { titulo: "¿El medidor de agua avanza con todas las llaves cerradas?", texto: "Sí: hay una fuga. Repárala antes de tocar el muro; si está dentro del muro o del piso, llama a un plomero. No: sigue." },
            { titulo: "¿La mancha es blanca, como polvo o cristales que crujen?", texto: "Sí: es salitre. Sigue con la pregunta 4 para saber de dónde viene el agua. No: sigue." },
            { titulo: "¿Son puntos negros, verdes o grises que huelen a humedad?", texto: "Sí: es moho, casi siempre por condensación. Limpia con un producto para moho y mejora la ventilación. No: sigue." },
            { titulo: "¿La mancha está en la parte baja y pareja a lo largo del muro?", texto: "Sí: humedad que sube del suelo (capilaridad). Revisa jardineras, patios que encharcan y el desplante. No: sigue." },
            { titulo: "¿Está arriba, en esquinas con la losa o junto a ventanas, y empeora con la lluvia?", texto: "Sí: filtración por lluvia. Revisa azotea, bajadas, pretiles, grietas y sellos de ventanas." },
          ],
        },
        {
          type: "tabla",
          titulo: "Salitre o moho de un vistazo",
          columnas: ["Rasgo", "Salitre", "Moho"],
          anchos: [1, 2, 2],
          filas: [
            ["Color", "Blanco", "Negro, verde o gris"],
            ["Al tocarlo", "Polvo o cristales que se desprenden", "Mancha que se embarra"],
            ["Olor", "No huele", "Huele a humedad"],
            ["Dónde", "Parte baja de muros, fachadas, bardas", "Esquinas, baños, detrás de muebles"],
          ],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Llama a un especialista si…",
          items: [
            "Hay una fuga dentro del muro o del piso.",
            "Hay grietas que crecen o el muro se ve dañado en su estructura.",
            "La humedad no coincide con ninguna de las respuestas anteriores.",
          ],
        },
      ],
    },
    {
      titulo: "Checklist de reparación",
      intro: "Sigue el orden y no te saltes el secado. Los tiempos de secado y curado, y la forma de preparar cada producto, son los que indica su etiqueta.",
      bloques: [
        {
          type: "checklist",
          items: [
            "Corregí el origen de la humedad: fuga, bajada tapada, jardinera, grieta o ventilación.",
            "Me puse guantes, lentes y mascarilla para polvo, y cubrí el piso.",
            "Raspé con espátula la pintura ampollada y el aplanado suelto o hueco.",
            "Cepillé el salitre en seco con cepillo de alambre o de cerda dura, sin mojar el muro.",
            "Limpié el polvo con brocha seca o trapo apenas húmedo.",
            "Dejé secar el muro hasta que quedó seco al tacto y sin manchas oscuras; si volvió a salir salitre, lo cepillé de nuevo.",
            "Resané con mortero o resanador para zonas húmedas (con aditivo impermeabilizante si aplica) y lo dejé curar.",
            "Apliqué sellador o fijador para muros con salitre.",
            "Pinté o impermeabilicé con un producto compatible con el sellador, respetando el tiempo entre capas.",
          ],
        },
        {
          type: "tabla",
          titulo: "Materiales",
          columnas: ["Para", "Lo que necesitas"],
          anchos: [1, 3],
          filas: [
            ["Protección", "Guantes, lentes de seguridad, mascarilla o respirador para polvo"],
            ["Limpieza", "Espátula o rasqueta, cepillo de alambre o de cerda dura, brocha seca"],
            ["Reparación", "Mortero o resanador, aditivo impermeabilizante para mortero, llana, cuchara de albañil"],
            ["Acabado", "Sellador o fijador para salitre, pintura o impermeabilizante para muros, brocha y rodillo"],
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Limpiadores: nunca mezclados",
          mitad: true,
          items: [
            "Algunos limpiadores para salitre son ácidos: úsalos solo como dice la etiqueta.",
            "No los mezcles con cloro, amoníaco ni otros productos.",
          ],
        },
        {
          type: "callout",
          variante: "nota",
          titulo: "Para que no regrese",
          mitad: true,
          items: [
            "Antes de las lluvias, revisa azotea, bajadas y juntas.",
            "Aleja el agua de la base de los muros y ventila baños y cocina.",
          ],
        },
      ],
    },
  ],
});
