import { useEffect, useMemo, useState } from "react"

import AboutSection from "../components/AboutSection"
import CartDrawer from "../components/CartDrawer"
import Footer from "../components/Footer"
import Header from "../components/Header"

import HeroSection from "../components/HeroSection"

import ProductCard from "../components/ProductCard"

import ProductDetailModal from "../components/ProductDetailModal"

import type { CartItem } from "../hooks/useCart"

import type { Product } from "../lib/products"

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,

  "",
)

const WHATSAPP_CONTACT_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quisiera conocer más sobre KABA Beauty.")}`
  : null

export default function HomePage({
  products,

  loading,

  error,

  cartItems,

  cartCount,

  subtotal,

  addToCart,

  changeQuantity,

  removeFromCart,
}: {
  products: Product[]

  loading: boolean

  error: string

  cartItems: CartItem[]

  cartCount: number

  subtotal: number

  addToCart: (product: Product, quantity?: number) => void

  changeQuantity: (product: Product, delta: number) => void

  removeFromCart: (productId: string) => void
}) {
  const [cartOpen, setCartOpen] = useState(false)

  const [cartError, setCartError] = useState("")

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [detailQuantity, setDetailQuantity] = useState(1)

  const [query, setQuery] = useState("")

  const [category, setCategory] = useState("Todas")

  useEffect(() => {
    if (!selectedProduct) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProduct(null)
    }

    window.addEventListener("keydown", closeOnEscape)

    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [selectedProduct])

  const openProductDetails = (product: Product) => {
    const quantityInCart =
      cartItems.find((item) => item.product.id === product.id)?.quantity ?? 0

    setSelectedProduct(product)

    setDetailQuantity(Math.min(1, Math.max(0, product.stock - quantityInCart)))
  }

  const detailAvailableToAdd = selectedProduct
    ? Math.max(
        0,

        selectedProduct.stock -
          (cartItems.find((item) => item.product.id === selectedProduct.id)
            ?.quantity ?? 0),
      )
    : 0

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es")

    return products.filter((product) => {
      const matchesCategory =
        category === "Todas" || product.category === category

      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.description} ${product.category}`

          .toLocaleLowerCase("es")

          .includes(normalizedQuery)

      return product.active && matchesCategory && matchesQuery
    })
  }, [category, products, query])

  const sendWhatsAppOrder = () => {
    if (!WHATSAPP_NUMBER) {
      setCartError(
        "Configura VITE_WHATSAPP_NUMBER con el número de WhatsApp del negocio para recibir pedidos.",
      )

      return
    }

    if (!cartItems.length) return

    setCartError("")

    const lines = cartItems.map(
      ({ product, quantity }) => `• ${product.name} x${quantity}`,
    )

    const message = [
      "Hola, quiero hacer este pedido en KABA Beauty:",

      "",

      ...lines,

      "",

      "¿Me confirman disponibilidad, despacho y forma de pago?",
    ].join("\n")

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,

      "_blank",

      "noopener,noreferrer",
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2320]">
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />
      <main>
        <HeroSection />
        <section
          id="catalogo"
          className="scroll-mt-24 mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-20"
        >
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#B8866A]">
                KABA Beauty
              </p>
              <h2 className="font-serif text-4xl">Nuestro catálogo</h2>
            </div>
            <label className="flex w-full max-w-sm items-center border-b border-[#B8866A] py-2">
              <span className="sr-only">Buscar productos</span>
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#9D8980]"
                placeholder="Buscar productos..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <span aria-hidden="true" className="text-lg">
                ⌕
              </span>
            </label>
          </div>
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {[
              "Todas",

              ...new Set(
                products

                  .filter((product) => product.active)

                  .map((product) => product.category),
              ),
            ].map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 border px-4 py-2 text-xs transition-colors ${
                  category === item
                    ? "border-[#2C2320] bg-[#2C2320] text-white"
                    : "border-[#E4D8D0] hover:border-[#B8866A]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {loading ? (
            <p className="py-16 text-center text-sm text-[#8A7570]">
              Cargando productos...
            </p>
          ) : error ? (
            <div
              role="alert"
              className="border border-[#D7A6A0] bg-white p-5 text-sm text-[#8B3C35]"
            >
              {error}
            </div>
          ) : visibleProducts.length === 0 ? (
            <p className="py-16 text-center text-sm text-[#8A7570]">
              Aún no hay productos publicados en esta categoría.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={
                    cartItems.find((item) => item.product.id === product.id)
                      ?.quantity ?? 0
                  }
                  onOpenDetails={openProductDetails}
                  onAdd={addToCart}
                  onChangeQuantity={changeQuantity}
                />
              ))}
            </div>
          )}
        </section>
        <AboutSection />
      </main>
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          availableToAdd={detailAvailableToAdd}
          quantity={detailQuantity}
          onQuantityChange={setDetailQuantity}
          onAddToCart={() => {
            addToCart(selectedProduct, detailQuantity)

            setSelectedProduct(null)
          }}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <Footer />
      {WHATSAPP_CONTACT_URL && (
        <a
          href={WHATSAPP_CONTACT_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Escríbenos por WhatsApp"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.04 2a9.9 9.9 0 0 0-8.48 15.01L2.2 22l5.12-1.34A9.93 9.93 0 1 0 12.04 2Zm0 18.08a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.04.8.81-2.96-.2-.31a8.14 8.14 0 1 1 6.86 3.78Zm4.47-6.1c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.15 1.51.09.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
          </svg>
        </a>
      )}
      {cartOpen && (
        <CartDrawer
          items={cartItems}
          subtotal={subtotal}
          error={cartError}
          onClose={() => setCartOpen(false)}
          onChangeQuantity={changeQuantity}
          onRemove={removeFromCart}
          onCheckout={sendWhatsAppOrder}
        />
      )}
    </div>
  )
}
