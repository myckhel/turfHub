import { Link } from '@inertiajs/react';
import { Button, Layout } from 'antd';
import React from 'react';

const { Header, Content, Footer } = Layout;

interface GuestLayoutProps {
    children: React.ReactNode;
}

export const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
    return (
        <Layout className="min-h-screen">
            {/* Header */}
            <Header className="border-b border-gray-200 bg-white px-4 md:px-8">
                <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
                    {/* Logo */}
                    <Link href={route('welcome')} className="flex items-center space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                            <span className="text-sm font-bold text-white">TH</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">TurfHub</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden items-center space-x-8 md:flex">
                        <Link href={route('welcome')} className="text-gray-600 transition-colors hover:text-gray-900">
                            Home
                        </Link>
                        <Link href={route('welcome')} className="text-gray-600 transition-colors hover:text-gray-900">
                            About
                        </Link>
                        <Link href={route('welcome')} className="text-gray-600 transition-colors hover:text-gray-900">
                            Pricing
                        </Link>
                        <Link href={route('welcome')} className="text-gray-600 transition-colors hover:text-gray-900">
                            Contact
                        </Link>
                    </nav>

                    {/* Auth buttons */}
                    <div className="flex items-center space-x-4">
                        <Link href={route('login')}>
                            <Button type="text" className="hidden sm:inline-flex">
                                Sign In
                            </Button>
                        </Link>
                        <Link href={route('register')}>
                            <Button type="primary" className="border-emerald-500 bg-emerald-500 hover:bg-emerald-600">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </Header>

            {/* Main Content */}
            <Content className="flex-1">{children}</Content>

            {/* Footer */}
            <Footer className="bg-gray-900 text-white">
                <div className="mx-auto max-w-7xl py-12">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        {/* Company info */}
                        <div className="col-span-1 md:col-span-2">
                            <div className="mb-4 flex items-center space-x-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                                    <span className="text-sm font-bold text-white">TH</span>
                                </div>
                                <span className="text-xl font-bold">TurfHub</span>
                            </div>
                            <p className="max-w-md text-gray-400">
                                The premier platform for turf booking and sports facility management. Connect with players, manage facilities, and
                                grow your sports community.
                            </p>
                        </div>

                        {/* Quick links */}
                        <div>
                            <h3 className="mb-4 font-semibold">Quick Links</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link href={route('welcome')} className="hover:text-white">
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('welcome')} className="hover:text-white">
                                        Pricing
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('welcome')} className="hover:text-white">
                                        Contact
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Help Center
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h3 className="mb-4 font-semibold">Legal</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="hover:text-white">
                                        Cookie Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 TurfHub. All rights reserved.</p>
                    </div>
                </div>
            </Footer>
        </Layout>
    );
};
