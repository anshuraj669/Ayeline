import { COUNCIL_SIZE, PLACE } from "@/lib/data";

export function VoteResult({ yes, no, passed }: { yes: number; no: number; passed: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={`rounded-full px-3 py-1 text-sm font-extrabold text-white ${
          passed ? "bg-support-solid shadow-[0_0_20px_-4px_rgb(134_239_172/0.7)]" : "bg-oppose-solid shadow-[0_0_20px_-4px_rgb(255_143_122/0.7)]"
        }`}
      >
        {passed ? "✓ Passed" : "✕ Did not pass"} {yes}–{no}
      </span>
      <span
        className="flex gap-1.5"
        role="img"
        aria-label={`${yes} ${PLACE.words.members} voted yes, ${no} voted no, out of ${COUNCIL_SIZE}`}
      >
        {Array.from({ length: COUNCIL_SIZE }, (_, i) => (
          <span
            key={i}
            style={{ ["--i" as string]: i }}
            className={`dot-pop h-2.5 w-2.5 rounded-full ${
              i < yes
                ? "bg-support shadow-[0_0_8px_rgb(134_239_172/0.9)]"
                : i < yes + no
                  ? "bg-oppose shadow-[0_0_8px_rgb(255_143_122/0.9)]"
                  : "bg-line"
            }`}
          />
        ))}
      </span>
    </div>
  );
}
