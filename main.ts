import { createRequestHandler } from "./handleRequest.ts";
import { RealClock } from "./utils/clock.ts";

const { handleRequest } = createRequestHandler(new RealClock());

Deno.serve((request, info) => handleRequest(request, info));
