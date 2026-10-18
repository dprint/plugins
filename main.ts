import { createRequestHandler } from "./handleRequest.js";

const { handleRequest } = createRequestHandler();

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    return handleRequest(request, ctx);
  },
};
