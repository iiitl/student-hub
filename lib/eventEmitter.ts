import { EventEmitter } from 'events'

/**
 * Typed augmentation of `globalThis` to persist the chat EventEmitter
 * across Hot Module Replacement (HMR) reloads during development.
 *
 * Without this, `next dev` would create a new EventEmitter on every
 * file change, breaking all existing SSE subscriptions that reference
 * the old instance. By caching it on `globalThis`, the same emitter
 * survives HMR cycles and maintains active listener registrations.
 */
const globalForEvents = globalThis as unknown as { chatEmitter: EventEmitter }

/**
 * A globally persisted EventEmitter acting as the single in-process
 * broadcast bus for real-time chat events within the Next.js App Router.
 *
 * **How it works:**
 * 1. API mutation routes (`POST`, `PATCH`, `DELETE` in `/api/chat/messages`)
 *    emit events on this emitter when messages are created, edited, or deleted.
 * 2. The SSE stream route (`GET /api/chat/stream`) subscribes a per-client
 *    listener to this emitter, forwarding events as SSE frames to the browser.
 * 3. The client-side `useChatMessages` hook processes these SSE frames and
 *    updates React state in real time.
 *
 * **Production limitation:** This EventEmitter is process-local. In a
 * multi-instance deployment (e.g., multiple containers behind a load
 * balancer), events emitted on one instance will not reach SSE clients
 * connected to a different instance. For such deployments, replace this
 * with a shared pub/sub layer (Redis Pub/Sub, Pusher, etc.).
 *
 * **HMR safety:** In development (`NODE_ENV !== 'production'`), the
 * emitter is cached on `globalThis` so that hot-reloaded modules
 * continue referencing the same instance.
 */
export const chatEmitter = globalForEvents.chatEmitter || new EventEmitter()

/*
 * Persist the emitter on globalThis during development to survive
 * Next.js HMR reloads. In production this is not strictly necessary
 * because modules are loaded once, but the guard is a safety net.
 */
if (process.env.NODE_ENV !== 'production') {
  globalForEvents.chatEmitter = chatEmitter
}
