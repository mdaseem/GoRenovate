"use client";
import React, { useMemo, useState } from "react";
import styles from "./ViewerLab.module.css";
import BackLink from "../../Atoms/BackLink/BackLink";
import GLViewer, { LoadedModelFacts, ViewerSource } from "../../Atoms/GLViewer/GLViewer";
import { CheckStatus, buildReport } from "@/app/utils/gl/modelCheck";

const STATUS_WORDS: Record<CheckStatus, string> = { pass: "Pass", warn: "Check", fail: "Fix" };

// "" or junk = not given.
const toCm = (text: string) => {
  const value = Number(text);
  return text.trim() !== "" && Number.isFinite(value) && value > 0 ? value : undefined;
};

const SAMPLES: { id: string; label: string; source: ViewerSource }[] = [
  { id: "cube", label: "Test cube", source: { type: "cube" } },
  {
    id: "table",
    label: "Oak table",
    source: { type: "url", url: "/models/test/test-table.glb", label: "Oak table (test model)" },
  },
  {
    id: "crate",
    label: "Wooden crate",
    source: { type: "url", url: "/models/test/test-crate.glb", label: "Wooden crate (test model)" },
  },
];

// A test bench for the in-house 3D product viewer (see the room-visual-preview
// skill, phase 3). It is where each milestone is tried on its own before it goes
// into a product page: a lit cube, then real .glb files (ours or your own).
export default function ViewerLab() {
  const [sampleId, setSampleId] = useState("cube");
  const [fileSource, setFileSource] = useState<ViewerSource | null>(null);
  const [facts, setFacts] = useState<LoadedModelFacts | null>(null);
  const [listed, setListed] = useState({ w: "", h: "", d: "" });

  const report = useMemo(
    () => (facts ? buildReport(facts, { w: toCm(listed.w), h: toCm(listed.h), d: toCm(listed.d) }) : null),
    [facts, listed],
  );

  const source = fileSource ?? SAMPLES.find((sample) => sample.id === sampleId)?.source ?? SAMPLES[0].source;

  const pickSample = (id: string) => {
    setFileSource(null);
    setSampleId(id);
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again after a fix
    if (file) setFileSource({ type: "file", file, label: file.name });
  };

  return (
    <main className={styles.page}>
      <BackLink />
      <h1 className={styles.title}>3D viewer lab</h1>
      <p className={styles.lead}>
        A work-in-progress test bench for Go Renovate&apos;s own 3D product viewer. Drag the
        model to turn it, or use the arrow keys.
      </p>

      <fieldset className={styles.picker}>
        <legend className={styles.legend}>Choose a model</legend>
        <div className={styles.options}>
          {SAMPLES.map((sample) => (
            <label key={sample.id} className={styles.option}>
              <input
                type="radio"
                name="sample"
                value={sample.id}
                checked={!fileSource && sampleId === sample.id}
                onChange={() => pickSample(sample.id)}
              />
              <span>{sample.label}</span>
            </label>
          ))}
        </div>
        <label className={styles.fileButton}>
          Open a .glb from your device
          <input type="file" accept=".glb,model/gltf-binary" onChange={onFile} className={styles.fileInput} />
        </label>
        <p className={styles.hint}>
          Your file is read in this browser only — it is never uploaded. Up to 12 MB; pictures
          inside it should be 2048 px or smaller.
        </p>
      </fieldset>

      <GLViewer source={source} onModelChange={setFacts} />

      {report && (
        <section className={styles.report} aria-labelledby="model-report">
          <h2 id="model-report" className={styles.notesTitle}>
            Model check — {facts?.label}
          </h2>
          <ul className={styles.checks}>
            {report.map((item) => (
              <li key={item.id} className={styles.check} data-status={item.status}>
                <span className={styles.checkStatus}>{STATUS_WORDS[item.status]}</span>
                <span>
                  <strong>{item.label}.</strong> {item.detail}
                </span>
              </li>
            ))}
          </ul>
          <fieldset className={styles.listed}>
            <legend className={styles.hint}>Compare with the product&apos;s listed size (cm, optional)</legend>
            {(["w", "d", "h"] as const).map((axis) => (
              <label key={axis} className={styles.listedField}>
                <span>{{ w: "Width", d: "Depth", h: "Height" }[axis]}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={listed[axis]}
                  onChange={(event) => setListed({ ...listed, [axis]: event.target.value })}
                />
              </label>
            ))}
          </fieldset>
        </section>
      )}

      <section className={styles.notes} aria-labelledby="viewer-notes">
        <h2 id="viewer-notes" className={styles.notesTitle}>
          Milestones 2 to 5 — what you are looking at
        </h2>
        <ul className={styles.list}>
          <li>
            A .glb file is a small package: a header, a JSON description of the scene, and one
            block of raw numbers (corner points, surface directions, picture coordinates).
          </li>
          <li>
            Our own loader checks every number against the file&apos;s real size before using it,
            so a broken or hostile file gets a friendly message instead of a crash.
          </li>
          <li>
            Each piece of the model keeps its own material (colour, shininess) and, if it has
            one, its picture — the crate&apos;s planks are a 64 px image wrapped onto its faces.
          </li>
          <li>
            The camera backs off just far enough to fit any model in the frame, whatever its size.
          </li>
          <li>
            Milestone 3 adds the camera: drag to turn (a quick flick keeps coasting), pinch with
            two fingers or press + and − to zoom, or Ctrl + scroll on a computer. A soft shadow
            under the model shows it is standing on the floor.
          </li>
          <li>
            Milestone 4 put a &quot;View in 3D&quot; button on products that have a model.
          </li>
          <li>
            Milestone 5 is the check above: file size, detail, picture size and whether the
            model&apos;s real-world size matches the product&apos;s listed size. The same size
            rule runs on the server before a product with a model can be saved.
          </li>
        </ul>
      </section>
    </main>
  );
}
