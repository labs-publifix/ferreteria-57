import { NextResponse, type NextRequest } from "next/server";
import { buildImportTemplate } from "@/lib/importTemplates/buildTemplate";
import { PRODUCT_CREATE_COLUMNS, PRODUCT_UPDATE_COLUMNS } from "@/lib/importTemplates/columnDefs";
import { requireStaff } from "@/lib/supabase/requireStaff";

// #8 — plantilla del importador de productos. El middleware solo protege
// "/admin/*", no "/api/admin/*" (ver el mismo comentario en
// app/api/admin/mercadopago/connect/route.ts), así que esta ruta verifica
// la sesión por su cuenta.
//
// ?modo=actualizar trae la plantilla del otro modo del importador (solo
// Codigo + Clave) — el botón "Descargar plantilla" en ImportWizard pasa el
// modo actualmente seleccionado, para que la plantilla siempre coincida
// con las columnas que ese modo va a leer.
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const modo = request.nextUrl.searchParams.get("modo");

  if (modo === "actualizar") {
    const buffer = await buildImportTemplate({
      columns: PRODUCT_UPDATE_COLUMNS,
      sheetName: "Actualizar Clave",
      instructionsTitle: "Plantilla — Actualizar Clave de productos existentes",
      extraNotes: [
        "Este archivo SOLO actualiza la Clave del producto que coincida por Código. Nombre, precio, stock, imágenes, categoría y estado activo/inactivo no se tocan aunque el archivo traiga otras columnas.",
      ],
    });
    return new NextResponse(new Blob([buffer]), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="plantilla-productos-actualizar-clave.xlsx"',
      },
    });
  }

  // La columna Categoria no es un enum fijo — depende de lo que exista
  // ahora mismo en la tienda. Se usa tanto para el desplegable de
  // validación como para el valor de la fila de ejemplo (la primera
  // categoría real, si hay alguna, en vez de un nombre inventado que
  // luego no resolvería).
  const { data: categories } = await staff.supabase.from("categories").select("name").order("position");
  const categoryNames = (categories ?? []).map((category) => category.name);

  const buffer = await buildImportTemplate({
    columns: PRODUCT_CREATE_COLUMNS,
    sheetName: "Productos",
    instructionsTitle: "Plantilla — Crear productos nuevos",
    dropdowns: categoryNames.length > 0 ? { categoria: categoryNames } : undefined,
    exampleRows:
      categoryNames.length > 0
        ? [{ categoria: categoryNames[0], codigo: "MAR-100", nombre: "Martillo de Carpintero 16oz", precio: "150.00", url: "" }]
        : undefined,
    extraNotes: [
      "Este archivo crea productos NUEVOS. Si el Código ya existe, la fila se ofrece para actualizar su precio en vez de duplicarlo.",
      "Para actualizar solo la Clave de productos ya existentes, usa el otro modo del importador (\"Actualizar Clave de productos existentes\") — trae su propia plantilla con solo las columnas Codigo y Clave.",
    ],
  });

  return new NextResponse(new Blob([buffer]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-productos.xlsx"',
    },
  });
}
