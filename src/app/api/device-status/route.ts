import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const { data: deviceData, error: deviceError } = await supabaseServer
    .from('device_status')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (deviceError) {
    return Response.json({ error: deviceError.message }, { status: 500 })
  }

  const { data: logsData, error: logsError } = await supabaseServer
    .from('sensor_logs')
    .select('*')
    .order('captured_at', { ascending: false })
    .limit(10)

  if (logsError) {
    return Response.json({ error: logsError.message }, { status: 500 })
  }

  return Response.json({
    device: deviceData?.[0] ?? null,
    logs: logsData ?? [],
  })
}
