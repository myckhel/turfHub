import { Layout } from 'antd';
import React from 'react';

const { Content } = Layout;

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Layout className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main content area */}
      <Content className="flex items-center justify-center p-4 md:p-6">
        {/* Centered auth card */}
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-2xl backdrop-blur-sm md:max-w-md md:p-8 dark:border-gray-700 dark:bg-gray-800/80">
          {children}
        </div>
      </Content>
    </Layout>
  );
};
