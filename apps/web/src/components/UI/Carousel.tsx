import { useEffect, useState } from "react";

interface Slide {
  backgroundClass: string;
  titulo: string;
  subtitulo: string;
  promo?: string;
}

interface CarouselProps {
  slides?: Slide[];
  height?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  overlayOpacity?: string;
}

const defaultSlides: Slide[] = [
  {
    backgroundClass: "carousel-bg-frutos",
    titulo: "SABOR ÚNICO.",
    subtitulo: "Lo mejor en vinos y licores",
    promo: "Hasta 50% OFF",
  },
  {
    backgroundClass: "carousel-bg-novedades",
    titulo: "Descubre nuestras novedades",
    subtitulo: "Nuevas experiencias en cada compra",
  },
];

export default function Carousel({
  slides = defaultSlides,
  height = "h-80 md:h-[400px]",
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  overlayOpacity = "bg-black/40",
}: CarouselProps) {
  const [index, setIndex] = useState(0);

  const siguiente = () => setIndex((prev) => (prev + 1) % slides.length);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(siguiente, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval]);

  return (
    <div className={`relative w-screen ${height} overflow-hidden group`}>
      {/* slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ease-in-out group-hover:scale-105 group-hover:brightness-110 ${i === index ? "opacity-100" : "opacity-0"
            } ${slide.backgroundClass}`}
        />
      ))}

      {/* overlay sutil */}
      <div className={`absolute inset-0 ${overlayOpacity} transition-all duration-500 ease-in-out group-hover:bg-black/10`} />

      {/* textos centrados minimalistas */}
      <div className="relative z-20 flex items-center justify-center h-full px-4">
        <div className="text-center text-white max-w-4xl mx-auto transition-all duration-500 ease-in-out group-hover:-translate-y-2">
          <h3 className="text-xl sm:text-3xl md:text-5xl font-light mb-2">
            {slides[index].subtitulo}
          </h3>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold mb-4">
            {slides[index].titulo}
          </h1>
          {slides[index].promo && (
            <p className="text-lg sm:text-2xl md:text-4xl font-medium">
              {slides[index].promo}
            </p>
          )}
        </div>
      </div>

      {/* dots navegación minimalistas */}
      {showDots && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30 transition-all duration-300 ease-in-out group-hover:bottom-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ease-in-out focus:outline-none hover:scale-125 hover:shadow-lg ${index === i
                ? "bg-white shadow-lg"
                : "bg-white/50 hover:bg-white/75"
                }`}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
