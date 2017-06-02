export const logger = (enable: boolean, level: 'DEBUG' | 'ERROR' = 'DEBUG') => enable
  ? (msg: string | Object) => {
    const log = level === 'ERROR' ? console.error : console.log;
    log(`${process.title}: ${msg}`); }
  : () => undefined;
