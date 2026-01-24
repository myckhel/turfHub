import { useEffect, useMemo, useState } from 'react';

interface TurfHubLoaderProps {
  src?: string;
  width?: number;
  height?: number;
  speed?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  ariaLabel?: string;
}

// Lightweight Lottie loader using the web component without adding a package dependency.
// It lazy-loads the lottie-player script from unpkg and renders a local JSON from public/.
export default function TurfHubLoader({
  src = '/turfhub-logo.json',
  width = 120,
  height = 120,
  speed = 1,
  loop = true,
  autoplay = true,
  className = '',
  ariaLabel = 'Loading',
}: TurfHubLoaderProps) {
  const [ready, setReady] = useState<boolean>(false);

  const containerClass = useMemo(() => `flex items-center justify-center ${className}`, [className]);

  useEffect(() => {
    // If the custom element is already registered, we are ready.
    if (typeof window !== 'undefined' && customElements.get('lottie-player')) {
      setReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);
    document.head.appendChild(script);

    return () => {
      // We don't remove the script to avoid re-downloading on subsequent mounts.
    };
  }, []);

  return (
    <div role="status" aria-label={ariaLabel} className={containerClass}>
      {ready ? (
        // Using the Lottie web component once it's ready.
        // NOTE: React passes boolean attributes as strings; the component treats presence as truthy.
        // @ts-expect-error - JSX doesn't know this custom element type, but it's valid in the browser.
        <lottie-player src={src} background="transparent" speed={speed} loop={loop} autoplay={autoplay} style={{ width, height }} />
      ) : (
        // Minimal spinner fallback while the web component script loads.
        <div className="animate-spin rounded-full border-2 border-gray-300 border-t-transparent" style={{ width, height }} aria-hidden="true" />
      )}
    </div>
  );
}
