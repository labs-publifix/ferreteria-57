import type { Metadata } from "next";
import {
  LegalArticle,
  LegalExternalLink,
  LegalH2,
  LegalH3,
  LegalP,
  LegalPageHeader,
  LegalUl,
} from "@/components/legal/LegalContent";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Ferretería 57",
  description: "Condiciones generales de uso y compra en la tienda en línea de Ferretería 57.",
};

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. Texto tal cual lo aprobó el cliente — no se resume ni
// se completa con nada adicional.
export default function TerminosPage() {
  return (
    <main className="px-4 py-16 sm:py-20 lg:px-8">
      <LegalPageHeader
        title="Términos y Condiciones"
        subtitle="Condiciones generales de uso y compra en la tienda en línea de Ferretería 57"
        lastUpdated="22 de septiembre de 2026"
      />

      <LegalArticle>
        <LegalH2>1. Aceptación de los términos</LegalH2>
        <LegalP>
          Al acceder, navegar o realizar una compra en{" "}
          <LegalExternalLink href="https://www.ferreteria57.com">www.ferreteria57.com</LegalExternalLink> (en
          adelante, &quot;el Sitio&quot;), usted acepta en su totalidad los presentes Términos y Condiciones
          (&quot;T&amp;C&quot;) y el Aviso de Privacidad vigente. Si no está de acuerdo con alguna de las
          condiciones aquí descritas, le solicitamos abstenerse de usar el Sitio. Ferretería 57, operada por
          Ricardo Castañeda Baeza, persona física con actividad empresarial (RFC: CABR950412PW0), con domicilio en
          Lateral Carretera Federal No. 57 #230, Casa Blanca, C.P. 76030, Santiago de Querétaro, Querétaro, México,
          se reserva el derecho de modificar estos T&amp;C en cualquier momento, publicando la versión actualizada
          en el Sitio.
        </LegalP>

        <LegalH2>2. Descripción del servicio</LegalH2>
        <LegalP>
          Ferretería 57 opera como tienda física y en línea especializada en la venta de herramientas, materiales y
          productos para ferretería de la marca Truper y sus marcas hermanas (Pretul, Foset, Volteck, Fiero, Hermex
          y Klintek). El Sitio permite a los usuarios explorar el catálogo de productos, realizar compras, elegir
          entre recolección en tienda o envío a domicilio, y gestionar sus pedidos. Ferretería 57 se reserva el
          derecho de modificar, suspender o descontinuar cualquier producto o función del Sitio sin previo aviso.
        </LegalP>

        <LegalH2>3. Registro y cuenta de usuario</LegalH2>
        <LegalP>
          Para realizar una compra puede ser necesario crear una cuenta de usuario. Usted es responsable de
          mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas desde
          su cuenta. Ferretería 57 no será responsable por pérdidas derivadas del uso no autorizado de su cuenta
          cuando dicho uso sea resultado de su negligencia. Para el registro se requiere ser mayor de 18 años o
          contar con la autorización de un tutor legal. Al registrarse, usted declara que la información
          proporcionada es veraz, completa y actualizada.
        </LegalP>
        <LegalP>
          Al crear una cuenta, el cliente podrá además inscribirse en el programa de lealtad y referidos &quot;Club
          57&quot;, sujeto a sus propias reglas de acumulación, vigencia y canje de puntos, las cuales se ponen a
          disposición del cliente en el Sitio.
        </LegalP>

        <LegalH2>4. Proceso de compra</LegalH2>

        <LegalH3>4.1 Disponibilidad y precios</LegalH3>
        <LegalP>
          Todos los precios publicados en el Sitio están expresados en pesos mexicanos (MXN) e incluyen el Impuesto
          al Valor Agregado (IVA) cuando aplique. Ferretería 57 se reserva el derecho de modificar precios sin
          previo aviso. La disponibilidad de productos está sujeta a existencia en inventario. En caso de que un
          producto adquirido no esté disponible, Ferretería 57 contactará al cliente para ofrecer una alternativa o
          realizar el reembolso íntegro.
        </LegalP>

        <LegalH3>4.2 Confirmación del pedido</LegalH3>
        <LegalP>
          Una vez concluido el proceso de pago, recibirá un correo electrónico de confirmación con el detalle de
          su pedido. Este correo no constituye una garantía de disponibilidad del producto, sino la constancia de
          recepción de su solicitud. El contrato de compraventa se perfecciona al momento en que Ferretería 57
          confirma el envío o la disponibilidad para recolección del pedido.
        </LegalP>

        <LegalH3>4.3 Métodos de pago</LegalH3>
        <LegalP>
          El Sitio acepta pagos con tarjeta de crédito o débito a través de Mercado Pago, procesados mediante
          conexión cifrada. Ferretería 57 no almacena datos bancarios de sus clientes. La opción de pago a meses
          sin intereses se habilitará próximamente y se anunciará oportunamente en el Sitio.
        </LegalP>

        <LegalH3>4.4 Cancelación de pedidos</LegalH3>
        <LegalP>
          El cliente podrá solicitar la cancelación de su pedido dentro de un plazo de 2 horas después de la
          compra, siempre que el pedido no haya sido preparado o enviado, enviando su solicitud a
          contacto@ferreteria57.com o al teléfono 442 778 2708, indicando su número de pedido. Una vez que el
          pedido haya sido preparado, enviado o esté listo para recolección, la cancelación ya no procederá y
          deberá sujetarse a la política de cambios y devoluciones. El reembolso de pedidos cancelados procedentes
          se realizará al método de pago original en un plazo de 5 a 10 días hábiles bancarios.
        </LegalP>

        <LegalH2>5. Envíos y entregas</LegalH2>
        <LegalP>
          Las condiciones de envío y recolección se rigen por la Política de Envíos disponible en el Sitio, la
          cual forma parte integral de los presentes T&amp;C. El costo de envío, cuando aplique, se calcula y
          muestra de forma transparente durante el proceso de checkout antes de confirmar el pago. Ferretería 57
          no se hace responsable por retrasos ocasionados por causas ajenas a su control, incluyendo huelgas,
          desastres naturales o restricciones gubernamentales.
        </LegalP>

        <LegalH2>6. Política de cambios, devoluciones y garantía</LegalH2>

        <LegalH3>6.1 Productos con defecto de fabricación</LegalH3>
        <LegalP>
          Ferretería 57 garantiza la calidad de los productos que comercializa. Si recibe un producto con defecto
          de fabricación, tiene un plazo de 5 días hábiles a partir de la recepción para notificarlo a
          contacto@ferreteria57.com adjuntando fotografías del producto. En este caso, Ferretería 57 podrá a su
          elección:
        </LegalP>
        <LegalUl>
          <li>Reemplazar el producto por uno nuevo en perfectas condiciones sin costo adicional, o</li>
          <li>Emitir un crédito o reembolso por el valor íntegro del producto, según corresponda.</li>
        </LegalUl>

        <LegalH3>6.2 Garantía del fabricante</LegalH3>
        <LegalP>
          Adicionalmente, los productos Truper y marcas hermanas cuentan con la garantía del fabricante conforme a
          sus propias políticas. El cliente podrá hacerla válida presentando su ticket de compra directamente en
          sucursal, o a través de los centros de servicio autorizados Truper.
        </LegalP>

        <LegalH3>6.3 Cambios y devoluciones por cambio de opinión</LegalH3>
        <LegalP>
          Ferretería 57 acepta devoluciones o cambios por cambio de opinión dentro de un plazo de 5 días naturales
          a partir de la recepción, siempre que el producto se encuentre sin uso, en su empaque original y con
          todos sus accesorios, acompañado del comprobante de compra. El costo del envío de devolución, en su
          caso, correrá a cargo del cliente, salvo que se trate de un error imputable a Ferretería 57. Una vez
          recibido y validado el producto, Ferretería 57 realizará el reembolso o cambio en un plazo de 5 a 10 días
          hábiles.
        </LegalP>

        <LegalH3>6.4 Derechos del consumidor</LegalH3>
        <LegalP>
          Nada de lo establecido en esta política limita o excluye los derechos que le corresponden como
          consumidor conforme a la Ley Federal de Protección al Consumidor (LFPC) y demás disposiciones aplicables
          en México. Para cualquier queja o reclamación puede acudir a la PROFECO:{" "}
          <LegalExternalLink href="https://www.profeco.gob.mx">www.profeco.gob.mx</LegalExternalLink>.
        </LegalP>

        <LegalH2>7. Propiedad intelectual</LegalH2>
        <LegalP>
          Todo el contenido del Sitio, incluyendo pero no limitado a textos, imágenes, logotipos, videos, diseños y
          código fuente, es propiedad exclusiva de Ferretería 57 o sus licenciantes (incluidas las marcas Truper,
          Pretul, Foset, Volteck, Fiero, Hermex y Klintek, propiedad de sus respectivos titulares) y está protegido
          por las leyes de propiedad intelectual aplicables en México. Queda prohibida su reproducción,
          distribución o uso comercial sin autorización previa y por escrito de Ferretería 57.
        </LegalP>

        <LegalH2>8. Limitación de responsabilidad</LegalH2>
        <LegalP>
          Ferretería 57 no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados
          del uso o la imposibilidad de uso del Sitio o los productos adquiridos, más allá de lo establecido por la
          legislación mexicana aplicable. La responsabilidad máxima de Ferretería 57 ante cualquier reclamación
          estará limitada al monto pagado por el cliente en la transacción específica objeto de la reclamación.
        </LegalP>

        <LegalH2>9. Legislación aplicable y jurisdicción</LegalH2>
        <LegalP>
          Los presentes T&amp;C se rigen por las leyes de los Estados Unidos Mexicanos. Para la resolución de
          cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes de la
          ciudad de Querétaro, Querétaro, renunciando a cualquier otro fuero que pudiera corresponderles.
        </LegalP>

        <LegalH2>10. Contacto</LegalH2>
        <LegalP>Para dudas, aclaraciones o ejercicio de sus derechos puede contactarnos en:</LegalP>
        <LegalUl>
          <li>Correo electrónico: contacto@ferreteria57.com</li>
          <li>Teléfono: 442 778 2708</li>
          <li>Dirección: Lateral Carretera Federal No. 57 #230, Casa Blanca, C.P. 76030, Santiago de Querétaro, Qro.</li>
        </LegalUl>
      </LegalArticle>
    </main>
  );
}
