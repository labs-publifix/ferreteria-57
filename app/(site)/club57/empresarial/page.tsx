import type { Metadata } from "next";
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  Eye,
  FileText,
  Gift,
  Gauge,
  MessageCircle,
  Receipt,
  RefreshCcw,
  ShoppingCart,
  UserCheck,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { buttonClassName } from "@/components/ui";
import { SolicitudEmpresaForm } from "@/components/club57/empresarial/SolicitudEmpresaForm";
import { SITE_URL } from "@/lib/seo";
import { STORE_WHATSAPP_PHONE } from "@/lib/store-info";

const TITLE = "Club 57 Empresarial — Prestación para los colaboradores de tu empresa";
const DESCRIPTION =
  "Tus colaboradores compran herramienta y material en Ferretería 57 con cargo a tu empresa. Tú autorizas cada pedido, recibes una factura al mes y lo recuperas vía nómina.";
const PATH = "/club57/empresarial";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}${PATH}`, siteName: "Ferretería 57", locale: "es_MX" },
};

const WHATSAPP_HREF = `https://wa.me/${STORE_WHATSAPP_PHONE}?text=${encodeURIComponent(
  "Hola, quiero información sobre Club 57 Empresarial para mi empresa."
)}`;

const BENEFICIOS_EMPRESA: { icon: LucideIcon; titulo: string; texto: string }[] = [
  { icon: Gift, titulo: "Prestación para tu equipo", texto: "Un beneficio atractivo para tus colaboradores, sin costo de operación para tu empresa." },
  { icon: Gauge, titulo: "Control total", texto: "Un límite de crédito para tu empresa y una línea para cada colaborador, que tú defines." },
  { icon: UserCheck, titulo: "Tú apruebas", texto: "Decides quién participa y autorizas cada pedido antes de que se prepare." },
  { icon: Receipt, titulo: "Una factura al mes", texto: "Todas las compras de tu equipo en un solo documento, con su estado de cuenta." },
  { icon: FileText, titulo: "Reporte para nómina", texto: "Los descuentos de cada nómina, listos para aplicarse, semanal, quincenal o mensual." },
];

const BENEFICIOS_EMPLEADO: { icon: LucideIcon; titulo: string; texto: string }[] = [
  { icon: Wallet, titulo: "Sin pagar al momento", texto: "Compran herramienta y material sin desembolso inmediato." },
  { icon: RefreshCcw, titulo: "Crédito que se renueva", texto: "Conforme se descuenta en nómina, su crédito vuelve a estar disponible." },
  { icon: Eye, titulo: "Saldo siempre visible", texto: "Su crédito disponible y sus próximos descuentos, en su cuenta." },
  { icon: BadgeCheck, titulo: "Siguen en Club 57", texto: "Conservan todos sus beneficios como miembros de Club 57." },
];

const PASOS: { icon: LucideIcon; titulo: string; texto: string }[] = [
  { icon: Building2, titulo: "Convenio", texto: "Revisamos tu solicitud y acordamos el límite de crédito, el día de corte y el plazo de pago." },
  { icon: UserPlus, titulo: "Registro del colaborador", texto: "Se registra en Club 57 con el código de tu empresa y tú lo apruebas." },
  { icon: ShoppingCart, titulo: "Compra en línea", texto: "Elige «Cargo a mi empresa» al pagar. Tú autorizas el pedido desde tu portal." },
  { icon: RefreshCcw, titulo: "Descuento vía nómina", texto: "Recuperas el importe en sus nóminas y su crédito se libera con cada descuento." },
  { icon: CalendarCheck, titulo: "Corte mensual", texto: "Recibes tu estado de cuenta y la factura consolidada de Ferretería 57." },
  { icon: Receipt, titulo: "Pago", texto: "Pagas la factura dentro del plazo acordado y los puntos Club 57 son para tu empresa." },
];

export default function Club57EmpresarialPage() {
  return (
    <main>
      {/* Portada */}
      <section className="relative overflow-hidden bg-brand-slate text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <span className="block h-1 w-12 bg-brand-orange" aria-hidden="true" />
            <p className="mt-5 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-brand-orange sm:text-sm">
              Nuevo programa · Club 57
            </p>
            <h1 className="mt-3 font-display text-4xl uppercase leading-[1.02] sm:text-6xl">
              Club 57
              <br />
              Empresarial
            </h1>
            <p className="mt-5 max-w-xl font-sans text-base text-white/85 sm:text-lg">
              Tus colaboradores compran herramienta y material en Ferretería 57 con cargo a tu empresa. Tú autorizas cada
              pedido, recibes una factura al mes y lo recuperas vía nómina.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#solicitud" className={buttonClassName("primary")}>
                Quiero afiliar a mi empresa
              </a>
              <a
                href="#como-funciona"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-white/40 px-6 font-sans text-base font-semibold text-white transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Cómo funciona
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end" aria-hidden="true">
            <div className="relative w-full max-w-[320px] rotate-[-4deg] rounded-2xl bg-brand-black px-8 py-10 text-center shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-white/10 to-transparent" />
              <span className="relative inline-flex items-center gap-1.5 rounded-full border border-brand-orange px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-widest">
                <Building2 className="size-3.5 text-brand-orange" strokeWidth={2} />
                Programa empresarial
              </span>
              <p className="relative mt-4 font-display text-5xl uppercase">Club 57</p>
              <p className="relative mt-3 font-sans text-sm text-white/80">Cargo a mi empresa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Concepto */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-brand-orange sm:text-sm">El concepto</p>
        <h2 className="mt-2 font-display text-3xl uppercase leading-tight text-brand-black sm:text-4xl">
          El colaborador compra,
          <br className="hidden sm:block" /> la empresa paga
        </h2>
        <ol className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { quien: "Colaborador", texto: "Compra en la tienda en línea sin pagar en el momento." },
            { quien: "Ferretería 57", texto: "Prepara el pedido autorizado y emite a la empresa una factura mensual." },
            { quien: "Empresa", texto: "Paga la factura y recupera el importe vía nómina, según sus políticas." },
          ].map((item, index) => (
            <li
              key={item.quien}
              className={`rounded-lg p-6 ${index === 1 ? "bg-brand-slate text-white" : "bg-brand-gray text-brand-black"}`}
            >
              <span className="font-display text-3xl text-brand-orange">0{index + 1}</span>
              <p className="mt-2 font-sans text-lg font-semibold">{item.quien}</p>
              <p className={`mt-1 font-sans text-sm ${index === 1 ? "text-white/85" : "text-brand-slate"}`}>{item.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Beneficios para la empresa */}
      <section className="bg-brand-gray">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-brand-orange sm:text-sm">Para tu empresa</p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-tight text-brand-black sm:text-4xl">
            Una prestación atractiva, sin costo de operación
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {BENEFICIOS_EMPRESA.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo} className="rounded-lg border-t-4 border-brand-orange bg-white p-5 shadow-sm">
                <Icon className="size-6 text-brand-orange" aria-hidden="true" strokeWidth={1.75} />
                <p className="mt-3 font-sans text-base font-semibold text-brand-black">{titulo}</p>
                <p className="mt-1 font-sans text-sm text-brand-slate">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Beneficios para colaboradores */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-brand-orange sm:text-sm">Para tus colaboradores</p>
        <h2 className="mt-2 font-display text-3xl uppercase leading-tight text-brand-black sm:text-4xl">
          Herramienta y material sin desembolso inmediato
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFICIOS_EMPLEADO.map(({ icon: Icon, titulo, texto }) => (
            <li key={titulo} className="rounded-lg bg-brand-gray p-5">
              <Icon className="size-6 text-brand-orange" aria-hidden="true" strokeWidth={1.75} />
              <p className="mt-3 font-sans text-base font-semibold text-brand-black">{titulo}</p>
              <p className="mt-1 font-sans text-sm text-brand-slate">{texto}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3 rounded-lg border-l-4 border-brand-orange bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-sm text-brand-black sm:text-base">
            <strong>¿No encuentran un producto en la tienda?</strong> Tenemos acceso a más de 15,000 productos Truper: nos
            escriben por WhatsApp y se lo conseguimos.
          </p>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName("secondary", "shrink-0")}
          >
            <MessageCircle className="size-4" aria-hidden="true" strokeWidth={2} />
            WhatsApp
          </a>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-24 bg-brand-slate text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-brand-orange sm:text-sm">Cómo funciona</p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-tight sm:text-4xl">Seis pasos, del convenio al pago</h2>
          <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PASOS.map(({ icon: Icon, titulo, texto }, index) => (
              <li key={titulo} className="rounded-lg bg-white/[0.06] p-5 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <span className="font-display text-3xl text-brand-orange">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="size-5 text-white/70" aria-hidden="true" strokeWidth={1.75} />
                </div>
                <p className="mt-2 font-sans text-base font-semibold">{titulo}</p>
                <p className="mt-1 font-sans text-sm text-white/80">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Solicitud */}
      <section id="solicitud" className="scroll-mt-24 bg-brand-gray">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-brand-orange sm:text-sm">Afiliación</p>
            <h2 className="mt-2 font-display text-3xl uppercase leading-tight text-brand-black sm:text-4xl">
              Quiero afiliar a mi empresa
            </h2>
            <p className="mt-4 max-w-prose font-sans text-base text-brand-slate">
              Llena el formulario y nuestro equipo te contactará para acordar las condiciones del convenio. Cuando quede
              activo, recibirás el código de tu empresa y tu acceso al portal.
            </p>
            <p className="mt-4 font-sans text-sm text-brand-slate">
              ¿Prefieres platicarlo?{" "}
              <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="font-semibold text-brand-black underline underline-offset-2">
                Escríbenos por WhatsApp
              </a>
              .
            </p>
          </div>
          <SolicitudEmpresaForm />
        </div>
      </section>
    </main>
  );
}
