/* ==========================================================================
   L.A FITNESS — MODELOS DE TREINO (leve / moderado / pesado)
   Camada isolada: hoje localStorage, depois Supabase (mesmas funcoes).

   A dona monta o treino UMA vez e aplica em quantos alunos quiser.
   Na area do aluno so aparece o treino que foi liberado para ele.
   ========================================================================== */

const LA_MODELOS_CHAVE = 'la_modelos_treino';
const LA_LIBERADO_CHAVE = 'la_treino_liberado';

/* as tres modalidades de fabrica */
const LA_MODALIDADES = [
  { id: 'leve',      nome: 'Treino leve',      cor: '#00e676', desc: 'Adaptação, menos volume, cargas leves' },
  { id: 'moderado',  nome: 'Treino moderado',  cor: '#ffb020', desc: 'Equilíbrio entre volume e intensidade' },
  { id: 'pesado',    nome: 'Treino pesado',    cor: '#e50914', desc: 'Alto volume, cargas altas, foco em força' }
];

function laModalidade(id) {
  return LA_MODALIDADES.find(function (m) { return m.id === id; }) || LA_MODALIDADES[1];
}

/* ==========================================================================
   MODELOS
   ========================================================================== */

function laListarModelos() {
  try {
    const b = localStorage.getItem(LA_MODELOS_CHAVE);
    const l = b ? JSON.parse(b) : null;
    if (Array.isArray(l)) return l;
  } catch (e) {}
  return [];
}

function laSalvarModelos(lista) {
  try { localStorage.setItem(LA_MODELOS_CHAVE, JSON.stringify(lista)); return true; }
  catch (e) { return false; }

  /* manda para o banco */
  if (window.LADB && window.LADB.pronto && Array.isArray(lista)) {
    window.LADB.gravar('la_modelos', lista.map(function (m) {
      return { id: m.id, modalidade: m.modalidade, nome: m.nome,
               descricao: m.descricao, treinos: m.treinos || [],
               atualizado_em: new Date().toISOString() };
    }), 'id').catch(function (e) { console.warn('[LADB] modelos so no navegador:', e.message); });
  }
}

function laBuscarModelo(id) {
  return laListarModelos().find(function (m) { return m.id === id; }) || null;
}

