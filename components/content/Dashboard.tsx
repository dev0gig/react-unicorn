import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useFavorites, useDashboard } from '../../App';
import { ToolLink, ToolGroup } from '../../types';
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
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardProps {
  onAddLink: (link: null, groupId?: string) => void;
  onEditTile: (data: { link: ToolLink; group: ToolGroup }) => void;
  onAddGroup: () => void;
  onEditGroup: (group: ToolGroup) => void;
  onOpenHelp: () => void;
  onOpenReorderGroupsModal: () => void;
  onColumnCountChange: (count: number) => void;
}

const LinkItem: React.FC<{
  data: { link: ToolLink; group: ToolGroup };
  isFavorite: boolean;
  isEditMode: boolean;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ data, isFavorite, isEditMode, onToggleFavorite, onEdit, onDelete }) => {
    return (
      <div 
        className={`relative flex flex-col w-full h-20 rounded-lg bg-neutral-800 transition-all duration-200 overflow-hidden ${isEditMode ? 'ring-2 ring-orange-500 shadow-lg bg-neutral-800' : 'hover:bg-neutral-700'}`}
        style={{ borderLeft: `4px solid ${data.group.color || '#f97316'}` }}
      >
        {isEditMode ? (
            /* EDIT MODE LAYOUT */
            <div className="flex flex-col h-full w-full animate-fade-in-fast">
                {/* Title Area - Always readable */}
                <div className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-neutral-400 font-semibold truncate border-b border-neutral-700/50 text-center select-none">
                    {data.link.name}
                </div>
                
                {/* Action Buttons Area - Center aligned with more space */}
                <div className="flex-grow flex items-center justify-center gap-3 bg-neutral-900/30">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 text-white transition-all shadow-sm hover:scale-110"
                        title={isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                    >
                        <i className="material-icons text-base" style={{ color: isFavorite ? '#fbbf24' : '#9ca3af' }}>{isFavorite ? 'star' : 'star_border'}</i>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 text-white transition-all shadow-sm hover:scale-110"
                        title="Bearbeiten"
                    >
                        <i className="material-icons text-base">edit</i>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-700 hover:bg-red-600 text-red-400 hover:text-white transition-all shadow-sm hover:scale-110"
                        title="Löschen"
                    >
                        <i className="material-icons text-base">delete</i>
                    </button>
                </div>
            </div>
        ) : (
            /* NORMAL MODE LAYOUT */
            <div className="flex flex-col justify-end h-full p-3">
                {isFavorite && (
                  <i className="material-icons text-yellow-400 text-lg absolute top-2 left-2" title="Favorit">star</i>
                )}
                <div className="min-w-0">
                    <span className="font-medium text-neutral-200 break-words line-clamp-2">{data.link.name}</span>
                </div>
            </div>
        )}
      </div>
    );
};

const SortableLinkItem: React.FC<{
  link: ToolLink;
  group: ToolGroup;
  isFavorite: boolean;
  isEditMode: boolean;
  onEdit: (data: { link: ToolLink; group: ToolGroup }) => void;
  onDelete: (groupId: string, url: string) => void;
  onToggleFavorite: (link: ToolLink) => void;
}> = ({ link, group, isFavorite, isEditMode, onEdit, onDelete, onToggleFavorite }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.url, data: { type: 'link', link, group, isFavorite } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const data = { link, group };

  const handleClick = (e: React.MouseEvent) => {
    // In Edit Mode, clicking the tile background should not open the link.
    if (isEditMode) {
        e.preventDefault();
        return;
    }
    
    if (e.defaultPrevented) return;
    e.preventDefault();
    window.open(data.link.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-opacity duration-300 ${isDragging ? 'opacity-30' : ''}`}
    >
        <div className="relative cursor-pointer" onClick={handleClick}>
          <div {...attributes} {...listeners} className="touch-none">
            <LinkItem 
                data={data} 
                isFavorite={isFavorite} 
                isEditMode={isEditMode}
                onToggleFavorite={() => onToggleFavorite(link)}
                onEdit={() => onEdit(data)}
                onDelete={() => onDelete(group.id, link.url)}
            />
          </div>
        </div>
    </div>
  );
};

const GroupOverlay: React.FC<{ group: ToolGroup }> = ({ group }) => (
    <div className="bg-neutral-800 rounded-xl shadow-2xl p-3 flex items-center gap-2 opacity-90" style={{width: '350px'}}>
        <i className="material-icons text-2xl" style={{color: group.color || '#f97316'}}>{group.icon}</i>
        <h2 className="text-xl font-bold text-neutral-200 truncate">{group.title}</h2>
    </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ onAddLink, onEditTile, onAddGroup, onEditGroup, onOpenHelp, onOpenReorderGroupsModal, onColumnCountChange }) => {
  const { toolGroups, deleteLink, updateLink, reorderGroups } = useDashboard();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const [activeItem, setActiveItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const getColumnCount = () => {
        if (window.matchMedia('(min-width: 1280px)').matches) {
            return 3;
        }
        if (window.matchMedia('(min-width: 1024px)').matches) {
            return 2;
        }
        return 1;
    };

    const updateColumnCount = () => {
        onColumnCountChange(getColumnCount());
    };

    updateColumnCount(); // Initial check

    const mediaQueryXl = window.matchMedia('(min-width: 1280px)');
    const mediaQueryLg = window.matchMedia('(min-width: 1024px)');

    mediaQueryXl.addEventListener('change', updateColumnCount);
    mediaQueryLg.addEventListener('change', updateColumnCount);

    return () => {
        mediaQueryXl.removeEventListener('change', updateColumnCount);
        mediaQueryLg.removeEventListener('change', updateColumnCount);
    };
  }, [onColumnCountChange]);

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
  
  const matchingLinkUrls = useMemo(() => {
    if (!isSearchActive) return new Set<string>();
    
    const lowercasedFilter = searchTerm.toLowerCase().trim();
    const urls = new Set<string>();
    
    for (const [url, { link, group }] of allLinksMap.entries()) {
      if (
        link.name.toLowerCase().includes(lowercasedFilter) ||
        group.title.toLowerCase().includes(lowercasedFilter)
      ) {
        urls.add(url);
      }
    }
    return urls;
  }, [searchTerm, allLinksMap, isSearchActive]);
  
  const filteredToolGroups = useMemo(() => {
    if (!isSearchActive) {
      return toolGroups;
    }
    return toolGroups
      .map(group => {
        const filteredLinks = group.links.filter(link => matchingLinkUrls.has(link.url));
        return { ...group, links: filteredLinks };
      })
      .filter(group => group.links.length > 0);
  }, [toolGroups, isSearchActive, matchingLinkUrls]);


  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { type, link, group, isFavorite } = active.data.current || {};
    
    document.body.style.cursor = 'grabbing';
    if (type === 'link' && link && group) {
      setActiveItem({ type: 'link', data: { link, group }, isFavorite });
    } else if (type === 'group' && group) {
      setActiveItem({ type: 'group', data: { group } });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.style.cursor = '';
    setActiveItem(null);
  
    const { active, over } = event;
    if (!over || !active.data.current || active.id === over.id) return;
  
    const activeType = active.data.current.type;

    if (activeType === 'group') {
        const oldIndex = toolGroups.findIndex(g => g.id === active.id);
        const newIndex = toolGroups.findIndex(g => g.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const updatedGroups = arrayMove(toolGroups, oldIndex, newIndex);
            reorderGroups(updatedGroups);
        }
        return;
    }
    
    // Link dragging logic
    const activeId = active.id.toString();
    const overId = over.id.toString();
  
    const activeLinkData = allLinksMap.get(activeId);
    if (!activeLinkData) return;
  
    const sourceGroupId = activeLinkData.group.id;
    
    const overData = over.data.current;
    let targetGroupId: string;
  
    if (overData?.type === 'group-container' || overData?.type === 'group') {
      targetGroupId = over.id.toString();
    } else if (overData?.type === 'link') {
      targetGroupId = overData.group.id;
    } else {
      return; // Invalid drop target
    }
  
    const targetGroupExists = toolGroups.some(g => g.id === targetGroupId);
    if (!targetGroupExists) return;

    if (sourceGroupId === targetGroupId) {
        // Reordering within the same group
        const group = toolGroups.find(g => g.id === sourceGroupId);
        if (group) {
            const oldIndex = group.links.findIndex(l => l.url === activeId);
            const newIndex = group.links.findIndex(l => l.url === overId);
            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedLinks = arrayMove(group.links, oldIndex, newIndex);
                const updatedGroups = toolGroups.map(g => g.id === sourceGroupId ? {...g, links: reorderedLinks} : g);
                reorderGroups(updatedGroups);
            }
        }
    } else {
        // Moving to a different group
        let nextToolGroups = toolGroups.map(g => ({...g, links: [...g.links]}));
        const sourceGroup = nextToolGroups.find(g => g.id === sourceGroupId);
        const targetGroup = nextToolGroups.find(g => g.id === targetGroupId);

        if (sourceGroup && targetGroup) {
            const oldIndex = sourceGroup.links.findIndex(l => l.url === activeId);
            if (oldIndex > -1) {
                const [movedLink] = sourceGroup.links.splice(oldIndex, 1);
                
                if (overData?.type === 'group-container' || overData?.type === 'group') {
                    // if dropped on the container, not a specific link, add to the end
                    targetGroup.links.push(movedLink);
                } else {
                    const newIndex = targetGroup.links.findIndex(l => l.url === overId);
                    if (newIndex > -1) {
                        targetGroup.links.splice(newIndex, 0, movedLink);
                    } else {
                        // fallback: if over item is not found, add to end
                        targetGroup.links.push(movedLink);
                    }
                }
                reorderGroups(nextToolGroups);
            }
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
  
  const renderDragOverlay = () => {
    if (!activeItem) return null;
    if (activeItem.type === 'link') {
        // Overlay is never in edit mode during drag for clarity
        return <LinkItem data={activeItem.data} isFavorite={activeItem.isFavorite} isEditMode={false} />;
    }
    if (activeItem.type === 'group') {
        return <GroupOverlay group={activeItem.data.group} />;
    }
    return null;
  }

  const SortableGroup: React.FC<{ group: ToolGroup }> = ({ group }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: group.id, data: { type: 'group', group } });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    if (isSearchActive && group.links.length === 0) {
        return null;
    }

    return (
        <section 
            ref={setNodeRef}
            style={style}
            id={group.id}
            aria-labelledby={`group-header-${group.id}`} 
        >
            <div className="group flex items-center gap-2 mb-4">
                <i className="material-icons text-2xl" style={{color: group.color || '#f97316'}}>{group.icon}</i>
                {isEditMode && (
                    <button
                        {...attributes}
                        {...listeners}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white cursor-grab active:cursor-grabbing"
                        title={`Gruppe "${group.title}" verschieben`}
                    >
                        <i className="material-icons text-lg">drag_handle</i>
                    </button>
                )}
                <div className="flex-grow flex items-center gap-2">
                    <h2 id={`group-header-${group.id}`} className="text-2xl font-bold text-neutral-200">{group.title}</h2>
                    <span className="text-sm font-medium bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-full">{group.links.length}</span>
                </div>
                
                {isEditMode && (
                    <div className="ml-2 flex items-center transition-opacity duration-200 animate-fade-in-fast">
                        <button
                            onClick={() => onEditGroup(group)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white"
                            title={`Gruppe "${group.title}" bearbeiten oder löschen`}
                        >
                            <i className="material-icons text-lg">edit</i>
                        </button>
                        <button
                            onClick={() => onAddLink(null, group.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white"
                            title={`Link zu "${group.title}" hinzufügen`}
                        >
                            <i className="material-icons text-lg">add</i>
                        </button>
                    </div>
                )}
            </div>
            <div className="min-h-[6rem]">
              <SortableContext items={group.links.map(l => l.url)} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 relative">
                      {group.links.map(link => {
                          const isFav = isFavorite(link.url);
                          return <SortableLinkItem 
                                      key={link.url} 
                                      link={link} 
                                      group={group}
                                      isFavorite={isFav}
                                      isEditMode={isEditMode}
                                      onEdit={() => onEditTile({link, group})} 
                                      onDelete={deleteLink} 
                                      onToggleFavorite={handleToggleFavorite}
                                  />;
                      })}
                      {group.links.length === 0 && !isSearchActive && (
                          <div className="absolute col-span-full inset-0 flex items-center justify-center text-neutral-600 pointer-events-none p-4 text-center">
                              <p>Link hierher ziehen oder über den <i className="material-icons text-sm align-middle">add</i> Button hinzufügen.</p>
                          </div>
                      )}
                  </div>
              </SortableContext>
            </div>
        </section>
    );
  };

  const renderContent = () => {
    if (toolGroups.length === 0) {
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
          <h3 className="text-xl font-semibold">Keine Links gefunden</h3>
          <p className="text-neutral-500 text-center">Probieren Sie einen anderen Suchbegriff aus.</p>
        </div>
      );
    }

    return (
        <SortableContext items={toolGroups.map(g => g.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-10">
                {groupsToRender.map(group => <SortableGroup key={group.id} group={group} />)}
            </div>
        </SortableContext>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 flex justify-between items-start pt-8 px-8 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-neutral-100 mb-2">Dashboard</h1>
              <p className="text-neutral-400">Ihre personalisierte Übersicht aller wichtigen Tools und Links.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                  <i className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none z-10">search</i>
                  <input
                      type="text"
                      placeholder="Links suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-10 pr-10 text-neutral-200 w-52 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all duration-200"
                      aria-label="Nach Link-Namen oder Gruppen suchen"
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
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg ${isEditMode ? 'bg-orange-500 text-white' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
                title={isEditMode ? "Bearbeiten beenden" : "Dashboard bearbeiten"}
              >
                <i className="material-icons mr-2 text-base">{isEditMode ? 'check' : 'edit'}</i>
                {isEditMode ? 'Fertig' : 'Bearbeiten'}
              </button>

              {!isEditMode && (
                <>
                    <button
                        onClick={onAddGroup}
                        className="flex items-center bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
                        title="Neue Gruppe erstellen"
                    >
                        <i className="material-icons mr-2 text-base">create_new_folder</i>
                        Neue Gruppe
                    </button>
                    <button
                        onClick={onOpenReorderGroupsModal}
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
                </>
              )}
            </div>
        </div>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="overflow-y-auto custom-scrollbar px-8 min-h-0 pt-4 pb-4">
                  {renderContent()}
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