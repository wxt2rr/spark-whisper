import LZString from 'lz-string';
import { ConfigPayload } from '../types';

export const encodePayload = (payload: ConfigPayload): string => {
  const json = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(json);
};

export const decodePayload = (encoded: string): ConfigPayload | null => {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const raw = JSON.parse(json) as unknown;
    if (!raw || typeof raw !== 'object') return null;
    const itemsRaw = (raw as { items?: unknown }).items;
    const to = (raw as { to?: unknown }).to;
    const from = (raw as { from?: unknown }).from;
    const introMessage = (raw as { introMessage?: unknown }).introMessage;
    
    if (!Array.isArray(itemsRaw)) return null;

    const items = itemsRaw
      .map((it, index) => {
        if (!it || typeof it !== 'object') return null;
        const obj = it as { id?: unknown; content?: unknown; type?: unknown };
        if (obj.type === 'image') return null;
        if (typeof obj.content !== 'string') return null;
        const id = typeof obj.id === 'string' ? obj.id : String(index + 1);
        return { id, content: obj.content };
      })
      .filter((v): v is { id: string; content: string } => !!v);

    return { 
      items,
      to: typeof to === 'string' ? to : undefined,
      from: typeof from === 'string' ? from : undefined,
      introMessage: typeof introMessage === 'string' ? introMessage : undefined
    };
  } catch (e) {
    console.error('Failed to decode payload', e);
    return null;
  }
};
