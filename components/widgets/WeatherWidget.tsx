import React, { useState, useEffect } from 'react';

// --- WEATHER CONSTANTS ---
const WEATHER_CODES: { [key: number]: { text: string; icon: string; } } = {
    0: { text: 'Klarer Himmel', icon: 'wb_sunny' },
    1: { text: 'Leicht bewölkt', icon: 'wb_cloudy' },
    2: { text: 'Teilweise bewölkt', icon: 'wb_cloudy' },
    3: { text: 'Bedeckt', icon: 'cloud' },
    45: { text: 'Nebel', icon: 'dehaze' },
    48: { text: 'Reifnebel', icon: 'ac_unit' },
    51: { text: 'Nieselregen', icon: 'grain' },
    53: { text: 'Nieselregen', icon: 'grain' },
    55: { text: 'Nieselregen', icon: 'grain' },
    61: { text: 'Regen', icon: 'water_drop' },
    63: { text: 'Regen', icon: 'water_drop' },
    65: { text: 'Regen', icon: 'water_drop' },
    80: { text: 'Schauer', icon: 'water_drop' },
    81: { text: 'Schauer', icon: 'water_drop' },
    82: { text: 'Schauer', icon: 'water_drop' },
    71: { text: 'Schneefall', icon: 'ac_unit' },
    73: { text: 'Schneefall', icon: 'ac_unit' },
    75: { text: 'Schneefall', icon: 'ac_unit' },
    95: { text: 'Gewitter', icon: 'thunderstorm' },
    96: { text: 'Gewitter', icon: 'thunderstorm' },
    99: { text: 'Gewitter', icon: 'thunderstorm' },
};
const UNKNOWN_WEATHER = { text: 'Unbekannt', icon: 'help_outline' };

export const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            try {
                const lat = 48.21, lon = 16.37; // Vienna
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
                const response = await fetch(url);
                if (!response.ok) return;
                const data = await response.json();
                setWeather({
                    temp: Math.round(data.current.temperature_2m),
                    code: data.current.weather_code,
                });
            } catch (err) {
                console.error("Failed to fetch sidebar weather", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, []);

    if (loading) return <div className="text-center text-neutral-400">Wetter wird geladen...</div>;
    if (!weather) return null;

    const weatherInfo = WEATHER_CODES[weather.code] || UNKNOWN_WEATHER;

    return (
        <div className="flex items-center justify-between text-center">
            <div className="text-left">
                <p className="font-semibold text-neutral-100">Wien</p>
                <p className="text-xs text-neutral-400">{weatherInfo.text}</p>
            </div>
            <div className="flex items-center gap-2">
                <i className="material-icons text-3xl text-orange-400">{weatherInfo.icon}</i>
                <span className="text-2xl font-bold text-neutral-100">{weather.temp}°</span>
            </div>
        </div>
    );
};
