import React, { useState, useEffect } from 'react';

// WMO Weather interpretation codes mapping
const WEATHER_CODES: { [key: number]: { text: string; icon: string; background: string } } = {
    0: { text: 'Klarer Himmel', icon: 'wb_sunny', background: 'bg-gradient-to-br from-sky-400 to-blue-600' },
    1: { text: 'Leicht bewölkt', icon: 'wb_cloudy', background: 'bg-gradient-to-br from-slate-400 to-gray-600' },
    2: { text: 'Teilweise bewölkt', icon: 'wb_cloudy', background: 'bg-gradient-to-br from-slate-500 to-gray-700' },
    3: { text: 'Bedeckt', icon: 'cloud', background: 'bg-gradient-to-br from-gray-600 to-slate-800' },
    45: { text: 'Nebel', icon: 'foggy', background: 'bg-gradient-to-br from-slate-400 to-gray-500' },
    48: { text: 'Reifnebel', icon: 'ac_unit', background: 'bg-gradient-to-br from-slate-300 to-gray-400' },
    51: { text: 'Leichter Nieselregen', icon: 'grain', background: 'bg-gradient-to-br from-blue-300 to-gray-500' },
    53: { text: 'Mäßiger Nieselregen', icon: 'grain', background: 'bg-gradient-to-br from-blue-400 to-gray-600' },
    55: { text: 'Starker Nieselregen', icon: 'grain', background: 'bg-gradient-to-br from-blue-500 to-gray-700' },
    61: { text: 'Leichter Regen', icon: 'rainy', background: 'bg-gradient-to-br from-sky-500 to-slate-700' },
    63: { text: 'Mäßiger Regen', icon: 'rainy', background: 'bg-gradient-to-br from-sky-600 to-slate-800' },
    65: { text: 'Starker Regen', icon: 'rainy', background: 'bg-gradient-to-br from-sky-700 to-slate-900' },
    80: { text: 'Leichte Schauer', icon: 'rainy', background: 'bg-gradient-to-br from-sky-500 to-slate-700' },
    81: { text: 'Mäßige Schauer', icon: 'rainy', background: 'bg-gradient-to-br from-sky-600 to-slate-800' },
    82: { text: 'Starke Schauer', icon: 'rainy', background: 'bg-gradient-to-br from-sky-700 to-slate-900' },
    71: { text: 'Leichter Schneefall', icon: 'ac_unit', background: 'bg-gradient-to-br from-blue-200 to-slate-400' },
    73: { text: 'Mäßiger Schneefall', icon: 'ac_unit', background: 'bg-gradient-to-br from-blue-300 to-slate-500' },
    75: { text: 'Starker Schneefall', icon: 'ac_unit', background: 'bg-gradient-to-br from-blue-400 to-slate-600' },
    95: { text: 'Gewitter', icon: 'thunderstorm', background: 'bg-gradient-to-br from-slate-700 to-indigo-900' },
    96: { text: 'Gewitter mit Hagel', icon: 'thunderstorm', background: 'bg-gradient-to-br from-slate-800 to-indigo-950' },
    99: { text: 'Gewitter mit starkem Hagel', icon: 'thunderstorm', background: 'bg-gradient-to-br from-slate-900 to-indigo-950' },
};
const UNKNOWN_WEATHER = { text: 'Unbekannt', icon: 'help_outline', background: 'bg-gray-700' };

interface WeatherData {
    current: {
        temperature: number;
        weatherCode: number;
        windSpeed: number;
    };
    daily: {
        time: string[];
        weatherCode: number[];
        tempMax: number[];
        tempMin: number[];
    };
}

interface WeatherModalProps {
    onClose: () => void;
}

const WeatherModal: React.FC<WeatherModalProps> = ({ onClose }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            try {
                // Vienna, Austria coordinates
                const lat = 48.21;
                const lon = 16.37;
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe/Vienna&forecast_days=6`;
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Wetterdaten konnten nicht geladen werden.');
                }
                const data = await response.json();

                setWeather({
                    current: {
                        temperature: Math.round(data.current.temperature_2m),
                        weatherCode: data.current.weather_code,
                        windSpeed: Math.round(data.current.wind_speed_10m),
                    },
                    daily: {
                        time: data.daily.time,
                        weatherCode: data.daily.weather_code,
                        tempMax: data.daily.temperature_2m_max,
                        tempMin: data.daily.temperature_2m_min,
                    },
                });

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    const currentWeatherData = weather ? (WEATHER_CODES[weather.current.weatherCode] || UNKNOWN_WEATHER) : UNKNOWN_WEATHER;

    const renderContent = () => {
        if (loading) {
            return <div className="flex flex-col items-center justify-center h-full text-white/80"><i className="material-icons text-5xl animate-spin">sync</i><p className="mt-2">Lade Wetterdaten...</p></div>;
        }
        if (error) {
            return <div className="flex flex-col items-center justify-center h-full text-red-300 p-4 text-center"><i className="material-icons text-5xl">error_outline</i><p className="mt-2">{error}</p></div>;
        }
        if (!weather) {
            return <div className="flex items-center justify-center h-full text-white/80">Keine Wetterdaten verfügbar.</div>;
        }

        const todayForecast = {
            max: Math.round(weather.daily.tempMax[0]),
            min: Math.round(weather.daily.tempMin[0]),
        };

        return (
            <>
                <div className="text-center p-6 border-b border-white/20">
                    <p className="font-medium">Wien, Österreich</p>
                    <div className="flex items-center justify-center gap-4 my-2">
                         <i className="material-icons text-7xl">{currentWeatherData.icon}</i>
                         <h2 className="text-7xl font-bold">{weather.current.temperature}°</h2>
                    </div>
                    <p className="text-xl capitalize">{currentWeatherData.text}</p>
                    <div className="flex justify-center gap-6 mt-4 text-sm">
                        <span>Max: {todayForecast.max}°</span>
                        <span>Min: {todayForecast.min}°</span>
                        <span>Wind: {weather.current.windSpeed} km/h</span>
                    </div>
                </div>
                <div className="p-6">
                    <h3 className="text-sm font-bold uppercase mb-3">5-Tage-Vorschau</h3>
                    <div className="flex justify-between">
                        {weather.daily.time.slice(1).map((time, index) => {
                            const date = new Date(time);
                            const dayWeather = WEATHER_CODES[weather.daily.weatherCode[index + 1]] || UNKNOWN_WEATHER;
                            return (
                                <div key={time} className="flex flex-col items-center gap-2 text-center w-1/5">
                                    <p className="text-sm font-semibold">{date.toLocaleDateString('de-DE', { weekday: 'short' })}</p>
                                    <i className="material-icons text-3xl">{dayWeather.icon}</i>
                                    <p className="text-sm">
                                        {Math.round(weather.daily.tempMax[index + 1])}°
                                        <span className="opacity-70"> / {Math.round(weather.daily.tempMin[index + 1])}°</span>
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </>
        );
    }

    return (
        <div
            className={`rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-white/20 text-white transition-colors duration-500 ${currentWeatherData.background}`}
            onClick={(e) => e.stopPropagation()}
        >
           {renderContent()}
        </div>
    );
};

export default WeatherModal;
