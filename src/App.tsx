import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"

import logoKaba from "./logoKABA.png"

import { supabase } from "./lib/supabase"

type Product = {
  id: string

  name: string

  description: string

  category: string

  price: number

  stock: number

  image_url: string | null

  active: boolean
}

type CartEntry = {
  productId: string
  quantity: number
}

type ProductForm = Omit<Product, "id">

const CATEGORIES = [
  "Maquillaje",

  "Cuidado facial",

  "Cuidado capilar",

  "Cuidado corporal",

  "Fragancias",

  "Accesorios",

  "Otros",
]

const CART_STORAGE_KEY = "kaba-beauty-cart"
const PRODUCT_IMAGE_BUCKET = "product-images"
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,
  "",
)
const WHATSAPP_CONTACT_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola, quisiera conocer más sobre KABA Beauty.")}`
  : null

const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",

    currency: "CLP",

    maximumFractionDigits: 0,
  }).format(amount)

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

  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.pathname === "/admin",
  )

  const [cartOpen, setCartOpen] = useState(false)
  const [cartError, setCartError] = useState("")

  const [query, setQuery] = useState("")

  const [category, setCategory] = useState("Todas")

  const loadProducts = useCallback(async () => {
    if (!supabase) {
      setError(
        "Falta configurar Supabase. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.",
      )

      setLoading(false)

      return
    }

    setLoading(true)

    const { data, error: queryError } = await supabase

      .from("products")

      .select(
        "id, name, description, category, price, stock, image_url, active",
      )

      .order("created_at", { ascending: false })

    if (queryError) {
      setError(`No se pudo cargar el catálogo: ${queryError.message}`)

      setProducts([])
    } else {
      setError("")

      setProducts(data ?? [])
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

  const addToCart = (product: Product) => {
    if (product.stock < 1) return

    setCart((current) => {
      const entry = current.find((item) => item.productId === product.id)

      if (entry) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        )
      }

      return [...current, { productId: product.id, quantity: 1 }]
    })
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
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2320]">
      <header className="sticky top-0 z-30 border-b border-[#E4D8D0] bg-[#FAF8F5]/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5 md:px-10">
          <button
            className="flex items-center gap-3"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src={logoKaba}
              alt="KABA Beauty"
              className="h-11 w-auto object-contain"
            />
            <span className="font-serif text-xl tracking-[0.14em]">
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
        <section className="relative overflow-hidden bg-[#F1E4DC]">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
            <div className="max-w-xl">
              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-[#8A675A]">
                Tu belleza, a tu manera
              </p>
              <h1 className="font-serif text-5xl leading-[1.12] md:text-7xl">
                Pequeños rituales,
                <br />
                <i>gran belleza.</i>
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-[#6D5A53]">
                Descubre maquillaje, cuidado facial, productos capilares y
                accesorios seleccionados para ti.
              </p>
              <a
                href="#catalogo"
                className="mt-8 inline-block bg-[#2C2320] px-7 py-3.5 text-xs uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80"
              >
                Explorar productos
              </a>
            </div>
            <div className="flex min-h-64 items-center justify-center md:min-h-96">
              <img
                src={logoKaba}
                alt=""
                className="h-72 w-72 max-w-full object-cover opacity-90 md:h-96 md:w-96"
              />
            </div>
          </div>
        </section>

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
              {visibleProducts.map((product) => (
                <article key={product.id} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#F0E8E2]">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-5 text-center font-serif text-xl text-[#B8866A]">
                        {product.name}
                      </div>
                    )}
                    {product.stock < 1 && (
                      <span className="absolute left-3 top-3 bg-white/90 px-3 py-1 text-[10px] uppercase tracking-wider">
                        Agotado
                      </span>
                    )}
                    {product.stock > 0 && (
                      <button
                        onClick={() => addToCart(product)}
                        className="absolute bottom-3 left-3 right-3 bg-white/95 py-3 text-xs uppercase tracking-wider opacity-100 transition-colors hover:bg-[#2C2320] hover:text-white md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
                      >
                        Agregar al pedido
                      </button>
                    )}
                  </div>
                  <div className="pt-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#A07D6E]">
                      {product.category}
                    </p>
                    <h3 className="mt-1 font-serif text-base leading-snug">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm">{formatCLP(product.price)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="nosotros" className="relative overflow-hidden bg-[#F1E4DC]">
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
                  Mallplaza Reñaca, primer piso
                  <br />
                  Av. Borgoño 14580
                  <br />
                  Reñaca, Chile
                </p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Av.+Borgo%C3%B1o+14580%2C+Re%C3%B1aca%2C+Chile"
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
                  <span className="text-[#2C2320]">11:00 a 15:30 hrs</span>
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
                  href="https://www.instagram.com/kababeauty.ranaca/"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex text-sm text-[#8A675A] underline underline-offset-4 hover:text-[#2C2320]"
                >
                  @kababeauty.ranaca{" "}
                  <span className="ml-1" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-[#8A7570] md:flex-row md:px-10">
        <span>© {new Date().getFullYear()} KABA Beauty</span>
        <button onClick={() => navigate(true)} className="hover:text-[#2C2320]">
          Administrar tienda
        </button>
      </footer>

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
                        {product.image_url && (
                          <img
                            src={product.image_url}
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

function AdminPage({
  onBack,

  onProductsChanged,

  catalogError,

  products,
}: {
  onBack: () => void

  onProductsChanged: () => Promise<void>

  catalogError: string

  products: Product[]
}) {
  const [session, setSession] = useState<boolean | null>(null)

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [message, setMessage] = useState("")

  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)

  const [imagePreview, setImagePreview] = useState("")

  const [draggingImage, setDraggingImage] = useState(false)

  const [form, setForm] = useState<ProductForm>({
    name: "",

    description: "",

    category: CATEGORIES[0],

    price: 0,

    stock: 0,

    image_url: "",

    active: true,
  })

  useEffect(() => {
    if (!supabase) {
      setMessage(
        "Configura las credenciales de Supabase antes de usar el administrador.",
      )

      setSession(false)

      return
    }

    const client = supabase

    const verifyAdmin = async (userId: string | undefined) => {
      if (!userId) {
        setSession(false)

        return
      }

      const { data, error: adminError } = await client

        .from("product_admins")

        .select("user_id")

        .eq("user_id", userId)

        .maybeSingle()

      if (adminError) {
        setMessage(
          `No se pudo comprobar el acceso de administrador: ${adminError.message}`,
        )

        setSession(false)
      } else if (!data) {
        setMessage("Esta cuenta no está autorizada para administrar la tienda.")

        setSession(false)
      } else {
        setMessage("")

        setSession(true)
        await onProductsChanged()
      }
    }

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setMessage(`No se pudo comprobar la sesión: ${sessionError.message}`)

        setSession(false)

        return
      }

      void verifyAdmin(data.session?.user.id)
    })

    const { data } = client.auth.onAuthStateChange((_event, currentSession) => {
      window.setTimeout(() => void verifyAdmin(currentSession?.user.id), 0)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("")
      return
    }

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [imageFile])

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) return

    setSaving(true)

    setMessage("")

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setMessage(
      authError ? `No se pudo iniciar sesión: ${authError.message}` : "",
    )

    setSaving(false)
  }

  const signOut = async () => {
    if (!supabase) return

    const { error: authError } = await supabase.auth.signOut()

    setMessage(
      authError ? `No se pudo cerrar sesión: ${authError.message}` : "",
    )
  }

  const resetForm = () => {
    setEditingId(null)

    setImageFile(null)

    setForm({
      name: "",
      description: "",
      category: CATEGORIES[0],
      price: 0,
      stock: 0,
      image_url: "",
      active: true,
    })
  }

  const selectImage = (file?: File) => {
    if (!file) return
    if (!IMAGE_TYPES[file.type]) {
      setMessage("Usa una imagen JPG, PNG o WebP.")
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setMessage("La imagen debe pesar como máximo 5 MB.")
      return
    }
    setMessage("")
    setImageFile(file)
  }

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) return

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      form.price <= 0 ||
      form.stock < 0
    ) {
      setMessage(
        "Completa el nombre, categoría y un precio mayor a cero. El stock no puede ser negativo.",
      )

      return
    }

    setSaving(true)

    setMessage("")

    let uploadedImagePath: string | null = null
    try {
      let imageUrl = form.image_url?.trim() || null

      if (imageFile) {
        const extension = IMAGE_TYPES[imageFile.type]
        uploadedImagePath = `${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(uploadedImagePath, imageFile, {
            contentType: imageFile.type,
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          setMessage(`No se pudo subir la imagen: ${uploadError.message}`)
          setSaving(false)
          return
        }

        imageUrl = supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .getPublicUrl(uploadedImagePath).data.publicUrl
      }

      const product = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        image_url: imageUrl,
      }

      const result = editingId
        ? await supabase.from("products").update(product).eq("id", editingId)
        : await supabase.from("products").insert(product)

      if (result.error) {
        if (uploadedImagePath) {
          const { error: cleanupError } = await supabase.storage
            .from(PRODUCT_IMAGE_BUCKET)
            .remove([uploadedImagePath])
          if (cleanupError) {
            setMessage(
              `No se pudo guardar el producto: ${result.error.message}. También falló la limpieza de la imagen: ${cleanupError.message}`,
            )
            setSaving(false)
            return
          }
        }
        setMessage(`No se pudo guardar el producto: ${result.error.message}`)
      } else {
        resetForm()
        await onProductsChanged()
        setMessage("Producto guardado.")
      }
    } catch (saveError) {
      const detail =
        saveError instanceof Error ? saveError.message : String(saveError)
      setMessage(`No se pudo guardar el producto: ${detail}`)
    } finally {
      setSaving(false)
    }
  }

  const editProduct = (product: Product) => {
    setEditingId(product.id)

    setImageFile(null)

    setForm({
      name: product.name,

      description: product.description,

      category: product.category,

      price: product.price,

      stock: product.stock,

      image_url: product.image_url ?? "",

      active: product.active,
    })

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleAvailability = async (product: Product) => {
    if (!supabase) return

    setMessage("")

    const { error: updateError } = await supabase

      .from("products")

      .update({ active: !product.active })

      .eq("id", product.id)

    if (updateError) {
      setMessage(`No se pudo actualizar el producto: ${updateError.message}`)

      return
    }

    await onProductsChanged()
  }

  const markOutOfStock = async (product: Product) => {
    if (!supabase || product.stock === 0) return

    setMessage("")

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: 0 })
      .eq("id", product.id)

    if (updateError) {
      setMessage(`No se pudo marcar como agotado: ${updateError.message}`)

      return
    }

    await onProductsChanged()
  }

  const deleteProduct = async (product: Product) => {
    if (
      !supabase ||
      !window.confirm(`¿Eliminar "${product.name}" permanentemente?`)
    )
      return

    setMessage("")

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)

    if (deleteError) {
      setMessage(`No se pudo eliminar el producto: ${deleteError.message}`)

      return
    }

    await onProductsChanged()

    if (editingId === product.id) resetForm()

    setMessage("Producto eliminado.")
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-5 py-8 text-[#2C2320] md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault()
              onBack()
            }}
            className="flex items-center gap-3"
          >
            <img src={logoKaba} alt="KABA Beauty" className="h-10 w-auto" />
            <span className="font-serif text-xl">Administración</span>
          </a>
          {session && (
            <button
              onClick={() => void signOut()}
              className="text-sm underline"
            >
              Cerrar sesión
            </button>
          )}
        </div>

        {message && (
          <p
            role="status"
            className="mb-5 border border-[#E4D8D0] bg-white p-3 text-sm"
          >
            {message}
          </p>
        )}
        {catalogError && (
          <p
            role="alert"
            className="mb-5 border border-[#D7A6A0] bg-white p-3 text-sm text-[#8B3C35]"
          >
            {catalogError}
          </p>
        )}
        {session === null ? (
          <p className="py-10 text-center text-sm text-[#8A7570]">
            Comprobando sesión...
          </p>
        ) : !session ? (
          <form
            onSubmit={(event) => void signIn(event)}
            className="mx-auto max-w-md border border-[#E4D8D0] bg-white p-6 md:p-8"
          >
            <h1 className="mb-2 font-serif text-3xl">Acceso privado</h1>
            <p className="mb-6 text-sm text-[#8A7570]">
              Inicia sesión con la cuenta administradora de la tienda.
            </p>
            <label className="mb-4 block text-sm">
              Correo
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full border border-[#E4D8D0] px-3 py-2.5 outline-[#B8866A]"
              />
            </label>
            <label className="mb-6 block text-sm">
              Contraseña
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full border border-[#E4D8D0] px-3 py-2.5 outline-[#B8866A]"
              />
            </label>
            <button
              disabled={saving}
              className="w-full bg-[#2C2320] px-4 py-3 text-sm text-white disabled:opacity-60"
            >
              {saving ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        ) : (
          <>
            <h1 className="mb-6 font-serif text-4xl">Gestionar productos</h1>
            <form
              onSubmit={(event) => void saveProduct(event)}
              className="mb-10 grid gap-4 border border-[#E4D8D0] bg-white p-5 md:grid-cols-2 md:p-7"
            >
              <h2 className="font-serif text-2xl md:col-span-2">
                {editingId ? "Editar producto" : "Agregar producto"}
              </h2>
              <label className="text-sm">
                Nombre
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="mt-1 w-full border border-[#E4D8D0] px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Categoría
                <input
                  required
                  list="product-categories"
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  className="mt-1 w-full border border-[#E4D8D0] px-3 py-2.5"
                />
                <datalist id="product-categories">
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>
              <label className="text-sm">
                Precio (CLP)
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={form.price || ""}
                  onChange={(event) =>
                    setForm({ ...form, price: Number(event.target.value) })
                  }
                  className="mt-1 w-full border border-[#E4D8D0] px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Stock
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) =>
                    setForm({ ...form, stock: Number(event.target.value) })
                  }
                  className="mt-1 w-full border border-[#E4D8D0] px-3 py-2.5"
                />
              </label>
              <label className="text-sm md:col-span-2">
                Descripción
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="mt-1 w-full border border-[#E4D8D0] px-3 py-2.5"
                />
              </label>
              <div className="text-sm md:col-span-2">
                <span className="mb-2 block">Foto del producto (opcional)</span>
                <label
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDraggingImage(true)
                  }}
                  onDragLeave={() => setDraggingImage(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDraggingImage(false)
                    selectImage(event.dataTransfer.files[0])
                  }}
                  className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-4 text-center transition-colors ${
                    draggingImage
                      ? "border-[#B8866A] bg-[#F5EDE8]"
                      : "border-[#E4D8D0] bg-[#FAF8F5] hover:border-[#B8866A]"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      selectImage(event.target.files?.[0])
                      event.target.value = ""
                    }}
                  />
                  {imagePreview || form.image_url ? (
                    <img
                      src={imagePreview || form.image_url || ""}
                      alt="Vista previa del producto"
                      className="h-28 max-w-full object-contain"
                    />
                  ) : (
                    <span
                      className="text-2xl text-[#B8866A]"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  )}
                  <span>
                    Arrastra una imagen aquí o haz clic para elegirla
                    <span className="mt-1 block text-xs text-[#8A7570]">
                      JPG, PNG o WebP · máximo 5 MB
                    </span>
                  </span>
                </label>
                {(imageFile || form.image_url) && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setForm({ ...form, image_url: "" })
                    }}
                    className="mt-2 text-xs text-[#8A7570] underline"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm({ ...form, active: event.target.checked })
                  }
                />
                Publicar en la tienda
              </label>
              <div className="flex gap-3 md:col-span-2">
                <button
                  disabled={saving}
                  className="bg-[#2C2320] px-6 py-3 text-sm text-white disabled:opacity-60"
                >
                  {saving
                    ? "Guardando..."
                    : editingId
                      ? "Guardar cambios"
                      : "Agregar producto"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-[#E4D8D0] px-5 py-3 text-sm"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col gap-4 border border-[#E4D8D0] bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="h-20 w-16 shrink-0 bg-[#F0E8E2]">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg">{product.name}</h3>
                    <p className="text-sm text-[#8A7570]">
                      {product.category} · {formatCLP(product.price)} · Stock:{" "}
                      {product.stock}
                    </p>
                    <p className="mt-1 text-xs">
                      {product.active ? "Publicado" : "Oculto"}
                      {product.stock === 0 ? " · Agotado" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => editProduct(product)}
                      className="border border-[#E4D8D0] px-3 py-2 text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => void markOutOfStock(product)}
                      disabled={product.stock === 0}
                      className="border border-[#E4D8D0] px-3 py-2 text-xs disabled:opacity-50"
                    >
                      {product.stock === 0 ? "Agotado" : "Marcar agotado"}
                    </button>
                    <button
                      onClick={() => void toggleAvailability(product)}
                      className="border border-[#E4D8D0] px-3 py-2 text-xs"
                    >
                      {product.active ? "Ocultar" : "Publicar"}
                    </button>
                    <button
                      onClick={() => void deleteProduct(product)}
                      className="border border-[#D7A6A0] px-3 py-2 text-xs text-[#8B3C35]"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
              {products.length === 0 && (
                <p className="py-10 text-center text-sm text-[#8A7570]">
                  Todavía no hay productos en la base de datos.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default App
