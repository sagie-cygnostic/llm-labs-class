import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { BoardCell, BoardLab, BoardLearner, BoardResponse, SseBoard, TimelineEvent } from "../../../shared/api";
import { createApi } from "../api";
import { DEMO_CLASS, DEMO_INSTRUCTOR_KEY } from "../api/mock";
import { ConfirmDialog, ErrorBox, Loading } from "../components/Bits";
import { formatTime } from "../format";
import { boardLabel, boardMark, failureLabel, timelineLabel } from "../labels";
import { useMock, useTo } from "../nav";
import { getInstructorClass, getInstructorKey, saveInstructor } from "../storage";
import { labText } from "../lab-copy";
import { surface } from "../learner/surface";
import { useUiLang } from "../ui-lang";

function learnerLink(joinPath: string, mock: boolean): string {
  const absolute = joinPath.startsWith("http")
    ? joinPath
    : `${window.location.origin}${joinPath.startsWith("/") ? joinPath : `/${joinPath}`}`;
  if (!mock) return absolute;
  return `${absolute}${absolute.includes("?") ? "&" : "?"}mock=1`;
}

function attackedOrFixed(state: BoardCell, attacked: string, fixed: string): string | null {
  if (state === "attack" || state === "attack_succeeded") return attacked;
  if (state === "passed" || state === "passed_after_solution") return fixed;
  return null;
}

