/* ==========================================================================
   NAVEGACAO DO APP DO ALUNO — ligada direto, sem depender de ninguem
   Carregado por ultimo. Roda sempre que a pagina abre.

   Antes, o clique da barra so era ligado dentro do LAShell.ligarNav(), que
   so rodava dentro do LAAluno.iniciar(), chamado apenas quando o aluno ja
   estava logado no carregamento. Se um elo falhava, os botoes ficavam
   inertes e so a tela que nascia com "ativo" aparecia.

   Aqui o menu e ligado por conta propria e a troca de tela e feita na hora.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- quem e o aluno agora ---------- */
  function alunoAtual() {
    try {
      if (typeof laAlunoLogado === 'function') {
        var a = laAlunoLogado();
        if (a) return a;
      }
      if (typeof laBuscarAluno === 'function') {
        var id = sessionStorage.getItem('la_sessao_aluno') ||
                 sessionStorage.getItem('la_lembrar') ||
                 localStorage.getItem('la_lembrar');
        if (id) {
          try { id = JSON.parse(id).id || id; } catch (e) {}
          var b = laBuscarAluno(id);
          if (b) return b;
        }
      }
    } catch (e) {}
    return null;
  }

  /* ---------- mostra uma tela e esconde as outras ---------- */
  function abrirTela(qual) {
    document.querySelectorAll('.la-painel').forEach(function (s) {
      s.classList.remove('ativo');
    });
    document.querySelectorAll('.painel').forEach(function (s) {
      s.classList.remove('ativo');
    });

    var alvo = document.getElementById('painel-' + qual);
    if (alvo) {
      alvo.classList.add('ativo');
    } else {
      console.warn('Tela nao encontrada: painel-' + qual);
    }

    document.querySelectorAll('[data-painel]').forEach(function (b) {
      b.classList.toggle('ativo', b.getAttribute('data-painel') === qual);
    });

    var crumb = document.querySelector('.js-crumb');
    var botao = document.querySelector('[data-painel="' + qual + '"]');
    if (crumb && botao) {
      var texto = botao.textContent.replace(/\s+/g, ' ').trim();
      crumb.textContent = texto.replace(/[0-9]+$/, '').trim() || texto;
    }

    window.scrollTo(0, 0);
    return alvo;
  }

  /* ---------- redesenha a tela que abriu ---------- */
  function repintar(qual) {
    var aluno = alunoAtual();
    var id = aluno ? aluno.id : null;

    try {
      if (qual === 'painel') {
        if (typeof laPintarResumo === 'function' && id) laPintarResumo(id);
        if (typeof laPintarHistorico === 'function' && id) laPintarHistorico(id);
        if (typeof LAAluno !== 'undefined' && LAAluno.pintarInicio) LAAluno.pintarInicio();
      }
      if (qual === 'treino') {
        if (typeof LAAluno !== 'undefined' && LAAluno.pintarListaTreinos) LAAluno.pintarListaTreinos();
      }
      if (qual === 'esteira') {
        if (typeof LAEsteira !== 'undefined' && LAEsteira.pintarHistorico) LAEsteira.pintarHistorico();
      }
      if (qual === 'evolucao') {
        if (typeof LACalendario !== 'undefined' && LACalendario.pintar) LACalendario.pintar();
        if (typeof laDesenharGrafico === 'function' && id) laDesenharGrafico(id);
        if (typeof laPintarMedidas === 'function' && id) laPintarMedidas(id);
      }
      if (qual === 'loja') {
        if (typeof LALoja !== 'undefined' && LALoja.pintar) LALoja.pintar();
      }
      if (qual === 'carrinho') {
        if (typeof LALoja !== 'undefined') {
          if (LALoja.pintarCarrinho) LALoja.pintarCarrinho();
          if (LALoja.pintarPedidos) LALoja.pintarPedidos();
        }
      }
      if (qual === 'mensagens') {
        if (typeof LAAlunoExtra !== 'undefined' && LAAlunoExtra.pintarConversa) LAAlunoExtra.pintarConversa();
        if (typeof LAMural !== 'undefined' && LAMural.pintar) LAMural.pintar();
      }
      if (qual === 'mensalidade') {
        if (typeof LAAlunoExtra !== 'undefined' && LAAlunoExtra.pintarMensalidade) LAAlunoExtra.pintarMensalidade();
      }
      if (qual === 'perfil') {
        if (typeof LAPerfil !== 'undefined' && LAPerfil.pintar) LAPerfil.pintar();
        if (typeof laPintarPlano === 'function' && id) laPintarPlano(id);
        if (typeof laPintarAvisos === 'function') laPintarAvisos();
      }
    } catch (e) {
      console.warn('Repintar ' + qual + ':', e);
    }
  }

  /* ---------- liga os botoes ---------- */
  function ligarMenu() {
    var botoes = document.querySelectorAll('[data-painel]');
    if (!botoes.length) return;

    botoes.forEach(function (b) {
      /* se ja foi ligado por outro script, nao liga de novo */
      if (b.dataset.navLigado === '1') return;
      b.dataset.navLigado = '1';

      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        var qual = b.getAttribute('data-painel');
        abrirTela(qual);
        /* repinta depois de a tela aparecer, para medir o canvas certo */
        setTimeout(function () { repintar(qual); }, 30);
      });
    });
  }

  /* ---------- o app abre pelo login ou pela sessao ---------- */
  function manterMenuVivo() {
    /* quando o app do aluno e exibido, garante que o menu esta ligado */
    var app = document.getElementById('view-app-dash');
    if (!app) return;

    var observador = new MutationObserver(function () {
      if (app.classList.contains('active')) {
        ligarMenu();
      }
    });
    observador.observe(app, { attributes: true, attributeFilter: ['class'] });
  }

  function iniciar() {
    ligarMenu();
    manterMenuVivo();

    /* se algum botao for recriado depois, religa */
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-painel]') : null;
      if (b && b.dataset.navLigado !== '1') {
        ligarMenu();
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* exposto para o shell e para o site usarem a mesma troca de tela */
  window.LANav = { abrir: abrirTela, repintar: repintar, ligar: ligarMenu };
})();
