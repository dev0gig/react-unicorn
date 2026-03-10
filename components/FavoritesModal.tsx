import React, { useEffect, useMemo } from 'react';
import { useFavorites, useDashboard } from '../App';
import type { ToolLink, ToolGroup } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FavoriteListItem: React.FC<{
  data: { link: ToolLink; group: ToolGroup };
  onRemove: (url: string) => void;
}> = ({ data, onRemove }) => {

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
    <div
      className="group relative flex items-center justify-center min-h-[3rem] py-2 px-3 rounded-lg cursor-pointer bg-neutral-800/60 border border-neutral-700 hover:bg-neutral-700 hover:border-orange-500/50 transition-all duration-200"
      onClick={handleClick}
    >
      <i className="material-icons text-yellow-400 text-sm mr-1.5">star</i>
      <span className="font-medium text-neutral-200 text-center text-sm leading-tight truncate">{data.link.name}</span>
      <button
        onClick={handleRemoveClick}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-neutral-400 bg-neutral-700 border border-neutral-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Favorit entfernen"
      >
        <i className="material-icons" style={{ fontSize: '12px' }}>close</i>
      </button>
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
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-neutral-800 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col border border-neutral-700"
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

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {favorites.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {favorites.map((fav) => {
                    const data = allLinksMap.get(fav.url);

                    if (!data) {
                      return (
                        <div
                          key={fav.url}
                          className="group relative flex items-center justify-center min-h-[3rem] py-2 px-3 rounded-lg bg-neutral-800/60 border border-neutral-700"
                        >
                          <i className="material-icons text-neutral-500 text-sm mr-1.5">link_off</i>
                          <span className="font-medium text-neutral-400 text-center text-sm leading-tight truncate">{fav.name}</span>
                          <button
                            onClick={() => removeFavorite(fav.url)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-neutral-400 bg-neutral-700 border border-neutral-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                            aria-label="Verwaisten Favorit entfernen"
                          >
                            <i className="material-icons" style={{ fontSize: '12px' }}>close</i>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <FavoriteListItem
                        key={fav.url}
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