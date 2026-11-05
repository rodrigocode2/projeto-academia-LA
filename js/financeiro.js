/* ==========================================================================
   L.A FITNESS — FINANCEIRO
   Cobranca recorrente, inadimplencia e controle de acesso.

   Camada isolada: hoje localStorage, depois Supabase (mesmas funcoes).
   O mercado trata estes tres itens como exigencia minima em 2026.
   ========================================================================== */

const LA_COBRANCAS_CHAVE = 'la_cobrancas';
const LA_ACESSOS_CHAVE   = 'la_acesso_aluno';

/* ==========================================================================
   1. COBRANCAS — a mensalidade de cada aluno, mes a mes
   ========================================================================== */

function laLerCobrancas() {
  try {
    const b = localStorage.getItem(LA_COBRANCAS_CHAVE);
    const l = b ? JSON.parse(b) : [];
    return Array.isArray(l) ? l : [];
  } catch (e) { return []; }
}

function laGravarCobrancas(l) {
  try { localStorage.setItem(LA_COBRANCAS_CHAVE, JSON.stringify(l)); return true; }
  catch (e) { return false; }

  /* manda para o banco */
  if (window.LADB && window.LADB.pronto && Array.isArray(l)) {
    window.LADB.gravar('la_cobrancas', l.map(function (c) {
      return { aluno_id: c.alunoId, valor: c.valor, descricao: c.descricao,
               competencia: c.competencia, pago: !!c.pago, pago_em: c.pagoEm || null };
    })).catch(function (e) { console.warn('[LADB] cobrancas so no navegador:', e.message); });
  }
}

/* valor do plano — igual ao da mensalidade que o aluno ja ve */
function laValorDoPlano(plano) {
  if (typeof laPrecoDoPlano === 'function') return laPrecoDoPlano(plano);
  const p = String(plano || '').toLowerCase();
  if (p.indexOf('wellhub') !== -1 || p.indexOf('gympass') !== -1) return 0;
  if (p.indexOf('gast') !== -1) return 150.00;
  return 99.90;
}

/* vencimento: 10 dias depois do inicio, ou o dia que a academia definir */
function laDiaVencimento(aluno) {
  const d = aluno && aluno.diaVencimento ? Number(aluno.diaVencimento) : 10;
  return Math.min(Math.max(d, 1), 28);
}

function laCompetencia(ano, mes) {
  return ano + '-' + String(mes).padStart(2, '0');
}

function laCompetenciaDeHoje() {
  const d = new Date();
  return laCompetencia(d.getFullYear(), d.getMonth() + 1);
}

function laNomeDoMes(comp) {
  const meses = ['janeiro','fevereiro','março','abril','maio','junho',
                 'julho','agosto','setembro','outubro','novembro','dezembro'];
  const p = String(comp || '').split('-');
  const m = parseInt(p[1], 10) - 1;
  return (meses[m] || '?') + '/' + (p[0] || '');
}

/* data de vencimento de uma competencia */
function laVencimento(comp, dia) {
  const p = String(comp || '').split('-');
  const d = new Date(Number(p[0]), Number(p[1]) - 1, laDiaVencimento({ diaVencimento: dia }));
  return d;
}

/* ---------- gerar as cobrancas do mes para todos os alunos ---------- */
function laGerarCobrancasDoMes(comp) {
  const competencia = comp || laCompetenciaDeHoje();
  const alunos = (typeof laListarAlunos === 'function') ? laListarAlunos() : [];
  const lista = laLerCobrancas();
  let criadas = 0;

  alunos.forEach(function (a) {
    const valor = laValorDoPlano(a.plano);
    if (valor <= 0) return;                       /* Wellhub nao gera cobranca */
    const jaTem = lista.find(function (c) {
      return c.alunoId === a.id && c.competencia === competencia;
    });
    if (jaTem) return;

    const venc = laVencimento(competencia, a.diaVencimento);
    lista.push({
      id: 'cb' + a.id + competencia,
      alunoId: a.id,
      aluno: a.nome,
      competencia: competencia,
      valor: valor,
      vencimento: venc.toISOString().slice(0, 10),
      status: 'aberta',            /* aberta | paga | atrasada | cancelada */
      criadaEm: new Date().toISOString()
    });
    criadas++;
  });

  laGravarCobrancas(lista);
  return criadas;
}

