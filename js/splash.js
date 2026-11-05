/* ==========================================================================
   L.A FITNESS — tela de abertura
   NAO SAI SOZINHA. Fica parada ate a pessoa clicar, teclar ou tocar.

   A saida automatica foi removida de proposito: a abertura e a assinatura
   visual do site e o dono pediu que ela espere o visitante.

   Use index.html?abertura=30 para voltar a ter saida automatica de 30s
   quando for apresentar.
   ========================================================================== */

(function () {
  'use strict';

  /* desligado por padrao: 0 = sem cronometro */
  const PADRAO = 0;
  const MINIMO = 1;
  const MAXIMO = 300;

  function tempoPedido() {
    try {
      const v = new URLSearchParams(window.location.search).get('abertura');
      if (!v) return PADRAO;
      const s = parseFloat(v);
      if (isNaN(s)) return PADRAO;
      return Math.min(Math.max(s, MINIMO), MAXIMO) * 1000;
    } catch (e) {
      return PADRAO;
    }
  }

  function sair() {
    const t = document.getElementById('splash-la');
    if (!t || t.classList.contains('saindo') || t.classList.contains('saiu')) return;
    t.style.pointerEvents = 'none';
    t.classList.add('saindo');
    document.body.classList.remove('travado');
    setTimeout(function () {
      t.classList.add('saiu');
      t.classList.add('escondido');
      if (t.parentNode) t.parentNode.removeChild(t);
      const tela = document.getElementById('view-splash');
      if (tela) tela.classList.add('active');
    }, 480);
  }

  function iniciar() {
    const t = document.getElementById('splash-la');
    if (!t) return;

    document.body.classList.add('travado');
    t.style.display = 'flex';

    /* cronometro: so liga se ?abertura=NN vier na URL */
    const tempo = tempoPedido();
    if (tempo > 0) setTimeout(sair, tempo);

    ['click', 'keydown', 'touchstart'].forEach(function (ev) {
      document.addEventListener(ev, function () { sair(); }, {
        once: true, passive: true
      });
    });

    if (window.location.search.indexOf('abertura=') !== -1) {
      try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
