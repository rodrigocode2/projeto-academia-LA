/* ==========================================================================
   L.A FITNESS — camada de dados isolada
   Hoje: localStorage (funciona no mesmo navegador)
   Depois: trocar as funções de leitura/escrita por chamadas ao Supabase.
   Mesmo padrão do CiR: o resto do site não sabe onde os dados moram.
   ========================================================================== */

const LA_CHAVE       = 'la_conteudo';
const LA_ACESSOS     = 'la_acessos';
const LA_ALUNOS      = 'la_alunos';
const LA_SESSAO      = 'la_sessao_aluno';
const LA_CHAVE_ADMIN = 'la_admin_logado';

/* ==========================================================================
   1. CONTEÚDO DO SITE (textos, planos, modalidades) — usado no 1º acesso
   ========================================================================== */

function laPadrao() {
  return {
    geral: {
      nome: 'L.A Fitness',
      slogan: 'A melhor estrutura para a sua evolução física em <strong>Cidade Ocidental - GO</strong>.',
      telefone: '5561991719246',
      endereco: 'Parque Nova Friburgo B, Cidade Ocidental - GO (SQ 15, Q 08, Lt 12)',
      instagram: '',
      horarios: 'Segunda a Sexta: 06h às 22h · Sábado: 08h às 14h'
    },
    planos: [
      { id: 1, nome: 'Mensal', preco: '', descricao: 'Acesso livre à musculação e aulas coletivas.', destaque: false },
      { id: 2, nome: 'Recorrente', preco: '', descricao: 'Plano com renovação automática e desconto progressivo.', destaque: true },
      { id: 3, nome: 'Wellhub / Gympass', preco: '', descricao: 'Use o benefício corporativo da sua empresa.', destaque: false }
    ],
    modalidades: [
      { id: 1, icone: 'fa-dumbbell',             titulo: 'Musculação & Hipertrofia', texto: 'Equipamentos modernos e ambiente projetado para todos os níveis de alunos, do iniciante ao avançado.' },
      { id: 2, icone: 'fa-heart-pulse',          titulo: 'Aulas Coletivas & Cardiopack', texto: 'Atividades dinâmicas para queimar calorias, melhorar o condicionamento e aumentar a sua disposição diária.' },
      { id: 3, icone: 'fa-mobile-screen-button', titulo: 'Ficha de Treino Digital', texto: 'Acesse sua ficha exclusiva no celular via Web App PWA, sem precisar baixar nada da loja de aplicativos.' }
    ],
    roteiros: [
      { gatilhos: ['horario', 'hora', 'abre', 'fecha', 'funcionamento'],
        resposta: '⏰ <strong>Horários L.A Fitness:</strong><br>• Segunda a Sexta: 06h às 22h<br>• Sábado: 08h às 14h' },
      { gatilhos: ['endereço', 'endereco', 'onde', 'local', 'localiza', 'chegar'],
        resposta: '📍 Estamos no <strong>Parque Nova Friburgo B, Cidade Ocidental - GO</strong> (SQ 15, Q 08, Lt 12).' },
      { gatilhos: ['plano', 'valor', 'preço', 'preco', 'mensalidade', 'quanto custa'],
        resposta: '💪 Temos planos <strong>Mensal</strong>, <strong>Recorrente</strong> e parceria com <strong>Wellhub / Gympass</strong>. Venha fazer uma visita para conhecer a melhor condição.' },
      { gatilhos: ['aula experimental', 'experimental', 'teste', 'conhecer', 'visit'],
        resposta: '🎯 Você pode agendar uma <strong>aula experimental gratuita</strong>! Toque no botão abaixo que a recepção confirma o melhor horário.',
        botao: { texto: 'Agendar pelo WhatsApp', mensagem: 'Olá! Gostaria de agendar uma aula experimental na L.A Fitness.' } },
      { gatilhos: ['matricula', 'matrícula', 'matricular', 'inscrever', 'começar', 'comecar', 'cadastr'],
        resposta: '📝 A matrícula é feita na recepção da academia. Traga documento com foto e comprovante de residência. Quer que eu já te encaminhe?',
        botao: { texto: 'Falar com a recepção', mensagem: 'Olá! Quero fazer minha matrícula na L.A Fitness.' } },
      { gatilhos: ['professor', 'personal', 'acompanhamento', 'treino montado', 'ficha'],
        resposta: '🏋️ A L.A Fitness tem acompanhamento profissional incluído: nossos professores montam e revisam a sua ficha periodicamente.' }
    ],
    encaminharSempre: [
      'cancel', 'cancelar', 'trancar', 'boleto', 'pagamento', 'cobrança', 'cobranca',
      'atendente', 'recepção', 'recepcao', 'humano', 'atendimento'
    ],
    whatsappFallback: 'Entendi! Para essa dúvida específica, te conecto direto com a nossa recepção.',
    whatsappBotao: 'Falar no WhatsApp da L.A'
  };
}

