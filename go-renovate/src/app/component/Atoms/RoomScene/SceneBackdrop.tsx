import React from "react";
import { ResolvedScene, SceneFixture, bookcaseLayout } from "@/app/utils/sceneSpec";

// Draws a Space as inline SVG: tiny, crisp at any size, themeable and needing
// no image hosting. The drawing is in real centimetres converted to SVG units
// (1000 wide), so windows, doors and tiles are to scale with the room — and
// with the products placed in it.
const W = 1000;

type Props = {
  scene: ResolvedScene;
};

function Fixture({
  fixture,
  unit,
  wallBottomY,
}: {
  fixture: SceneFixture;
  // SVG units per centimetre.
  unit: number;
  // SVG y of the floor line (the wall's bottom edge).
  wallBottomY: number;
}) {
  const w = fixture.widthCm * unit;
  const h = fixture.heightCm * unit;
  const x = fixture.xCm * unit;
  const y = wallBottomY - (fixture.bottomCm + fixture.heightCm) * unit;

  switch (fixture.type) {
    case "window": {
      const frame = Math.max(4, 5 * unit);
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx="4" fill="#fff" />
          <rect x={x + frame} y={y + frame} width={w - frame * 2} height={h - frame * 2} fill="#cfe8f6" />
          <rect x={x + frame} y={y + frame} width={w - frame * 2} height={(h - frame * 2) * 0.45} fill="#e6f4fb" />
          <rect x={x + w / 2 - frame / 2} y={y + frame} width={frame} height={h - frame * 2} fill="#fff" />
          <rect x={x + frame} y={y + h / 2 - frame / 2} width={w - frame * 2} height={frame} fill="#fff" />
        </g>
      );
    }
    case "door":
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx="3" fill="#d9cdb8" />
          <rect x={x + w * 0.14} y={y + h * 0.07} width={w * 0.72} height={h * 0.38} rx="3" fill="#cdbfa6" />
          <rect x={x + w * 0.14} y={y + h * 0.52} width={w * 0.72} height={h * 0.4} rx="3" fill="#cdbfa6" />
          <circle cx={x + w * 0.85} cy={y + h * 0.5} r={Math.max(3, 3 * unit)} fill="#8a7a62" />
        </g>
      );
    case "artframe": {
      const border = Math.max(3, 3 * unit);
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx="2" fill="#5b4a3a" />
          <rect x={x + border} y={y + border} width={w - border * 2} height={h - border * 2} fill={fixture.color ?? "#cdbf9f"} />
        </g>
      );
    }
    case "bookcase": {
      const layout = bookcaseLayout(fixture);
      const frame = layout.frameCm * unit;
      const board = layout.boardCm * unit;
      const divider = layout.dividerCm * unit;
      const wood = fixture.color ?? "#b58a56";
      const dark = "#8f6a3f";
      const cells = layout.cells.filter((cell) => cell.row === 0);
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx="3" fill={wood} />
          {/* back panel */}
          <rect x={x + frame} y={y + frame} width={w - frame * 2} height={h - frame - layout.plinthCm * unit} fill="#a57a48" />
          {/* shelf boards */}
          {layout.boardBottomsCm.map((bottom) => (
            <rect
              key={bottom}
              x={x + frame}
              y={wallBottomY - (bottom + layout.boardCm) * unit}
              width={w - frame * 2}
              height={board}
              fill={wood}
            />
          ))}
          <rect x={x + frame} y={wallBottomY - (layout.boardBottomsCm[0] + layout.boardCm) * unit + board} width={w - frame * 2} height={Math.max(1, board * 0.5)} fill={dark} opacity="0.35" />
          {/* vertical dividers */}
          {cells.slice(0, -1).map((cell) => (
            <rect
              key={cell.col}
              x={(cell.leftCm + cell.widthCm) * unit}
              y={y + frame}
              width={divider}
              height={h - frame - layout.plinthCm * unit}
              fill={wood}
            />
          ))}
          {/* plinth */}
          <rect x={x} y={wallBottomY - layout.plinthCm * unit} width={w} height={layout.plinthCm * unit} fill={dark} />
        </g>
      );
    }
    case "counter": {
      const top = Math.min(h * 0.18, 4 * unit);
      const doors = Math.max(2, Math.round(fixture.widthCm / 45));
      return (
        <g>
          <rect x={x} y={y + top} width={w} height={h - top} fill="#b69a76" />
          {Array.from({ length: doors }, (_, i) => (
            <rect
              key={i}
              x={x + (w / doors) * i + 4}
              y={y + top + 5}
              width={w / doors - 8}
              height={h - top - 10}
              rx="2"
              fill="#c7ac87"
            />
          ))}
          <rect x={x - 3} y={y} width={w + 6} height={top} rx="2" fill="#d8d1c3" />
        </g>
      );
    }
    default:
      return null;
  }
}

export default function SceneBackdrop({ scene }: Props) {
  const { spec } = scene;
  const unit = W / scene.sceneWidthCm;
  const height = Math.round(scene.heightCm * unit);
  const fy = Math.round(spec.floorLine * height);
  const planks = Array.from({ length: 9 }, (_, i) => i);
  const shade = spec.wall.shade ?? spec.wall.color;
  const isTiled = spec.wall.pattern === "tiles";
  // Wall tiles are ~30 cm square, so they scale with the room.
  const tile = Math.max(24, 30 * unit);

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {/* wall */}
      <rect x="0" y="0" width={W} height={fy} fill={spec.wall.color} />
      <rect x="0" y="0" width={W} height={fy * 0.35} fill={shade} opacity="0.55" />

      {isTiled &&
        Array.from({ length: Math.ceil(fy / tile) }, (_, row) => (
          <line
            key={`h${row}`}
            x1="0"
            x2={W}
            y1={fy - row * tile}
            y2={fy - row * tile}
            stroke={shade}
            strokeWidth="2"
          />
        ))}
      {isTiled &&
        Array.from({ length: Math.ceil(W / tile) + 1 }, (_, col) => (
          <line key={`v${col}`} y1="0" y2={fy} x1={col * tile} x2={col * tile} stroke={shade} strokeWidth="2" />
        ))}

      {spec.fixtures.map((fixture, index) => (
        <Fixture
          key={`${fixture.type}-${index}`}
          fixture={fixture}
          unit={unit}
          wallBottomY={fy}
        />
      ))}

      {/* baseboard (~10 cm) */}
      <rect
        x="0"
        y={fy - Math.max(8, 10 * unit)}
        width={W}
        height={Math.max(8, 10 * unit)}
        fill={spec.baseboard ?? "#f7f8f9"}
      />

      {/* floor */}
      <rect x="0" y={fy} width={W} height={height - fy} fill={spec.floor.color} />
      <rect x="0" y={fy} width={W} height="26" fill="#000" opacity="0.06" />
      {planks.map((i) => {
        // Lines fan out from a vanishing point above the room for a hint of depth.
        const topX = 100 + i * 100;
        const bottomX = -300 + i * 200;
        return (
          <line
            key={i}
            x1={topX}
            y1={fy}
            x2={bottomX}
            y2={height}
            stroke={spec.floor.lineColor ?? spec.floor.color}
            strokeWidth="2"
            opacity="0.6"
          />
        );
      })}
    </svg>
  );
}
