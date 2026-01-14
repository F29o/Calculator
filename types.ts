
export interface CalculationRecord {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface AIResponse {
  explanation: string;
  steps?: string[];
  tips?: string[];
}

export type CalcMode = 'DEG' | 'RAD';
