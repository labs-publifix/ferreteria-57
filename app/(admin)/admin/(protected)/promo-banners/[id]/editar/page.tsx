import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromoBannerForm } from "@/components/admin/PromoBannerForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar tarjeta — Panel de administración" };

export default async function EditarPromoBannerPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = await supabase.from("promo_banners").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">Editar tarjeta</h1>
      <PromoBannerForm
        mode="edit"
        promoBannerId={data.id}
        initialValues={{
          eyebrow: data.eyebrow ?? "",
          title: data.title,
          subtitle: data.subtitle ?? "",
          fineprint: data.fineprint ?? "",
          href: data.href,
          colorTheme: data.color_theme,
          imageUrl: data.image_url,
          position: data.position,
          startsAt: data.starts_at ?? "",
          endsAt: data.ends_at ?? "",
          active: data.active,
        }}
      />
    </div>
  );
}
