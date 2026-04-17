import { Buffer } from 'buffer'
import { EventEmitter } from 'events'

// Make Node built-ins available globally before any SDK code runs.
// @ethereumjs/util and @metamask/eth-sig-util reference these at module
// evaluation time, so they must exist on globalThis before those modules load.
if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}
if (typeof (globalThis as any).EventEmitter === 'undefined') {
  (globalThis as any).EventEmitter = EventEmitter;
}
