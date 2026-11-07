import sensor1024 from "../../../../../../../examples/remote-fragments/sensor-1024.json";
import sensor1025 from "../../../../../../../examples/remote-fragments/sensor-1025.json";
import sensor1026 from "../../../../../../../examples/remote-fragments/sensor-1026.json";

const sensors: Record<string, unknown> = { "1024": sensor1024, "1025": sensor1025, "1026": sensor1026 };
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Cache-Control": "public, max-age=30", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, { params }: { params: Promise<{ sensorId: string }> }) {
    const { sensorId } = await params;
    const payload = Object.hasOwn(sensors, sensorId) ? sensors[sensorId] : undefined;
    return Response.json(payload ?? { error: "Unknown demo sensor" }, { status: payload ? 200 : 404, headers });
}

export function OPTIONS() { return new Response(null, { status: 204, headers }); }
