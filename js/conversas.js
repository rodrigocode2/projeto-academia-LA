/* ==========================================================================
   L.A FITNESS — CONVERSAS DA ACADEMIA
   Camada isolada: hoje localStorage, depois Supabase (mesmas funcoes).

   TRES ESPACOS
     1. grupo geral             -> todos participam
     2. particular entre alunos -> aluno com aluno, em privado
     3. particular com a academia -> conta, plano, pagamento

   A academia abre e fecha o grupo quando quiser.
   ========================================================================== */

const LA_GRUPO_CHAVE    = 'la_grupo_geral';
const LA_GRUPO_ESTADO   = 'la_grupo_estado';
const LA_PARTICULAR     = 'la_particular';

/* ---------------- leitura e gravacao seguras ---------------- */

function laConvLer(chave) {
  try {
    const b = localStorage.getItem(chave);
    const l = b ? JSON.parse(b) : [];
    return Array.isArray(l) ? l : [];
  } catch (e) { return []; }
}

function laConvGravar(chave, lista) {
  try { localStorage.setItem(chave, JSON.stringify(lista)); return true; }
  catch (e) { return false; }

  /* manda para o banco */
  if (window.LADB && window.LADB.pronto && chave === LA_GRUPO_CHAVE && Array.isArray(lista)) {
    window.LADB.gravar('la_grupo', lista.map(function (m) {
      return { autor: m.autor, aluno_id: m.alunoId, texto: m.texto, midia: m.midia, quando: m.quando };
    })).catch(function (e) { console.warn('[LADB] grupo so no navegador:', e.message); });
  }
}

function laConvAgora() { return new Date().toISOString(); }

/* ==========================================================================
   1. GRUPO GERAL
   ========================================================================== */

function laGrupoAberto() {
  try {
    const b = localStorage.getItem(LA_GRUPO_ESTADO);
    return b === null ? true : b === 'aberto';
  } catch (e) { return true; }
}

function laGrupoAbrirFechar(aberto) {
  try { localStorage.setItem(LA_GRUPO_ESTADO, aberto ? 'aberto' : 'fechado'); return true; }
  catch (e) { return false; }
}

function laGrupoListar() {
  return laConvLer(LA_GRUPO_CHAVE).sort(function (a, b) {
    return String(a.quando).localeCompare(String(b.quando));
  });
}

/* quem escreve no grupo: um aluno ou a academia */
function laGrupoEnviar(alunoId, texto, tipo, midia) {
  const t = String(texto || '').trim();
  if (!t && !midia) return null;

  const daAcademia = tipo === 'academia';
  const aluno = (!daAcademia && typeof laBuscarAluno === 'function') ? laBuscarAluno(alunoId) : null;

  const msg = {
    id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    alunoId: daAcademia ? 'academia' : alunoId,
    autor: daAcademia ? 'L.A Fitness' : (aluno ? aluno.nome : 'Aluno'),
    foto: aluno ? (aluno.foto || '') : '',
    de: daAcademia ? 'academia' : 'aluno',
    texto: t.slice(0, 700),
    midia: midia || null,          /* { tipo:'video'|'imagem', dado:'...', nome:'...' } */
    quando: laConvAgora(),
    lida: false
  };

  const lista = laConvLer(LA_GRUPO_CHAVE);
  lista.push(msg);
  laConvGravar(LA_GRUPO_CHAVE, lista);
  return msg;
}

function laGrupoApagar(id) {
  laConvGravar(LA_GRUPO_CHAVE, laConvLer(LA_GRUPO_CHAVE).filter(function (m) {
    return m.id !== id;
  }));
  return true;
}

function laGrupoMarcarLidas() {
  const lista = laConvLer(LA_GRUPO_CHAVE);
  let mudou = false;
  lista.forEach(function (m) { if (!m.lida) { m.lida = true; mudou = true; } });
  if (mudou) laConvGravar(LA_GRUPO_CHAVE, lista);
}

