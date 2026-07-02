import { addMinutesToTime } from '../datetime';
import { extractDateCandidates, selectDate } from './dateParser';
import { extractTime } from './timeParser';
import { extractTitle } from './titleParser';
import { extractLocation } from './locationParser';
import type { ParsedEvent } from './types';

const DEFAULT_DURATION_MIN = 60;

/**
 * 貼り付けテキストを解析して ParsedEvent を返す。
 * baseDate は相対表現の基準（テストで固定注入できるよう必須引数）。
 */
export function parseEvent(text: string, baseDate: Date): ParsedEvent {
  const dateIso = selectDate(extractDateCandidates(text, baseDate), text);
  const time = extractTime(text);

  const hasTime = !!time.startTime;
  const startTime = hasTime ? time.startTime : '';
  const endTime = hasTime
    ? time.endTime || addMinutesToTime(time.startTime, DEFAULT_DURATION_MIN)
    : '';

  return {
    title: extractTitle(text),
    date: dateIso,
    startTime,
    endTime,
    allDay: !!dateIso && !hasTime,
    location: extractLocation(text),
    notes: text.trim(),
    guessed: { time: hasTime && time.guessed },
  };
}
