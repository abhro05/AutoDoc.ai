// api/config/cors.js
import cors from "cors";

// आपके मौजूदा app.js का सटीक कॉन्फ़िगरेशन
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

const corsMiddleware = cors(corsOptions);
export default corsMiddleware;