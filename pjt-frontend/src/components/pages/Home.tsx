import { AuthPanel } from "@/components/custom/AuthPanel";
import { useState, useEffect } from "react";

const carouselItems = [
  {
    title: "Este é um produto",
    subtitle: "MangaLab",
    description:
      "Desenvolvemos soluções tecnológicas inovadoras para transformar seu negócio",
  },
  {
    title: "Inovação e",
    subtitle: "Tecnologia",
    description:
      "Criamos sistemas modernos e eficientes para impulsionar o crescimento da sua empresa",
  },
  {
    title: "Experiência e",
    subtitle: "Qualidade",
    description:
      "Nossa equipe especializada entrega soluções robustas e confiáveis para seu sucesso",
  },
];

function MobileCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
        setIsAnimating(false);
      }, 150);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentItem = carouselItems[currentIndex];

  return (
    <div className="space-y-3">
      <div className="min-h-[80px] flex flex-col justify-center">
        <div
          className={`transition-all duration-300 transform ${
            isAnimating
              ? "opacity-0 translate-y-1"
              : "opacity-100 translate-y-0"
          }`}
        >
          <h2 className="text-lg font-bold text-[#D4AF37]">
            {currentItem.subtitle}
          </h2>
          <p className="text-white/70 text-xs mt-1 max-w-xs mx-auto">
            {currentItem.description}
          </p>
        </div>
      </div>
      <div className="flex justify-center space-x-1">
        {carouselItems.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-[#D4AF37]" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function CarouselSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
        setIsAnimating(false);
      }, 150);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index: number) => {
    if (index !== currentIndex) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsAnimating(false);
      }, 150);
    }
  };

  const currentItem = carouselItems[currentIndex];

  return (
    <div className="space-y-4">
      <div className="min-h-[200px] flex flex-col justify-center">
        <div
          className={`transition-all duration-300 transform ${
            isAnimating
              ? "opacity-0 translate-y-2"
              : "opacity-100 translate-y-0"
          }`}
        >
          <h1 className="text-3xl font-bold text-white">{currentItem.title}</h1>
          <h2 className="text-4xl font-bold text-[#D4AF37]">
            {currentItem.subtitle}
          </h2>
          <p className="text-white/70 text-lg max-w-md mx-auto leading-relaxed mt-4">
            {currentItem.description}
          </p>
        </div>
      </div>

      <div className="flex justify-center space-x-2 mt-8">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-[#D4AF37] scale-125"
                : "bg-white/30 hover:bg-white/50 hover:scale-110"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <div className="hidden md:flex h-screen w-screen">
        <div className="w-1/2 bg-[#1A1A1A] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-8">
            <div className="w-48 h-48 mx-auto rounded-lg flex items-center justify-center">
              <div className="text-white/50 text-sm text-center">
                <div className="text-lg mb-2">
                  <a href="https://www.mangalab.io/" target="#">
                    <img src="/logo-removebg-preview.png" alt="MangaLab Logo" />
                  </a>
                </div>
              </div>
            </div>
            <CarouselSection />
          </div>
        </div>
        <div className="w-1/2 bg-[#F5F5F0]">
          <AuthPanel />
        </div>
      </div>

      <div className="md:hidden min-h-screen bg-[#F5F5F0] flex flex-col">
        <div className="bg-[#1A1A1A] px-6 py-8 text-center">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <img
              src="/logo-removebg-preview.png"
              alt="MangaLab Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <MobileCarousel />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <AuthPanel />
        </div>
      </div>
    </>
  );
}
