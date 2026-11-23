import { WelcomePage } from '../features/welcome';
import { DashboardPage } from '../features/dashboard';
import { InstallApp } from '../features/app-install';

export default function App() {
  const page = window.location.pathname.replace(/\/+$/, '') === '/dashboard'
    ? <DashboardPage />
    : <WelcomePage />;
  return <>{page}<InstallApp /></>;
}
