import { useEffect, useMemo, useState } from "react"

import type { Product } from "../lib/products"

const CART_STORAGE_KEY = "kaba-beauty-cart"

export type CartEntry = {
  productId: string

  quantity: number
}

export type CartItem = {
  product: Product

  quantity: number
}

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

export default function useCart(products: Product[]) {
  const [cart, setCart] = useState<CartEntry[]>(readCart)

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  const items = useMemo(
    () =>
      cart.flatMap((entry) => {
        const product = products.find(
          (item) => item.id === entry.productId && item.active,
        )

        if (!product || product.stock < 1) return []

        return [{ product, quantity: Math.min(entry.quantity, product.stock) }]
      }),

    [cart, products],
  )

  const count = items.reduce((total, item) => total + item.quantity, 0)

  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,

    0,
  )

  const add = (product: Product, quantity = 1) => {
    if (product.stock < 1) return

    setCart((current) => {
      const entry = current.find((item) => item.productId === product.id)

      const currentQuantity = entry?.quantity ?? 0

      const quantityToAdd = Math.min(
        Math.max(0, Math.floor(quantity)),

        Math.max(0, product.stock - currentQuantity),
      )

      if (quantityToAdd < 1) return current

      return entry
        ? current.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantityToAdd }
              : item,
          )
        : [...current, { productId: product.id, quantity: quantityToAdd }]
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

  const remove = (productId: string) => {
    setCart((current) =>
      current.filter((entry) => entry.productId !== productId),
    )
  }

  const quantityFor = (productId: string) =>
    cart.find((entry) => entry.productId === productId)?.quantity ?? 0

  return { items, count, subtotal, add, changeQuantity, remove, quantityFor }
}
