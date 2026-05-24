import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expected = `Bearer ${process.env.DEVICE_INGEST_TOKEN}`

    if (authHeader !== expected) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const {
      device_id,
      captured_at,
      distance_m,
      temperature_c,
      humidity,
      person_detected,
      mode,
    } = body

    if (!device_id) {
      return Response.json({ error: 'device_id is required' }, { status: 400 })
    }

    const { error: insertLogError } = await supabaseServer
      .from('sensor_logs')
      .insert({
        device_id,
        captured_at: captured_at ?? new Date().toISOString(),
        distance_m,
        temperature_c,
        humidity,
        person_detected,
        mode: mode ?? 'standby',
      })

    if (insertLogError) {
      console.error('insert sensor_logs failed:', insertLogError)
      return Response.json(
        { step: 'insert sensor_logs', error: insertLogError.message },
        { status: 500 }
      )
    }

    const { error: upsertStatusError } = await supabaseServer
      .from('device_status')
      .upsert({
        device_id,
        updated_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        current_mode: mode ?? 'standby',
        is_online: true,
        last_distance_m: distance_m,
        last_temperature_c: temperature_c,
        last_humidity: humidity,
        last_person_detected: person_detected ?? false,
      })

    if (upsertStatusError) {
      console.error('upsert device_status failed:', upsertStatusError)
      return Response.json(
        { step: 'upsert device_status', error: upsertStatusError.message },
        { status: 500 }
      )
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('ingest route unexpected error:', err)
    return Response.json(
      { step: 'unexpected', error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 }
    )
  }
}