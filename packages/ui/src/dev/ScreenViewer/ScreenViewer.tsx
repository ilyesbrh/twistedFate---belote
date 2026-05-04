import { type ReactElement, useMemo, useState } from "react";
import { type Fixture, type ViewportPreset, VIEWPORT_PRESETS } from "./types.js";
import styles from "./ScreenViewer.module.css";

interface ScreenViewerProps {
  readonly fixtures: readonly Fixture[];
}

export function ScreenViewer({ fixtures }: ScreenViewerProps): ReactElement {
  const [activeId, setActiveId] = useState<string | null>(fixtures[0]?.id ?? null);
  const [viewportId, setViewportId] = useState<string>(VIEWPORT_PRESETS[0].id);

  const grouped = useMemo(() => groupByGroup(fixtures), [fixtures]);
  const active = fixtures.find((f) => f.id === activeId) ?? null;
  const viewport = VIEWPORT_PRESETS.find((v) => v.id === viewportId) ?? VIEWPORT_PRESETS[0];

  return (
    <div className={styles.root} data-testid="screen-viewer">
      <aside className={styles.sidebar} aria-label="Fixture picker">
        {fixtures.length === 0 ? (
          <div className={styles.emptySidebar}>No fixtures registered.</div>
        ) : (
          grouped.map(([groupName, groupFixtures]) => (
            <section key={groupName} className={styles.group}>
              <h3 className={styles.groupHeader}>{groupName}</h3>
              <ul className={styles.fixtureList}>
                {groupFixtures.map((f) => {
                  const isActive = f.id === activeId;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        className={`${styles.fixtureBtn} ${isActive ? styles.fixtureBtnActive : ""}`}
                        aria-pressed={isActive}
                        onClick={() => {
                          setActiveId(f.id);
                        }}
                      >
                        {f.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.activeTitle} data-testid="screen-viewer-active-title">
            {active ? active.title : "—"}
          </span>
          <span className={styles.activeGroup}>{active ? active.group : ""}</span>
          <ViewportPicker
            presets={VIEWPORT_PRESETS}
            activeId={viewportId}
            onChange={setViewportId}
          />
        </header>

        <div className={styles.stageWrapper}>
          {active === null ? (
            <div className={styles.empty} data-testid="screen-viewer-empty">
              No fixtures registered. Add a fixture file under{" "}
              <code>packages/ui/src/dev/fixtures/</code>.
            </div>
          ) : (
            <div
              className={styles.stage}
              data-testid="screen-viewer-stage"
              style={stageStyle(viewport)}
            >
              {active.render()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function groupByGroup(fixtures: readonly Fixture[]): [string, Fixture[]][] {
  const map = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const list = map.get(f.group) ?? [];
    list.push(f);
    map.set(f.group, list);
  }
  return Array.from(map.entries());
}

function stageStyle(v: ViewportPreset): React.CSSProperties {
  if (v.width === null || v.height === null) {
    return { width: "100%", height: "100%" };
  }
  return { width: `${String(v.width)}px`, height: `${String(v.height)}px` };
}

interface ViewportPickerProps {
  readonly presets: readonly ViewportPreset[];
  readonly activeId: string;
  readonly onChange: (id: string) => void;
}

function ViewportPicker({ presets, activeId, onChange }: ViewportPickerProps): ReactElement {
  return (
    <div className={styles.viewportPicker} role="group" aria-label="Viewport size">
      {presets.map((p) => {
        const isActive = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            className={`${styles.viewportBtn} ${isActive ? styles.viewportBtnActive : ""}`}
            aria-pressed={isActive}
            onClick={() => {
              onChange(p.id);
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
