/** 解析結果。フォームへそのまま流し込める文字列で持つ。 */
export interface ParsedEvent {
  title: string; // 空にしない
  date: string; // 'YYYY-MM-DD' or ''
  startTime: string; // 'HH:MM' or ''
  endTime: string; // 'HH:MM' or ''
  allDay: boolean;
  location: string;
  notes: string; // 既定で貼り付け原文
  /** 機械推測で確定でない値のフラグ（UIの「推測」表示用）。裸時刻を午前/午後変換したら time=true。 */
  guessed: { time?: boolean };
}

/** 編集フォームの状態。 */
export interface FormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  notes: string;
}
