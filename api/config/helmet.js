// config/helmet.js
import helmet from 'helmet';

const helmetMiddleware = helmet({
  crossOriginEmbedderPolicy: false,

});

export default helmetMiddleware;