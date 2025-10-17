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
    // Verificar se as imagens existem
    const checkImages = async () => {
      const statuses = await Promise.all(
        backgroundImages.map(async (src) => {
          try {
            const response = await fetch(src, { method: 'HEAD' });
            console.log(`Imagem ${src}: ${response.ok ? 'OK' : 'ERRO'} - Status: ${response.status}`);
            return response.ok;
          } catch (error) {
            console.log(`Erro ao carregar ${src}:`, error);
            return false;
          }
        })
      );
      setImageLoadStatus(statuses);
    };

    checkImages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 5000); // Muda a cada 5 segundos

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
      
      {/* Tentar carregar as imagens por cima */}
      {backgroundImages.map((image, index) => {
        const isLoaded = imageLoadStatus[index];
        return (
          <div
            key={`image-${index}`}
          className={`absolute inset-0 transition-opacity duration-3000 ease-in-out ${
            index === currentImageIndex && isLoaded ? 'opacity-90' : 'opacity-0'
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
              height: '100%'
            }}
          />
        );
      })}
      
      {/* Overlay escuro para melhorar a legibilidade */}
      <div 
        className="absolute inset-0 bg-black/20"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}
      />
      
    </div>
  );
};

export default AnimatedBackground;
