import { handleMockRequest } from "@/mock";

// Always evaluate per request (mutations must be visible immediately).
export const dynamic = "force-dynamic";

type RouteContext = { params: { path?: string[] } };

async function handle(req: Request, ctx: RouteContext) {
  const url = new URL(req.url);
  // Some screens send a JSON body with DELETE (bulk deletes), so parse it for every method but GET.
  const body = req.method === "GET" ? undefined : await req.json().catch(() => undefined);
  const result = await handleMockRequest(req.method, ctx.params.path || [], url.searchParams, body);
  return Response.json(result.body, { status: result.status });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
