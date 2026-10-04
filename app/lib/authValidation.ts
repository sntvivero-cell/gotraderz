// Única fuente de verdad para la regla de longitud mínima de contraseña — compartida
// por el registro (app/login/page.tsx), el cambio de contraseña logueado
// (app/configuracion/page.tsx) y el reset por email (app/reset-password/page.tsx).
// Antes de esto, configuracion/page.tsx tenía su propio `const PASSWORD_MIN_LENGTH = 8`
// local y login/page.tsx validaba con un `minLength={6}` sin constante — quedaban
// desincronizados sin que nada lo marcara como error.
export const PASSWORD_MIN_LENGTH = 8;
