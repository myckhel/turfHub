import {
  AppstoreOutlined,
  ControlOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  HistoryOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { Badge, Menu, MenuProps } from 'antd';
import { memo } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { useTurfStore } from '../../stores/turf.store';

interface SidebarMenuProps {
  onClick?: () => void;
  mode?: 'vertical' | 'horizontal' | 'inline';
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
}

export const SidebarMenu = memo<SidebarMenuProps>(({ onClick, mode = 'inline', theme = 'dark', className = '', style }) => {
  const { isTurfManager, isTurfAdmin, isTurfOwner, canAccessSuperAdmin } = usePermissions();
  const { selectedTurf } = useTurfStore();

  const getMenuItems = (): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: <Link href={route('dashboard')}>Dashboard</Link>,
      },
      {
        key: 'turfs',
        icon: <AppstoreOutlined />,
        label: <Link href={route('web.turfs.index')}>Browse Turfs</Link>,
      },
      {
        key: 'wallet',
        icon: <WalletOutlined />,
        label: <Link href={route('web.wallet.index')}>My Wallet</Link>,
      },
    ];

    // Add turf-specific menu items if there's a selected turf
    if (selectedTurf) {
      items.push(
        ...[
          {
            key: 'match-sessions',
            icon: <TeamOutlined />,
            label: <Link href={route('web.turfs.match-sessions.index', { turf: selectedTurf.id })}>Match Sessions</Link>,
          },
          {
            key: 'betting',
            icon: <DollarCircleOutlined />,
            label: 'Betting',
            children: [
              {
                key: 'betting-markets',
                icon: <TrophyOutlined />,
                label: <Link href={route('web.turfs.betting.index', { turf: selectedTurf.id })}>Betting Markets</Link>,
              },
              {
                key: 'betting-history',
                icon: <HistoryOutlined />,
                label: <Link href={route('web.turfs.betting.history', { turf: selectedTurf.id })}>Betting History</Link>,
              },
            ],
          },
          {
            key: 'tournaments',
            icon: <TrophyOutlined />,
            label: (
              <Badge count="Preview" size="small" color="blue" offset={[10, 0]}>
                <Link href={route('web.turfs.tournaments.index', { turf: selectedTurf.id })}>Tournaments</Link>
              </Badge>
            ),
          },
        ],
      );
    }

    if (isTurfManager() || isTurfAdmin() || isTurfOwner()) {
      // Add management items for turf managers/admins if they have a selected turf
      if (selectedTurf) {
        items.push({
          key: 'players',
          icon: <UserOutlined />,
          label: <Link href={route('web.turfs.players.index', { turf: selectedTurf.id })}>Players</Link>,
        });
        items.push({
          key: 'turf-betting-admin',
          icon: <DollarCircleOutlined />,
          label: 'Admin Betting',
          children: [
            {
              key: 'turf-betting-management',
              label: <Link href={route('web.turfs.betting.admin.management', { turf: selectedTurf.id })}>Management</Link>,
            },
            {
              key: 'turf-betting-fixtures',
              label: <Link href={route('web.turfs.betting.admin.fixtures', { turf: selectedTurf.id })}>Fixtures</Link>,
            },
          ],
        });
      }
    }

    if (isTurfAdmin()) {
      items.push(
        {
          key: 'users',
          icon: <UserOutlined />,
          label: <Link href={route('dashboard')}>Users</Link>,
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: <Link href={route('dashboard')}>Settings</Link>,
        },
      );
    }

    // Super Admin menu items
    if (canAccessSuperAdmin()) {
      items.push({
        key: 'admin',
        icon: <ControlOutlined />,
        label: 'Admin Panel',
        children: [
          {
            key: 'admin-dashboard',
            icon: <DashboardOutlined />,
            label: <Link href={route('web.admin.dashboard')}>Admin Dashboard</Link>,
          },
          {
            key: 'admin-betting',
            icon: <DollarCircleOutlined />,
            label: <Link href={route('web.admin.betting')}>Betting Management</Link>,
          },
        ],
      });
    }

    return items;
  };

  return <Menu mode={mode} items={getMenuItems()} className={className} style={style} onClick={onClick} theme={theme} />;
});

SidebarMenu.displayName = 'SidebarMenu';

export default SidebarMenu;
