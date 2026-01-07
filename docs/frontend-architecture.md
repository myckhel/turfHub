# 🏗️ Frontend Architecture - TurfHub PWA

## 📁 Folder Structure

```
resources/js/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (buttons, inputs, etc.)
│   ├── forms/          # Form-specific components
│   ├── layout/         # Layout components (headers, sidebars, etc.)
│   ├── auth/           # Authentication-related components
│   ├── dashboard/      # Dashboard-specific components
│   ├── marketing/      # Marketing/landing page components
│   └── shared/         # Shared business logic components
├── layouts/            # Page layout templates
│   ├── AuthLayout.tsx       # Authenticated user layout
│   ├── GuestLayout.tsx      # Guest/public layout
│   ├── DashboardLayout.tsx  # Admin/Manager dashboard layout
│   └── AppLayout.tsx        # Main app layout wrapper
├── pages/              # Inertia page components
│   ├── Public/         # Public marketing pages
│   ├── Auth/           # Authentication pages
│   ├── Player/         # Player-specific pages
│   ├── Admin/          # Admin-specific pages
│   ├── Manager/        # Manager-specific pages
│   └── App/         # App authenticated pages
├── stores/             # Zustand state management
│   ├── auth.store.ts
│   ├── flash.store.ts
│   ├── layout.store.ts
│   ├── pwa.store.ts
│   └── index.ts
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useFlash.ts
│   ├── usePWA.ts
│   └── useGSAPTransitions.ts
├── services/           # API services and external integrations
│   ├── api.service.ts
│   ├── auth.service.ts
│   ├── pwa.service.ts
│   └── sw.service.ts
├── types/              # TypeScript type definitions
│   ├── auth.types.ts
│   ├── api.types.ts
│   ├── pages.types.ts
│   └── global.types.ts
├── utils/              # Utility functions
│   ├── permissions.ts
│   ├── route-resolver.ts
│   ├── gsap-animations.ts
│   └── sw-helper.ts
├── css/                # Stylesheets
│   ├── app.css
│   ├── components.css
│   └── animations.css
└── sw/                 # Service Worker files
    ├── sw.ts
    ├── workbox.config.ts
    └── update-manager.ts
```

## 🔐 Role-based Access Strategy

### 1. User Roles & Permissions
- **Guest**: Public pages only
- **Player**: Player dashboard, booking, matches
- **Manager**: Facility management, bookings
- **Admin**: Full system access

### 2. Route Protection Strategy
- Middleware-based access control in Laravel
- Frontend role checking using Zustand auth store
- Dynamic component resolution based on permissions

## 🧠 State Management Architecture

### Zustand Stores:
1. **Auth Store**: User data, authentication state, permissions
2. **Flash Store**: Toast notifications, alerts
3. **Layout Store**: Mobile menu state, sidebar, modals
4. **PWA Store**: Update notifications, offline status

## ⚙️ PWA Configuration

### Service Worker Features:
- Route caching (stale-while-revalidate)
- Asset precaching
- Background sync for offline actions
- Update notifications
- Push notifications (future)

## 🎨 Animation Strategy

### GSAP Integration:
- Page transition animations
- Component entrance/exit animations
- Interactive micro-animations
- Loading states
- Error state animations

## 📱 Mobile-First Responsive Strategy

### Breakpoints:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Component Patterns:
- Mobile navigation (drawer/hamburger)
- Responsive grids using CSS Grid + Tailwind
- Touch-friendly interaction zones
- Progressive enhancement
