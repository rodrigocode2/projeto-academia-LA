/* ==========================================================================
   L.A FITNESS — painel de controle
   Acesso: comando /admin-academia-LA no chat do bot + senha
   Depende de: js/dados.js (e js/bot.js para o WhatsApp)
   ========================================================================== */

const LAAdmin = {

  iniciar() {
    if (!laAdminLogado()) { window.location.href = 'index.html'; return; }

    laGarantirConteudo();
    this.ligarAbas();
    this.ligarSair();
    this.ligarAlunos();
    this.pintarTudo();
  },

  ligarAbas() {
    document.querySelectorAll('[data-aba-admin]').forEach(function (b) {
      b.addEventListener('click', function () {
        const qual = b.getAttribute('data-aba-admin');
        document.querySelectorAll('[data-aba-admin]').forEach(function (x) { x.classList.remove('ativa'); });
        document.querySelectorAll('.painel-aba').forEach(function (p) { p.classList.remove('ativa'); });
        b.classList.add('ativa');
        const alvo = document.getElementById('painel-' + qual);
        if (alvo) alvo.classList.add('ativa');
      });
    });
  },

  ligarSair() {
    const b = document.querySelector('.js-admin-sair');
    if (b) b.addEventListener('click', function () {
      laSairAdmin();
      window.location.href = 'index.html';
    });
  },

  pintarTudo() {
    this.pintarMetricas();
    this.pintarAlunos();
  },

  /* ======================================================================
     MÉTRICAS — mesma leitura do dashboard do CiR
     ====================================================================== */
  pintarMetricas() {
    const r = laResumo();

    const colocar = function (seletor, valor) {
      const el = document.querySelector(seletor);
      if (el) el.textContent = valor;
    };

    colocar('.js-m-visitantes', r.visitantes);
    colocar('.js-m-sessoes', r.sessoes);
    colocar('.js-m-hoje', r.hoje);
    colocar('.js-m-contatos', r.contatos);
    colocar('.js-m-visualizacoes', r.visualizacoes);
    colocar('.js-m-media', r.mediaVisitas);
    colocar('.js-m-primeira', r.primeiraVisita);
    colocar('.js-m-varias', r.variasSecoes);

    const sec = document.querySelector('.js-m-secoes');
    if (sec) {
      const ordenado = Object.keys(r.porSecao)
        .map(function (k) { return { nome: k, n: r.porSecao[k] }; })
        .sort(function (a, b) { return b.n - a.n; })
        .slice(0, 8);

      sec.innerHTML = ordenado.length
        ? ordenado.map(function (s) {
            const pct = r.visualizacoes ? Math.round((s.n / r.visualizacoes) * 100) : 0;
            return '<div class="linha-metrica">' +
                     '<span>' + laEscapar(s.nome) + '</span>' +
                     '<div class="barra-mini"><i style="width:' + pct + '%"></i></div>' +
                     '<b>' + s.n + '</b>' +
                   '</div>';
          }).join('')
        : '<p class="vazio">Sem dados ainda.</p>';
    }

    const ori = document.querySelector('.js-m-origem');     if (ori) ori.innerHTML = this.linhas(r.porOrigem);
    const apa = document.querySelector('.js-m-aparelho');   if (apa) apa.innerHTML = this.linhas(r.porAparelho);
    const nav = document.querySelector('.js-m-navegador');  if (nav) nav.innerHTML = this.linhas(r.porNavegador);
    const cli = document.querySelector('.js-m-cliques');    if (cli) cli.innerHTML = this.linhas(r.cliques);

    this.desenharGrafico(r.lista);
  },

  linhas(obj) {
    const chaves = Object.keys(obj || {});
    if (!chaves.length) return '<p class="vazio">Sem dados ainda.</p>';
    const total = chaves.reduce(function (a, k) { return a + obj[k]; }, 0);
    return chaves
      .map(function (k) { return { nome: k, n: obj[k] }; })
      .sort(function (a, b) { return b.n - a.n; })
      .map(function (x) {
        const pct = total ? Math.round((x.n / total) * 100) : 0;
        return '<div class="linha-metrica">' +
                 '<span>' + laEscapar(x.nome) + '</span>' +
                 '<div class="barra-mini"><i style="width:' + pct + '%"></i></div>' +
                 '<b>' + x.n + '</b>' +
               '</div>';
      }).join('');
  },

  /* ---------- gráfico em canvas, 14 dias ---------- */
  desenharGrafico(lista) {
    const cv = document.querySelector('.js-m-grafico');
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const dias = 14;
    const hoje = new Date();
    const contagem = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      contagem.push({
        dia: iso.slice(8, 10) + '/' + iso.slice(5, 7),
        n: (lista || []).filter(function (x) { return x.quando.slice(0, 10) === iso; }).length
      });
    }

    const px = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || 640;
    const h = 200;
    cv.width = w * px; cv.height = h * px;
    ctx.setTransform(px, 0, 0, px, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const max = Math.max.apply(null, contagem.map(function (c) { return c.n; }).concat([1]));
    const passo = w / contagem.length;
    const largura = Math.max(6, passo * 0.55);

    contagem.forEach(function (c, i) {
      const altura = (c.n / max) * (h - 46);
      const x = i * passo + (passo - largura) / 2;
      const y = h - 26 - altura;

      const grad = ctx.createLinearGradient(0, y, 0, h - 26);
      grad.addColorStop(0, '#E50914');
      grad.addColorStop(1, 'rgba(229,9,20,0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, largura, altura);

      ctx.fillStyle = 'rgba(240,240,245,0.45)';
      ctx.font = '10px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.dia, x + largura / 2, h - 10);

      if (c.n > 0) {
        ctx.fillStyle = '#f0f0f5';
        ctx.font = 'bold 10px Montserrat, sans-serif';
        ctx.fillText(c.n, x + largura / 2, y - 5);
      }
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(0, h - 26);
    ctx.lineTo(w, h - 26);
    ctx.stroke();
  },

  /* ======================================================================
     ALUNOS
     ====================================================================== */
  ligarAlunos() {
    const form = document.getElementById('form-novo-aluno');
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome  = document.getElementById('aluno-nome').value.trim();
      const cpf   = document.getElementById('aluno-cpf').value.replace(/\D/g, '');
      const senha = document.getElementById('aluno-senha').value.trim();
      const erro  = document.getElementById('aluno-erro');

      if (nome.split(/\s+/).length < 2) return this.avisar(erro, 'Informe o nome completo.');
      if (cpf.length !== 11) return this.avisar(erro, 'O CPF precisa ter 11 números.');
      if (senha.length < 4) return this.avisar(erro, 'A senha precisa ter pelo menos 4 caracteres.');

      const repetido = laListarAlunos().some(function (a) { return a.cpf === cpf; });
      if (repetido) return this.avisar(erro, 'Já existe um aluno com esse CPF.');

      const aluno = laCriarAluno({
        nome: nome,
        cpf: cpf,
        senha: senha,
        telefone: document.getElementById('aluno-telefone').value.trim(),
        email: document.getElementById('aluno-email').value.trim(),
        plano: document.getElementById('aluno-plano').value,
        objetivo: document.getElementById('aluno-objetivo').value.trim(),
        treinos: laTreinoPadrao()
      });

      if (erro) erro.classList.add('hidden');
      form.reset();
      this.pintarAlunos();
      this.avisarSucesso('Aluno cadastrado. Matrícula ' + aluno.matricula + ' — entregue o acesso a ele.');
    });

    const buscar = document.getElementById('busca-aluno');
    if (buscar) buscar.addEventListener('input', () => this.pintarAlunos(buscar.value));

    const semear = document.querySelector('.js-semear');
    if (semear) semear.addEventListener('click', () => {
      const a = laSemearExemplo();
      this.pintarAlunos();
      if (a) this.avisarSucesso('Aluno de exemplo criado: ' + a.nome + ' (CPF 123.456.789-00, senha 123456).');
      else this.avisarSucesso('Já existe aluno cadastrado — o exemplo só é criado quando a lista está vazia.');
    });
  },

  avisar(el, msg) {
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    return false;
  },

  avisarSucesso(msg) {
    const caixa = document.querySelector('.js-aviso-sucesso');
    if (!caixa) return;
    caixa.textContent = msg;
    caixa.classList.remove('hidden');
    setTimeout(function () { caixa.classList.add('hidden'); }, 5000);
  },

  pintarAlunos(filtro) {
    const casa = document.querySelector('.js-tabela-alunos');
    if (!casa) return;

    let lista = laListarAlunos();
    if (filtro) {
      const f = filtro.toLowerCase();
      lista = lista.filter(function (a) {
        return (a.nome || '').toLowerCase().includes(f) ||
               (a.matricula || '').toLowerCase().includes(f) ||
               (a.cpf || '').includes(f.replace(/\D/g, ''));
      });
    }

    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Nenhum aluno cadastrado ainda.</p>';
      return;
    }

    casa.innerHTML = lista.map(function (a) {
      return '<div class="linha-aluno">' +
               '<div class="da-esquerda">' +
                 '<div class="avatar-aluno">' + laIniciais(a.nome) + '</div>' +
                 '<div>' +
                   '<b>' + laEscapar(a.nome) + '</b>' +
                   '<span>' + laEscapar(a.matricula) + ' • ' + laEscapar(laFormatarCPF(a.cpf)) + '</span>' +
                 '</div>' +
               '</div>' +
               '<div class="do-meio">' +
                 '<span class="pilula">' + laEscapar(a.plano || 'Mensal') + '</span>' +
                 '<span class="pilula ' + (a.ativo ? 'ok' : 'off') + '">' + (a.ativo ? 'Ativo' : 'Inativo') + '</span>' +
               '</div>' +
               '<div class="da-direita">' +
                 '<button class="btn-mini js-ficha" data-id="' + a.id + '">Ficha</button>' +
                 '<button class="btn-mini js-ativar" data-id="' + a.id + '">' + (a.ativo ? 'Inativar' : 'Ativar') + '</button>' +
                 '<button class="btn-mini perigo js-excluir" data-id="' + a.id + '">Excluir</button>' +
               '</div>' +
             '</div>';
    }).join('');

    const eu = this;
    casa.querySelectorAll('.js-ativar').forEach(function (b) {
      b.addEventListener('click', function () {
        const a = laBuscarAluno(b.getAttribute('data-id'));
        if (!a) return;
        laAtualizarAluno(a.id, { ativo: !a.ativo });
        const campo = document.getElementById('busca-aluno');
        eu.pintarAlunos(campo ? campo.value : '');
      });
    });

    casa.querySelectorAll('.js-excluir').forEach(function (b) {
      b.addEventListener('click', function () {
        const a = laBuscarAluno(b.getAttribute('data-id'));
        if (!a) return;
        if (!confirm('Excluir ' + a.nome + '? Isso não pode ser desfeito.')) return;
        laExcluirAluno(a.id);
        eu.pintarAlunos();
      });
    });

    casa.querySelectorAll('.js-ficha').forEach(function (b) {
      b.addEventListener('click', function () { eu.abrirFicha(b.getAttribute('data-id')); });
    });
  },

  /* ---------- edição da ficha de treino ---------- */
  abrirFicha(alunoId) {
    const aluno = laBuscarAluno(alunoId);
    if (!aluno) return;

    const modal = document.getElementById('modal-ficha');
    const nome  = document.querySelector('.js-ficha-aluno');
    const casa  = document.querySelector('.js-ficha-conteudo');
    if (!modal || !casa) return;

    if (nome) nome.textContent = aluno.nome + ' — ' + aluno.matricula;

    const treinos = Array.isArray(aluno.treinos) ? aluno.treinos : [];

    casa.innerHTML = treinos.map(function (t, ti) {
      const exercicios = t.exercicios.map(function (ex, ei) {
        const series = ex.series.map(function (s, si) {
          return '<div class="linha-serie">' +
                   '<input class="inp-mini" data-t="' + ti + '" data-e="' + ei + '" data-s="' + si + '" data-campo="reps" value="' + laEscapar(s.reps) + '" placeholder="reps">' +
                   '<span>×</span>' +
                   '<input class="inp-mini" data-t="' + ti + '" data-e="' + ei + '" data-s="' + si + '" data-campo="peso" value="' + laEscapar(s.peso) + '" placeholder="peso">' +
                   '<button class="btn-mini perigo js-tirar-serie" data-t="' + ti + '" data-e="' + ei + '" data-s="' + si + '">−</button>' +
                 '</div>';
        }).join('');

        return '<div class="bloco-exercicio">' +
                 '<div class="linha-exercicio">' +
                   '<input class="inp-nome" data-t="' + ti + '" data-e="' + ei + '" data-campo="nome" value="' + laEscapar(ex.nome) + '" placeholder="Nome do exercício">' +
                   '<input class="inp-mini" data-t="' + ti + '" data-e="' + ei + '" data-campo="descanso" value="' + laEscapar(ex.descanso) + '" placeholder="descanso">' +
                   '<button class="btn-mini perigo js-tirar-exercicio" data-t="' + ti + '" data-e="' + ei + '">Remover</button>' +
                 '</div>' + series +
                 '<button class="btn-mini js-mais-serie" data-t="' + ti + '" data-e="' + ei + '">+ série</button>' +
               '</div>';
      }).join('');

      return '<h4 style="margin-bottom:10px;">Treino ' + laEscapar(t.letra) + ' — ' + laEscapar(t.nome) + '</h4>' + exercicios;
    }).join('') || '<p class="vazio">Sem treinos. Use "Exercício" para começar.</p>';

    modal.classList.add('active');

    const eu = this;

    casa.querySelectorAll('input[data-campo]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const t = +inp.getAttribute('data-t');
        const e = +inp.getAttribute('data-e');
        const s = inp.getAttribute('data-s');
        const campo = inp.getAttribute('data-campo');
        const atual = laBuscarAluno(alunoId);
        if (!atual) return;

        if (campo === 'nome') atual.treinos[t].exercicios[e].nome = inp.value;
        else if (campo === 'descanso') atual.treinos[t].exercicios[e].descanso = inp.value;
        else atual.treinos[t].exercicios[e].series[+s][campo] = inp.value;

        laAtualizarAluno(alunoId, { treinos: atual.treinos });
      });
    });

    casa.querySelectorAll('.js-mais-serie').forEach(function (b) {
      b.addEventListener('click', function () {
        const t = +b.getAttribute('data-t');
        const e = +b.getAttribute('data-e');
        const atual = laBuscarAluno(alunoId);
        if (!atual) return;
        atual.treinos[t].exercicios[e].series.push({ reps: '10', peso: '', feito: false });
        laAtualizarAluno(alunoId, { treinos: atual.treinos });
        eu.abrirFicha(alunoId);
      });
    });

    casa.querySelectorAll('.js-tirar-serie').forEach(function (b) {
      b.addEventListener('click', function () {
        const t = +b.getAttribute('data-t');
        const e = +b.getAttribute('data-e');
        const s = +b.getAttribute('data-s');
        const atual = laBuscarAluno(alunoId);
        if (!atual) return;
        atual.treinos[t].exercicios[e].series.splice(s, 1);
        laAtualizarAluno(alunoId, { treinos: atual.treinos });
        eu.abrirFicha(alunoId);
      });
    });

    casa.querySelectorAll('.js-tirar-exercicio').forEach(function (b) {
      b.addEventListener('click', function () {
        const t = +b.getAttribute('data-t');
        const e = +b.getAttribute('data-e');
        const atual = laBuscarAluno(alunoId);
        if (!atual) return;
        atual.treinos[t].exercicios.splice(e, 1);
        laAtualizarAluno(alunoId, { treinos: atual.treinos });
        eu.abrirFicha(alunoId);
      });
    });

    document.querySelectorAll('.js-fechar-ficha').forEach(function (b) {
      b.onclick = function () { modal.classList.remove('active'); eu.pintarAlunos(); };
    });

    const addEx = document.querySelector('.js-add-exercicio');
    if (addEx) addEx.onclick = function () {
      const atual = laBuscarAluno(alunoId);
      if (!atual) return;
      if (!atual.treinos.length) atual.treinos = laTreinoPadrao();
      atual.treinos[0].exercicios.push({ nome: 'Novo exercício', descanso: '60s', series: [{ reps: '12', peso: '', feito: false }] });
      laAtualizarAluno(alunoId, { treinos: atual.treinos });
      eu.abrirFicha(alunoId);
    };
  }
};

document.addEventListener('DOMContentLoaded', function () { LAAdmin.iniciar(); });
