import Image from "next/image";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function FacebookIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M14 8.5h-1.5A1.5 1.5 0 0011 10v2m0 0H9.5m1.5 0v6.5M9.5 12H11" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg {...ICON_PROPS} className="size-5" aria-hidden="true">
      <path d="M14 4v10.5a3 3 0 11-3-3" />
      <path d="M14 4c.4 2 2 3.5 4 3.8V10c-1.5 0-3-.5-4-1.5" />
    </svg>
  );
}

const horario = [
  "Lunes a viernes: 8:00 am – 7:00 pm",
  "Sábados: 8:00 am – 3:00 pm",
  "Domingo: cerrado",
];

export function Footer() {
  return (
    <footer className="bg-brand-slate text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start">
          <Image
            src="/brand/logo-blanco.png"
            alt="Ferretería 57"
            width={983}
            height={302}
            className="h-10 w-auto sm:h-12"
          />
          <p className="mt-3 font-sans text-sm text-white/85">
            Lateral Carretera Federal No. 57 230, Casa Blanca, 76030 Santiago
            de Querétaro, Qro.
          </p>
          <a
            href="tel:+524427782708"
            className="mt-2 inline-block font-sans text-sm text-white underline underline-offset-2"
          >
            442 778 2708
          </a>
        </div>

        <div>
          <h2 className="font-display text-sm uppercase text-white">
            Horario de atención
          </h2>
          <ul className="mt-3 flex flex-col gap-1 font-sans text-sm text-white/85">
            {horario.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm uppercase text-white">
            Síguenos
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <a
              href="https://www.facebook.com/p/Ferretería-57-Qro-61575239701906/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ferretería 57 en Facebook"
              className="flex size-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://www.instagram.com/ferreteria57qro/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ferretería 57 en Instagram"
              className="flex size-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <InstagramIcon />
            </a>
            {/*
              TODO: reemplazar href="#" por la liga real de TikTok de
              Ferretería 57 en cuanto exista. Es el único placeholder de
              contenido pendiente en todo el sitio.
            */}
            <a
              href="#"
              aria-label="TikTok (próximamente)"
              className="flex size-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
