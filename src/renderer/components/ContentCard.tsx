import React from 'react';

interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  author: string;
  downloads: number;
  lastUpdated: string;
  imageUrl: string;
  type: string;
  onDownload: () => void;  // Cambiado para que no necesite el ID, ya que se lo pasamos en el binding
  onDetails: (id: string) => void;
  isDownloading?: boolean;
  downloadProgress?: number;
  platform: 'modrinth' | 'curseforge';
}

const ContentCard: React.FC<ContentCardProps> = ({
  id,
  title,
  description,
  author,
  downloads,
  lastUpdated,
  imageUrl,
  type,
  onDownload,
  onDetails,
  isDownloading = false,
  downloadProgress = 0,
  platform
}) => {
  const formatDownloads = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className="bg-gray-700/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-600 hover:bg-gray-700/70 transition-all duration-300 cursor-pointer group"
      onClick={() => onDetails(id)}
    >
      {/* Card Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1pbmVjcmFmdDwvdGV4dD48L3N2Zz4=';
          }}
        />
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {platform === 'modrinth' ? 'Modrinth' : 'CurseForge'}
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {type}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <h3 className="font-medium text-white text-lg mb-2 line-clamp-2 h-12">{title}</h3>
        <p className="text-sm text-gray-400 mb-3 line-clamp-3 h-12">{description}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>por {author}</span>
          <span>{formatDate(lastUpdated)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{formatDownloads(downloads)} descargas</span>
        </div>

        {/* Download Progress */}
        {isDownloading && (
          <div className="mb-3">
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">
              {Math.round(downloadProgress)}%
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2" data-tutorial="content-actions">
          <button
            data-tutorial="content-details-btn"
            onClick={(e) => {
              e.stopPropagation(); // Prevenir que el click en el botón dispare el click en toda la tarjeta
              onDetails(id);
            }}
            className="flex-1 py-2 px-3 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Detalles
          </button>
          <button
            data-tutorial="content-download-btn"
            onClick={(e) => {
              e.stopPropagation(); // Prevenir que el click en el botón dispare el click en toda la tarjeta
              onDownload();
            }}
            disabled={isDownloading}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDownloading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
            }`}
          >
            {isDownloading ? 'Descargando...' : 'Descargar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;