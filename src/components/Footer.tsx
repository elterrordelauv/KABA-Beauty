export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-[#8A7570] md:flex-row md:px-10">
      <span>© {new Date().getFullYear()} KABA Beauty</span>
    </footer>
  )
}
