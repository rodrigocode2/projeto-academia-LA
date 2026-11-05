/* ==========================================================================
   NAVEGACAO DO PAINEL — ligada direto, sem depender de ninguem
   Carregado por ultimo. Roda sempre que a pagina do painel abre.

   Antes, cada aba era ligada por um bloco de script diferente e nenhuma
   redesenhava o conteudo ao abrir. A Visao geral usa <canvas>, que perde o
   desenho quando a tela e escondida — por isso nao voltava.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- mostra uma aba ---------- */
  function abrirAba(qual) {
    document.querySelectorAll('.painel-aba').forEach(function (p) {
      p.classList.remove('ativa');
    });
    document.querySelectorAll('[data-aba-admin]').forEach(function (b) {
      b.classList.toggle('ativo', b.getAttribute('data-aba-admin') === qual);
    });

    var alvo = document.getElementById('painel-' + qual);
    if (alvo) {
      alvo.classList.add('ativa');
    } else {
      console.warn('Aba do painel nao encontrada: painel-' + qual);
    }
    return alvo;
  }

  /* ---------- desenha o conteudo da aba que abriu ---------- */
  function pintarAba(qual) {
    var feito = [];

    function tenta(nome, fn) {
      try { fn(); feito.push(nome); }
      catch (e) { console.warn('Painel / ' + nome + ':', e); }
    }

    /* cada aba chama o seu pintor, se ele existir */
    if (qual === 'visao') {
      tenta('metricas', function () {
        if (typeof LAAdmin !== 'undefined' && LAAdmin.pintarMetricas) LAAdmin.pintarMetricas();
      });
    }

    if (qual === 'alunos') {
      tenta('alunos', function () {
        if (typeof LAAdmin !== 'undefined' && LAAdmin.pintarAlunos) LAAdmin.pintarAlunos();
      });
    }

    if (qual === 'treinos') {
      tenta('exercicios', function () {
        if (typeof LAAdmin !== 'undefined' && LAAdmin.pintarExercicios) LAAdmin.pintarExercicios();
      });
      tenta('fichas', function () {
        if (typeof LAAdmin !== 'undefined' && LAAdmin.pintarFichas) LAAdmin.pintarFichas();
      });
    }

    if (qual === 'montar') {
      tenta('modelos', function () {
        if (typeof LAAdminModelos !== 'undefined') {
          LAAdminModelos.pintarMontagem();
          LAAdminModelos.pintarModelos();
          LAAdminModelos.pintarLiberar();
        }
      });
    }

    if (qual === 'produtos') {
      tenta('produtos', function () {
        if (window.LAProdutos && window.LAProdutos.pintar) window.LAProdutos.pintar();
      });
      tenta('vendas', function () {
        if (typeof LAAdminLoja !== 'undefined' && LAAdminLoja.pintarVendas) LAAdminLoja.pintarVendas();
      });
    }

    if (qual === 'loja') {
      tenta('loja', function () {
        if (typeof LAAdminLoja !== 'undefined' && LAAdminLoja.pintarProdutos) LAAdminLoja.pintarProdutos();
        else if (typeof window._admLoja === 'function') window._admLoja();
      });
    }

    if (qual === 'corridas') {
      tenta('corridas', function () {
        if (typeof window._admCorridas === 'function') window._admCorridas();
      });
    }

    if (qual === 'mensagens') {
      tenta('conversas', function () {
        if (typeof window._admConversas === 'function') { window._admConversas(); if (typeof window._admConversas2 === 'function') window._admConversas2(); }
      });
    }

    if (qual === 'pagamentos') {
      tenta('pagamentos', function () {
        if (typeof window._admPagamentos === 'function') window._admPagamentos();
      });
    }

    if (qual === 'midia') {
      tenta('midia', function () {
        if (typeof window._admFotos === 'function') window._admFotos();
        if (typeof window._admVideos === 'function') window._admVideos();
      });
    }

    if (qual === 'mural') {
      tenta('mural', function () {
        if (typeof LAAdminMural !== 'undefined' && LAAdminMural.pintar) LAAdminMural.pintar();
      });
    }

    if (qual === 'site') {
      tenta('site', function () {
        if (typeof window._admSite === 'function') window._admSite();
      });
    }

    return feito;
  }

  /* ---------- liga os botoes ---------- */
  function ligarAbas() {
    var botoes = document.querySelectorAll('[data-aba-admin]');
    if (!botoes.length) return 0;

    var ligados = 0;
    botoes.forEach(function (b) {
      if (b.dataset.abaLigada === '1') return;
      b.dataset.abaLigada = '1';
      ligados++;

      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        var qual = b.getAttribute('data-aba-admin');
        abrirAba(qual);
        /* espera a tela aparecer para o canvas medir certo */
        setTimeout(function () { pintarAba(qual); }, 30);
      });
    });
    return ligados;
  }

  function iniciar() {
    var n = ligarAbas();
    console.log('[painel] abas ligadas:', n);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* a primeira aba marcada como ativa tambem precisa ser desenhada */
  window.addEventListener('load', function () {
    setTimeout(function () {
      var ativa = document.querySelector('.painel-aba.ativa');
      if (ativa && ativa.id) {
        pintarAba(ativa.id.replace('painel-', ''));
      }
    }, 60);
  });

  /* exposto para os outros scripts usarem a mesma troca de aba */
  window.LAAdminNav = { abrir: abrirAba, pintar: pintarAba, ligar: ligarAbas };
})();
