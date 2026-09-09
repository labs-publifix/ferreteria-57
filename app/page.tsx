import Link from "next/link";

// Placeholder temporal: la home real del e-commerce todavía no se construye
// en este encargo. Mientras tanto, esta ruta solo evita un 404 en el root
// de las vistas previas de Vercel y enlaza al kit de componentes en desarrollo.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
        Ferretería 57
      </h1>
      <p className="max-w-prose text-brand-black">
        La página de inicio del e-commerce todavía no se ha construido en
        este proyecto.
      </p>
      <Link
        href="/dev/ui"
        className="text-brand-slate underline underline-offset-4 hover:text-brand-black"
      >
        Ver el kit de componentes en /dev/ui
      </Link>
    </main>
  );
}
