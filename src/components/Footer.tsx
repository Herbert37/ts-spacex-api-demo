import { Github, Instagram, Linkedin, Orbit } from "lucide-react";
export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/[0.07]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 text-center sm:flex-row sm:text-left lg:px-8">
        <div>
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Orbit size={17} className="text-cyan-300" />
            <span className="text-xs font-semibold tracking-[.18em] text-slate-300">
              ORBIT / LABORATORIO DE DATOS
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            © 2024 Orbit Lab. Creado para medir el rendimiento.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            className="social"
            href="https://github.com/Herbert37"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          <a
            className="social"
            href="https://www.linkedin.com/in/herbert-ayala37"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin size={16} />
          </a>
          <a
            className="social"
            href="https://www.instagram.com/herbert37_/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <Instagram size={16} />
          </a>
        </div>
        <p className="text-xs text-slate-600">
          Diseñado y desarrollado por{" "}
          <span className="text-slate-400">Herbert Ayala</span>
        </p>
      </div>
    </footer>
  );
}