function laCriarModelo(dados) {
  const lista = laListarModelos();
  const m = {
    id: 'mo' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    modalidade: dados.modalidade || 'moderado',
    nome: (dados.nome || '').trim() || (laModalidade(dados.modalidade).nome + ' · ' + new Date().toLocaleDateString('pt-BR')),
    descricao: dados.descricao || '',
    treinos: dados.treinos || [],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  lista.push(m);
  laSalvarModelos(lista);
  return m;
}

function laAtualizarModelo(id, mudancas) {
  const lista = laListarModelos();
  const i = lista.findIndex(function (m) { return m.id === id; });
  if (i === -1) return false;
  lista[i] = Object.assign({}, lista[i], mudancas, { atualizadoEm: new Date().toISOString() });
  laSalvarModelos(lista);
  return lista[i];
}

function laExcluirModelo(id) {
  laSalvarModelos(laListarModelos().filter(function (m) { return m.id !== id; }));
  return true;
}

function laModelosPorModalidade(modalidade) {
  return laListarModelos().filter(function (m) { return m.modalidade === modalidade; });
}

/* quantos exercicios o modelo tem no total */
function laTotalDoModelo(m) {
  if (!m || !Array.isArray(m.treinos)) return 0;
  return m.treinos.reduce(function (s, t) {
    return s + ((t.exercicios || []).length);
  }, 0);
}

/* ==========================================================================
   LIBERAR UM MODELO PARA O ALUNO
   Na area do aluno SO aparece o que foi liberado aqui.
   ========================================================================== */

function laLerLiberados() {
  try {
    const b = localStorage.getItem(LA_LIBERADO_CHAVE);
    const m = b ? JSON.parse(b) : {};
    return (m && typeof m === 'object') ? m : {};
  } catch (e) { return {}; }
}

function laLiberarTreino(alunoId, modeloId) {
  try {
    const m = laLerLiberados();
    m[alunoId] = { modeloId: modeloId, liberadoEm: new Date().toISOString() };
    localStorage.setItem(LA_LIBERADO_CHAVE, JSON.stringify(m));
    return true;
  } catch (e) { return false; }
}

function laTreinoLiberado(alunoId) {
  const m = laLerLiberados();
  const r = m[alunoId];
  if (!r || !r.modeloId) return null;
  const modelo = laBuscarModelo(r.modeloId);
  if (!modelo) return null;
  return { modelo: modelo, modalidade: laModalidade(modelo.modalidade), liberadoEm: r.liberadoEm };
}

function laBloquearTreino(alunoId) {
  try {
    const m = laLerLiberados();
    delete m[alunoId];
    localStorage.setItem(LA_LIBERADO_CHAVE, JSON.stringify(m));
    return true;
  } catch (e) { return false; }
}

/* quem tem treino liberado */
function laAlunosComTreino() {
  const m = laLerLiberados();
  return Object.keys(m).filter(function (id) { return m[id] && m[id].modeloId; });
}

/* ==========================================================================
   REGISTRO DO QUE O ALUNO FEZ (carga por serie, marcação)
   ========================================================================== */

const LA_EXECUCAO_CHAVE = 'la_execucao';

function laLerExecucao() {
  try {
    const b = localStorage.getItem(LA_EXECUCAO_CHAVE);
    const m = b ? JSON.parse(b) : {};
    return (m && typeof m === 'object') ? m : {};
  } catch (e) { return {}; }
}

/* chave do dia */
function laHojeISO() { return new Date().toISOString().slice(0, 10); }

/* registro do exercicio de um aluno num dia */
function laRegistro(alunoId, exercicioNome, dia) {
  const tudo = laLerExecucao();
  const d = dia || laHojeISO();
  const chave = alunoId + '|' + d;
  if (!tudo[chave]) tudo[chave] = {};
  return tudo[chave][exercicioNome] || null;
}

/* o aluno marca/desmarca uma serie e anota a carga */
function laMarcarExecucao(alunoId, exercicioNome, indiceSerie, carga, feito) {
  try {
    const tudo = laLerExecucao();
    const d = laHojeISO();
    const chave = alunoId + '|' + d;
    if (!tudo[chave]) tudo[chave] = {};
    if (!tudo[chave][exercicioNome]) tudo[chave][exercicioNome] = { series: [], quando: new Date().toISOString() };

    const reg = tudo[chave][exercicioNome];
    reg.series[indiceSerie] = { carga: carga == null ? '' : String(carga), feito: feito === true };
    reg.quando = new Date().toISOString();

    localStorage.setItem(LA_EXECUCAO_CHAVE, JSON.stringify(tudo));
    return true;
  } catch (e) { return false; }
}

/* quantos exercicios do treino o aluno ja concluiu hoje */
function laProgressoDoDia(alunoId) {
  const tudo = laLerExecucao();
  const chave = alunoId + '|' + laHojeISO();
  const reg = tudo[chave] || {};
  let feitos = 0, total = 0;
  Object.keys(reg).forEach(function (nome) {
    const series = reg[nome].series || [];
    const marcadas = series.filter(function (s) { return s && s.feito; }).length;
    if (marcadas) feitos++;
  });
  const lib = laTreinoLiberado(alunoId);
  if (lib) {
    total = laTotalDoModelo(lib.modelo);
  }
  return { feitos: feitos, total: total };
}

/* historico dos ultimos dias */
function laHistoricoExecucao(alunoId, quantosDias) {
  const tudo = laLerExecucao();
  const dias = [];
  const n = quantosDias || 14;
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const reg = tudo[alunoId + '|' + iso] || {};
    let marcados = 0;
    Object.keys(reg).forEach(function (nome) {
      if ((reg[nome].series || []).some(function (s) { return s && s.feito; })) marcados++;
    });
    dias.push({ dia: iso, data: d, exercicios: marcados });
    }
  return dias;
}
