import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B15 (hoja «Guías PDF»): checklist de revisión. Pág. 1, señales
// de alerta en 15 puntos; pág. 2, prioridades de actualización y cuándo llamar
// a un electricista. Solo riesgos y soluciones seguras; sin instrucciones de
// conexiones clandestinas, estadísticas ni números de norma. Portada aparte
// (3 páginas en total).
export default defineGuide({
  topicId: "B15",
  slug: "peligro-diablitos-y-falsos-contactos-instalacion-electrica",
  titulo: "Señales de alerta en tu instalación eléctrica",
  subtitulo: "Un recorrido de 15 puntos para detectar diablitos, falsos contactos y sobrecargas, y el orden en que conviene atenderlos.",
  paginas: [
    {
      titulo: "Recorre tu casa: 15 señales de alerta",
      intro: "Marca cada señal que encuentres. Revisa con buena luz, sin abrir cajas ni tocar partes metálicas. Una sola señal ya es motivo para atender ese punto.",
      bloques: [
        {
          type: "checklist",
          titulo: "Contactos, clavijas y apagadores",
          items: [
            "Contactos, apagadores o clavijas tibios o calientes al tacto",
            "Marcas oscuras o amarillentas alrededor de un contacto o en una clavija",
            "Chispas al conectar o desconectar un aparato",
            "Clavijas que bailan o se caen del contacto",
            "Contactos flojos en la pared o con la tapa rota",
          ],
        },
        {
          type: "checklist",
          titulo: "Extensiones y diablitos",
          items: [
            "Adaptadores que convierten un contacto en varios",
            "Extensiones conectadas a otras extensiones",
            "Multicontactos sin protección con aparatos de consumo alto",
            "Extensiones que se volvieron permanentes porque faltan contactos",
            "Cables de extensión enrollados, aplastados bajo muebles o bajo alfombras",
          ],
        },
        {
          type: "checklist",
          titulo: "Toda la instalación",
          items: [
            "Olor a plástico quemado cerca de un contacto, un aparato o el centro de carga",
            "Focos que parpadean o bajan de intensidad cuando arranca otro aparato",
            "Una pastilla que se bota seguido sin que hayas conectado nada nuevo",
            "Zumbidos o chasquidos en contactos, apagadores o el centro de carga",
            "Cables expuestos, empalmes con cinta vieja o cajas sin tapa",
          ],
        },
      ],
    },
    {
      titulo: "Qué atender primero y cuándo llamar a un electricista",
      intro: "No hace falta rehacer todo de un día para otro: empieza por lo urgente y avanza en este orden.",
      bloques: [
        {
          type: "pasos",
          items: [
            { titulo: "Lo urgente, hoy", texto: "Olor a quemado, chispas, un contacto derretido o un cable pelado: desconecta, apaga la pastilla de ese circuito y no lo uses hasta que se revise." },
            { titulo: "Quita los diablitos", texto: "Reparte los aparatos entre contactos de distintos circuitos. Microondas, calentadores, planchas y herramientas van directo a la pared." },
            { titulo: "Cambia lo dañado", texto: "Contactos flojos o con marcas de calor y clavijas rotas se reemplazan completos, con la pastilla apagada. Nunca los arregles con cinta." },
            { titulo: "Revisa la protección", texto: "Que un electricista confirme que cada pastilla corresponde a su cable y que hay tierra física en cocina, lavado y baño." },
            { titulo: "Planea lo que falta", texto: "Si los contactos no alcanzan, la solución es agregar contactos o un circuito nuevo, no más adaptadores." },
          ],
        },
        {
          type: "callout",
          variante: "seguridad",
          titulo: "Llama a un electricista si…",
          mitad: true,
          items: [
            "El olor, las chispas o el calor siguen al desconectar los aparatos",
            "Una pastilla se bota seguido o se calienta",
            "Necesitas más contactos o un circuito nuevo",
            "La instalación es antigua o no tiene tierra física",
            "Hay empalmes dentro de muros o cajas sin tapa",
          ],
        },
        {
          type: "callout",
          variante: "importante",
          titulo: "Úsalos con seguridad",
          mitad: true,
          items: [
            "Multicontactos con protección, solo para equipos de bajo consumo",
            "Extensiones del calibre adecuado, cortas y desenrolladas",
            "Revisa en el empaque la carga máxima que soportan",
            "El centro de carga no se abre en casa",
          ],
        },
      ],
    },
  ],
});