/* ==========================================================================
   2. PARTICULAR ENTRE ALUNOS
   A chave do par e sempre a MESMA, nao importa quem escreve:
   os dois ids ordenados e unidos. Assim os dois lados veem a mesma conversa.
   ========================================================================== */

function laParChave(a, b) {
  const x = String(a || ''), y = String(b || '');
  return (x < y) ? (x + '__' + y) : (y + '__' + x);
}

function laParticularListar(euId, outroId) {
  const chave = laParChave(euId, outroId);
  return laConvLer(LA_PARTICULAR).filter(function (m) {
    return m && m.par === chave;
  }).sort(function (a, b) {
    return String(a.quando).localeCompare(String(b.quando));
  });
}

function laParticularEnviar(euId, outroId, texto, midia) {
  const t = String(texto || '').trim();
  if (!t && !midia) return null;

  const eu = (typeof laBuscarAluno === 'function') ? laBuscarAluno(euId) : null;

  const msg = {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    par: laParChave(euId, outroId),
    deId: euId,
    paraId: outroId,
    autor: eu ? eu.nome : 'Aluno',
    foto: eu ? (eu.foto || '') : '',
    texto: t.slice(0, 700),
    midia: midia || null,
    quando: laConvAgora(),
    lida: false
  };

  const lista = laConvLer(LA_PARTICULAR);
  lista.push(msg);
  laConvGravar(LA_PARTICULAR, lista);
  return msg;
}

/* as conversas de um aluno: quem ele ja falou, e a ultima mensagem */
function laParticularMarcarLidas(euId, outroId) {
  const chave = laParChave(euId, outroId);
  const lista = laConvLer(LA_PARTICULAR);
  let mudou = false;
  lista.forEach(function (m) {
    if (m && m.par === chave && String(m.paraId) === String(euId) && !m.lida) {
      m.lida = true; mudou = true;
    }
  });
  if (mudou) laConvGravar(LA_PARTICULAR, lista);
}

/* ==========================================================================
   MIDIA — video curto ou imagem, guardado no proprio navegador
   ========================================================================== */

function laConvLerMidia(arquivo, aoPronto) {
  if (!arquivo) { aoPronto(null); return; }
  const limite = 3 * 1024 * 1024;
  if (arquivo.size > limite) {
    aoPronto({ erro: 'O arquivo é grande (mais de 3MB). Escolha um menor.' });
    return;
  }
  const leitor = new FileReader();
  leitor.onload = function () {
    aoPronto({
      tipo: (arquivo.type || '').indexOf('video') === 0 ? 'video' : 'imagem',
      dado: leitor.result,
      nome: arquivo.name || ''
    });
  };
  leitor.onerror = function () { aoPronto({ erro: 'Não consegui ler o arquivo.' }); };
  leitor.readAsDataURL(arquivo);
}

/* bolha de mensagem com midia, usada nos tres espacos */
function laConvBolhaHTML(m, meuId, contexto) {
  const meu = String(m.deId || m.alunoId) === String(meuId);
  const daAcademia = m.de === 'academia';

  let classe = 'bolha ';
  if (contexto === 'grupo') {
    classe += daAcademia ? 'bolha-academia' : (meu ? 'bolha-aluno' : 'bolha-colega');
  } else {
    classe += meu ? 'bolha-aluno' : 'bolha-academia';
  }

  const iniciais = String(m.autor || 'AL').split(' ')
    .map(function (x) { return x[0]; }).slice(0, 2).join('').toUpperCase();

  let conteudo = '';
  if (m.midia && m.midia.dado) {
    conteudo += m.midia.tipo === 'video'
      ? '<video class="bolha-video" src="' + m.midia.dado + '" controls playsinline></video>'
      : '<img class="bolha-imagem" src="' + m.midia.dado + '" alt="imagem enviada">';
  }
  if (m.texto) conteudo += '<div class="bolha-txt">' + laEscapar(m.texto) + '</div>';

  const mostraNome = (contexto === 'grupo' && !meu);

  return '<div class="' + classe + '">' +
           (mostraNome
             ? '<div class="bolha-quem">' +
                 '<span class="bolha-av">' +
                   (m.foto ? '<img src="' + laEscapar(m.foto) + '" alt="">' : laEscapar(iniciais)) +
                 '</span>' +
                 '<b>' + laEscapar(m.autor || 'Aluno') + '</b>' +
                 (daAcademia ? '<span class="post-selo">Academia</span>' : '') +
               '</div>'
             : '') +
           conteudo +
           '<span class="bolha-hora">' +
             (contexto === 'grupo' && daAcademia && !meu ? 'Academia · ' : '') +
             new Date(m.quando).toLocaleString('pt-BR') +
           '</span>' +
         '</div>';
}

