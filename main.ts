import { serve } from "https://deno.land/std@0.122.0/http/server.ts";
import { handleRequest } from "./handleRequest.ts";

await serve((request) => handleRequest(request));
