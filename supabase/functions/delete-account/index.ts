import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const TABELAS_POR_USER_ID = [
  'transacoes', 'contas_fixas', 'metas_desejos', 'financiamento_imovel',
  'financiamento_carro', 'contas_bancarias', 'orcamentos', 'cartoes_credito',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization') ?? ''

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return json({ error: 'unauthorized' }, 401)

  const admin = createClient(url, serviceKey)

  const { data: cartoes } = await admin.from('cartoes_credito').select('id').eq('user_id', user.id)
  const cartaoIds = (cartoes ?? []).map((c) => c.id)
  if (cartaoIds.length > 0) {
    const { error } = await admin.from('transacoes_cartao').delete().in('cartao_id', cartaoIds)
    if (error) return json({ error: `transacoes_cartao: ${error.message}` }, 500)
  }
  for (const tabela of TABELAS_POR_USER_ID) {
    const { error } = await admin.from(tabela).delete().eq('user_id', user.id)
    if (error) return json({ error: `${tabela}: ${error.message}` }, 500)
  }
  const { error: perfilError } = await admin.from('perfis').delete().eq('id', user.id)
  if (perfilError) return json({ error: `perfis: ${perfilError.message}` }, 500)

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return json({ error: `auth: ${deleteError.message}` }, 500)

  return json({ ok: true })
})
