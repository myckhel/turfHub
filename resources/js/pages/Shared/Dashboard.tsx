import React from 'react';
import MobileLayout from '../../components/layout/MobileLayout';
import { PageTransition } from '../../components/shared/GSAPAnimations';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

interface DashboardProps {
  props: {};
}

const Dashboard: React.FC<DashboardProps> = () => {
  const { user } = useAuth();

  return (
    <PageTransition>
      <MobileLayout
        activeTab="home"
        title="Welcome back!"
        subtitle="Ready to play?"
        headerRightContent={<ThemeToggle size="small" />}
        backgroundVariant="gradient"
      >
        <h1 className="mb-4 text-center">Dashboard {user?.name}</h1>
      </MobileLayout>
    </PageTransition>
  );
};

export default Dashboard;
