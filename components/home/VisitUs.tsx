import { buttonClassName } from "@/components/ui";
import {
  STORE_ADDRESS,
  STORE_HORARIO,
  STORE_PHONE_DISPLAY,
  STORE_PHONE_TEL,
  GOOGLE_MAPS_DIRECTIONS_URL,
  GOOGLE_MAPS_EMBED_SRC,
} from "@/lib/store-info";

// Mapa embebido sin necesidad de API key (google.com/maps?...&output=embed).
// El iframe vive dentro de un contenedor con aspect-ratio fijo y w-full (sin
// atributos width/height en px): así siempre cabe en el ancho disponible y
// no puede generar overflow horizontal en móvil, sin importar el viewport.
export function VisitUs() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg shadow-sm sm:aspect-video">
        <iframe
          src={GOOGLE_MAPS_EMBED_SRC}
          title="Ubicación de Ferretería 57 en el mapa"
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="flex flex-col justify-center gap-4">
        <div>
          <p className="font-sans text-sm text-brand-black sm:text-base">
            {STORE_ADDRESS}
          </p>
          <a
            href={`tel:${STORE_PHONE_TEL}`}
            className="mt-1 inline-block font-sans text-sm text-brand-slate underline underline-offset-2 hover:text-brand-black"
          >
            {STORE_PHONE_DISPLAY}
          </a>
        </div>

        <ul className="flex flex-col gap-1 font-sans text-sm text-brand-black">
          {STORE_HORARIO.map((linea) => (
            <li key={linea}>{linea}</li>
          ))}
        </ul>

        <a
          href={GOOGLE_MAPS_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName("primary", "self-start")}
        >
          Cómo llegar
        </a>
      </div>
    </div>
  );
}
