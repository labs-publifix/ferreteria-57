import Link from "next/link";
import { buttonClassName } from "@/components/ui";

// Se activa cuando ProductoPage llama notFound() (slug sin match en el
// mock). A diferencia de un early-return dentro de la página, esto sí
// responde con un 404 HTTP real y sigue envuelto por Header/Footer.
export default function ProductoNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-6xl flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:py-24">
      <h1 className="font-display text-2xl uppercase text-brand-slate sm:text-3xl">
        Producto no encontrado
      </h1>
      <p className="max-w-prose font-sans text-sm text-brand-black sm:text-base">
        No encontramos el producto que buscas. Puede que ya no esté
        disponible o que el enlace esté mal escrito.
      </p>
      <Link href="/" className={buttonClassName("primary")}>
        Volver al inicio
      </Link>
    </main>
  );
}
