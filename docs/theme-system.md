# TurfHub Theme System 🎨

A comprehensive, mobile-first theme system for **TurfHub** - the progressive web app for mini football turf sessions.

## 🚀 Quick Start

```tsx
import { AppLayout, MobileLayout, useTheme, TurfButton } from './resources/js';

function App() {
  return (
    <AppLayout>
      <MobileLayout activeTab="home" title="TurfHub">
        <TurfButton variant="primary">Queue. Play. Win. Repeat.</TurfButton>
      </MobileLayout>
    </AppLayout>
  );
}
```

## 🎯 Brand Identity

### Colors
- **Primary**: Turf Green `#1B5E20` - Represents the natural football turf
- **Accent**: Sky Blue `#3B8CB7` - Evokes open sky and freedom
- **Highlight**: Electric Yellow `#FFEB3B` - High-energy call-to-action color
- **Background**: Deep Slate `#212121` - Professional dark mode background

### Typography
- **Primary**: Inter (clean, readable, modern)
- **Display**: Manrope (friendly headlines)
- **Fallback**: System fonts for performance

### Design Principles
Following Apple's Human Interface Guidelines:
- **Touch-friendly**: 44px minimum touch targets
- **Fluid animations**: GSAP-powered transitions
- **Mobile-first**: Responsive design starting from mobile
- **Accessible**: High contrast support, reduced motion respect

## 📱 Components

### Layout Components

#### `<MobileLayout>`
Mobile-first layout with safe area handling and bottom navigation.

```tsx
<MobileLayout
  activeTab="home"
  title="Dashboard"
  subtitle="Welcome back!"
  showBackButton={false}
  showBottomNav={true}
  backgroundVariant="gradient"
>
  {/* Your content */}
</MobileLayout>
```

#### `<BottomTabNavigation>`
iOS-style bottom tab navigation with GSAP animations.

```tsx
<BottomTabNavigation 
  activeTab="matches" 
  className="custom-nav" 
/>
```

#### `<MobileHeader>`
Sticky header with theme toggle and user menu.

```tsx
<MobileHeader
  title="Match Details"
  showBackButton={true}
  rightContent={<ThemeToggle />}
/>
```

### UI Components

#### `<TurfButton>`
Mobile-optimized button with haptic feedback and spring animations.

```tsx
<TurfButton
  variant="primary"    // primary | secondary | accent | ghost | danger | success
  size="touch"         // small | medium | large | touch
  fullWidth={true}
  haptic={true}
  gradient={true}
  icon={<PlayIcon />}
>
  Join Match
</TurfButton>
```

#### `<TurfCard>`
Interactive card component with multiple variants.

```tsx
<TurfCard
  variant="elevated"   // default | elevated | outlined | glass | hero
  interactive={true}
  springOnPress={true}
  gradient="turf"      // turf | sky | sunset | none
  onPress={() => navigate('/match')}
>
  {/* Card content */}
</TurfCard>
```

#### `<ThemeToggle>`
Animated light/dark mode toggle.

```tsx
<ThemeToggle 
  size="medium" 
  showLabel={true} 
/>
```

## 🎨 Theme System

### Theme Store
Powered by Zustand with persistence and system preference detection.

```tsx
import { useTheme } from './hooks/useTheme';

function Component() {
  const { 
    isDark, 
    colorScheme, 
    setLightMode, 
    setDarkMode, 
    setSystemMode 
  } = useTheme();
  
  return (
    <div className={isDark ? 'dark-variant' : 'light-variant'}>
      {/* Theme-aware content */}
    </div>
  );
}
```

### Brand Colors Access
```tsx
import { BRAND_COLORS, getThemeColors } from './stores/theme.store';

const colors = getThemeColors('dark');
console.log(colors.primary); // #1B5E20
```

### Responsive Design
```tsx
import { useResponsive } from './hooks/useTheme';

function Component() {
  const { isMobile, isTablet, currentBreakpoint } = useResponsive();
  
  return (
    <div className={`
      ${isMobile ? 'mobile-layout' : 'desktop-layout'}
      ${currentBreakpoint === 'mobile' ? 'p-4' : 'p-8'}
    `}>
      {/* Responsive content */}
    </div>
  );
}
```

## 🎪 Animations

