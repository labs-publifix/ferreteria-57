import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B13 (hoja «Guías PDF»): 1 página tipo infografía con los 5
// pasos (el sentido de enrollado se explica con la referencia de las
// manecillas del reloj), el «sí / no» de uso y los errores comunes. Número
// de vueltas: «varias vueltas» o lo que indique el empaque. Portada aparte.
export default defineGuide({
  topicId: "B13",
  slug: "cinta-teflon-que-es-para-que-sirve-como-aplicarla",
  titulo: "Plomería básica visual: guía de cinta teflón y sellado de roscas",
  subtitulo: "Cómo enrollar la cinta para que la rosca selle a la primera, dónde sí y dónde no usarla, y los errores que causan fugas.",
  paginas: [
    {
      titulo: "Cinta teflón en 5 pasos",
      intro: "La cinta sella las roscas de agua: rellena los huecos entre los hilos al apretar. No es pegamento y no va donde ya hay un empaque.",
      bloques: [
        {
          type: "pasos",
          items: [
            { titulo: "Limpia la rosca", texto: "Sin cinta vieja, tierra ni sarro. Limpia y seca." },
            { titulo: "Empieza en el segundo hilo", texto: "Deja libre el primer hilo para que la cinta no entre al tubo." },
            {
              titulo: "Enrolla como las manecillas del reloj",
              texto: "Con la punta del tubo de frente a ti: así, al enroscar, la cinta se aprieta en vez de desenrollarse.",
            },
            { titulo: "Cinta estirada", texto: "Con tensión, sin arrugas, que se marquen los hilos." },
            {
              titulo: "Varias vueltas y aprieta",
              texto: "Las que indique el empaque: la rosca cubierta y el dibujo de los hilos visible. Enrosca a mano y termina con la llave, sin forzar.",
            },
          ],
        },
        {
          type: "callout",
          variante: "nota",
          titulo: "Sí se usa",
          mitad: true,
          items: ["Niples, codos y coples roscados", "Llaves de paso y de nariz", "Brazo de la regadera", "Adaptadores roscados"],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "No se usa",
          mitad: true,
          items: ["Conexiones con empaque", "Tuercas del sifón", "Mangueras flexibles", "Uniones pegadas o termofusionadas"],
        },
        {
          type: "checklist",
          titulo: "Errores que causan fugas",
          items: [
            "Enrollarla al revés: se desenrolla al apretar.",
            "Demasiadas vueltas: no entra o raja la rosca de plástico.",
            "Muy pocas vueltas: quedan huecos y gotea.",
            "Aflojar para alinear: rompe el sello; desarma y vuelve a empezar.",
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Gas: cinta específica y un técnico",
          texto: "La cinta para agua no se usa en gas. Las conexiones de gas las instala o revisa un técnico.",
        },
      ],
    },
  ],
});
