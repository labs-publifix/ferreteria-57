"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ProductCatalogAutocomplete } from "@/components/admin/ProductCatalogAutocomplete";
import { club57CompraDesdeCatalogo } from "@/lib/club57/catalogoCompra";
import type { SearchResultItem } from "@/lib/catalog/search";
import {
  getClub57PrecioMiembro,
  registerClub57ManualPurchase,
} from "@/app/(admin)/admin/(protected)/lealtad/clientes/actions";
import { formatPrice } from "@/lib/formatPrice";
import { newRequestId } from "@/lib/club57/requestId";

const inputClass =
  "w-full rounded-md border border-brand-slate/30 px-4 py-2.5 font-sans text-sm text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate";
const labelClass = "mb-1.5 block font-sans text-sm font-medium text-brand-black";

export function Club57RegisterPurchaseForm({ memberId }: { memberId: string }) {
  const router = useRouter();
  const productoId = useId();
  const codigoId = useId();
  const montoId = useId();
  const [producto, setProducto] = useState("");
  const [codigo, setCodigo] = useState("");
  const [monto, setMonto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);
  const [delCatalogo, setDelCatalogo] = useState(false);
  // Precio Club 57 del cliente para el producto elegido (si tiene lista y
  // le sale más barato que la tienda).
  const [precioClub, setPrecioClub] = useState<{ precio: number; tienda: number } | null>(null);
  const seleccionRef = useRef(0);
  // Doble clic: el ref frena el segundo envío antes de que React vuelva a
  // pintar el botón deshabilitado, y la llave (una por compra, se renueva
  // solo al registrarse con éxito) hace que el servidor ignore un envío
  // repetido que aun así llegara (ver registerClub57ManualPurchase).
  const submittingRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    requestIdRef.current ??= newRequestId();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await registerClub57ManualPurchase(memberId, monto, producto, codigo, requestIdRef.current);
    submittingRef.current = false;
    setIsSubmitting(false);

    if (result.error || typeof result.puntos !== "number") {
      setError(result.error ?? "No se pudo registrar la compra.");
      return;
    }

    requestIdRef.current = null;
    setSuccess(result.puntos);
    setProducto("");
    setCodigo("");
    setMonto("");
    setDelCatalogo(false);
    setPrecioClub(null);
    router.refresh();
  }

  async function elegirDelCatalogo(item: SearchResultItem) {
    const datos = club57CompraDesdeCatalogo(item);
    setProducto(datos.producto);
    setCodigo(datos.codigo);
    if (datos.monto) setMonto(datos.monto);
    setDelCatalogo(true);
    setPrecioClub(null);

    // Si el cliente tiene lista de precio, el monto sugerido es su precio.
    const seleccion = ++seleccionRef.current;
    const result = await getClub57PrecioMiembro(memberId, item.id, item.sku);
    if (seleccion !== seleccionRef.current || result.error || result.precio === undefined) return;
    if (result.precioTienda !== undefined && result.precio < result.precioTienda - 0.005) {
      setMonto(result.precio.toFixed(2));
      setPrecioClub({ precio: result.precio, tienda: result.precioTienda });
    }
  }

  function limpiarCatalogo() {
    seleccionRef.current += 1;
    setDelCatalogo(false);
    setPrecioClub(null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700">
          {error}
        </p>
      )}
      {success !== null && !error && (
        <p role="status" className="rounded-md bg-green-50 px-4 py-2.5 font-sans text-sm text-green-800">
          Compra registrada: {success} {success === 1 ? "punto" : "puntos"} en estado pendiente.
        </p>
      )}
      {/* Mismos datos que ya captura un pedido real (product_name/sku en
          order_items) — así el historial dice QUÉ se compró, no solo
          cuánto. Código es opcional: no siempre está a la mano en el
          mostrador. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr] sm:items-end">
        <ProductCatalogAutocomplete
          id={productoId}
          label="Producto"
          placeholder='Escribe para buscar, p. ej. "taladro"'
          value={producto}
          onChange={(value) => {
            setProducto(value);
            limpiarCatalogo();
          }}
          onSelect={elegirDelCatalogo}
          inputClassName={inputClass}
          labelClassName={labelClass}
        />
        <ProductCatalogAutocomplete
          id={codigoId}
          label="Código (opcional)"
          value={codigo}
          onChange={(value) => {
            setCodigo(value);
            limpiarCatalogo();
          }}
          onSelect={elegirDelCatalogo}
          minChars={1}
          listAlign="right"
          inputClassName={inputClass}
          labelClassName={labelClass}
        />
        <div>
          <label htmlFor={montoId} className={labelClass}>
            Monto (MXN)
          </label>
          <input
            id={montoId}
            type="number"
            required
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      {delCatalogo && (
        <p className="font-sans text-xs text-brand-slate/70">
          {precioClub
            ? `Monto con el precio Club 57 de este cliente: ${formatPrice(precioClub.precio)} (precio de tienda ${formatPrice(precioClub.tienda)}). `
            : "Datos del catálogo en línea. "}
          Revisa el monto si fueron varias piezas o si el precio en tienda es otro.
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto sm:self-start">
        {isSubmitting ? "Registrando…" : "Registrar compra en tienda"}
      </Button>
    </form>
  );
}
