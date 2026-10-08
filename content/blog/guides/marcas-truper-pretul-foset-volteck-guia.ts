import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B01 (hoja «Guías PDF»): pág. 1, las 7 marcas en una tabla;
// pág. 2, «Elige en 3 preguntas» y tabla tarea → marca sugerida. El PDF
// suma la portada (3 páginas en total). Misma regla que el artículo: no se
// afirma qué línea cubre cada marca; se remite a la etiqueta o ficha.
export default defineGuide({
  topicId: "B01",
  slug: "marcas-truper-pretul-foset-volteck-guia",
  titulo: "Guía de marcas Truper: cuál elegir según tu trabajo",
  subtitulo: "Las siete marcas de la familia Truper y un método de tres preguntas para elegir sin gastar de más ni quedarte corto.",
  paginas: [
    {
      titulo: "Las 7 marcas de la familia Truper",
      intro: "Todas son del mismo grupo y todas las manejamos en Ferretería 57. No compiten entre sí: cada una responde a un tipo de comprador. La decisión final la da la etiqueta o la ficha de cada producto.",
      bloques: [
        {
          type: "tabla",
          columnas: ["Marca", "Qué es", "Para quién", "Qué revisar al comprar"],
          anchos: [0.9, 1.7, 1.5, 1.9],
          filas: [
            ["Truper", "La marca principal de la familia; la verás en casi todas las categorías", "Quien usa la herramienta seguido o le exige más", "Compara modelos dentro de la marca: material, acabado y accesorios"],
            ["Pretul", "La marca de la familia con precios más accesibles", "Reparaciones de vez en cuando en casa", "Para uso diario, compárala con el modelo Truper equivalente"],
            ["Volteck", "La marca de la familia para material eléctrico", "Instalaciones y reparaciones eléctricas", "El uso indicado en la etiqueta; un electricista valida la instalación"],
            ["Foset", "Marca de la familia Truper", "Según el uso que indique cada producto", "La ficha: uso indicado y medidas; compárala con alternativas"],
            ["Fiero", "Marca de la familia Truper", "Según el uso que indique cada producto", "La ficha: uso indicado y qué incluye la caja"],
            ["Hermex", "Marca de la familia Truper", "Según el uso que indique cada producto", "La etiqueta: uso indicado y compatibilidad con lo que ya tienes"],
            ["Klintek", "Marca de la familia Truper", "Según el uso que indique cada producto", "La etiqueta: uso indicado y modo de empleo"],
          ],
        },
        {
          type: "callout",
          variante: "nota",
          titulo: "Si no lo ves, pregúntanos",
          texto: "No todos los productos están publicados en línea ni en exhibición al mismo tiempo. Como trabajamos con toda la familia Truper, muchas veces lo podemos conseguir. Lleva la clave del producto o la pieza vieja: así lo encontramos rápido.",
        },
      ],
    },
    {
      titulo: "Elige en 3 preguntas",
      intro: "Contesta estas tres preguntas antes de elegir marca. Con las respuestas, la tabla de abajo te dice por dónde empezar.",
      bloques: [
        {
          type: "pasos",
          items: [
            { titulo: "¿Qué tan seguido la vas a usar?", texto: "De vez en cuando: Pretul suele ser suficiente. Varias veces por semana o como herramienta de trabajo: revisa los modelos Truper." },
            { titulo: "¿Qué tan pesado es el trabajo?", texto: "Cuanto más fuerza, calor o desgaste reciba la herramienta, más conviene subir de nivel dentro de la familia." },
            { titulo: "¿Cuánto quieres invertir hoy?", texto: "Invierte más en lo que usarás diario y empieza con lo básico en lo esporádico. Mezclar marcas está bien." },
          ],
        },
        {
          type: "tabla",
          titulo: "Tu tarea y la marca que conviene revisar",
          columnas: ["Tu tarea", "Revisa primero", "Por qué"],
          anchos: [1.6, 1.1, 2.3],
          filas: [
            ["Reparaciones de vez en cuando en casa", "Pretul o Truper", "Pretul cuida tu presupuesto; Truper si quieres un modelo más robusto"],
            ["Trabajo diario en taller u obra", "Truper", "El uso constante pide modelos más robustos; compara fichas dentro de la marca"],
            ["Material para una instalación eléctrica", "Volteck", "Es la marca de la familia para material eléctrico; revisa el uso indicado"],
            ["Tu primera caja de herramientas", "Truper y Pretul", "Robusto en lo que más usarás, básico en lo esporádico"],
            ["Algo de Foset, Fiero, Hermex o Klintek", "Esa marca", "Lee la ficha y compárala con alternativas de la misma categoría"],
          ],
        },
        {
          type: "consejo",
          titulo: "Antes de comprar, anota tres datos",
          texto: "Para qué lo vas a usar, cada cuánto y en qué material o superficie. Con eso, en el mostrador de Ferretería 57 te recomendamos marca y modelo en un par de minutos.",
        },
      ],
    },
  ],
});
