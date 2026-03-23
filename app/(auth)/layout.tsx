import Link from 'next/link'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-terreo-800">
        <div className="absolute right-0 top-0 h-3.5 w-3.5 rounded-bl-lg bg-terreo-400 opacity-70" />
        <span className="relative text-[10px] font-black tracking-tighter text-white">TS</span>
      </div>
      <span className="text-[17px] font-bold tracking-tight text-stone-900">
        Térreo<span className="text-terreo-700">Solar</span>
      </span>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="px-6 py-5">
        <Link href="/"><Logo /></Link>
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        {children}
      </div>
      <footer className="py-4 text-center text-xs text-stone-400">
        © 2025 TérreoSolar
      </footer>
    </div>
  )
}
