(function() {
  // instant-preload.js
  // Prefetches HTML & JS chunks on viewport visibility and hover/touchstart to ensure near-zero (0.04s) page loading transitions.
  const prefetched = new Set();

  function prefetch(url) {
    // Avoid double prefetching, checking query params and anchors
    const cleanUrl = url.split('#')[0].split('?')[0];
    if (!cleanUrl || cleanUrl === '/' || cleanUrl === window.location.pathname) return;
    if (prefetched.has(cleanUrl)) return;
    prefetched.add(cleanUrl);

    // Create the prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = cleanUrl;
    link.as = 'document';
    
    // Also support modern fetch priority
    link.setAttribute('fetchpriority', 'low');
    
    document.head.appendChild(link);
    console.log('[InstantPreload] Prefetched document:', cleanUrl);
  }

  // Monitor viewport visibility for links to proactively prefetch them
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const a = entry.target;
          const href = a.getAttribute('href');
          if (href && href.startsWith('/') && !href.startsWith('/admin')) {
            prefetch(href);
          }
          observer.unobserve(a);
        }
      });
    }, { rootMargin: '100px' });
  }

  function registerLink(a) {
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('/admin')) return;

    // Prefetch immediately on mouseover or touchstart
    a.addEventListener('mouseover', () => prefetch(href), { passive: true });
    a.addEventListener('touchstart', () => prefetch(href), { passive: true });

    if (observer) {
      observer.observe(a);
    }
  }

  function init() {
    document.querySelectorAll('a[href^="/"]').forEach(registerLink);

    // Watch for dynamic elements added by React
    const mutObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.tagName === 'A' && node.getAttribute('href')?.startsWith('/')) {
              registerLink(node);
            } else {
              node.querySelectorAll('a[href^="/"]').forEach(registerLink);
            }
          }
        });
      });
    });
    mutObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
