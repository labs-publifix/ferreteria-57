import { defineGuide } from "@/lib/blog/guide-schema";

// Guía PDF de B10 (hoja «Guías PDF»): pág. 1, cómo funciona Club 57 (ganar,
// esperar, canjear, referir); pág. 2, índice de guías disponibles y cómo
// ver las promociones de miembros. Sin cifras del programa (son
// configurables): el ejemplo se cuenta con estados, no con números.
export default defineGuide({
  topicId: "B10",
  slug: "club-57-como-ganar-puntos-ferreteria-57",
  titulo: "Guía de bienvenida a Club 57",
  subtitulo: "Cómo ganar y usar tus puntos, recomendar a tus amigos y aprovechar las guías y promociones para miembros.",
  paginas: [
    {
      titulo: "Cómo funciona Club 57",
      intro: "Todo vive en tu cuenta del sitio: tu saldo, tu historial de compras y puntos, el catálogo de canje, tus guías y las promociones para miembros.",
      bloques: [
        {
          type: "pasos",
          titulo: "De la compra al canje",
          items: [
            {
              titulo: "Compra y gana",
              texto: "Tus compras en línea suman puntos al confirmarse el pago, sobre el subtotal sin envío. En tienda, di que eres miembro para que el vendedor registre la compra en tu cuenta.",
            },
            {
              titulo: "Espera unos días",
              texto: "Los puntos entran como pendientes. En «Historial de compras y puntos» ves cuántos te dio cada compra y la fecha en que pasan a disponibles.",
            },
            {
              titulo: "Canjea",
              texto: "Con puntos disponibles, elige un artículo del catálogo de canje y recógelo en la tienda. Los artículos canjeados no tienen devolución ni cambio.",
            },
            {
              titulo: "Recomienda",
              texto: "Comparte tu código de referido. Cuando alguien se registra con él y hace su primera compra, los dos reciben puntos de bono.",
            },
          ],
        },
        {
          type: "consejo",
          titulo: "Ejemplo",
          texto: "Haces una compra en tienda y das tu nombre: esa misma tarde la ves en tu historial como «Pendiente», con su fecha. Llegado el día cambia a «Disponible» y se suma a tu saldo, listo para canjear.",
        },
        {
          type: "callout",
          variante: "nota",
          titulo: "Si una compra se cancela o se corrige",
          texto: "Sus puntos se ajustan y verás el movimiento con su motivo. Si ya los habías usado, tu saldo puede quedar negativo y se compensa con tus siguientes compras.",
        },
      ],
    },
    {
      titulo: "Guías y promociones para miembros",
      intro: "Cada artículo del blog trae su guía en PDF, gratis para miembros: inicia sesión y descárgala desde el artículo. Las que descargues quedan en «Mis guías», dentro de tu cuenta.",
      bloques: [
        {
          type: "tabla",
          titulo: "Guías disponibles al publicar esta guía",
          columnas: ["Guía", "Para qué te sirve"],
          anchos: [1.3, 1],
          filas: [
            ["Guía de marcas Truper: cuál elegir según tu trabajo", "Elegir la línea de herramienta"],
            ["Checklist: caja de herramientas básica del hogar", "Armar tu kit de casa"],
            ["Tabla rápida: broca, taquete y tornillo por material", "Perforar y fijar sin fallas"],
            ["Comparador de tuberías: PPR, PVC, CPVC y cobre", "Elegir tubería para agua"],
            ["Tabla de calibres: qué cable para cada aparato", "Elegir el cable correcto"],
            ["Guía visual: salitre y humedad, diagnóstico y reparación", "Proteger muros húmedos"],
            ["Checklist de instalación de tinaco o cisterna", "Instalar tu almacenamiento de agua"],
            ["Guía rápida: qué herramienta usar según tu pintura", "Pintar con brocha o rodillo"],
            ["Guía de taquetes por tipo de muro", "Colgar sin que se caiga"],
            ["Guía de bienvenida a Club 57", "Aprovechar tu membresía"],
          ],
        },
        {
          type: "pasos",
          titulo: "Cómo ver las promociones de miembros",
          items: [
            { titulo: "Inicia sesión", texto: "Entra a tu cuenta con tu correo y contraseña." },
            {
              titulo: "Busca «Promociones para miembros»",
              texto: "Ahí están Promo Truper, Promociones de Temporada y Liquidaciones del Mes, cada una con su vigencia.",
            },
            { titulo: "Descarga el PDF", texto: "Mientras la promoción esté vigente, descárgala y llévala a la tienda o consúltala en tu teléfono." },
          ],
        },
      ],
    },
  ],
});
