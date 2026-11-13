import { useCallback, useEffect, useState } from "react"

import AdminPage from "./pages/AdminPage"

import HomePage from "./pages/HomePage"

import useCart from "./hooks/useCart"

import type { Product } from "./lib/products"

import { supabase } from "./lib/supabase"

function App() {
  const [products, setProducts] = useState<Product[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const [galleryEnabled, setGalleryEnabled] = useState(true)

  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.pathname === "/admin",
  )

  const cart = useCart(products)

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

    window.scrollTo({ top: 0, behavior: "smooth" })
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
    <HomePage
      products={products}
      loading={loading}
      error={error}
      cartItems={cart.items}
      cartCount={cart.count}
      subtotal={cart.subtotal}
      addToCart={cart.add}
      changeQuantity={cart.changeQuantity}
      removeFromCart={cart.remove}
    />
  )
}

export default App
