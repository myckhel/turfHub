import type { SharedData } from '@/types';
import { CloseOutlined, MenuOutlined } from '@ant-design/icons';
import { Link, usePage } from '@inertiajs/react';
import { Button, Layout } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { UserMenu } from '../auth/UserMenu';
import ThemeToggle from '../shared/ThemeToggle';

const { Header, Content, Footer } = Layout;

interface GuestLayoutProps {
  children: React.ReactNode;
}

export const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
  const { name } = usePage<SharedData>().props;

  return (
    <Layout className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <GuestHeader />

      {/* Main Content - Add top padding to account for fixed header */}
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
                <span className="text-xl font-bold text-white">{name}</span>
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
            <p>&copy; 2025 {name}. All rights reserved.</p>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

const GuestHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { url, props } = usePage<SharedData>();

  const isLoggedIn = !!props?.auth?.user;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [url]);

  return (
    <Header
      className="turf-header fixed top-0 z-50 w-full px-1 shadow-lg backdrop-blur-md transition-all duration-300"
      style={{
        background: 'var(--color-turf-green)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        height: '72px',
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between sm:px-6 lg:px-8 xl:px-4">
        {/* Logo */}
        <Link href={route('welcome')} className="flex items-center space-x-3 transition-transform hover:scale-105">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))' }}
          >
            <span className="text-sm font-bold text-white">TM</span>
          </div>
          <span className="text-xl font-bold text-white">{props.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-8 md:flex lg:space-x-10">
          <Link href={route('welcome')} className="font-medium text-white transition-all hover:scale-105 hover:text-white/80">
            Home
          </Link>
          <Link href={route('welcome')} className="font-medium text-white transition-all hover:scale-105 hover:text-white/80">
            About
          </Link>
          <Link href={route('welcome')} className="font-medium text-white transition-all hover:scale-105 hover:text-white/80">
            Pricing
          </Link>
          <Link href={route('welcome')} className="font-medium text-white transition-all hover:scale-105 hover:text-white/80">
            Contact
          </Link>
        </nav>

        {/* Desktop Auth buttons and Theme Toggle */}
        <div className="hidden items-center space-x-4 md:flex lg:space-x-5">
          <ThemeToggle size="small" className="opacity-70 transition-all hover:scale-110 hover:opacity-100" />

          {isLoggedIn ? (
            <>
              <Link href={route('dashboard')}>
                <Button type="text" className="h-10 border-none px-4 font-medium text-white transition-all hover:scale-105 hover:bg-white/10">
                  Dashboard
                </Button>
              </Link>
              <UserMenu placement="bottomRight" />
            </>
          ) : (
            <>
              <Link href={route('login')}>
                <Button type="text" className="h-10 border-none px-4 font-medium text-white transition-all hover:scale-105 hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href={route('register')}>
                <Button
                  type="primary"
                  className="h-10 rounded-lg border-none bg-white px-6 font-semibold text-green-600 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-white/90 hover:shadow-xl"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Auth and Menu Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3 md:hidden">
          <ThemeToggle size="small" className="opacity-60 transition-all hover:scale-110 hover:opacity-100" />

          {isLoggedIn ? (
            <UserMenu placement="bottomRight" />
          ) : (
            <Link href={route('login')}>
              <Button type="text" className="h-9 border-none px-3 py-1 text-sm font-medium text-white hover:bg-white/10 active:scale-95">
                Sign In
              </Button>
            </Link>
          )}

          <Button
            type="text"
            icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            onClick={toggleMobileMenu}
            className="flex h-10 w-10 items-center justify-center border-none p-2 text-white transition-all hover:scale-110 hover:bg-white/10 active:scale-95"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          />
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full left-0 w-full border-t shadow-2xl backdrop-blur-sm duration-200 animate-in slide-in-from-top-2 md:hidden"
          style={{
            background: 'linear-gradient(180deg, var(--color-turf-green) 0%, rgba(27, 94, 32, 0.95) 100%)',
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex flex-col px-6 py-6 sm:px-8">
            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              <Link
                href={route('welcome')}
                className="block rounded-xl px-4 py-4 font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] active:bg-white/20"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                href={route('welcome')}
                className="block rounded-xl px-4 py-4 font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] active:bg-white/20"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              <Link
                href={route('welcome')}
                className="block rounded-xl px-4 py-4 font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] active:bg-white/20"
                onClick={closeMobileMenu}
              >
                Pricing
              </Link>
              <Link
                href={route('welcome')}
                className="block rounded-xl px-4 py-4 font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] active:bg-white/20"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
            </div>

            {/* Mobile Auth Buttons - Only show for guests */}
            {!isLoggedIn && (
              <div className="mt-8 flex flex-col space-y-4 border-t pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <Link href={route('login')} onClick={closeMobileMenu} className="w-full">
                  <Button
                    type="text"
                    className="h-14 w-full rounded-xl border border-white/20 font-semibold text-white transition-all hover:border-white/40 hover:bg-white/10 active:scale-[0.98]"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href={route('register')} onClick={closeMobileMenu} className="w-full">
                  <Button
                    type="primary"
                    className="h-14 w-full rounded-xl border-none bg-white font-bold text-green-600 shadow-lg transition-all duration-200 hover:bg-white/90 hover:shadow-xl active:scale-[0.98]"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Dashboard Link - Only show for authenticated users */}
            {isLoggedIn && (
              <div className="mt-8 border-t pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <Link href={route('dashboard')} onClick={closeMobileMenu} className="w-full">
                  <Button
                    type="primary"
                    className="h-14 w-full rounded-xl border-none bg-white font-bold text-green-600 shadow-lg transition-all duration-200 hover:bg-white/90 hover:shadow-xl active:scale-[0.98]"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </Header>
  );
};
