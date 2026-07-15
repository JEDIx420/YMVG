"use client";

import React, { useEffect, useRef } from "react";

// Inline type definitions for Cloudflare Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove: (container: string | HTMLElement) => void;
    };
  }
}

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  theme?: "light" | "dark" | "auto";
}

export default function Turnstile({ siteKey, onVerify, theme = "auto" }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Inject script if not already present in document
    const scriptId = "cloudflare-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // 2. Loop-check for Turnstile availability and render explicitly
    let active = true;
    const initialize = () => {
      if (!active) return;
      
      if (window.turnstile && containerRef.current) {
        try {
          // If we already rendered, clean up first
          if (widgetIdRef.current) {
            window.turnstile.remove(containerRef.current);
          }
          
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            theme: theme,
          });
        } catch (err) {
          console.error("Cloudflare Turnstile render error:", err);
        }
      } else {
        setTimeout(initialize, 100);
      }
    };

    initialize();

    return () => {
      active = false;
      if (window.turnstile && containerRef.current) {
        try {
          window.turnstile.remove(containerRef.current);
        } catch (e) {
          // Ignore removal errors on unmount
        }
      }
    };
  }, [siteKey, onVerify, theme]);

  return <div ref={containerRef} className="flex justify-center" />;
}
