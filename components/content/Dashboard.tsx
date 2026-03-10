import React, { useEffect, memo } from 'react';
import ReactDOM from 'react-dom';
import { ToolLink, ToolGroup } from '../../types';
import {
  DndContext,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LinkItem } from '../../src/components/dashboard/LinkItem';
import { SortableLinkItem } from '../../src/components/dashboard/SortableLinkItem';
import { useDashboardLogic } from '../../src/hooks/useDashboardLogic';
import { useRecentlyUsed } from '../../src/hooks/useRecentlyUsed';
import { useFavorites } from '../../contexts/FavoritesContext';

interface DashboardProps {
  onAddLink: (link: null, groupId?: string) => void;
  onEditTile: (data: { link: ToolLink; group: ToolGroup }) => void;
  onAddGroup: () => void;
  onEditGroup: (group: ToolGroup) => void;
  onOpenReorderGroupsModal: () => void;
  onColumnCountChange: (count: number) => void;
}

const MemoizedSortableLinkItem = memo(SortableLinkItem);

const GroupOverlay: React.FC<{ group: ToolGroup }> = ({ group }) => (
  <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-3 flex items-center gap-2 opacity-90" style={{ width: '350px' }}>
    <i className="material-icons text-2xl text-orange-500">{group.icon}</i>
    <h2 className="text-xl font-bold text-neutral-200 truncate">{group.title}</h2>
  </div>
);

interface SortableGroupProps {
  group: ToolGroup;
  isSearchActive: boolean;
  isEditMode: boolean;
  onEditGroup: (group: ToolGroup) => void;
  onAddLink: (link: null, groupId?: string) => void;
  onEditTile: (data: { link: ToolLink; group: ToolGroup }) => void;
  deleteLink: (groupId: string, url: string) => void;
  onToggleFavorite: (link: ToolLink) => void;
  isFavorite: (url: string) => boolean;
  onLinkClick: (link: ToolLink) => void;
}

