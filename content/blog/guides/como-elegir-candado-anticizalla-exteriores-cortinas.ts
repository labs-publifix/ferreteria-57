import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B12 (hoja «Guías PDF»): pág. 1, checklist de auditoría de 20
// puntos (accesos, candados, iluminación, cortinas, rutinas); pág. 2, cómo
// elegir candado según el uso y plan de mejora por prioridades. Sin grados
// de seguridad ni promesas de «inviolable»; medidas, al empaque.
export default defineGuide({
  topicId: "B12",
  slug: "como-elegir-candado-anticizalla-exteriores-cortinas",
  titulo: "Auditoría de seguridad básica para casa o negocio",
  subtitulo: "20 puntos para revisar accesos, candados, iluminación, cortinas y rutinas, y un plan para mejorar por prioridades.",
  paginas: [
    {
      titulo: "Checklist de auditoría: 20 puntos",
      intro: "Haz la revisión de noche y desde la calle, como la vería alguien de fuera. Marca lo que está bien y anota lo que falta para la página siguiente.",
      bloques: [
        {
          type: "checklist",
          titulo: "Accesos",
          items: [
            "Tengo identificadas todas las entradas: cortina, puerta, reja, portón y azotea.",
            "Cada entrada cierra por completo, sin huecos ni holguras.",
            "Las bisagras y marcos están firmes, sin tornillos flojos.",
            "No hay escaleras, botes o muebles que ayuden a trepar a la azotea.",
          ],
        },
        {
          type: "checklist",
          titulo: "Candados y portacandados",
          items: [
            "Los candados son para exterior y no tienen óxido.",
            "El arco entra justo en el portacandado, sin juego.",
            "Los portacandados y aldabas no tienen tornillos por fuera.",
            "El portacandado es igual de fuerte que el candado.",
          ],
        },
        {
          type: "checklist",
          titulo: "Iluminación",
          items: [
            "La entrada queda bien iluminada de noche.",
            "No hay rincones oscuros junto a la cortina, la reja o el portón.",
            "Los focos exteriores funcionan y están protegidos.",
            "El interior se ve desde la calle o hay una luz que quede encendida.",
          ],
        },
        {
          type: "checklist",
          titulo: "Cortinas, rejas y ventanas",
          items: [
            "La cortina corre bien y el riel no está flojo.",
            "Las orejas de la cortina y su pasador o chapa están firmes.",
            "Las rejas no tienen barrotes flojos ni soldaduras rotas.",
            "Las ventanas cierran y tienen protección donde hace falta.",
          ],
        },
        {
          type: "checklist",
          titulo: "Rutinas y llaves",
          items: [
            "Sé cuántas copias de llave hay y quién las tiene.",
            "Cambio el candado si se pierde una llave o se va alguien que la tenía.",
            "Una persona responsable revisa el cierre, siempre en el mismo orden.",
            "Lubrico candados y cerraduras antes y después de la temporada de lluvias.",
          ],
        },
      ],
    },
    {
      titulo: "Qué candado usar y plan de mejora",
      intro: "Un candado anticizalla dificulta el corte del arco, pero ningún candado es inviolable: elige según el lugar y refuerza también lo que lo rodea.",
      bloques: [
        {
          type: "tabla",
          titulo: "Cómo elegir candado según el uso",
          columnas: ["Lugar", "Qué candado", "Revisa también"],
          anchos: [1, 1.5, 1.3],
          filas: [
            ["Cortina de negocio", "Anticizalla de arco corto o protegido, justo en las orejas", "Riel y orejas firmes, sin óxido"],
            ["Reja o puerta", "Arco corto en portacandado soldado o atornillado por dentro", "Tornillos que no queden por fuera"],
            ["Portón con cadena", "Arco largo con cadena de eslabón grueso de acero endurecido", "Cadena no más delgada que el arco"],
            ["Bodega", "Cuerpo macizo con tapa para el ojo de la llave", "Quién tiene copia de la llave"],
          ],
        },
        {
          type: "checklist",
          titulo: "Antes de comprar",
          items: [
            "Mide el orificio del portacandado: el arco debe entrar con holgura mínima.",
            "Elige el arco más grueso que quepa y, si se puede, corto o protegido.",
            "Confirma en el empaque que sea para exterior y el material del arco.",
            "Prefiere tapa en el ojo de la llave y llave que solo sale con el candado cerrado.",
          ],
        },
        {
          type: "pasos",
          titulo: "Plan de mejora por prioridades",
          items: [
            {
              titulo: "Hoy: lo que está abierto o roto",
              texto: "Entradas que no cierran, candados dañados, llaves perdidas, focos fundidos en la entrada.",
            },
            {
              titulo: "Esta semana: lo que está débil",
              texto: "Portacandados con tornillos por fuera, candados de interior en exterior, cadenas delgadas, rincones oscuros.",
            },
            {
              titulo: "Este mes: lo que suma capas",
              texto: "Pasador o chapa adicional en la cortina, refuerzo de rejas, rutina de cierre por escrito y lubricación programada.",
            },
          ],
        },
        {
          type: "consejo",
          titulo: "Llévanos una foto",
          texto: "Si no sabes qué candado le queda a tu portacandado o cortina, tráenos una foto con una moneda junto al orificio como referencia de tamaño y te ayudamos a elegir en el mostrador.",
        },
      ],
    },
  ],
});
