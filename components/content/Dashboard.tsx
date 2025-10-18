import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardProps {
  onAddLink: (link: null, groupId?: string) => void;
  onEditTile: (data: { link: ToolLink; group: ToolGroup }) => void;
  onAddGroup: () => void;
  onEditGroup: (group: ToolGroup) => void;
  onOpenHelp: () => void;
  onOpenReorderModal: () => void;
}

const Tile: React.FC<{
  config: TileConfig;
  data: { link: ToolLink; group: ToolGroup };
  isFavorite: boolean;
}> = ({ config, data, isFavorite }) => {
    return (
      <div
        className={`tile size-${config.size}`}
        style={{ backgroundColor: data.group.color || '#f97316' }}
      >
        {isFavorite && (
            <i className="material-icons favorite-star" title="Favorit">star</i>
        )}
        <i className="material-icons tile-icon">{data.group.icon}</i>
        <div>
          <span className="tile-group-label">{data.group.title}</span>
          <span className="tile-label">{data.link.name}</span>
        </div>
      </div>
    );
};

const SortableTile: React.FC<{
  config: TileConfig;
  data: { link: ToolLink; group: ToolGroup };
  isFavorite: boolean;
  onEdit: (data: { link: ToolLink; group: ToolGroup }) => void;
  onDelete: (groupId: string, url: string) => void;
  onToggleFavorite: (link: ToolLink) => void;
}> = ({ config, data, isFavorite, onEdit, onDelete, onToggleFavorite }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id, data: { type: 'tile', config, data, isFavorite } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tile-actions')) {
        return;
    }
    if (e.defaultPrevented) return; // to prevent click on drag
    e.preventDefault();
    window.open(data.link.url, '_blank', 'noopener,noreferrer');
  }

  // To prevent drag from starting when clicking on actions
  const handleActionInteraction = (e: React.PointerEvent) => {
    e.stopPropagation();
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tile-wrapper group relative size-${config.size} touch-none transition-opacity duration-300 ${isDragging ? 'opacity-30' : ''}`}
    >
      {!isDragging && (
        <div 
            className="tile-actions absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-neutral-900 backdrop-blur-sm p-1 rounded-full border border-neutral-700 shadow-lg transform group-hover:-translate-y-1"
            onPointerDown={handleActionInteraction}
        >
            <button
                onClick={() => onToggleFavorite(data.link)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title={isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            >
                <i className="material-icons text-base" style={{ color: isFavorite ? '#fbbf24' : 'currentColor' }}>{isFavorite ? 'star' : 'star_border'}</i>
            </button>
            <button
                onClick={() => onEdit(data)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="Bearbeiten"
            >
                <i className="material-icons text-base">edit</i>
            </button>
            <button
                onClick={() => onDelete(data.group.id, data.link.url)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-red-500 transition-colors"
                title="Löschen"
            >
                <i className="material-icons text-base">delete</i>
            </button>
        </div>
      )}

      <div
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="w-full h-full"
      >
        <Tile 
            config={config} 
            data={data}
            isFavorite={isFavorite}
        />
      </div>
    </div>
  );
};

const GroupNavItem: React.FC<{
  group: ToolGroup;
  activeGroup: string | null;
  onClick: (groupId: string) => void;
  onEdit: (group: ToolGroup) => void;
}> = ({ group, activeGroup, onClick, onEdit }) => {
  return (
    <li className="relative">
      <div className="group flex items-center relative">
        <button
          onClick={() => onClick(group.id)}
          className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-colors pl-4 pr-8 ${
            activeGroup === group.id
              ? 'bg-orange-500/20 text-orange-400 font-semibold'
              : 'text-neutral-400 hover:bg-neutral-700/50 hover:text-neutral-200'
          }`}
        >
          <i className="material-icons text-lg">{group.icon}</i>
          <span className="truncate text-sm">{group.title}</span>
        </button>
        <button
            onClick={(e) => { e.stopPropagation(); onEdit(group); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity hover:text-white hover:bg-neutral-700"
            title={`Gruppe "${group.title}" bearbeiten`}
        >
            <i className="material-icons text-base">edit</i>
        </button>
      </div>
    </li>
  );
};


