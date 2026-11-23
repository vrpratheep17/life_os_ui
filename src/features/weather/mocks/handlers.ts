import { delay, http, HttpResponse } from 'msw'
import { weatherFixture } from './fixtures'

export const weatherHandlers = [
  http.get('/api/weather', async () => {
    await delay(250)
    return HttpResponse.json(weatherFixture)
  }),
]