/* ---------- marcar as vencidas como atrasadas ---------- */
function laAtualizarAtrasos() {
  const lista = laLerCobrancas();
  const hoje = new Date().toISOString().slice(0, 10);
  let mudou = 0;
  lista.forEach(function (c) {
    if (c.status === 'aberta' && c.vencimento < hoje) {
      c.status = 'atrasada';
      mudou++;
    }
  });
  if (mudou) laGravarCobrancas(lista);
  return mudou;
}

function laCobrancasDoAluno(alunoId) {
  return laLerCobrancas()
    .filter(function (c) { return c && c.alunoId === alunoId; })
    .sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); });
}

function laCobrancasDoMes(comp) {
  const competencia = comp || laCompetenciaDeHoje();
  return laLerCobrancas().filter(function (c) { return c && c.competencia === competencia; });
}

/* ---------- pagar ---------- */
function laPagarCobranca(id, forma) {
  const lista = laLerCobrancas();
  const c = lista.find(function (x) { return x.id === id; });
  if (!c) return false;
  c.status = 'paga';
  c.pagoEm = new Date().toISOString();
  c.forma = forma || 'recepcao';
  laGravarCobrancas(lista);

  /* registra tambem no historico que o aluno ja ve */
  if (typeof laRegistrarPagamento === 'function') {
    laRegistrarPagamento(c.alunoId, c.competencia, c.valor);
    if (typeof laConfirmarPagamento === 'function') {
      const todos = (typeof laTodosPagamentos === 'function') ? laTodosPagamentos() : [];
      const reg = todos.find(function (p) {
        return p.alunoId === c.alunoId && p.competencia === c.competencia;
      });
      if (reg) laConfirmarPagamento(reg.id);
    }
  }
  return true;
}

/* ---------- numeros do painel ---------- */
function laResumoFinanceiro(comp) {
  laAtualizarAtrasos();
  const competencia = comp || laCompetenciaDeHoje();
  const lista = laLerCobrancas();

  const doMes = lista.filter(function (c) { return c.competencia === competencia; });
  const pagas = doMes.filter(function (c) { return c.status === 'paga'; });
  const abertas = doMes.filter(function (c) { return c.status === 'aberta'; });
  const atrasadas = lista.filter(function (c) { return c.status === 'atrasada'; });

  const soma = function (arr) {
    return arr.reduce(function (s, c) { return s + Number(c.valor || 0); }, 0);
  };

  const previsto = soma(doMes);
  const recebido = soma(pagas);
  const emAberto = soma(abertas);
  const atraso = soma(atrasadas);

  return {
    competencia: competencia,
    doMes: doMes.length,
    pagas: pagas.length,
    abertas: abertas.length,
    atrasadas: atrasadas.length,
    previsto: previsto,
    recebido: recebido,
    emAberto: emAberto,
    emAtraso: atraso,
    taxaInadimplencia: previsto > 0 ? Math.round((atraso / previsto) * 1000) / 10 : 0
  };
}

/* ---------- alunos em risco (o mercado chama de "grupo de risco") ---------- */
function laAlunosEmRisco() {
  laAtualizarAtrasos();
  const alunos = (typeof laListarAlunos === 'function') ? laListarAlunos() : [];
  const lista = laLerCobrancas();

  return alunos.map(function (a) {
    const dele = lista.filter(function (c) { return c.alunoId === a.id; });
    const atrasadas = dele.filter(function (c) { return c.status === 'atrasada'; });
    const diasSemTreinar = laDiasSemTreinar(a.id);

    let risco = 0;
    if (atrasadas.length) risco += atrasadas.length * 40;
    if (diasSemTreinar > 14) risco += 30;
    if (diasSemTreinar > 30) risco += 30;
    if (a.ativo === false) risco = 100;

    return {
      id: a.id,
      nome: a.nome,
      telefone: a.telefone || '',
      plano: a.plano,
      mensalidadesAtrasadas: atrasadas.length,
      valorEmAtraso: atrasadas.reduce(function (s, c) { return s + Number(c.valor || 0); }, 0),
      diasSemTreinar: diasSemTreinar,
      risco: Math.min(risco, 100)
    };
  }).filter(function (x) { return x.risco >= 30; })
    .sort(function (a, b) { return b.risco - a.risco; });
}

