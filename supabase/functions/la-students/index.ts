import { createClient } from 'npm:@supabase/supabase-js@2';

function defaultKeyFromJson(name: string) {
  const raw = Deno.env.get(name);
  if (!raw) return undefined;
  const keys = JSON.parse(raw);
  return keys && typeof keys.default === 'string' ? keys.default : undefined;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const secretKey = defaultKeyFromJson('SUPABASE_SECRET_KEYS') ??
  Deno.env.get('SUPABASE_SECRET_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const publishableKey = defaultKeyFromJson('SUPABASE_PUBLISHABLE_KEYS') ??
  Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
  Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !secretKey || !publishableKey) {
  throw new Error('Supabase function secrets are not configured.');
}

const adminClient = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const publicClient = createClient(supabaseUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function cpfValido(value: string) {
  const cpf = value.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }
    const digito = (soma * 10) % 11 % 10;
    if (digito !== Number(cpf[tamanho])) return false;
  }
  return true;
}

async function loginStudent(identifier: string, password: string) {
  const numeric = identifier.replace(/\D/g, '');
  const isCpf = numeric.length === 11;
  const query = adminClient
    .from('la_alunos')
    .select('id,auth_user_id,email,matricula,nome,cpf,telefone,plano,objetivo,foto,ativo,pendente')
    .eq(isCpf ? 'cpf' : 'matricula', isCpf ? numeric : identifier.trim().toUpperCase())
    .maybeSingle();
  const { data: aluno, error } = await query;

  if (error) {
    console.error('Student lookup failed:', error.message);
    return response(500, { error: 'Não foi possível validar o acesso agora.' });
  }
  if (!aluno?.auth_user_id || !aluno.email) {
    return response(401, { error: 'CPF/matrícula ou senha incorretos.' });
  }
  if (!aluno.ativo || aluno.pendente) {
    return response(401, { error: 'CPF/matrícula ou senha incorretos.' });
  }

  const { data, error: authError } = await publicClient.auth.signInWithPassword({
    email: aluno.email,
    password
  });
  if (authError || !data.session) {
    return response(401, { error: 'CPF/matrícula ou senha incorretos.' });
  }

  return response(200, {
    session: data.session,
    aluno: {
      id: aluno.id,
      auth_user_id: aluno.auth_user_id,
      matricula: aluno.matricula,
      nome: aluno.nome,
      cpf: aluno.cpf,
      telefone: aluno.telefone,
      email: aluno.email,
      plano: aluno.plano,
      objetivo: aluno.objetivo,
      foto: aluno.foto,
      ativo: aluno.ativo,
      pendente: aluno.pendente
    }
  });
}

