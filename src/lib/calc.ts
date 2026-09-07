import type { Player, Score, EvaluationItem, PlayerStatus } from './types';

export function itemAverageForPlayer(
  player: Player,
  item: EvaluationItem,
  scores: Score[]
): number | null {
  const itemScores = scores.filter(
    (s) => s.playerId === player.id && s.itemId === item.id
  );
  if (itemScores.length === 0) return null;
  const sum = itemScores.reduce((a, s) => a + s.value, 0);
  return sum / itemScores.length;
}

export function playerOverallAverage(
  player: Player,
  items: EvaluationItem[],
  scores: Score[]
): number | null {
  const avgs = items
    .map((it) => itemAverageForPlayer(player, it, scores))
    .filter((v): v is number => v !== null);
  if (avgs.length === 0) return null;
  return avgs.reduce((a, b) => a + b, 0) / avgs.length;
}

export function statusFromAverage(avg: number | null): {
  label: PlayerStatus | 'Sin evaluar';
  color: string;
  bg: string;
  text: string;
  border: string;
} {
  if (avg === null) {
    return {
      label: 'Sin evaluar',
      color: 'slate',
      bg: 'bg-slate-700/50',
      text: 'text-slate-400',
      border: 'border-slate-600',
    };
  }
  if (avg < 5) {
    return {
      label: 'Desaprobado',
      color: 'red',
      bg: 'bg-red-950/60',
      text: 'text-red-300',
      border: 'border-red-800',
    };
  }
  if (avg < 7) {
    return {
      label: 'Analizar',
      color: 'amber',
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      border: 'border-amber-800',
    };
  }
  return {
    label: 'Aprobado',
    color: 'emerald',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    border: 'border-emerald-800',
  };
}

export function evaluatorScore(
  player: Player,
  item: EvaluationItem,
  evaluator: string,
  scores: Score[]
): number | null {
  const s = scores.find(
    (sc) =>
      sc.playerId === player.id &&
      sc.itemId === item.id &&
      sc.evaluator === evaluator
  );
  return s ? s.value : null;
}

export function formatScore(v: number | null): string {
  if (v === null) return '—';
  return v.toFixed(1);
}
