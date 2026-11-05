declare const __APP_VERSION__: string

export const appVersion = typeof __APP_VERSION__ === 'undefined' ? '' : __APP_VERSION__