async function createStudent(request: Request, body: Record<string, unknown>) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return response(401, { error: 'Entre como administrador.' });

  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) {
    return response(401, { error: 'Sessão inválida. Entre novamente.' });
  }

  const { data: admin, error: adminError } = await adminClient
    .from('la_admins')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (adminError || !admin) {
    return response(403, { error: 'Apenas um administrador pode cadastrar alunos.' });
  }

  const nome = String(body.nome ?? '').trim();
  const cpf = String(body.cpf ?? '').replace(/\D/g, '');
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.senha ?? '');
  const telefone = String(body.telefone ?? '').trim();
  const plano = String(body.plano ?? 'Mensal').trim();
  const objetivo = String(body.objetivo ?? '').trim();

  if (nome.split(/\s+/).length < 2) {
    return response(400, { error: 'Informe nome e sobrenome.' });
  }
  if (!cpfValido(cpf)) return response(400, { error: 'Informe um CPF válido.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response(400, { error: 'Informe um e-mail válido para a conta do aluno.' });
  }
  if (password.length < 8) {
    return response(400, { error: 'A senha temporária precisa ter pelo menos 8 caracteres.' });
  }

  const { data: existing, error: existingError } = await adminClient
    .from('la_alunos')
    .select('id,matricula,auth_user_id')
    .eq('cpf', cpf)
    .maybeSingle();
  if (existingError) {
    console.error('Duplicate check failed:', existingError.message);
    return response(500, { error: 'Não foi possível validar o CPF agora.' });
  }
  if (existing?.auth_user_id) {
    return response(409, { error: 'Este CPF já possui uma conta de acesso.' });
  }

  const { data: emailOwner, error: emailError } = await adminClient
    .from('la_alunos')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (emailError) {
    console.error('Email check failed:', emailError.message);
    return response(500, { error: 'Não foi possível validar o e-mail agora.' });
  }
  if (emailOwner && emailOwner.id !== existing?.id) {
    return response(409, { error: 'Este e-mail já está associado a outro aluno.' });
  }

  const { data: matricula, error: matriculaError } = existing?.matricula
    ? { data: existing.matricula, error: null }
    : await adminClient.rpc('la_proxima_matricula');
  if (matriculaError || !matricula) {
    console.error('Enrollment number generation failed:', matriculaError?.message);
    return response(500, { error: 'Não foi possível gerar a matrícula.' });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome }
  });
  if (createError || !created.user) {
    return response(400, { error: createError?.message || 'Não foi possível criar a conta.' });
  }

  const now = new Date().toISOString();
  const camposAluno = {
    auth_user_id: created.user.id,
    matricula,
    nome,
    cpf,
    senha: null,
    telefone,
    email,
    plano,
    objetivo,
    ativo: true,
    pendente: false,
    atualizado_em: now
  };
  const alunoData = Object.assign({
    id: existing?.id ?? 'a' + crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    criado_em: now
  }, camposAluno);
  const save = existing
    ? await adminClient.from('la_alunos')
      .update(camposAluno)
      .eq('id', existing.id)
    : await adminClient.from('la_alunos').insert(alunoData);

  if (save.error) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id);
    if (rollbackError) console.error('Auth rollback failed:', rollbackError.message);
    console.error('Student record save failed:', save.error.message);
    return response(500, {
      error: rollbackError
        ? 'O cadastro não foi salvo e a conta pode continuar ativa. Procure o suporte antes de tentar novamente.'
        : 'A conta de acesso foi revertida porque o cadastro não foi salvo.'
    });
  }

  return response(201, {
    aluno: {
      id: alunoData.id,
      auth_user_id: alunoData.auth_user_id,
      matricula: alunoData.matricula,
      nome: alunoData.nome,
      cpf: alunoData.cpf,
      email: alunoData.email,
      telefone: alunoData.telefone,
      plano: alunoData.plano,
      objetivo: alunoData.objetivo,
      ativo: alunoData.ativo,
      pendente: alunoData.pendente
    }
  });
}

async function deleteStudent(request: Request, body: Record<string, unknown>) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return response(401, { error: 'Entre como administrador.' });

  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) {
    return response(401, { error: 'Sessão inválida. Entre novamente.' });
  }
  const { data: admin, error: adminError } = await adminClient
    .from('la_admins')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (adminError || !admin) {
    return response(403, { error: 'Apenas um administrador pode excluir alunos.' });
  }

  const id = String(body.id ?? '').trim();
  if (!id) return response(400, { error: 'Informe o aluno que deseja excluir.' });
  const { data: aluno, error: lookupError } = await adminClient
    .from('la_alunos')
    .select('id,auth_user_id')
    .eq('id', id)
    .maybeSingle();
  if (lookupError) {
    console.error('Student delete lookup failed:', lookupError.message);
    return response(500, { error: 'Não foi possível localizar o cadastro.' });
  }
  if (!aluno) return response(404, { error: 'Este aluno não existe mais.' });

  if (aluno.auth_user_id) {
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(aluno.auth_user_id);
    if (authDeleteError) {
      console.error('Student Auth deletion failed:', authDeleteError.message);
      return response(500, { error: 'Não foi possível revogar o acesso do aluno.' });
    }
  }

  const { error: rowDeleteError } = await adminClient
    .from('la_alunos')
    .delete()
    .eq('id', id);
  if (rowDeleteError) {
    console.error('Student record deletion failed:', rowDeleteError.message);
    return response(500, {
      error: aluno.auth_user_id
        ? 'O acesso foi revogado, mas o cadastro não foi removido. Procure o suporte.'
        : 'Não foi possível remover o cadastro.'
    });
  }
  return response(200, { ok: true });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response(405, { error: 'Método não permitido.' });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return response(400, { error: 'Requisição inválida.' });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response(400, { error: 'Requisição inválida.' });
  }

  const action = String(body.action ?? '');
  if (action === 'login') {
    const identifier = String(body.identifier ?? '').trim();
    const password = String(body.password ?? '');
    if (!identifier || !password) {
      return response(400, { error: 'Informe CPF/matrícula e senha.' });
    }
    return loginStudent(identifier, password);
  }
  if (action === 'create') return createStudent(request, body);
  if (action === 'delete') return deleteStudent(request, body);
  return response(400, { error: 'Ação inválida.' });
});
