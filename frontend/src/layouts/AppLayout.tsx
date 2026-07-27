import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import TopHeader from '../components/TopHeader';

export default function AppLayout() {
  const { pathname } = useLocation();
  // En el preview la barra inferior son las acciones de la planificación
  const enPreview = pathname.startsWith('/preview');

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col overflow-x-hidden">
      <TopHeader />
      <main className={`flex-1 ${enPreview ? '' : 'pb-[84px]'}`}>
        <Outlet />
      </main>
      {!enPreview && <BottomNav />}
    </div>
  );
}
