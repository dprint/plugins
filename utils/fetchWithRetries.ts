export async function fetchWithRetries(
  url: string,
  init?: RequestInit,
  retries = 3,
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const response = await fetch(url, init);
    if (response.status < 500 || i === retries) {
      return response;
    }
    console.error(`Fetch attempt ${i + 1} failed: ${response.status} for ${url}`);
    await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** i, 2500)));
  }
  throw new Error("unreachable");
}