/* quantos dias o aluno nao aparece */
function laDiasSemTreinar(alunoId) {
  let ultima = null;
  try {
    const ex = (typeof laHistoricoExecucao === 'function') ? laHistoricoExecucao(alunoId, 400) : [];
    ex.forEach(function (h) { if (h.exercicios > 0 && (!ultima || h.dia > ultima)) ultima = h.dia; });
    const cor = (typeof laCorridas === 'function') ? laCorridas(alunoId) : [];
    cor.forEach(function (c) {
      const d = String(c.quando || '').slice(0, 10);
      if (d && (!ultima || d > ultima)) ultima = d;
    });
  } catch (e) { return 0; }

  if (!ultima) return 99;
  const dif = (new Date() - new Date(ultima + 'T12:00:00')) / 86400000;
  return Math.max(0, Math.floor(dif));
}

/* ==========================================================================
   2. CONTROLE DE ACESSO — a catraca
   Cada aluno tem um codigo (a matricula). Ao entrar, o sistema valida:
   cadastro ativo, mensalidade em dia, e registra a entrada.
   ========================================================================== */

const LA_CATRACA_ESTADO = 'la_catraca_estado';

function laCatracaAberta() {
  try {
    const b = localStorage.getItem(LA_CATRACA_ESTADO);
    return b === null ? true : b === 'aberta';
  } catch (e) { return true; }
}

function laAbrirFecharCatraca(aberta) {
  try {
    localStorage.setItem(LA_CATRACA_ESTADO, aberta ? 'aberta' : 'fechada');
    return true;
  } catch (e) { return false; }
}

function laLerAcessos() {
  try {
    const b = localStorage.getItem(LA_ACESSOS_CHAVE);
    const l = b ? JSON.parse(b) : [];
    return Array.isArray(l) ? l : [];
  } catch (e) { return []; }
}

/* a validacao da entrada: e aqui que a academia barra quem nao pagou */
function laValidarEntrada(codigo) {
  if (!laCatracaAberta()) {
    return { ok: false, motivo: 'A catraca está fechada pela recepção.' };
  }

  const termo = String(codigo || '').replace(/\D/g, '');
  if (!termo) return { ok: false, motivo: 'Digite a matrícula ou o CPF.' };

  const alunos = (typeof laListarAlunos === 'function') ? laListarAlunos() : [];
  const aluno = alunos.find(function (a) {
    const mat = String(a.matricula || '').replace(/\D/g, '');
    const cpf = String(a.cpf || '').replace(/\D/g, '');
    return mat === termo || cpf === termo;
  });

  if (!aluno) {
    return { ok: false, motivo: 'Não encontrei essa matrícula. Fale com a recepção.' };
  }
  if (aluno.ativo === false) {
    return { ok: false, motivo: aluno.nome + ': cadastro inativo.', aluno: aluno };
  }

  /* mensalidade em atraso barra a entrada */
  laAtualizarAtrasos();
  const atrasadas = laCobrancasDoAluno(aluno.id).filter(function (c) {
    return c.status === 'atrasada';
  });

  if (atrasadas.length) {
    return {
      ok: false,
      motivo: aluno.nome + ': mensalidade em atraso (' + atrasadas.length + ').',
      aluno: aluno,
      atrasadas: atrasadas
    };
  }

  /* liberado: registra a entrada */
  const lista = laLerAcessos();
  lista.push({
    id: 'ac' + Date.now().toString(36),
    alunoId: aluno.id,
    aluno: aluno.nome,
    quando: new Date().toISOString(),
    dia: new Date().toISOString().slice(0, 10)
  });
  try { localStorage.setItem(LA_ACESSOS_CHAVE, JSON.stringify(lista)); } catch (e) {}

  const hoje = lista.filter(function (a) {
    return a.dia === new Date().toISOString().slice(0, 10);
  }).length;

  return {
    ok: true,
    motivo: 'Bem-vindo, ' + aluno.nome.split(' ')[0] + '!',
    aluno: aluno,
    entradasHoje: hoje
  };
}

