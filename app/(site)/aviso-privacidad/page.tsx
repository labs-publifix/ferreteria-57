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
  title: "Aviso de Privacidad — Ferretería 57",
  description:
    "Aviso de privacidad de Ferretería 57, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
};

// Header y Footer no se repiten aquí, ya envuelven la página desde
// app/layout.tsx. Texto tal cual lo aprobó el cliente — no se resume ni
// se completa con nada adicional, ver components/legal/LegalContent.tsx
// para las piezas de forma compartidas con las otras 2 páginas legales.
export default function AvisoPrivacidadPage() {
  return (
    <main className="px-4 py-16 sm:py-20 lg:px-8">
      <LegalPageHeader
        title="Aviso de Privacidad"
        subtitle="Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares"
        lastUpdated="22 de septiembre de 2026"
      />

      <LegalArticle>
        <LegalH2>1. Identidad y domicilio del Responsable</LegalH2>
        <LegalP>
          Ferretería 57, operada por Ricardo Castañeda Baeza, persona física con actividad empresarial (RFC:
          CABR950412PW0) (&quot;el Responsable&quot;), con domicilio en Lateral Carretera Federal No. 57 #230, Casa
          Blanca, C.P. 76030, Santiago de Querétaro, Querétaro, México, es responsable del tratamiento de los datos
          personales que usted proporcione a través del sitio web{" "}
          <LegalExternalLink href="https://www.ferreteria57.com">www.ferreteria57.com</LegalExternalLink> (en
          adelante, &quot;el Sitio&quot;). Para cualquier asunto relacionado con el presente Aviso de Privacidad puede
          comunicarse con nosotros a través de:
        </LegalP>
        <LegalUl>
          <li>Correo electrónico: contacto@ferreteria57.com</li>
          <li>Teléfono: 442 778 2708</li>
          <li>Domicilio: Lateral Carretera Federal No. 57 #230, Casa Blanca, C.P. 76030, Santiago de Querétaro, Qro.</li>
        </LegalUl>

        <LegalH2>2. Datos personales que recabamos</LegalH2>

        <LegalH3>2.1 Datos de identificación y contacto</LegalH3>
        <LegalUl>
          <li>Nombre completo</li>
          <li>Correo electrónico</li>
          <li>Número de teléfono</li>
          <li>
            Domicilio de entrega (calle, número, colonia, ciudad, estado y código postal) para envíos, o en su caso
            los datos necesarios para recolección en tienda
          </li>
          <li>
            Datos para facturación, cuando el cliente solicite comprobante fiscal (razón social, RFC, uso de CFDI y
            domicilio fiscal)
          </li>
        </LegalUl>

        <LegalH3>2.2 Datos del programa de lealtad Club 57</LegalH3>
        <LegalP>
          Si usted se registra o participa en el programa de lealtad y referidos &quot;Club 57&quot;, recabamos
          además su nombre de usuario y contraseña de acceso a su cuenta en el Sitio, su historial de compras, el
          saldo de puntos acumulados y, en su caso, los datos de las personas que usted refiera para efectos del
          cálculo de bonos de referido.
        </LegalP>

        <LegalH3>2.3 Datos de pago</LegalH3>
        <LegalP>
          Los datos de tarjeta de crédito o débito son procesados directamente por el proveedor de pagos integrado
          en la plataforma: Mercado Pago. Ferretería 57 no almacena, procesa ni tiene acceso a los datos de su
          tarjeta de pago en ningún momento.
        </LegalP>

        <LegalH3>2.4 Datos de navegación</LegalH3>
        <LegalUl>
          <li>Dirección IP</li>
          <li>Tipo de dispositivo y navegador</li>
          <li>Páginas visitadas dentro del Sitio</li>
          <li>Tiempo de permanencia y comportamiento de navegación (mediante cookies y herramientas de analítica)</li>
        </LegalUl>

        <LegalH2>3. Finalidades del tratamiento</LegalH2>

        <LegalH3>3.1 Finalidades primarias (necesarias para la relación comercial)</LegalH3>
        <LegalUl>
          <li>Procesar, confirmar y gestionar sus pedidos de compra</li>
          <li>Coordinar el envío, la entrega o la recolección en tienda de los productos adquiridos</li>
          <li>
            Administrar su cuenta y su participación en el programa de lealtad Club 57 (acumulación y canje de
            puntos, seguimiento de referidos)
          </li>
          <li>Emitir comprobantes fiscales cuando sea requerido</li>
          <li>Dar atención a sus solicitudes, aclaraciones o quejas</li>
          <li>Cumplir con obligaciones legales aplicables</li>
        </LegalUl>

        <LegalH3>3.2 Finalidades secundarias (opcionales, puede oponerse)</LegalH3>
        <LegalUl>
          <li>Enviarle comunicaciones comerciales, promociones y novedades de Ferretería 57</li>
          <li>Personalizar su experiencia de compra en el Sitio</li>
          <li>Realizar análisis estadísticos sobre el comportamiento de compra</li>
        </LegalUl>
        <LegalP>
          Si no desea que sus datos sean utilizados para las finalidades secundarias, puede manifestarlo en
          cualquier momento enviando un correo a contacto@ferreteria57.com con el asunto &quot;Oposición a
          finalidades secundarias&quot;.
        </LegalP>

        <LegalH2>4. Transferencias de datos personales</LegalH2>
        <LegalP>
          Ferretería 57 no vende, arrienda ni cede sus datos personales a terceros con fines comerciales propios.
          Sus datos podrán ser compartidos únicamente con los siguientes encargados del tratamiento, quienes actúan
          bajo instrucciones de Ferretería 57 y están sujetos a obligaciones de confidencialidad:
        </LegalP>
        <LegalUl>
          <li>Empresas de paquetería y logística, para la entrega de pedidos con envío foráneo</li>
          <li>Mercado Pago, como proveedor de la pasarela de pago, para el procesamiento seguro de transacciones</li>
          <li>Plataformas de correo electrónico y CRM, para el envío de comunicaciones transaccionales</li>
          <li>Herramientas de analítica web (como Google Analytics), en forma anonimizada</li>
        </LegalUl>
        <LegalP>Ninguna transferencia se realizará fuera de las finalidades descritas en el presente Aviso.</LegalP>

        <LegalH2>5. Derechos ARCO</LegalH2>
        <LegalP>
          Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales
          (derechos ARCO), así como el derecho a revocar el consentimiento otorgado. Para ejercer cualquiera de
          estos derechos, envíe una solicitud a contacto@ferreteria57.com con el asunto &quot;Ejercicio de derechos
          ARCO&quot; indicando:
        </LegalP>
        <LegalUl>
          <li>Nombre completo y correo electrónico asociado a su cuenta</li>
          <li>Descripción clara del derecho que desea ejercer</li>
          <li>Copia de identificación oficial vigente</li>
        </LegalUl>
        <LegalP>
          Daremos respuesta a su solicitud en un plazo máximo de 20 días hábiles contados a partir de su recepción.
        </LegalP>

        <LegalH2>6. Uso de cookies y tecnologías de rastreo</LegalH2>
        <LegalP>
          El Sitio utiliza cookies propias y de terceros para mejorar su experiencia de navegación, analizar el
          tráfico y mostrar contenido relevante. Al continuar navegando en el Sitio, usted consiente el uso de
          cookies conforme a este Aviso. Puede configurar su navegador para rechazar cookies, aunque ello puede
          afectar la funcionalidad del Sitio.
        </LegalP>

        <LegalH2>7. Medidas de seguridad</LegalH2>
        <LegalP>
          Ferretería 57 implementa medidas técnicas, administrativas y físicas razonables para proteger sus datos
          personales contra acceso no autorizado, pérdida, alteración o divulgación indebida. Sin embargo, ningún
          sistema de transmisión por Internet es completamente seguro, por lo que no podemos garantizar la
          seguridad absoluta de la información transmitida.
        </LegalP>

        <LegalH2>8. Cambios al Aviso de Privacidad</LegalH2>
        <LegalP>
          Ferretería 57 se reserva el derecho de modificar el presente Aviso de Privacidad en cualquier momento
          para adaptarlo a cambios legislativos, jurisprudenciales o de negocio. Cualquier modificación será
          comunicada a través del Sitio con al menos 30 días de anticipación a su entrada en vigor. Le recomendamos
          revisar periódicamente esta sección.
        </LegalP>

        <LegalH2>9. Autoridad competente</LegalH2>
        <LegalP>
          Si considera que su derecho a la protección de datos personales ha sido vulnerado, puede acudir al
          Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI):{" "}
          <LegalExternalLink href="https://www.inai.org.mx">www.inai.org.mx</LegalExternalLink>.
        </LegalP>
      </LegalArticle>
    </main>
  );
}
