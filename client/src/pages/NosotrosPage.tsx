import { Link } from "react-router-dom";
import { ArrowLeft, Code2, ShoppingBag } from "lucide-react";
import { useGoBack } from "../hooks";

export function NosotrosPage() {
  const goBack = useGoBack("/");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <ShoppingBag className="h-12 w-12 text-accent mb-6" />

      <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
        No hay "Nosotros"
      </h1>

      <p className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed mb-4">
        Esta no es una tienda real. Es un{" "}
        <span className="text-accent font-semibold">challenge</span>, así que no
        existe un equipo detrás, ni una historia de marca, ni oficinas en Puerto
        Madero con vista al Puente de la Mujer.
      </p>

      <p className="text-muted-foreground text-base max-w-md leading-relaxed mb-10">
        Solo hay código, componentes React, una API REST e ingentes y tal vez
        insalubres cantidades de mate
      </p>

      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-2xl px-5 py-3 mb-10">
        <div className="flex flex-col">
          <span>
            Construido por{" "}
            <a
              href="https://github.com/pablodcalvijo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent font-semibold"
            >
              Pablo D. Calvijo
            </a>
          </span>
          <span className="text-xs">
            (Créditos parciales a V0, Copilot y Claude-Sonnet 4.6).
          </span>
        </div>
      </div>

      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la tienda
      </button>
    </div>
  );
}
