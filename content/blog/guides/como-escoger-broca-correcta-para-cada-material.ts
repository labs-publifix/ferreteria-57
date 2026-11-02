import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B03 (hoja «Guías PDF» del Excel): una página tipo cartel con
// la matriz material × broca × taquete × tornillo × consejo y el recuadro
// «Antes de taladrar». El PDF suma la portada (2 páginas en total).
// Regla de redacción: conocimiento general estable; diámetros, largos y
// velocidades se remiten al empaque y al manual del taladro.
export default defineGuide({
  topicId: "B03",
  slug: "como-escoger-broca-correcta-para-cada-material",
  titulo: "Tabla rápida: broca, taquete y tornillo por material",
  subtitulo: "Qué broca, qué taquete y qué tornillo usar en cada muro o pieza, en una sola hoja para tenerla junto al taladro.",
  paginas: [
    {
      titulo: "Material, broca, taquete y tornillo",
      intro: "Busca tu material en la primera columna y sigue la fila. La broca, el taquete y el tornillo trabajan en trío: compra los tres pensando en el mismo muro.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Material", "Broca", "Taquete", "Tornillo", "Consejo"],
          anchos: [1.15, 1.35, 1.45, 1.4, 1.75],
          filas: [
            [
              "Concreto, tabique y piedra",
              "Carburo de tungsteno para mampostería",
              "Taquete de plástico expansivo; para cargas pesadas, ancla metálica",
              "El que indica el empaque del taquete",
              "Con percusión. Saca la broca de vez en cuando para limpiar el polvo.",
            ],
            [
              "Block y tabique hueco",
              "Carburo de tungsteno para mampostería",
              "Taquete para muro hueco (de alas o de expansión)",
              "El que indica el empaque del taquete",
              "Percusión suave: si golpeas fuerte, la pared interior se rompe.",
            ],
            [
              "Madera",
              "De punta, de paleta o sierra copa",
              "No lleva: el tornillo agarra directo",
              "Pija o tornillo para madera",
              "Haz un barreno guía más delgado que el tornillo para no rajar la pieza.",
            ],
            [
              "Metal y lámina",
              "Acero rápido (HSS)",
              "No lleva",
              "Autorroscante, o tornillo con tuerca y rondana",
              "Sin percusión, velocidad moderada y aceite de corte en piezas gruesas.",
            ],
            [
              "Azulejo y porcelanato",
              "Para cerámica o de diamante",
              "El del muro de atrás (concreto o tabique)",
              "El que indica el empaque del taquete",
              "Sin percusión hasta cruzar el esmalte; después, la broca del muro.",
            ],
            [
              "Vidrio",
              "Para vidrio (punta de lanza)",
              "No lleva",
              "El que trae el herraje o soporte",
              "Muy despacio, sin percusión y con agua para enfriar la zona.",
            ],
            [
              "Tablaroca",
              "Para madera o HSS",
              "Taquete para tablaroca (de mariposa o de expansión)",
              "El que indica el empaque del taquete",
              "Sin percusión. Para cargas pesadas, fija en el bastidor de atrás.",
            ],
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Antes de taladrar",
          mitad: true,
          items: [
            "Marca el punto con lápiz. En azulejo, pega cinta de papel encima para que la broca no patine.",
            "Pasa un detector de tubos y cables por la zona y no perfores en línea con contactos y apagadores.",
            "Arranca a baja velocidad hasta que la broca muerda y súbela según el material; la velocidad exacta viene en el manual del taladro.",
            "Usa lentes de seguridad y, en concreto o tabique, cubrebocas.",
          ],
        },
        {
          type: "consejo",
          titulo: "La regla del trío",
          mitad: true,
          texto: "La broca debe tener el mismo diámetro que el taquete y perforar un poco más profundo que su largo. El diámetro y el largo exactos vienen en el empaque del taquete y de la broca.",
        },
      ],
    },
  ],
});
