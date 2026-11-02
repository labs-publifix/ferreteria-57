import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { guardarLogo } from "@/lib/club57/socios/adminDb";
import { LOGO_MAX_BYTES } from "@/lib/club57/socios/logo";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Subida del logotipo de un socio comercial (admin y operador). Ruta y no
// Server Action porque un SVG puede pesar hasta 2 MB y las Server Actions
// se cortan en 1 MB. El middleware no cubre /api/admin/*: el rol se valida
// aquí, y guardarLogo() vuelve a validar firma, tamaño y SVG sin código.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > LOGO_MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "El logotipo pesa más de 2 MB." }, { status: 413 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("logo");
  if (!(file instanceof File)) return NextResponse.json({ error: "Elige un archivo." }, { status: 400 });

  const result = await guardarLogo(staff, params.id, new Uint8Array(await file.arrayBuffer()));
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  revalidatePath("/admin/lealtad/socios", "layout");
  revalidatePath("/directorio");
  revalidatePath("/");
  revalidatePath("/cuenta");
  return NextResponse.json({ logoUrl: result.logoUrl });
}
