import { Link } from '@inertiajs/react';
import { Button, Layout } from 'antd';
import React from 'react';
import ThemeToggle from '../ui/ThemeToggle';

const { Header, Content, Footer } = Layout;

interface GuestLayoutProps {
  children: React.ReactNode;
}

export const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
  return (
    <Layout className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <Header className="turf-header border-b px-4 md:px-8">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link href={route('welcome')} className="flex items-center space-x-2 transition-transform hover:scale-105">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--color-turf-green), var(--color-turf-light))' }}
            >
              <span className="text-sm font-bold text-white">TH</span>
            </div>
            <span className="turf-brand-text text-xl font-bold">TurfMate</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            <Link href={route('welcome')} className="turf-nav-link transition-colors hover:opacity-80">
              Home
            </Link>
            <Link href={route('welcome')} className="turf-nav-link transition-colors hover:opacity-80">
              About
            </Link>
            <Link href={route('welcome')} className="turf-nav-link transition-colors hover:opacity-80">
              Pricing
            </Link>
            <Link href={route('welcome')} className="turf-nav-link transition-colors hover:opacity-80">
              Contact
            </Link>
          </nav>

          {/* Auth buttons and Theme Toggle */}
          <div className="flex items-center space-x-4">
            <ThemeToggle size="small" />
            <Link href={route('login')}>
              <Button type="text" className="turf-auth-link hidden transition-colors hover:opacity-80 sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link href={route('register')}>
              <Button
                type="primary"
                className="border-none shadow-lg transition-all duration-200 hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, var(--color-turf-green), var(--color-turf-light))',
                  color: 'white',
                }}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </Header>

      {/* Main Content */}
      <Content className="flex-1 bg-white dark:bg-gray-900">{children}</Content>

      {/* Footer */}
      <Footer className="turf-footer text-white">
        <div className="mx-auto max-w-7xl pt-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Company info */}
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 flex items-center space-x-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
                  style={{ background: 'linear-gradient(135deg, var(--color-turf-green), var(--color-turf-light))' }}
                >
                  <span className="text-sm font-bold text-white">TH</span>
                </div>
                <span className="text-xl font-bold text-white">TurfMate</span>
              </div>
              <p style={{ color: 'var(--color-medium-gray)' }}>
                The premier platform for turf booking and sports facility management. Connect with players, manage facilities, and grow your sports
                community.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
              <ul className="space-y-2" style={{ color: 'var(--color-medium-gray)' }}>
                <li>
                  <Link href={route('welcome')} className="transition-colors hover:text-white" style={{ color: 'inherit' }}>
                    About
                  </Link>
                </li>
                <li>
                  <Link href={route('welcome')} className="transition-colors hover:text-white" style={{ color: 'inherit' }}>
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href={route('welcome')} className="transition-colors hover:text-white" style={{ color: 'inherit' }}>
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white" style={{ color: 'inherit' }}>
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Legal</h3>
              <ul className="space-y-2" style={{ color: 'var(--color-medium-gray)' }}>
                <li>
                  <Link href="#" className="transition-colors hover:text-white" style={{ color: 'inherit' }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white" style={{ color: 'inherit' }}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white" style={{ color: 'inherit' }}>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 text-center" style={{ borderColor: 'var(--color-light-slate)', color: 'var(--color-medium-gray)' }}>
            <p>&copy; 2025 TurfMate. All rights reserved.</p>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};
