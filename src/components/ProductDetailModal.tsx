import { useEffect, useState } from "react"

import { formatCLP, getProductImages, type Product } from "../lib/products"

export default function ProductDetailModal({
  product,

  availableToAdd,

  quantity,

  onQuantityChange,

  onAddToCart,

  onClose,
}: {
  product: Product

  availableToAdd: number

  quantity: number

  onQuantityChange: (quantity: number) => void

  onAddToCart: () => void

  onClose: () => void
}) {
  const images = getProductImages(product)

  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    setSelectedImage(0)
  }, [product.id])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-[#FAF8F5] shadow-2xl md:grid md:grid-cols-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center bg-white/90 text-lg hover:bg-white"
          aria-label="Cerrar detalles del producto"
        >
          ✕
        </button>
        <div>
          <div className="aspect-square bg-[#F0E8E2] md:aspect-auto md:min-h-[28rem]">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={`${product.name}${
                  images.length > 1 ? `, foto ${selectedImage + 1}` : ""
                }`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center p-8 text-center font-serif text-3xl text-[#B8866A]">
                {product.name}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto bg-[#FAF8F5] p-3">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`Ver foto ${index + 1} de ${product.name}`}
                  aria-pressed={selectedImage === index}
                  className={`h-16 w-16 shrink-0 overflow-hidden border-2 ${
                    selectedImage === index
                      ? "border-[#B8866A]"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col p-6 md:p-9">
          <p className="text-xs uppercase tracking-[0.18em] text-[#A07D6E]">
            {product.category}
          </p>
          <h2
            id="product-detail-title"
            className="mt-3 font-serif text-3xl leading-tight"
          >
            {product.name}
          </h2>
          <p className="mt-4 text-2xl">{formatCLP(product.price)}</p>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#6D5A53]">
            {product.description ||
              "Consulta con nosotros para conocer más detalles de este producto."}
          </p>
          <p className="mt-5 text-sm text-[#78665E]">
            {product.stock > 0
              ? `Disponible: ${product.stock} unidad${
                  product.stock === 1 ? "" : "es"
                }`
              : "Producto agotado"}
          </p>

          {product.stock > 0 && (
            <div className="mt-auto pt-8">
              {availableToAdd < 1 ? (
                <p className="border border-[#D9BBA9] bg-[#F1E4DC]/50 p-4 text-sm leading-6 text-[#78665E]">
                  Ya agregaste al pedido todas las unidades disponibles.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm">Cantidad</span>
                    <div
                      className="flex items-center border border-[#D9BBA9]"
                      aria-label="Seleccionar cantidad"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onQuantityChange(Math.max(1, quantity - 1))
                        }
                        disabled={quantity <= 1}
                        className="h-11 w-11 disabled:opacity-30"
                        aria-label="Quitar una unidad"
                      >
                        −
                      </button>
                      <span className="min-w-10 text-center" aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onQuantityChange(
                            Math.min(availableToAdd, quantity + 1),
                          )
                        }
                        disabled={quantity >= availableToAdd}
                        className="h-11 w-11 disabled:opacity-30"
                        aria-label="Agregar una unidad"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-right text-xs text-[#8A7570]">
                    Subtotal: {formatCLP(product.price * quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={onAddToCart}
                    disabled={quantity < 1 || quantity > availableToAdd}
                    className="mt-4 w-full bg-[#2C2320] px-5 py-4 text-xs uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#8A675A] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Agregar {quantity} al pedido
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
