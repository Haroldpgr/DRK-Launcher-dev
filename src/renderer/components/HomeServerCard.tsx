import React from 'react';
import Button from './Button';
import { imageService } from '../services/imageService';

interface HomeServerCardProps {
  id: string;
  name: string;
  ip: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  onConnect: (ip: string) => void;
}

const HomeServerCard: React.FC<HomeServerCardProps> = ({
  name,
  ip,
  description,
  thumbnail,
  category,
  onConnect
}) => {
  const [imageSrc, setImageSrc] = React.useState(thumbnail || imageService.getPlaceholderImage(name));

  const handleImageError = () => {
    setImageSrc(imageService.getPlaceholderImage(name));
  };

  return (
    <div className="rounded-xl overflow-hidden bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 transition-transform hover:scale-[1.02]">
      <img
        src={imageSrc}
        alt={name}
        className="w-full h-32 object-cover"
        loading="lazy"
        onError={handleImageError}
      />
      <div className="p-3">
        <div className="font-medium mb-1 text-gray-100">{name}</div>
        <div className="text-sm text-gray-400 mb-2">{description || 'Servidor de Minecraft multijugador'}</div>
        {category && (
          <div className="text-xs text-indigo-300 mb-2">{category}</div>
        )}
        <div className="text-xs font-mono bg-gray-900/50 px-2 py-1 rounded mb-2 inline-block">
          {ip}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => onConnect(ip)}
          >
            Conectar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeServerCard;