import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B05 (hoja «Guías PDF»): pág. 1, tabla orientativa calibre ↔
// amperes ↔ usos comunes; pág. 2, cálculo paso a paso (watts → amperes →
// calibre) con 3 ejemplos y aviso de seguridad. Regla práctica 14/12/10 AWG
// ↔ 15/20/30 A presentada como orientativa, sin números de norma; los watts
// de los ejemplos son ilustrativos. Portada aparte (3 páginas en total).
export default defineGuide({
  topicId: "B05",
  slug: "calibre-de-cable-electrico-para-cada-electrodomestico",
  titulo: "Tabla de calibres: qué cable para cada aparato",
  subtitulo: "La regla práctica para elegir el calibre de cable en casa y un cálculo paso a paso para saber cuántos amperes pide cada aparato.",
  paginas: [
    {
      titulo: "Calibre, pastilla y usos comunes",
      intro: "Regla práctica orientativa para circuitos de una casa. El dato que manda es el de la placa o el manual del aparato, y una instalación nueva la valida un electricista.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Calibre (AWG)", "Circuito (pastilla)", "Usos comunes"],
          anchos: [1, 1, 3],
          filas: [
            ["14", "15 A", "Circuitos de iluminación"],
            ["12", "20 A", "Contactos de uso general, cocina, lavadora, refrigerador"],
            ["10", "30 A", "Equipos grandes con circuito propio: algunos minisplits, boiler o calentador eléctrico"],
          ],
        },
        {
          type: "tabla",
          titulo: "Por aparato",
          columnas: ["Aparato o uso", "Calibre orientativo", "Ten en cuenta"],
          anchos: [1.2, 1.1, 2.7],
          filas: [
            ["Iluminación", "14", "Circuito de 15 A"],
            ["Contactos de recámaras y sala", "12", "Circuito de 20 A"],
            ["Contactos de cocina", "12", "Microondas, cafetera y refrigerador suelen compartir circuito: suma sus amperes"],
            ["Refrigerador", "12", "En su propio contacto, sin extensiones ni multicontactos"],
            ["Lavadora", "12", "Con tierra física; si tiene secadora eléctrica, revisa la placa"],
            ["Minisplit", "12 o 10, según la placa", "Siempre en circuito propio; el manual indica calibre y pastilla"],
            ["Boiler o calentador eléctrico", "10 o más grueso, según la placa", "Circuito propio; instalación por electricista"],
            ["Estufa u horno eléctrico", "Según la placa", "Circuito propio, a menudo a voltaje mayor; instalación por electricista"],
          ],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Cómo leer el calibre",
          mitad: true,
          items: [
            "Entre más pequeño el número, más grueso el cable: el 10 es más grueso que el 12.",
            "El calibre y el tipo (THW, THHW-LS) vienen impresos en el forro.",
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Cable y pastilla van juntos",
          mitad: true,
          items: [
            "Nunca pongas una pastilla más grande sobre un cable delgado.",
            "En recorridos largos, sube un calibre y consúltalo con un electricista.",
          ],
        },
      ],
    },
    {
      titulo: "Calcula los amperes de tu aparato",
      intro: "Amperes = watts ÷ volts. Los contactos comunes de una casa trabajan a 127 V. Los watts de estos ejemplos son ilustrativos: usa los de la placa de tu aparato.",
      bloques: [
        {
          type: "pasos",
          items: [
            { titulo: "Busca los watts en la placa", texto: "Atrás, abajo o dentro de la puerta del aparato, o en el manual. Si la placa trae amperes, ya tienes el dato." },
            { titulo: "Divide entre los volts", texto: "Watts ÷ 127 = amperes que consume el aparato funcionando." },
            { titulo: "Suma lo que comparte el circuito", texto: "Todo lo que está conectado a la misma pastilla cuenta." },
            { titulo: "Deja margen y elige", texto: "Para cargas continuas, no pases de alrededor del 80 % del circuito: unos 12 A en uno de 15 A y unos 16 A en uno de 20 A. Con ese total, ubica el calibre en la tabla." },
          ],
        },
        {
          type: "tabla",
          titulo: "Tres ejemplos resueltos (ilustrativos)",
          columnas: ["Caso", "Cálculo", "Resultado orientativo"],
          anchos: [1.5, 1.6, 1.9],
          filas: [
            ["Microondas de 1,200 W", "1,200 ÷ 127 = unos 9.4 A", "Cabe en un circuito de 15 A si va solo; en cocina, circuito de 20 A con calibre 12"],
            ["Cocina: microondas 1,200 W + cafetera 900 W", "2,100 ÷ 127 = unos 16.5 A", "Muy cerca del límite de un circuito de 20 A: no los uses al mismo tiempo con otros aparatos o reparte la carga en dos circuitos"],
            ["Iluminación: 8 focos LED de 10 W", "80 ÷ 127 = unos 0.6 A", "Carga baja: circuito de iluminación de 15 A con calibre 14"],
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Antes de tocar la instalación",
          items: [
            "Apaga la pastilla del circuito y confirma con un probador de voltaje que no hay corriente.",
            "No abras ni modifiques el centro de carga: hay partes con corriente aunque todo esté apagado.",
            "Un circuito nuevo o un equipo de carga alta lo instala un electricista.",
          ],
        },
      ],
    },
  ],
});
