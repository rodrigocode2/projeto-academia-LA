/* ==========================================================================
   L.A FITNESS — comportamento do site
   Navegação, login do aluno, ficha de treino e medição de acessos.
   Depende de: js/dados.js e js/bot.js (carregados antes)
   ========================================================================== */

const LASite = {

  iniciar() {
    laGarantirConteudo();
    laRegistrarVisita('inicio');

    this.pintarConteudo();
    this.ligarNavegacao();
    this.ligarLogin();
    this.ligarFicha();
    this.ligarMedicao();
    laSemearExemplo();
    LABot.iniciar();

    const aluno = laAlunoLogado();
    if (aluno) this.entrarApp(aluno);
  },

  /* ---------- conteúdo vindo da camada de dados ---------- */
  pintarConteudo() {
    const c = laGarantirConteudo();

    const slogan = document.querySelector('.js-slogan');
    if (slogan && c.geral.slogan) slogan.innerHTML = c.geral.slogan;

    const endereco = document.querySelector('.js-endereco');
    if (endereco && c.geral.endereco) endereco.textContent = c.geral.endereco;

    const horarios = document.querySelector('.js-horarios');
    if (horarios && c.geral.horarios) horarios.textContent = c.geral.horarios;

    const grade = document.querySelector('.js-modalidades');
    if (grade && Array.isArray(c.modalidades)) {
      grade.innerHTML = c.modalidades.map(function (m) {
        return '<div class="card-feature">' +
                 '<i class="fa-solid ' + laEscapar(m.icone) + ' card-icon"></i>' +
                 '<h3 class="card-title">' + laEscapar(m.titulo) + '</h3>' +
                 '<p class="card-desc">' + laEscapar(m.texto) + '</p>' +
               '</div>';
      }).join('');
    }

    const planos = document.querySelector('.js-planos');
    if (planos && Array.isArray(c.planos)) {
      planos.innerHTML = c.planos.map(function (p) {
        return '<div class="card-feature' + (p.destaque ? ' card-destaque' : '') + '">' +
                 (p.destaque ? '<span class="selo-destaque">Mais escolhido</span>' : '') +
                 '<h3 class="card-title">' + laEscapar(p.nome) + '</h3>' +
                 (p.preco ? '<p class="plano-preco">R$ ' + laEscapar(p.preco) + '</p>' : '<p class="plano-preco">Consulte</p>') +
                 '<p class="card-desc">' + laEscapar(p.descricao) + '</p>' +
                 '<button class="btn-secondary js-plano" data-plano="' + laEscapar(p.nome) + '" style="margin-top:14px;">' +
                   '<i class="fa-brands fa-whatsapp"></i> Quero este</button>' +
               '</div>';
      }).join('');

      planos.querySelectorAll('.js-plano').forEach(function (b) {
        b.addEventListener('click', function () {
          LAWhatsApp.abrir('Olá! Tenho interesse no plano ' + b.getAttribute('data-plano') + ' da L.A Fitness.');
        });
      });
    }
  },

  /* ---------- troca de telas ---------- */
  ligarNavegacao() {
    document.querySelectorAll('[data-view]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        LASite.irPara(el.getAttribute('data-view'));
      });
    });
  },

  irPara(qual) {
    document.querySelectorAll('.view-screen').forEach(function (s) { s.classList.remove('active'); });
    document.querySelectorAll('.ux-btn').forEach(function (b) { b.classList.remove('active'); });

    const alvo = document.getElementById('view-' + qual);
    if (alvo) alvo.classList.add('active');

    const ordem = ['splash', 'landing', 'planos', 'login', 'app-dash', 'app-workout'];
    const i = ordem.indexOf(qual);
    const botoes = document.querySelectorAll('.ux-btn');
    if (i !== -1 && botoes[i]) botoes[i].classList.add('active');

    laRegistrarAcesso(qual, 'visualizacao');
    window.scrollTo(0, 0);
  },

  /* ---------- login do aluno ---------- */
  ligarLogin() {
    const form = document.getElementById('form-login-aluno');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const usuario = document.getElementById('login-usuario').value;
      const senha   = document.getElementById('login-senha').value;
      const aviso   = document.getElementById('login-aviso');

      const r = laAutenticar(usuario, senha);

      if (!r.ok) {
        if (aviso) { aviso.textContent = r.erro; aviso.classList.remove('hidden'); }
        laRegistrarAcesso('login', 'clique', { alvo: 'login-falhou' });
        return;
      }

      if (aviso) aviso.classList.add('hidden');
      laRegistrarAcesso('login', 'clique', { alvo: 'login-ok' });
      LASite.entrarApp(r.aluno);
    });
  },

  entrarApp(aluno) {
    const nome = document.querySelector('.js-aluno-nome');
    const matr = document.querySelector('.js-aluno-matricula');
    const av   = document.querySelector('.js-aluno-avatar');
    if (nome) nome.textContent = aluno.nome;
    if (matr) matr.textContent = 'Matrícula ' + aluno.matricula;
    if (av)   av.textContent = laIniciais(aluno.nome);

    this.pintarTreinos(aluno);
    this.irPara('app-dash');
  },

  /* ---------- ficha de treino ---------- */
  pintarTreinos(aluno) {
    const casa = document.querySelector('.js-lista-treinos');
    if (!casa) return;

    const treinos = Array.isArray(aluno.treinos) ? aluno.treinos : [];
    if (!treinos.length) {
      casa.innerHTML = '<p class="vazio">Sua ficha ainda não foi montada. Fale com um professor da L.A.</p>';
      return;
    }

    casa.innerHTML = treinos.map(function (t) {
      const total = t.exercicios.reduce(function (a, e) { return a + e.series.length; }, 0);
      return '<div class="workout-card-select" data-treino="' + t.id + '">' +
               '<div>' +
                 '<span class="etiqueta-treino">TREINO ' + laEscapar(t.letra) + '</span>' +
                 '<h4 style="margin-top:5px; font-size:1rem;">' + laEscapar(t.nome) + '</h4>' +
                 '<p style="font-size:0.8rem; color:var(--la-text-muted);">' +
                   t.exercicios.length + ' exercícios • ' + total + ' séries</p>' +
               '</div>' +
               '<i class="fa-solid fa-chevron-right" style="color:var(--la-red)"></i>' +
             '</div>';
    }).join('');

    casa.querySelectorAll('[data-treino]').forEach(function (card) {
      card.addEventListener('click', function () {
        LASite.abrirTreino(aluno, card.getAttribute('data-treino'));
      });
    });
  },

  abrirTreino(aluno, treinoId) {
    const treino = (aluno.treinos || []).find(function (t) { return t.id === treinoId; });
    if (!treino) return;

    const titulo = document.querySelector('.js-treino-titulo');
    if (titulo) titulo.textContent = 'Treino ' + treino.letra + ' — ' + treino.nome;

    const casa = document.querySelector('.js-treino-corpo');
    if (casa) {
      casa.innerHTML = treino.exercicios.map(function (ex, i) {
        const series = ex.series.map(function (s, j) {
          return '<div class="set-row">' +
                   '<span>Série ' + (j + 1) + ' • ' + laEscapar(s.reps) + ' Reps • ' + laEscapar(s.peso) + '</span>' +
                   '<div class="set-check' + (s.feito ? ' done' : '') + '" data-ex="' + i + '" data-serie="' + j + '">' +
                     '<i class="fa-solid fa-check"></i>' +
                   '</div>' +
                 '</div>';
        }).join('');

        return '<div class="exercise-item">' +
                 '<div class="exercise-header">' +
                   '<h5 style="font-size:0.95rem;">' + (i + 1) + '. ' + laEscapar(ex.nome) + '</h5>' +
                   '<span style="font-size:0.75rem; color:var(--la-text-muted);">Descanso: ' + laEscapar(ex.descanso) + '</span>' +
                 '</div>' + series +
               '</div>';
      }).join('');

      casa.querySelectorAll('.set-check').forEach(function (el) {
        el.addEventListener('click', function () {
          const ex = parseInt(el.getAttribute('data-ex'), 10);
          const se = parseInt(el.getAttribute('data-serie'), 10);
          const agora = laAlternarSerie(aluno.id, treino.id, ex, se);
          el.classList.toggle('done', !!agora);
          LASite.atualizarProgresso(aluno, treino);
        });
      });
    }

    this.atualizarProgresso(aluno, treino);
    this.irPara('app-workout');
  },

  atualizarProgresso(aluno, treino) {
    const atual = laBuscarAluno(aluno.id);
    const t = ((atual && atual.treinos) || []).find(function (x) { return x.id === treino.id; }) || treino;
    const p = laProgressoTreino(t);

    const rotulo = document.querySelector('.js-treino-progresso');
    if (rotulo) rotulo.textContent = p.feitas + '/' + p.total + ' concluído';

    const barra = document.querySelector('.js-treino-barra');
    if (barra) barra.style.width = p.pct + '%';
  },

  ligarFicha() {
    document.querySelectorAll('.js-sair-aluno').forEach(function (sair) {
      sair.addEventListener('click', function () {
        laSairAluno();
        LASite.irPara('splash');
      });
    });

    document.querySelectorAll('.js-qrcode').forEach(function (qr) {
      qr.addEventListener('click', function () {
        alert('QR Code de acesso da catraca — apresente na entrada da L.A Fitness.');
      });
    });
  },

  /* ---------- medição de navegação ---------- */
  ligarMedicao() {
    window.addEventListener('scroll', function () {
      document.querySelectorAll('section[data-secao]').forEach(function (s) {
        const r = s.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.6 && r.bottom > 0) {
          const nome = s.getAttribute('data-secao');
          if (LASite._ultima !== nome) {
            LASite._ultima = nome;
            laRegistrarAcesso(nome, 'visualizacao');
          }
        }
      });
    });

    document.querySelectorAll('[data-medir]').forEach(function (el) {
      el.addEventListener('click', function () {
        laRegistrarAcesso('clique', 'clique', { alvo: el.getAttribute('data-medir') });
      });
    });
  }
};

/* atalho usado pelos onclick do HTML */
function switchView(qual) { LASite.irPara(qual); }

document.addEventListener('DOMContentLoaded', function () { LASite.iniciar(); });
