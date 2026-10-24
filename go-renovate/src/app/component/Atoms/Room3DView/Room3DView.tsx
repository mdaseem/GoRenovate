"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./Room3DView.module.css";
import SceneBackdrop from "../RoomScene/SceneBackdrop";
import { ResolvedScene } from "@/app/utils/sceneSpec";
import { World, WorldPiece } from "@/app/utils/roomWorld";
import { CutoutSample } from "@/app/utils/cutoutSample";
import { cutoutImageProps, cutoutSizes } from "@/app/utils/cutoutImage";
import { pieceImageUrl } from "@/app/utils/pieceImage";
import { useCutoutSamples } from "../../CustomHooks/useCutoutSamples";

type Props = {
  scene: ResolvedScene;
  world: World;
  // Read out by screen readers: the room is a picture, so say what is in it.
  label: string;
  // From useLookAround: where the camera angles are written, and the gestures.
  worldRef: React.RefObject<HTMLDivElement | null>;
  gestureProps: React.HTMLAttributes<HTMLElement>;
};

function Card({
  piece,
  widthCm,
  failed,
  onFail,
  sample,
}: {
  piece: WorldPiece;
  widthCm: number;
  failed: boolean;
  onFail: (id: string) => void;
  sample: CutoutSample | undefined;
}) {
  const { item } = piece;
  const style = {
    "--x": piece.xCm,
    "--z": piece.zCm,
    "--yb": piece.yBottomCm,
    "--w": piece.wCm,
    "--d": piece.dCm,
    ...(piece.hCm !== null ? { "--h": piece.hCm } : {}),
    ...(sample ? { "--face": sample.colour, "--solid": sample.solidBottom } : {}),
  } as React.CSSProperties;

  const pictureUrl = pieceImageUrl(item);
  const hasPicture = Boolean(pictureUrl) && !failed;
  const picture = () =>
    hasPicture && pictureUrl ? (
      <Image
        src={pictureUrl}
        alt=""
        width={0}
        height={0}
        sizes={cutoutSizes((piece.wCm / widthCm) * 100, false)}
        {...cutoutImageProps(pictureUrl)}
        loading="eager"
        decoding="async"
        draggable={false}
        onError={() => onFail(item._id)}
        className={`${styles.image}${piece.hCm !== null ? ` ${styles.imageFit}` : ""}${
          piece.kind === "standing" ? ` ${styles.imageBottom}` : ""
        }${piece.flipped ? ` ${styles.flipped}` : ""}`}
      />
    ) : (
      <span className={styles.tile}>{item.name}</span>
    );

  if (piece.kind === "rug") {
    return (
      <div className={styles.rug} style={style}>
        {picture()}
      </div>
    );
  }

  // Without a picture there is nothing to give thickness to.
  const volume = hasPicture ? piece.volume : "flat";

  return (
    <>
      {/* A soft shadow on the floor under standing pieces. */}
      {piece.kind === "standing" && <div className={styles.shadow} style={style} />}
      <div
        className={`${styles.card}${piece.hCm !== null ? ` ${styles.cardSized}` : ""}${
          volume !== "flat" ? ` ${styles.solid}` : ""
        }`}
        style={style}
      >
        {volume === "box" && (
          <>
            <div className={styles.front}>{picture()}</div>
            <div className={`${styles.face} ${styles.sideLeftFace}`} aria-hidden="true" />
            <div className={`${styles.face} ${styles.sideRightFace}`} aria-hidden="true" />
            <div className={`${styles.face} ${styles.topFace}`} aria-hidden="true" />
          </>
        )}
        {volume === "billboard" && (
          <div className={styles.billboard} data-billboard="">
            {picture()}
          </div>
        )}
        {volume === "flat" && picture()}
      </div>
    </>
  );
}

// The room as a real 3D box made from CSS 3D transforms (no WebGL, no library):
// back wall, floor, ceiling and two side walls, with every piece standing at its
// real depth and — if it is solid — real thickness (box faces); round pieces turn
// to keep facing the viewer. Turning it (see
// useLookAround) gives genuine parallax. Pieces are still photos of their FRONT,
// so the turn is capped.
export default function Room3DView({ scene, world, label, worldRef, gestureProps }: Props) {
  const [failed, setFailed] = useState<Set<string>>(new Set());
  // Colours / leg heights for the pieces that get side faces.
  const boxUrls = useMemo(
    () =>
      world.pieces
        .filter((piece) => piece.volume === "box" && pieceImageUrl(piece.item))
        .map((piece) => pieceImageUrl(piece.item) as string),
    [world],
  );
  const samples = useCutoutSamples(boxUrls);

  const vars = {
    "--room-w": world.widthCm,
    "--room-h": world.heightCm,
    "--room-d": world.depthCm,
    "--wall": scene.spec.wall.color,
    "--wall-shade": scene.spec.wall.shade ?? scene.spec.wall.color,
    "--floor": scene.spec.floor.color,
    "--floor-line": scene.spec.floor.lineColor ?? scene.spec.floor.color,
  } as React.CSSProperties;

  return (
    <div className={styles.frame} style={{ ...vars, aspectRatio: scene.aspect }}>
      <div
        className={styles.stage}
        // Not role="img": it takes focus and keyboard input, so it is a labelled group.
        role="group"
        aria-roledescription="3D room viewer"
        aria-label={label}
        tabIndex={0}
        {...gestureProps}
      >
        <div className={styles.world} ref={worldRef}>
          <div className={`${styles.plane} ${styles.back}`}>
            <SceneBackdrop scene={scene} part="wall" />
          </div>
          <div className={`${styles.plane} ${styles.floor}`} />
          <div className={`${styles.plane} ${styles.ceiling}`} />
          <div className={`${styles.plane} ${styles.sideLeft}`} />
          <div className={`${styles.plane} ${styles.sideRight}`} />
          {world.pieces.map((piece) => (
            <Card
              key={piece.key}
              piece={piece}
              widthCm={world.widthCm}
              failed={failed.has(piece.item._id)}
              onFail={(id) => setFailed((prev) => new Set(prev).add(id))}
              sample={pieceImageUrl(piece.item) ? samples[pieceImageUrl(piece.item) as string] : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
