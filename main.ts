import { createRequestHandler } from "./handleRequest.js";
import { RealClock } from "./utils/clock.js";

const { handleRequest } = createRequestHandler(new RealClock());

export default {
  fetch(request: Request) {
    return handleRequest(request);
  },
};
