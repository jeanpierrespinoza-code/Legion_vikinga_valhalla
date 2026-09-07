export type EvaluatorName = 'Diego' | 'Guillermo' | 'Jean';
export type EvaluatorRole = 'admin' | 'dt';

export interface Evaluator {
  name: EvaluatorName;
  avatar: string;
  role: EvaluatorRole;
}

export interface EvaluationItem {
  id: string;
  name: string;
  order: number;
}

export interface Player {
  id: string;
  name: string;
  positions: string[];
  eaRating: number | null;
  photoUrl?: string | null;
}

export interface BrandingSettings {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: null,
  primaryColor: '#c9a227',
  secondaryColor: '#131318',
  textColor: '#e2e8f0',
};

export interface Score {
  id: string;
  playerId: string;
  itemId: string;
  evaluator: EvaluatorName;
  value: number;
}

export type PlayerStatus = 'Desaprobado' | 'Analizar' | 'Aprobado';

export interface PositionGroup {
  group: string;
  positions: PositionDef[];
}

export interface PositionDef {
  en: string;
  es: string;
  x: number;
  y: number;
}

export interface Formation {
  id: string;
  name: string;
  slots: FormationSlot[];
}

export interface FormationSlot {
  id: string;
  label: string;
  acceptedPositions: string[];
  x: number;
  y: number;
}

export const EVALUATORS: Evaluator[] = [
  { name: 'Diego', avatar: 'D', role: 'dt' },
  { name: 'Guillermo', avatar: 'G', role: 'dt' },
  { name: 'Jean', avatar: 'J', role: 'admin' },
];

export const DEFAULT_PASSWORD = 'Vikingo1234*';

export const POSITION_GROUPS: PositionGroup[] = [
  {
    group: 'Portero',
    positions: [{ en: 'GK', es: 'POR', x: 50, y: 90 }],
  },
  {
    group: 'Defensas',
    positions: [
      { en: 'CB', es: 'DFC', x: 30, y: 72 },
      { en: 'CB', es: 'DFC', x: 70, y: 72 },
      { en: 'LB', es: 'LI', x: 12, y: 72 },
      { en: 'RB', es: 'LD', x: 88, y: 72 },
      { en: 'LWB', es: 'CAD/CAI', x: 18, y: 60 },
      { en: 'RWB', es: 'CAD', x: 82, y: 60 },
    ],
  },
  {
    group: 'Mediocampo',
    positions: [
      { en: 'CDM', es: 'MCD', x: 50, y: 55 },
      { en: 'CM', es: 'MC', x: 35, y: 50 },
      { en: 'CM', es: 'MC', x: 65, y: 50 },
      { en: 'CAM', es: 'MCO', x: 50, y: 40 },
      { en: 'LM', es: 'MI', x: 18, y: 50 },
      { en: 'RM', es: 'MD', x: 82, y: 50 },
    ],
  },
  {
    group: 'Ataque',
    positions: [
      { en: 'LW', es: 'EI', x: 20, y: 25 },
      { en: 'RW', es: 'ED', x: 80, y: 25 },
      { en: 'CF', es: 'MP/SD', x: 40, y: 20 },
      { en: 'CF', es: 'MP/SD', x: 60, y: 20 },
      { en: 'ST', es: 'DC/DEL', x: 50, y: 12 },
    ],
  },
];

export const ALL_POSITIONS = POSITION_GROUPS.flatMap((g) =>
  g.positions.map((p) => ({ ...p, group: g.group }))
);

export const POSITION_LABELS: Record<string, string> = Object.fromEntries(
  ALL_POSITIONS.map((p) => [p.en, p.es])
);

export interface ClubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: EventType;
  notes: string;
  createdBy: string | null;
}

export type EventType = 'partido' | 'entrenamiento' | 'reunion' | 'torneo';

export const EVENT_TYPE_LABELS: Record<EventType, { label: string; color: string; bg: string; border: string; icon: string }> = {
  partido: { label: 'Partido', color: 'text-red-300', bg: 'bg-red-950/50', border: 'border-red-800', icon: 'shield' },
  entrenamiento: { label: 'Entrenamiento', color: 'text-emerald-300', bg: 'bg-emerald-950/50', border: 'border-emerald-800', icon: 'activity' },
  reunion: { label: 'Reunión', color: 'text-amber-300', bg: 'bg-amber-950/50', border: 'border-amber-800', icon: 'users' },
  torneo: { label: 'Torneo', color: 'text-blue-300', bg: 'bg-blue-950/50', border: 'border-blue-800', icon: 'trophy' },
};

export const PRO_CLUBS_URL = 'https://proclubstracker.com/club/5505980?platform=common-gen5&div=4';

