export interface ParsedFields {
  objbez: string | null;
  name: string | null;
  date: string | null;
  time: string | null;
  address: string | null;
}

export type AppointmentType = 'EC' | 'FWW';

export interface MsgExtractionResult {
  body: string;
  subject: string;
}

export type OleResult = MsgExtractionResult | string | null;
