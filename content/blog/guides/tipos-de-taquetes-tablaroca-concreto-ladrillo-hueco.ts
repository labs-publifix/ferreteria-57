import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B09 (hoja «Guías PDF»): 1 página con la tabla Tipo de muro ×
// Taquete × Broca × Tornillo × Uso, checklist de 6 pasos de instalación y el
// recuadro «No cuelgues esto con taquete de plástico». Sin cifras de carga:
// se remiten al empaque del taquete. Portada aparte (2 páginas en total).
export default defineGuide({
  topicId: "B09",
  slug: "tipos-de-taquetes-tablaroca-concreto-ladrillo-hueco",
  titulo: "Guía de taquetes por tipo de muro",
  subtitulo: "Qué taquete, broca y tornillo usar en concreto, tabique, block hueco y tablaroca, y cómo instalarlos para que nada se caiga.",
  paginas: [
    {
      titulo: "Muro, taquete, broca y tornillo",
      intro: "Primero identifica tu muro: golpe con los nudillos y una perforación de prueba. El diámetro de la broca, el tornillo y la carga que aguanta cada taquete vienen en su empaque.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Tipo de muro", "Taquete", "Broca", "Tornillo", "Uso"],
          anchos: [1, 1.5, 1.15, 1.05, 1.2],
          filas: [
            ["Concreto sólido", "Plástico o nylon; metálico o ancla para lo pesado", "Para concreto, con percusión", "El que indica el empaque", "Repisas, gabinetes, rejas"],
            ["Tabique rojo macizo", "Plástico o nylon", "Mampostería, percusión suave", "El que indica el empaque", "Cuadros, repisas, cortineros"],
            ["Block o tabique hueco", "Para muro hueco o nylon universal", "Mampostería, percusión suave", "El que indica el empaque", "Repisas ligeras, accesorios"],
            ["Tablaroca", "Mariposa, autoperforante o de palanca", "Madera o metal, sin percusión", "El del taquete; lo pesado, al bastidor", "Cuadros, accesorios ligeros"],
          ],
        },
        {
          type: "checklist",
          titulo: "Instalación en 6 pasos",
          items: [
            "Marca, nivela y revisa que no pasen tuberías ni cables.",
            "Broca del material del muro y del mismo diámetro que el taquete.",
            "Perfora derecho, un poco más profundo que el largo del taquete.",
            "Limpia el polvo del agujero.",
            "Mete el taquete hasta que quede al ras del muro.",
            "Atornilla con el tornillo indicado, firme pero sin forzar.",
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "No cuelgues esto con taquete de plástico",
          items: [
            "Pantallas y soportes de TV, alacenas, gabinetes, lavabos y calentadores.",
            "Barras de apoyo, pasamanos, hamacas, columpios y costales de box.",
            "Usa taquetes metálicos o anclas en concreto, o fija al bastidor en tablaroca.",
          ],
        },
      ],
    },
  ],
});
