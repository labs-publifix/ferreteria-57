"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClassName, ConfirmDialog, ProductImagePlaceholder } from "@/components/ui";
import { canjearPuntosEmpresa } from "@/app/(site)/empresa/actions";

export interface MovimientoPuntos {
  id: string;
  cantidad: number;
  tipo: "compra_empresa" | "reversion_cancelacion" | "canje" | "reversion_canje";
  estado: "pendiente" | "disponible";
  referencia: string | null;
  created_at: string;
}

export interface CanjeEmpresa {
  id: string;
  nombre: string;
  puntos: number;
  estado: "pendiente" | "entregado" | "cancelado";
  created_at: string;
}

export interface ItemCanje {
  id: string;
  nombre: string;
  descripcion: string;
  costo_puntos: number;
  stock: number;
  image_url: string | null;
}

const fecha = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" });
const num = new Intl.NumberFormat("es-MX");

const TIPO_LABEL: Record<MovimientoPuntos["tipo"], string> = {
  compra_empresa: "Compra con cargo a la empresa",
  reversion_cancelacion: "Pedido cancelado",
  canje: "Canje",
  reversion_canje: "Canje cancelado",
};

const CANJE_LABEL: Record<CanjeEmpresa["estado"], { texto: string; clase: string }> = {
  pendiente: { texto: "Por recoger", clase: "bg-amber-100 text-amber-800" },
  entregado: { texto: "Entregado", clase: "bg-green-100 text-green-800" },
  cancelado: { texto: "Cancelado", clase: "bg-red-100 text-red-700" },
};

