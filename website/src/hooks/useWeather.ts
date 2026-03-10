import { useEffect, useState } from "react";

export interface WeatherData {
  temp:      number;
  condition: string;
  icon:      string;
  city:      string;
}

function describeWMO(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "clear",         icon: "○" };
  if (code <= 2)  return { label: "partly cloudy", icon: "◑" };
  if (code === 3) return { label: "overcast",      icon: "●" };
  if (code <= 49) return { label: "foggy",         icon: "≋" };
  if (code <= 59) return { label: "drizzle",       icon: "·" };
  if (code <= 69) return { label: "rain",          icon: "▾" };
  if (code <= 79) return { label: "snow",          icon: "✦" };
  if (code <= 84) return { label: "showers",       icon: "▿" };
  if (code <= 99) return { label: "storm",         icon: "⚡" };
  return { label: "unknown", icon: "?" };
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setTimeout(() => setError(true), 0); return; }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const geo  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          ).then(r => r.json());
          const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || "here";

          const wx   = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
          ).then(r => r.json());
          const { temperature, weathercode } = wx.current_weather;
          const { label, icon } = describeWMO(weathercode);

          setWeather({ temp: Math.round(temperature), condition: label, icon, city });
        } catch { setError(true); }
      },
      () => setError(true),
      { timeout: 8000 }
    );
  }, []);

  return { weather, error };
}