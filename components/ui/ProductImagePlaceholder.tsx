// Marcador de posición "IMG" reusado en cualquier lugar que muestre una
// imagen de producto (ProductCard, ProductGallery, líneas del carrito)
// mientras Product.images siga vacío. Sin ancho/alto propios: cada quien
// lo usa controla su tamaño vía className (aspect-square w-full para una
// tarjeta completa, size-20 para una miniatura de carrito, etc.).
export function ProductImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-brand-gray text-sm text-brand-slate/60 ${className}`}
      aria-hidden="true"
    >
      IMG
    </div>
  );
}
