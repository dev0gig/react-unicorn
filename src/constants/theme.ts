export const GROUP_COLOR_OPTIONS = [
    { key: 'orange', label: 'Orange', hex: '#f97316' },
    { key: 'rot', label: 'Rot', hex: '#ef4444' },
    { key: 'gelb', label: 'Gelb', hex: '#eab308' },
    { key: 'grün', label: 'Grün', hex: '#22c55e' },
    { key: 'blau', label: 'Blau', hex: '#3b82f6' },
    { key: 'weinrot', label: 'Weinrot', hex: '#881337' },
    { key: 'grau', label: 'Grau', hex: '#6b7280' },
    { key: 'braun', label: 'Braun', hex: '#92400e' },
] as const;

export type GroupColorKey = typeof GROUP_COLOR_OPTIONS[number]['key'];

export const getGroupColorHex = (key: string | undefined): string | undefined => {
    const found = GROUP_COLOR_OPTIONS.find(c => c.key === key);
    return found?.hex;
};

// Legacy export for backwards compatibility
export const GROUP_COLORS = GROUP_COLOR_OPTIONS.map(c => c.key);
