interface WeatherData {
  temp:      number;
  condition: string;
  icon:      string;
  city:      string;
}

function displayTemp(t: number, unit: "C" | "F") {
  return unit === "F" ? `${Math.round(t * 9 / 5 + 32)}°F` : `${t}°C`;
}

interface WeatherWidgetProps {
  weather:  WeatherData | null;
  tempUnit: "C" | "F";
}

export function WeatherWidget({ weather, tempUnit }: WeatherWidgetProps) {
  if (!weather) return (
    <div className="text-[10px] text-muted text-center mt-6">no weather data</div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full pb-4">
      <span className="text-3xl">{weather.icon}</span>
      <span className="text-[1.4rem] text-tx font-light tabular-nums">
        {displayTemp(weather.temp, tempUnit)}
      </span>
      <span className="text-[9px] text-muted tracking-widest">
        {weather.condition} · {weather.city}
      </span>
    </div>
  );
}