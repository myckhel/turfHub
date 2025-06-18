import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface DashboardProps {
  props: {};
}

const Dashboard: React.FC<DashboardProps> = () => {
  const { user } = useAuth();

  return <h1 className="mb-4 text-center">Dashboard {user?.name}</h1>;
};

export default Dashboard;
