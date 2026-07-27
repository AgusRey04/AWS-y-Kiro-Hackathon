import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';

export default function AppLayout() {
  const { pathname } = useLocation();
  // La vista de preview tiene su propio encabezado, evitamos duplicarlo
  const showTopHeader = !pathname.startsWith('/preview');

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col overflow-x-hidden">
      {showTopHeader && <TopHeader />}
      <main className="flex-1 pb-[84px]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
