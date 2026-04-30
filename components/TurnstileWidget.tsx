'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string | undefined;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

interface Props {
  onToken: (token: string) => void;
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export default function TurnstileWidget({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = typeof process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === 'string'
    ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY.trim()
    : '';

  useEffect(() => {
    if (!siteKey) {
      onToken('dev-turnstile-token');
      return;
    }

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken('')
      });

      if (widgetId) {
        widgetIdRef.current = widgetId;
      }
    };

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    } else {
      existingScript.addEventListener('load', renderWidget, { once: true });
    }

    return () => {
      if (existingScript) {
        existingScript.removeEventListener('load', renderWidget);
      }

      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }

      widgetIdRef.current = null;
    };
  }, [onToken, siteKey]);

  if (!siteKey) {
    return (
      <p className="text-xs text-slate-500">
        Local verification stub enabled. Production requires a Cloudflare Turnstile site key and secret.
      </p>
    );
  }

  return <div ref={containerRef} className="min-h-[65px]" />;
}
