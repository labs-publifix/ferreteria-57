"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClassName, Modal, Select } from "@/components/ui";
import { assignClub57Vendedor } from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";

const SIN_VENDEDOR = "";

// Fila «Vendedor» del detalle de cliente (admin y operador) con el botón
// para asignarlo o cambiarlo. El vendedor asignado es quien ve al cliente
// en su panel y le registra compras; el anterior deja de verlo.
export function Club57AssignVendedor({
  memberId,
  memberName,
  currentVendedorId,
  currentLabel,
  vendedores,
}: {
  memberId: string;
  memberName: string;
  currentVendedorId: string | null;
  currentLabel: string;
  vendedores: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentVendedorId ?? SIN_VENDEDOR);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const savingRef = useRef(false);

  const options = [
    ...vendedores.map((vendedor) => ({ value: vendedor.id, label: vendedor.nombre })),
    { value: SIN_VENDEDOR, label: "Sin vendedor" },
  ];
  const unchanged = value === (currentVendedorId ?? SIN_VENDEDOR);

  async function handleSave() {
    if (savingRef.current || unchanged) return;
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    const result = await assignClub57Vendedor(memberId, value);
    savingRef.current = false;
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setNotice("Vendedor actualizado.");
    router.refresh();
  }

  return (
    <>
      <dd className="flex min-w-0 flex-col items-end gap-1 text-right">
        <span className="break-words font-medium">{currentLabel}</span>
        <button
          type="button"
          onClick={() => {
            setValue(currentVendedorId ?? SIN_VENDEDOR);
            setError(null);
            setNotice(null);
            setOpen(true);
          }}
          className="font-sans text-xs font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          {currentVendedorId ? "Cambiar" : "Asignar vendedor"}
        </button>
        {notice && (
          <span role="status" className="text-xs text-green-800">
            {notice}
          </span>
        )}
      </dd>

      {open && (
        <Modal titleId={titleId} onClose={() => setOpen(false)} maxWidthClassName="max-w-md">
          <div className="flex flex-col gap-4 text-left">
            <div className="pr-10">
              <h2 id={titleId} className="font-display text-lg uppercase text-brand-slate">
                Vendedor del cliente
              </h2>
              <p className="mt-1 font-sans text-sm text-brand-slate/80">{memberName}</p>
            </div>
            <div>
              <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Vendedor asignado</span>
              <Select value={value} onChange={setValue} options={options} label="Vendedor asignado" />
            </div>
            <p className="font-sans text-sm text-brand-slate">
              El vendedor asignado ve a este cliente en su panel, le registra compras y puede corregirlas dentro del
              plazo de 7 días. Si cambias de vendedor, el anterior deja de verlo. Las compras ya registradas no
              cambian y el cambio queda registrado.
            </p>
            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setOpen(false)} className={buttonClassName("secondary", "w-full sm:w-auto")}>
                Volver
              </button>
              <Button type="button" onClick={handleSave} disabled={isSaving || unchanged} className="w-full sm:w-auto">
                {isSaving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
