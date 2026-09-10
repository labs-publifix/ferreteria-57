import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Programa de Lealtad — Panel de administración" };

export default function AdminLealtadPage() {
  return <AdminPlaceholder title="Programa de Lealtad" />;
}
