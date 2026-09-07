import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Do these QR codes ever expire?',
    a: 'No. Tessera produces static codes — the destination is encoded into the pattern itself rather than pointing at a redirect service. The artwork you export keeps working for as long as the image exists, with no account to lapse and no subscription to cancel. The only caveat is the obvious one: if you encode a web address and that page goes offline, the scan still resolves but lands nowhere.',
  },
  {
    q: 'What is the difference between static and dynamic codes?',
    a: 'A dynamic code encodes a short link owned by a vendor, who can re-point it later and count every scan — useful, but the code dies with the vendor and the scans are tracked. A static code, like the ones here, carries its payload directly: unchangeable after printing, but permanent, private and free.',
  },
  {
    q: 'Is my data uploaded anywhere?',
    a: 'Never. There is no server component at all. Payload assembly and rendering happen entirely in your browser, so WiFi passwords, phone numbers and vCard details stay on your machine. You can confirm it by opening the network tab: after the first load there are no requests at all, to this origin or any other — the fonts are served from here rather than from Google, so nothing third-party ever sees your IP. Install it or visit once, then disconnect entirely and it keeps working.',
  },
  {
    q: 'How small can I print one?',
    a: 'Keep the printed symbol at 2 cm or larger for close-range scanning, and scale up roughly ten times the intended scan distance beyond that. Always leave the quiet zone — the blank margin around the pattern — intact, and test a proof with two different phones before committing to a large run.',
  },
  {
    q: 'Will a logo or heavy styling break the scan?',
    a: 'It can, which is why the studio scores contrast and capacity while you edit. Raising the error correction level lets the symbol survive a centre logo, and the badge beside the preview flags a colour pair that is too faint long before a printer does.',
  },
  {
    q: 'Which export format should I choose?',
    a: 'SVG for anything headed to print or a designer — it stays sharp at any size. PNG for screens, slides and documents. JPEG and WebP are there for tools that insist on them, though neither supports a transparent background.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-line">
      <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow">Questions</p>
            <h2 className="text-section-title mt-3 text-balance">
              The things people ask before printing 5,000 of them.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
              Short answers, no sales pitch.
            </p>
          </div>

          <ul className="divide-y divide-line border-y border-line">
            {FAQS.map(({ q, a }) => (
              <li key={q}>
                <details className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center gap-4 py-4 text-[15px] font-medium tracking-tight transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                    <span className="flex-1 text-pretty">{q}</span>
                    <ChevronDown
                      size={17}
                      aria-hidden
                      className="shrink-0 text-ink-subtle transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <p className="pb-5 pr-8 text-[14.5px] leading-relaxed text-ink-muted">
                    {a}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
