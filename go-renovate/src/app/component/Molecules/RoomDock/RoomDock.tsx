"use client";
import React, { useEffect, useId, useRef, useState } from "react";
import styles from "./RoomDock.module.css";

export type DockTool = {
  id: string;
  // Short label on the chip ("Space", "Colours"…).
  label: string;
  // The current choice, shown under the label so the chip answers "what is it now?".
  summary: string;
  // The tool itself, shown below the chips while its chip is open.
  content: React.ReactNode;
};

type Props = {
  tools: DockTool[];
  ariaLabel: string;
};

// The room's settings (space, colours, size, sharing) as ONE row of chips with
// one panel below, instead of four always-open blocks stacked under the room.
// Only one panel is open at a time; each chip shows its current value, so most
// of the time you never need to open anything.
export default function RoomDock({ tools, ariaLabel }: Props) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = tools.find((tool) => tool.id === openId) ?? null;
  const panelRef = useRef<HTMLDivElement>(null);

  // The panel opens below the chips — often below the fold on a phone — so bring it
  // into view (smoothly, unless the user asked for less motion).
  useEffect(() => {
    if (!openId) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [openId]);

  return (
    <section
      className={styles.dock}
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) setOpenId(null);
      }}
    >
      <ul className={styles.chips} style={{ "--dock-count": tools.length } as React.CSSProperties}>
        {tools.map((tool) => {
          const isOpen = tool.id === openId;
          return (
            <li key={tool.id} className={styles.chipItem}>
              <button
                type="button"
                id={`${baseId}-chip-${tool.id}`}
                className={`${styles.chip}${isOpen ? ` ${styles.chipOpen}` : ""}`}
                aria-expanded={isOpen}
                aria-controls={`${baseId}-panel`}
                onClick={() => setOpenId(isOpen ? null : tool.id)}
              >
                <span className={styles.chipLabel}>{tool.label}</span>
                <span className={styles.chipSummary}>{tool.summary}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {open && (
        <div
          id={`${baseId}-panel`}
          ref={panelRef}
          role="region"
          aria-labelledby={`${baseId}-chip-${open.id}`}
          className={styles.panel}
        >
          <div className={styles.panelBody}>{open.content}</div>
          <button type="button" className={styles.close} onClick={() => setOpenId(null)}>
            Done
          </button>
        </div>
      )}
    </section>
  );
}
