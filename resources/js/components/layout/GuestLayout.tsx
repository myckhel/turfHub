import { MenuOutlined } from '@ant-design/icons';
import { Link } from '@inertiajs/react';
import { Button, Layout } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';

const { Header, Content, Footer } = Layout;

interface GuestLayoutProps {
  children: React.ReactNode;
}

export const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
  }, []);

  return (
    <Layout className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <Header className="turf-header fixed top-0 z-50 w-full border-b px-4 shadow-sm backdrop-blur-md md:px-8">
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

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 md:flex">
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

          {/* Desktop Auth buttons and Theme Toggle */}
          <div className="hidden items-center space-x-3 md:flex">
            <ThemeToggle size="small" />
            <Link href={route('login')}>
              <Button type="text" className="turf-auth-link transition-colors hover:opacity-80">
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

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle size="small" />
            <Button type="text" icon={<MenuOutlined />} onClick={toggleMobileMenu} className="turf-nav-link p-2" aria-label="Toggle mobile menu" />
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="absolute top-full left-0 w-full border-t bg-white shadow-lg md:hidden dark:bg-gray-800">
            <div className="flex flex-col space-y-1 p-4">
              {/* Mobile Navigation Links */}
              <Link
                href={route('welcome')}
                className="turf-nav-link block rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 hover:opacity-80 dark:hover:bg-gray-700"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                href={route('welcome')}
                className="turf-nav-link block rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 hover:opacity-80 dark:hover:bg-gray-700"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              <Link
                href={route('welcome')}
                className="turf-nav-link block rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 hover:opacity-80 dark:hover:bg-gray-700"
                onClick={closeMobileMenu}
              >
                Pricing
              </Link>
              <Link
                href={route('welcome')}
                className="turf-nav-link block rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 hover:opacity-80 dark:hover:bg-gray-700"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>

              {/* Mobile Auth Buttons */}
              <div className="mt-4 flex flex-col space-y-2 border-t pt-4">
                <Link href={route('login')} onClick={closeMobileMenu}>
                  <Button type="text" className="turf-auth-link w-full transition-colors hover:opacity-80">
                    Sign In
                  </Button>
                </Link>
                <Link href={route('register')} onClick={closeMobileMenu}>
                  <Button
                    type="primary"
                    className="w-full border-none shadow-lg transition-all duration-200 hover:shadow-xl"
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
          </div>
        )}
      </Header>

      {/* Main Content - Add top padding to account for fixed header */}
      <Content className="flex-1 bg-white pt-16 dark:bg-gray-900">{children}</Content>

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
