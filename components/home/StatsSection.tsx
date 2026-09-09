interface Stat {
  value: string;
  label: string;
}

const stats: Stat[] = [
  { value: "+2,000", label: "Productos en piso" },
  { value: "+15,000", label: "Referencias del catálogo completo Truper" },
  { value: "Casi 2 años", label: "Atendiendo a Querétaro" },
];

// Cifras de autoridad: mismo espíritu que TrustBar (reforzar confianza en
// texto corto), pero aquí el dato es el protagonista — número grande en
// font-display (mismo peso visual que los encabezados de sección) con una
// etiqueta corta debajo, envueltos en una tarjeta clara para separarlos
// visualmente del resto de la página sin usar naranja como fondo extenso.
export function StatsSection() {
  return (
    <div className="grid grid-cols-1 divide-y divide-brand-slate/15 rounded-xl bg-brand-gray sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-1 px-6 py-6 text-center sm:py-8"
        >
          <p className="font-display text-3xl uppercase text-brand-black sm:text-4xl">
            {stat.value}
          </p>
          <p className="font-sans text-sm text-brand-slate">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
