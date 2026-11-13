import { formatCLP, getProductImages } from "../lib/products"

import type { CartItem } from "../hooks/useCart"

export default function CartDrawer({
  items,

  subtotal,

  error,

  onClose,

  onChangeQuantity,

  onRemove,

  onCheckout,
}: {
  items: CartItem[]

  subtotal: number

  error: string

  onClose: () => void

  onChangeQuantity: CartItemChange

  onRemove: (productId: string) => void

  onCheckout: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="flex h-full w-full max-w-md flex-col bg-[#FAF8F5] p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E4D8D0] pb-4">
          <h2 id="cart-title" className="font-serif text-2xl">
            Tu pedido
          </h2>
          <button onClick={onClose} className="p-2" aria-label="Cerrar carrito">
            ✕
          </button>
        </div>
        {items.length === 0 ? (
          <p className="flex-1 py-12 text-center text-sm text-[#8A7570]">
            Tu pedido está vacío.
          </p>
        ) : (
          <>
            <div className="flex-1 divide-y divide-[#E4D8D0] overflow-y-auto">
              {items.map(({ product, quantity }) => {
                const image = getProductImages(product)[0]

                return (
                  <div key={product.id} className="flex gap-4 py-4">
                    <div className="h-20 w-16 shrink-0 bg-[#F0E8E2]">
                      {image && (
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif">{product.name}</p>
                      <p className="mt-1 text-sm">{formatCLP(product.price)}</p>
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <button
                          onClick={() => onChangeQuantity(product, -1)}
                          aria-label={`Quitar una unidad de ${product.name}`}
                        >
                          −
                        </button>
                        <span>{quantity}</span>
                        <button
                          onClick={() => onChangeQuantity(product, 1)}
                          disabled={quantity >= product.stock}
                          aria-label={`Agregar una unidad de ${product.name}`}
                          className="disabled:opacity-30"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onRemove(product.id)}
                          className="ml-auto text-xs text-[#8A7570] underline"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-[#E4D8D0] pt-4">
              <div className="mb-4 flex justify-between font-medium">
                <span>Total referencial</span>
                <span>{formatCLP(subtotal)}</span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full bg-[#2C2320] px-4 py-4 text-xs uppercase tracking-[0.14em] text-white hover:bg-[#B8866A]"
              >
                Continuar por WhatsApp
              </button>
              {error && (
                <p role="alert" className="mt-3 text-sm text-[#8B3C35]">
                  {error}
                </p>
              )}
              <p className="mt-3 text-center text-xs text-[#8A7570]">
                El pago y el despacho se coordinan directamente con la tienda.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

type CartItemChange = (product: CartItem["product"], delta: number) => void