function laLerConteudo() {
  try {
    const bruto = localStorage.getItem(LA_CHAVE);
    return bruto ? JSON.parse(bruto) : null;
  } catch (e) { return null; }
}

function laSalvarConteudo(dados) {
  try {
    localStorage.setItem(LA_CHAVE, JSON.stringify(dados));
    return true;
  } catch (e) { return false; }
}

/* garante TODOS os campos: dado antigo não pode derrubar o site nem o painel */
function laGarantirConteudo() {
  const padrao = laPadrao();
  let atual = laLerConteudo();

  if (!atual || typeof atual !== 'object') {
    laSalvarConteudo(padrao);
    return padrao;
  }

  atual.geral        = atual.geral        || padrao.geral;
  atual.planos       = Array.isArray(atual.planos)       ? atual.planos       : padrao.planos;
  atual.modalidades  = Array.isArray(atual.modalidades)  ? atual.modalidades  : padrao.modalidades;
  atual.roteiros     = Array.isArray(atual.roteiros)     ? atual.roteiros     : padrao.roteiros;
  atual.encaminharSempre = Array.isArray(atual.encaminharSempre) ? atual.encaminharSempre : padrao.encaminharSempre;

  Object.keys(padrao.geral).forEach(function (k) {
    if (!atual.geral[k]) atual.geral[k] = padrao.geral[k];
  });

  return atual;
}

/* ==========================================================================
   2. ALUNOS — cadastro feito pela recepção, login pelo aluno
   ========================================================================== */

