import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-cream pb-[56px] overflow-x-hidden">
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
