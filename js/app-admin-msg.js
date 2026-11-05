/* ==========================================================================
   MENSAGENS E MURAL NO PAINEL — ligados direto
   Carregado por ultimo. Nao depende dos blocos antigos do admin.html.

   Antes, o clique na aba Mensagens chamava uma funcao presa dentro de outro
   bloco de script, e a tela ficava sempre vazia.
   ========================================================================== */

(function () {
  'use strict';

  var alunoAberto = null;

  function q(s) { return document.querySelector(s); }
  function porId(id) { return document.getElementById(id); }

  /* ==================== MENSAGENS PARTICULARES ==================== */

  function pintarConversas() {
    var casa = q('.js-lista-conversas');
    if (!casa) return;

    var lista = (typeof laConversasComNovidade === 'function') ? laConversasComNovidade() : [];

    var badge = q('.js-ad-badge');
    var total = lista.reduce(function (s, c) { return s + (c.naoLidas || 0); }, 0);
    if (badge) {
      badge.textContent = total;
      badge.classList.toggle('hidden', total === 0);
    }

    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Nenhuma conversa ainda. ' +
        'Quando um aluno mandar mensagem pelo site, ela aparece aqui.</p>';
      return;
    }

    casa.innerHTML = lista.map(function (c) {
      return '<button type="button" class="item-conversa js-abrir-conversa' +
               (alunoAberto === c.alunoId ? ' ativo' : '') + '" data-id="' + c.alunoId + '">' +
               '<div class="conv-topo">' +
                 '<b>' + laEscapar(c.aluno || 'Aluno') + '</b>' +
                 (c.naoLidas ? '<span class="pilula nao-lida">' + c.naoLidas + '</span>' : '') +
               '</div>' +
               '<span class="conv-trecho">' + laEscapar(String(c.ultimoTexto || '').slice(0, 70)) + '</span>' +
               '<span class="conv-hora">' + new Date(c.ultima).toLocaleString('pt-BR') + '</span>' +
             '</button>';
    }).join('');

    casa.querySelectorAll('.js-abrir-conversa').forEach(function (b) {
      b.addEventListener('click', function () {
        alunoAberto = b.getAttribute('data-id');
        if (typeof laMarcarLidasDoAlunoNoPainel === 'function') {
          laMarcarLidasDoAlunoNoPainel(alunoAberto);
        }
        pintarConversas();
        pintarConversaAberta();
      });
    });
  }

  function pintarConversaAberta() {
    var casa = q('.js-conversa-admin');
    var form = porId('form-resposta-admin');
    var nome = q('.js-conversa-nome');
    if (!casa) return;

    if (!alunoAberto) {
      casa.innerHTML = '<p class="vazio">Escolha uma conversa à esquerda.</p>';
      if (form) form.style.display = 'none';
      if (nome) nome.textContent = 'Selecione uma conversa';
      return;
    }

    var aluno = (typeof laBuscarAluno === 'function') ? laBuscarAluno(alunoAberto) : null;
    if (nome) nome.textContent = aluno ? aluno.nome : 'Aluno';
    if (form) form.style.display = 'flex';

    var msgs = (typeof laListarMensagens === 'function') ? laListarMensagens(alunoAberto) : [];
    if (!msgs.length) {
      casa.innerHTML = '<p class="vazio">Nenhuma mensagem nesta conversa.</p>';
      return;
    }

    casa.innerHTML = '<div class="conversa-corpo" id="conv-admin-corpo">' +
      msgs.map(function (m) {
        var doAluno = m.de === 'aluno';
        return '<div class="bolha ' + (doAluno ? 'bolha-academia' : 'bolha-aluno') + '">' +
                 '<div class="bolha-txt">' + laEscapar(m.texto) + '</div>' +
                 '<span class="bolha-hora">' + (doAluno ? 'Aluno' : 'Academia') + ' · ' +
                   new Date(m.quando).toLocaleString('pt-BR') + '</span>' +
               '</div>';
      }).join('') + '</div>';

    var corpo = porId('conv-admin-corpo');
    if (corpo) corpo.scrollTop = corpo.scrollHeight;
  }

  function responder() {
    var campo = porId('resposta-admin');
    if (!campo || !campo.value.trim() || !alunoAberto) return;
    if (typeof laResponderMensagem === 'function') {
      laResponderMensagem(alunoAberto, campo.value);
    }
    campo.value = '';
    pintarConversas();
    pintarConversaAberta();
  }

  /* ==================== SALA DE BATE-PAPO (MURAL) ==================== */

  function pintarMural() {
    var aberto = (typeof laMuralAberto === 'function') ? laMuralAberto() : true;

    var selo = q('.js-grupo-selo');
    if (selo) {
      selo.textContent = aberto ? 'Aberto' : 'Fechado';
      selo.style.color = aberto ? 'var(--la-accent-green)' : 'var(--la-red)';
      selo.style.borderColor = aberto ? 'var(--la-accent-green)' : 'var(--la-red)';
    }

    var casa = q('.js-grupo-admin');
    if (!casa) return;

    var lista = (typeof laLerMural === 'function') ? laLerMural() : [];
    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Ninguém escreveu na sala ainda. ' +
        'Quando o pessoal conversar, as mensagens aparecem aqui.</p>';
      return;
    }

    casa.innerHTML = lista.slice().reverse().map(function (p) {
      var da = p.de === 'academia';
      var iniciais = (p.autor || 'AL').split(' ').map(function (x) { return x[0]; })
        .slice(0, 2).join('').toUpperCase();
      return '<div class="post-mural' + (da ? ' da-academia' : '') + '">' +
               '<div class="post-av">' +
                 (p.foto ? '<img src="' + laEscapar(p.foto) + '" alt="">' : laEscapar(iniciais)) +
               '</div>' +
               '<div class="post-corpo">' +
                 '<div class="post-topo">' +
                   '<b>' + laEscapar(p.autor) + '</b>' +
                   (da ? '<span class="post-selo">Academia</span>' : '') +
                   '<span class="post-hora">' + new Date(p.quando).toLocaleString('pt-BR') + '</span>' +
                 '</div>' +
                 '<p>' + laEscapar(p.texto) + '</p>' +
                 '<button type="button" class="btn-mini js-apagar-post" data-id="' + p.id + '">Apagar</button>' +
               '</div>' +
             '</div>';
    }).join('');

    casa.querySelectorAll('.js-apagar-post').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Apagar este recado da sala?')) return;
        var l = laLerMural().filter(function (x) { return x.id !== b.getAttribute('data-id'); });
        try { localStorage.setItem('la_mural', JSON.stringify(l)); } catch (e) {}
        pintarMural();
      });
    });
  }

  function avisar(txt) {
    var a = q('.js-aviso-mural-admin');
    if (!a) return;
    a.textContent = txt;
    a.classList.remove('hidden');
    setTimeout(function () { a.classList.add('hidden'); }, 4000);
  }

  /* ==================== LIGAÇÕES ==================== */

  function ligar() {
    /* responder */
    var form = porId('form-resposta-admin');
    if (form && !form._novo) {
      form._novo = true;
      form.addEventListener('submit', function (e) { e.preventDefault(); responder(); });
    }

    /* abrir e fechar a sala */
    var abrir = porId('mural-abrir');
    if (abrir && !abrir._novo) {
      abrir._novo = true;
      abrir.addEventListener('click', function () {
        laAbrirFecharMural(true);
        avisar('Sala aberta: o pessoal pode conversar.');
        pintarMural();
      });
    }

    var fechar = porId('mural-fechar');
    if (fechar && !fechar._novo) {
      fechar._novo = true;
      fechar.addEventListener('click', function () {
        laAbrirFecharMural(false);
        avisar('Sala fechada: o aluno vê o aviso e não consegue escrever.');
        pintarMural();
      });
    }

    /* publicar como academia */
    var post = porId('form-post-admin');
    if (post && !post._novo) {
      post._novo = true;
      post.addEventListener('submit', function (e) {
        e.preventDefault();
        var campo = porId('post-admin-texto');
        if (!campo || !campo.value.trim()) return;
        laPostarDaAcademia(campo.value);
        campo.value = '';
        avisar('Publicado na sala!');
        pintarMural();
      });
    }

    pintarConversas();
    pintarConversaAberta();
    pintarMural();
    ligarGrupo();
  }


  /* ==================== BATE-PAPO DA ACADEMIA (GRUPO) ==================== */

  function pintarGrupoAdmin() {
    var aberto = (typeof laGrupoAberto === 'function') ? laGrupoAberto() : true;

    var selo = q('.js-grupo-selo');
    if (selo) {
      selo.textContent = aberto ? 'Aberto' : 'Bloqueado';
      selo.style.color = aberto ? 'var(--la-accent-green)' : 'var(--la-red)';
      selo.style.borderColor = aberto ? 'var(--la-accent-green)' : 'var(--la-red)';
    }

    var casa = q('.js-grupo-admin');
    if (!casa) return;

    var lista = (typeof laGrupoListar === 'function') ? laGrupoListar() : [];
    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Nenhuma mensagem no grupo ainda. ' +
        'Quando o pessoal conversar, aparece aqui.</p>';
      return;
    }

    casa.innerHTML = lista.slice().reverse().map(function (m) {
      var da = m.de === 'academia';
      var iniciais = String(m.autor || 'AL').split(' ').map(function (x) { return x[0]; })
        .slice(0, 2).join('').toUpperCase();
      return '<div class="post-mural' + (da ? ' da-academia' : '') + '">' +
               '<div class="post-av">' +
                 (m.foto ? '<img src="' + laEscapar(m.foto) + '" alt="">' : laEscapar(iniciais)) +
               '</div>' +
               '<div class="post-corpo">' +
                 '<div class="post-topo">' +
                   '<b>' + laEscapar(m.autor || 'Aluno') + '</b>' +
                   (da ? '<span class="post-selo">Academia</span>' : '') +
                   '<span class="post-hora">' + new Date(m.quando).toLocaleString('pt-BR') + '</span>' +
                 '</div>' +
                 (m.texto ? '<p>' + laEscapar(m.texto) + '</p>' : '') +
                 (m.midia && m.midia.dado
                   ? (m.midia.tipo === 'video'
                       ? '<video class="bolha-video" src="' + m.midia.dado + '" controls></video>'
                       : '<img class="bolha-imagem" src="' + m.midia.dado + '" alt="">')
                   : '') +
                 '<button type="button" class="btn-mini js-apagar-grupo" data-id="' + m.id + '">Apagar</button>' +
               '</div>' +
             '</div>';
    }).join('');

    casa.querySelectorAll('.js-apagar-grupo').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Apagar esta mensagem do grupo?')) return;
        if (typeof laGrupoApagar === 'function') laGrupoApagar(b.getAttribute('data-id'));
        pintarGrupoAdmin();
      });
    });
  }

  function avisarGrupo(txt) {
    var a = q('.js-aviso-grupo');
    if (!a) return;
    a.textContent = txt;
    a.classList.remove('hidden');
    setTimeout(function () { a.classList.add('hidden'); }, 4000);
  }

  function ligarGrupo() {
    var abrir = porId('grupo-abrir');
    if (abrir && !abrir._novo) {
      abrir._novo = true;
      abrir.addEventListener('click', function () {
        if (typeof laGrupoAbrirFechar === 'function') laGrupoAbrirFechar(true);
        avisarGrupo('Bate-papo aberto: o pessoal pode conversar.');
        pintarGrupoAdmin();
      });
    }

    var fechar = porId('grupo-fechar');
    if (fechar && !fechar._novo) {
      fechar._novo = true;
      fechar.addEventListener('click', function () {
        if (typeof laGrupoAbrirFechar === 'function') laGrupoAbrirFechar(false);
        avisarGrupo('Bate-papo bloqueado: o aluno vê o aviso e não consegue escrever.');
        pintarGrupoAdmin();
      });
    }

    var post = porId('form-post-grupo');
    if (post && !post._novo) {
      post._novo = true;
      post.addEventListener('submit', function (e) {
        e.preventDefault();
        var campo = porId('post-grupo-texto');
        if (!campo || !campo.value.trim()) return;
        if (typeof laGrupoEnviar === 'function') laGrupoEnviar('academia', campo.value, 'academia');
        campo.value = '';
        avisarGrupo('Publicado no grupo!');
        pintarGrupoAdmin();
      });
    }

    pintarGrupoAdmin();
  }

  /* ao clicar nas abas, redesenha */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-aba-admin]') : null;
    if (!b) return;
    var qual = b.getAttribute('data-aba-admin');
    if (qual === 'mensagens') setTimeout(function () { pintarConversas(); pintarConversaAberta(); ligarGrupo(); }, 30);
    if (qual === 'mural') setTimeout(pintarMural, 30);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }

  window.LAAdminMsg = { conversas: pintarConversas, mural: pintarMural };
})();
