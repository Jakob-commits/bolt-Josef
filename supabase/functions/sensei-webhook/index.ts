import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-api-key',
};

interface ApiKeyRecord {
  id: string;
  user_id: string;
  tenant_id: string | null;
  scopes: string[];
  is_active: boolean;
}

async function hashApiKey(secret: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyApiKey(
  apiKey: string,
  supabase: ReturnType<typeof createClient>
): Promise<ApiKeyRecord | null> {
  try {
    let cleanKey = apiKey;
    if (apiKey.startsWith('sk_')) {
      cleanKey = apiKey.substring(3);
    }

    const tokenHash = await hashApiKey(cleanKey);

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, tenant_id, scopes, is_active')
      .eq('token_hash', tokenHash)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error verifying API key:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    return data as ApiKeyRecord;
  } catch (error) {
    console.error('Error in verifyApiKey:', error);
    return null;
  }
}

function hasScope(keyRecord: ApiKeyRecord, requiredScope: string): boolean {
  if (!keyRecord.scopes || keyRecord.scopes.length === 0) {
    return false;
  }
  return keyRecord.scopes.includes(requiredScope);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const keyRecord = await verifyApiKey(apiKey, supabase);
    if (!keyRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method === 'GET') {
      if (!hasScope(keyRecord, 'training:read')) {
        return new Response(
          JSON.stringify({ error: 'Scope training:read required' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const responseData = {
        ok: true,
        message: 'Webhook received (GET)',
        tenant_id: keyRecord.tenant_id,
        user_id: keyRecord.user_id,
        method: 'GET',
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      if (!hasScope(keyRecord, 'training:write')) {
        return new Response(
          JSON.stringify({ error: 'Scope training:write required' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      let body = {};
      try {
        body = await req.json();
      } catch (e) {
        console.error('Failed to parse JSON body:', e);
      }

      const responseData = {
        ok: true,
        message: 'Webhook received (POST)',
        tenant_id: keyRecord.tenant_id,
        user_id: keyRecord.user_id,
        method: 'POST',
        received_data: body,
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in sensei-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});