import { describe, it, expect } from 'vitest';
import { reconcile } from './useCapture';
import type { Draft, CaptureSnapshot } from './useCapture';
import type { ParsedEventCandidate } from '../lib/parser/parseEvents';
import type { FormState } from '../lib/parser/types';

function form(over: Partial<FormState> = {}): FormState {
  return {
    title: '説明会',
    date: '2025-07-03',
    startTime: '14:00',
    endTime: '15:00',
    allDay: false,
    location: '',
    notes: '',
    ...over,
  };
}

function candidate(over: Partial<ParsedEventCandidate> = {}): ParsedEventCandidate {
  return {
    ...form(),
    guessed: {},
    sourceRange: { start: 0, end: 0 },
    ...over,
  };
}

function draft(over: Partial<Draft> = {}): Draft {
  return {
    id: 'd1',
    form: form(),
    dirty: new Set(),
    timeGuessed: false,
    added: false,
    ...over,
  };
}

function snapshot(over: Partial<CaptureSnapshot> = {}): CaptureSnapshot {
  return { text: 'text', drafts: [draft()], activeIndex: 0, ...over };
}

describe('reconcile', () => {
  it('dirty のないフィールドは新しい解析結果で上書きされる', () => {
    const prev = snapshot({ drafts: [draft({ form: form({ title: '旧タイトル' }) })] });
    const next = reconcile(prev, [candidate({ title: '新タイトル' })]);
    expect(next.drafts[0].form.title).toBe('新タイトル');
  });

  it('dirty なフィールドは再解析で上書きされない', () => {
    const prev = snapshot({
      drafts: [draft({ form: form({ title: '手編集タイトル' }), dirty: new Set(['title']) })],
    });
    const next = reconcile(prev, [candidate({ title: '新タイトル' })]);
    expect(next.drafts[0].form.title).toBe('手編集タイトル');
    expect(next.drafts[0].dirty.has('title')).toBe(true);
  });

  it('added な Draft は再解析で一切変更されない', () => {
    const addedDraft = draft({ added: true, form: form({ title: '登録済み' }) });
    const prev = snapshot({ drafts: [addedDraft] });
    const next = reconcile(prev, [candidate({ title: '新タイトル' })]);
    expect(next.drafts[0]).toBe(addedDraft);
  });

  it('startTime が dirty なら timeGuessed は false に固定される', () => {
    const prev = snapshot({
      drafts: [draft({ dirty: new Set(['startTime']), timeGuessed: false })],
    });
    const next = reconcile(prev, [candidate({ guessed: { time: true } })]);
    expect(next.drafts[0].timeGuessed).toBe(false);
  });

  it('startTime が dirty でなければ新しい guessed を反映する', () => {
    const prev = snapshot({ drafts: [draft({ timeGuessed: false })] });
    const next = reconcile(prev, [candidate({ guessed: { time: true } })]);
    expect(next.drafts[0].timeGuessed).toBe(true);
  });

  it('候補数が減っても dirty な余剰 Draft は末尾に温存される', () => {
    const prev = snapshot({
      drafts: [draft({ id: 'a' }), draft({ id: 'b', dirty: new Set(['title']) })],
    });
    const next = reconcile(prev, [candidate()]);
    expect(next.drafts).toHaveLength(2);
    expect(next.drafts[1].id).toBe('b');
  });

  it('候補数が減ったら dirty のない余剰 Draft は破棄される', () => {
    const prev = snapshot({ drafts: [draft({ id: 'a' }), draft({ id: 'b' })] });
    const next = reconcile(prev, [candidate()]);
    expect(next.drafts).toHaveLength(1);
  });

  it('added な余剰 Draft は候補数が減っても温存される', () => {
    const prev = snapshot({ drafts: [draft({ id: 'a' }), draft({ id: 'b', added: true })] });
    const next = reconcile(prev, [candidate()]);
    expect(next.drafts).toHaveLength(2);
    expect(next.drafts[1].id).toBe('b');
  });

  it('activeIndex は Draft 数の範囲内にクランプされる', () => {
    const prev = snapshot({
      drafts: [draft({ id: 'a' }), draft({ id: 'b' })],
      activeIndex: 1,
    });
    const next = reconcile(prev, [candidate()]);
    expect(next.drafts).toHaveLength(1);
    expect(next.activeIndex).toBe(0);
  });

  it('候補数が増えたら新規 Draft が追加される', () => {
    const prev = snapshot({ drafts: [draft({ id: 'a' })] });
    const next = reconcile(prev, [candidate(), candidate({ title: '2件目' })]);
    expect(next.drafts).toHaveLength(2);
    expect(next.drafts[0].id).toBe('a');
    expect(next.drafts[1].form.title).toBe('2件目');
  });
});
