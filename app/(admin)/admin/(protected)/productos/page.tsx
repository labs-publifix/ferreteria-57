import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Productos — Panel de administración" };

export default function AdminProductosPage() {
  return <AdminPlaceholder title="Productos" />;
}
