"use client";

import { useState } from "react";
import { Select, type SelectOption } from "@/components/ui";

// El <select> nativo, una vez abierto, lo dibuja el sistema operativo con
// su propio look (visto en la captura: menú oscuro de Windows/Chrome, no el
// de la marca) — mismo problema ya resuelto para "Ordenar por" en
// CategoryProductBrowser.tsx con el listbox propio (components/ui/Select).
// Este wrapper le agrega un input oculto para que el formulario GET nativo
// de /admin/productos lo siga mandando como query param sin volverse un
// filtro 100% en cliente.
export function FilterSelectField({
  name,
  defaultValue,
  options,
  label,
}: {
  name: string;
  defaultValue: string;
  options: SelectOption[];
  label: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onChange={setValue} options={options} label={label} />
    </>
  );
}
