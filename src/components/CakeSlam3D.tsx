// 3D word-cake: slabs labelled CONTROL / YOUR / NOISE slam down to build a cake.
// Pure CSS 3D — no deps. Colors pulled from the Layercake palette.

type Slab = {
  word?: string;
  w: number;
  h: number;
  front: string;
  top: string;
  side: string;
  ink: string;
};

const D = 56; // depth of every slab

const SLABS: Slab[] = [
  // bottom -> top (slam order)
  {
    word: "noise",
    w: 310,
    h: 84,
    front: "linear-gradient(180deg, #B6EFBE 0%, #7FD68D 100%)",
    top: "linear-gradient(180deg, #E4FBE7 0%, #A9E9B3 100%)",
    side: "linear-gradient(180deg, #8FD99B 0%, #5FBE70 100%)",
    ink: "#1F5B2C",
  },
  {
    word: "your",
    w: 288,
    h: 84,
    front: "linear-gradient(180deg, #A9DEFF 0%, #62B9F5 100%)",
    top: "linear-gradient(180deg, #DBF2FF 0%, #97D3FB 100%)",
    side: "linear-gradient(180deg, #84C8F3 0%, #4A9FDD 100%)",
    ink: "#123E63",
  },
  {
    word: "control",
    w: 266,
    h: 84,
    front: "linear-gradient(180deg, #FFC1D5 0%, #FF7FA8 100%)",
    top: "linear-gradient(180deg, #FFE3EC 0%, #FFA9C4 100%)",
    side: "linear-gradient(180deg, #FF9EBE 0%, #E85F8C 100%)",
    ink: "#6B1233",
  },
  {
    // frosting cap
    w: 250,
    h: 34,
    front: "linear-gradient(180deg, #FFFFFF 0%, #FFE7F0 100%)",
    top: "linear-gradient(180deg, #FFFFFF 0%, #FFF3F8 100%)",
    side: "linear-gradient(180deg, #FFF0F6 0%, #FFD4E4 100%)",
    ink: "#6B1233",
  },
];

const GAP = 4;
const STACK_H = SLABS.reduce((a, s) => a + s.h + GAP, 0);
const STAGE_H = STACK_H + 120;
const STEP = 0.5; // seconds between slams

function Face({ style, children }: { style: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        backfaceVisibility: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CakeSlam3D() {
  return (
    <div
      className="slam-stage"
      style={{ height: STAGE_H, width: "min(100%, 460px)" }}
      aria-label="Three cake layers reading control your noise slamming together"
      role="img"
    >
      <div className="slam-world">
        {SLABS.map((s, i) => {
          // y of this slab's centre, measured from the bottom of the stack
          let below = 0;
          for (let k = 0; k < i; k++) below += SLABS[k].h + GAP;
          const bottom = below;

          return (
            <div
              key={i}
              className="slam-slab"
              style={{
                width: s.w,
                height: s.h,
                bottom,
                animationDelay: `${i * STEP}s`,
                zIndex: 10 + i,
              }}
            >
              {/* top face */}
              <Face
                style={{
                  width: s.w,
                  height: D,
                  background: s.top,
                  transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${s.h / 2}px)`,
                  borderRadius: 6,
                }}
              />
              {/* right side */}
              <Face
                style={{
                  width: D,
                  height: s.h,
                  background: s.side,
                  transform: `translate(-50%, -50%) rotateY(90deg) translateZ(${s.w / 2}px)`,
                  borderRadius: 6,
                }}
              />
              {/* front face */}
              <Face
                style={{
                  width: s.w,
                  height: s.h,
                  background: s.front,
                  transform: `translate(-50%, -50%) translateZ(${D / 2}px)`,
                  borderRadius: 8,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65), 0 6px 14px -8px rgba(90,40,80,0.45)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {s.word ? (
                  <span
                    className="font-display"
                    style={{
                      color: s.ink,
                      fontSize: Math.min(s.h * 0.56, 46),
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      textTransform: "lowercase",
                      textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                      lineHeight: 1,
                    }}
                  >
                    {s.word}
                  </span>
                ) : null}
                {/* crumb sprinkles */}
                {[0.18, 0.4, 0.62, 0.84].map((p, j) => (
                  <span
                    key={j}
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: `${p * 100}%`,
                      top: `${18 + (j % 2) * 58}%`,
                      width: 7,
                      height: 3,
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.75)",
                      transform: `rotate(${j * 41}deg)`,
                    }}
                  />
                ))}
              </Face>
            </div>
          );
        })}

        {/* cherry */}
        <div
          className="slam-cherry"
          style={{ bottom: STACK_H + 6, animationDelay: `${SLABS.length * STEP}s` }}
          aria-hidden
        >
          <span className="slam-cherry-stem" />
          <span className="slam-cherry-ball" />
        </div>

        {/* plate */}
        <div className="slam-plate" aria-hidden />
      </div>
    </div>
  );
}
