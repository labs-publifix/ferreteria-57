import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B07 (hoja «Guías PDF»): pág. 1, cálculo de capacidad (mini
// calculadora en papel + tabla por personas) y lista de componentes; pág. 2,
// checklist de instalación y de limpieza semestral. El consumo por persona es
// un ejemplo declarado (150 L/día) que el lector ajusta con su recibo. Cortes
// de agua en general, sin colonias. Portada aparte (3 páginas en total).
export default defineGuide({
  topicId: "B07",
  slug: "instalar-tinaco-o-cisterna-queretaro",
  titulo: "Checklist de instalación de tinaco o cisterna",
  subtitulo: "Calcula cuánta agua necesitas guardar, reúne todas las piezas y deja tu instalación lista para pasar los cortes sin preocuparte.",
  paginas: [
    {
      titulo: "¿Cuánta agua necesito guardar?",
      intro: "Personas × consumo por persona al día × días de reserva. Los números de la tabla usan un consumo de ejemplo de 150 litros por persona al día: cámbialo por el de tu casa (revisa tu recibo de agua).",
      bloques: [
        {
          type: "tabla",
          titulo: "Mi cálculo",
          columnas: ["Dato", "Ejemplo", "Mi casa"],
          anchos: [2.2, 1.4, 1.4],
          filas: [
            ["Personas en la casa", "4", "__________"],
            ["Litros por persona al día", "150 (ejemplo)", "__________"],
            ["Litros al día (personas × litros)", "600", "__________"],
            ["Días de reserva que quiero", "2", "__________"],
            ["Capacidad total (litros al día × días)", "1,200", "__________"],
          ],
        },
        {
          type: "tabla",
          titulo: "Reserva con el consumo de ejemplo",
          columnas: ["Personas", "Al día", "1 día", "2 días", "3 días"],
          filas: [
            ["2", "300 L", "300 L", "600 L", "900 L"],
            ["3", "450 L", "450 L", "900 L", "1,350 L"],
            ["4", "600 L", "600 L", "1,200 L", "1,800 L"],
            ["5", "750 L", "750 L", "1,500 L", "2,250 L"],
            ["6", "900 L", "900 L", "1,800 L", "2,700 L"],
          ],
        },
        {
          type: "tabla",
          titulo: "Piezas de la instalación",
          columnas: ["Para", "Lo que necesitas"],
          anchos: [1, 3],
          filas: [
            ["Tinaco", "Flotador o válvula de llenado, válvulas de entrada y salida, multiconector, jarro de aire, filtro de sedimentos"],
            ["Cisterna", "Flotador, tapa segura, bomba para subir el agua, control de nivel, válvula de pie (pichancha)"],
            ["Tubería", "Tubo y conexiones del material adecuado, cinta teflón o sellador para roscas"],
            ["Presión (opcional)", "Bomba presurizadora si el tinaco no tiene suficiente altura"],
          ],
        },
      ],
    },
    {
      titulo: "Instalación y limpieza",
      intro: "Marca cada punto al terminarlo. Para la bomba y su conexión eléctrica, sigue el manual del fabricante.",
      bloques: [
        {
          type: "checklist",
          titulo: "Instalación",
          items: [
            "El lugar elegido aguanta el peso del depósito lleno (cada litro pesa alrededor de un kilo).",
            "La base es firme, plana, nivelada y cubre todo el fondo.",
            "El tinaco queda lo bastante alto sobre la salida de agua más alta, o ya tengo bomba presurizadora.",
            "Instalé flotador y revisé que cierre al llenarse.",
            "Puse válvulas de paso en la entrada y la salida.",
            "Conecté jarro de aire y filtro de sedimentos.",
            "La bomba tiene control de nivel y conexión eléctrica protegida de la lluvia, con tierra física.",
            "Sellé las roscas y probé todas las uniones con el agua abierta.",
            "La tapa cierra bien y nadie puede abrirla por accidente.",
          ],
        },
        {
          type: "checklist",
          titulo: "Limpieza, al menos dos veces al año",
          items: [
            "Cerré la entrada y usé el agua hasta bajar el nivel.",
            "Vacié el resto sin dejar que la bomba trabaje en seco.",
            "Tallé paredes y fondo con cepillo suave, sin abrasivos.",
            "Enjuagué y retiré el sedimento.",
            "Desinfecté como indica la etiqueta del producto y enjuagué.",
            "Llené y revisé flotador, válvulas y filtro.",
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "En la cisterna, nunca solo",
          items: [
            "Ventílala antes de entrar y desconecta la bomba.",
            "Ten siempre a otra persona afuera y no mezcles productos de limpieza.",
          ],
        },
      ],
    },
  ],
});
