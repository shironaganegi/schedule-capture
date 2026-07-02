import { addMinutesToTime } from '../datetime';
import { excludeDeadlines, extractDateCandidates, selectDate } from './dateParser';
import { extractTime } from './timeParser';
import { extractTitle } from './titleParser';
import { extractLocation } from './locationParser';
import { parseEvent } from './parseEvent';
import type { ParsedEvent } from './types';

const DEFAULT_DURATION_MIN = 60;
const DEFAULT_MAX_EVENTS = 5;

export interface ParsedEventCandidate extends ParsedEvent {
  /** 元テキスト上のセグメント範囲（UI での強調・デバッグ用）。 */
  sourceRange: { start: number; end: number };
}

/**
 * テキストから複数の予定候補を抽出する。常に 1 件以上返す。
 * 締切除外後の相異なる日付が 1 件以下なら parseEvent と同一結果（完全互換）。
 */
export function parseEvents(
  text: string,
  baseDate: Date,
  maxEvents = DEFAULT_MAX_EVENTS,
): ParsedEventCandidate[] {
  const cands = excludeDeadlines(extractDateCandidates(text, baseDate), text);

  // 相異なる日付ごとに最初の出現位置を採用
  const seen = new Map<string, number>();
  for (const c of cands) {
    if (!seen.has(c.iso)) seen.set(c.iso, c.index);
  }

  if (seen.size <= 1) {
    return [{ ...parseEvent(text, baseDate), sourceRange: { start: 0, end: text.length } }];
  }

  // セグメント分割: 各日付候補を含む行の先頭を境界にする。
  // 同一行に複数日付がある場合は候補位置そのものを境界にする。
  const points = [...seen.values()].sort((a, b) => a - b).slice(0, maxEvents);
  const starts = points.map((p, i) => {
    const lineStart = text.lastIndexOf('\n', p) + 1;
    return i > 0 && lineStart <= points[i - 1] ? p : lineStart;
  });
  starts[0] = 0; // 先頭セグメントはテキスト冒頭から

  const fallbackTitle = extractTitle(text);
  const fallbackLocation = extractLocation(text);

  return starts.map((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1] : text.length;
    const seg = text.slice(start, end);

    const date = selectDate(extractDateCandidates(seg, baseDate), seg);
    const time = extractTime(seg);
    const hasTime = !!time.startTime;
    const endTime = hasTime
      ? time.endTime || addMinutesToTime(time.startTime, DEFAULT_DURATION_MIN)
      : '';

    // セグメント単体で件名が取れない（フォールバックが日付行そのもの等）場合は全文から流用
    const segTitle = extractTitle(seg);
    const title = /^[\d\s/:年月日時分（）()〜～-]*$/.test(segTitle) ? fallbackTitle : segTitle;

    return {
      title,
      date,
      startTime: hasTime ? time.startTime : '',
      endTime,
      allDay: !!date && !hasTime,
      location: extractLocation(seg) || fallbackLocation,
      notes: seg.trim(),
      guessed: { time: hasTime && time.guessed },
      sourceRange: { start, end },
    };
  });
}
