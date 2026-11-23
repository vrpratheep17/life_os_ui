import { dashboardHandlers } from '../../features/dashboard/mocks'
import { weatherHandlers } from '../../features/weather/mocks'

export const handlers = [...dashboardHandlers, ...weatherHandlers]