### GSAP Integration
All components use `@gsap/react` for performance and cleanup.

```tsx
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

function AnimatedComponent() {
  const { reducedMotion } = useTheme();
  const ref = useRef();

  useGSAP(() => {
    if (reducedMotion) return;
    
    gsap.fromTo(ref.current, 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );
  }, [reducedMotion]);

  return <div ref={ref}>Content</div>;
}
```

### Built-in Animation Classes
```css
.spring-bounce     /* Spring animation on active */
.touch-target      /* 44px minimum touch target */
.glass-effect      /* Backdrop blur glass morphism */
.animate-shimmer   /* Loading shimmer effect */
.safe-area-inset   /* iOS safe area padding */
```

## 📏 Design Tokens

### Spacing (Mobile-First)
- `xs`: 4px - Tight spacing
- `sm`: 8px - Small gaps
- `md`: 12px - Default spacing
- `base`: 16px - Base unit
- `lg`: 24px - Section spacing
- `xl`: 32px - Large gaps
- `2xl`: 48px - Major sections
- `3xl`: 64px - Hero spacing

### Touch Targets
- `touch-sm`: 36px - Minimum
- `touch-md`: 44px - Apple recommended
- `touch-lg`: 52px - Comfortable
- `touch-xl`: 64px - Generous

### Border Radius (iOS-inspired)
- `xs`: 4px - Small elements
- `sm`: 8px - Buttons, inputs
- `md`: 12px - Cards
- `lg`: 16px - Modals
- `xl`: 24px - Hero elements

### Shadows (Depth System)
- `sm`: Subtle elevation
- `md`: Standard cards
- `lg`: Floating elements
- `xl`: Modals and overlays
- `card`: Optimized for cards
- `modal`: High elevation

### Animation Timing
- `fast`: 0.15s - Micro-interactions
- `normal`: 0.25s - Standard transitions
- `slow`: 0.35s - Complex animations
- `spring`: Spring easing curve
- `ease-out`: Natural deceleration

## 🌐 PWA Features

### Workbox Integration
```tsx
import { PWAUpdateNotification } from './components/shared/PWAUpdateNotification';

// Automatic service worker updates with user prompts
<PWAUpdateNotification />
```

### Offline Support
- Automatic caching strategies
- Background sync for failed requests
- Offline-first data patterns

## 🎯 Best Practices

### Mobile-First Development
1. **Start with mobile**: Design and develop mobile layouts first
2. **Touch-friendly**: Use 44px minimum touch targets
3. **Thumb navigation**: Place important actions within thumb reach
4. **Safe areas**: Handle iPhone notches and home indicators

### Theme Implementation
1. **System preference**: Respect user's system theme setting
2. **Reduced motion**: Disable animations for accessibility
3. **High contrast**: Support high contrast mode
4. **Color consistency**: Use design tokens, not hardcoded colors

### Performance
1. **Lazy loading**: Use React.lazy for code splitting
2. **Image optimization**: WebP with fallbacks
3. **Animation cleanup**: GSAP automatically cleans up
4. **Bundle size**: Tree-shake unused components

### Accessibility
1. **Focus management**: Proper focus indicators
2. **Screen readers**: Semantic HTML and ARIA labels
3. **Keyboard navigation**: Full keyboard support
4. **Color contrast**: WCAG AA compliance

## 🔧 Customization

### Brand Colors
Edit `BRAND_COLORS` in `theme.store.ts`:

```tsx
export const BRAND_COLORS = {
  turfGreen: '#YOUR_PRIMARY_COLOR',
  skyBlue: '#YOUR_ACCENT_COLOR',
  // ...
};
```

### Animation Settings
Adjust animation presets in CSS:

```css
@theme {
  --duration-fast: 0.1s;
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Breakpoints
Configure responsive breakpoints in `layout.store.ts`:

```tsx
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};
```

## 🚀 Deployment

The theme system is production-ready with:
- ✅ TypeScript support
- ✅ Tree-shaking optimization
- ✅ SSR compatibility
- ✅ PWA features
- ✅ Dark mode persistence
- ✅ Accessibility compliance
- ✅ Mobile performance optimized

---

**Built with ❤️ for the beautiful game. Queue. Play. Win. Repeat.**
