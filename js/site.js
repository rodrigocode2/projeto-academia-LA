/* ==========================================================================
   L.A FITNESS — comportamento do site
   Navegação entre telas, login do aluno, ficha de treino e medição de acessos.
   Depende de: js/dados.js e js/bot.js (carregados antes)
   ========================================================================== */

const LASite = {

  iniciar() {
    /* se veio de um "sair" ou "ver o site", abre direto na tela pedida */
    const params = new URLSearchParams(window.location.search);
    const destino = params.get('ir');
    this._destinoInicial = destino || null;
    laGarantirConteudo();
    laRegistrarVisita('inicio');

    this.pintarConteudo();
    this.ligarNavegacao();
    this.ligarLogin();
    this.ligarFicha();
    this.ligarMedicao();
    this.semear();

    LABot.iniciar();

    if (this._destinoInicial) {
      setTimeout(() => {
        this.irPara(this._destinoInicial);
        this._destinoInicial = null;
        /* limpa a URL para não repetir ao recarregar */
        try { history.replaceState(null, '', 'index.html'); } catch (e) {}
      }, 60);
    }

    /* se o aluno já tem sessão aberta nesta aba, entra direto */
    const aluno = laAlunoLogado();
    if (aluno) this.entrarApp(aluno);
  },

  /* ---------- conteúdo vindo da camada de dados ---------- */
  pintarConteudo() {
    const c = laGarantirConteudo();

    /* textos da abertura */
    const slogan = document.querySelector('.js-slogan');
    if (slogan && c.geral.slogan) slogan.innerHTML = c.geral.slogan;

    const endereco = document.querySelector('.js-endereco');
    if (endereco && c.geral.endereco) endereco.textContent = c.geral.endereco;

    /* modalidades */
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

    /* planos */
    const planos = document.querySelector('.js-planos');
    if (planos && Array.isArray(c.planos)) {
      planos.innerHTML = c.planos.map(function (p) {
        return '<div class="card-feature' + (p.destaque ? ' card-destaque' : '') + '">' +
                 (p.destaque ? '<span class="selo-destaque">Mais escolhido</span>' : '') +
                 '<h3 class="card-title">' + laEscapar(p.nome) + '</h3>' +
                 (p.preco ? '<p class="plano-preco">R$ ' + laEscapar(p.preco) + '</p>' : '<p class="plano-preco">Consulte</p>') +
                 '<p class="card-desc">' + laEscapar(p.descricao) + '</p>' +
                 '<button class="btn-secondary js-plano" data-plano="' + laEscapar(p.nome) + '" style="margin-top:14px;">' +
                   '<i class="fa-brands fa-whatsapp"></i> Quero este' +
                 '</button>' +
               '</div>';
      }).join('');

      planos.querySelectorAll('.js-plano').forEach(function (b) {
        b.addEventListener('click', function () {
          LAWhatsApp.abrir('Olá! Tenho interesse no plano ' + b.getAttribute('data-plano') + ' da L.A Fitness.');
        });
      });
    }

    /* horários e contato */
    const horarios = document.querySelector('.js-horarios');
    if (horarios && c.geral.horarios) horarios.textContent = c.geral.horarios;

    this.pintarSobre(c);
    this.pintarBlocos(c);
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


  /* ---------- Sobre: vem do painel (Conteúdo do site) ---------- */
  pintarSobre(c) {
    const so = (c && c.sobre) ? c.sobre : null;
    if (!so) return;

    const et = document.querySelector('.js-sobre-etiqueta');
    if (et && so.etiqueta) et.textContent = so.etiqueta;

    const olar = document.querySelector('.js-sobre-olar');
    if (olar && so.olar) olar.textContent = so.olar;

    const tit = document.querySelector('.js-sobre-titulo');
    if (tit) {
      tit.innerHTML = laEscapar(so.titulo || '') +
        (so.titulo2 ? '<br><span>' + laEscapar(so.titulo2) + '</span>' : '');
    }

    /* os parágrafos */
    const texto = document.querySelector('.js-sobre-texto');
    if (texto && Array.isArray(so.paragrafos) && so.paragrafos.length) {
      texto.innerHTML = so.paragrafos.map(function (t, i) {
        return '<p' + (i === 0 ? ' class="jr-capitular"' : '') + '>' + laEscapar(t) + '</p>';
      }).join('');
    }

    /* a faixa principal: foto e texto, no formato escolhido no painel */
    const faixa = document.querySelector('.js-sobre-faixa');
    if (faixa && so.faixa) {
      const f = so.faixa;
      const foto = function (src, leg) {
        if (!src) return '';
        return '<figure class="jr-foto">' +
                 '<img src="' + laEscapar(src) + '" alt="' + laEscapar(leg || '') + '" loading="lazy">' +
                 (leg ? '<figcaption>' + laEscapar(leg) + '</figcaption>' : '') +
               '</figure>';
      };
      const texto = function () {
        return '<div class="jr-texto js-sobre-texto">' +
                 (Array.isArray(so.paragrafos) ? so.paragrafos.map(function (t, k) {
                   return '<p' + (k === 0 ? ' class="jr-capitular"' : '') + '>' + laEscapar(t) + '</p>';
                 }).join('') : '') +
               '</div>';
      };

      let miolo = '';
      if (f.formato === 'so-foto') {
        miolo = foto(f.foto, f.legenda);
      } else if (f.formato === 'duas-fotos') {
        miolo = foto(f.foto, f.legenda) + foto(f.foto2, f.legenda2);
      } else if (f.formato === 'texto-foto') {
        miolo = texto() + foto(f.foto, f.legenda);
      } else {
        miolo = foto(f.foto, f.legenda) + texto();
      }
      faixa.className = 'jr-faixa js-sobre-faixa ' +
        (f.formato === 'so-foto' ? 'jr-so-foto' :
         f.formato === 'duas-fotos' ? 'jr-duas' :
         f.formato === 'texto-foto' ? 'jr-invertido' : '');
      faixa.innerHTML = miolo;
    }

    /* a grade de fotos */
    const grade = document.querySelector('.js-sobre-grade');
    if (grade && Array.isArray(so.fotos) && so.fotos.length) {
      const padrao = ['img/musculacao.jpg', 'img/halteres-estante.jpg',
                      'img/cordas-cintos.jpg', 'img/fachada-logo.jpg'];
      const classes = ['jr-bloco jr-g1', 'jr-bloco', 'jr-bloco', 'jr-bloco jr-g2'];
      grade.innerHTML = so.fotos.map(function (f, i) {
        const src = f.foto || padrao[i] || padrao[0];
        return '<figure class="' + (classes[i] || 'jr-bloco') + '">' +
                 '<img src="' + laEscapar(src) + '" alt="' + laEscapar(f.nome || '') + '" loading="lazy">' +
                 '<figcaption><b>' + laEscapar(f.nome || '') + '</b>' +
                   '<span>' + laEscapar(f.texto || '') + '</span></figcaption>' +
               '</figure>';
      }).join('');
    }
  },

  /* ---------- Blocos novos: o dono criou no painel ---------- */
  pintarBlocos(c) {
    const casa = document.querySelector('.js-blocos-extras');
    if (!casa) return;

    const lista = (c && Array.isArray(c.blocos)) ? c.blocos.filter(function (b) {
      return b && b.ativo !== false && (b.titulo || b.texto || b.foto);
    }) : [];

    if (!lista.length) { casa.innerHTML = ''; return; }

    const eu = this;
    casa.innerHTML = lista.map(function (b) {
      const formato = b.formato || 'foto-texto';
      const lado = b.lado || 'foto-esquerda';
      return eu.blocoHTML(b, formato, lado, (c.geral && c.geral.cidade) || '');
    }).join('');
  },

  /* monta UM bloco no formato escolhido */
  blocoHTML(b, formato, lado, cidade) {
    const foto = function (src, alt, leg) {
      if (!src) return '';
      return '<figure class="jr-foto">' +
               '<img src="' + laEscapar(src) + '" alt="' + laEscapar(alt || '') + '" loading="lazy">' +
               (leg ? '<figcaption>' + laEscapar(leg) + '</figcaption>' : '') +
             '</figure>';
    };

    const texto = function () {
      let t = '';
      if (b.titulo) t += '<h2 class="jr-titulo" style="font-size:clamp(2rem,5vw,3.4rem)">' +
        laEscapar(b.titulo) + '</h2>';
      if (b.texto) t += '<p class="jr-capitular">' + laEscapar(b.texto) + '</p>';
      return t ? '<div class="jr-texto js-sobre-texto">' + t + '</div>' : '';
    };

    let miolo = '';

    if (formato === 'so-foto') {
      /* uma foto so, largura cheia */
      miolo = '<div class="jr-faixa jr-so-foto">' +
                foto(b.foto, b.titulo, b.legenda) +
              '</div>';

    } else if (formato === 'duas-fotos') {
      /* duas fotos, lado a lado */
      miolo = '<div class="jr-faixa jr-duas">' +
                foto(b.foto, b.titulo, b.legenda) +
                foto(b.foto2, b.titulo, b.legenda2) +
              '</div>';

    } else if (formato === 'texto-foto') {
      miolo = '<div class="jr-faixa jr-invertido">' + texto() + foto(b.foto, b.titulo, b.legenda) + '</div>';

    } else {
      miolo = '<div class="jr-faixa">' + foto(b.foto, b.titulo, b.legenda) + texto() + '</div>';
    }

    const etiqueta = b.etiqueta || 'Novidade';

    return '<div class="jr-topo">' +
             '<span class="jr-etiqueta">' + laEscapar(etiqueta) + '</span>' +
             '<div class="jr-linha"></div>' +
             '<span class="jr-data">' + laEscapar(cidade) + '</span>' +
           '</div>' + miolo;
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
        if (aviso) {
          aviso.textContent = r.erro;
          aviso.classList.remove('hidden');
        }
        laRegistrarAcesso('login', 'clique', { alvo: 'login-falhou' });
        return;
      }

      if (aviso) aviso.classList.add('hidden');
      laRegistrarAcesso('login', 'clique', { alvo: 'login-ok' });
      LASite.entrarApp(r.aluno);
    });
  },

  entrarApp(aluno) {
    /* cabeçalho do app */
    const nome  = document.querySelector('.js-aluno-nome');
    const matr  = document.querySelector('.js-aluno-matricula');
    const av    = document.querySelector('.js-aluno-avatar');
    if (nome) nome.textContent = aluno.nome;
    if (matr) matr.textContent = 'Matrícula ' + aluno.matricula;
    if (av)   av.textContent = laIniciais(aluno.nome);

    const foto = document.querySelector('.js-aluno-foto');
    if (foto && aluno.foto) { foto.src = aluno.foto; foto.classList.remove('hidden'); }

    /* quem manda na área do aluno é o LAAluno (treino de hoje, agenda e
       lista de treinos). O pintarTreinos antigo só entra se ele não existir. */
    if (typeof LAAluno !== 'undefined' && LAAluno.iniciar) {
      LAAluno.iniciar();
    } else {
      this.pintarTreinos(aluno);
    }
    this.irPara('app-dash');
  },

  /* ---------- ficha de treino ---------- */
  pintarTreinos(aluno) {
    const casa = document.querySelector('.js-lista-treinos');
    if (!casa) return;
    /* o LAAluno cuida desta lista; sai fora para não sobrescrever */
    if (typeof LAAluno !== 'undefined' && LAAluno.iniciar) return;

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
                   t.exercicios.length + ' exercícios • ' + total + ' séries' +
                 '</p>' +
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
                   '<div class="set-check' + (s.feito ? ' done' : '') + '" ' +
                        'data-ex="' + i + '" data-serie="' + j + '">' +
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
    const sair = document.querySelector('.js-sair-aluno');
    if (sair) sair.addEventListener('click', function () {
      laSairAluno();
      /* toda saída volta para a TELA DE ABERTURA do site */
      window.location.href = 'index.html';
    });

    const qr = document.querySelector('.js-qrcode');
    if (qr) qr.addEventListener('click', function () {
      alert('QR Code de acesso da catraca — apresente na entrada da L.A Fitness.');
    });
  },

  /* ---------- medição de navegação e cliques ---------- */
  ligarMedicao() {
    window.addEventListener('scroll', function () {
      const telas = document.querySelectorAll('section[data-secao]');
      telas.forEach(function (s) {
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
  },

  semear() {
    /* aluno de exemplo, se ainda não houver nenhum cadastrado */
    laSemearExemplo();
  }
};

/* atalhos usados pelos onclick que já existiam no HTML */
function switchView(qual) { LASite.irPara(qual); }

document.addEventListener('DOMContentLoaded', function () { LASite.iniciar(); });
