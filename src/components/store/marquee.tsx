/** Infinite CSS marquee; the duplicate track is hidden from assistive tech. Paused by reduced-motion CSS. */
export function Marquee({ items }: { items: string[] }) {
  const track = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 animate-[marquee_28s_linear_infinite] items-center">
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-8 px-4 font-display text-2xl font-bold uppercase sm:text-4xl">
          {t}
          <span className="text-accent" aria-hidden="true">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="flex overflow-hidden border-y-2 border-fg py-4 select-none">
      {track(false)}
      {track(true)}
    </div>
  );
}
