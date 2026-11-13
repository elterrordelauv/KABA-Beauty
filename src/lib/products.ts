export type Product = {
  id: string

  name: string

  description: string

  category: string

  price: number

  stock: number

  image_url: string | null

  image_urls: string[] | null

  active: boolean
}

export type ProductForm = Omit<Product, "id" | "image_url" | "image_urls"> & {
  image_urls: string[]
}

export const CATEGORIES = [
  "Maquillaje",

  "Cuidado facial",

  "Cuidado capilar",

  "Cuidado corporal",

  "Fragancias",

  "Accesorios",

  "Otros",
]

export const PRODUCT_IMAGE_BUCKET = "product-images"

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",

  "image/png": "png",

  "image/webp": "webp",
}

export const formatCLP = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",

    currency: "CLP",

    maximumFractionDigits: 0,
  }).format(amount)

export function getProductImages(product: Product): string[] {
  return [
    ...new Set(
      [...(product.image_urls ?? []), product.image_url].filter(
        (url): url is string => Boolean(url),
      ),
    ),
  ]
}

export function getProductImageStoragePath(imageUrl: string): string | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()

  if (!supabaseUrl) return null

  try {
    const url = new URL(imageUrl)

    const projectUrl = new URL(supabaseUrl)

    const bucketPrefix = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`

    if (
      url.origin !== projectUrl.origin ||
      !url.pathname.startsWith(bucketPrefix)
    )
      return null

    return decodeURIComponent(url.pathname.slice(bucketPrefix.length)) || null
  } catch {
    return null
  }
}