export function PuntosEmpresa({
  disponible,
  pendiente,
  movimientos,
  canjes,
  catalogo,
  suspendida,
}: {
  disponible: number;
  pendiente: number;
  movimientos: MovimientoPuntos[];
  canjes: CanjeEmpresa[];
  catalogo: ItemCanje[];
  suspendida: boolean;
}) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState<ItemCanje | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function canjear() {
    if (!confirmar) return;
    const item = confirmar;
    setEnviando(true);
    setMensaje(null);
    const res = await canjearPuntosEmpresa(item.id);
    setEnviando(false);
    setConfirmar(null);
    setMensaje(
      res.error
        ? { tipo: "error", texto: res.error }
        : { tipo: "ok", texto: `Canje registrado: ${item.nombre}. Ferretería 57 te contactará para coordinar la entrega en tienda.` }
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose font-sans text-sm text-brand-slate">
        Cada compra que autorizas con cargo a tu empresa suma puntos Club 57 a favor de tu empresa. Quedan pendientes hasta que
        pagas el corte del mes y entonces se liberan. Úsalos para canjear artículos del catálogo: no se convierten en saldo a favor
        ni se pueden ceder a tus colaboradores.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white px-5 py-4 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate">Puntos disponibles</p>
          <p className="mt-1 font-display text-3xl text-brand-orange">{num.format(disponible)}</p>
          <p className="font-sans text-xs text-brand-slate/70">Listos para canjear.</p>
        </div>
        <div className="rounded-lg bg-white px-5 py-4 shadow-sm">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-brand-slate">Puntos pendientes</p>
          <p className="mt-1 font-display text-3xl text-brand-black">{num.format(pendiente)}</p>
          <p className="font-sans text-xs text-brand-slate/70">Se liberan al registrar el pago de su corte.</p>
        </div>
      </div>

      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`rounded-md px-4 py-2.5 font-sans text-sm ${mensaje.tipo === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"}`}
        >
          {mensaje.texto}
        </p>
      )}

      <section aria-labelledby="catalogo-canje" className="flex flex-col gap-3">
        <h2 id="catalogo-canje" className="font-display text-lg uppercase text-brand-slate">
          Catálogo de canje
        </h2>
        {suspendida && (
          <p className="rounded-md bg-brand-gray/60 px-4 py-3 font-sans text-sm text-brand-slate">
            Mientras tu empresa esté suspendida no puedes canjear puntos. Tus puntos se conservan.
          </p>
        )}
        {catalogo.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/80 shadow-sm">
            Todavía no hay artículos disponibles para canje.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogo.map((item) => {
              const alcanza = disponible >= item.costo_puntos;
              const puede = alcanza && item.stock > 0 && !suspendida;
              const progreso = Math.max(0, Math.min(100, Math.round((disponible / item.costo_puntos) * 100)));
              return (
                <div key={item.id} className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm">
                  {item.image_url ? (
                    <Image src={item.image_url} alt="" width={240} height={240} className="aspect-square w-full rounded-md object-cover" />
                  ) : (
                    <ProductImagePlaceholder className="aspect-square w-full" />
                  )}
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-medium text-brand-black">{item.nombre}</p>
                    <p className="font-display text-lg text-brand-orange">{num.format(item.costo_puntos)} pts</p>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-gray" aria-hidden="true">
                    <div className="h-full rounded-full bg-brand-orange" style={{ width: `${progreso}%` }} />
                  </div>
                  {!puede && !suspendida && (
                    <p className="font-sans text-xs text-brand-slate/70">
                      {item.stock <= 0 ? "Sin stock por ahora" : `Te faltan ${num.format(item.costo_puntos - disponible)} pts`}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={!puede}
                    onClick={() => setConfirmar(item)}
                    className={buttonClassName("primary", "mt-auto w-full")}
                  >
                    {puede ? "Canjear" : alcanza ? "No disponible" : "Puntos insuficientes"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="canjes-empresa" className="flex flex-col gap-3">
        <h2 id="canjes-empresa" className="font-display text-lg uppercase text-brand-slate">
          Canjes de tu empresa
        </h2>
        {canjes.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/80 shadow-sm">Aún no hay canjes.</p>
        ) : (
          <ul className="divide-y divide-brand-slate/10 rounded-lg bg-white shadow-sm">
            {canjes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 font-sans text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-brand-black">{c.nombre}</p>
                  <p className="text-xs text-brand-slate/70">
                    {fecha.format(new Date(c.created_at))} · {num.format(c.puntos)} pts
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CANJE_LABEL[c.estado].clase}`}>
                  {CANJE_LABEL[c.estado].texto}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="movimientos-puntos" className="flex flex-col gap-3">
        <h2 id="movimientos-puntos" className="font-display text-lg uppercase text-brand-slate">
          Movimientos
        </h2>
        {movimientos.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center font-sans text-sm text-brand-slate/80 shadow-sm">
            Aún no hay movimientos. Los puntos aparecen cuando autorizas el primer pedido con cargo a tu empresa.
          </p>
        ) : (
          <div className="min-w-0 overflow-x-auto rounded-lg bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-brand-slate/10 text-xs font-semibold uppercase tracking-wide text-brand-slate/70">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Movimiento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-b border-brand-slate/5 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-brand-slate">{fecha.format(new Date(m.created_at))}</td>
                    <td className="px-4 py-3 text-brand-black">
                      {TIPO_LABEL[m.tipo]}
                      {m.referencia && <span className="block text-xs text-brand-slate/70">{m.referencia}</span>}
                    </td>
                    <td className="px-4 py-3 text-brand-slate">{m.estado === "pendiente" ? "Pendiente" : "Disponible"}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${m.cantidad < 0 ? "text-red-700" : "text-brand-black"}`}>
                      {m.cantidad > 0 ? "+" : "−"}
                      {num.format(Math.abs(m.cantidad))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmar !== null}
        title="Canjear artículo"
        description={
          confirmar
            ? `¿Canjear «${confirmar.nombre}» por ${num.format(confirmar.costo_puntos)} puntos de tu empresa? Se descuentan al momento y el artículo se recoge en tienda. Los artículos canjeados no tienen devolución ni cambio.`
            : undefined
        }
        confirmLabel={enviando ? "Canjeando…" : "Canjear"}
        tone="neutral"
        onConfirm={canjear}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  );
}
