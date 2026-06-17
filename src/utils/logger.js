/**
 * @file Tiny logging facade. The spec forbids stray `console.log` calls across
 * the codebase — everything funnels through here so logging can be silenced in
 * production and routed to a monitoring service later without a code sweep.
 */

/* eslint-disable no-console */

const isDev = import.meta.env?.DEV ?? false;

/**
 * @typedef {Object} Logger
 * @property {(...args: unknown[]) => void} debug
 * @property {(...args: unknown[]) => void} info
 * @property {(...args: unknown[]) => void} warn
 * @property {(...args: unknown[]) => void} error
 */

/** @type {Logger} */
export const logger = {
  debug: (...args) => {
    if (isDev) console.debug('[timurlenk]', ...args);
  },
  info: (...args) => {
    if (isDev) console.info('[timurlenk]', ...args);
  },
  warn: (...args) => console.warn('[timurlenk]', ...args),
  error: (...args) => console.error('[timurlenk]', ...args),
};

export default logger;