const SortableGroup: React.FC<SortableGroupProps> = memo(({
  group,
  isSearchActive,
  isEditMode,
  onEditGroup,
  onAddLink,
  onEditTile,
  deleteLink,
  onToggleFavorite,
  isFavorite,
  onLinkClick
}) => {
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
      style={{ ...style, backgroundColor: 'var(--group-section-bg)' }}
      id={group.id}
      aria-labelledby={`group-header-${group.id}`}
      className="border border-neutral-700 rounded-xl p-4"
    >
      <div className="group flex items-center gap-2 mb-4">
        <i className="material-icons text-2xl text-orange-500">{group.icon}</i>
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
          <div className="grid grid-cols-2 gap-2 relative">
            {group.links.map(link => {
              const isFav = isFavorite(link.url);
              return (
                <MemoizedSortableLinkItem
                  key={link.url}
                  link={link}
                  group={group}
                  isFavorite={isFav}
                  isEditMode={isEditMode}
                  onEdit={onEditTile}
                  onDelete={deleteLink}
                  onToggleFavorite={onToggleFavorite}
                  onLinkClick={onLinkClick}
                />
              );
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
});

export const Dashboard: React.FC<DashboardProps> = ({ onAddLink, onEditTile, onAddGroup, onEditGroup, onOpenReorderGroupsModal, onColumnCountChange }) => {
  const {
    toolGroups,
    activeItem,
    searchTerm,
    setSearchTerm,
    isEditMode,
    setIsEditMode,
    sensors,
    isSearchActive,
    filteredToolGroups,
    handleDragStart,
    handleDragEnd,
    handleToggleFavorite,
    deleteLink,
    isFavorite,
  } = useDashboardLogic(onColumnCountChange);

  const { recentLinks, recordUsage } = useRecentlyUsed();
  const { favorites } = useFavorites();

  // Keep layout adjustment effect here as it interacts with prop `onColumnCountChange`
  useEffect(() => {
    const getColumnCount = () => {
      if (window.matchMedia('(min-width: 1280px)').matches) {
        return 4;
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

  const renderDragOverlay = () => {
    if (!activeItem) return null;
    if (activeItem.type === 'link') {
      return <LinkItem data={activeItem.data} isFavorite={activeItem.isFavorite} isEditMode={false} />;
    }
    if (activeItem.type === 'group') {
      return <GroupOverlay group={activeItem.data.group} />;
    }
    return null;
  }

  let content;
  if (toolGroups.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-center text-neutral-600 p-8">
        <i className="material-icons text-8xl mb-4 text-neutral-700">category</i>
        <h3 className="text-2xl font-semibold text-neutral-400 mb-2">Ihr Dashboard ist leer</h3>
        <p className="text-neutral-500 mb-6 max-w-sm">Beginnen Sie, indem Sie Ihre erste Gruppe für Tools und Links erstellen, um alles nach Ihren Wünschen zu organisieren.</p>
        <button
          onClick={onAddGroup}
          className="flex items-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base"
        >
          <i className="material-icons mr-2">add</i>
          Erste Gruppe erstellen
        </button>
      </div>
    );
  } else {
    const groupsToRender = isSearchActive ? filteredToolGroups : toolGroups;

    if (isSearchActive && groupsToRender.length === 0) {
      content = (
        <div className="flex flex-col items-center justify-center h-full text-neutral-600 p-8">
          <i className="material-icons text-7xl mb-4">search_off</i>
          <h3 className="text-xl font-semibold">Keine Links gefunden</h3>
          <p className="text-neutral-500 text-center">Probieren Sie einen anderen Suchbegriff aus.</p>
        </div>
      );
    } else {
      content = (
        <SortableContext items={toolGroups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
            {groupsToRender.map(group => (
              <SortableGroup
                key={group.id}
                group={group}
                isSearchActive={isSearchActive}
                isEditMode={isEditMode}
                onEditGroup={onEditGroup}
                onAddLink={onAddLink}
                onEditTile={onEditTile}
                deleteLink={deleteLink}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
                onLinkClick={recordUsage}
              />
            ))}
          </div>
        </SortableContext>
      );
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex justify-between items-start view-pt view-px mb-8">
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
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${isEditMode ? 'bg-orange-500 text-white' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
            title={isEditMode ? "Bearbeiten beenden" : "Dashboard bearbeiten"}
          >
            <i className="material-icons text-xl">{isEditMode ? 'check' : 'edit'}</i>
          </button>

          {!isEditMode && (
            <>
              <button
                onClick={onAddGroup}
                className="w-10 h-10 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                title="Neue Gruppe erstellen"
              >
                <i className="material-icons text-xl">create_new_folder</i>
              </button>
              <button
                onClick={onOpenReorderGroupsModal}
                className="w-10 h-10 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                title="Gruppen anordnen"
              >
                <i className="material-icons text-xl">view_quilt</i>
              </button>
            </>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-y-auto custom-scrollbar view-px min-h-0 pt-4 pb-4">
          {!isSearchActive && (recentLinks.length > 0 || favorites.length > 0) && (
            <div className="mb-6">
              {recentLinks.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="material-icons text-xl text-orange-500">history</i>
                    <h2 className="text-lg font-semibold text-neutral-300">Zuletzt verwendet</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {recentLinks.map(entry => (
                      <button
                        key={entry.url}
                        onClick={() => {
                          recordUsage({ name: entry.name, url: entry.url });
                          window.open(entry.url, '_blank', 'noopener,noreferrer');
                        }}
                        className="flex items-center justify-center min-h-[3rem] py-2 px-3 rounded-lg bg-neutral-800/60 border border-neutral-700 hover:bg-neutral-700 hover:border-orange-500/50 transition-all duration-200 cursor-pointer"
                        title={entry.name}
                      >
                        <span className="font-medium text-neutral-200 text-center text-sm leading-tight truncate">{entry.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {favorites.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="material-icons text-xl text-orange-500">star</i>
                    <h2 className="text-lg font-semibold text-neutral-300">Favoriten</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {favorites.map(fav => (
                      <button
                        key={fav.url}
                        onClick={() => {
                          recordUsage({ name: fav.name, url: fav.url });
                          window.open(fav.url, '_blank', 'noopener,noreferrer');
                        }}
                        className="flex items-center justify-center min-h-[3rem] py-2 px-3 rounded-lg bg-neutral-800/60 border border-neutral-700 hover:bg-neutral-700 hover:border-orange-500/50 transition-all duration-200 cursor-pointer"
                        title={fav.name}
                      >
                        <i className="material-icons text-yellow-400 text-sm mr-1.5">star</i>
                        <span className="font-medium text-neutral-200 text-center text-sm leading-tight truncate">{fav.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <hr className="border-neutral-700" />
            </div>
          )}
          {content}
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