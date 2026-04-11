import { EventEmitter } from 'events'

const globalForEvents = globalThis as unknown as { chatEmitter: EventEmitter }

/**
 * A globally persisted EventEmitter acting as the single source
 * of truth for real-time Next.js App Router broadcast events across clients.
 */
export const chatEmitter = globalForEvents.chatEmitter || new EventEmitter()

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.chatEmitter = chatEmitter
}
