import { AttractorField } from './attractor/components/attractor-field/AttractorField';

export interface StageProps {
  claim: string;
  canvasLabel: string;
}

const stages = {
  attractor: AttractorField,
} as const;

export type StageId = keyof typeof stages;

export const initialStageId: StageId = 'attractor';

export function StageHost(props: StageProps) {
  const ActiveStage = stages[initialStageId];
  return <ActiveStage {...props} />;
}
