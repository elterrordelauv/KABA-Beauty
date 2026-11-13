import logoKaba from "../logoKABA.png"

export default function Header({
  cartCount,

  onOpenCart,
}: {
  cartCount: number

  onOpenCart: () => void
}) {
  return (
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
          onClick={onOpenCart}
          className="border border-[#B8866A] px-4 py-2 text-sm transition-colors hover:bg-[#B8866A] hover:text-white"
          aria-label={`Ver carrito, ${cartCount} productos`}
        >
          Mi pedido ({cartCount})
        </button>
      </div>
    </header>
  )
}
