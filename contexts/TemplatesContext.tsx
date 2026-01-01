import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../src/hooks/useLocalStorage';
import { Template, TemplateGroup, TemplatesContextType } from '../types';
import { initialTemplateGroups } from '../data/initialTemplates';

const TemplatesContext = createContext<TemplatesContextType | null>(null);

export const useTemplates = () => {
    const context = useContext(TemplatesContext);
    if (!context) throw new Error('useTemplates must be used within a TemplatesProvider');
    return context;
};

export const TemplatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [templateGroups, setTemplateGroups] = useLocalStorage<TemplateGroup[]>('templates', initialTemplateGroups);

    const addTemplate = useCallback((category: string, title: string, content: string) => {
        setTemplateGroups(prev => {
            const categoryExists = prev.some(g => g.category === category);
            const newTemplate = { id: Date.now().toString(), title, content };
            if (categoryExists) {
                return prev.map(g => g.category === category ? { ...g, templates: [...g.templates, newTemplate] } : g);
            } else {
                return [...prev, { category, templates: [newTemplate] }];
            }
        });
    }, [setTemplateGroups]);

    const updateTemplate = useCallback((category: string, template: Omit<Template, 'id'>, templateId: string) => {
        setTemplateGroups(prev => prev.map(g => {
            if (g.category === category) {
                return { ...g, templates: g.templates.map(t => t.id === templateId ? { ...template, id: templateId } : t) };
            }
            return g;
        }));
    }, [setTemplateGroups]);

    const deleteTemplate = useCallback((category: string, templateId: string) => {
        setTemplateGroups(currentGroups => currentGroups.map(group => {
            if (group.category === category) {
                return { ...group, templates: group.templates.filter(t => t.id !== templateId) };
            }
            return group;
        }).filter(group => group.templates.length > 0));
    }, [setTemplateGroups]);

    const getCategories = useCallback(() => templateGroups.map(g => g.category), [templateGroups]);

    const value = useMemo(() => ({
        templateGroups,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getCategories,
        setTemplateGroups
    }), [templateGroups, addTemplate, updateTemplate, deleteTemplate, getCategories, setTemplateGroups]);

    return (
        <TemplatesContext.Provider value={value}>
            {children}
        </TemplatesContext.Provider>
    );
};
