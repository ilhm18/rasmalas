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
    const svcClient = hasServiceRoleKey() ? getSupabaseAdminClient() : null;
    if (!svcClient) {
      return { ok: false, error: 'Masukkan alamat email admin untuk login.' };
    }
    const { data: rpcEmail, error: rpcErr } = await svcClient.rpc(
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

  // Prefer secure RPC get_my_admin_profile; fallback to service-role query if RPC not yet installed
  const { data: rpcAdmin, error: rpcAdminErr } = await authedClient.rpc('get_my_admin_profile');
  const rpcRow = (Array.isArray(rpcAdmin) ? rpcAdmin[0] : rpcAdmin) as
    | {
        is_admin?: boolean;
        username?: string | null;
        full_name?: string | null;
        can_edit?: boolean;
        can_delete?: boolean;
      }
    | null
    | undefined;

  if (!rpcAdminErr && rpcRow) {
    if (!rpcRow.is_admin || (!rpcRow.can_edit && !rpcRow.can_delete)) {
      return {
        ok: false,
        error: 'Email Anda belum terdaftar sebagai admin yang memiliki izin edit/hapus.',
      };
    }
    return {
      ok: true,
      accessToken,
      email: authData.user.email,
      username: rpcRow.username ?? authData.user.email.split('@')[0],
      fullName: rpcRow.full_name ?? 'Admin Rasmalas',
      canEdit: Boolean(rpcRow.can_edit),
      canDelete: Boolean(rpcRow.can_delete),
    };
  }

  if (hasServiceRoleKey()) {
    const svcClient = getSupabaseAdminClient();
    if (svcClient) {
      const { data: adminRow, error: adminErr } = await svcClient
        .from('admin_users')
        .select('email, username, full_name, role, can_edit, can_delete')
        .ilike('email', authData.user.email)
        .maybeSingle();

      if (!adminErr && adminRow && (adminRow.can_edit || adminRow.can_delete)) {
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
    }
  }

  return {
    ok: false,
    error: 'Akun Anda belum memiliki izin akses admin atau skrip SQL keamanan belum dijalankan.',
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

const SERVER_TUS_CHUNK_SIZE = 6 * 1024 * 1024;

function getServerSupabaseTusEndpoint(baseUrl: string): string {
  const clean = baseUrl.replace(/\/+$/, '');
  try {
    const parsed = new URL(clean);
    if (parsed.hostname.endsWith('.supabase.co')) {
      const storageHost = parsed.hostname.replace('.supabase.co', '.storage.supabase.co');
      return `${parsed.protocol}//${storageHost}/storage/v1/upload/resumable`;
    }
  } catch {
    // fallback below
  }
  return `${clean}/storage/v1/upload/resumable`;
}

async function uploadMediaViaTusServer(
  fileBody: Buffer | Blob,
  storagePath: string,
  mimeType: string,
  authToken: string,
  apiKey: string,
  baseUrl: string
): Promise<void> {
  const totalSize = Buffer.isBuffer(fileBody) ? fileBody.length : fileBody.size;
  const tusEndpoint = getServerSupabaseTusEndpoint(baseUrl);
  const encodeMeta = (v: string) => Buffer.from(v, 'utf8').toString('base64');
  const metadata = [
    `bucketName ${encodeMeta(SUPABASE_MEDIA_BUCKET)}`,
    `objectName ${encodeMeta(storagePath)}`,
    `contentType ${encodeMeta(mimeType)}`,
    `cacheControl ${encodeMeta('3600')}`,
  ].join(',');

  const createRes = await fetch(tusEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      apikey: apiKey,
      'x-upsert': 'true',
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(totalSize),
      'Upload-Metadata': metadata,
    },
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(errText || `TUS create HTTP ${createRes.status}`);
  }

  const location = createRes.headers.get('location') || createRes.headers.get('Location');
  if (!location) {
    throw new Error('TUS upload tidak mengembalikan header Location.');
  }

  const uploadUrl = new URL(location, tusEndpoint).toString();
  let offset = 0;

  while (offset < totalSize) {
    const nextEnd = Math.min(offset + SERVER_TUS_CHUNK_SIZE, totalSize);
    const chunk = Buffer.isBuffer(fileBody)
      ? fileBody.subarray(offset, nextEnd)
      : fileBody.slice(offset, nextEnd);

    const patchRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
        apikey: apiKey,
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': String(offset),
        'Content-Type': 'application/offset+octet-stream',
      },
      body: chunk as BodyInit,
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(errText || `TUS patch HTTP ${patchRes.status}`);
    }

    const serverOffsetRaw = patchRes.headers.get('upload-offset') || patchRes.headers.get('Upload-Offset');
    const serverOffset = serverOffsetRaw !== null ? Number(serverOffsetRaw) : NaN;
    offset = Number.isFinite(serverOffset) && serverOffset > offset ? serverOffset : nextEnd;
  }
}

export async function uploadMediaToSupabaseStorage(
  fileBody: Buffer | Blob,
  storagePath: string,
  mimeType: string,
  sbToken?: string
): Promise<string | null> {
  const client = getSupabaseAdminClient(sbToken);
  if (!client) return null;

  const url = getEnv('SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  const hasSvc = hasServiceRoleKey();
  const effectiveToken = hasSvc ? serviceKey : sbToken || anonKey;
  const effectiveApiKey = hasSvc ? serviceKey : anonKey || serviceKey;
  const totalSize = Buffer.isBuffer(fileBody) ? fileBody.length : fileBody.size;

  const attemptUpload = async () => {
    if (totalSize > SERVER_TUS_CHUNK_SIZE && url && effectiveToken && effectiveApiKey) {
      try {
        await uploadMediaViaTusServer(
          fileBody,
          storagePath,
          mimeType,
          effectiveToken,
          effectiveApiKey,
          url
        );
        return null;
      } catch (err) {
        return { message: err instanceof Error ? err.message : 'TUS upload failed' };
      }
    }

    const { error } = await client.storage
      .from(SUPABASE_MEDIA_BUCKET)
      .upload(storagePath, fileBody, {
        contentType: mimeType,
        upsert: true,
      });
    return error;
  };

  let error = await attemptUpload();

  if (error && error.message.toLowerCase().includes('not found') && hasSvc) {
    await client.storage.createBucket(SUPABASE_MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: null,
      allowedMimeTypes: null,
    });
    error = await attemptUpload();
  } else if (
    error &&
    /maximum allowed size/i.test(error.message) &&
    hasSvc
  ) {
    await client.storage.updateBucket(SUPABASE_MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: null,
      allowedMimeTypes: null,
    });
    error = await attemptUpload();
  }

  if (error) {
    throw new Error(`Upload Supabase Storage gagal: ${error.message}`);
  }

  const { data } = client.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
