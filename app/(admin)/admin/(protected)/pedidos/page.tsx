import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Pedidos — Panel de administración" };

export default function AdminPedidosPage() {
  return <AdminPlaceholder title="Pedidos" />;
}
