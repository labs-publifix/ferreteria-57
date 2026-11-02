import { BLOG_AUTHOR } from "@/lib/blog/seo";

// Monograma circular "F57" + autor + fecha. `children` va después de la
// fecha (p. ej. "· 9 min" o "Actualizado …").
export function AuthorMonogram({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-slate font-display text-white ${
        size === "lg" ? "size-11 text-sm" : "size-9 text-[11px]"
      }`}
    >
      F57
    </span>
  );
}

export function AuthorLine({ size = "md", children }: { size?: "md" | "lg"; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <AuthorMonogram size={size} />
      <div className="min-w-0 font-sans">
        <p className={`font-semibold text-brand-black ${size === "lg" ? "text-base" : "text-sm"}`}>{BLOG_AUTHOR}</p>
        <p className={`text-brand-slate ${size === "lg" ? "text-sm" : "text-xs"}`}>{children}</p>
      </div>
    </div>
  );
}
