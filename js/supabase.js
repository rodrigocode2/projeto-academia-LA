/* ==========================================================================
   L.A FITNESS — ponte com o Supabase
   O site inteiro conversa com o banco por aqui.
   Se o banco nao responder, o site cai no navegador e continua funcionando.
   ========================================================================== */

const LA_DB_URL = 'https://jpodytaqzdadberficri.supabase.co';
// Chave publishable: o acesso aos dados deve ser limitado pelas politicas RLS.
const LA_DB_CHAVE = 'sb_publishable_05HTjQ_3SIgMEsfg9vAK-Q_EbLC-jBE';
const LA_AUTH_LOCAL = 'la_supabase_auth_local';
const LA_AUTH_SESSION = 'la_supabase_auth_session';

/* o cliente e criado aqui, sem depender de CDN: usamos fetch direto na API */
const LADB = {
  url: LA_DB_URL,
  chave: LA_DB_CHAVE,
  pronto: false,
  aviso: null,

  /* ---------- chamada crua a API REST do Supabase ---------- */
  async pedir(tabela, opcoes) {
    const o = opcoes || {};
    const url = this.url + '/rest/v1/' + tabela + (o.query || '');
    const cab = {
      'apikey': this.chave,
      'Content-Type': 'application/json'
    };
    if (o.range) cab.Range = o.range;
    const token = await this.auth.accessToken();
    if (token) cab.Authorization = 'Bearer ' + token;
    if (o.prefer) cab['Prefer'] = o.prefer;

    const r = await fetch(url, {
      method: o.method || 'GET',
      headers: cab,
      body: o.corpo ? JSON.stringify(o.corpo) : undefined
    });

    if (!r.ok) {
      const txt = await r.text();
      throw new Error('[' + r.status + '] ' + txt.slice(0, 200));
    }
    if (r.status === 204) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  },

  /* ---------- pergunta basica: o banco existe e responde? ---------- */
  async conferir() {
    try {
      await this.pedir('la_conteudo', { query: '?id=eq.1&select=id' });
      this.pronto = true;
      this.aviso = null;
      console.log('[LADB] banco conectado');
      return true;
    } catch (e) {
      this.pronto = false;
      this.aviso = String(e.message || e);
      console.warn('[LADB] sem banco, usando o navegador:', this.aviso);
      return false;
    }
  },

  /* ---------- le ---------- */
  async ler(tabela, query) {
    return this.pedir(tabela, { query: query || '?select=*' });
  },

  async lerTodos(tabela, query) {
    const pagina = 500;
    const linhas = [];
    for (let inicio = 0; ; inicio += pagina) {
      const resultado = await this.pedir(tabela, {
        query: query || '?select=*',
        range: inicio + '-' + (inicio + pagina - 1)
      });
      linhas.push.apply(linhas, resultado);
      if (resultado.length < pagina) return linhas;
    }
  },

  /* ---------- grava (insere ou atualiza) ---------- */
  async gravar(tabela, linhas, conflito) {
    const q = conflito ? ('?on_conflict=' + conflito) : '';
    return this.pedir(tabela, {
      method: 'POST',
      query: q,
      corpo: linhas,
      prefer: 'resolution=merge-duplicates,return=representation'
    });
  },

  /* ---------- apaga ---------- */
  async apagar(tabela, query) {
    return this.pedir(tabela, { method: 'DELETE', query: query });
  },

  gravarDadosAluno(tabela, linhas, conflito, prefer) {
    const q = conflito ? ('?on_conflict=' + encodeURIComponent(conflito)) : '';
    return this.pedir(tabela, {
      method: 'POST',
      query: q,
      corpo: linhas,
      prefer: prefer || 'resolution=merge-duplicates,return=representation'
    });
  },

  async syncAluno(promise, recurso) {
    try {
      await promise;
      return true;
    } catch (error) {
      console.error('[LADB] Falha ao sincronizar ' + recurso + ':', error);
      window.dispatchEvent(new CustomEvent('la-sync-error', {
        detail: { recurso: recurso, message: error.message }
      }));
      return false;
    }
  },

  dadosAluno: {
    async carregar() {
      try {
        if (!localStorage.getItem('la_legacy_backup_student_core')) {
          const backup = {};
          [
            'la_modelos_treino', 'la_treino_liberado', 'la_execucao',
            'la_mensagens', 'la_pagamentos', 'la_cobrancas'
          ].forEach(function (key) { backup[key] = localStorage.getItem(key); });
          backup.la_medidas = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.indexOf('la_medidas_') === 0) {
              backup.la_medidas[key] = localStorage.getItem(key);
            }
          }
          localStorage.setItem('la_legacy_backup_student_core', JSON.stringify(backup));
        }
      } catch (error) {
        console.error('[LADB] Não foi possível criar cópia dos dados locais antigos:', error);
        throw new Error('Não foi possível fazer cópia de segurança dos dados locais. Libere espaço no navegador e tente novamente.');
      }

      const tabelas = [
        ['la_training_models', '?select=*&order=id.asc'],
        ['la_student_training', '?select=*&order=aluno_id.asc'],
        ['la_student_execution', '?select=*&order=aluno_id.asc,data.asc,exercicio.asc'],
        ['la_student_measurements', '?select=*&order=aluno_id.asc,medido_em.asc,id.asc'],
        ['la_student_messages', '?select=*&order=aluno_id.asc,criado_em.asc,id.asc'],
        ['la_student_payments', '?select=*&order=aluno_id.asc,competencia.asc'],
        ['la_student_charges', '?select=*&order=aluno_id.asc,competencia.asc']
      ];
      const resultados = await Promise.all(tabelas.map(function (item) {
        return LADB.lerTodos(item[0], item[1]);
      }));
      const modelos = resultados[0].map(function (row) {
        return {
          id: row.id,
          modalidade: row.modalidade,
          nome: row.nome,
          descricao: row.descricao,
          treinos: row.treinos || [],
          criadoEm: row.criado_em,
          atualizadoEm: row.atualizado_em
        };
      });
      const liberados = {};
      resultados[1].forEach(function (row) {
        const modelo = row.modelo || {};
        liberados[row.aluno_id] = { modeloId: row.modelo_id, liberadoEm: row.liberado_em };
        if (!modelos.some(function (item) { return item.id === modelo.id; }) && modelo.id) {
          modelos.push(modelo);
        }
      });
      const execucao = {};
      resultados[2].forEach(function (row) {
        const day = String(row.data).slice(0, 10);
        const key = row.aluno_id + '|' + day;
        if (!execucao[key]) execucao[key] = {};
        execucao[key][row.exercicio] = row.registro;
      });
      const medidas = {};
      resultados[3].forEach(function (row) {
        if (!medidas[row.aluno_id]) medidas[row.aluno_id] = [];
        medidas[row.aluno_id].push({
          id: row.id,
          peso: row.peso,
          cintura: row.cintura,
          quando: row.medido_em
        });
      });
      const mensagens = resultados[4].map(function (row) {
        const aluno = typeof laBuscarAluno === 'function' ? laBuscarAluno(row.aluno_id) : null;
        return {
          id: row.id,
          alunoId: row.aluno_id,
          aluno: aluno ? aluno.nome : '',
          de: row.remetente,
          texto: row.texto,
          lida: !!row.lida_em,
          quando: row.criado_em
        };
      });
      const pagamentos = resultados[5].map(function (row) {
        return {
          id: row.id,
          alunoId: row.aluno_id,
          competencia: row.competencia,
          valor: Number(row.valor),
          status: row.status,
          registradoEm: row.registrado_em,
          confirmadoEm: row.confirmado_em
        };
      });
      const cobrancas = resultados[6].map(function (row) {
        return {
          id: row.id,
          alunoId: row.aluno_id,
          aluno: row.aluno,
          competencia: row.competencia,
          valor: Number(row.valor),
          vencimento: row.vencimento,
          status: row.status,
          criadaEm: row.criada_em,
          pagoEm: row.pago_em,
          forma: row.forma
        };
      });
      try {
        localStorage.setItem('la_modelos_treino', JSON.stringify(modelos));
        localStorage.setItem('la_treino_liberado', JSON.stringify(liberados));
        localStorage.setItem('la_execucao', JSON.stringify(execucao));
        localStorage.setItem('la_mensagens', JSON.stringify(mensagens));
        localStorage.setItem('la_pagamentos', JSON.stringify(pagamentos));
        localStorage.setItem('la_cobrancas', JSON.stringify(cobrancas));
        const alunosLocais = JSON.parse(localStorage.getItem('la_alunos') || '[]');
        const alunoAtivoId = Array.isArray(alunosLocais) && alunosLocais[0] ? alunosLocais[0].id : '';
        const chavesMedidas = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.indexOf('la_medidas_') === 0 &&
              (window.LA_ADMIN_AUTHENTICADO || key === 'la_medidas_' + alunoAtivoId)) {
            chavesMedidas.push(key);
          }
        }
        chavesMedidas.forEach(function (key) { localStorage.removeItem(key); });
        Object.keys(medidas).forEach(function (alunoId) {
          medidas[alunoId].sort(function (a, b) { return String(a.quando).localeCompare(String(b.quando)); });
          localStorage.setItem('la_medidas_' + alunoId, JSON.stringify(medidas[alunoId].slice(-24)));
        });
      } catch (error) {
        throw new Error('Os dados chegaram do Supabase, mas não foi possível atualizar o cache local.');
      }
      window.LA_DADOS_ALUNO_CARREGADOS = true;
      return true;
    },

    salvarModelos(modelos) {
      const rows = modelos.map(function (modelo) {
        return {
          id: modelo.id,
          modalidade: modelo.modalidade,
          nome: modelo.nome,
          descricao: modelo.descricao || '',
          treinos: modelo.treinos || [],
          atualizado_em: modelo.atualizadoEm || new Date().toISOString()
        };
      });
      if (!rows.length) return Promise.resolve([]);
      return LADB.gravarDadosAluno('la_training_models', rows, 'id');
    },

    removerModelos(ids) {
      return Promise.all(ids.map(function (id) {
        return LADB.apagar('la_training_models', '?id=eq.' + encodeURIComponent(id));
      }));
    },

    liberarTreino(alunoId, modelo) {
      return LADB.gravarDadosAluno('la_student_training', [{
        aluno_id: alunoId,
        modelo_id: modelo.id,
        modelo: modelo,
        liberado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }], 'aluno_id');
    },

    bloquearTreino(alunoId) {
      return LADB.apagar('la_student_training', '?aluno_id=eq.' + encodeURIComponent(alunoId));
    },

    salvarExecucao(alunoId, dia, exercicio, registro) {
      return LADB.gravarDadosAluno('la_student_execution', [{
        aluno_id: alunoId,
        data: dia,
        exercicio: exercicio,
        registro: registro,
        atualizado_em: new Date().toISOString()
      }], 'aluno_id,data,exercicio');
    },

    salvarMedida(alunoId, medida) {
      return LADB.gravarDadosAluno('la_student_measurements', [{
        id: medida.id,
        aluno_id: alunoId,
        peso: String(medida.peso || ''),
        cintura: String(medida.cintura || ''),
        medido_em: medida.quando
      }], 'id');
    },

    inserirMensagem(mensagem) {
      const row = {
        id: mensagem.id,
        aluno_id: mensagem.alunoId,
        remetente: mensagem.de === 'academia' ? 'academia' : 'aluno',
        texto: mensagem.texto,
        criado_em: mensagem.quando
      };
      return LADB.pedir('la_student_messages', {
        method: 'POST',
        corpo: row,
        prefer: 'return=representation'
      });
    },

    marcarMensagensLidas(alunoId, remetente) {
      const agora = new Date().toISOString();
      return LADB.pedir('la_student_messages', {
        method: 'PATCH',
        query: '?aluno_id=eq.' + encodeURIComponent(alunoId) +
          '&remetente=eq.' + encodeURIComponent(remetente) + '&lida_em=is.null',
        corpo: { lida_em: agora },
        prefer: 'return=minimal'
      });
    },

    inserirPagamento(pagamento) {
      return LADB.pedir('la_student_payments', {
        method: 'POST',
        query: '?on_conflict=aluno_id%2Ccompetencia',
        corpo: {
          id: pagamento.id,
          aluno_id: pagamento.alunoId,
          competencia: pagamento.competencia,
          valor: pagamento.valor,
          status: pagamento.status,
          registrado_em: pagamento.registradoEm,
          confirmado_em: pagamento.confirmadoEm || null
        },
        prefer: 'resolution=ignore-duplicates,return=minimal'
      });
    },

    confirmarPagamento(id) {
      return LADB.pedir('la_student_payments', {
        method: 'PATCH',
        query: '?id=eq.' + encodeURIComponent(id),
        corpo: { status: 'pago', confirmado_em: new Date().toISOString() },
        prefer: 'return=minimal'
      });
    },

    salvarCobrancas(cobrancas) {
      const rows = cobrancas.map(function (cobranca) {
        return {
          id: cobranca.id,
          aluno_id: cobranca.alunoId,
          aluno: cobranca.aluno,
          competencia: cobranca.competencia,
          valor: cobranca.valor,
          vencimento: cobranca.vencimento,
          status: cobranca.status,
          criada_em: cobranca.criadaEm,
          pago_em: cobranca.pagoEm || null,
          forma: cobranca.forma || null,
          atualizado_em: new Date().toISOString()
        };
      });
      if (!rows.length) return Promise.resolve([]);
      return LADB.gravarDadosAluno('la_student_charges', rows, 'id');
    }
  },

  auth: {
    sessionKey() {
      try {
        return sessionStorage.getItem(LA_AUTH_SESSION) ? LA_AUTH_SESSION :
          (localStorage.getItem(LA_AUTH_LOCAL) ? LA_AUTH_LOCAL : null);
      } catch (e) {
        throw new Error('O navegador não permite acessar a sessão segura.');
      }
    },

    remembered() {
      return this.sessionKey() === LA_AUTH_LOCAL;
    },

    readSession() {
      const key = this.sessionKey();
      if (!key) return null;
      try {
        const storage = key === LA_AUTH_LOCAL ? localStorage : sessionStorage;
        const session = JSON.parse(storage.getItem(key) || 'null');
        return session && session.access_token && session.refresh_token ? session : null;
      } catch (e) {
        throw new Error('A sessão salva está inválida. Entre novamente.');
      }
    },

    saveSession(session, remember) {
      try {
        localStorage.removeItem(LA_AUTH_LOCAL);
        sessionStorage.removeItem(LA_AUTH_SESSION);
        const saved = Object.assign({}, session);
        if (!saved.expires_at && saved.expires_in) {
          saved.expires_at = Math.floor(Date.now() / 1000) + Number(saved.expires_in);
        }
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(remember ? LA_AUTH_LOCAL : LA_AUTH_SESSION, JSON.stringify(saved));
      } catch (e) {
        throw new Error('Não foi possível salvar a sessão neste aparelho.');
      }
    },

    clearSession() {
      try {
        localStorage.removeItem(LA_AUTH_LOCAL);
        sessionStorage.removeItem(LA_AUTH_SESSION);
      } catch (e) {
        throw new Error('Não foi possível encerrar a sessão neste aparelho.');
      }
    },

    async accessToken() {
      const session = this.readSession();
      if (!session) return null;
      if (session.expires_at && session.expires_at * 1000 > Date.now() + 60000) {
        return session.access_token;
      }

      const response = await fetch(LADB.url + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: LADB.chave, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.access_token) {
        this.clearSession();
        throw new Error('Sua sessão expirou. Entre novamente.');
      }
      this.saveSession(payload, this.sessionKey() === LA_AUTH_LOCAL);
      return payload.access_token;
    },

    async currentUser() {
      const token = await this.accessToken();
      if (!token) return null;
      const response = await fetch(LADB.url + '/auth/v1/user', {
        headers: { apikey: LADB.chave, Authorization: 'Bearer ' + token }
      });
      if (response.status === 401) {
        this.clearSession();
        return null;
      }
      if (!response.ok) throw new Error('Não foi possível validar a sessão.');
      return response.json();
    },

    async signInAdmin(email, password) {
      const response = await fetch(LADB.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: LADB.chave, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.access_token) {
        throw new Error('E-mail ou senha incorretos.');
      }
      this.saveSession(payload, false);
      try {
        if (!(await this.isAdmin())) {
          this.clearSession();
          throw new Error('Esta conta não tem permissão de administrador.');
        }
      } catch (error) {
        this.clearSession();
        throw error;
      }
    },

    async isAdmin() {
      const user = await this.currentUser();
      if (!user || !user.id) return false;
      const admins = await LADB.pedir('la_admins', '?select=user_id&user_id=eq.' + encodeURIComponent(user.id));
      return admins.some(function (admin) { return admin.user_id === user.id; });
    },

    async loadStudents() {
      const rows = await LADB.pedir(
        'la_alunos',
        '?select=id,auth_user_id,matricula,nome,cpf,telefone,email,plano,objetivo,foto,ativo,pendente,criado_em&order=criado_em.desc'
      );
      const alunos = rows.map(function (row) {
        return {
          id: row.id,
          auth_user_id: row.auth_user_id,
          matricula: row.matricula,
          nome: row.nome,
          cpf: row.cpf,
          telefone: row.telefone,
          email: row.email,
          plano: row.plano,
          objetivo: row.objetivo,
          foto: row.foto,
          ativo: row.ativo,
          pendente: row.pendente,
          criadoEm: row.criado_em
        };
      });
      localStorage.setItem('la_alunos', JSON.stringify(alunos));
      window.LA_ALUNOS_CARREGADO = true;
      return alunos;
    },

    async studentLogin(identifier, password, remember) {
      const response = await fetch(LADB.url + '/functions/v1/la-students', {
        method: 'POST',
        headers: { apikey: LADB.chave, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', identifier, password })
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.session || !payload.aluno) {
        throw new Error(payload.error || 'Não foi possível entrar. Tente novamente.');
      }
      this.saveSession(payload.session, remember);
      const profile = payload.aluno;
      localStorage.setItem('la_alunos', JSON.stringify([profile]));
      window.LA_ALUNOS_CARREGADO = true;
      await LADB.dadosAluno.carregar();
      return profile;
    },

    async restoreStudent() {
      const user = await this.currentUser();
      if (!user || !user.id) return null;
      const rows = await LADB.pedir(
        'la_alunos',
        '?select=id,auth_user_id,matricula,nome,cpf,telefone,email,plano,objetivo,foto,ativo,pendente,criado_em&auth_user_id=eq.' +
          encodeURIComponent(user.id) + '&limit=1'
      );
      if (!rows.length) return null;
      const profile = rows[0];
      localStorage.setItem('la_alunos', JSON.stringify([profile]));
      window.LA_ALUNOS_CARREGADO = true;
      await LADB.dadosAluno.carregar();
      return profile;
    },

    async createStudent(data) {
      const token = await this.accessToken();
      if (!token) throw new Error('Entre como administrador antes de cadastrar alunos.');
      const response = await fetch(LADB.url + '/functions/v1/la-students', {
        method: 'POST',
        headers: {
          apikey: LADB.chave,
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({ action: 'create' }, data))
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.aluno) {
        throw new Error(payload.error || 'Não foi possível cadastrar o aluno.');
      }
      return payload.aluno;
    },

    async deleteStudent(id) {
      const token = await this.accessToken();
      if (!token) throw new Error('Entre como administrador antes de excluir alunos.');
      const response = await fetch(LADB.url + '/functions/v1/la-students', {
        method: 'POST',
        headers: {
          apikey: LADB.chave,
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'delete', id })
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Não foi possível excluir o aluno.');
      }
    },

    async signOut() {
      const token = await this.accessToken();
      this.clearSession();
      if (!token) return;
      const response = await fetch(LADB.url + '/auth/v1/logout?scope=local', {
        method: 'POST',
        headers: { apikey: LADB.chave, Authorization: 'Bearer ' + token }
      });
      if (!response.ok) throw new Error('A sessão local foi encerrada, mas o servidor não confirmou a saída.');
    }
  }
};

window.LADB = LADB;
window.addEventListener('la-sync-error', function (event) {
  const aviso = document.getElementById('la-sync-aviso') || document.createElement('div');
  aviso.id = 'la-sync-aviso';
  aviso.setAttribute('role', 'alert');
  aviso.textContent = 'Não foi possível sincronizar ' +
    (event.detail && event.detail.recurso ? event.detail.recurso : 'os dados') +
    '. A alteração ficou salva neste navegador, mas não chegou ao servidor.';
  aviso.style.cssText = 'position:fixed;z-index:10000;left:16px;right:16px;bottom:16px;' +
    'max-width:560px;margin:0 auto;padding:14px 18px;border-radius:8px;' +
    'background:#8b1e1e;color:#fff;font:500 14px/1.45 system-ui,sans-serif;' +
    'box-shadow:0 4px 18px rgba(0,0,0,.3)';
  if (!aviso.isConnected) document.body.appendChild(aviso);
  window.clearTimeout(aviso._laSyncTimer);
  aviso._laSyncTimer = window.setTimeout(function () { aviso.remove(); }, 9000);
});
