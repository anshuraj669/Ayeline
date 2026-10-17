import type { NoticeArt as Art } from "@/lib/data";

// Fixed numbers (no Math.random) so the server and client draw the same scene.
const spread = (n: number, f: (i: number) => object) => Array.from({ length: n }, (_, i) => f(i));

/** The animated scene at the top of a notice card. Purely decorative. */
export function NoticeArt({ art, emoji, big }: { art: Art; emoji: string; big?: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {art === "diya" && <Diya />}
      {art === "snow" && <Snow />}
      {art === "fireworks" && <Fireworks />}
      {art === "shuttle" && <Shuttle />}
      {art === "water" && <Water />}
      {art === "plain" && <Plain />}
      {big ? (
        <span className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
          <span className="pin-bob block text-8xl drop-shadow-[0_16px_40px_rgb(0_0_0/0.55)] sm:text-9xl">{emoji}</span>
        </span>
      ) : (
        <span className="absolute bottom-3 right-4 text-4xl drop-shadow-[0_6px_20px_rgb(0_0_0/0.5)] transition-transform duration-500 ease-spring group-hover:-translate-y-1 group-hover:scale-110">
          {emoji}
        </span>
      )}
    </div>
  );
}

function Diya() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(80%_90%_at_50%_110%,rgb(255_170_60/0.55),rgb(255_110_60/0.18)_45%,transparent_75%)]" />
      {/* Marigold toran along the top. */}
      <div className="sway absolute inset-x-0 top-0 flex justify-around">
        {spread(14, (i) => ({ i })).map((_, i) => (
          <span key={i} className="flex flex-col items-center">
            <span className="h-2 w-px bg-accent/50" />
            <span className={`h-3.5 w-3.5 rounded-full ${i % 2 ? "bg-[#ffb02e]" : "bg-[#ff7a1a]"} shadow-[0_0_8px_rgb(255_160_40/0.7)]`} />
            {i % 3 === 0 && <span className="mt-0.5 h-2.5 w-1.5 rounded-full bg-[#4fae5a]" />}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 300 120" className="absolute inset-x-0 bottom-0 h-[70%] w-full" preserveAspectRatio="xMidYMax meet">
        {[70, 150, 230].map((x, i) => (
          <g key={x}>
            <path d={`M${x - 22} 100 Q${x} 122 ${x + 22} 100 Z`} fill="#b45309" />
            <path d={`M${x - 22} 100 Q${x} 108 ${x + 22} 100`} fill="none" stroke="#ffc56e" strokeWidth="1.5" />
            <ellipse cx={x} cy={88} rx="14" ry="12" fill="rgb(255 190 80 / 0.25)" />
            <path
              className="flicker"
              style={{ animationDelay: `${i * 0.35}s` }}
              d={`M${x} 70 C${x + 7} 82 ${x + 6} 96 ${x} 98 C${x - 6} 96 ${x - 7} 82 ${x} 70 Z`}
              fill="url(#flame)"
            />
          </g>
        ))}
        <defs>
          <linearGradient id="flame" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff3c4" />
            <stop offset="0.5" stopColor="#ffc56e" />
            <stop offset="1" stopColor="#ff7a1a" />
          </linearGradient>
        </defs>
      </svg>
      {spread(10, (i) => ({ i })).map((_, i) => (
        <span
          key={i}
          className="ember absolute bottom-6 h-1 w-1 rounded-full bg-[#ffd27a] shadow-[0_0_6px_#ffb02e]"
          style={{ left: `${18 + i * 7}%`, animationDelay: `${(i * 0.43) % 3}s`, ["--dx" as string]: `${(i % 2 ? 1 : -1) * (8 + i * 2)}px` }}
        />
      ))}
    </>
  );
}

function Snow() {
  const lights = ["#ff8f7a", "#ffc56e", "#6ff0d8", "#c9b8ff"];
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_0%,rgb(160_220_255/0.25),transparent_70%)]" />
      <svg viewBox="0 0 300 30" className="absolute inset-x-0 top-1 h-8 w-full" preserveAspectRatio="none">
        <path d="M0 6 Q75 26 150 8 T300 8" fill="none" stroke="rgb(255 255 255 / 0.3)" strokeWidth="1" />
        {spread(12, (i) => ({ i })).map((_, i) => {
          const x = 12 + i * 25;
          const y = 8 + Math.sin((x / 300) * Math.PI * 2 + 0.4) * 8 + 4;
          return <circle key={i} cx={x} cy={y} r="3" fill={lights[i % 4]} className="blink" style={{ animationDelay: `${i * 0.2}s` }} />;
        })}
      </svg>
      {spread(26, (i) => ({ i })).map((_, i) => (
        <span
          key={i}
          className="snow absolute top-0 rounded-full bg-white"
          style={{
            left: `${(i * 37) % 100}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            opacity: 0.5 + (i % 3) * 0.2,
            animationDuration: `${5 + (i % 5)}s`,
            animationDelay: `-${(i * 0.7) % 8}s`,
            ["--dx" as string]: `${(i % 2 ? 1 : -1) * (10 + (i % 4) * 8)}px`,
          }}
        />
      ))}
      <svg viewBox="0 0 60 70" className="absolute bottom-0 left-6 h-24 w-20">
        <path d="M30 4 L52 60 H8 Z" fill="#0e7c74" />
        <path d="M30 4 L44 36 H16 Z" fill="#14a093" />
        <rect x="26" y="60" width="8" height="8" fill="#7c4a1e" />
        <path d="M30 0 l2 4 4 .5 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.5z" fill="#ffd57a" className="blink" />
        {[[22, 40], [36, 46], [28, 52], [18, 56], [42, 54]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill={lights[i % 4]} className="blink" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
      </svg>
    </>
  );
}

function Fireworks() {
  const bursts = [
    { x: "22%", y: "38%", c: "#ffc56e", d: 0 },
    { x: "58%", y: "26%", c: "#6ff0d8", d: 0.9 },
    { x: "80%", y: "46%", c: "#ff8f7a", d: 1.7 },
  ];
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(30_20_70/0.5),transparent)]" />
      {bursts.map((b, n) => (
        <div key={n} className="absolute" style={{ left: b.x, top: b.y }}>
          <span className="rocket absolute -ml-px h-6 w-0.5 rounded-full" style={{ background: `linear-gradient(${b.c}, transparent)`, animationDelay: `${b.d}s` }} />
          {spread(14, (i) => ({ i })).map((_, i) => (
            <span
              key={i}
              className="spark absolute -ml-1 -mt-1 h-1.5 w-1.5 rounded-full"
              style={{
                background: b.c,
                boxShadow: `0 0 8px ${b.c}`,
                ["--a" as string]: `${i * (360 / 14)}deg`,
                ["--dist" as string]: `${34 + (i % 3) * 8}px`,
                animationDelay: `${b.d}s`,
              }}
            />
          ))}
        </div>
      ))}
      <svg viewBox="0 0 300 40" className="absolute inset-x-0 bottom-0 h-10 w-full" preserveAspectRatio="none">
        <path d="M0 40 V22 h20 v-8 h18 v14 h22 v-18 h16 v8 h24 v-14 h14 v20 h30 v-10 h18 v6 h26 v-16 h16 v12 h30 v-6 h22 v10 h26 v22 z" fill="#03171e" />
      </svg>
    </>
  );
}

function Shuttle() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_100%,rgb(111_240_216/0.22),transparent_70%)]" />
      <svg viewBox="0 0 360 140" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        {/* The court, in perspective, with the net in the middle. */}
        <path d="M40 135 L110 70 H250 L320 135 Z" fill="rgb(111 240 216 / 0.06)" stroke="rgb(111 240 216 / 0.35)" />
        <path d="M180 70 V135 M75 102 H285" stroke="rgb(111 240 216 / 0.25)" />
        <path d="M100 96 H260 V78 H100 Z" fill="none" stroke="rgb(255 255 255 / 0.45)" strokeDasharray="2 3" />
      </svg>
      <div className="absolute inset-0">
        <svg viewBox="0 0 20 20" className="rally absolute left-0 top-0 h-5 w-5">
          <path d="M2 10 L14 4 L18 10 L14 16 Z" fill="#f4fffc" />
          <circle cx="16" cy="10" r="3" fill="#ffc56e" />
        </svg>
      </div>
    </>
  );
}

function Water() {
  return (
    <>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_143_122/0.12)_0_12px,transparent_12px_24px)]" />
      {spread(8, (i) => ({ i })).map((_, i) => (
        <span
          key={i}
          className="drop absolute top-2 h-3 w-1.5 rounded-full bg-[#82cfff]"
          style={{ left: `${10 + i * 11}%`, animationDelay: `${(i * 0.37) % 1.8}s`, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-12 overflow-hidden">
        <svg viewBox="0 0 600 40" className="wave absolute bottom-0 h-full w-[200%]" preserveAspectRatio="none">
          <path d="M0 20 Q37.5 5 75 20 T150 20 T225 20 T300 20 T375 20 T450 20 T525 20 T600 20 V40 H0 Z" fill="rgb(130 207 255 / 0.35)" />
        </svg>
      </div>
    </>
  );
}

function Plain() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_30%_0%,rgb(201_184_255/0.25),transparent_70%)]" />
      <svg viewBox="0 0 200 200" className="spin-slow absolute -right-10 -top-16 h-56 w-56 opacity-50">
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgb(201 184 255 / 0.5)" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="rgb(111 240 216 / 0.3)" strokeDasharray="20 10" />
      </svg>
    </>
  );
}
