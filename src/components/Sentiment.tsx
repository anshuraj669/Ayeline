import { CountUp } from "./Motion";

export function Sentiment({ support, oppose }: { support: number; oppose: number }) {
  const total = support + oppose;
  const pct = total ? Math.round((support / total) * 100) : 50;
  return (
    <div>
      <div className="grow-x flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        <span className="rounded-full bg-gradient-to-r from-glow to-support shadow-[0_0_12px_rgb(134_239_172/0.6)]" style={{ width: `${pct}%` }} />
        <span className="rounded-full bg-gradient-to-r from-accent to-oppose shadow-[0_0_12px_rgb(255_143_122/0.6)]" style={{ width: `${100 - pct}%` }} />
      </div>
      <p className="mt-2 flex justify-between gap-3 text-xs font-bold">
        <span className="text-support">
          👍 <CountUp value={support} /> support
        </span>
        <span className="text-oppose">
          <CountUp value={oppose} /> oppose 👎
        </span>
      </p>
    </div>
  );
}
