import { useEffect, useState, type FormEvent } from "react"

import logoKaba from "../logoKABA.png"

import { supabase } from "../lib/supabase"

import {
  CATEGORIES,
  formatCLP,
  getProductImages,
  getProductImageStoragePath,
  IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  PRODUCT_IMAGE_BUCKET,
  type Product,
  type ProductForm,
} from "../lib/products"

function AdminPage({
  onBack,

  onProductsChanged,

  catalogError,

  products,
  galleryEnabled,
}: {
  onBack: () => void

  onProductsChanged: () => Promise<void>

  catalogError: string

  products: Product[]
  galleryEnabled: boolean
}) {
  const [session, setSession] = useState<boolean | null>(null)

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [message, setMessage] = useState("")

  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)

  const [imageFiles, setImageFiles] = useState<File[]>([])

  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [draggingImage, setDraggingImage] = useState(false)

  const [form, setForm] = useState<ProductForm>({
    name: "",

    description: "",

    category: CATEGORIES[0],

    price: 0,

    stock: 0,

    image_urls: [],

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
    const previewUrls = imageFiles.map((file) => URL.createObjectURL(file))

    setImagePreviews(previewUrls)

    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [imageFiles])

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

    setImageFiles([])

    setForm({
      name: "",

      description: "",

      category: CATEGORIES[0],

      price: 0,

      stock: 0,

      image_urls: [],

      active: true,
    })
  }

  const selectImages = (files?: FileList | File[]) => {
    if (!files?.length) return

    const selectedFiles = Array.from(files)

    const invalidType = selectedFiles.find((file) => !IMAGE_TYPES[file.type])

    if (invalidType) {
      setMessage("Usa imágenes JPG, PNG o WebP.")

      return
    }

    if (selectedFiles.some((file) => file.size > MAX_IMAGE_SIZE)) {
      setMessage("Cada imagen debe pesar como máximo 5 MB.")

      return
    }

    setMessage("")

    setImageFiles((current) => [...current, ...selectedFiles])
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

    if (!galleryEnabled && form.image_urls.length + imageFiles.length > 1) {
      setMessage(
        "Para guardar más de una foto, ejecuta la migración 20261112000000_product_image_gallery.sql en Supabase.",
      )
      return
    }

    setSaving(true)

    setMessage("")

    const uploadedImagePaths: string[] = []

    let productSaved = false

    try {
      const newImageUrls: string[] = []

      for (const imageFile of imageFiles) {
        const extension = IMAGE_TYPES[imageFile.type]

        const uploadedImagePath = `${crypto.randomUUID()}.${extension}`

        const { error: uploadError } = await supabase.storage

          .from(PRODUCT_IMAGE_BUCKET)

          .upload(uploadedImagePath, imageFile, {
            contentType: imageFile.type,

            cacheControl: "3600",

            upsert: false,
          })

        if (uploadError) {
          const cleanup = uploadedImagePaths.length
            ? await supabase.storage

                .from(PRODUCT_IMAGE_BUCKET)

                .remove(uploadedImagePaths)
            : null

          setMessage(`No se pudo subir la imagen: ${uploadError.message}`)

          if (cleanup?.error) {
            setMessage(
              `No se pudo subir la imagen: ${uploadError.message}. También falló la limpieza de las imágenes cargadas: ${cleanup.error.message}`,
            )
          }

          return
        }

        uploadedImagePaths.push(uploadedImagePath)

        newImageUrls.push(
          supabase.storage

            .from(PRODUCT_IMAGE_BUCKET)

            .getPublicUrl(uploadedImagePath).data.publicUrl,
        )
      }

      const imageUrls = [...form.image_urls, ...newImageUrls]

      const { image_urls: _imageUrls, ...formValues } = form
      const product = {
        ...formValues,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        image_url: imageUrls[0] ?? null,
        ...(galleryEnabled ? { image_urls: imageUrls } : {}),
      }

      const result = editingId
        ? await supabase.from("products").update(product).eq("id", editingId)
        : await supabase.from("products").insert(product)

      if (result.error) {
        if (uploadedImagePaths.length) {
          const { error: cleanupError } = await supabase.storage

            .from(PRODUCT_IMAGE_BUCKET)

            .remove(uploadedImagePaths)

          if (cleanupError) {
            setMessage(
              `No se pudo guardar el producto: ${result.error.message}. También falló la limpieza de las imágenes: ${cleanupError.message}`,
            )

            return
          }
        }

        setMessage(`No se pudo guardar el producto: ${result.error.message}`)
      } else {
        productSaved = true

        const previousProduct = products.find((item) => item.id === editingId)
        const previousImages = previousProduct
          ? getProductImages(previousProduct)
          : []

        const imagesUsedElsewhere = new Set(
          products

            .filter((item) => item.id !== editingId)

            .flatMap(getProductImages),
        )

        const removedImagePaths = previousImages

          .filter(
            (imageUrl) =>
              !imageUrls.includes(imageUrl) &&
              !imagesUsedElsewhere.has(imageUrl),
          )

          .map(getProductImageStoragePath)

          .filter((path): path is string => path !== null)

        const { error: cleanupError } = removedImagePaths.length
          ? await supabase.storage

              .from(PRODUCT_IMAGE_BUCKET)

              .remove(removedImagePaths)
          : { error: null }

        resetForm()

        await onProductsChanged()

        setMessage(
          cleanupError
            ? `Producto guardado, pero no se pudieron eliminar las fotos reemplazadas: ${cleanupError.message}`
            : "Producto guardado.",
        )
      }
    } catch (saveError) {
      const detail =
        saveError instanceof Error ? saveError.message : String(saveError)

      const cleanup =
        !productSaved && uploadedImagePaths.length
          ? await supabase.storage

              .from(PRODUCT_IMAGE_BUCKET)

              .remove(uploadedImagePaths)
          : null

      setMessage(
        productSaved
          ? `Producto guardado, pero ocurrió un error al completar la limpieza: ${detail}`
          : cleanup?.error
            ? `No se pudo guardar el producto: ${detail}. También falló la limpieza de las imágenes cargadas: ${cleanup.error.message}`
            : `No se pudo guardar el producto: ${detail}`,
      )
    } finally {
      setSaving(false)
    }
  }

  const editProduct = (product: Product) => {
    setEditingId(product.id)

    setImageFiles([])

    setForm({
      name: product.name,

      description: product.description,

      category: product.category,

      price: product.price,

      stock: product.stock,

      image_urls: getProductImages(product),

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

    const imagesUsedElsewhere = new Set(
      products

        .filter((item) => item.id !== product.id)

        .flatMap(getProductImages),
    )

    const imagePaths = getProductImages(product)

      .filter((imageUrl) => !imagesUsedElsewhere.has(imageUrl))

      .map(getProductImageStoragePath)

      .filter((path): path is string => path !== null)

    const { error: cleanupError } = imagePaths.length
      ? await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(imagePaths)
      : { error: null }

    await onProductsChanged()

    if (editingId === product.id) resetForm()

    setMessage(
      cleanupError
        ? `Producto eliminado, pero no se pudieron borrar sus fotos: ${cleanupError.message}`
        : "Producto eliminado.",
    )
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
        {!galleryEnabled && (
          <p
            role="status"
            className="mb-5 border border-[#E4D8D0] bg-white p-3 text-sm text-[#78665E]"
          >
            La tienda sigue mostrando sus fotos actuales. Ejecuta{" "}
            <code>20261112000000_product_image_gallery.sql</code> en Supabase
            para habilitar galerías con varias fotos.
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
                <span className="mb-2 block">
                  Fotos del producto (opcional)
                </span>
                <label
                  onDragOver={(event) => {
                    event.preventDefault()

                    setDraggingImage(true)
                  }}
                  onDragLeave={() => setDraggingImage(false)}
                  onDrop={(event) => {
                    event.preventDefault()

                    setDraggingImage(false)

                    selectImages(event.dataTransfer.files)
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
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      selectImages(event.target.files ?? undefined)

                      event.target.value = ""
                    }}
                  />
                  <span className="text-2xl text-[#B8866A]" aria-hidden="true">
                    +
                  </span>
                  <span>
                    Arrastra imágenes aquí o haz clic para elegirlas
                    <span className="mt-1 block text-xs text-[#8A7570]">
                      Puedes seleccionar varias · JPG, PNG o WebP · máximo 5 MB
                      cada una
                    </span>
                  </span>
                </label>
                {(form.image_urls.length > 0 || imagePreviews.length > 0) && (
                  <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {form.image_urls.map((imageUrl, index) => (
                      <div key={imageUrl} className="relative aspect-square">
                        <img
                          src={imageUrl}
                          alt={`Foto ${index + 1} del producto`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,

                              image_urls: form.image_urls.filter(
                                (_, imageIndex) => imageIndex !== index,
                              ),
                            })
                          }
                          aria-label={`Quitar foto ${index + 1}`}
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-white/90 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {imagePreviews.map((imageUrl, index) => (
                      <div key={imageUrl} className="relative aspect-square">
                        <img
                          src={imageUrl}
                          alt={`Nueva foto ${index + 1} del producto`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setImageFiles((current) =>
                              current.filter(
                                (_, fileIndex) => fileIndex !== index,
                              ),
                            )
                          }
                          aria-label={`Quitar nueva foto ${index + 1}`}
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-white/90 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
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
                    {getProductImages(product)[0] && (
                      <img
                        src={getProductImages(product)[0]}
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

export default AdminPage
