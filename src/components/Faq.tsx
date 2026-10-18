import { Plus } from 'lucide-react';

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
    a: 'It can, which is why the studio runs a press check while you edit: contrast at the weakest point, capacity, quiet zone and how much of the symbol a logo covers. Raising the error correction level lets the symbol survive a centre logo, and the proof flags a colour pair that is too faint long before a printer does.',
  },
  {
    q: 'Which export format should I choose?',
    a: 'SVG for anything headed to print or a designer — it stays sharp at any size. PNG for screens, slides and documents. JPEG and WebP are there for tools that insist on them, though neither supports a transparent background.',
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-b border-rule">
      <div className="grid gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:px-10 lg:py-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="faq-title" className="type-title max-w-[13ch] text-balance">
            Before you print five thousand.
          </h2>
          <p className="mt-5 text-[17px] text-ink-2">Short answers, no sales pitch.</p>
        </div>

        <ul className="border-t border-rule">
          {FAQS.map(({ q, a }) => (
            <li key={q} className="border-b border-rule">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start gap-4 py-4 text-[17px] font-bold leading-snug transition-colors hover:text-magenta-ink [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 text-pretty">{q}</span>
                  <Plus
                    size={18}
                    strokeWidth={2.25}
                    aria-hidden
                    className="mt-0.5 shrink-0 transition-transform duration-300 group-open:rotate-45"
                  />
                </summary>
                <p className="max-w-[62ch] pb-5 pr-8 text-[16px] leading-relaxed text-ink-2">
                  {a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
