export type CurrentWeather = { temperatureC: number; condition: string; symbol: string }

export function describeWeather(code: number, isDay: boolean) {
  if (code === 0) return { condition: 'Clear sky', symbol: isDay ? '☀' : '☾' }
  if (code <= 2) return { condition: 'Partly cloudy', symbol: '☁' }
  if (code === 3) return { condition: 'Overcast', symbol: '☁' }
  if (code === 45 || code === 48) return { condition: 'Foggy', symbol: '≋' }
  if ([51,53,55,56,57].includes(code)) return { condition: 'Drizzle', symbol: '☂' }
  if ([71,73,75,77,85,86].includes(code)) return { condition: 'Snow', symbol: '❄' }
  if (code >= 95) return { condition: 'Thunderstorm', symbol: 'ϟ' }
  if ([61,63,65,66,67,80,81,82].includes(code)) return { condition: 'Rain', symbol: '☂' }
  return { condition: 'Current weather', symbol: '☁' }
}
