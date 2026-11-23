"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClassName, Modal, Select } from "@/components/ui";
import { assignClub57ListaPrecio } from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";
import { LISTA_PRECIO_OPCIONES, listaPrecioLabel } from "@/lib/club57/listaPrecio";

const TIENDA = "tienda";

// Fila «Lista de precio» del detalle de cliente (admin y operador). El
// cliente ve en el sitio «Tu precio Club 57» con el precio de su lista y lo
// paga en el checkout; nunca ve el número de lista.
export function Club57AssignListaPrecio({
  memberId,
  memberName,
  currentLista,
  storeList,
}: {
  memberId: string;
  memberName: string;
  currentLista: number | null;
  /** Lista que hoy es el precio de tienda (para explicar el efecto). */
  storeList: number;
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentLista ? String(currentLista) : TIENDA);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const savingRef = useRef(false);

  const options = LISTA_PRECIO_OPCIONES.map((option) => ({
    value: option.value === null ? TIENDA : String(option.value),
    label:
      option.value === null
        ? `Precio de tienda (hoy Precio ${storeList})`
        : option.value === storeList
          ? `${option.label} (igual a la tienda)`
          : option.label,
  }));
  const selected = value === TIENDA ? null : Number(value);
  const unchanged = selected === currentLista;

  async function handleSave() {
    if (savingRef.current || unchanged) return;
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    const result = await assignClub57ListaPrecio(memberId, selected);
    savingRef.current = false;
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setNotice("Lista de precio actualizada.");
    router.refresh();
  }

  return (
    <>
      <dd className="flex min-w-0 flex-col items-end gap-1 text-right">
        <span className="break-words font-medium">{listaPrecioLabel(currentLista)}</span>
        <button
          type="button"
          onClick={() => {
            setValue(currentLista ? String(currentLista) : TIENDA);
            setError(null);
            setNotice(null);
            setOpen(true);
          }}
          className="font-sans text-xs font-semibold text-brand-slate underline underline-offset-2 hover:text-brand-black"
        >
          {currentLista ? "Cambiar" : "Asignar lista"}
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
                Lista de precio
              </h2>
              <p className="mt-1 font-sans text-sm text-brand-slate/80">{memberName}</p>
            </div>
            <div>
              <span className="mb-1.5 block font-sans text-sm font-medium text-brand-black">Lista asignada</span>
              <Select value={value} onChange={setValue} options={options} label="Lista asignada" />
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-5 font-sans text-sm text-brand-slate">
              <li>
                Con sesión iniciada, el cliente ve «Tu precio Club 57» junto al precio de tienda y paga ese precio en
                línea. Nunca ve el número de lista.
              </li>
              <li>Si en algún producto su lista sale más cara que la tienda, paga el precio de tienda.</li>
              <li>La compra en tienda se pre-llena con su precio. Los pedidos ya hechos no cambian y el cambio queda registrado.</li>
            </ul>
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
