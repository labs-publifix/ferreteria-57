import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Categorías — Panel de administración" };

export default function AdminCategoriasPage() {
  return <AdminPlaceholder title="Categorías" />;
}
