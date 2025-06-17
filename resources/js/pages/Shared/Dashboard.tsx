import { Card, Row, Col, Statistic, Typography, Button, Space } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  TrophyOutlined,
  PlusOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { PageTransition, AnimatedCard } from '../../components/shared/GSAPAnimations';

const { Title } = Typography;

interface DashboardProps {
  stats: {
    totalBookings: number;
    upcomingMatches: number;
    totalRevenue?: number;
    activeUsers?: number;
  };
  recentBookings: Array<{
    id: number;
    field_name: string;
    date: string;
    time: string;
    status: string;
  }>;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, recentBookings }) => {
  const { user } = useAuth();
  const { isPlayer, isManager, isAdmin, canBookField, canManageFields } = usePermissions();

  const getWelcomeMessage = () => {
    if (isAdmin()) return `Welcome back, Admin ${user?.name}!`;
    if (isManager()) return `Welcome back, Manager ${user?.name}!`;
    if (isPlayer()) return `Welcome back, ${user?.name}!`;
    return `Welcome, ${user?.name}!`;
  };

  const getQuickActions = () => {
    const actions = [];

    if (canBookField()) {
      actions.push(
        <Link key="book" href={route('player.bookings.create')}>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Book a Field
          </Button>
        </Link>
      );
    }

    if (canManageFields()) {
      actions.push(
        <Link key="manage" href={route('manager.fields')}>
          <Button icon={<BarChartOutlined />} size="large">
            Manage Fields
          </Button>
        </Link>
      );
    }

    return actions;
  };

  return (
    <PageTransition>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Title level={2} className="mb-2">
            {getWelcomeMessage()}
          </Title>
          <Space size="middle">
            {getQuickActions()}
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard>
              <Card>
                <Statistic
                  title="Total Bookings"
                  value={stats.totalBookings}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#10b981' }}
                />
              </Card>
            </AnimatedCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard>
              <Card>
                <Statistic
                  title="Upcoming Matches"
                  value={stats.upcomingMatches}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#3b82f6' }}
                />
              </Card>
            </AnimatedCard>
          </Col>

          {(isManager() || isAdmin()) && stats.totalRevenue && (
            <Col xs={24} sm={12} lg={6}>
              <AnimatedCard>
                <Card>
                  <Statistic
                    title="Total Revenue"
                    value={stats.totalRevenue}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#f59e0b' }}
                  />
                </Card>
              </AnimatedCard>
            </Col>
          )}

          {isAdmin() && stats.activeUsers && (
            <Col xs={24} sm={12} lg={6}>
              <AnimatedCard>
                <Card>
                  <Statistic
                    title="Active Users"
                    value={stats.activeUsers}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#8b5cf6' }}
                  />
                </Card>
              </AnimatedCard>
            </Col>
          )}
        </Row>

        {/* Recent Activity */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <AnimatedCard>
              <Card title="Recent Bookings" extra={
                <Link href={route(isPlayer() ? 'player.bookings' : 'manager.bookings')}>
                  <Button type="link">View All</Button>
                </Link>
              }>
                <div className="space-y-4">
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{booking.field_name}</div>
                          <div className="text-sm text-gray-500">
                            {booking.date} at {booking.time}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent bookings found.
                    </div>
                  )}
                </div>
              </Card>
            </AnimatedCard>
          </Col>

          <Col xs={24} lg={8}>
            <AnimatedCard>
              <Card title="Quick Links">
                <div className="space-y-3">
                  {isPlayer() && (
                    <>
                      <Link href={route('player.bookings')} className="block">
                        <Button type="text" className="w-full text-left justify-start">
                          <CalendarOutlined className="mr-2" />
                          My Bookings
                        </Button>
                      </Link>
                      <Link href={route('player.matches')} className="block">
                        <Button type="text" className="w-full text-left justify-start">
                          <TrophyOutlined className="mr-2" />
                          My Matches
                        </Button>
                      </Link>
                    </>
                  )}

                  {(isManager() || isAdmin()) && (
                    <>
                      <Link href={route('manager.fields')} className="block">
                        <Button type="text" className="w-full text-left justify-start">
                          <BarChartOutlined className="mr-2" />
                          Manage Fields
                        </Button>
                      </Link>
                      <Link href={route('manager.reports')} className="block">
                        <Button type="text" className="w-full text-left justify-start">
                          <BarChartOutlined className="mr-2" />
                          Reports
                        </Button>
                      </Link>
                    </>
                  )}

                  <Link href={route('profile.edit')} className="block">
                    <Button type="text" className="w-full text-left justify-start">
                      <UserOutlined className="mr-2" />
                      Profile Settings
                    </Button>
                  </Link>
                </div>
              </Card>
            </AnimatedCard>
          </Col>
        </Row>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
