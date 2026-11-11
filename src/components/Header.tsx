import { Menu, Radio, Rocket, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export function Header({ activeView, onNavigate }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const items = ["Resumen", "Explorador REST", "Explorador GraphQL"];
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#070b14]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <button
          className="flex items-center gap-3"
          onClick={() => onNavigate("Overview")}
          aria-label="Ir al inicio"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,.28)]">
            <Rocket size={21} strokeWidth={2.5} />
          </span>
          <span className="text-left">
            <strong className="block text-sm tracking-[.2em] text-white">
              ORBIT
            </strong>
            <small className="block text-[10px] tracking-[.18em] text-slate-500">
              SPACE DATA LAB
            </small>
          </span>
        </button>
        <nav
          className={`${open ? "absolute left-0 right-0 top-[73px] flex border-b border-white/[0.07] bg-[#0b111e] p-4" : "hidden"} flex-col gap-2 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`}
        >
          {items.map((item) => (
            <button
              key={item}
              onClick={() => {
                onNavigate(item);
                setOpen(false);
              }}
              className={`rounded-lg px-4 py-2 text-left text-sm transition ${activeView === item ? "bg-white/10 text-cyan-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <span className="status-dot" /> APIs conectadas
          </div>
          <button
            className="rounded-lg p-2 text-slate-400 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Abrir menú"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/5 p-2 text-cyan-300 sm:block">
            <Radio size={16} />
          </div>
        </div>
      </div>
    </header>
  );
}
