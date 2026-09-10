import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Reseñas — Panel de administración" };

export default function AdminResenasPage() {
  return <AdminPlaceholder title="Reseñas" />;
}
