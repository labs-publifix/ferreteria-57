import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B16 (hoja «Guías PDF»): tabla de decisión en 1 página: tabla
// cable × aplicación × conector, pasos de un empalme seguro y checklist de
// herramientas. Conocimiento general; la capacidad de cada conector se remite
// al empaque. Portada aparte (2 páginas en total).
export default defineGuide({
  topicId: "B16",
  slug: "conectores-electricos-capuchones-cinta-aislar-regletas",
  titulo: "Guía rápida de empalmes y conectores",
  subtitulo: "Qué conector usar para cada caso, cómo hacer un empalme seguro y qué herramientas tener a la mano.",
  paginas: [
    {
      titulo: "Elige el conector y haz el empalme",
      intro: "Orientativo. El empaque de cada conector indica qué calibres, cuántos cables y qué corriente acepta: revísalo antes de comprar.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Cable", "Aplicación", "Conector"],
          anchos: [1.3, 2.2, 2],
          filas: [
            ["Sólido de iluminación o contactos", "Unir cables en la caja de un apagador, contacto o lámpara", "Capuchón del tamaño que indique el empaque"],
            ["Sólido con flexible", "Conectar una lámpara o luminaria a la instalación", "Conector de palanca para ambos tipos de cable"],
            ["Varios cables en un punto", "Luminarias con varias salidas o conexiones que se revisarán después", "Regleta (clema) o conector de palanca de varias entradas"],
            ["Grueso, de equipos de carga alta", "Minisplit, boiler o calentador eléctrico", "El que indique el manual; lo instala un electricista"],
            ["Cualquiera", "Reforzar el aislamiento de un empalme bien hecho", "Cinta de aislar, nunca sola"],
          ],
        },
        {
          type: "pasos",
          titulo: "Empalme seguro en 6 pasos",
          items: [
            { titulo: "Corta la corriente", texto: "Apaga la pastilla del circuito y comprueba con el probador de voltaje que no hay corriente." },
            { titulo: "Pela a la medida", texto: "Retira el forro solo lo que indique el conector, sin mellar el cobre." },
            { titulo: "Une con el conector", texto: "Gira el capuchón hasta que apriete, o baja la palanca o aprieta el tornillo de la regleta." },
            { titulo: "Jala suave", texto: "Ningún cable debe salirse ni quedar cobre a la vista." },
            { titulo: "Guarda en la caja", texto: "Acomoda el empalme dentro de la caja de registro y ponle su tapa." },
            { titulo: "Prueba", texto: "Restablece la corriente y verifica que todo funcione sin calentarse." },
          ],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Herramientas y material",
          mitad: true,
          items: [
            "Probador de voltaje sin contacto",
            "Pinzas pelacables y de electricista",
            "Desarmador con mango aislado",
            "Capuchones, regletas o conectores de palanca",
            "Cinta de aislar y cajas de registro con tapa",
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Nunca",
          mitad: true,
          items: [
            "Empalmes de cables torcidos con solo cinta",
            "Empalmes dentro del muro sin caja o colgando",
            "Trabajar con el circuito energizado",
            "Equipos de carga alta sin electricista",
          ],
        },
      ],
    },
  ],
});
