import type { Metadata } from "next";
import {
  LegalArticle,
  LegalH2,
  LegalH3,
  LegalP,
  LegalPageHeader,
  LegalUl,
} from "@/components/legal/LegalContent";
import { NO_INDEX, SITE_URL } from "@/lib/seo";

const title = "Política de Envíos — Ferretería 57";
const description = "Condiciones, tiempos y costos de entrega para compras realizadas en Ferretería 57.";

// noindex, sí follow — mismo criterio que /aviso-privacidad (ver ese
// archivo).
export const metadata: Metadata = {
  title,
  description,
  robots: NO_INDEX,
  alternates: { canonical: `${SITE_URL}/politica-de-envios` },
  openGraph: { title, description, url: `${SITE_URL}/politica-de-envios` },
};

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. Texto tal cual lo aprobó el cliente — no se resume ni
// se completa con nada adicional.
export default function PoliticaDeEnviosPage() {
  return (
    <main className="px-4 py-16 sm:py-20 lg:px-8">
      <LegalPageHeader
        title="Política de Envíos"
        subtitle="Condiciones, tiempos y costos de entrega para compras realizadas en Ferretería 57"
        lastUpdated="22 de septiembre de 2026"
      />

      <LegalArticle>
        <LegalH2>1. Modalidades de entrega</LegalH2>
        <LegalP>
          Ferretería 57 ofrece tres modalidades de entrega, seleccionables durante el checkout:
        </LegalP>
        <LegalUl>
          <li>Recolección en tienda: sin costo, en nuestra sucursal de Querétaro.</li>
          <li>
            Envío local (dentro de Querétaro): entrega con unidad y chofer propios de Ferretería 57, con costo
            calculado según la zona/colonia de destino.
          </li>
          <li>Envío foráneo (resto de la República Mexicana): entrega mediante empresa de paquetería.</li>
        </LegalUl>
        <LegalP>Por el momento no se realizan envíos internacionales.</LegalP>

        <LegalH2>2. Recolección en tienda</LegalH2>
        <LegalP>
          Puede recoger su pedido sin costo en: Lateral Carretera Federal No. 57 #230, Casa Blanca, C.P. 76030,
          Santiago de Querétaro, Qro.
        </LegalP>
        <LegalUl>
          <li>
            Horario de atención: lunes a viernes de 8:00 a 19:00 horas, sábados de 8:00 a 15:00 horas. Domingos
            cerrado.
          </li>
          <li>
            Su pedido estará listo para recolección en un plazo de 2 horas a partir de la confirmación del pago. Le
            avisaremos por llamada o mensaje de WhatsApp cuando esté listo.
          </li>
          <li>
            Para recoger su pedido deberá presentar una identificación oficial o indicar su nombre completo y su
            número de pedido.
          </li>
        </LegalUl>

        <LegalH2>3. Envío local (Querétaro)</LegalH2>
        <LegalP>
          El costo del envío local se calcula automáticamente durante el checkout según la zona de distancia desde
          la tienda hasta el domicilio de entrega, y se muestra de forma clara y desglosada antes de confirmar y
          pagar su compra.
        </LegalP>
        <LegalUl>
          <li>Envío gratuito en compras a partir de $599 MXN de subtotal.</li>
          <li>Tiempo estimado de entrega: de 3 a 48 horas, de acuerdo con las rondas de reparto establecidas.</li>
        </LegalUl>
        <LegalP>
          La entrega se realiza con unidad y chofer propios de Ferretería 57, por lo que no aplica número de guía
          de paquetería para esta modalidad.
        </LegalP>

        <LegalH2>4. Envío foráneo (resto de la República Mexicana)</LegalH2>

        <LegalH3>4.1 Costo de envío</LegalH3>
        <LegalUl>
          <li>
            Para pedidos con subtotal menor a $4,000 MXN: costo fijo de envío de $250 MXN, calculado y mostrado en
            el checkout.
          </li>
          <li>
            Para pedidos con subtotal de $4,000 MXN o más: el checkout en línea no procede automáticamente; el
            cliente recibe una cotización de envío personalizada a través de WhatsApp.
          </li>
        </LegalUl>

        <LegalH3>4.2 Empresa de paquetería</LegalH3>
        <LegalP>
          Los envíos foráneos se realizan a través de Estafeta. Si su domicilio de entrega se encuentra en una zona
          de cobertura limitada, le notificaremos en un plazo de 2 días para acordar una solución.
        </LegalP>

        <LegalH3>4.3 Tiempos de entrega</LegalH3>
        <LegalUl>
          <li>
            Tiempo de procesamiento: una vez confirmado el pago, Ferretería 57 procesa y empaca su pedido en un
            plazo de 1 a 2 días. Los pedidos realizados en fin de semana o días festivos oficiales se procesan a
            partir del siguiente día hábil.
          </li>
          <li>
            Tiempo de tránsito: una vez recolectado el paquete por la empresa de paquetería, el tiempo de entrega
            promedio es de 2 a 6 días para la mayoría del territorio nacional. Destinos en zonas remotas pueden
            requerir tiempo adicional.
          </li>
          <li>
            Tiempo total estimado: de 4 a 8 días desde la confirmación del pago hasta la entrega en su domicilio.
            Este plazo es referencial y puede variar por factores externos ajenos al control de Ferretería 57.
          </li>
        </LegalUl>

        <LegalH2>5. Seguimiento del pedido</LegalH2>
        <LegalP>
          Para pedidos con envío foráneo, una vez que su pedido sea enviado, recibirá un correo electrónico o
          mensaje de WhatsApp con el número de guía y la liga de rastreo de la empresa de paquetería. Podrá dar
          seguimiento directamente en el sitio web del proveedor logístico. Si en 48 horas no recibe el aviso de
          seguimiento, contáctenos a contacto@ferreteria57.com o al teléfono 442 778 2708.
        </LegalP>
        <LegalP>
          Para pedidos con envío local, podrá dar seguimiento directamente con nuestro equipo de reparto vía
          telefónica.
        </LegalP>

        <LegalH2>6. Entrega del pedido</LegalH2>

        <LegalH3>6.1 Intentos de entrega (envío foráneo)</LegalH3>
        <LegalP>
          La empresa de paquetería realizará hasta dos intentos de entrega en el domicilio indicado. Si en ambos
          intentos no hay persona disponible para recibir el paquete, el mismo quedará resguardado en la sucursal
          de paquetería más cercana por 5 días hábiles para su recolección, tras lo cual podrá ser devuelto a
          Ferretería 57.
        </LegalP>

        <LegalH3>6.2 Responsabilidad en la entrega</LegalH3>
        <LegalP>
          Ferretería 57 garantiza que los productos son empacados con materiales de protección adecuados para su
          transporte. Una vez que el pedido es entregado a la empresa de paquetería y se genera el número de guía,
          la responsabilidad sobre el estado físico del paquete y su contenido recae exclusivamente en dicha
          empresa de mensajería. Ferretería 57 no se hace responsable por golpes, roturas u otros daños físicos
          ocasionados al producto durante el trayecto, ya que estos son imputables al manejo de la paquetería. Para
          los envíos locales realizados con unidad propia, Ferretería 57 responde directamente por el buen estado
          del producto hasta su entrega.
        </LegalP>
        <LegalP>
          Si su pedido llega con daños causados durante el transporte, le recomendamos documentarlos
          fotográficamente antes de abrir el paquete y presentar su reclamación directamente ante la empresa de
          paquetería correspondiente. No obstante, si desea notificarnos, con gusto le orientamos sobre el proceso
          de reclamación ante el transportista.
        </LegalP>

        <LegalH3>6.3 Dirección incorrecta</LegalH3>
        <LegalP>
          Ferretería 57 no se hace responsable por retrasos o no entregas derivadas de un domicilio incorrecto o
          incompleto. Si detecta un error en la dirección después de realizar su compra, contáctenos a
          contacto@ferreteria57.com o al teléfono 442 778 2708 dentro de las 12 horas siguientes para realizar la
          corrección antes del envío.
        </LegalP>

        <LegalH2>7. Pedidos no entregados o extraviados</LegalH2>
        <LegalP>
          Si su pedido no ha llegado en el plazo máximo estimado y el rastreo indica que no ha podido ser
          entregado o se encuentra sin movimiento por más de 5 días hábiles, contáctenos a
          contacto@ferreteria57.com con su número de pedido y número de guía. Ferretería 57 iniciará una
          investigación con la empresa de paquetería en un plazo de 3 días hábiles y, de confirmarse el extravío,
          procederá a:
        </LegalP>
        <LegalUl>
          <li>Reenviar el pedido sin costo adicional, sujeto a disponibilidad de inventario, o</li>
          <li>
            Emitir un reembolso íntegro al método de pago original en un plazo de 5 a 10 días hábiles bancarios.
          </li>
        </LegalUl>

        <LegalH2>8. Modificaciones a la política</LegalH2>
        <LegalP>
          Ferretería 57 se reserva el derecho de modificar la presente Política de Envíos en cualquier momento.
          Los cambios entrarán en vigor para los pedidos realizados a partir de la fecha de publicación de la
          versión actualizada en el Sitio.
        </LegalP>

        <LegalH2>9. Contacto</LegalH2>
        <LegalP>Para cualquier duda relacionada con su envío o entrega:</LegalP>
        <LegalUl>
          <li>Correo electrónico: contacto@ferreteria57.com</li>
          <li>Teléfono: 442 778 2708</li>
          <li>
            Horario de atención: lunes a viernes de 8:00 a 19:00 horas, sábados de 8:00 a 15:00 horas (tiempo del
            centro de México).
          </li>
        </LegalUl>
      </LegalArticle>
    </main>
  );
}
