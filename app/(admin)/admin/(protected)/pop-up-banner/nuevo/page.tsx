import type { Metadata } from "next";
import { PopUpBannerForm } from "@/components/admin/PopUpBannerForm";

export const metadata: Metadata = { title: "Nuevo banner — Panel de administración" };

export default function NuevoPopUpBannerPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Nuevo banner</h1>
      <PopUpBannerForm mode="create" />
    </div>
  );
}
