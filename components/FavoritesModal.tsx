import React, { useEffect, useMemo } from 'react';
import { useFavorites, useDashboard } from '../App';
import type { ToolLink, ToolGroup, TileConfig } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoriteTile: React.FC<{
  config: TileConfig;
  data: { link: ToolLink; group: ToolGroup };
  onRemove: (url: string) => void;
}> = ({ config, data, onRemove }) => {
    
    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            e.preventDefault();
            return;
        }
        window.open(data.link.url, '_blank', 'noopener,noreferrer');
    }

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(data.link.url);
    }
    
    return (
      <div className={`tile-wrapper size-${config.size} group`}>
          <div
            className={`tile size-${config.size}`}
            style={{ backgroundColor: data.group.color || '#f97316' }}
            onClick={handleClick}
          >
            <i className="material-icons tile-icon">{data.group.icon}</i>
            <div>
              <span className="tile-group-label">{data.group.title}</span>
              <span className="tile-label">{data.link.name}</span>
            </div>
             <button
              onClick={handleRemoveClick}
              className="absolute top-1.5 right-1.5 p-1.5 rounded-full text-white/70 bg-black/30 hover:bg-red-500 hover:text-white transition-[color,background-color,opacity,transform] duration-150 ease-in-out scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 focus:scale-100 focus:opacity-100"
              aria-label="Favorit entfernen"
            >
              <i className="material-icons text-base leading-none">close</i>
            </button>
          </div>
      </div>
    );
};


export const FavoritesModal: React.FC<FavoritesModalProps> = ({ isOpen, onClose }) => {
  const { favorites, removeFavorite } = useFavorites();
  const { toolGroups } = useDashboard();
  
  const allLinksMap = useMemo(() => {
    const map = new Map<string, { link: ToolLink; group: ToolGroup }>();
    for (const group of toolGroups) {
      for (const link of group.links) {
        map.set(link.url, { link, group });
      }
    }
    return map;
  }, [toolGroups]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-neutral-800 rounded-2xl shadow-2xl w-auto max-h-[80vh] flex flex-col border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
              <div className="flex items-center">
                 <i className="material-icons text-2xl text-orange-400 mr-3">star</i>
                 <h2 className="text-xl font-bold text-neutral-100">Ihre Favoriten</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                aria-label="Schließen"
              >
                <i className="material-icons">close</i>
              </button>
            </header>

            <div className="p-6 overflow-y-auto custom-scrollbar text-center">
              {favorites.length > 0 ? (
                 <div className="tile-grid" style={{ display: 'inline-grid', maxWidth: '760px' }}>
                    {favorites.map((fav) => {
                      const data = allLinksMap.get(fav.url);
                      const config = { id: fav.url, size: '1x1' as const };

                      if (!data) {
                        // Render a fallback tile for orphaned favorites that might still exist
                        return (
                           <div key={fav.url} className="tile-wrapper size-1x1">
                             <div className="tile size-1x1 group relative" style={{ backgroundColor: '#3f3f46' /* neutral-700 */ }}>
                                <i className="material-icons tile-icon">link_off</i>
                                <div>
                                    <span className="tile-group-label">Verwaister Favorit</span>
                                    <span className="tile-label break-all" title={fav.name}>{fav.name}</span>
                                </div>
                                <button
                                    onClick={() => removeFavorite(fav.url)}
                                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full text-white/70 bg-black/30 hover:bg-red-500 hover:text-white transition-all scale-90 opacity-100"
                                    aria-label="Verwaisten Favorit entfernen"
                                >
                                    <i className="material-icons text-base leading-none">close</i>
                                </button>
                             </div>
                           </div>
                        );
                      }
                      
                      return (
                          <FavoriteTile
                              key={fav.url}
                              config={config}
                              data={data}
                              onRemove={removeFavorite}
                          />
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 text-neutral-500">
                  <i className="material-icons text-5xl mb-3">star_outline</i>
                  <h3 className="text-lg font-semibold">Noch keine Favoriten</h3>
                  <p>Klicken Sie mit der rechten Maustaste auf eine Kachel im Dashboard, um sie zu Ihren Favoriten hinzuzufügen.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};