import { cn } from "@/lib/utils";
import { Provider } from "@appe/core";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";

// Provider logos are synced from models.dev into public/logos/<id>.svg by
// scripts/sync-models.mjs. We inline the SVG (rather than use <img>) so that
// monochrome `currentColor` logos inherit the text colour (and stay visible in
// dark mode) while full-colour brand marks keep their own colours.

// Module-level cache so each logo is fetched at most once per session.
const logoCache = new Map<string, Promise<string | null>>();

const loadLogo = (provider: string): Promise<string | null> => {
  let cached = logoCache.get(provider);
  if (!cached) {
    cached = fetch(`/logos/${encodeURIComponent(provider)}.svg`)
      .then((res) => (res.ok ? res.text() : null))
      .then((svg) => (svg && svg.includes("<svg") ? svg : null))
      .catch(() => null);
    logoCache.set(provider, cached);
  }
  return cached;
};

export const ProviderIcon = ({
  provider,
  className,
}: {
  provider: Provider;
  className?: string;
}) => {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadLogo(provider).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [provider]);

  const wrapper = cn(
    "inline-flex h-5 w-5 shrink-0 items-center justify-center align-middle text-foreground [&>svg]:h-full [&>svg]:w-full",
    className
  );

  if (svg) {
    return (
      <span
        className={wrapper}
        title={provider}
        // svg comes from our own /logos/ (synced from models.dev) and is
        // stripped of <script> at sync time.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <span className={wrapper} title={provider}>
      <Bot className="h-full w-full" />
    </span>
  );
};

export const getProviderIcon = (provider: Provider, className?: string) => (
  <ProviderIcon provider={provider} className={className} />
);
