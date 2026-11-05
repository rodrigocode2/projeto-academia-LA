/* ==========================================================================
   L.A FITNESS — MURAL DA ACADEMIA
   Camada isolada: hoje localStorage, depois Supabase.
   ========================================================================== */

const LA_MURAL_CHAVE = 'la_mural';
const LA_MURAL_ESTADO = 'la_mural_estado';

function laLerMural() {
  try {
    const b = localStorage.getItem(LA_MURAL_CHAVE);
    const l = b ? JSON.parse(b) : [];
    return Array.isArray(l) ? l : [];
  } catch (e) { return []; }
}
function laMuralAberto() {
  try {
    const b = localStorage.getItem(LA_MURAL_ESTADO);
    return b === null ? true : b === 'aberto';
  } catch (e) { return true; }
}

function laAbrirFecharMural(aberto) {
  try { localStorage.setItem(LA_MURAL_ESTADO, aberto ? 'aberto' : 'fechado'); return true; }
  catch (e) { return false; }
}

function laPostarNoMural(alunoId, texto) {
  const t = String(texto || '').trim();
  if (!t) return null;
  const aluno = (typeof laBuscarAluno === 'function') ? laBuscarAluno(alunoId) : null;
  const post = {
    id: 'mu' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    alunoId: alunoId,
    autor: aluno ? aluno.nome : 'Aluno',
    foto: aluno ? aluno.foto : '',
    texto: t.slice(0, 500),
    quando: new Date().toISOString(),
    de: 'aluno'
  };
  const lista = laLerMural();
  lista.push(post);
  try { localStorage.setItem(LA_MURAL_CHAVE, JSON.stringify(lista)); } catch (e) {}
  return post;
}

/* post da academia no mural */
function laPostarDaAcademia(texto) {
  const post = {
    id: 'mu' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    alunoId: '',
    autor: 'L.A Fitness',
    foto: '',
    texto: String(texto || '').slice(0, 500),
    quando: new Date().toISOString(),
    de: 'academia'
  };
  const lista = laLerMural();
  lista.push(post);
  try { localStorage.setItem(LA_MURAL_CHAVE, JSON.stringify(lista)); } catch (e) {}
  return post;
}
