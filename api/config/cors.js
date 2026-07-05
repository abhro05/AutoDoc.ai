// api/config/cors.js
import cors from "cors";

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

const corsMiddleware = cors(corsOptions);
export default corsMiddleware;