/* ==========================================================================
   L.A FITNESS — MONTAR TREINO (painel)
   Camada isolada, igual as outras: hoje localStorage, depois Supabase.

   Fluxo: escolhe o aluno -> cria o treino -> adiciona exercicios com series
   e repeticoes -> salva. A ficha fica presa ao aluno (laVincularFicha).
   ========================================================================== */

const LA_MONTAGEM_CHAVE = 'la_montagem';   /* rascunho em andamento */

function laRascunho() {
  try {
    const b = localStorage.getItem(LA_MONTAGEM_CHAVE);
    const r = b ? JSON.parse(b) : null;
    if (r && r.alunoId) return r;
  } catch (e) {}
  return {
    alunoId: '',
    fichaId: '',
    nome: '',
    objetivo: '',
    nivel: 'Intermediário',
    treinoLetra: 'A',
    exercicios: []
  };
}

function laSalvarRascunho(r) {
  try { localStorage.setItem(LA_MONTAGEM_CHAVE, JSON.stringify(r)); return true; }
  catch (e) { return false; }
}

function laLimparRascunho() {
  try { localStorage.removeItem(LA_MONTAGEM_CHAVE); } catch (e) {}
}

/* nomes de treino por letra */
function laNomeDoTreino(letra) {
  const nomes = {
    A: 'Peito, Tríceps & Ombro',
    B: 'Costas & Bíceps',
    C: 'Pernas & Glúteos',
    D: 'Ombros & Abdômen',
    E: 'Corpo inteiro'
  };
  return nomes[letra] || ('Treino ' + letra);
}

/* ==========================================================================
   CRIAR A FICHA A PARTIR DO RASCUNHO
   ========================================================================== */

function laMontarFicha() {
  const r = laRascunho();
  if (!r.exercicios.length) return { ok: false, erro: 'Adicione pelo menos um exercício.' };

  /* agrupa os exercicios por letra de treino */
  const porLetra = {};
  r.exercicios.forEach(function (e) {
    const l = e.letra || 'A';
    if (!porLetra[l]) porLetra[l] = [];
    porLetra[l].push({
      nome: e.nome,
      grupo: e.grupo || '',
      equipamento: e.equipamento || '',
      series: Number(e.series) || 3,
      repeticoes: e.repeticoes || '12',
      descanso: e.descanso || '60s',
      video: e.video || ''
    });
  });

  const treinos = Object.keys(porLetra).sort().map(function (l) {
    return { letra: l, nome: laNomeDoTreino(l), exercicios: porLetra[l] };
  });

  let ficha;
  if (r.fichaId) {
    /* ja existe: atualiza */
    ficha = (typeof laAtualizarFicha === 'function')
      ? laAtualizarFicha(r.fichaId, { treinos: treinos, nome: r.nome || 'Ficha do aluno', objetivo: r.objetivo, nivel: r.nivel })
      : null;
  } else {
    ficha = (typeof laCriarFicha === 'function')
      ? laCriarFicha({
          nome: r.nome || 'Ficha do aluno',
          objetivo: r.objetivo,
          nivel: r.nivel,
          autoria: 'academia',
          autor: 'Academia',
          treinos: treinos
        })
      : null;
  }

  if (!ficha) return { ok: false, erro: 'Não consegui salvar a ficha.' };

  /* prende a ficha no aluno */
  if (r.alunoId && typeof laVincularFicha === 'function') {
    laVincularFicha(r.alunoId, ficha.id, 'academia');
  }

  /* garante que os exercicios entrem no banco geral tambem */
  if (typeof laCriarExercicio === 'function' && typeof laListarExercicios === 'function') {
    r.exercicios.forEach(function (e) {
      const existe = laListarExercicios().some(function (x) {
        return String(x.nome).toLowerCase() === String(e.nome).toLowerCase();
      });
      if (!existe && e.nome) {
        laCriarExercicio({
          nome: e.nome, grupo: e.grupo, equipamento: e.equipamento, video: e.video
        });
      }
    });
  }

  laLimparRascunho();
  return { ok: true, ficha: ficha };
}

/* quantos exercicios o aluno ja tem na ficha presa a ele */
