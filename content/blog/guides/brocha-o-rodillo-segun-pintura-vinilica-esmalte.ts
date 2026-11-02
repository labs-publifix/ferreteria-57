import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B08 (hoja «Guías PDF»): 1 página con la tabla Superficie ×
// Pintura × Herramienta × Consejo y el checklist de materiales para pintar un
// cuarto. Sin marcas de pintura; los largos de felpa se remiten a la etiqueta
// del rodillo. Portada aparte (2 páginas en total).
export default defineGuide({
  topicId: "B08",
  slug: "brocha-o-rodillo-segun-pintura-vinilica-esmalte",
  titulo: "Guía rápida: qué herramienta usar según tu pintura",
  subtitulo: "La brocha y el rodillo correctos para cada superficie con pintura vinílica o esmalte, y la lista de materiales para pintar un cuarto.",
  paginas: [
    {
      titulo: "Superficie, pintura y herramienta",
      intro: "Vinílica = base agua: brocha sintética y limpieza con agua. Esmalte = casi siempre base solvente: brocha de cerdas naturales, ventilación y limpieza con el solvente de la etiqueta. El largo exacto de felpa viene en la etiqueta del rodillo.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Superficie", "Pintura", "Herramienta", "Consejo"],
          anchos: [1.25, 0.9, 1.6, 1.6],
          filas: [
            ["Muro interior liso", "Vinílica", "Rodillo felpa corta o media + brocha sintética", "Recorta orillas con brocha antes de pasar el rodillo"],
            ["Muro con textura", "Vinílica", "Rodillo felpa larga + brocha sintética", "Carga bien el rodillo para llegar al fondo de la textura"],
            ["Plafón", "Vinílica", "Rodillo felpa media + extensión", "Usa lentes; pinta en franjas desde la ventana hacia adentro"],
            ["Fachada o barda", "Vinílica exterior", "Rodillo felpa larga + extensión + brocha ancha", "No pintes con sol directo ni con lluvia cerca"],
            ["Puerta de madera", "Esmalte", "Mini rodillo de espuma o felpa corta + brocha natural", "Capas delgadas para que no escurra"],
            ["Herrería y rejas", "Esmalte", "Brocha de cerdas naturales", "Primario anticorrosivo antes, sobre metal limpio"],
            ["Mueble o tabla", "Esmalte", "Rodillo de espuma + brocha natural angosta", "Lija suave entre capas si la etiqueta lo indica"],
            ["Marcos y zoclos", "Vinílica o esmalte", "Brocha angosta o sesgada", "Protege con cinta de enmascarar"],
          ],
        },
        {
          type: "checklist",
          titulo: "Materiales para pintar un cuarto",
          items: [
            "Pintura y, si hace falta, sellador.",
            "Rodillo con la felpa adecuada y charola.",
            "Brocha para recortar del tipo de cerda que corresponda.",
            "Extensión para el rodillo.",
            "Cinta de enmascarar y plástico para cubrir.",
            "Espátula, resanador y lija.",
            "Cubeta, palo para mezclar y trapos.",
            "Guantes y lentes.",
          ],
        },
      ],
    },
  ],
});
