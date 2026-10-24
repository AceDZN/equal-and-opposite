export interface SceneState {
  equation: { aL: string; bL: string; aR: string; bR: string };
  hand: { id: string; label: string; description: string }[];
  selected: number | null;
  phase: 'ready' | 'player' | 'opponent' | 'won' | 'lost';
  motion: number;
  reducedMotion: boolean;
  paused: boolean;
  duel: number;
  round: number;
  lastOperation: string;
}
export interface SceneController {
  setState(state: SceneState): void;
  tick(dt: number): void;
  resize(): void;
  setCamera(action: 'left' | 'right' | 'in' | 'out' | 'reset'): void;
  stats(): Record<string, unknown>;
  dispose(): void;
}