export const FORMATIONS: Formation[] = [
  {
    id: '4-3-3',
    name: '4-3-3',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'LI', acceptedPositions: ['LB', 'LWB'], x: 14, y: 72 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 38, y: 74 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 62, y: 74 },
      { id: 's5', label: 'LD', acceptedPositions: ['RB', 'RWB'], x: 86, y: 72 },
      { id: 's6', label: 'MCD', acceptedPositions: ['CDM'], x: 50, y: 56 },
      { id: 's7', label: 'MC', acceptedPositions: ['CM', 'CDM'], x: 32, y: 46 },
      { id: 's8', label: 'MCO', acceptedPositions: ['CAM', 'CM'], x: 68, y: 46 },
      { id: 's9', label: 'EI', acceptedPositions: ['LW', 'LM'], x: 20, y: 20 },
      { id: 's10', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 50, y: 10 },
      { id: 's11', label: 'ED', acceptedPositions: ['RW', 'RM'], x: 80, y: 20 },
    ],
  },
  {
    id: '4-4-2',
    name: '4-4-2',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'LI', acceptedPositions: ['LB', 'LWB'], x: 14, y: 72 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 38, y: 74 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 62, y: 74 },
      { id: 's5', label: 'LD', acceptedPositions: ['RB', 'RWB'], x: 86, y: 72 },
      { id: 's6', label: 'MI', acceptedPositions: ['LM', 'CM'], x: 14, y: 42 },
      { id: 's7', label: 'MC', acceptedPositions: ['CM', 'CDM'], x: 38, y: 48 },
      { id: 's8', label: 'MC', acceptedPositions: ['CM', 'CAM'], x: 62, y: 48 },
      { id: 's9', label: 'MD', acceptedPositions: ['RM', 'CM'], x: 86, y: 42 },
      { id: 's10', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 38, y: 14 },
      { id: 's11', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 62, y: 14 },
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'DFC', acceptedPositions: ['CB'], x: 26, y: 73 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 50, y: 76 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 74, y: 73 },
      { id: 's5', label: 'CAI', acceptedPositions: ['LWB', 'LB'], x: 10, y: 50 },
      { id: 's6', label: 'MCD', acceptedPositions: ['CDM', 'CM'], x: 35, y: 54 },
      { id: 's7', label: 'MC', acceptedPositions: ['CM', 'CAM'], x: 50, y: 45 },
      { id: 's8', label: 'MCO', acceptedPositions: ['CAM', 'CM'], x: 65, y: 54 },
      { id: 's9', label: 'CAD', acceptedPositions: ['RWB', 'RB'], x: 90, y: 50 },
      { id: 's10', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 38, y: 14 },
      { id: 's11', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 62, y: 14 },
    ],
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'LI', acceptedPositions: ['LB', 'LWB'], x: 14, y: 72 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 38, y: 74 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 62, y: 74 },
      { id: 's5', label: 'LD', acceptedPositions: ['RB', 'RWB'], x: 86, y: 72 },
      { id: 's6', label: 'MCD', acceptedPositions: ['CDM'], x: 35, y: 58 },
      { id: 's7', label: 'MCD', acceptedPositions: ['CDM', 'CM'], x: 65, y: 58 },
      { id: 's8', label: 'EI', acceptedPositions: ['LW', 'LM'], x: 18, y: 30 },
      { id: 's9', label: 'MCO', acceptedPositions: ['CAM'], x: 50, y: 36 },
      { id: 's10', label: 'ED', acceptedPositions: ['RW', 'RM'], x: 82, y: 30 },
      { id: 's11', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 50, y: 12 },
    ],
  },
  {
    id: '5-3-2',
    name: '5-3-2',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'CAI', acceptedPositions: ['LWB', 'LB'], x: 10, y: 70 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 30, y: 75 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 50, y: 78 },
      { id: 's5', label: 'DFC', acceptedPositions: ['CB'], x: 70, y: 75 },
      { id: 's6', label: 'CAD', acceptedPositions: ['RWB', 'RB'], x: 90, y: 70 },
      { id: 's7', label: 'MC', acceptedPositions: ['CM', 'CDM'], x: 30, y: 45 },
      { id: 's8', label: 'MCO', acceptedPositions: ['CAM', 'CM'], x: 50, y: 42 },
      { id: 's9', label: 'MC', acceptedPositions: ['CM', 'CDM'], x: 70, y: 45 },
      { id: 's10', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 38, y: 14 },
      { id: 's11', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 62, y: 14 },
    ],
  },
  {
    id: '3-4-3',
    name: '3-4-3',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'DFC', acceptedPositions: ['CB'], x: 26, y: 73 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 50, y: 76 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 74, y: 73 },
      { id: 's5', label: 'MI', acceptedPositions: ['LM', 'LWB'], x: 14, y: 50 },
      { id: 's6', label: 'MC', acceptedPositions: ['CM', 'CDM'], x: 38, y: 52 },
      { id: 's7', label: 'MC', acceptedPositions: ['CM', 'CAM'], x: 62, y: 52 },
      { id: 's8', label: 'MD', acceptedPositions: ['RM', 'RWB'], x: 86, y: 50 },
      { id: 's9', label: 'EI', acceptedPositions: ['LW', 'CF'], x: 20, y: 18 },
      { id: 's10', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 50, y: 10 },
      { id: 's11', label: 'ED', acceptedPositions: ['RW', 'CF'], x: 80, y: 18 },
    ],
  },
  {
    id: '4-1-2-1-2',
    name: '4-1-2-1-2',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'LI', acceptedPositions: ['LB', 'LWB'], x: 14, y: 72 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 38, y: 74 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 62, y: 74 },
      { id: 's5', label: 'LD', acceptedPositions: ['RB', 'RWB'], x: 86, y: 72 },
      { id: 's6', label: 'MCD', acceptedPositions: ['CDM'], x: 50, y: 60 },
      { id: 's7', label: 'MI', acceptedPositions: ['LM', 'CM'], x: 22, y: 44 },
      { id: 's8', label: 'MD', acceptedPositions: ['RM', 'CM'], x: 78, y: 44 },
      { id: 's9', label: 'MCO', acceptedPositions: ['CAM'], x: 50, y: 36 },
      { id: 's10', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 36, y: 12 },
      { id: 's11', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 64, y: 12 },
    ],
  },
  {
    id: '4-3-2-1',
    name: '4-3-2-1 (Árbol de Navidad)',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'LI', acceptedPositions: ['LB', 'LWB'], x: 14, y: 72 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 38, y: 74 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 62, y: 74 },
      { id: 's5', label: 'LD', acceptedPositions: ['RB', 'RWB'], x: 86, y: 72 },
      { id: 's6', label: 'MCD', acceptedPositions: ['CDM'], x: 50, y: 58 },
      { id: 's7', label: 'MC', acceptedPositions: ['CM'], x: 30, y: 46 },
      { id: 's8', label: 'MC', acceptedPositions: ['CM'], x: 70, y: 46 },
      { id: 's9', label: 'SD', acceptedPositions: ['CAM', 'CF'], x: 35, y: 28 },
      { id: 's10', label: 'SD', acceptedPositions: ['CAM', 'CF'], x: 65, y: 28 },
      { id: 's11', label: 'DC', acceptedPositions: ['ST'], x: 50, y: 12 },
    ],
  },
  {
    id: '5-4-1',
    name: '5-4-1',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'CAI', acceptedPositions: ['LWB', 'LB'], x: 10, y: 70 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 30, y: 75 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 50, y: 78 },
      { id: 's5', label: 'DFC', acceptedPositions: ['CB'], x: 70, y: 75 },
      { id: 's6', label: 'CAD', acceptedPositions: ['RWB', 'RB'], x: 90, y: 70 },
      { id: 's7', label: 'MI', acceptedPositions: ['LM', 'CM'], x: 20, y: 44 },
      { id: 's8', label: 'MC', acceptedPositions: ['CM', 'CDM'], x: 40, y: 48 },
      { id: 's9', label: 'MC', acceptedPositions: ['CM', 'CAM'], x: 60, y: 48 },
      { id: 's10', label: 'MD', acceptedPositions: ['RM', 'CM'], x: 80, y: 44 },
      { id: 's11', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 50, y: 12 },
    ],
  },
  {
    id: '4-5-1',
    name: '4-5-1',
    slots: [
      { id: 's1', label: 'POR', acceptedPositions: ['GK'], x: 50, y: 90 },
      { id: 's2', label: 'LI', acceptedPositions: ['LB', 'LWB'], x: 14, y: 72 },
      { id: 's3', label: 'DFC', acceptedPositions: ['CB'], x: 38, y: 74 },
      { id: 's4', label: 'DFC', acceptedPositions: ['CB'], x: 62, y: 74 },
      { id: 's5', label: 'LD', acceptedPositions: ['RB', 'RWB'], x: 86, y: 72 },
      { id: 's6', label: 'MI', acceptedPositions: ['LM', 'LW'], x: 10, y: 38 },
      { id: 's7', label: 'MC', acceptedPositions: ['CM', 'CDM'], x: 30, y: 48 },
      { id: 's8', label: 'MCO', acceptedPositions: ['CAM', 'CM'], x: 50, y: 42 },
      { id: 's9', label: 'MC', acceptedPositions: ['CM', 'CDM'], x: 70, y: 48 },
      { id: 's10', label: 'MD', acceptedPositions: ['RM', 'RW'], x: 90, y: 38 },
      { id: 's11', label: 'DC', acceptedPositions: ['ST', 'CF'], x: 50, y: 12 },
    ],
  },
];
