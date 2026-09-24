// Next.js exige que exista un app/layout.tsx cuando hay un app/not-found.tsx
// a nivel raíz, aunque este proyecto use "múltiples layouts raíz" vía route
// groups (app/(site)/layout.tsx y app/(admin)/layout.tsx, cada uno con su
// propio <html>/<body> — ver esos archivos). Este layout NO debe agregar su
// propio <html>/<body>: si lo hiciera, cualquier página normal bajo (site)
// o (admin) quedaría envuelta dos veces (este layout + el de su route
// group), produciendo HTML inválido. Por eso solo pasa `children` tal
// cual — para una ruta que sí matchea (site)/(admin), ese `children` YA
// es el <html>/<body> completo de ese route group; para una ruta que no
// matchea nada (ver app/not-found.tsx), es el <html>/<body> propio del 404.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
