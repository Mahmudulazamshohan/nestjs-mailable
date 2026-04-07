export interface MailEventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, payload: any): boolean | void;
}

export const MAIL_EVENT_EMITTER = 'MAIL_EVENT_EMITTER';
