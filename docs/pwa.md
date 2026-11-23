# Installing Life OS

The app shows an install suggestion on mobile and desktop. Chrome/Edge use the native install dialog when available; iPhone/iPad show Safari's Share → Add to Home Screen instructions. The suggestion disappears in standalone mode or when dismissed for the current visit.

Run `npm run build`, then `npm run preview -- --host 0.0.0.0` to test the production build. Desktop localhost can install directly. Phones require an HTTPS deployment or a locally trusted HTTPS setup; an HTTP LAN address is not installable.

The production PWA caches the app shell, artwork, and visited avatar models. API responses require connectivity. Development uses MSW and does not register the PWA worker. Builds with `VITE_ENABLE_MOCKS=true` also reserve the root service worker for MSW, so those demo builds have an install manifest but no PWA offline cache.

Check desktop Chrome/Edge native installation, standalone launch to `/dashboard`, Android install, iOS manual install, dismissal, and reopening after a reload on an HTTPS origin. Native installation must be checked on the target device; a successful build does not confirm browser installability.
