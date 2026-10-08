import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B02 (hoja «Guías PDF»): pág. 1, checklist de las 15
// herramientas con casillas, por nivel; pág. 2, «qué buscar al comprar»
// (una línea por herramienta) y espacio para anotar medidas de la casa.
// El PDF suma la portada (3 páginas en total). Sin precios ni cifras.
export default defineGuide({
  topicId: "B02",
  slug: "kit-basico-herramientas-hogar",
  titulo: "Checklist: caja de herramientas básica del hogar",
  subtitulo: "Las 15 herramientas básicas en tres niveles, para palomear lo que ya tienes y comprar solo lo que te falta.",
  paginas: [
    {
      titulo: "Tu caja en 3 niveles",
      intro: "Palomea lo que ya tienes. Empieza por el nivel 1 y sube de nivel cuando ya le vayas a dar uso a las herramientas siguientes.",
      bloques: [
        {
          type: "checklist",
          titulo: "Nivel 1 · Lo indispensable",
          items: [
            "Martillo: clavar, desclavar y ajustar a golpes suaves",
            "Juego de desarmadores: punta plana y de cruz en varios tamaños",
            "Pinzas: sujetar, doblar y cortar alambre o cable",
            "Flexómetro: medir antes de comprar o cortar",
            "Nivel: dejar derecho lo que cuelgas o instalas",
            "Cutter: cortar cartón, cinta, plástico delgado o tablaroca",
            "Llave ajustable: tuercas de regadera, lavabo y muebles",
          ],
        },
        {
          type: "checklist",
          titulo: "Nivel 2 · Cuando ya haces más cosas",
          items: [
            "Juego de llaves: apretar con firmeza, sin juego",
            "Serrucho: cortar madera",
            "Segueta: cortar metal y plástico",
            "Pistola de silicón: sellar juntas en baño, cocina y ventanas",
            "Taladro: perforar y atornillar; la primera eléctrica que conviene",
          ],
        },
        {
          type: "checklist",
          titulo: "Nivel 3 · Para proyectos",
          items: [
            "Rotomartillo: perforar concreto y piedra",
            "Caladora: cortes rectos o curvos en madera y triplay",
            "Multímetro: revisar contactos, pilas y fusibles",
          ],
        },
      ],
    },
    {
      titulo: "Qué buscar al comprar",
      intro: "Una línea por herramienta. Las medidas, capacidades y usos exactos vienen en la etiqueta o ficha de cada producto.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Herramienta", "Qué buscar"],
          anchos: [1, 3.2],
          filas: [
            ["Martillo", "Mango que no resbale y un peso cómodo para tu mano"],
            ["Desarmadores", "Puntas que entren justas en el tornillo"],
            ["Pinzas", "Que cierren parejo y corten limpio"],
            ["Flexómetro", "Cinta fácil de leer, con freno y largo suficiente"],
            ["Nivel", "Burbujas fáciles de ver y cuerpo que no se doble"],
            ["Cutter", "Cuerpo firme, seguro para la hoja y repuestos fáciles"],
            ["Llave ajustable", "Mordaza que abra y cierre suave, sin juego"],
            ["Juego de llaves", "Las medidas que más usas, en un solo sistema"],
            ["Serrucho", "Dentado adecuado al corte que harás"],
            ["Segueta", "Arco firme y hojas de repuesto para tu material"],
            ["Pistola de silicón", "Que empuje sin trabarse y libere al soltar"],
            ["Taladro", "Control de velocidad y percusión si perforas tabique"],
            ["Rotomartillo", "Tipo de broca que acepta y sus funciones"],
            ["Caladora", "Control de velocidad y hojas fáciles de cambiar"],
            ["Multímetro", "Pantalla fácil de leer y puntas en buen estado"],
          ],
        },
        {
          type: "tabla",
          titulo: "Medidas de tu casa (anótalas antes de comprar)",
          columnas: ["Qué medir", "Anota aquí"],
          anchos: [2, 2.2],
          filas: [
            ["Ancho de puertas y ventanas", "______________________________"],
            ["Altura para repisas y cuadros", "______________________________"],
            ["Tuercas de regadera y lavabo", "______________________________"],
            ["Otro", "______________________________"],
          ],
        },
      ],
    },
  ],
});
