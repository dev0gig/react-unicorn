import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { useFavorites, useDashboard } from '../../App';
import { ToolLink, ToolGroup, TileConfig } from '../../types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardProps {
  onAddLink: (link: null, groupTitle?: string) => void;
  onEditTile: (data: { link: ToolLink; group: ToolGroup }) => void;
  onOpenHelp: () => void;
}

const TileContextMenu: React.FC<{
  x: number;
  y: number;
  tileId: string;
  groupTitle: string;
  isFav: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddLink: (link: null, groupTitle: string) => void;
  onDeleteLink: (groupTitle: string, url: string) => void;
}> = (props) => {
  const { x, y, tileId, groupTitle, isFav, onClose, onEdit, onToggleFavorite, onAddLink, onDeleteLink } = props;
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: y,
    left: x,
    visibility: 'hidden',
  });

  useLayoutEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newLeft = x;
      let newTop = y;

      // Adjust horizontally if it overflows the right edge
      if (x + menuRect.width > viewportWidth) {
        newLeft = x - menuRect.width;
      }

      // Adjust vertically if it overflows the bottom edge
      if (y + menuRect.height > viewportHeight) {
        newTop = y - menuRect.height;
      }

      // Ensure it doesn't go off-screen on the top or left after adjustment
      if (newLeft < 5) newLeft = 5;
      if (newTop < 5) newTop = 5;

      setStyle(prev => ({ ...prev, top: newTop, left: newLeft, visibility: 'visible' }));
    }
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
        if(e.key === 'Escape') onClose();
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('contextmenu', handleClickOutside, true);
    window.addEventListener('keydown', handleEscape);
    return () => {
        window.removeEventListener('click', handleClickOutside);
        window.removeEventListener('contextmenu', handleClickOutside, true);
        window.removeEventListener('keydown', handleEscape);
    }
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={style}
      className="fixed bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl p-2 z-50 text-sm animate-fade-in-fast flex flex-col gap-1 w-48"
      onClick={(e) => e.stopPropagation()}
    >
        <button
          onClick={() => { onToggleFavorite(tileId); onClose(); }}
          className="w-full text-left text-neutral-200 px-2 py-1.5 rounded-md hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2"
        >
          <i className="material-icons text-base text-yellow-400">{isFav ? 'star' : 'star_outline'}</i>
          <span>{isFav ? 'Von Favoriten entfernen' : 'Zu Favoriten'}</span>
        </button>
       <button
          onClick={() => { onEdit(tileId); onClose(); }}
          className="w-full text-left text-neutral-200 px-2 py-1.5 rounded-md hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2"
        >
          <i className="material-icons text-base">edit</i>
          <span>Bearbeiten</span>
        </button>
        <button
          onClick={() => { onDeleteLink(groupTitle, tileId); onClose(); }}
          className="w-full text-left text-neutral-200 px-2 py-1.5 rounded-md hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
        >
          <i className="material-icons text-base">delete</i>
          <span>Löschen</span>
        </button>
        <button
          onClick={() => { onAddLink(null, groupTitle); onClose(); }}
          className="w-full text-left text-neutral-200 px-2 py-1.5 rounded-md hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-2"
        >
          <i className="material-icons text-base">add</i>
          <span>Link hinzufügen</span>
        </button>
    </div>,
    document.body
  );
};

const Tile: React.FC<{
  config: TileConfig;
  data: { link: ToolLink; group: ToolGroup };
  isFavorite: boolean;
  isOverlay?: boolean;
  onContextMenu: (e: React.MouseEvent, tileId: string, groupTitle: string) => void;
}> = ({ config, data, isFavorite, isOverlay, onContextMenu }) => {
    
    const handleClick = (e: React.MouseEvent) => {
        if (e.defaultPrevented) return; // to prevent click on drag
        e.preventDefault();
        window.open(data.link.url, '_blank', 'noopener,noreferrer');
    }
    
    return (
      <div
        className={`tile size-${config.size}`}
        style={{ backgroundColor: data.group.color || '#f97316' }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, config.id, data.group.title)}
      >
        <i className="material-icons tile-icon">{data.group.icon}</i>
        <div>
          <span className="tile-group-label">{data.group.title}</span>
          <span className="tile-label">{data.link.name}</span>
        </div>
        {isFavorite && <i className="material-icons tile-favorite-star">grade</i>}
      </div>
    );
};

const SortableTile: React.FC<{
  config: TileConfig;
  data: { link: ToolLink; group: ToolGroup };
  isFavorite: boolean;
  onContextMenu: (e: React.MouseEvent, tileId: string, groupTitle: string) => void;
}> = ({ config, data, isFavorite, onContextMenu }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id, data: { type: 'tile', config, data } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`tile-wrapper size-${config.size} touch-none transition-opacity duration-300 ${isDragging ? 'opacity-30' : ''}`}
    >
        <Tile config={config} data={data} isFavorite={isFavorite} onContextMenu={onContextMenu} />
    </div>
  );
};


