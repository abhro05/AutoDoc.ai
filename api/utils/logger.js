import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: isDev ? 'debug' : 'info', 
  timestamp: pino.stdTimeFunctions.isoTime, 
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  transport: isDev
    ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
    : undefined, 
});

export default logger;