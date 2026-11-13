import logoKaba from "../logoKABA.png"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F1E4DC]">
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-12 md:gap-8 md:px-10 md:py-14 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm uppercase tracking-[0.25em] text-[#8A675A]">
            Tu belleza, a tu manera
          </p>
          <h1 className="font-serif text-5xl leading-[1.08] sm:text-6xl md:text-7xl lg:text-[5.25rem]">
            Pequeños rituales,
            <br />
            <i>gran belleza.</i>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#6D5A53]">
            Descubre maquillaje, cuidado facial, productos capilares y
            accesorios seleccionados para ti.
          </p>
          <a
            href="#catalogo"
            className="mt-8 inline-block bg-[#2C2320] px-8 py-4 text-sm uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-80"
          >
            Explorar productos
          </a>
        </div>
        <div className="mx-auto flex h-72 w-full max-w-xl items-center justify-center sm:h-96 lg:h-[27rem]">
          <img
            src={logoKaba}
            alt="KABA Beauty"
            className="h-64 w-64 object-cover opacity-90 sm:h-72 sm:w-72 md:h-[22rem] md:w-[22rem] lg:h-[27rem] lg:w-[27rem] xl:h-[30rem] xl:w-[30rem]"
          />
        </div>
      </div>
    </section>
  )
}