function laListarAlunos() {
  try {
    const bruto = localStorage.getItem(LA_ALUNOS);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch (e) { return []; }
}

function laSalvarAlunos(lista) {
  try {
    localStorage.setItem(LA_ALUNOS, JSON.stringify(lista));
    return true;
  } catch (e) { return false; }
}

/* matrícula automática no formato LA-2026-0001 */
function laNovaMatricula() {
  const lista = laListarAlunos();
  const ano = new Date().getFullYear();
  const doAno = lista.filter(function (a) { return (a.matricula || '').indexOf('LA-' + ano) === 0; });
  return 'LA-' + ano + '-' + String(doAno.length + 1).padStart(4, '0');
}

function laCriarAluno(dados) {
  const lista = laListarAlunos();
  const aluno = {
    id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    matricula: dados.matricula || laNovaMatricula(),
    nome: dados.nome || '',
    cpf: (dados.cpf || '').replace(/\D/g, ''),
    senha: dados.senha || '',
    telefone: dados.telefone || '',
    email: dados.email || '',
    plano: dados.plano || 'Mensal',
    objetivo: dados.objetivo || '',
    foto: dados.foto || '',
    ativo: true,
    criadoEm: new Date().toISOString(),
    treinos: dados.treinos || []
  };
  lista.push(aluno);
  laSalvarAlunos(lista);
  return aluno;
}

function laBuscarAluno(id) {
  return laListarAlunos().find(function (a) { return a.id === id; }) || null;
}

function laAtualizarAluno(id, mudancas) {
  const lista = laListarAlunos();
  const i = lista.findIndex(function (a) { return a.id === id; });
  if (i === -1) return false;
  lista[i] = Object.assign({}, lista[i], mudancas);
  laSalvarAlunos(lista);
  return lista[i];
}

function laExcluirAluno(id) {
  laSalvarAlunos(laListarAlunos().filter(function (a) { return a.id !== id; }));
  return true;
}

/* ---------- login do aluno: CPF (só números) ou matrícula + senha ---------- */

function laAutenticar(usuario, senha) {
  const limpo = String(usuario || '').replace(/\D/g, '');
  const bruto = String(usuario || '').trim().toUpperCase();

  const aluno = laListarAlunos().find(function (a) {
    const bateCpf = limpo && a.cpf === limpo;
    const bateMatricula = (a.matricula || '').toUpperCase() === bruto;
    return (bateCpf || bateMatricula) && a.senha === senha;
  });

  if (!aluno) return { ok: false, erro: 'CPF, matrícula ou senha incorretos.' };
  if (!aluno.ativo) return { ok: false, erro: 'Sua matrícula está inativa. Fale com a recepção.' };

  laAbrirSessaoAluno(aluno.id);
  return { ok: true, aluno: aluno };
}

function laAbrirSessaoAluno(id) { try { sessionStorage.setItem(LA_SESSAO, id); } catch (e) {} }
function laAlunoLogado() {
  try {
    const id = sessionStorage.getItem(LA_SESSAO);
    return id ? laBuscarAluno(id) : null;
  } catch (e) { return null; }
}
function laSairAluno() { try { sessionStorage.removeItem(LA_SESSAO); } catch (e) {} }

/* ==========================================================================
   3. TREINOS — fichas montadas pelo professor, presas ao aluno
   ========================================================================== */

function laTreinoPadrao() {
  const semente = Date.now().toString(36);
  return [
    {
      id: 't' + semente + 'a',
      letra: 'A',
      nome: 'Peito, Tríceps & Ombros',
      exercicios: [
        { nome: 'Supino Reto com Barra',         descanso: '60s', series: [{ reps: '12', peso: '30kg', feito: false }, { reps: '10', peso: '35kg', feito: false }, { reps: '8', peso: '40kg', feito: false }] },
        { nome: 'Supino Inclinado com Halteres', descanso: '60s', series: [{ reps: '12', peso: '22kg', feito: false }, { reps: '10', peso: '24kg', feito: false }, { reps: '10', peso: '24kg', feito: false }] },
        { nome: 'Tríceps Pulley na Corda',       descanso: '45s', series: [{ reps: '15', peso: '25kg', feito: false }, { reps: '12', peso: '30kg', feito: false }] },
        { nome: 'Elevação Lateral',              descanso: '45s', series: [{ reps: '15', peso: '10kg', feito: false }, { reps: '12', peso: '12kg', feito: false }] }
      ]
    },
    {
      id: 't' + semente + 'b',
      letra: 'B',
      nome: 'Costas, Bíceps & Abdômen',
      exercicios: [
        { nome: 'Puxada Frontal',     descanso: '60s', series: [{ reps: '12', peso: '45kg', feito: false }, { reps: '10', peso: '50kg', feito: false }, { reps: '10', peso: '55kg', feito: false }] },
        { nome: 'Remada Curvada',     descanso: '60s', series: [{ reps: '12', peso: '30kg', feito: false }, { reps: '10', peso: '35kg', feito: false }] },
        { nome: 'Rosca Direta',       descanso: '45s', series: [{ reps: '12', peso: '20kg', feito: false }, { reps: '10', peso: '25kg', feito: false }] },
        { nome: 'Abdominal na Polia', descanso: '45s', series: [{ reps: '15', peso: '25kg', feito: false }, { reps: '15', peso: '25kg', feito: false }] }
      ]
    }
  ];
}

function laAlternarSerie(alunoId, treinoId, exIndex, serieIndex) {
  const lista = laListarAlunos();
  const aluno = lista.find(function (a) { return a.id === alunoId; });
  if (!aluno || !Array.isArray(aluno.treinos)) return false;

  const treino = aluno.treinos.find(function (t) { return t.id === treinoId; });
  if (!treino) return false;

  const ex = treino.exercicios[exIndex];
  if (!ex || !ex.series[serieIndex]) return false;

  ex.series[serieIndex].feito = !ex.series[serieIndex].feito;
  laSalvarAlunos(lista);
  return ex.series[serieIndex].feito;
}

function laProgressoTreino(treino) {
  let total = 0, feitas = 0;
  (treino.exercicios || []).forEach(function (ex) {
    (ex.series || []).forEach(function (s) {
      total++;
      if (s.feito) feitas++;
    });
  });
  return { feitas: feitas, total: total, pct: total ? Math.round((feitas / total) * 100) : 0 };
}

/* ==========================================================================
   4. ACESSO AO PAINEL — comando + senha
   ========================================================================== */

const LA_COMANDO_ADMIN = '/admin-academia-LA';
const LA_SENHA_ADMIN   = 'academiaLA2026';

function laVerificarSenhaAdmin(senha) {
  if (String(senha) === LA_SENHA_ADMIN) {
    try { sessionStorage.setItem(LA_CHAVE_ADMIN, '1'); } catch (e) {}
    return true;
  }
  return false;
}

function laAdminLogado() {
  try { return sessionStorage.getItem(LA_CHAVE_ADMIN) === '1'; } catch (e) { return false; }
}

function laSairAdmin() { try { sessionStorage.removeItem(LA_CHAVE_ADMIN); } catch (e) {} }

/* ==========================================================================
   5. MEDIÇÃO DE ACESSOS — mesmo modelo do CiR
   ========================================================================== */

function laSessao() {
  let s = null;
  try { s = sessionStorage.getItem('la_sessao_visita'); } catch (e) {}
  if (!s) {
    s = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    try { sessionStorage.setItem('la_sessao_visita', s); } catch (e) {}
  }
  return s;
}

function laNovoVisitante() {
  let v = null;
  try { v = localStorage.getItem('la_visitante'); } catch (e) {}
  if (!v) {
    v = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    try { localStorage.setItem('la_visitante', v); } catch (e) {}
    return { id: v, novo: true };
  }
  return { id: v, novo: false };
}

function laContexto(pagina, tipo, extra) {
  const ua = navigator.userAgent || '';
  const ref = document.referrer || '';

  let origem = 'direto';
  if (ref) {
    if (/instagram/i.test(ref)) origem = 'Instagram';
    else if (/facebook|fb\./i.test(ref)) origem = 'Facebook';
    else if (/google/i.test(ref)) origem = 'Google';
    else if (/youtube/i.test(ref)) origem = 'YouTube';
    else if (/whatsapp|wa\.me/i.test(ref)) origem = 'WhatsApp';
    else if (/t\.co|twitter|x\.com/i.test(ref)) origem = 'X / Twitter';
    else { try { origem = new URL(ref).hostname.replace('www.', ''); } catch (e) { origem = 'outro site'; } }
  }

  const largura = window.innerWidth || 0;
  const aparelho = largura < 700 ? 'celular' : (largura < 1100 ? 'tablet' : 'computador');

  let idioma = 'pt';
  try {
    const guardado = localStorage.getItem('la_idioma');
    if (guardado) idioma = guardado;
    else {
      const nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
      if (['pt', 'en', 'es'].indexOf(nav) !== -1) idioma = nav;
    }
  } catch (e) {}

  let navegador = 'outro';
  if (/edg/i.test(ua)) navegador = 'Edge';
  else if (/chrome/i.test(ua)) navegador = 'Chrome';
  else if (/safari/i.test(ua)) navegador = 'Safari';
  else if (/firefox/i.test(ua)) navegador = 'Firefox';

  const registro = {
    pagina: pagina || 'inicio',
    tipo: tipo || 'visualizacao',
    quando: new Date().toISOString(),
    sessao: laSessao(),
    visitante: laNovoVisitante().id,
    origem: origem,
    aparelho: aparelho,
    navegador: navegador,
    idioma: idioma,
    largura: largura
  };
  if (extra) Object.keys(extra).forEach(function (k) { registro[k] = extra[k]; });
  return registro;
}

function laRegistrarAcesso(pagina, tipo, extra) {
  try {
    const bruto = localStorage.getItem(LA_ACESSOS);
    const lista = bruto ? JSON.parse(bruto) : [];
    lista.push(laContexto(pagina, tipo, extra));
    localStorage.setItem(LA_ACESSOS, JSON.stringify(lista.slice(-5000)));
  } catch (e) { /* silencioso */ }
}

function laRegistrarVisita(pagina) {
  laRegistrarAcesso(pagina || 'inicio', 'visualizacao', { primeira: laNovoVisitante().novo });
}

function laListarAcessos() {
  try {
    const bruto = localStorage.getItem(LA_ACESSOS);
    if (bruto) return JSON.parse(bruto);
  } catch (e) {}
  return [];
}

function laLimparAcessos() { try { localStorage.removeItem(LA_ACESSOS); } catch (e) {} }

/* ---------- resumo pronto para o dashboard da academia ---------- */

function laResumo() {
  const lista = laListarAcessos();
  const hoje = new Date().toISOString().slice(0, 10);
  const sete = new Date(); sete.setDate(sete.getDate() - 7);
  const iso7 = sete.toISOString().slice(0, 10);

  const visualizacoes = lista.filter(function (x) { return x.tipo === 'visualizacao'; });

  const sessoes = {}, visitantes = {};
  lista.forEach(function (x) {
    sessoes[x.sessao || 'x'] = 1;
    visitantes[x.visitante || 'x'] = 1;
  });

  const deHoje = lista.filter(function (x) { return x.quando.slice(0, 10) === hoje; });
  const daSemana = lista.filter(function (x) { return x.quando.slice(0, 10) >= iso7; });

  const porSecao = {};
  visualizacoes.forEach(function (x) { porSecao[x.pagina] = (porSecao[x.pagina] || 0) + 1; });

  const porOrigem = {};
  lista.forEach(function (x) { porOrigem[x.origem || 'direto'] = (porOrigem[x.origem || 'direto'] || 0) + 1; });

  const porAparelho = {};
  lista.forEach(function (x) { porAparelho[x.aparelho || 'computador'] = (porAparelho[x.aparelho || 'computador'] || 0) + 1; });

  const porNavegador = {};
  lista.forEach(function (x) { porNavegador[x.navegador || 'outro'] = (porNavegador[x.navegador || 'outro'] || 0) + 1; });

  const cliques = {};
  lista.filter(function (x) { return x.tipo === 'clique'; }).forEach(function (x) {
    const alvo = x.alvo || 'outro';
    cliques[alvo] = (cliques[alvo] || 0) + 1;
  });

  const porSessao = {};
  visualizacoes.forEach(function (x) {
    const k = x.sessao || 'x';
    porSessao[k] = (porSessao[k] || 0) + 1;
  });
  let apenasUma = 0, varias = 0;
  Object.keys(porSessao).forEach(function (k) {
    if (porSessao[k] === 1) apenasUma++;
    if (porSessao[k] >= 4) varias++;
  });

  const contatos = lista.filter(function (x) {
    return x.tipo === 'clique' && /whatsapp|telefone|email|contato|matricula/i.test(x.alvo || '');
  }).length;

  const totalSessoes = Object.keys(porSessao).length;
  const mediaVisitas = totalSessoes ? Math.round((visualizacoes.length / totalSessoes) * 10) / 10 : 0;

  return {
    total: lista.length,
    visualizacoes: visualizacoes.length,
    sessoes: totalSessoes,
    visitantes: Object.keys(visitantes).length,
    hoje: deHoje.length,
    semana: daSemana.length,
    porSecao: porSecao,
    porOrigem: porOrigem,
    porAparelho: porAparelho,
    porNavegador: porNavegador,
    cliques: cliques,
    contatos: contatos,
    primeiraVisita: apenasUma,
    variasSecoes: varias,
    mediaVisitas: mediaVisitas,
    lista: lista
  };
}

/* ==========================================================================
   6. UTILIDADES
   ========================================================================== */

function laEnviarImagem(callback) {
  const entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = 'image/*';
  entrada.style.display = 'none';
  document.body.appendChild(entrada);

  entrada.addEventListener('change', function () {
    const arq = entrada.files && entrada.files[0];
    if (!arq) { document.body.removeChild(entrada); return; }
    const leitor = new FileReader();
    leitor.onload = function () { callback(arq.name, leitor.result); document.body.removeChild(entrada); };
    leitor.onerror = function () { callback(arq.name, ''); document.body.removeChild(entrada); };
    leitor.readAsDataURL(arq);
  });

  entrada.click();
}

function laFormatarCPF(v) {
  return String(v || '').replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function laIniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/);
  if (!partes[0]) return 'LA';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function laEscapar(txt) {
  return String(txt || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/* dados de exemplo, para demonstrar sem cadastrar na mão */
function laSemearExemplo() {
  if (laListarAlunos().length) return null;
  const aluno = laCriarAluno({
    nome: 'Rodrigo Silva',
    cpf: '12345678900',
    senha: '123456',
    plano: 'Recorrente',
    objetivo: 'Hipertrofia',
    telefone: '(61) 99999-0000'
  });
  aluno.treinos = laTreinoPadrao();
  laAtualizarAluno(aluno.id, { treinos: aluno.treinos });
  return aluno;
}