export const Dashboard: React.FC<DashboardProps> = ({ onAddLink, onEditTile, onAddGroup, onEditGroup, onOpenHelp, onOpenReorderModal }) => {
  const { toolGroups, tileConfigs, deleteLink, reorderGroups, reorderLinks } = useDashboard();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const [activeItem, setActiveItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
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

        // FIX: Explicitly type visibleGroups as IntersectionObserverEntry[] to resolve type errors
        const visibleGroups: IntersectionObserverEntry[] = Array.from(activeIntersections.current.values());
        
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
    const { type, config, data, isFavorite } = active.data.current || {};
    
    document.body.style.cursor = 'grabbing';
    if (type === 'tile' && config && data) {
      setActiveItem({ type: 'tile', config, data, isFavorite });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.style.cursor = '';
    setActiveItem(null);

    const { active, over } = event;
    if (!over || !active.data.current) return;
    
    const activeType = active.data.current.type;

    // Handle tile dragging (reorder or move between groups)
    if (activeType === 'tile') {
        const activeId = active.id.toString();
        const overId = over.id.toString();
        
        const activeGroupId = active.data.current.data.group.id;
        const activeLink = active.data.current.data.link;

        const overData = over.data.current;
        let overGroupId: string | null = null;
        
        // Determine the destination group's ID
        if (overData?.type === 'tile') {
            overGroupId = overData.data.group.id;
        } else if (overData?.type === 'group-container') {
            overGroupId = overId;
        }

        if (!activeGroupId || !overGroupId || !activeLink || active.id === over.id) {
            return;
        }

        // Case 1: Reordering within the same group
        if (activeGroupId === overGroupId) {
            const group = toolGroups.find(g => g.id === activeGroupId);
            if (group) {
                const oldIndex = group.links.findIndex(l => l.url === activeId);
                const newIndex = group.links.findIndex(l => l.url === overId);
                
                if (oldIndex !== -1 && newIndex !== -1) {
                    const reordered = arrayMove(group.links, oldIndex, newIndex);
                    reorderLinks(activeGroupId, reordered);
                }
            }
        } 
        // Case 2: Moving to a different group
        else {
            let nextToolGroups = [...toolGroups];
            const sourceGroupIndex = nextToolGroups.findIndex(g => g.id === activeGroupId);
            const destinationGroupIndex = nextToolGroups.findIndex(g => g.id === overGroupId);

            if (sourceGroupIndex === -1 || destinationGroupIndex === -1) return;

            // 1. Remove link from source group
            const sourceLinks = nextToolGroups[sourceGroupIndex].links.filter(l => l.url !== activeId);
            nextToolGroups[sourceGroupIndex] = { ...nextToolGroups[sourceGroupIndex], links: sourceLinks };

            // 2. Add link to destination group
            let destinationLinks = [...nextToolGroups[destinationGroupIndex].links];
            const overIndex = destinationLinks.findIndex(l => l.url === overId);

            if (overIndex !== -1) { // Dropped on a tile
                destinationLinks.splice(overIndex, 0, activeLink);
            } else { // Dropped on the container
                destinationLinks.push(activeLink);
            }
            nextToolGroups[destinationGroupIndex] = { ...nextToolGroups[destinationGroupIndex], links: destinationLinks };
            
            reorderGroups(nextToolGroups);
        }
    }
  };
  
  const handleToggleFavorite = (link: ToolLink) => {
    if (isFavorite(link.url)) {
        removeFavorite(link.url);
    } else {
        addFavorite(link);
    }
  }
  
  const handleGroupNavClick = (groupId: string) => {
    groupRefs.current.get(groupId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderDragOverlay = () => {
    if (!activeItem) return null;

    if (activeItem.type === 'tile') {
        return <Tile 
                    config={activeItem.config} 
                    data={activeItem.data}
                    isFavorite={activeItem.isFavorite}
                />;
    }
    
    return null;
  }

  // FIX: Changed component definition to use React.FC to fix a type error where the 'key' prop was not being recognized correctly by TypeScript.
  const GroupSection: React.FC<{ group: ToolGroup }> = ({ group }) => {
    const { setNodeRef } = useDroppable({
        id: group.id,
        data: {
            type: 'group-container',
            group,
        },
    });

    if (isSearchActive && group.links.length === 0) {
        return null;
    }

    const groupTileConfigs = group.links.map(link => 
        tileConfigs.find(c => c.id === link.url)
    ).filter((c): c is TileConfig => !!c);

    return (
        <section 
            ref={setNodeRef}
            key={group.id} 
            id={group.id}
            aria-labelledby={`group-header-${group.id}`} 
            className="scroll-mt-4"
        >
            <div
              ref={(el) => {
                  if (el) {
                      groupRefs.current.set(group.id, el);
                  } else {
                      groupRefs.current.delete(group.id);
                  }
              }}
              className="group flex items-center gap-2 mb-4"
            >
                <i className="material-icons text-2xl text-neutral-100">{group.icon}</i>
                <h2 id={`group-header-${group.id}`} className="text-2xl font-bold text-neutral-200">{group.title}</h2>
                <span className="text-sm font-medium bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-full">{group.links.length}</span>
                <button
                    onClick={() => onAddLink(null, group.id)}
                    className="ml-2 w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-neutral-700 hover:text-white"
                    title={`Link zu "${group.title}" hinzufügen`}
                >
                    <i className="material-icons text-lg">add</i>
                </button>
            </div>
            <SortableContext items={group.links.map(l => l.url)} strategy={rectSortingStrategy}>
                <div className="tile-grid min-h-[128px] relative">
                    {groupTileConfigs.map(config => {
                        const data = allLinksMap.get(config.id);
                        if (!data) return null;
                        const isFav = isFavorite(config.id);
                        return <SortableTile 
                                    key={config.id} 
                                    config={config} 
                                    data={data} 
                                    isFavorite={isFav} 
                                    onEdit={onEditTile} 
                                    onDelete={deleteLink} 
                                    onToggleFavorite={handleToggleFavorite}
                                />;
                    })}
                    {group.links.length === 0 && !isSearchActive && (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-600 pointer-events-none">
                            <p>Kachel hierher ziehen</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </section>
    );
  };

  const renderContent = () => {
    if (toolGroups.flatMap(g => g.links).length === 0 && toolGroups.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-neutral-600 p-8">
            <i className="material-icons text-8xl mb-4 text-neutral-700">category</i>
            <h3 className="text-2xl font-semibold text-neutral-400 mb-2">Ihr Dashboard ist leer</h3>
            <p className="text-neutral-500 mb-6 max-w-sm">Beginnen Sie, indem Sie Ihre erste Gruppe für Tools und Links erstellen, um alles nach Ihren Wünschen zu organisieren.</p>
            <button
            onClick={onAddGroup}
            className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg text-base"
            >
            <i className="material-icons mr-2">add</i>
            Erste Gruppe erstellen
            </button>
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
            {groupsToRender.map(group => <GroupSection key={group.id} group={group} />)}
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
                onClick={onOpenReorderModal}
                className="flex items-center bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                title="Gruppen anordnen"
              >
                <i className="material-icons mr-2 text-base">view_quilt</i>
                Anordnen
              </button>
              <button
                onClick={onOpenHelp}
                className="flex items-center bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                title="Anleitung anzeigen"
              >
                <i className="material-icons mr-2 text-base">help_outline</i>
                Anleitung
              </button>
            </div>
        </div>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex-grow grid grid-cols-[200px_1fr] gap-8 min-h-0">
              <aside className="sticky top-0 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 px-2 flex-shrink-0">
                    <h3 className="text-sm font-bold uppercase text-neutral-400">Gruppen</h3>
                    <button
                        onClick={onAddGroup}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                        title="Neue Gruppe erstellen"
                    >
                        <i className="material-icons text-lg">add</i>
                    </button>
                </div>
                <nav className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2 min-h-0">
                    <ul className="space-y-1">
                        {(isSearchActive ? filteredToolGroups : toolGroups).map(group => (
                            <GroupNavItem 
                                key={group.id} 
                                group={group} 
                                activeGroup={activeGroup} 
                                onClick={handleGroupNavClick}
                                onEdit={onEditGroup}
                            />
                        ))}
                    </ul>
                </nav>
              </aside>
              
              <div ref={scrollContainerRef} className="overflow-y-auto custom-scrollbar pr-8 min-h-0 pt-4 pb-4">
                  {renderContent()}
              </div>
            </div>

            {ReactDOM.createPortal(
                <DragOverlay dropAnimation={null}>
                    {renderDragOverlay()}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    </div>
  );
};
