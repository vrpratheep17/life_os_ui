# Development data

`npm run dev` starts MSW 2 before rendering the application. API requests use local mock handlers; weather does not contact an external service.

| Endpoint | Fixture |
| --- | --- |
| `/api/dashboard/daily-score` | `src/features/dashboard/mocks/fixtures.ts` (50%) |
| `/api/dashboard/daily-steps` | Same file (5,500 steps toward a 7,000 step goal) |
| `/api/dashboard/wellbeing` | Same file (six percentages for the indicators around the avatar) |
| `/api/dashboard/daily-overview` | Same file (goal and 3 of 6 tasks complete) |
| `/api/weather` | `src/features/weather/mocks/fixtures.ts` (London, 18°C, partly cloudy) |

Add future development responses to the relevant feature's `mocks` folder and register them in `src/app/mocks/handlers.ts`. Unhandled `/api/` requests are reported as errors. Static assets pass through.

Production builds require a backend for these endpoints. To keep a build or preview mocked, set `VITE_ENABLE_MOCKS=true` before building; see `.env.example`. Regenerate the worker after upgrading MSW with `npx msw init public --save`.
