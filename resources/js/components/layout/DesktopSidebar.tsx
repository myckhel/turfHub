import { Link } from '@inertiajs/react';
import { Layout } from 'antd';
import { memo } from 'react';
import SidebarMenu from './SidebarMenu';

const { Sider } = Layout;

interface DesktopSidebarProps {
  collapsed: boolean;
}

export const DesktopSidebar = memo<DesktopSidebarProps>(({ collapsed }) => {
  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      breakpoint="lg"
      collapsedWidth={80}
      className="turf-sidebar fixed left-0 z-40 h-screen transition-transform duration-300"
      width={280}
      style={{
        background: 'linear-gradient(180deg, var(--color-turf-green), rgba(var(--color-turf-green-rgb, 34, 197, 94), 0.95))',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <Link href={route('dashboard')} className="flex items-center space-x-2 transition-transform hover:scale-105">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
            <span className="text-sm font-bold text-white">TH</span>
          </div>
          {!collapsed && <span className="text-lg font-bold text-white">TurfMate</span>}
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
        <SidebarMenu
          className="turf-sidebar-menu border-r-0 bg-transparent"
          style={{
            background: 'transparent',
          }}
        />
      </div>
    </Sider>
  );
});

DesktopSidebar.displayName = 'DesktopSidebar';

export default DesktopSidebar;
