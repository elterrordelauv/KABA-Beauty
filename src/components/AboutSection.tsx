export default function AboutSection() {
  return (
    <section
      id="nosotros"
      className="relative scroll-mt-24 overflow-hidden bg-[#F1E4DC]"
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
            Te esperamos para descubrir tus favoritos de belleza. Encuentra aquí
            nuestra ubicación, horarios y redes sociales.
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
  )
}
