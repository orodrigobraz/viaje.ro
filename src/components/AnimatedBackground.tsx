import { useState, useEffect } from 'react';

const AnimatedBackground = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadStatus, setImageLoadStatus] = useState<boolean[]>([]);
  
  // Array com as imagens dos mapas
  // IMPORTANTE: Adicione suas imagens na pasta public/ com estes nomes exatos
  const backgroundImages = [
    '/viaje.ro/mapa-rio-grande-sul.png',      // Imagem do Rio Grande do Sul
    '/viaje.ro/mapa-sao-paulo.png',           // Imagem de São Paulo  
    '/viaje.ro/mapa-minas-gerais.png',        // Imagem de Minas Gerais
    '/viaje.ro/mapa-rio-de-janeiro.png',      // Imagem de Rio de Janeiro
    '/viaje.ro/mapa-bahia.png',               // Imagem de Bahia
    '/viaje.ro/mapa-rio-grande-norte.png',    // Imagem de Rio Grande do Norte
    '/viaje.ro/mapa-acre.png',                // Imagem de Acre
    '/viaje.ro/mapa-goias.png',               // Imagem de Goiás
  ];


  useEffect(() => {
    // Pre-carregar todas as imagens para transições suaves
    const preloadImages = async () => {
      const statuses = await Promise.all(
        backgroundImages.map(async (src) => {
          try {
            // Pre-carregar a imagem
            const img = new Image();
            const loadPromise = new Promise<boolean>((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = src;
            });
            
            const isLoaded = await loadPromise;
            console.log(`Imagem ${src}: ${isLoaded ? 'Carregada' : 'Erro'}`);
            return isLoaded;
          } catch (error) {
            console.log(`Erro ao carregar ${src}:`, error);
            return false;
          }
        })
      );
      setImageLoadStatus(statuses);
    };

    preloadImages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 15000); // Muda a cada 15 segundos

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <div 
      className="fixed inset-0 w-full h-full"
      style={{ 
        zIndex: -1,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      
      {/* Imagens com transição suave */}
      {backgroundImages.map((image, index) => {
        const isLoaded = imageLoadStatus[index];
        const isActive = index === currentImageIndex && isLoaded;
        
        return (
          <div
            key={`image-${index}`}
            className={`absolute inset-0 transition-all duration-[4000ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isActive ? 'opacity-90 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{
              backgroundImage: isLoaded ? `url(${image})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              transform: isActive ? 'scale(1)' : 'scale(1.05)',
              filter: isActive ? 'blur(0px)' : 'blur(1px)',
              transition: 'opacity 4s cubic-bezier(0.4, 0, 0.2, 1), transform 4s cubic-bezier(0.4, 0, 0.2, 1), filter 4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        );
      })}
      
      {/* Overlay com gradiente suave para melhorar a legibilidade */}
      <div 
        className="absolute inset-0"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.15) 100%)'
        }}
      />
      
    </div>
  );
};

export default AnimatedBackground;
