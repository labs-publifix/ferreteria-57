import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/supabase/requireStaff";
import { PROMO_BUCKET } from "@/lib/club57/promociones/config";

export const dynamic = "force-dynamic";

// Vista previa del PDF para el ADMIN (paso de Revisión y "Ver PDF" del
// listado). El middleware no cubre /api/admin/*, así que se verifica aquí.
// Redirige a una URL firmada de 2 minutos: suficiente para que el visor la
// abra, nunca una liga duradera. Los miembros jamás pasan por aquí — su
// descarga es /api/club57/promociones/[id]/descargar.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (!staff || staff.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const { data: promo } = await staff.supabase
    .from("club57_promociones")
    .select("archivo_path, archivo_eliminado_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!promo) return new NextResponse("Promoción no encontrada.", { status: 404 });
  if (promo.archivo_eliminado_at) return new NextResponse("El PDF de esta promoción ya se eliminó.", { status: 410 });

  const { data, error } = await createAdminClient()
    .storage.from(PROMO_BUCKET)
    .createSignedUrl(promo.archivo_path as string, 120);
  if (error || !data) return new NextResponse("No se pudo generar la vista previa.", { status: 502 });

  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
