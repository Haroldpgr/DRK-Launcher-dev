import React, { useState } from 'react';
import { imageService } from '../services/imageService';

interface ServerInfo {
  id: string;
  name: string;
  ip: string;
  country?: string;
  category?: string;
  thumbnail?: string;
  requiredVersion?: string;
  modsHint?: string;
  favorite?: boolean;
  description?: string;
  website?: string;
  playerCount?: number;
  maxPlayers?: number;
  version?: string;
  online?: boolean;
}

interface ServerCardProps {
  server: ServerInfo;
  onCopyIP: (ip: string) => void;
  onVisitWebsite: (website: string) => void;
  onPing: (id: string, ip: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  status: { online: boolean; players: number; version: string } | null;
}

const ServerCard: React.FC<ServerCardProps> = ({
  server,
  onCopyIP,
  onVisitWebsite,
  onPing,
  onToggleFavorite,
  onDelete,
  status
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState(server.thumbnail || imageService.getPlaceholderImage(server.name));

  const handlePing = () => {
    setPingLoading(true);
    onPing(server.id, server.ip);
  };

  const handleCopyIP = () => {
    onCopyIP(server.ip);
  };

  // Determine status text based on ping result or default values
  const statusText = status
    ? status.online
      ? `Online • ${status.players} jugadores • ${status.version || server.requiredVersion || 'Versión Desconocida'}`
      : 'Offline'
    : server.online !== undefined
      ? server.online
        ? `Online • ${server.playerCount || 0}/${server.maxPlayers || '?'} jugadores • ${server.version || server.requiredVersion || 'Versión Desconocida'}`
        : 'Offline'
      : 'Haga ping para ver estado';

  // Determine status color based on online status
  const statusColor = status
    ? status.online
      ? 'text-green-400'
      : 'text-red-400'
    : server.online !== undefined
      ? server.online
        ? 'text-green-400'
        : 'text-red-400'
      : 'text-gray-400';

  const handleImageError = () => {
    // If image fails to load, use a fallback
    setImageSrc(imageService.getPlaceholderImage(server.name));
  };

  const handleDelete = () => {
    onDelete(server.id);
  };

  return (
    <div
      className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Server Image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={imageSrc}
          alt={server.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(server.id)}
          className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            server.favorite
              ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400'
              : 'bg-gray-900/70 text-gray-300 hover:bg-yellow-500 hover:text-yellow-900'
          }`}
          aria-label={server.favorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-red-600/80 text-white hover:bg-red-500"
          aria-label="Eliminar servidor"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Server Info */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white truncate max-w-[70%]" title={server.name}>
              {server.name}
            </h3>
            <p className="text-sm text-gray-300 font-mono bg-gray-900/50 px-2 py-1 rounded mt-1 inline-block">
              {server.ip}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mt-3 text-xs">
          <span className={`font-medium ${statusColor}`}>
            {statusText}
          </span>
        </div>

        {/* Description */}
        {server.description && (
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">
            {server.description}
          </p>
        )}

        {/* Category */}
        {server.category && (
          <span className="inline-block mt-2 px-2 py-1 text-xs bg-indigo-900/50 text-indigo-200 rounded-full">
            {server.category}
          </span>
        )}

        {/* Action Buttons - Only show when card is hovered or on mobile */}
        <div className={`mt-4 flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={handlePing}
            disabled={pingLoading}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
          >
            {pingLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ping...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ping
              </>
            )}
          </button>

          <button
            onClick={handleCopyIP}
            className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar IP
          </button>

          {server.website && (
            <button
              onClick={() => onVisitWebsite(server.website!)}
              className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Web
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerCard;