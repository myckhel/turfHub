# PWA Install Prompt - Quick Reference

## ✅ What Was Fixed

1. **Service Worker Registration**
   - Changed to auto registration
   - Added update checks every hour
   - Improved error handling

2. **Manifest Configuration**
   - Fixed icon paths (absolute URLs)
   - Added multiple PNG sizes
   - Added maskable icons
   - Changed `registerType` to `prompt`

3. **iOS Support**
   - Added iOS detection
   - Custom install instructions modal
   - iOS-specific meta tags

4. **New Components**
   - `PWAInstallButton` - Reusable install button
   - Enhanced `PWAUpdateNotification` with iOS support

## 🚀 Quick Test

### Desktop (Chrome/Edge)
1. Open http://localhost:8000
2. Look for install icon in address bar
3. Check console for: `✅ Service Worker registered`

### Mobile (Android)
1. Access via HTTPS
2. Wait 5 seconds
3. Look for install banner or notification
4. Check "Add to Home screen" in browser menu

### Mobile (iOS Safari)
1. Open in Safari
2. Tap Share button (⎋)
3. Select "Add to Home Screen"
4. Or use our custom install button

## 📝 Required Steps After Pulling Changes

### 1. Generate PWA Icons

```bash
# Option 1: Node.js (if sharp is available)
cd scripts/pwa-icons
npm install
npm run generate-icons

# Option 2: ImageMagick
brew install imagemagick
./scripts/generate-pwa-icons.sh
```

### 2. Rebuild Application

```bash
npm run build
```

### 3. Test

```bash
# Start server
npm run dev

# Open in browser
open http://localhost:8000

# Check console for:
# ✅ Service Worker registered successfully
# 🎯 beforeinstallprompt event fired (non-iOS)
```

## 🔍 Debugging

### Check Service Worker
```javascript
// Browser console
navigator.serviceWorker.controller
// Should return ServiceWorker object
```

### Check Install Prompt Event
```javascript
// Browser console
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt ready!', e);
});
```

### Check Manifest
- Open DevTools
- Go to Application tab
- Click Manifest
- Verify all properties are correct

## 🎯 Usage in Code

### Add Install Button
```tsx
import { PWAInstallButton } from '@/components/shared/PWAInstallButton';

<PWAInstallButton type="primary" size="large" />
```

### Use PWA Hook
```tsx
import { usePWA } from '@/hooks/usePWA';

const { canInstall, installApp, isInstalled } = usePWA();

if (canInstall && !isInstalled) {
  return <button onClick={installApp}>Install App</button>;
}
```

## ⚠️ Common Issues

### "Install prompt not showing"
- ✅ Check HTTPS (required in production)
- ✅ Clear browser cache
- ✅ Uninstall app if already installed
- ✅ Wait 5+ minutes between tests
- ✅ Check browser console for errors

### "Icons not loading"
- ✅ Run icon generation script
- ✅ Verify `/public/icons/` exists
- ✅ Rebuild application
- ✅ Check manifest in DevTools

### "Service worker not registering"
- ✅ Check `/build/sw.js` exists
- ✅ Verify HTTPS
- ✅ Check browser console
- ✅ Clear application storage

## 📱 Platform Differences

| Feature             | Android | iOS   | Desktop |
| ------------------- | ------- | ----- | ------- |
| Auto Prompt         | ✅ Yes   | ❌ No  | ✅ Yes   |
| beforeinstallprompt | ✅ Yes   | ❌ No  | ✅ Yes   |
| Manual Install      | ✅ Yes   | ✅ Yes | ✅ Yes   |
| Requires Safari     | ❌ No    | ✅ Yes | ❌ No    |

## 📚 Files Changed

- `resources/js/sw/workbox.config.ts` - Manifest config
- `resources/js/hooks/usePWA.ts` - PWA hook with iOS support
- `resources/js/stores/pwa.store.ts` - PWA state management
- `resources/js/components/shared/PWAInstallButton.tsx` - New component
- `resources/js/components/shared/PWAUpdateNotification.tsx` - Enhanced
- `resources/views/app.blade.php` - iOS meta tags
- `scripts/pwa-icons/` - Icon generation scripts
- `docs/pwa-install-prompt-guide.md` - Full documentation

## 🎉 Success Indicators

When working correctly, you should see:
- ✅ Install icon in browser address bar
- ✅ Console log: "Service Worker registered successfully"
- ✅ Console log: "beforeinstallprompt event fired" (non-iOS)
- ✅ Install notification appears
- ✅ App can be installed and launched standalone

## 🆘 Need Help?

See full documentation: `docs/pwa-install-prompt-guide.md`
