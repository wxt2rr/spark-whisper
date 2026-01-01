export interface BlessingItem {
  id: string;
  content: string;
}

export interface ConfigPayload {
  items: BlessingItem[];
  to?: string;
  from?: string;
  introMessage?: string;
  envelopeTitle?: string;
  envelopeYear?: string;
}
