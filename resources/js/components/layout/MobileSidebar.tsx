import { Link } from '@inertiajs/react';
import { Drawer } from 'antd';
import { memo } from 'react';
import { useLayoutStore } from '../../stores';
import SidebarMenu from './SidebarMenu';

export const MobileSidebar = memo(() => {
  const { mobileMenuOpen, setMobileMenuOpen } = useLayoutStore();

  return (
    <Drawer
      title={
        <Link href={route('dashboard')} className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
            <span className="text-sm font-bold text-white">TH</span>
          </div>
          <span className="text-lg font-bold text-white">TurfMate</span>
        </Link>
      }
      placement="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      width={280}
      className="turf-mobile-sidebar"
      headerStyle={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'var(--color-turf-green)',
      }}
      bodyStyle={{
        background: 'linear-gradient(180deg, var(--color-turf-green), rgba(var(--color-turf-green-rgb, 34, 197, 94), 0.95))',
        padding: 0,
      }}
    >
      <SidebarMenu onClick={() => setMobileMenuOpen(false)} className="turf-sidebar-menu border-r-0 bg-transparent" />
    </Drawer>
  );
});

MobileSidebar.displayName = 'MobileSidebar';

export default MobileSidebar;
