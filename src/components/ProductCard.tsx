import { formatCLP, getProductImages, type Product } from "../lib/products"

export default function ProductCard({
  product,

  quantityInCart,

  onOpenDetails,

  onAdd,

  onChangeQuantity,
}: {
  product: Product

  quantityInCart: number

  onOpenDetails: (product: Product) => void

  onAdd: (product: Product) => void

  onChangeQuantity: (product: Product, delta: number) => void
}) {
  const image = getProductImages(product)[0]

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F0E8E2]">
        <button
          type="button"
          onClick={() => onOpenDetails(product)}
          className="h-full w-full text-left"
          aria-label={`Ver detalles de ${product.name}`}
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-5 text-center font-serif text-xl text-[#B8866A]">
              {product.name}
            </div>
          )}
        </button>
        {product.stock < 1 && (
          <span className="absolute left-3 top-3 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-wider">
            Agotado
          </span>
        )}
        {product.stock > 0 &&
          (quantityInCart > 0 ? (
            <div
              className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#2C2320]/95 px-2 py-1 text-white shadow-sm"
              aria-label={`Cantidad de ${product.name} en el pedido`}
            >
              <button
                type="button"
                onClick={() => onChangeQuantity(product, -1)}
                className="h-10 w-10 text-xl transition-colors hover:bg-white/15"
                aria-label={`Quitar una unidad de ${product.name}`}
              >
                −
              </button>
              <span
                className="min-w-8 text-center text-sm tabular-nums"
                aria-live="polite"
              >
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={() => onAdd(product)}
                disabled={quantityInCart >= product.stock}
                className="h-10 w-10 text-xl transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Agregar una unidad de ${product.name}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(product)}
              className="absolute bottom-3 left-3 right-3 bg-white/95 py-3 text-xs uppercase tracking-wider opacity-100 transition-colors hover:bg-[#2C2320] hover:text-white md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
            >
              Agregar al pedido
            </button>
          ))}
      </div>
      <div className="pt-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#A07D6E]">
          {product.category}
        </p>
        <button
          type="button"
          onClick={() => onOpenDetails(product)}
          className="mt-1 text-left font-serif text-base leading-snug hover:text-[#8A675A]"
        >
          {product.name}
        </button>
        <p className="mt-1 text-sm">{formatCLP(product.price)}</p>
        <button
          type="button"
          onClick={() => onOpenDetails(product)}
          className="mt-2 text-xs text-[#8A675A] underline underline-offset-4 hover:text-[#2C2320]"
        >
          Ver detalles
        </button>
      </div>
    </article>
  )
}
