// Service Worker Registration utility for PWA functionality
// This handles the registration and management of the service worker

const isLocalhost = Boolean(
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    ))
);

export function register(config) {
  if (typeof window === 'undefined') {
    console.log('Service Worker: Not in browser environment');
    return;
  }

  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets;
      console.log('Service Worker: PUBLIC_URL is on different origin');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Service Worker: App is being served cache-first by a service worker. ' +
            'To learn more, visit https://bit.ly/CRA-PWA'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
  } else {
    console.log('Service Worker: Not supported in this browser');
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker: Registration successful', registration);
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log(
                'Service Worker: New content is available and will be used when all tabs are closed.'
              );

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('Service Worker: Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Service Worker: Registration failed', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'Service Worker: No internet connection found. App is running in offline mode.'
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('Service Worker: Unregistered successfully');
      })
      .catch((error) => {
        console.error('Service Worker: Unregistration failed', error.message);
      });
  }
}

// PWA Install prompt handling
export function handlePWAInstall() {
  let deferredPrompt;
  let isInstallPromptShown = false;

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA Install: beforeinstallprompt event fired');
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show custom install button or prompt
    if (!isInstallPromptShown) {
      showInstallPrompt();
    }
  });

  // Listen for the appinstalled event
  window.addEventListener('appinstalled', (evt) => {
    console.log('PWA Install: App was installed');
    // Hide the install promotion
    hideInstallPrompt();
  });

  function showInstallPrompt() {
    console.log('PWA Install: Showing install prompt');
    isInstallPromptShown = true;
    // Trigger custom install prompt component
    // This should be handled by your React components
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }

  function hideInstallPrompt() {
    console.log('PWA Install: Hiding install prompt');
    isInstallPromptShown = false;
    window.dispatchEvent(new CustomEvent('pwa-install-completed'));
  }

  // Function to trigger install
  return {
    promptInstall: async () => {
      if (deferredPrompt) {
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA Install: User response to install prompt: ${outcome}`);
        // Clear the deferredPrompt
        deferredPrompt = null;
        return outcome === 'accepted';
      }
      return false;
    },
    isInstallAvailable: () => !!deferredPrompt
  };
}

// Check if app is running as PWA
export function isPWA() {
  return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
}

// Check if app is running on mobile
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default {
  register,
  unregister,
  handlePWAInstall,
  isPWA,
  isMobile
};