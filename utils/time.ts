// Converts a "HH:mm" string to the total number of minutes from midnight.
export const timeStringToMinutes = (time: string): number => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

// Converts a total number of minutes from midnight to a "HH:mm" string.
export const minutesToTimeString = (totalMinutes: number): string => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return '--:--';
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = Math.round(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Formats a duration in minutes into a human-readable "X Std. Y Min." string.
export const formatDuration = (totalMinutes: number, withSeconds = false): string => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return '0 Min.';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes * 60) % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} Std.`);
    if (minutes > 0) parts.push(`${minutes} Min.`);
    if (withSeconds && seconds > 0 && hours === 0) parts.push(`${seconds} Sek.`);

    if (parts.length === 0) {
        return withSeconds ? '0 Sek.' : '0 Min.';
    }

    return parts.join(' ');
};

// Gets the current time as a "HH:mm" string.
export const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};
