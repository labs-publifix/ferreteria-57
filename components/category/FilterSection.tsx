export function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-brand-slate/10 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-brand-black">
        {title}
      </h3>
      {children}
    </div>
  );
}
