import { handleRequest } from "./handleRequest.ts";

Deno.serve((request) => handleRequest(request));
