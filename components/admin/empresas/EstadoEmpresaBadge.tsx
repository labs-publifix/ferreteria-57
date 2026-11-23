import { ESTADO_EMPRESA_LABEL, type EstadoEmpresa } from "@/lib/club57/empresas/datos";

const ESTILO: Record<EstadoEmpresa, string> = {
  solicitud: "bg-amber-100 text-amber-900",
  activa: "bg-green-100 text-green-800",
  suspendida: "bg-red-50 text-red-700",
  baja: "bg-brand-slate/10 text-brand-slate",
  rechazada: "bg-brand-slate/10 text-brand-slate",
};

export function EstadoEmpresaBadge({ estado }: { estado: EstadoEmpresa }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 font-sans text-xs font-semibold ${ESTILO[estado]}`}>
      {ESTADO_EMPRESA_LABEL[estado]}
    </span>
  );
}
