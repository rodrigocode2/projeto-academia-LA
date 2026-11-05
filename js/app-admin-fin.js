/* ==========================================================================
   PAINEL — FINANCEIRO (cobranças, inadimplência e alunos em risco)
   ========================================================================== */

(function () {
  'use strict';

  function q(s) { return document.querySelector(s); }
  function porId(id) { return document.getElementById(id); }
  function moeda(v) { return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ','); }

  function avisar(txt, cor) {
    var a = q('.js-aviso-fin');
    if (!a) return;
    a.textContent = txt;
    a.style.color = cor || 'var(--la-accent-green)';
    a.classList.remove('hidden');
    setTimeout(function () { a.classList.add('hidden'); }, 4500);
  }

  /* ---------------- numeros do topo ---------------- */
  function pintarResumo() {
    var r = (typeof laResumoFinanceiro === 'function') ? laResumoFinanceiro() : null;
    if (!r) return;

    var set = function (sel, v) { var e = q(sel); if (e) e.textContent = v; };
    set('.js-fin-recebido', moeda(r.recebido));
    set('.js-fin-aberto', moeda(r.emAberto));
    set('.js-fin-atraso', moeda(r.emAtraso));
    set('.js-fin-inadimplencia', String(r.taxaInadimplencia).replace('.', ',') + '%');

    var comp = q('.js-fin-competencia');
    if (comp) comp.textContent = (typeof laNomeDoMes === 'function') ? laNomeDoMes(r.competencia) : r.competencia;
  }

  /* ---------------- lista de cobranças do mes ---------------- */
  function pintarCobrancas() {
    var casa = q('.js-fin-lista');
    if (!casa) return;

    var lista = (typeof laCobrancasDoMes === 'function') ? laCobrancasDoMes() : [];

    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Nenhuma cobrança gerada neste mês. ' +
        'Clique em "Gerar cobranças do mês".</p>';
      return;
    }

    casa.innerHTML = '<div class="tabela-simples">' +
      '<div class="linha-cabeca"><span>Aluno</span><span>Vencimento</span><span>Valor</span><span>Situação</span></div>' +
      lista.map(function (c) {
        var cor = c.status === 'paga' ? 'var(--la-accent-green)'
                : c.status === 'atrasada' ? 'var(--la-red)' : '#ffb020';
        return '<div class="linha-dado">' +
                 '<span>' + laEscapar(c.aluno || 'Aluno') + '</span>' +
                 '<span>' + String(c.vencimento || '').split('-').reverse().join('/') + '</span>' +
                 '<span>' + moeda(c.valor) + '</span>' +
                 '<span>' +
                   (c.status === 'paga'
                     ? '<span class="pilula" style="color:' + cor + ';border-color:' + cor + '">Paga</span>'
                     : '<button type="button" class="btn-mini js-fin-pagar" data-id="' + c.id + '">' +
                       'Dar baixa</button>') +
                   ' <span class="pilula" style="color:' + cor + ';border-color:' + cor + '">' +
                     (c.status === 'aberta' ? 'Aberta' : c.status === 'paga' ? 'Paga' : 'Atrasada') + '</span>' +
                 '</span>' +
               '</div>';
      }).join('') + '</div>';

    casa.querySelectorAll('.js-fin-pagar').forEach(function (b) {
      b.addEventListener('click', function () {
        if (typeof laPagarCobranca === 'function') laPagarCobranca(b.getAttribute('data-id'), 'recepcao');
        avisar('Baixa dada. Mensalidade marcada como paga.');
        pintarTudo();
      });
    });
  }

  /* ---------------- alunos em risco ---------------- */
  function pintarRisco() {
    var casa = q('.js-fin-risco');
    if (!casa) return;

    var lista = (typeof laAlunosEmRisco === 'function') ? laAlunosEmRisco() : [];
    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Ninguém em risco agora. Todo mundo em dia e treinando.</p>';
      return;
    }

    casa.innerHTML = lista.map(function (a) {
      var cor = a.risco >= 70 ? 'var(--la-red)' : (a.risco >= 45 ? '#ffb020' : 'var(--la-text-muted)');
      var zap = String(a.telefone || '').replace(/\D/g, '');
      var msg = 'Olá' + (a.nome ? ', ' + a.nome.split(' ')[0] : '') + '! Sentimos sua falta na L.A Fitness.';
      if (a.mensalidadesAtrasadas) msg += ' Tem uma mensalidade em aberto (' + moeda(a.valorEmAtraso) + ').';
      if (a.diasSemTreinar > 14) msg += ' Faz ' + a.diasSemTreinar + ' dias que você não treina.';

      return '<div class="cartao-risco">' +
               '<div class="risco-topo">' +
                 '<div><b>' + laEscapar(a.nome) + '</b>' +
                   '<span>' + laEscapar(a.plano || '') + '</span></div>' +
                 '<span class="risco-selo" style="color:' + cor + ';border-color:' + cor + '">' +
                   a.risco + '% risco</span>' +
               '</div>' +
               '<div class="risco-motivos">' +
                 (a.mensalidadesAtrasadas
                   ? '<span class="pilula">' + a.mensalidadesAtrasadas + ' mensalidade(s) em atraso · ' + moeda(a.valorEmAtraso) + '</span>'
                   : '') +
                 (a.diasSemTreinar > 14
                   ? '<span class="pilula">' + a.diasSemTreinar + ' dias sem treinar</span>'
                   : '') +
               '</div>' +
               (zap
                 ? '<button type="button" class="btn-mini js-fin-zap" data-zap="' + laEscapar(zap) + '" ' +
                     'data-msg="' + laEscapar(msg) + '">' +
                     '<i class="fa-brands fa-whatsapp"></i> Falar com o aluno</button>'
                 : '<span class="nota-bloco">Sem telefone cadastrado.</span>') +
             '</div>';
    }).join('');

    casa.querySelectorAll('.js-fin-zap').forEach(function (b) {
      b.addEventListener('click', function () {
        var tel = b.getAttribute('data-zap');
        var msg = b.getAttribute('data-msg') || '';
        window.open('https://wa.me/55' + tel.replace(/^55/, '') + '?text=' + encodeURIComponent(msg), '_blank');
      });
    });
  }

  /* ---------------- ligações ---------------- */
  function pintarTudo() {
    pintarResumo();
    pintarCobrancas();
    pintarRisco();
  }

  function ligar() {
    var gerar = porId('fin-gerar');
    if (gerar && !gerar._ligado) {
      gerar._ligado = true;
      gerar.addEventListener('click', function () {
        var n = (typeof laGerarCobrancasDoMes === 'function') ? laGerarCobrancasDoMes() : 0;
        avisar(n
          ? n + ' cobrança(s) gerada(s) para este mês.'
          : 'Todas as cobranças deste mês já estavam geradas.');
        pintarTudo();
      });
    }

    var pix = porId('fin-pix');
    if (pix && !pix._ligado) {
      pix._ligado = true;
      pix.addEventListener('click', function () {
        var c = (typeof laGarantirConteudo === 'function') ? laGarantirConteudo() : {};
        var tel = (c.geral && c.geral.telefone) ? c.geral.telefone : '(61) 9 9266-3142';
        var bonito = String(tel).replace(/^55/, '');
        var fmt = bonito.length >= 10
          ? '(' + bonito.slice(0, 2) + ') ' + bonito.slice(2, 3) + ' ' + bonito.slice(3, 7) + '-' + bonito.slice(7)
          : bonito;
        avisar('Chave PIX da academia: ' + fmt + ' — mostre ao aluno na recepção.');
      });
    }

    pintarTudo();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-aba-admin="pagamentos"]') : null;
    if (b) setTimeout(ligar, 40);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }

  window.LAFinanceiro = { pintar: pintarTudo };
})();