/* ==========================================================================
   CONVITES DE AMIZADE — igual WhatsApp: um pede, o outro aceita
   O chat do aluno nasce BLOQUEADO. So abre quando os dois aceitam.
   ========================================================================== */

const LA_CONVITES_CHAVE = 'la_convites';

function laConvitesLer() {
  return laConvLer(LA_CONVITES_CHAVE);
}

function laConvitesGravar(l) {
  return laConvGravar(LA_CONVITES_CHAVE, l);
}

/* o aluno procura o colega pela matrícula ou pelo CPF */
function laBuscarPorMatricula(termo) {
  const t = String(termo || '').replace(/\D/g, '');
  if (!t) return null;
  const alunos = (typeof laListarAlunos === 'function') ? laListarAlunos() : [];
  return alunos.find(function (a) {
    const mat = String(a.matricula || '').replace(/\D/g, '');
    const cpf = String(a.cpf || '').replace(/\D/g, '');
    return mat === t || cpf === t;
  }) || null;
}

/* manda o convite de amizade */
function laConvidarAmigo(euId, matricula) {
  const outro = laBuscarPorMatricula(matricula);
  if (!outro) return { ok: false, erro: 'Não achei ninguém com essa matrícula.' };
  if (String(outro.id) === String(euId)) return { ok: false, erro: 'Essa matrícula é a sua.' };

  /* ja sao amigos? */
  const par = laParChave(euId, outro.id);
  const amigos = laLerAmizades();
  if (amigos[par]) return { ok: false, erro: 'Vocês já são amigos.' };

  /* ja tem convite pendente? */
  const lista = laConvitesLer();
  const jaTem = lista.find(function (c) {
    return c.par === par && c.estado === 'pendente';
  });
  if (jaTem) return { ok: false, erro: 'Já existe um pedido entre vocês.' };

  const eu = (typeof laBuscarAluno === 'function') ? laBuscarAluno(euId) : null;
  lista.push({
    id: 'cv' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    par: par,
    deId: euId,
    paraId: outro.id,
    deNome: eu ? eu.nome : 'Aluno',
    paraNome: outro.nome || 'Aluno',
    estado: 'pendente',
    quando: laConvAgora()
  });
  laConvitesGravar(lista);
  return { ok: true, outro: outro };
}

/* os pedidos que chegaram para mim */
function laConvitesRecebidos(euId) {
  return laConvitesLer().filter(function (c) {
    return c && String(c.paraId) === String(euId) && c.estado === 'pendente';
  });
}

/* os pedidos que eu mandei, ainda esperando */
/* aceitar o pedido: a partir daqui os dois podem conversar */
function laAceitarConvite(conviteId) {
  const lista = laConvitesLer();
  const c = lista.find(function (x) { return x.id === conviteId; });
  if (!c) return false;
  c.estado = 'aceito';
  c.aceitoEm = laConvAgora();
  laConvitesGravar(lista);

  const amigos = laLerAmizades();
  amigos[c.par] = { deId: c.deId, paraId: c.paraId, desde: laConvAgora() };
  laAmizadesGravar(amigos);
  return true;
}

