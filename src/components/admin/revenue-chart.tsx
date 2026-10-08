import { formatVnd } from "@/lib/money";

type Day = { day: string; revenue: number; orders: number };

const dayLabel = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/**
 * Single-series bar chart (14 days). One hue (--accent-ink: ≥3:1 vs surface in both themes),
 * bars anchored to the baseline with 4px rounded tops and 2px gaps, hover/focus tooltip per bar,
 * and a data table for screen readers / exact values.
 */
export function RevenueChart({ data }: { data: Day[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="text-xs font-bold tracking-widest uppercase">Doanh thu 14 ngày</span>
        <span className="text-xs text-muted">Cao nhất {formatVnd(max === 1 ? 0 : max)}</span>
      </figcaption>
      <div className="relative h-48 border-b border-line">
        {/* Recessive gridlines at 50% / 100% */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden="true" />
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" aria-hidden="true" />
        <ol className="relative flex h-full items-end gap-0.5" aria-label="Doanh thu theo ngày">
          {data.map((d) => (
            <li key={d.day} className="group relative flex h-full flex-1 items-end" tabIndex={0} aria-label={`${dayLabel(d.day)}: ${formatVnd(d.revenue)}, ${d.orders} đơn`}>
              <div
                className="w-full rounded-t-[4px] bg-accent-ink transition-opacity group-hover:opacity-80"
                style={{ height: `${(d.revenue / max) * 100}%`, minHeight: d.revenue > 0 ? 2 : 0 }}
              />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap border-2 border-fg bg-bg px-2 py-1 text-xs group-hover:block group-focus-visible:block">
                <span className="block font-bold">{formatVnd(d.revenue)}</span>
                <span className="text-muted">
                  {dayLabel(d.day)} · {d.orders} đơn
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex justify-between text-xs text-muted" aria-hidden="true">
        <span>{dayLabel(data[0]?.day ?? "")}</span>
        <span>{dayLabel(data[data.length - 1]?.day ?? "")}</span>
      </div>
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer content-center text-xs font-bold uppercase underline underline-offset-4">Xem dạng bảng</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-line text-xs text-muted uppercase">
              <th className="py-1 font-bold">Ngày</th>
              <th className="py-1 text-right font-bold">Đơn</th>
              <th className="py-1 text-right font-bold">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.day} className="border-b border-line">
                <td className="py-1">{dayLabel(d.day)}</td>
                <td className="py-1 text-right">{d.orders}</td>
                <td className="py-1 text-right">{formatVnd(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
