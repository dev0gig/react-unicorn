import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../src/hooks/useLocalStorage';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { initialToolGroups } from '../data/initialDashboard';
import { ToolGroup, ToolLink, DashboardContextType } from '../types';

export const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
    return context;
};

const GROUP_COLORS = [
    '#4c0519', // rose-950
    '#431407', // orange-950
    '#022c22', // emerald-950
    '#082f49', // sky-950
    '#1e1b4b', // indigo-950
    '#3b0764', // purple-950
    '#1e293b', // slate-800
    '#042f2e', // teal-950
    '#422006', // amber-950
    '#500724', // pink-950
];

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toolGroups, setToolGroups] = useLocalStorage<ToolGroup[]>('dashboard', initialToolGroups);

    // Initial load migration logic
    // Note: useLocalStorage handles initialization, but for the specific migration logic in App.tsx 
    // where it checked for missing IDs in valid saved data, we need to replicate that.
    // However, useLocalStorage's initializer runs once. We can use a useEffect to perform migration 
    // if we want to strictly follow the "exact logic" request, ensuring existing bad data is fixed.
    // In App.tsx it was done in the useState initializer.
    // Since useLocalStorage is already used, let's defer to a useEffect or rely on the fact 
    // that useLocalStorage manages the state.
    // BUT! App.tsx had a specific "init" block that did `loadFromStorage` manually to migrate IDs.
    // effectively overriding useLocalStorage's simple init for that first run.
    // To match App.tsx's behavior perfectly, we should probably check formatting on mount.

    useEffect(() => {
        setToolGroups(currentGroups => {
            let needsUpdate = false;
            const migratedGroups = currentGroups.map(group => {
                if (!group.id) {
                    needsUpdate = true;
                    return { ...group, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
                }
                return group;
            });

            if (needsUpdate) {
                // Return new reference to trigger save
                return migratedGroups;
            }
            return currentGroups;
        });
    }, [setToolGroups]);

    const addGroup = useCallback((title: string, icon: string) => {
        setToolGroups(prev => {
            if (prev.some(g => g.title.toLowerCase() === title.toLowerCase())) {
                throw new Error(`Eine Gruppe mit dem Titel "${title}" existiert bereits.`);
            }
            const newGroup: ToolGroup = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                title,
                icon,
                color: GROUP_COLORS[prev.length % GROUP_COLORS.length],
                links: []
            };
            return [...prev, newGroup];
        });
    }, [setToolGroups]);

    const updateGroup = useCallback((groupId: string, newTitle: string, newIcon: string) => {
        setToolGroups(prev => {
            if (prev.some(g => g.title.toLowerCase() === newTitle.toLowerCase() && g.id !== groupId)) {
                throw new Error(`Eine Gruppe mit dem Titel "${newTitle}" existiert bereits.`);
            }
            return prev.map(g => (g.id === groupId ? { ...g, title: newTitle, icon: newIcon } : g));
        });
    }, [setToolGroups]);

    const deleteGroup = useCallback((groupId: string) => {
        setToolGroups(prev => prev.filter(g => g.id !== groupId));
    }, [setToolGroups]);

    const addLink = useCallback((groupId: string, link: ToolLink) => {
        setToolGroups(prev => prev.map(g => g.id === groupId ? { ...g, links: [...g.links, link] } : g));
    }, [setToolGroups]);

    const updateLink = useCallback((originalGroupId: string, linkToUpdate: ToolLink, newLink: ToolLink, newGroupId?: string) => {
        const destinationGroupId = newGroupId || originalGroupId;

        setToolGroups(prev => {
            let groupsAfterRemoval = prev;
            // If moving group, remove from original first
            if (originalGroupId !== destinationGroupId) {
                groupsAfterRemoval = prev.map(g => {
                    if (g.id === originalGroupId) {
                        return { ...g, links: g.links.filter(l => l.url !== linkToUpdate.url) };
                    }
                    return g;
                });
            }

            // Add/update in the destination group
            return groupsAfterRemoval.map(g => {
                if (g.id === destinationGroupId) {
                    const newLinks = originalGroupId === destinationGroupId
                        ? g.links.map(l => l.url === linkToUpdate.url ? newLink : l)
                        : [...g.links, newLink];
                    return { ...g, links: newLinks };
                }
                return g;
            });
        });
    }, [setToolGroups]);

    const deleteLink = useCallback((groupId: string, url: string) => {
        setToolGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                return { ...g, links: g.links.filter(l => l.url !== url) };
            }
            return g;
        }));
    }, [setToolGroups]);

    const reorderGroups = useCallback((groups: ToolGroup[]) => {
        setToolGroups(groups);
    }, [setToolGroups]);

    const value = useMemo(() => ({
        toolGroups,
        addGroup,
        updateGroup,
        deleteGroup,
        addLink,
        updateLink,
        deleteLink,
        reorderGroups,
        setToolGroups
    }), [toolGroups, addGroup, updateGroup, deleteGroup, addLink, updateLink, deleteLink, reorderGroups, setToolGroups]);

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
