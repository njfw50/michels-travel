/**
 * Analytics initialization with error handling
 * DOGMA 9: Console Error Prevention - Analytics must be safe and conditional
 */

/**
 * Suppress network errors from blocked analytics scripts (e.g., Mixpanel blocked by adblockers)
 * DOGMA 9: Zero Console Errors - Prevent ERR_BLOCKED_BY_CLIENT from appearing in console
 */
function suppressBlockedAnalyticsErrors(): void {
  if (typeof window === 'undefined') return;
  
  // Override console.error to filter out blocked analytics errors
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args: unknown[]) {
    const message = String(args.join(' '));
    
    // Filter out common analytics blocking errors
    const blockedPatterns = [
      /mixpanel/i,
      /ERR_BLOCKED_BY_CLIENT/i,
      /api-js\.mixpanel\.com/i,
      /Failed to load resource.*mixpanel/i,
      /net::ERR_BLOCKED_BY_CLIENT/i,
    ];
    
    const isBlockedAnalyticsError = blockedPatterns.some(pattern => pattern.test(message));
    
    // DOGMA 9: Suppress in all environments - these are not real errors
    if (isBlockedAnalyticsError) {
      // Silently ignore - analytics blocking is expected with adblockers
      return;
    }
    
    // Call original console.error for all other errors
    originalError.apply(console, args);
  };
  
  console.warn = function(...args: unknown[]) {
    const message = String(args.join(' '));
    
    // Also filter warnings about blocked analytics
    const blockedPatterns = [
      /mixpanel/i,
      /ERR_BLOCKED_BY_CLIENT/i,
      /api-js\.mixpanel\.com/i,
    ];
    
    const isBlockedAnalyticsWarning = blockedPatterns.some(pattern => pattern.test(message));
    
    if (isBlockedAnalyticsWarning) {
      // Silently ignore
      return;
    }
    
    // Call original console.warn for all other warnings
    originalWarn.apply(console, args);
  };
  
  // Intercept global error events for blocked resources
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || '';
    const errorSource = (event.filename || '') + (event.target?.src || '');
    const combined = errorMessage + errorSource;
    
    if (/mixpanel|ERR_BLOCKED_BY_CLIENT|api-js\.mixpanel/i.test(combined)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Intercept unhandled promise rejections from blocked resources
  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason || '');
    if (/mixpanel|ERR_BLOCKED_BY_CLIENT|api-js\.mixpanel/i.test(reason)) {
      event.preventDefault();
      return false;
    }
  });
}

/**
 * Initialize analytics if configured
 * Only loads in production and if environment variables are set
 * Handles adblocker blocking gracefully
 */
export function initializeAnalytics(): void {
  // Suppress blocked analytics errors (DOGMA 9)
  suppressBlockedAnalyticsErrors();
  
  // Only load in production
  if (import.meta.env.MODE !== 'production') {
    return;
  }

  const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  // Only load if both are configured
  if (!analyticsEndpoint || !websiteId) {
    return;
  }

  // Prevent errors if script is blocked by adblockers
  try {
    const script = document.createElement('script');
    script.defer = true;
    script.src = `${analyticsEndpoint}/umami`;
    script.setAttribute('data-website-id', websiteId);
    
    // Handle errors gracefully - DOGMA 2: Explicit error handling
    script.onerror = function() {
      // Analytics is optional - silently handle adblocker blocking
      // Using console.debug instead of console.error to avoid noise
      if (import.meta.env.DEV) {
        console.debug('[Analytics] Script blocked or failed to load - this is expected with adblockers');
      }
    };
    
    script.onload = function() {
      if (import.meta.env.DEV) {
        console.debug('[Analytics] Successfully loaded');
      }
    };
    
    document.body.appendChild(script);
  } catch (error) {
    // Analytics is optional - handle errors gracefully
    if (import.meta.env.DEV) {
      console.debug('[Analytics] Failed to initialize - this is expected if not configured');
    }
  }
}