export const Dashboard: React.FC<DashboardProps> = ({ onAddLink, onEditTile, onOpenHelp }) => {
  const { toolGroups, tileConfigs, deleteLink, reorderLinks } = useDashboard();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const [activeItem, setActiveItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; tileId: string; groupTitle: string; isFav: boolean;} | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const groupRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const activeIntersections = useRef(new Map<string, IntersectionObserverEntry>());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rootElement = scrollContainerRef.current;
    if (!rootElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Update the map of currently intersecting elements
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeIntersections.current.set(entry.target.id, entry);
          } else {
            activeIntersections.current.delete(entry.target.id);
          }
        }

        const visibleGroups = Array.from(activeIntersections.current.values());
        
        if (visibleGroups.length > 0) {
          // Sort by top position to find the one closest to the top of the viewport
          visibleGroups.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          const topGroupId = visibleGroups[0].target.id;
          setActiveGroup(topGroupId);
        }
      },
      {
        root: rootElement,
        // This margin creates an observation zone in the top quarter of the container.
        rootMargin: '0px 0px -75% 0px', 
        threshold: 0,
      }
    );

    const currentRefs = groupRefs.current;
    currentRefs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      activeIntersections.current.clear();
      currentRefs.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [toolGroups]);


  const allLinksMap = useMemo(() => {
    const map = new Map<string, { link: ToolLink; group: ToolGroup }>();
    for (const group of toolGroups) {
      for (const link of group.links) {
        map.set(link.url, { link, group });
      }
    }
    return map;
  }, [toolGroups]);

  const isSearchActive = searchTerm.trim().length > 0;
  
  const matchingTileIds = useMemo(() => {
    if (!isSearchActive) return new Set<string>();
    
    const lowercasedFilter = searchTerm.toLowerCase().trim();
    const ids = new Set<string>();
    
    for (const [url, { link, group }] of allLinksMap.entries()) {
      if (
        link.name.toLowerCase().includes(lowercasedFilter) ||
        group.title.toLowerCase().includes(lowercasedFilter)
      ) {
        ids.add(url);
      }
    }
    return ids;
  }, [searchTerm, allLinksMap, isSearchActive]);
  
  const filteredToolGroups = useMemo(() => {
    if (!isSearchActive) {
      return toolGroups;
    }
    return toolGroups
      .map(group => {
        const filteredLinks = group.links.filter(link => matchingTileIds.has(link.url));
        return { ...group, links: filteredLinks };
      })
      .filter(group => group.links.length > 0);
  }, [toolGroups, isSearchActive, matchingTileIds]);


  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { type, config, data } = active.data.current || {};
    
    document.body.style.cursor = 'grabbing';
    if (type === 'tile' && config && data) {
      setActiveItem({config, data});
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.style.cursor = '';
    setActiveItem(null);

    const { active, over } = event;
    if (!over || !active.data.current || !over.data.current || active.id === over.id) return;

    const activeGroupTitle = active.data.current?.data?.group?.title;
    const overGroupTitle = over.data.current?.data?.group?.title;
    
    // Handle reordering within the same group
    if (activeGroupTitle && activeGroupTitle === overGroupTitle) {
      const group = toolGroups.find(g => g.title === activeGroupTitle);
      if (group) {
        const oldIndex = group.links.findIndex(l => l.url === active.id);
        const newIndex = group.links.findIndex(l => l.url === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(group.links, oldIndex, newIndex);
          reorderLinks(activeGroupTitle, reordered);
        }
      }
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent, tileId: string, groupTitle: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tileId, groupTitle, isFav: isFavorite(tileId) });
  };
  
  const handleEditTileRequest = (tileId: string) => {
    const data = allLinksMap.get(tileId);
    if (data) {
        onEditTile(data);
    }
    setContextMenu(null); // Close context menu after initiating edit
  };

  const handleToggleFavorite = (tileId: string) => {
    const data = allLinksMap.get(tileId);
    if (!data) return;
    if (isFavorite(tileId)) {
        removeFavorite(tileId);
    } else {
        addFavorite(data.link);
    }
    setContextMenu(null);
  }
  
  const handleAddLinkFromContextMenu = (groupTitle: string) => {
      onAddLink(null, groupTitle);
      setContextMenu(null);
  }

  const handleDeleteLinkFromContextMenu = (groupTitle: string, url: string) => {
    deleteLink(groupTitle, url);
    setContextMenu(null);
  }

  const handleGroupNavClick = (groupId: string) => {
    groupRefs.current.get(groupId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderDragOverlay = () => {
      if (!activeItem || activeItem.config?.id === undefined) return null;
      const isFav = isFavorite(activeItem.config.id);
      return <Tile config={activeItem.config} data={activeItem.data} isFavorite={isFav} isOverlay={true} onContextMenu={() => {}} />;
  }

  const renderContent = () => {
    if (toolGroups.flatMap(g => g.links).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-neutral-600 p-8">
          <i className="material-icons text-7xl mb-4">apps</i>
          <h3 className="text-xl font-semibold">Keine Links für Kachelansicht</h3>
          <p className="text-neutral-500 text-center">Fügen Sie Gruppen und Links hinzu, um sie hier zu sehen.</p>
        </div>
      );
    }
    
    const groupsToRender = isSearchActive ? filteredToolGroups : toolGroups;

    if (isSearchActive && groupsToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-neutral-600 p-8">
          <i className="material-icons text-7xl mb-4">search_off</i>
          <h3 className="text-xl font-semibold">Keine Kacheln gefunden</h3>
          <p className="text-neutral-500 text-center">Probieren Sie einen anderen Suchbegriff aus.</p>
        </div>
      );
    }

    return (
       <div className="space-y-10">
            {groupsToRender.map(group => {
                if (group.links.length === 0) return null;

                const groupTileConfigs = group.links.map(link => 
                    tileConfigs.find(c => c.id === link.url)
                ).filter((c): c is TileConfig => !!c);

                return (
                    <section 
                        key={group.title} 
                        id={group.title}
                        ref={(el) => {
                            if (el) {
                                groupRefs.current.set(group.title, el);
                            } else {
                                groupRefs.current.delete(group.title);
                            }
                        }}
                        aria-labelledby={`group-header-${group.title}`} 
                        className="scroll-mt-4"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <i className="material-icons text-2xl text-neutral-100">{group.icon}</i>
                            <h2 id={`group-header-${group.title}`} className="text-2xl font-bold text-neutral-200">{group.title}</h2>
                            <span className="text-sm font-medium bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-full">{group.links.length}</span>
                        </div>
                        <SortableContext items={group.links.map(l => l.url)} strategy={rectSortingStrategy}>
                            <div className="tile-grid">
                                {groupTileConfigs.map(config => {
                                    const data = allLinksMap.get(config.id);
                                    if (!data) return null;
                                    const isFav = isFavorite(config.id);
                                    return <SortableTile key={config.id} config={config} data={data} isFavorite={isFav} onContextMenu={handleContextMenu} />;
                                })}
                            </div>
                        </SortableContext>
                    </section>
                );
            })}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full pt-8 pl-8">
        <div className="flex-shrink-0 flex justify-between items-start mb-8 pr-8">
            <div>
              <h1 className="text-4xl font-bold text-neutral-100 mb-2">Dashboard</h1>
              <p className="text-neutral-400">Ihre personalisierte Übersicht aller wichtigen Tools und Links.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                  <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none z-10">search</i>
                  <input
                      type="text"
                      placeholder="Kacheln suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-10 pr-10 text-neutral-200 w-52 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                      aria-label="Nach Kachel-Namen suchen"
                  />
                  {searchTerm && (
                      <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-700 transition-colors"
                          aria-label="Suche zurücksetzen"
                      >
                          <i className="material-icons text-lg">close</i>
                      </button>
                  )}
              </div>
              <button
                onClick={onOpenHelp}
                className="flex items-center bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                title="Anleitung anzeigen"
              >
                <i className="material-icons mr-2 text-base">help_outline</i>
                Anleitung
              </button>
              <button
                onClick={() => onAddLink(null)}
                className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <i className="material-icons mr-2 text-base">add_link</i>
                Link hinzufügen
              </button>
            </div>
        </div>
        
        <div className="flex-grow grid grid-cols-[200px_1fr] gap-8 min-h-0">
          <aside className="sticky top-0 h-full flex flex-col">
            <h3 className="text-sm font-bold uppercase text-neutral-400 mb-3 px-2 flex-shrink-0">Gruppen</h3>
            <nav className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2 min-h-0">
                <ul className="space-y-1">
                    {(isSearchActive ? filteredToolGroups : toolGroups).map(group => (
                        <li key={group.title}>
                            <button
                                onClick={() => handleGroupNavClick(group.title)}
                                className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-colors ${
                                    activeGroup === group.title
                                        ? 'bg-orange-500/20 text-orange-400 font-semibold'
                                        : 'text-neutral-400 hover:bg-neutral-700/50 hover:text-neutral-200'
                                }`}
                            >
                                <i className="material-icons text-lg">{group.icon}</i>
                                <span className="truncate text-sm">{group.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
          </aside>
          
          <div ref={scrollContainerRef} className="overflow-y-auto custom-scrollbar pr-8 min-h-0 pt-4 pb-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {renderContent()}
              {ReactDOM.createPortal(
                <DragOverlay dropAnimation={null}>
                    {renderDragOverlay()}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          </div>
        </div>

        {contextMenu && 
            <TileContextMenu 
                {...contextMenu} 
                onClose={() => setContextMenu(null)} 
                onEdit={handleEditTileRequest}
                onToggleFavorite={handleToggleFavorite}
                onAddLink={handleAddLinkFromContextMenu}
                onDeleteLink={handleDeleteLinkFromContextMenu}
            />
        }
    </div>
  );
};