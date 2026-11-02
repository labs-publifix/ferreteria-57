import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B14 (hoja «Guías PDF»): 1 página con el calendario por
// trimestre y el checklist de revisión con espacio para la fecha de la
// última revisión. Sin intervalos exactos ni cifras: se remiten al manual
// del equipo. Portada aparte.
export default defineGuide({
  topicId: "B14",
  slug: "mantenimiento-calentador-solar-antes-del-frio",
  titulo: "Calendario anual de mantenimiento del calentador solar",
  subtitulo: "Qué revisar en cada temporada del año y una lista para anotar cuándo hiciste cada revisión.",
  paginas: [
    {
      titulo: "Tu calentador solar, temporada por temporada",
      intro: "Usa este calendario como recordatorio general. Los intervalos y procedimientos exactos de tu equipo los marca su manual.",
      bloques: [
        {
          type: "tabla",
          titulo: "Calendario por trimestre",
          columnas: ["Trimestre", "Qué revisar"],
          anchos: [1, 3],
          filas: [
            ["Enero – marzo", "Tubos después de las noches frías, fugas en uniones y sellos, agua caliente suficiente."],
            ["Abril – junio", "Limpieza de polvo de tubos o colector, válvula de alivio y purga del sarro si el manual lo indica."],
            ["Julio – septiembre", "Soportes y anclajes después de lluvias y viento, óxido, sellos de los tubos."],
            ["Octubre – diciembre", "Revisión completa antes del frío: aislamiento, llaves de paso, mangueras y ánodo según el manual."],
          ],
        },
        {
          type: "tabla",
          titulo: "Checklist de revisión",
          columnas: ["Punto", "Última revisión"],
          anchos: [3, 1.2],
          filas: [
            ["Tubos o colector limpios, sin vidrios rotos", "____ / ____ / ____"],
            ["Sellos de los tubos sin goteo", "____ / ____ / ____"],
            ["Soportes firmes y sin óxido", "____ / ____ / ____"],
            ["Aislamiento de la tubería completo", "____ / ____ / ____"],
            ["Conexiones y mangueras sin fugas", "____ / ____ / ____"],
            ["Llaves de paso abren y cierran bien", "____ / ____ / ____"],
            ["Válvula de alivio sin goteo constante", "____ / ____ / ____"],
            ["Purga de sarro (según el manual)", "____ / ____ / ____"],
            ["Ánodo de sacrificio (según el manual)", "____ / ____ / ____"],
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "En la azotea",
          mitad: true,
          items: [
            "Nunca con lluvia, viento o piso mojado.",
            "Escalera firme y alguien que la sostenga.",
            "No te apoyes en los tubos de vidrio.",
            "Trabaja temprano: a mediodía el agua quema.",
          ],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Llama a un técnico si…",
          mitad: true,
          items: [
            "Hay que cambiar un tubo o vaciar el tanque.",
            "El termotanque gotea.",
            "La válvula de alivio descarga sin parar.",
            "El equipo es presurizado o tiene gas.",
          ],
        },
      ],
    },
  ],
});
