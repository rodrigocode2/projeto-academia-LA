/* ==========================================================================
   PAINEL — CATRACA (validar entrada, abrir e fechar)
   ========================================================================== */

(function () {
  'use strict';

  function q(s) { return document.querySelector(s); }
  function porId(id) { return document.getElementById(id); }

  function avisar(txt, cor) {
    var a = q('.js-aviso-cat');
    if (!a) return;
    a.textContent = txt;
    a.style.color = cor || 'var(--la-accent-green)';
    a.classList.remove('hidden');
    setTimeout(function () { a.classList.add('hidden'); }, 4500);
  }

  function pintarResumo() {
    var r = (typeof laResumoCatraca === 'function') ? laResumoCatraca() : null;
    if (!r) return;
    var set = function (sel, v) { var e = q(sel); if (e) e.textContent = v; };
    set('.js-cat-hoje', r.hoje);
    set('.js-cat-dentro', r.dentroAgora);
    set('.js-cat-pico', r.picoHora == null ? '—' : String(r.picoHora).padStart(2, '0') + 'h');
  }

  function pintarSelo() {
    var aberta = (typeof laCatracaAberta === 'function') ? laCatracaAberta() : true;
    var selo = q('.js-cat-selo');
    if (selo) {
      selo.textContent = aberta ? 'Aberta' : 'Fechada';
      selo.style.color = aberta ? 'var(--la-accent-green)' : 'var(--la-red)';
      selo.style.borderColor = aberta ? 'var(--la-accent-green)' : 'var(--la-red)';
    }
  }

  function pintarLista() {
    var casa = q('.js-cat-lista');
    if (!casa) return;

    var lista = [];
    try { lista = laLerAcessos(); } catch (e) { lista = []; }
    lista = lista.slice().reverse().slice(0, 20);

    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Nenhuma entrada registrada ainda.</p>';
      return;
    }

    casa.innerHTML = lista.map(function (a) {
      var d = new Date(a.quando);
      return '<div class="linha-metrica">' +
               '<span>' + laEscapar(a.aluno || 'Aluno') + '</span>' +
               '<span>' + d.toLocaleDateString('pt-BR') + '</span>' +
               '<b>' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</b>' +
             '</div>';
    }).join('');
  }

  function validar() {
    var campo = porId('cat-codigo');
    var casa = q('.js-cat-resultado');
    if (!campo || !casa) return;

    var r = (typeof laValidarEntrada === 'function')
      ? laValidarEntrada(campo.value)
      : { ok: false, motivo: 'Controle de acesso indisponível.' };

    casa.innerHTML =
      '<div class="resultado-catraca ' + (r.ok ? 'liberado' : 'barrado') + '">' +
        '<i class="fa-solid ' + (r.ok ? 'fa-circle-check' : 'fa-circle-xmark') + '"></i>' +
        '<div><b>' + laEscapar(r.motivo) + '</b>' +
          (r.ok
            ? '<span>' + r.entradasHoje + ' entrada(s) hoje. Bom treino!</span>'
            : '<span>Encaminhe o aluno à recepção.</span>') +
        '</div>' +
      '</div>';

    campo.value = '';
    campo.focus();
    pintarResumo();
    pintarLista();
  }

  function ligar() {
    var b = porId('cat-validar');
    if (b && !b._ligado) { b._ligado = true; b.addEventListener('click', validar); }

    var campo = porId('cat-codigo');
    if (campo && !campo._ligado) {
      campo._ligado = true;
      campo.addEventListener('keypress', function (e) { if (e.key === 'Enter') validar(); });
    }

    var abrir = porId('cat-abrir');
    if (abrir && !abrir._ligado) {
      abrir._ligado = true;
      abrir.addEventListener('click', function () {
        laAbrirFecharCatraca(true);
        avisar('Catraca aberta. Os alunos podem entrar.');
        pintarSelo();
      });
    }

    var fechar = porId('cat-fechar');
    if (fechar && !fechar._ligado) {
      fechar._ligado = true;
      fechar.addEventListener('click', function () {
        laAbrirFecharCatraca(false);
        avisar('Catraca fechada. Ninguém entra sem liberação.', '#ffb020');
        pintarSelo();
      });
    }

    pintarResumo();
    pintarSelo();
    pintarLista();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-aba-admin="catraca"]') : null;
    if (b) setTimeout(ligar, 40);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }

  window.LACatraca = { pintar: ligar };
})();
