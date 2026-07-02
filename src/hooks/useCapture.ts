import { useCallback, useEffect, useRef, useState } from 'react';
import { parseEvents } from '../lib/parser/parseEvents';
import type { ParsedEventCandidate } from '../lib/parser/parseEvents';
import type { FormState } from '../lib/parser/types';

export const EMPTY_FORM: FormState = {
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  allDay: false,
  location: '',
  notes: '',
};

export const MAX_INPUT = 2000;

const FORM_KEYS = Object.keys(EMPTY_FORM) as (keyof FormState)[];

/** 編集中の予定候補 1 件分。dirty は候補ごとに持つ。 */
export interface Draft {
  id: string;
  form: FormState;
  dirty: Set<keyof FormState>;
  timeGuessed: boolean;
  added: boolean; // このセッションでカレンダー登録済み
}

export interface CaptureSnapshot {
  text: string;
  drafts: Draft[];
  activeIndex: number;
}

function newDraft(form: FormState = EMPTY_FORM): Draft {
  return {
    id: crypto.randomUUID(),
    form: { ...form },
    dirty: new Set(),
    timeGuessed: false,
    added: false,
  };
}

function draftFromParsed(p: ParsedEventCandidate): Draft {
  const d = newDraft({
    title: p.title,
    date: p.date,
    startTime: p.startTime,
    endTime: p.endTime,
    allDay: p.allDay,
    location: p.location,
    notes: p.notes,
  });
  d.timeGuessed = !!p.guessed.time;
  return d;
}

function cloneDraft(d: Draft): Draft {
  return { ...d, form: { ...d.form }, dirty: new Set(d.dirty) };
}

function cloneSnapshot(s: CaptureSnapshot): CaptureSnapshot {
  return { text: s.text, drafts: s.drafts.map(cloneDraft), activeIndex: s.activeIndex };
}

/**
 * 再解析結果を既存の drafts に統合する。
 *
 * 整合ルール:
 * - 同一 index の旧 Draft から dirty フィールドの値と dirty 集合を引き継ぐ
 *   （フィールド単位のユーザー編集保護を Draft 単位に一般化）。
 * - added（登録済み）の Draft は上書きしない。
 * - 候補数が減った場合、dirty または added の余剰 Draft は末尾に温存し、
 *   まっさらな Draft は破棄する。activeIndex は範囲内にクランプ。
 */
function reconcile(prev: CaptureSnapshot, parsed: ParsedEventCandidate[]): CaptureSnapshot {
  const next: Draft[] = parsed.map((p, i) => {
    const old = prev.drafts[i];
    if (!old) return draftFromParsed(p);
    if (old.added) return old;

    const fresh = draftFromParsed(p);
    const form = { ...fresh.form };
    for (const k of FORM_KEYS) {
      if (old.dirty.has(k)) (form[k] as FormState[typeof k]) = old.form[k];
    }
    return {
      id: old.id,
      form,
      dirty: new Set(old.dirty),
      timeGuessed: old.dirty.has('startTime') ? false : fresh.timeGuessed,
      added: false,
    };
  });

  for (const old of prev.drafts.slice(parsed.length)) {
    if (old.dirty.size > 0 || old.added) next.push(old);
  }

  return {
    text: prev.text,
    drafts: next,
    activeIndex: Math.min(prev.activeIndex, next.length - 1),
  };
}

function initState(initialText: string): CaptureSnapshot {
  const text = initialText.slice(0, MAX_INPUT);
  if (!text.trim()) return { text: '', drafts: [newDraft()], activeIndex: 0 };
  return {
    text,
    drafts: parseEvents(text, new Date()).map(draftFromParsed),
    activeIndex: 0,
  };
}

const DEBOUNCE_MS = 400;

export function useCapture(initialText = '') {
  const [state, setState] = useState<CaptureSnapshot>(() => initState(initialText));
  const [composing, setComposing] = useState(false);
  // 直近に解析済みのテキスト（同一テキストの再解析を防ぐ）
  const lastAnalyzed = useRef(initialText.slice(0, MAX_INPUT));

  const setText = useCallback((v: string) => {
    const t = v.slice(0, MAX_INPUT);
    setState((prev) => ({ ...prev, text: t }));
  }, []);

  /** 即時解析。raw を渡すとテキストも差し替える（貼り付け・共有起動用）。 */
  const analyzeNow = useCallback((raw?: string) => {
    setState((prev) => {
      const t = (raw ?? prev.text).slice(0, MAX_INPUT);
      lastAnalyzed.current = t;
      if (!t.trim()) return { ...prev, text: t };
      return reconcile({ ...prev, text: t }, parseEvents(t, new Date()));
    });
  }, []);

  // 入力中の自動解析。IME 変換中は保留。テキストを消してもフォームはクリアしない
  // （dirty 編集を守るため。明示クリアは clearAll のみ）。
  useEffect(() => {
    const t = state.text;
    if (composing || !t.trim() || t === lastAnalyzed.current) return;
    const timer = setTimeout(() => analyzeNow(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state.text, composing, analyzeNow]);

  const selectDraft = useCallback((i: number) => {
    setState((prev) => ({
      ...prev,
      activeIndex: Math.max(0, Math.min(i, prev.drafts.length - 1)),
    }));
  }, []);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => {
      const drafts = prev.drafts.map((d, i) => {
        if (i !== prev.activeIndex) return d;
        const nd = cloneDraft(d);
        nd.form[key] = value;
        nd.dirty.add(key);
        if (key === 'startTime') nd.timeGuessed = false;
        return nd;
      });
      return { ...prev, drafts };
    });
  }, []);

  /** アクティブ Draft を登録済みにし、次の未登録 Draft へ移動する。 */
  const markAdded = useCallback(() => {
    setState((prev) => {
      const drafts = prev.drafts.map((d, i) =>
        i === prev.activeIndex ? { ...cloneDraft(d), added: true } : d,
      );
      const nextIdx = drafts.findIndex((d) => !d.added);
      return { ...prev, drafts, activeIndex: nextIdx >= 0 ? nextIdx : prev.activeIndex };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState({ text: '', drafts: [newDraft()], activeIndex: 0 });
  }, []);

  /** 履歴からの復元。自動解析に上書きされないよう全フィールドを dirty にする。 */
  const restoreForm = useCallback((form: FormState) => {
    const d = newDraft(form);
    d.dirty = new Set(FORM_KEYS);
    setState({ text: '', drafts: [d], activeIndex: 0 });
  }, []);

  const snapshot = useCallback(() => cloneSnapshot(state), [state]);

  const restoreSnapshot = useCallback((s: CaptureSnapshot) => {
    setState(cloneSnapshot(s));
  }, []);

  return {
    text: state.text,
    drafts: state.drafts,
    activeIndex: state.activeIndex,
    active: state.drafts[state.activeIndex],
    setText,
    setComposing,
    analyzeNow,
    selectDraft,
    updateField,
    markAdded,
    clearAll,
    restoreForm,
    snapshot,
    restoreSnapshot,
  };
}
