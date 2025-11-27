import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type UserRoleDB = 'user' | 'coach' | 'teamleiter' | 'company' | 'admin' | 'master';

interface InviteUserPayload {
  action: 'invite';
  email: string;
  full_name: string;
  role: UserRoleDB;
  package: 'starter' | 'premium' | 'pro';
  tenant_id: string;
}

interface UpdateUserPayload {
  action: 'update';
  user_id: string;
  email?: string;
  full_name?: string;
  role?: UserRoleDB;
  package?: 'starter' | 'premium' | 'pro';
  tenant_id: string;
}

interface DeleteUserPayload {
  action: 'delete';
  user_id: string;
  tenant_id: string;
}

interface GetUserDetailsPayload {
  action: 'get_user_details';
  user_id: string;
  tenant_id: string;
}

interface ResendInvitePayload {
  action: 'resend_invite';
  user_id: string;
  tenant_id: string;
}

type RequestPayload = InviteUserPayload | UpdateUserPayload | DeleteUserPayload | GetUserDetailsPayload | ResendInvitePayload;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !callerProfile) {
      throw new Error('Profile not found');
    }

    if (callerProfile.role !== 'master' && callerProfile.role !== 'admin') {
      throw new Error('Only master and admin users can manage users');
    }

    const payload: RequestPayload = await req.json();

    if (payload.tenant_id !== callerProfile.tenant_id) {
      throw new Error('Cannot manage users from different tenant');
    }

    switch (payload.action) {
      case 'invite': {
        const { data: authData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          payload.email,
          {
            data: {
              full_name: payload.full_name,
            },
          }
        );

        if (inviteError) throw inviteError;
        if (!authData.user) throw new Error('Failed to create user');

        const { error: profileInsertError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          tenant_id: payload.tenant_id,
          role: payload.role,
          full_name: payload.full_name,
          email: payload.email,
          package: payload.package,
          skill_level: 'anfaenger',
        });

        if (profileInsertError) throw profileInsertError;

        const { error: skillError } = await supabase.from('skill_scores').insert({
          user_id: authData.user.id,
          rapport_building: 0,
          needs_analysis: 0,
          objection_handling: 0,
          closing: 0,
          communication: 0,
        });

        if (skillError) throw skillError;

        return new Response(
          JSON.stringify({ success: true, user_id: authData.user.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        const updates: any = {};
        
        if (payload.full_name !== undefined) updates.full_name = payload.full_name;
        if (payload.role !== undefined) {
          const { data: currentUser } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', payload.user_id)
            .single();

          if (currentUser?.role === 'admin' && payload.role !== 'admin') {
            const { data: adminCount } = await supabase
              .from('profiles')
              .select('id', { count: 'exact' })
              .eq('tenant_id', payload.tenant_id)
              .eq('role', 'admin');

            if (adminCount && adminCount.length <= 1) {
              throw new Error('Cannot remove last admin from tenant');
            }
          }

          updates.role = payload.role;
        }
        if (payload.package !== undefined) updates.package = payload.package;
        if (payload.email !== undefined) updates.email = payload.email;

        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', payload.user_id)
          .eq('tenant_id', payload.tenant_id);

        if (profileUpdateError) throw profileUpdateError;

        if (payload.email !== undefined) {
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
            payload.user_id,
            { email: payload.email }
          );
          if (authUpdateError) throw authUpdateError;
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { data: targetUser } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', payload.user_id)
          .single();

        if (payload.user_id === user.id) {
          throw new Error('Cannot delete yourself');
        }

        if (targetUser?.role === 'admin') {
          const { data: adminCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('tenant_id', payload.tenant_id)
            .eq('role', 'admin');

          if (adminCount && adminCount.length <= 1) {
            throw new Error('Cannot delete last admin from tenant');
          }
        }

        const { error: profileDeleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', payload.user_id)
          .eq('tenant_id', payload.tenant_id);

        if (profileDeleteError) throw profileDeleteError;

        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(payload.user_id);
        if (authDeleteError) throw authDeleteError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_user_details': {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.user_id)
          .eq('tenant_id', payload.tenant_id)
          .single();

        if (profileError || !profileData) {
          throw new Error('User not found');
        }

        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(payload.user_id);

        if (authError || !authUser.user) {
          throw new Error('Auth user not found');
        }

        const { data: skillScores } = await supabase
          .from('skill_scores')
          .select('*')
          .eq('user_id', payload.user_id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            profile: profileData,
            auth: {
              email: authUser.user.email,
              confirmed_at: authUser.user.confirmed_at,
              created_at: authUser.user.created_at,
              last_sign_in_at: authUser.user.last_sign_in_at,
            },
            skill_scores: skillScores || null,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'resend_invite': {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', payload.user_id)
          .eq('tenant_id', payload.tenant_id)
          .single();

        if (profileError || !profileData) {
          throw new Error('User not found');
        }

        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(payload.user_id);

        if (authError || !authUser.user) {
          throw new Error('Auth user not found');
        }

        if (authUser.user.confirmed_at) {
          throw new Error('User is already confirmed');
        }

        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(profileData.email);

        if (inviteError) throw inviteError;

        return new Response(
          JSON.stringify({
            success: true,
            message: `Invitation resent to ${profileData.email}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