export function TeachPage() {
  const mock = useMock();
  const to = useTo();
  const { lang, copy } = useUiLang();
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [joinPath, setJoinPath] = useState("/");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<{ learner: BoardLearner; lab: BoardLab; events: TimelineEvent[] } | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [skipTarget, setSkipTarget] = useState<{ learner: BoardLearner; lab: BoardLab } | null>(null);

  const load = useCallback(
    async (classCode: string) => {
      const next = await createApi(mock).board(classCode);
      setBoard(next);
    },
    [mock],
  );

  useEffect(() => {
    const classCode = getInstructorClass();
    const key = getInstructorKey();
    if (!classCode || !key) return;
    let cancel = false;
    setLoading(true);
    load(classCode)
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : copy.boardFail);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [copy.boardFail, load]);

  useEffect(() => {
    const key = getInstructorKey();
    if (!key) return;
    return createApi(mock).subscribe({ instructorKey: key }, (name, data) => {
      if (name === "board" || name === "session_closed") {
        const event = data as SseBoard;
        const classCode = event.classCode || getInstructorClass();
        if (classCode) load(classCode).catch(() => undefined);
      }
    });
  }, [load, mock]);

  async function create(force: boolean) {
    if (board && !force) {
      setConfirmNew(true);
      return;
    }
    setConfirmNew(false);
    setError(null);
    setLoading(true);
    try {
      const created = await createApi(mock).createSession();
      saveInstructor(created.classCode, created.instructorKey);
      setJoinPath(created.joinPath);
      await load(created.classCode);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : copy.createFail);
    } finally {
      setLoading(false);
    }
  }

  function useDemo() {
    saveInstructor(DEMO_CLASS, DEMO_INSTRUCTOR_KEY);
    setJoinPath("/");
    setError(null);
    setLoading(true);
    load(DEMO_CLASS)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : copy.demoFail))
      .finally(() => setLoading(false));
  }

  async function mutate(action: () => Promise<void>) {
    if (!board) return;
    setError(null);
    try {
      await action();
      await load(board.classCode);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : copy.actionFail);
    }
  }

  async function openTimeline(learner: BoardLearner, lab: BoardLab) {
    if (!board) return;
    setError(null);
    try {
      const response = await createApi(mock).timeline(board.classCode, learner.learnerId, lab.id);
      setTimeline({ learner, lab, events: response.events });
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : copy.timeFail);
    }
  }

  async function exportFile() {
    if (!board) return;
    setError(null);
    try {
      const data = await createApi(mock).exportSession(board.classCode);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `summary-${board.classCode}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : copy.exportFail);
    }
  }

  const classCode = board?.classCode ?? getInstructorClass();

  return (
    <>
      <h1>{copy.teachTitle}</h1>
      <p className="lede">{copy.teachLede}</p>
      {error ? <ErrorBox text={error} /> : null}
      <div className="row">
        <button type="button" className="btn primary" onClick={() => void create(false)}>
          {copy.openSession}
        </button>
        {mock ? (
          <button type="button" className="btn" onClick={useDemo}>
            {copy.demoLoad}
          </button>
        ) : null}
      </div>
      {mock ? <p className="note">{copy.demoOnly}</p> : null}
      {loading && !board ? <Loading text={copy.loadingBoard} /> : null}
      {!board && !loading ? <p>{copy.noSession}</p> : null}
      {board && classCode ? (
        <>
          <section className="panel slab">
            <h2>{copy.classCode}</h2>
            <p className="pin" dir="ltr">
              {board.classCode}
            </p>
            <p>
              {copy.learnerLink}:{" "}
              <a dir="ltr" href={learnerLink(joinPath, mock)}>
                {learnerLink(joinPath, mock)}
              </a>
            </p>
            <p>{copy.keyNote}</p>
            {board.closed ? <p className="note">{copy.closedSess}</p> : null}
            <div className="header-actions">
              <button type="button" className="btn" disabled={board.closed} onClick={() => void mutate(() => createApi(mock).openAll(board.classCode))}>
                {copy.openAll}
              </button>
              <Link className="btn primary" to={to(`/teach/${board.classCode}/project`)}>
                {copy.project}
              </Link>
              <button type="button" className="btn warn" disabled={board.closed} onClick={() => setConfirmClose(true)}>
                {copy.closeSess}
              </button>
              <button type="button" className="btn" onClick={() => void exportFile()}>
                {copy.exportSum}
              </button>
            </div>
          </section>
          <div className="board-wrap">
            <table className="board">
              <caption>{copy.boardCaption}</caption>
              <thead>
                <tr>
                  <th className="learner">{copy.learner}</th>
                  {board.labs.map((lab) => (
                    <th key={lab.id}>
                      <div>{labText(lang, lab.id, "title", lab.titleHe)}</div>
                      <div dir="ltr">{lab.owaspId}</div>
                      <div>{lab.open ? copy.labOpen : copy.labLocked}</div>
                      <div className="row">
                        <button type="button" className="btn" disabled={board.closed || lab.open} onClick={() => void mutate(() => createApi(mock).openLab(board.classCode, lab.id))}>
                          {copy.open}
                        </button>
                        <button type="button" className="btn" disabled={board.closed || !lab.open} onClick={() => void mutate(() => createApi(mock).lockLab(board.classCode, lab.id))}>
                          {copy.lock}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.learners.length === 0 ? (
                  <tr>
                    <td colSpan={board.labs.length + 1}>{copy.emptyLearners}</td>
                  </tr>
                ) : null}
                {board.learners.map((learner) => (
                  <tr key={learner.learnerId}>
                    <th className="learner" scope="row">
                      {learner.displayName}
                    </th>
                    {board.labs.map((lab) => {
                      const cell = learner.cells[lab.id] ?? { state: "not_started" as const };
                      const category = cell.failureCategory ? failureLabel[cell.failureCategory] : "";
                      const mark = attackedOrFixed(cell.state, copy.attacked, copy.passed);
                      return (
                        <td key={lab.id}>
                          <button
                            type="button"
                            className={`cell cell-${cell.state}`}
                            onClick={() => void openTimeline(learner, lab)}
                            title={`${learner.displayName}, ${labText(lang, lab.id, "title", lab.titleHe)}, ${boardLabel[cell.state]} ${category}`}
                          >
                            <span>{boardMark[cell.state]}</span>
                            {mark ? <small>{mark}</small> : <small>{boardLabel[cell.state]}</small>}
                            {cell.state === "submitted_failed" && cell.failureCategory ? <small>{failureLabel[cell.failureCategory]}</small> : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {timeline && board ? (
        <div className="modal-back" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <h2>
              {timeline.learner.displayName} · {labText(lang, timeline.lab.id, "title", timeline.lab.titleHe)}
            </h2>
            {timeline.events.length === 0 ? <p>{copy.timelineEmpty}</p> : null}
            <ul className="timeline">
              {timeline.events.map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  <strong>{timelineLabel[event.kind]}</strong>
                  <div>{formatTime(event.at)}</div>
                  <div>{surface(lang, timeline.lab.id, event.textHe)}</div>
                </li>
              ))}
            </ul>
            <div className="row">
              <button type="button" className="btn" disabled={board.closed} onClick={() => setSkipTarget({ learner: timeline.learner, lab: timeline.lab })}>
                {copy.skip}
              </button>
              <button type="button" className="btn" onClick={() => setTimeline(null)}>
                {copy.closeDlg}
              </button>
            </div>
            <p>{copy.skipNote}</p>
          </div>
        </div>
      ) : null}

      {skipTarget && board ? (
        <ConfirmDialog
          title={copy.skipTitle}
          body={`Allow ${skipTarget.learner.displayName} to skip to the patch stage. Logged as an instructor action.`}
          confirmLabel={copy.skipYes}
          onConfirm={() => {
            const target = skipTarget;
            setSkipTarget(null);
            void mutate(() => createApi(mock).skip(board.classCode, target.learner.learnerId, target.lab.id));
          }}
          onCancel={() => setSkipTarget(null)}
        />
      ) : null}
      {confirmClose && board ? (
        <ConfirmDialog
          title={copy.closeTitle}
          body={copy.closeBody}
          confirmLabel={copy.closeYes}
          danger
          onConfirm={() => {
            setConfirmClose(false);
            void mutate(() => createApi(mock).closeSession(board.classCode));
          }}
          onCancel={() => setConfirmClose(false)}
        />
      ) : null}
      {confirmNew ? (
        <ConfirmDialog
          title={copy.newTitle}
          body={copy.newBody}
          confirmLabel={copy.newYes}
          onConfirm={() => void create(true)}
          onCancel={() => setConfirmNew(false)}
        />
      ) : null}
    </>
  );
}
