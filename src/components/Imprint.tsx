import { useEffect, useState } from 'react';
import { ProofMark } from './proof/Marks';
import { Reading } from './proof/Reading';

/** Requests this page has made to any origin but its own, since it loaded. */
function useForeignRequests(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) return;
    const foreign = (name: string) => {
      try {
        return new URL(name, location.href).origin !== location.origin;
      } catch {
        return false;
      }
    };
    const tally = () =>
      setCount(
        (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter(
          (e) => foreign(e.name),
        ).length,
      );
    tally();
    if (typeof PerformanceObserver === 'undefined') return;
    const observer = new PerformanceObserver(tally);
    try {
      observer.observe({ type: 'resource', buffered: true });
    } catch {
      return;
    }
    return () => observer.disconnect();
  }, []);
  return count;
}

/** Whether the service worker has the studio cached for offline use. */
function useOfflineReady(): boolean {
  const supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const [ready, setReady] = useState<boolean>(
    () => supported && Boolean(navigator.serviceWorker.controller),
  );
  useEffect(() => {
    if (!supported) return;
    const onChange = () => setReady(Boolean(navigator.serviceWorker.controller));
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    return () =>
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
  }, [supported]);
  return ready;
}

/**
 * The imprint: the privacy claim, measured on the page instead of promised.
 * The count of foreign requests is read from this tab's own resource timings,
 * so a visitor can check it against their network panel.
 */
export function Imprint() {
  const foreign = useForeignRequests();
  const offline = useOfflineReady();

  const rows = [
    {
      k: 'Requests to other servers, this visit',
      v: String(foreign),
      ok: foreign === 0,
      note: 'Read live from this tab’s own resource timings. Even the fonts are served from here.',
    },
    {
      k: 'Saved for offline use',
      v: offline ? 'Yes' : 'Not yet',
      ok: offline,
      note: offline
        ? 'The studio is cached on this device and works with the network off.'
        : 'It caches itself on the first visit; reload once and it works offline.',
    },
    {
      k: 'Expires',
      v: 'Never',
      ok: true,
      note: 'The data lives in the pattern, not behind a redirect that a subscription can switch off.',
    },
    {
      k: 'Scan data collected',
      v: 'None',
      ok: true,
      note: 'A static code has no server to count scans, so nobody is counting.',
    },
  ];

  return (
    <section aria-labelledby="imprint-title" className="border-b border-rule">
      <div className="grid gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:px-10 lg:py-20">
        <div>
          <h2 id="imprint-title" className="type-title max-w-[12ch] text-balance">
            Nothing leaves the sheet.
          </h2>
          <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink-2">
            There is no server behind Tessera. Your WiFi password and your contact details
            are encoded in this tab and stay here. That is not a promise you have to take
            on trust: the readings beside this are taken from the page you are looking at.
          </p>
        </div>
        <dl className="border-t border-rule">
          {rows.map((row) => (
            <div
              key={row.k}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 border-b border-rule py-4"
            >
              <dt className="text-[16px] font-bold">{row.k}</dt>
              <dd className="row-span-2 flex items-center gap-2 self-center text-[28px] leading-none sm:text-[34px]">
                <ProofMark kind={row.ok ? 'pass' : 'note'} size={16} />
                <Reading value={row.v} />
              </dd>
              <dd className="text-[14px] text-ink-2">{row.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
