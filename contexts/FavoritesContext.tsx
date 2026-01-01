import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../src/hooks/useLocalStorage';
import { ToolLink, FavoritesContextType } from '../types';

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
    return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useLocalStorage<ToolLink[]>('favorites', []);

    const addFavorite = useCallback((link: ToolLink) => {
        setFavorites(current => current.some(fav => fav.url === link.url) ? current : [...current, link]);
    }, [setFavorites]);

    const removeFavorite = useCallback((url: string) => {
        setFavorites(current => current.filter(fav => fav.url !== url));
    }, [setFavorites]);

    const isFavorite = useCallback((url: string) => {
        return favorites.some(fav => fav.url === url);
    }, [favorites]);

    const value = useMemo(() => ({
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        setFavorites
    }), [favorites, addFavorite, removeFavorite, isFavorite, setFavorites]);

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};
