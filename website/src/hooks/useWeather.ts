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

async function fetchWeatherForCoords(lat: number, lon: number): Promise<WeatherData> {
  const [geo, wx] = await Promise.all([
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`).then(r => r.json()),
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`).then(r => r.json()),
  ]);
  const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || "here";
  const { temperature, weathercode } = wx.current_weather;
  const { label, icon } = describeWMO(weathercode);
  return { temp: Math.round(temperature), condition: label, icon, city };
}

async function fetchWeatherForLocation(query: string): Promise<WeatherData> {
  const results = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  ).then(r => r.json());

  if (!results?.length) throw new Error("Location not found");

  const { lat, lon, display_name } = results[0];
  const cityName = display_name.split(",")[0].trim();

  const wx = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
  ).then(r => r.json());

  const { temperature, weathercode } = wx.current_weather;
  const { label, icon } = describeWMO(weathercode);
  return { temp: Math.round(temperature), condition: label, icon, city: cityName };
}

export function useWeather(manualLocation?: string) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolve = (data: WeatherData) => { if (!cancelled) { setWeather(data); setError(false); } };
    const reject  = ()                  => { if (!cancelled) { setWeather(null); setError(true);  } };

    if (manualLocation?.trim()) {
      fetchWeatherForLocation(manualLocation.trim()).then(resolve).catch(reject);
      return () => { cancelled = true; };
    }

    if (!navigator.geolocation) {
      reject();
      return () => { cancelled = true; };
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        fetchWeatherForCoords(lat, lon).then(resolve).catch(reject);
      },
      reject,
      { timeout: 8000 },
    );

    return () => { cancelled = true; };
  }, [manualLocation]);

  return { weather, error };
}