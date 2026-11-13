import { useCallback, useEffect, useMemo, useState } from "react"

import logoKaba from "./logoKABA.png"

import AdminPage from "./components/AdminPage"

import HeroSection from "./components/HeroSection"

import ProductDetailModal from "./components/ProductDetailModal"

import { getProductImages, formatCLP, type Product } from "./lib/products"

import { supabase } from "./lib/supabase"

const CART_STORAGE_KEY = "kaba-beauty-cart"

type CartEntry = {
  productId: string

  quantity: number
}

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,

  "",
)

const WHATSAPP_CONTACT_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quisiera conocer más sobre KABA Beauty.")}`
  : null

function readCart(): CartEntry[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY) ?? "[]",
    )

    if (!Array.isArray(saved)) return []

    return saved.filter(
      (entry): entry is CartEntry =>
        typeof entry?.productId === "string" &&
        Number.isInteger(entry?.quantity) &&
        entry.quantity > 0,
    )
  } catch (error) {
    console.error("No se pudo leer el carrito guardado.", error)

    return []
  }
}

function App() {
  const [products, setProducts] = useState<Product[]>([])

  const [cart, setCart] = useState<CartEntry[]>(readCart)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")
  const [galleryEnabled, setGalleryEnabled] = useState(true)

  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.pathname === "/admin",
  )

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

  const loadProducts = useCallback(async () => {
    if (!supabase) {
      setError(
        "Falta configurar Supabase. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.",
      )

      setLoading(false)

      return
    }

    setLoading(true)

    const galleryResult = await supabase
      .from("products")
      .select(
        "id, name, description, category, price, stock, image_url, image_urls, active",
      )
      .order("created_at", { ascending: false })

    if (
      galleryResult.error?.message.toLowerCase().includes("image_urls") &&
      galleryResult.error.message.toLowerCase().includes("does not exist")
    ) {
      setGalleryEnabled(false)
      const legacyResult = await supabase
        .from("products")
        .select(
          "id, name, description, category, price, stock, image_url, active",
        )
        .order("created_at", { ascending: false })

      if (legacyResult.error) {
        setError(`No se pudo cargar el catálogo: ${legacyResult.error.message}`)
        setProducts([])
      } else {
        console.warn(
          "La migración de galería aún no está aplicada; se muestran las fotos existentes.",
        )
        setError("")
        setGalleryEnabled(false)
        setProducts(
          (legacyResult.data ?? []).map((product) => ({
            ...product,
            image_urls: product.image_url ? [product.image_url] : [],
          })),
        )
      }
    } else if (galleryResult.error) {
      setError(`No se pudo cargar el catálogo: ${galleryResult.error.message}`)
      setProducts([])
    } else {
      setError("")
      setGalleryEnabled(true)
      setProducts(galleryResult.data ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const onPopState = () =>
      setIsAdminRoute(window.location.pathname === "/admin")

    window.addEventListener("popstate", onPopState)

    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const navigate = (admin: boolean) => {
    const destination = admin ? "/admin" : "/"

    if (window.location.pathname !== destination)
      window.history.pushState({}, "", destination)

    setIsAdminRoute(admin)

    setCartOpen(false)

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock < 1) return

    setCart((current) => {
      const entry = current.find((item) => item.productId === product.id)

      const currentQuantity = entry?.quantity ?? 0

      const quantityToAdd = Math.min(
        Math.max(0, Math.floor(quantity)),

        Math.max(0, product.stock - currentQuantity),
      )

      if (quantityToAdd < 1) return current

      if (entry) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item,
        )
      }

      return [...current, { productId: product.id, quantity: quantityToAdd }]
    })
  }

  const openProductDetails = (product: Product) => {
    const quantityInCart =
      cart.find((item) => item.productId === product.id)?.quantity ?? 0

    setSelectedProduct(product)

    setDetailQuantity(Math.min(1, Math.max(0, product.stock - quantityInCart)))
  }

  const changeQuantity = (product: Product, delta: number) => {
    setCart((current) =>
      current

        .map((item) =>
          item.productId === product.id
            ? {
                ...item,

                quantity: Math.min(item.quantity + delta, product.stock),
              }
            : item,
        )

        .filter((item) => item.quantity > 0),
    )
  }

  const cartItems = cart.flatMap((entry) => {
    const product = products.find(
      (item) => item.id === entry.productId && item.active,
    )

    if (!product || product.stock < 1) return []

    return [{ product, quantity: Math.min(entry.quantity, product.stock) }]
  })

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const detailAvailableToAdd = selectedProduct
    ? Math.max(
        0,

        selectedProduct.stock -
          (cart.find((item) => item.productId === selectedProduct.id)
            ?.quantity ?? 0),
      )
    : 0

  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,

    0,
  )

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

  if (isAdminRoute) {
    return (
      <AdminPage
        onBack={() => navigate(false)}
        onProductsChanged={loadProducts}
        catalogError={error}
        products={products}
        galleryEnabled={galleryEnabled}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2320]">
      <header className="sticky top-0 z-30 border-b border-[#E4D8D0] bg-[#FAF8F5]/95 backdrop-blur">
        <div className="mx-auto flex h-[84px] max-w-7xl items-center justify-between gap-4 px-5 md:px-10">
          <button
            className="flex items-center gap-3.5"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src={logoKaba}
              alt="KABA Beauty"
              className="h-14 w-14 object-cover"
            />
            <span className="font-serif text-2xl tracking-[0.14em]">
              KABA <span className="text-[#B8866A]">Beauty</span>
            </span>
          </button>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#catalogo" className="hover:text-[#B8866A]">
              Catálogo
            </a>
            <a href="#nosotros" className="hover:text-[#B8866A]">
              Nosotros
            </a>
          </nav>
          <button
            onClick={() => setCartOpen(true)}
            className="border border-[#B8866A] px-4 py-2 text-sm transition-colors hover:bg-[#B8866A] hover:text-white"
            aria-label={`Ver carrito, ${cartCount} productos`}
          >
            Mi pedido ({cartCount})
          </button>
        </div>
      </header>

      <main>
        <HeroSection />

        <section
          id="catalogo"
          className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-20"
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
              {visibleProducts.map((product) => {
                const quantityInCart =
                  cart.find((item) => item.productId === product.id)
                    ?.quantity ?? 0

                return (
                  <article key={product.id} className="group">
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#F0E8E2]">
                      <button
                        type="button"
                        onClick={() => openProductDetails(product)}
                        className="h-full w-full text-left"
                        aria-label={`Ver detalles de ${product.name}`}
                      >
                        {getProductImages(product)[0] ? (
                          <img
                            src={getProductImages(product)[0]}
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
                              onClick={() => changeQuantity(product, -1)}
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
                              onClick={() => addToCart(product)}
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
                            onClick={() => addToCart(product)}
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
                        onClick={() => openProductDetails(product)}
                        className="mt-1 text-left font-serif text-base leading-snug hover:text-[#8A675A]"
                      >
                        {product.name}
                      </button>
                      <p className="mt-1 text-sm">{formatCLP(product.price)}</p>
                      <button
                        type="button"
                        onClick={() => openProductDetails(product)}
                        className="mt-2 text-xs text-[#8A675A] underline underline-offset-4 hover:text-[#2C2320]"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section
          id="nosotros"
          className="relative overflow-hidden bg-[#F1E4DC]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#D9BBA9]/50"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-[#D9BBA9]/40"
          />
          <div className="relative mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[#A47762]">
                KABA Beauty
              </p>
              <h2 className="font-serif text-4xl leading-tight md:text-6xl">
                Visítanos en <i className="text-[#A47762]">Reñaca</i>
              </h2>
              <p className="mt-5 text-sm leading-7 text-[#6D5A53] md:text-base">
                Te esperamos para descubrir tus favoritos de belleza. Encuentra
                aquí nuestra ubicación, horarios y redes sociales.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="border border-[#D9BBA9] bg-[#FAF8F5]/80 p-6 md:p-8">
                <span
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#F1E4DC] text-[#A47762]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <h3 className="font-serif text-xl">Encuéntranos</h3>
                <p className="mt-3 text-sm leading-6 text-[#78665E]">
                  Mallplaza Reñaca, primer piso, local 5A
                  <br />
                  Av. Borgoño 14580
                  <br />
                  Reñaca, Chile
                </p>
                <a
                  href="https://www.google.com/maps/place/Plaza+Re%C3%B1aca/@-32.9709593,-71.561078,15z/data=!4m10!1m2!2m1!1sAv.+Borgo%C3%B1o+14580,+Re%C3%B1aca,+Chile!3m6!1s0x9689dd0dd417c705:0x567cab2a303bf6c0!8m2!3d-32.9709593!4d-71.5430536!15sCiJBdi4gQm9yZ2_DsW8gMTQ1ODAsIFJlw7FhY2EsIENoaWxlWiEiH2F2IGJvcmdvw7FvIDE0NTgwIHJlw7FhY2EgY2hpbGWSAQ9zaG9wcGluZ19jZW50ZXKaAURDaTlEUVVsUlFVTnZaRU5vZEhsalJqbHZUMjFLZGsxcldtMWlWa1pIVmxWak5WZFlSWGhqUlVVeVdrZFdkbHBHUlJBQuABAPoBBAgAEEA!16s%2Fg%2F11c2l0ll3r?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex text-sm text-[#8A675A] underline underline-offset-4 hover:text-[#2C2320]"
                >
                  Ver en el mapa{" "}
                  <span className="ml-1" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </article>

              <article className="border border-[#D9BBA9] bg-[#FAF8F5]/80 p-6 md:p-8">
                <span
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#F1E4DC] text-[#A47762]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3.5 2" />
                  </svg>
                </span>
                <h3 className="font-serif text-xl">Horario de atención</h3>
                <p className="mt-3 text-sm leading-6 text-[#78665E]">
                  Lunes a sábado
                  <br />
                  <span className="text-[#2C2320]">11:00 a 19:00 hrs</span>
                </p>
                <p className="mt-3 text-sm leading-6 text-[#78665E]">
                  Domingos
                  <br />
                  <span className="text-[#2C2320]">12:00 a 17:00 hrs</span>
                </p>
              </article>

              <article className="border border-[#D9BBA9] bg-[#FAF8F5]/80 p-6 md:p-8">
                <span
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#F1E4DC] text-[#A47762]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r=".75" fill="currentColor" />
                  </svg>
                </span>
                <h3 className="font-serif text-xl">Síguenos en Instagram</h3>
                <p className="mt-3 text-sm leading-6 text-[#78665E]">
                  Novedades, favoritos y mucho más en nuestras redes.
                </p>
                <a
                  href="https://www.instagram.com/kababeauty.renaca/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex text-sm text-[#8A675A] underline underline-offset-4 hover:text-[#2C2320]"
                >
                  @kababeauty.renaca{" "}
                  <span className="ml-1" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </article>
            </div>
          </div>
        </section>
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

      <footer className="flex flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-[#8A7570] md:flex-row md:px-10">
        <span>© {new Date().getFullYear()} KABA Beauty</span>
      </footer>

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
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/35"
          onClick={() => setCartOpen(false)}
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
              <button
                onClick={() => setCartOpen(false)}
                className="p-2"
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>
            {cartItems.length === 0 ? (
              <p className="flex-1 py-12 text-center text-sm text-[#8A7570]">
                Tu pedido está vacío.
              </p>
            ) : (
              <>
                <div className="flex-1 divide-y divide-[#E4D8D0] overflow-y-auto">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4 py-4">
                      <div className="h-20 w-16 shrink-0 bg-[#F0E8E2]">
                        {getProductImages(product)[0] && (
                          <img
                            src={getProductImages(product)[0]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif">{product.name}</p>
                        <p className="mt-1 text-sm">
                          {formatCLP(product.price)}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <button
                            onClick={() => changeQuantity(product, -1)}
                            aria-label={`Quitar una unidad de ${product.name}`}
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            onClick={() => changeQuantity(product, 1)}
                            disabled={quantity >= product.stock}
                            aria-label={`Agregar una unidad de ${product.name}`}
                            className="disabled:opacity-30"
                          >
                            +
                          </button>
                          <button
                            onClick={() =>
                              setCart((current) =>
                                current.filter(
                                  (entry) => entry.productId !== product.id,
                                ),
                              )
                            }
                            className="ml-auto text-xs text-[#8A7570] underline"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#E4D8D0] pt-4">
                  <div className="mb-4 flex justify-between font-medium">
                    <span>Total referencial</span>
                    <span>{formatCLP(subtotal)}</span>
                  </div>
                  <button
                    onClick={sendWhatsAppOrder}
                    className="w-full bg-[#2C2320] px-4 py-4 text-xs uppercase tracking-[0.14em] text-white hover:bg-[#B8866A]"
                  >
                    Continuar por WhatsApp
                  </button>
                  {cartError && (
                    <p role="alert" className="mt-3 text-sm text-[#8B3C35]">
                      {cartError}
                    </p>
                  )}
                  <p className="mt-3 text-center text-xs text-[#8A7570]">
                    El pago y el despacho se coordinan directamente con la
                    tienda.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default App
