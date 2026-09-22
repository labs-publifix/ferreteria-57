import { redirect } from "next/navigation";

// Sin pantalla de inicio propia todavía — "Clientes" es lo que un
// vendedor necesita apenas entra (dar de alta, ver saldo, registrar
// compra), así que es el destino por default.
export default function VendedorHomePage() {
  redirect("/admin/vendedor/clientes");
}
