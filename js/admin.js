/* ==========================================================================
   L.A FITNESS — painel de controle
   Acesso: comando /admin-academia-LA no chat do bot + senha
   Depende de: js/dados.js e js/treinos.js
   ========================================================================== */

const LAAdmin = {

  iniciar() {
    if (!laAdminLogado()) { window.location.href = 'index.html'; return; }
    laGarantirConteudo();
    this.ligarAbas();
    this.ligarSair();
    this.ligarAlunos();
    this.ligarTreinos();
    this.pintarTudo();
  },

  ligarAbas() {
    document.querySelectorAll('[data-aba-admin]').forEach(function (b) {
      b.addEventListener('click', function () {
        const qual = b.getAttribute('data-aba-admin');
        document.querySelectorAll('[data-aba-admin]').forEach(function (x) { x.classList.remove('ativo'); });
        document.querySelectorAll('.painel-aba').forEach(function (p) { p.classList.remove('ativa'); });
        b.classList.add('ativo');
        const alvo = document.getElementById('painel-' + qual);
        if (alvo) alvo.classList.add('ativo');
      });
    });
  },

  ligarSair() {
    const b = document.querySelector('.js-admin-sair');
    if (b) b.addEventListener('click', function () {
      if (!confirm('Sair do painel de controle?')) return;
      laSairAdmin();
      /* toda saída volta para a TELA DE ABERTURA do site */
      window.location.href = 'index.html';
    });
  },

  pintarTudo() {
    this.pintarMetricas();
    this.pintarAlunos();
    this.pintarExercicios();
    this.pintarFichas();
  },

  /* ======================================================================
     MÉTRICAS
     ====================================================================== */
  pintarMetricas() {
    const r = laResumo();
    const eu = this;

    const colocar = function (sel, valor) {
      const el = document.querySelector(sel);
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
    colocar('.js-m-alunos', laListarAlunos().length);
    colocar('.js-m-exercicios', laListarExercicios().length);
    colocar('.js-m-fichas', laListarFichas().length);

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

    /* onde clicaram — as secoes com mais cliques */
    const cli = document.querySelector('.js-m-cliques');
    if (cli) {
      const c = (r.porClique && typeof r.porClique === 'object') ? r.porClique : null;
      if (c) {
        cli.innerHTML = this.linhas(c);
      } else if (r.porSecao && typeof r.porSecao === 'object') {
        /* sem dados de clique ainda: mostra o que se sabe dos acessos */
        cli.innerHTML = '<p class="vazio">Ainda sem cliques registrados. ' +
                        'Os acessos aparecem abaixo.</p>' + this.linhas(r.porSecao);
      } else {
        cli.innerHTML = '<p class="vazio">Sem dados ainda.</p>';
      }
    }

    const ori = document.querySelector('.js-m-origem');
    if (ori) ori.innerHTML = this.linhas(r.porOrigem);
    const apa = document.querySelector('.js-m-aparelho');
    if (apa) apa.innerHTML = this.linhas(r.porAparelho);
    const nav = document.querySelector('.js-m-navegador');
    if (nav) nav.innerHTML = this.linhas(r.porNavegador);

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
    cv.width = w * px;
    cv.height = h * px;
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
    const eu = this;

    const form = document.getElementById('form-novo-aluno');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nome  = document.getElementById('aluno-nome').value.trim();
      const cpf   = document.getElementById('aluno-cpf').value.replace(/\D/g, '');
      const senha = document.getElementById('aluno-senha').value.trim();
      const erro  = document.getElementById('aluno-erro');

      if (nome.split(/\s+/).length < 2) { eu.avisar(erro, 'Informe o nome completo.'); return; }
      if (cpf.length !== 11) { eu.avisar(erro, 'O CPF precisa ter 11 números.'); return; }
      if (senha.length < 4) { eu.avisar(erro, 'A senha precisa ter pelo menos 4 caracteres.'); return; }
      if (laListarAlunos().some(function (a) { return a.cpf === cpf; })) {
        eu.avisar(erro, 'Já existe um aluno com esse CPF.'); return;
      }

      const aluno = laCriarAluno({
        nome: nome,
        cpf: cpf,
        senha: senha,
        telefone: document.getElementById('aluno-telefone').value.trim(),
        email: document.getElementById('aluno-email').value.trim(),
        plano: document.getElementById('aluno-plano').value,
        objetivo: document.getElementById('aluno-objetivo').value.trim()
      });

      if (erro) erro.classList.add('hidden');
      form.reset();
      eu.pintarAlunos();
      eu.avisarSucesso('Aluno cadastrado. Matrícula ' + aluno.matricula + ' — entregue o acesso a ele.');
    });

    const buscar = document.getElementById('busca-aluno');
    if (buscar) buscar.addEventListener('input', function () { eu.pintarAlunos(buscar.value); });

    const semear = document.querySelector('.js-semear');
    if (semear) semear.addEventListener('click', function () {
      const a = laSemearExemplo();
      eu.pintarAlunos();
      if (a) eu.avisarSucesso('Aluno de exemplo criado: ' + a.nome + ' (CPF 123.456.789-00, senha 123456).');
      else eu.avisarSucesso('Já existe aluno cadastrado — o exemplo só entra quando a lista está vazia.');
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
      const v = laFichaDoAluno(a.id);
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
                 '<span class="pilula ' + (a.ativo ? 'ok' : 'off') + '">' + (a.ativo ? 'Ativo' : 'Bloqueado') + '</span>' +
                 (v ? '<span class="pilula">' + laEscapar(v.ficha.nome) + '</span>' : '') +
               '</div>' +
               '<div class="da-direita">' +
                 '<button class="btn-mini js-ficha" data-id="' + a.id + '">Treino</button>' +
                 '<button class="btn-mini js-bloquear" data-id="' + a.id + '">' + (a.ativo ? 'Bloquear' : 'Liberar') + '</button>' +
                 '<button class="btn-mini perigo js-excluir" data-id="' + a.id + '">Excluir</button>' +
               '</div>' +
             '</div>';
    }).join('');

    const eu = this;

    casa.querySelectorAll('.js-bloquear').forEach(function (b) {
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
        if (!confirm('Excluir ' + a.nome + '?\n\nSai do sistema: treinos, conversas, cobranças e amizades. Não pode ser desfeito.')) return;
        /* apaga tudo que pertence ao aluno, nao so o cadastro */
        if (typeof laExcluirAlunoDeVez === 'function') {
          laExcluirAlunoDeVez(a.id);
        } else {
          laExcluirAluno(a.id);
        }
        eu.pintarAlunos();
      });
    });

    casa.querySelectorAll('.js-ficha').forEach(function (b) {
      b.addEventListener('click', function () { eu.atribuirFicha(b.getAttribute('data-id')); });
    });
  },

  /* ---------- atribuir ficha ao aluno ---------- */
  atribuirFicha(alunoId) {
    const aluno = laBuscarAluno(alunoId);
    if (!aluno) return;

    const modal = document.getElementById('modal-ficha');
    const nome  = document.querySelector('.js-ficha-aluno');
    const casa  = document.querySelector('.js-ficha-conteudo');
    if (!modal || !casa) return;

    if (nome) nome.textContent = aluno.nome + ' — ' + aluno.matricula;

    const atual = laFichaDoAluno(alunoId);
    const fichas = laListarFichas();

    casa.innerHTML =
      '<p class="nota-bloco">Escolha qual ficha este aluno vai treinar. Ele vê na hora, no celular.</p>' +
      '<div class="lista-fichas">' +
        fichas.map(function (f) {
          const escolhida = atual && atual.ficha.id === f.id;
          const origem = f.autoria === 'padrao' ? 'Treino pronto do sistema' :
                         f.autoria === 'dona' ? 'Montada pela academia' : 'Montada pelo professor';
          return '<div class="opcao-ficha' + (escolhida ? ' escolhida' : '') + '" data-ficha="' + f.id + '">' +
                   '<div>' +
                     '<b>' + laEscapar(f.nome) + '</b>' +
                     '<span>' + laEscapar(f.objetivo || f.nivel || '') + '</span>' +
                     '<small>' + origem + ' · ' + (f.treinos || []).length + ' treino(s)</small>' +
                   '</div>' +
                   (escolhida ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-regular fa-circle"></i>') +
                 '</div>';
        }).join('') +
      '</div>';

    modal.classList.add('active');

    const eu = this;
    casa.querySelectorAll('.opcao-ficha').forEach(function (o) {
      o.addEventListener('click', function () {
        const f = laBuscarFicha(o.getAttribute('data-ficha'));
        laVincularFicha(alunoId, o.getAttribute('data-ficha'), f ? f.autoria : 'academia');
        modal.classList.remove('active');
        eu.pintarAlunos();
        eu.avisarSucesso('Ficha ' + (f ? f.nome : '') + ' atribuída a ' + aluno.nome + '.');
      });
    });

    document.querySelectorAll('.js-fechar-ficha').forEach(function (b) {
      b.onclick = function () { modal.classList.remove('active'); eu.pintarAlunos(); };
    });
  },

  /* ======================================================================
     EXERCÍCIOS
     ====================================================================== */
  ligarTreinos() {
    const eu = this;

    const form = document.getElementById('form-novo-exercicio');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      const nome = document.getElementById('ex-nome').value.trim();
      if (!nome) return;

      laCriarExercicio({
        nome: nome,
        grupo: document.getElementById('ex-grupo').value,
        equipamento: document.getElementById('ex-equipamento').value.trim(),
        video: document.getElementById('ex-video').value.trim(),
        instrucoes: document.getElementById('ex-instrucoes').value.trim()
      });

      form.reset();
      eu.pintarExercicios();
      eu.avisarSucesso('Exercício "' + nome + '" cadastrado.');
    });

    const buscar = document.getElementById('busca-exercicio');
    if (buscar) buscar.addEventListener('input', function () { eu.pintarExercicios(buscar.value); });

    const formFicha = document.getElementById('form-nova-ficha');
    if (formFicha) formFicha.addEventListener('submit', function (e) {
      e.preventDefault();
      const nome = document.getElementById('ficha-nome').value.trim();
      if (!nome) return;
      laCriarFicha({
        nome: nome,
        objetivo: document.getElementById('ficha-objetivo').value.trim(),
        nivel: document.getElementById('ficha-nivel').value,
        autoria: 'dona',
        autor: 'Academia',
        treinos: [{ letra: 'A', nome: 'Treino A', exercicios: [] }]
      });
      formFicha.reset();
      eu.pintarFichas();
      eu.avisarSucesso('Ficha "' + nome + '" criada. Agora adicione os exercícios.');
    });
  },

  pintarExercicios(filtro) {
    const casa = document.querySelector('.js-tabela-exercicios');
    if (!casa) return;

    let lista = laListarExercicios();
    if (filtro) {
      const f = filtro.toLowerCase();
      lista = lista.filter(function (e) {
        return (e.nome || '').toLowerCase().includes(f) || (e.grupo || '').toLowerCase().includes(f);
      });
    }

    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Nenhum exercício cadastrado.</p>';
      return;
    }

    casa.innerHTML = lista.map(function (ex) {
      const v = laVideoInfo(ex.video);
      return '<div class="linha-exercicio-admin">' +
               '<div class="da-esquerda">' +
                 '<b>' + laEscapar(ex.nome) + '</b>' +
                 '<span>' + laEscapar(ex.grupo) + (ex.equipamento ? ' • ' + laEscapar(ex.equipamento) : '') + '</span>' +
               '</div>' +
               '<div class="do-meio">' +
                 (v.link
                   ? '<span class="pilula ok"><i class="fa-solid fa-video"></i> vídeo</span>'
                   : '<span class="pilula">sem vídeo</span>') +
               '</div>' +
               '<div class="da-direita">' +
                 '<button class="btn-mini perigo js-excluir-ex" data-id="' + ex.id + '">Excluir</button>' +
               '</div>' +
             '</div>';
    }).join('');

    const eu = this;
    casa.querySelectorAll('.js-excluir-ex').forEach(function (b) {
      b.addEventListener('click', function () {
        const ex = laBuscarExercicio(b.getAttribute('data-id'));
        if (!ex) return;
        if (!confirm('Excluir "' + ex.nome + '"?')) return;
        laExcluirExercicio(ex.id);
        eu.pintarExercicios();
      });
    });
  },

  /* ======================================================================
     FICHAS
     ====================================================================== */
  pintarFichas() {
    const casa = document.querySelector('.js-lista-fichas');
    if (!casa) return;

    const fichas = laListarFichas();
    if (!fichas.length) {
      casa.innerHTML = '<p class="vazio">Nenhuma ficha criada ainda.</p>';
      return;
    }

    casa.innerHTML = fichas.map(function (f) {
      const origem = f.autoria === 'padrao' ? 'Pronta do sistema' :
                     f.autoria === 'dona' ? 'Da academia' : 'Do professor';
      const totalEx = (f.treinos || []).reduce(function (a, t) {
        return a + (t.exercicios || []).length;
      }, 0);

      return '<div class="cartao-ficha-admin">' +
               '<div class="topo-cartao">' +
                 '<div>' +
                   '<b>' + laEscapar(f.nome) + '</b>' +
                   '<span>' + laEscapar(f.objetivo || f.nivel || '') + '</span>' +
                 '</div>' +
                 '<span class="pilula">' + origem + '</span>' +
               '</div>' +
               '<div class="divisoes">' +
                 (f.treinos || []).map(function (t) {
                   return '<span class="divisao">Treino ' + laEscapar(t.letra) +
                          ' · ' + (t.exercicios || []).length + ' ex</span>';
                 }).join('') +
                 '<span class="divisao total">' + totalEx + ' exercícios no total</span>' +
               '</div>' +
               '<button class="btn-mini js-usar-ficha" data-id="' + f.id + '">Usar com um aluno</button>' +
             '</div>';
    }).join('');

    const eu = this;
    casa.querySelectorAll('.js-usar-ficha').forEach(function (b) {
      b.addEventListener('click', function () {
        eu.avisarSucesso('Vá em "Alunos", clique em "Treino" no aluno e escolha esta ficha.');
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', function () { LAAdmin.iniciar(); });
