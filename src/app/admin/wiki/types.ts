export type { WikiSection, WikiEntry, WikiStats } from '../../../services/wikiService';

export type Message = { type: 'success' | 'error'; text: string };
export type ShowMessage = (type: 'success' | 'error', text: string) => void;
