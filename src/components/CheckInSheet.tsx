"use client";

import { Icon } from "@/components/Icon";
import { haptic } from "@/lib/haptics";
import type { CheckInPatch } from "@/lib/store";
import type { DayRecord, Experiment } from "@/lib/types";

/**
 * Daily check-in — the "Routine + Product History" half of Skin Memory.
 * Three yes/no questions filed against today's record so the Response Graph
 * can split routine days from off days and mark when the experiment variable
 * was actually applied.
 */
interface CheckInSheetProps {
  record: DayRecord;
  experiment: Experiment | null;
  onChange: (patch: CheckInPatch) => void;
}

type Field = keyof Pick<DayRecord, "routineDone" | "experimentApplied" | "noTouch">;

interface Question {
  field: Field;
  icon: string;
  label: string;
  hint: string;
}

export function CheckInSheet({ record, experiment, onChange }: CheckInSheetProps) {
  const questions: Question[] = [
    {
      field: "routineDone",
      icon: "favorite",
      label: "오늘 루틴 했어요",
      hint: "세안 · 보습 · 자외선 차단",
    },
  ];
  if (experiment && record.day >= experiment.startDay) {
    questions.push({
      field: "experimentApplied",
      icon: "science",
      label: "실험 변수 적용했어요",
      hint: experiment.title,
    });
  }
  questions.push({
    field: "noTouch",
    icon: "back_hand",
    label: "얼굴 안 만졌어요",
    hint: "손이 닿는 횟수 줄이기",
  });

  const answered = questions.filter((q) => record[q.field] !== undefined).length;
  const allDone = answered === questions.length;

  /** Answers one question; a stronger buzz when this answer completes the sheet. */
  const answer = (patch: CheckInPatch) => {
    const nextAnswered = questions.filter((q) => {
      const v = q.field in patch ? patch[q.field] : record[q.field];
      return v !== undefined;
    }).length;
    haptic(!allDone && nextAnswered === questions.length ? "success" : "select");
    onChange(patch);
  };

  return (
    <section className="sheet-up rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-label-bold text-label-bold text-on-surface">오늘의 체크인</h3>
        <span
          key={allDone ? "done" : "progress"}
          className={`rounded-full px-2.5 py-0.5 font-label-sm text-label-sm ${
            allDone ? "pop bg-primary-fixed text-primary" : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {allDone ? "완료" : `${answered}/${questions.length}`}
        </span>
      </div>
      <p className="mb-4 font-label-sm text-label-sm text-on-surface-variant">
        30초면 끝나요. 반응 그래프에 그대로 기록돼요.
      </p>

      <ul className="flex flex-col gap-2">
        {questions.map((q) => {
          const value = record[q.field];
          return (
            <li
              key={q.field}
              className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pure-white text-primary">
                <Icon name={q.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1 break-keep">
                <p className="font-label-bold text-label-bold text-on-surface">{q.label}</p>
                <p className="truncate font-label-sm text-label-sm text-on-surface-variant">{q.hint}</p>
              </div>
              <div role="group" aria-label={q.label} className="flex shrink-0 gap-1">
                <Pill
                  active={value === true}
                  answered={value !== undefined}
                  tone="yes"
                  onClick={() => answer({ [q.field]: true })}
                >
                  예
                </Pill>
                <Pill
                  active={value === false}
                  answered={value !== undefined}
                  tone="no"
                  onClick={() => answer({ [q.field]: false })}
                >
                  아니요
                </Pill>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Pill({
  active,
  answered,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  answered: boolean;
  tone: "yes" | "no";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const filled =
    tone === "yes" ? "bg-secondary-container text-primary" : "bg-surface-container-highest text-on-surface";
  const idle = answered
    ? "bg-transparent text-on-surface-variant/50 hover:bg-pure-white"
    : "bg-pure-white text-on-surface-variant hover:bg-surface-container";
  return (
    <button
      key={active ? "active" : "idle"}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 font-label-bold text-label-bold transition-colors ${
        active ? `pop ${filled}` : idle
      }`}
    >
      {children}
    </button>
  );
}
