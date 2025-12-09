import { useEffect, useState } from "react";
import izq from "../../assets/Carousel/arrowizq.svg";
import der from "../../assets/Carousel/arrowder.svg";

interface Slide {
  backgroundClass: string;
  titulo: string;
  subtitulo: string;
  promo: string;
}

const slidesData: Slide[] = [
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
    promo: "",
  },
];

export default function Carousel() {
  const [index, setIndex] = useState(0);

  const siguiente = () => setIndex((prev) => (prev + 1) % slidesData.length);
  const anterior = () =>
    setIndex((prev) => (prev - 1 + slidesData.length) % slidesData.length);

  useEffect(() => {
    const interval = setInterval(siguiente, 5000);
    return () => clearInterval(interval);
  }, []);

  const slide = slidesData[index];

  return (
    <div
      className={`relative w-[95%] md:w-[90%] min-h-[30vh] md:min-h-[35vh] mt-4 rounded-xl flex
        bg-cover bg-center transition-all duration-500 overflow-visible ${slide.backgroundClass}`}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 rounded-xl" />

      {/* textos */}
      <div className="relative text-white z-20 pl-10 sm:pl-8 md:pl-[5%] pt-3 sm:pt-5 md:pt-[2%]">
        <h3 className="text-lg sm:text-2xl md:text-4xl font-semibold">{slide.subtitulo}</h3>
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold">{slide.titulo}</h1>
        {slide.promo && (
          <p className="text-lg sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">{slide.promo}</p>
        )}
      </div>

      {/* botones */}
      <div className="absolute top-1/2 left-0 right-0 flex justify-between -translate-y-1/2 z-30 pointer-events-none">
        {/* botón izq */}
        <button
          onClick={anterior}
          className="pointer-events-auto flex justify-center items-center bg-primary
            w-[10vw] h-[10vw] min-w-10 min-h-10 max-w-[60px] max-h-[60px]
            rounded-full p-1.5 transition hover:bg-black/50 shadow-lg -translate-x-1/3"
        >
          <div className="w-full h-full flex justify-center items-center rounded-full bg-white">
            <img src={izq.src} alt="Flecha izquierda" className="w-1/2 h-1/2 object-contain" />
          </div>
        </button>

        {/* botón der */}
        <button
          onClick={siguiente}
          className="pointer-events-auto flex  bg-primary
            w-[10vw] h-[10vw] min-w-10 min-h-10 max-w-[60px] max-h-[60px]
            rounded-full p-1.5 transition hover:bg-black/50 shadow-lg translate-x-1/3"
        >
          <div className="w-full h-full flex justify-center items-center rounded-full bg-white">
            <img src={der.src} alt="Flecha derecha" className="w-1/2 h-1/2 object-contain" />
          </div>
        </button>
      </div>
    </div>
  );
}
