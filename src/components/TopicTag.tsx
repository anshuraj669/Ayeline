import { TOPICS, type Topic } from "@/lib/data";

export function TopicTag({ topic }: { topic: Topic }) {
  const t = TOPICS[topic];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1"
      style={{
        color: t.color,
        background: `color-mix(in srgb, ${t.color} 13%, transparent)`,
        ["--tw-ring-color" as string]: `color-mix(in srgb, ${t.color} 30%, transparent)`,
      }}
    >
      <span aria-hidden="true">{t.emoji}</span>
      {t.label}
    </span>
  );
}
