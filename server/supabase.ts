import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getEnv(name: string): string {
  return (process.env[name] || '').trim();
}

export function isSupabaseConfigured(): boolean {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');
  return Boolean(url && key && !url.includes('YOUR-PROJECT-ID'));
}

export function hasServiceRoleKey(): boolean {
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  return Boolean(key && !key.includes('YOUR_SUPABASE_SERVICE_ROLE_KEY'));
}

export function getSupabasePublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_ANON_KEY') || getEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseAdminClient(supabaseAccessToken?: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const url = getEnv('SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (serviceKey && !serviceKey.includes('YOUR_SUPABASE_SERVICE_ROLE_KEY')) {
    return createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  const anonKey = getEnv('SUPABASE_ANON_KEY');
  if (!anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: supabaseAccessToken
      ? {
          headers: {
            Authorization: `Bearer ${supabaseAccessToken}`,
          },
        }
      : undefined,
  });
}

export interface SupabaseAdminAuthResult {
  ok: boolean;
  accessToken?: string;
  email?: string;
  username?: string;
  fullName?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  error?: string;
}

export async function authenticateSupabaseAdmin(
  loginInput: string,
  password: string
): Promise<SupabaseAdminAuthResult> {
  const publicClient = getSupabasePublicClient();
  if (!publicClient) {
    return { ok: false, error: 'Supabase belum dikonfigurasi.' };
  }

  let resolvedEmail = loginInput.trim();
  if (!resolvedEmail.includes('@')) {
    const { data: rpcEmail, error: rpcErr } = await publicClient.rpc(
      'resolve_admin_login_email',
      { login_input: resolvedEmail }
    );
    if (rpcErr || !rpcEmail) {
      return { ok: false, error: 'Username atau email admin tidak ditemukan.' };
    }
    resolvedEmail = String(rpcEmail).trim();
  }

  const { data: authData, error: authErr } = await publicClient.auth.signInWithPassword({
    email: resolvedEmail,
    password,
  });

  if (authErr || !authData.session || !authData.user?.email) {
    return {
      ok: false,
      error: authErr?.message || 'Autentikasi Supabase gagal.',
    };
  }

  const accessToken = authData.session.access_token;
  const authedClient = getSupabaseAdminClient(accessToken);
  if (!authedClient) {
    return { ok: false, error: 'Gagal membuat sesi klien Supabase.' };
  }

  const { data: adminRow, error: adminErr } = await authedClient
    .from('admin_users')
    .select('email, username, full_name, role, can_edit, can_delete')
    .ilike('email', authData.user.email)
    .maybeSingle();

  if (adminErr) {
    return {
      ok: false,
      error:
        'Akun berhasil masuk, tetapi tabel admin_users belum siap atau akses ditolak. Jalankan SQL admin Supabase terlebih dahulu.',
    };
  }

  if (!adminRow || (!adminRow.can_edit && !adminRow.can_delete)) {
    return {
      ok: false,
      error: 'Email Anda belum terdaftar di tabel admin_users dengan izin edit/hapus.',
    };
  }

  return {
    ok: true,
    accessToken,
    email: authData.user.email,
    username: (adminRow.username as string | null) ?? authData.user.email.split('@')[0],
    fullName: (adminRow.full_name as string | null) ?? 'Admin Rasmalas',
    canEdit: Boolean(adminRow.can_edit),
    canDelete: Boolean(adminRow.can_delete),
  };
}

export async function updateSupabaseAdminPasswordServer(
  sbToken: string,
  newPassword: string
): Promise<void> {
  const url = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey) throw new Error('Supabase belum dikonfigurasi.');

  const res = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${sbToken}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });
  const data = (await res.json()) as { msg?: string; message?: string; error_description?: string };
  if (!res.ok) {
    throw new Error(
      data.error_description || data.msg || data.message || 'Gagal memperbarui kata sandi di Supabase.'
    );
  }
}

export async function updateSupabaseAdminUsernameServer(
  sbToken: string,
  username: string,
  fullName: string
): Promise<{ email: string; username: string; fullName: string }> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) throw new Error('Supabase belum dikonfigurasi.');

  const { data, error } = await client.rpc('update_own_admin_profile', {
    p_username: username,
    p_full_name: fullName,
    p_email: null,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    email: String(row?.email || ''),
    username: String(row?.username || username),
    fullName: String(row?.full_name || fullName),
  };
}

export const SUPABASE_MEDIA_BUCKET = 'rasmalas-media';

export async function uploadMediaToSupabaseStorage(
  fileBody: Buffer | Blob,
  storagePath: string,
  mimeType: string,
  sbToken?: string
): Promise<string | null> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return null;

  let { error } = await client.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .upload(storagePath, fileBody, {
      contentType: mimeType,
      upsert: true,
    });

  if (error && error.message.toLowerCase().includes('not found') && hasServiceRoleKey()) {
    await client.storage.createBucket(SUPABASE_MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: null,
      allowedMimeTypes: null,
    });
    const retry = await client.storage
      .from(SUPABASE_MEDIA_BUCKET)
      .upload(storagePath, fileBody, {
        contentType: mimeType,
        upsert: true,
      });
    error = retry.error;
  }

  if (error) {
    throw new Error(`Upload Supabase Storage gagal: ${error.message}`);
  }

  const { data } = client.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