/* recusar */
function laRecusarConvite(conviteId) {
  const lista = laConvitesLer();
  const c = lista.find(function (x) { return x.id === conviteId; });
  if (!c) return false;
  c.estado = 'recusado';
  laConvitesGravar(lista);
  return true;
}

/* ==========================================================================
   AMIZADES — so com quem aceitou dos dois lados
   ========================================================================== */

const LA_AMIZADES_CHAVE = 'la_amizades';

function laLerAmizades() {
  try {
    const b = localStorage.getItem(LA_AMIZADES_CHAVE);
    const m = b ? JSON.parse(b) : {};
    return (m && typeof m === 'object') ? m : {};
  } catch (e) { return {}; }
}

function laAmizadesGravar(m) {
  try { localStorage.setItem(LA_AMIZADES_CHAVE, JSON.stringify(m)); return true; }
  catch (e) { return false; }
}

/* os amigos de um aluno, com nome e foto */
function laMeusAmigos(euId) {
  const amigos = laLerAmizades();
  const ids = [];
  Object.keys(amigos).forEach(function (par) {
    const a = amigos[par];
    if (String(a.deId) === String(euId)) ids.push(a.paraId);
    else if (String(a.paraId) === String(euId)) ids.push(a.deId);
  });
  return ids.map(function (id) {
    const aluno = (typeof laBuscarAluno === 'function') ? laBuscarAluno(id) : null;
    return {
      id: id,
      nome: aluno ? aluno.nome : 'Aluno',
      foto: aluno ? (aluno.foto || '') : '',
      matricula: aluno ? (aluno.matricula || '') : ''
    };
  }).filter(function (a) { return a.nome; });
}

/* o chat esta liberado? so se o aluno estiver na academia E tiver ao menos 1 amigo */
function laChatLiberado(euId) {
  const eu = (typeof laBuscarAluno === 'function') ? laBuscarAluno(euId) : null;
  if (!eu) return { liberado: false, motivo: 'Você não está mais cadastrado na academia.' };
  if (eu.ativo === false) return { liberado: false, motivo: 'Seu cadastro está inativo. Fale com a recepção.' };
  if ((typeof laMeusAmigos === 'function' ? laMeusAmigos(euId).length : 0) === 0) {
    return { liberado: false, motivo: 'O chat abre quando você adicionar um amigo pela matrícula.' };
  }
  return { liberado: true, motivo: '' };
}

/* ==========================================================================
   EXCLUSAO — a academia tira o aluno do sistema
   ========================================================================== */

function laExcluirAlunoDeVez(alunoId) {
  try {
    /* sai da lista de alunos */
    if (typeof laListarAlunos === 'function' && typeof laSalvarAlunos === 'function') {
      laSalvarAlunos(laListarAlunos().filter(function (a) { return a.id !== alunoId; }));
    }

    /* sai das conversas particulares */
    const part = laConvLer(LA_PARTICULAR).filter(function (m) {
      return m && String(m.deId) !== String(alunoId) && String(m.paraId) !== String(alunoId);
    });
    laConvGravar(LA_PARTICULAR, part);

    /* sai do grupo */
    const grupo = laConvLer(LA_GRUPO_CHAVE).filter(function (m) {
      return m && String(m.alunoId) !== String(alunoId);
    });
    laConvGravar(LA_GRUPO_CHAVE, grupo);

    /* sai das amizades e convites */
    const amigos = laLerAmizades();
    Object.keys(amigos).forEach(function (par) {
      if (par.indexOf(String(alunoId)) !== -1) delete amigos[par];
    });
    laAmizadesGravar(amigos);

    laConvitesGravar(laConvitesLer().filter(function (c) {
      return c && String(c.deId) !== String(alunoId) && String(c.paraId) !== String(alunoId);
    }));

    return true;
  } catch (e) {
    console.warn('Excluir aluno:', e);
    return false;
  }
}
