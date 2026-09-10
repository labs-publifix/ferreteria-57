import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Promo Banners — Panel de administración" };

export default function AdminPromoBannersPage() {
  return <AdminPlaceholder title="Promo Banners" />;
}
