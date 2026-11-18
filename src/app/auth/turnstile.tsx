"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type Turnstile = {
  render: (element: HTMLElement, options: { sitekey: string }) => string;
  remove: (id: string) => void;
};

function widget() {
  return (window as Window & { turnstile?: Turnstile }).turnstile;
}

export function TurnstileField() {
  const container = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => () => {
    if (id.current !== null) widget()?.remove(id.current);
    id.current = null;
  }, []);

  if (!sitekey) return null;

  return (
    <>
      <div ref={container} />
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => {
          if (container.current && id.current === null) {
            id.current = widget()?.render(container.current, { sitekey }) ?? null;
          }
        }}
      />
    </>
  );
}
