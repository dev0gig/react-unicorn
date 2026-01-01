import { useState, useMemo } from 'react';
import {
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useDashboard } from '../../contexts/DashboardContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { ToolLink, ToolGroup } from '../../types';
import { isLink, isGroup, isGroupContainer } from '../utils/dndUtils';

export const useDashboardLogic = (onColumnCountChange: (count: number) => void) => {
    const { toolGroups, reorderGroups } = useDashboard();
    const { addFavorite, removeFavorite, isFavorite } = useFavorites();

    const [activeItem, setActiveItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    // Column Count Logic (moved from Dashboard but kept relevant to layout logic if needed, 
    // though strictly it might belong in the view. Keeping it here or in view is debatable, 
    // but let's keep the hook focused on data/interaction).
    // Actually, the previous effect was purely UI responsiveness. 
    // We can leave the useEffect in the component or move it here. 
    // Let's leave the resize logic in the component as it's purely view-related 
    // or move it here if we want to clean up the component completely.
    // The prompt asked to move "State management", "DnD", "filtering".
    // Let's stick to that.

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


    // ... (keep surrounding code)

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;

        document.body.style.cursor = 'grabbing';

        if (isLink(active)) {
            const { link, group, isFavorite } = active.data.current;
            setActiveItem({ type: 'link', data: { link, group }, isFavorite });
        } else if (isGroup(active)) {
            const { group } = active.data.current;
            setActiveItem({ type: 'group', data: { group } });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        document.body.style.cursor = '';
        setActiveItem(null);

        const { active, over } = event;
        if (!over || !active.data.current || active.id === over.id) return;

        if (isGroup(active)) {
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

        if (isGroupContainer(over)) {
            targetGroupId = over.id.toString();
        } else if (overData?.type === 'link') { // can use isLink(over) conceptually but over type is slightly different wrapper
            // The util is for Active | Over, checking data structure.
            // But technically 'link' type on over data means it's a link item.
            // Let's rely on standard check or explicit check if we make util flexible.
            // The util 'isLink' expects 'Active' type roughly. 
            // Let's stick to checking type property safely or casting.
            // For now, simpler to just access safely if we don't want to over-engineer over-checks.
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
                    const updatedGroups = toolGroups.map(g => g.id === sourceGroupId ? { ...g, links: reorderedLinks } : g);
                    reorderGroups(updatedGroups);
                }
            }
        } else {
            // Moving to a different group
            let nextToolGroups = toolGroups.map(g => ({ ...g, links: [...g.links] }));
            const sourceGroup = nextToolGroups.find(g => g.id === sourceGroupId);
            const targetGroup = nextToolGroups.find(g => g.id === targetGroupId);

            if (sourceGroup && targetGroup) {
                const oldIndex = sourceGroup.links.findIndex(l => l.url === activeId);
                if (oldIndex > -1) {
                    const [movedLink] = sourceGroup.links.splice(oldIndex, 1);

                    if (isGroupContainer(over)) {
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

    return {
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
        deleteLink: useDashboard().deleteLink, // Expose deleteLink from context
        isFavorite,
    };
};
