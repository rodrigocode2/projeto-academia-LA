/* ==========================================================================
   L.A FITNESS — EMOJI, CARINHAS E FIGURINHAS
   Um seletor unico, usado em todos os campos de conversa:
   grupo da academia, particular entre alunos, recepcao e o painel.

   O seletor escreve direto no campo escolhido (data-alvo).
   ========================================================================== */

(function () {
  'use strict';

  /* ---- carinhas (emoji) ---- */
  var CARINHAS = (
    '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😗 😋 😛 🤪 ' +
    '🤗 🤔 🤨 😐 😑 😴 🤤 😪 😷 🤒 🥵 🥶 😵 🤯 😎 🤓 🧐 😕 🙁 ' +
    '😢 😭 😤 😠 😡 🤬 💪 🙏 👏 👊 ✊ 🤝 👍 👎 ✌️ 🤙 🖐️ 👋 ' +
    '🔥 💥 ⚡ ✨ ⭐ 🏆 🥇 🎯 💯 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ' +
    '🏋️ 🏃 🚴 🧘 🥊 ⚽ 🏀 🎵 🎶 📣 📌 ⏰ 📅 ✅ ❌ ⚠️ 🎉 🍀'
  ).split(' ');

  /* ---- figurinhas (desenhos maiores, feitos de emoji combinado) ---- */
  var FIGURINHAS = [
    { nome: 'Bora treinar',   txt: '💪🔥 BORA TREINAR!' },
    { nome: 'Bom treino',     txt: '🏋️😤 BOM TREINO!' },
    { nome: 'Foco',           txt: '🎯 FOCO NO OBJETIVO!' },
    { nome: 'Massa',          txt: '🏆💯 MASSA DEMAIS!' },
    { nome: 'Tô chegando',    txt: '🏃💨 TÔ CHEGANDO!' },
    { nome: 'Descanso',       txt: '😴💤 HORA DE DESCANSAR' },
    { nome: 'Bora cardio',    txt: '🏃‍♂️❤️ BORA DE CARDIO!' },
    { nome: 'Direito',        txt: '💪✅ TÁ DIREITO!' },
    { nome: 'Falhou',         txt: '😅❌ DEU RUIM' },
    { nome: 'Festa',          txt: '🎉🙌 QUE ALEGRIA!' },
    { nome: 'Fome',           txt: '🍽️😋 BATEU A FOME' },
    { nome: 'Bom dia',        txt: '☀️😀 BOM DIA, PESSOAL!' }
  ];

  var REGISTRO = 'la_emojis_usados';

  /* guardar os ultimos usados, para ficarem em primeiro */
  function ultimos() {
    try {
      var b = localStorage.getItem(REGISTRO);
      var l = b ? JSON.parse(b) : [];
      return Array.isArray(l) ? l.slice(0, 12) : [];
    } catch (e) { return []; }
  }
  function guardar(e) {
    try {
      var l = ultimos().filter(function (x) { return x !== e; });
      l.unshift(e);
      localStorage.setItem(REGISTRO, JSON.stringify(l.slice(0, 12)));
    } catch (err) {}
  }

  function el(id) { return document.getElementById(id); }

  /* escreve no campo escolhido, no lugar do cursor */
  function inserir(campo, texto) {
    if (!campo) return;
    var pos = (typeof campo.selectionStart === 'number') ? campo.selectionStart : campo.value.length;
    var antes = campo.value.slice(0, pos);
    var depois = campo.value.slice(pos);
    campo.value = antes + texto + depois;
    var novaPos = pos + texto.length;
    try { campo.setSelectionRange(novaPos, novaPos); } catch (e) {}
    campo.focus();
  }

  /* ---- monta o painel de um campo ---- */
  function montar(painel) {
    var alvo = painel.getAttribute('data-dono');
    var campo = el(alvo);

    var recentes = ultimos();
    var gradeRecentes = recentes.length
      ? '<div class="emoji-secao">Usados agora</div><div class="emoji-grade">' +
          recentes.map(function (e) {
            return '<button type="button" class="emoji-item js-emoji" data-t="' + e + '">' + e + '</button>';
          }).join('') + '</div>'
      : '';

    painel.innerHTML =
      '<div class="emoji-abas">' +
        '<button type="button" class="emoji-aba ativa js-emoji-aba" data-a="carinhas">😀 Carinhas</button>' +
        '<button type="button" class="emoji-aba js-emoji-aba" data-a="figurinhas">🏆 Figurinhas</button>' +
      '</div>' +
      '<div class="js-emoji-corpo">' +
        gradeRecentes +
        '<div class="emoji-secao">Carinhas</div>' +
        '<div class="emoji-grade">' +
          CARINHAS.map(function (e) {
            return '<button type="button" class="emoji-item js-emoji" data-t="' + e + '">' + e + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="js-emoji-corpo-fig hidden">' +
        '<div class="emoji-secao">Figurinhas da academia</div>' +
        '<div class="figurinha-grade">' +
          FIGURINHAS.map(function (f) {
            return '<button type="button" class="figurinha-item js-emoji" data-t="' + f.txt + '">' +
                     '<span>' + f.txt + '</span>' +
                   '</button>';
          }).join('') +
        '</div>' +
      '</div>';

    painel.querySelectorAll('.js-emoji').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        var t = b.getAttribute('data-t');
        inserir(campo, (t.length <= 3 ? t : t) + (t.length <= 3 ? '' : ' '));
        if (t.length <= 3) guardar(t);
        var rec = painel.querySelector('.emoji-secao');
        /* fecha depois de escolher */
        painel.classList.add('hidden');
      });
    });

    painel.querySelectorAll('.js-emoji-aba').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        painel.querySelectorAll('.js-emoji-aba').forEach(function (x) { x.classList.remove('ativa'); });
        b.classList.add('ativa');
        var qual = b.getAttribute('data-a');
        var c1 = painel.querySelector('.js-emoji-corpo');
        var c2 = painel.querySelector('.js-emoji-corpo-fig');
        if (c1) c1.classList.toggle('hidden', qual !== 'carinhas');
        if (c2) c2.classList.toggle('hidden', qual !== 'figurinhas');
      });
    });
  }

  /* ---- abre e fecha ---- */
  function ligar() {
    document.querySelectorAll('.js-emoji-btn').forEach(function (b) {
      if (b._ligado) return;
      b._ligado = true;
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        var alvo = b.getAttribute('data-alvo');
        /* fecha os outros */
        document.querySelectorAll('.js-emoji-painel').forEach(function (p) {
          if (p.getAttribute('data-dono') !== alvo) p.classList.add('hidden');
        });
        var painel = document.querySelector('.js-emoji-painel[data-dono="' + alvo + '"]');
        if (!painel) return;
        if (!painel._montado) { montar(painel); painel._montado = true; }
        painel.classList.toggle('hidden');
      });
    });

    /* clicar fora fecha */
    document.addEventListener('click', function (ev) {
      var dentro = ev.target.closest ? ev.target.closest('.js-emoji-painel, .js-emoji-btn') : null;
      if (dentro) return;
      document.querySelectorAll('.js-emoji-painel').forEach(function (p) { p.classList.add('hidden'); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }

  /* religar quando uma tela nova abre (o chat e montado depois) */
  document.addEventListener('click', function () {
    setTimeout(ligar, 60);
  }, true);

  window.LAEmojis = { ligar: ligar, inserir: inserir };
})();
