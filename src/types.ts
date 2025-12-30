export interface BlessingItem {
  id: string;
  content: string;
}

export interface ConfigPayload {
  items: BlessingItem[];
}
