import type { Metadata } from "next";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Top Banner — Panel de administración" };

export default function AdminTopBannerPage() {
  return <AdminPlaceholder title="Top Banner" />;
}
