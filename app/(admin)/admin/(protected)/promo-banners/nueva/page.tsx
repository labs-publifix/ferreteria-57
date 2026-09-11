import type { Metadata } from "next";
import { PromoBannerForm } from "@/components/admin/PromoBannerForm";

export const metadata: Metadata = { title: "Nueva tarjeta — Panel de administración" };

export default function NuevaPromoBannerPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Nueva tarjeta</h1>
      <PromoBannerForm mode="create" />
    </div>
  );
}