/* quantas entradas hoje, e o horario de pico */
function laResumoCatraca() {
  const lista = laLerAcessos();
  const hoje = new Date().toISOString().slice(0, 10);
  const deHoje = lista.filter(function (a) { return a.dia === hoje; });

  /* por hora, para achar o pico */
  const porHora = {};
  deHoje.forEach(function (a) {
    const h = new Date(a.quando).getHours();
    porHora[h] = (porHora[h] || 0) + 1;
  });
  let pico = null, n = 0;
  Object.keys(porHora).forEach(function (h) {
    if (porHora[h] > n) { n = porHora[h]; pico = Number(h); }
  });

  /* quantos estão dentro agora (ultima entrada nas 3 horas) */
  const agora = new Date();
  const dentro = deHoje.filter(function (a) {
    return (agora - new Date(a.quando)) < 3 * 3600 * 1000;
  }).length;

  return {
    hoje: deHoje.length,
    dentroAgora: dentro,
    picoHora: pico,
    picoQuantidade: n,
    totalRegistrado: lista.length
  };
}

/* ==========================================================================
   3. AVALIACAO FISICA — protocolo com % de gordura
   O mercado pede medidas, percentual e comparativo. Aqui tem os dois.
   ========================================================================== */

/* protocolo de 3 dobras (Pollarock simplificado, suficiente para acompanhar) */
function laPercentualGordura(medidas, sexo, idade) {
  /* medidas: { peito, abdomen, coxa } em mm, ou cintura/quadril em cm */
  if (!medidas) return null;

  if (medidas.peito != null && medidas.abdomen != null && medidas.coxa != null) {
    const soma = Number(medidas.peito) + Number(medidas.abdomen) + Number(medidas.coxa);
    if (sexo === 'feminino') {
      return Math.round((0.29669 * soma - 0.00043 * soma * soma + 0.02963 * Number(idade || 30) + 1.4072) * 10) / 10;
    }
    return Math.round((0.39287 * soma - 0.00105 * soma * soma + 0.15772 * Number(idade || 30) - 5.18845) * 10) / 10;
  }

  /* sem as dobras: usa cintura e quadril (razao), devolve apenas a razao */
  if (medidas.cintura != null && medidas.quadril != null) {
    return null;
  }
  return null;
}

function laClassificarGordura(pct, sexo) {
  if (pct == null) return '';
  const faixas = sexo === 'feminino'
    ? [[0,14,'atleta'],[14,21,'bom'],[21,28,'médio'],[28,100,'alto']]
    : [[0,8,'atleta'],[8,15,'bom'],[15,21,'médio'],[21,100,'alto']];
  for (const f of faixas) if (pct >= f[0] && pct < f[1]) return f[2];
  return '';
}

/* indice de massa corporal */
function laIMC(peso, alturaCm) {
  if (!peso || !alturaCm) return null;
  const m = Number(alturaCm) / 100;
  return Math.round((Number(peso) / (m * m)) * 10) / 10;
}

function laClassificarIMC(imc) {
  if (imc == null) return '';
  if (imc < 18.5) return 'abaixo do peso';
  if (imc < 25) return 'normal';
  if (imc < 30) return 'sobrepeso';
  return 'obesidade';
}

/* comparar a ultima avaliacao com a primeira */
function laCompararAvaliacoes(alunoId) {
  const medidas = (typeof laListarMedidas === 'function') ? laListarMedidas(alunoId) : [];
  if (medidas.length < 2) return null;

  const primeira = medidas[0];
  const ultima = medidas[medidas.length - 1];
  const dif = function (campo) {
    const a = Number(primeira[campo]), b = Number(ultima[campo]);
    if (isNaN(a) || isNaN(b)) return null;
    return Math.round((b - a) * 10) / 10;
  };

  return {
    desde: primeira.quando || primeira.dia,
    ate: ultima.quando || ultima.dia,
    avaliacoes: medidas.length,
    peso: dif('peso'),
    cintura: dif('cintura'),
    quadril: dif('quadril'),
    braco: dif('braco'),
    coxa: dif('coxa'),
    peito: dif('peito')
  };
}
