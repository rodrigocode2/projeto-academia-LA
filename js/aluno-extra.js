
/* ==========================================================================
   MENSAGENS E MENSALIDADE DO ALUNO
   Acrescenta duas telas que faltavam na area do aluno.
   Chaves proprias no localStorage, no mesmo padrao do resto do projeto.
   ========================================================================== */

const LA_MENSAGENS  = 'la_mensagens';
const LA_PAGAMENTOS = 'la_pagamentos';

/* ---------------- utilidades defensivas ---------------- */
function laLerLista(chave) {
  try {
    const b = localStorage.getItem(chave);
    const l = b ? JSON.parse(b) : [];
    return Array.isArray(l) ? l : [];
  } catch (e) { return []; }
}

function laGravarLista(chave, lista) {
  try { localStorage.setItem(chave, JSON.stringify(lista)); return true; }
  catch (e) { return false; }
}

function laAgora() { return new Date().toISOString(); }

function laQuandoCurto(iso) {
  try {
    const d = new Date(iso);
    const hoje = new Date();
    const mesmoDia = d.toDateString() === hoje.toDateString();
    const hh = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return mesmoDia ? hh : d.toLocaleDateString('pt-BR') + ' ' + hh;
  } catch (e) { return ''; }
}

/* ---------------- MENSAGENS ---------------- */
function laListarMensagens(alunoId) {
  return laLerLista(LA_MENSAGENS)
    .filter(function (m) { return m && m.alunoId === alunoId; })
    .sort(function (a, b) { return String(a.quando).localeCompare(String(b.quando)); });
}

function laEnviarMensagem(alunoId, texto, deQuem) {
  const t = String(texto || '').trim();
  if (!t) return null;
  const aluno = (typeof laBuscarAluno === 'function') ? laBuscarAluno(alunoId) : null;
  const msg = {
    id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    alunoId: alunoId,
    aluno: aluno ? aluno.nome : '',
    de: deQuem || 'aluno',
    texto: t.slice(0, 800),
    quando: laAgora(),
    lida: false
  };
  const lista = laLerLista(LA_MENSAGENS);
  lista.push(msg);
  laGravarLista(LA_MENSAGENS, lista);
  return msg;
}

function laResponderMensagem(alunoId, texto) {
  return laEnviarMensagem(alunoId, texto, 'academia');
}

function laNaoLidasDoAluno(alunoId) {
  return laListarMensagens(alunoId).filter(function (m) {
    return m.de === 'academia' && !m.lida;
  }).length;
}

function laMarcarLidas(alunoId) {
  const lista = laLerLista(LA_MENSAGENS);
  let mudou = false;
  lista.forEach(function (m) {
    if (m.alunoId === alunoId && m.de === 'academia' && !m.lida) { m.lida = true; mudou = true; }
  });
  if (mudou) laGravarLista(LA_MENSAGENS, lista);
}

/* quantas conversas tem mensagem nova, para o painel */
function laConversasComNovidade() {
  const lista = laLerLista(LA_MENSAGENS);
  const porAluno = {};
  lista.forEach(function (m) {
    if (!m || !m.alunoId) return;
    if (!porAluno[m.alunoId]) porAluno[m.alunoId] = { alunoId: m.alunoId, aluno: m.aluno, naoLidas: 0, ultima: m.quando, ultimoTexto: m.texto };
    const c = porAluno[m.alunoId];
    if (m.de === 'aluno' && !m.lida) c.naoLidas++;
    if (String(m.quando) > String(c.ultima)) { c.ultima = m.quando; c.ultimoTexto = m.texto; }
  });
  return Object.keys(porAluno).map(function (k) { return porAluno[k]; })
    .sort(function (a, b) { return String(b.ultima).localeCompare(String(a.ultima)); });
}

function laMarcarLidasDoAlunoNoPainel(alunoId) {
  const lista = laLerLista(LA_MENSAGENS);
  let mudou = false;
  lista.forEach(function (m) {
    if (m.alunoId === alunoId && m.de === 'aluno' && !m.lida) { m.lida = true; mudou = true; }
  });
  if (mudou) laGravarLista(LA_MENSAGENS, lista);
}

/* ---------------- MENSALIDADE ---------------- */
function laListarPagamentos(alunoId) {
  return laLerLista(LA_PAGAMENTOS)
    .filter(function (p) { return p && p.alunoId === alunoId; })
    .sort(function (a, b) { return String(b.competencia).localeCompare(String(a.competencia)); });
}

function laRegistrarPagamento(alunoId, competencia, valor) {
  const lista = laLerLista(LA_PAGAMENTOS);
  const jaTem = lista.find(function (p) { return p.alunoId === alunoId && p.competencia === competencia; });
  if (jaTem) {
    jaTem.status = 'aguardando';
    jaTem.valor = valor;
    jaTem.registradoEm = laAgora();
    laGravarLista(LA_PAGAMENTOS, lista);
    return jaTem;
  }
  const p = {
    id: 'pg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    alunoId: alunoId,
    aluno: (typeof laBuscarAluno === 'function' && laBuscarAluno(alunoId)) ? laBuscarAluno(alunoId).nome : '',
    competencia: competencia,
    valor: valor,
    status: 'aguardando',
    registradoEm: laAgora()
  };
  lista.push(p);
  laGravarLista(LA_PAGAMENTOS, lista);
  return p;
}

function laConfirmarPagamento(id) {
  const lista = laLerLista(LA_PAGAMENTOS);
  const p = lista.find(function (x) { return x.id === id; });
  if (!p) return false;
  p.status = 'pago';
  p.confirmadoEm = laAgora();
  laGravarLista(LA_PAGAMENTOS, lista);
  return true;
}

function laTodosPagamentos() {
  return laLerLista(LA_PAGAMENTOS).sort(function (a, b) {
    return String(b.registradoEm || '').localeCompare(String(a.registradoEm || ''));
  });
}

/* competencia no formato 2026-10 */
function laCompetenciaAtual() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function laNomeCompetencia(comp) {
  const partes = String(comp || '').split('-');
  const meses = ['janeiro','fevereiro','março','abril','maio','junho',
                 'julho','agosto','setembro','outubro','novembro','dezembro'];
  const m = parseInt(partes[1], 10) - 1;
  return (meses[m] || '?') + ' de ' + (partes[0] || '');
}

/* ---------------- preco do plano ---------------- */
function laPrecoDoPlano(plano) {
  const p = String(plano || '').toLowerCase();
  if (p.indexOf('gymn') !== -1 || p.indexOf('ginástica') !== -1 || p.indexOf('ginastica') !== -1) return 150.00;
  if (p.indexOf('wellhub') !== -1 || p.indexOf('gympass') !== -1) return 0;
  return 99.90;
}

/* ==========================================================================
   MONTAGEM DAS TELAS
   ========================================================================== */

const LAAlunoExtra = {

  aluno: null,
  intervalo: null,

  iniciar(aluno) {
    this.aluno = aluno || (typeof laAlunoLogado === 'function' ? laAlunoLogado() : null);
    if (!this.aluno) return;
    this.ligarConversa();
    this.ligarMensalidade();
    this.pintarConversa();
    this.pintarMensalidade();
    this.atualizarBadge();
    this.vigiar();

    /* a academia pode responder enquanto o aluno esta no site */
    if (this.intervalo) clearInterval(this.intervalo);
    this.intervalo = setInterval(() => {
      this.pintarConversa();
      this.atualizarBadge();
    }, 15000);
  },

  atualizarBadge() {
    const b = document.querySelector('.js-badge-msg');
    if (!b) return;
    const n = laNaoLidasDoAluno(this.aluno.id);
    b.textContent = n;
    b.classList.toggle('hidden', n === 0);
  },

  vigiar() {
    /* quando o aluno abre a aba de mensagens, marca como lidas */
    const btn = document.querySelector('[data-painel="mensagens"]');
    if (btn && !btn._ligadoMsg) {
      btn._ligadoMsg = true;
      btn.addEventListener('click', () => {
        setTimeout(() => { laMarcarLidas(this.aluno.id); this.atualizarBadge(); }, 300);
      });
    }
  },

  /* ---------------- conversa ---------------- */
  pintarConversa() {
    const casa = document.querySelector('.js-conversa');
    if (!casa || !this.aluno) return;
    const lista = laListarMensagens(this.aluno.id);
    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Nenhuma mensagem ainda. Escreva a primeira.</p>';
      return;
    }
    casa.innerHTML = lista.map(function (m) {
      const meu = m.de === 'aluno';
      return '<div class="bolha ' + (meu ? 'bolha-aluno' : 'bolha-academia') + '">' +
               '<div class="bolha-txt">' + laEscapar(m.texto) + '</div>' +
               '<span class="bolha-hora">' + laQuandoCurto(m.quando) + '</span>' +
             '</div>';
    }).join('');
    casa.scrollTop = casa.scrollHeight;
  },

  ligarConversa() {
    const form = document.getElementById('form-mensagem');
    if (form && !form._ligado) {
      form._ligado = true;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const campo = document.getElementById('msg-texto');
        const texto = campo ? campo.value : '';
        if (!texto.trim()) return;
        laEnviarMensagem(this.aluno.id, texto, 'aluno');
        if (campo) campo.value = '';
        this.pintarConversa();
        if (typeof laRegistrarAcesso === 'function') {
          laRegistrarAcesso('mensagens', 'envio');
        }
      });
    }

    document.querySelectorAll('.js-msg-pronta').forEach((b) => {
      if (b._ligado) return;
      b._ligado = true;
      b.addEventListener('click', () => {
        const campo = document.getElementById('msg-texto');
        if (campo) { campo.value = b.getAttribute('data-t') || b.textContent.trim(); campo.focus(); }
      });
    });

    const zap = document.querySelector('.js-msg-zap');
    if (zap && !zap._ligado) {
      zap._ligado = true;
      zap.addEventListener('click', () => {
        if (typeof LAWhatsApp !== 'undefined') {
          LAWhatsApp.abrir('Olá! Sou aluno da L.A Fitness e preciso falar com a recepção.');
        }
      });
    }
  },

  /* ---------------- mensalidade ---------------- */
  pintarMensalidade() {
    const casa = document.querySelector('.js-mensalidade');
    if (!casa || !this.aluno) return;

    const a = this.aluno;
    const m = (typeof laMensalidadeDoAluno === 'function') ? laMensalidadeDoAluno(a.id) : null;

    if (!m) {
      casa.innerHTML = '<p class="vazio">A academia ainda não gerou a sua mensalidade deste mês.</p>';
      return;
    }

    const c = m.atual;
    const venc = String(c.vencimento || '').split('-').reverse().join('/');
    const atrasada = c.status === 'atrasada';
    const paga = c.status === 'paga';

    const cor = paga ? 'var(--la-accent-green)' : (atrasada ? 'var(--la-red)' : '#ffb020');
    const texto = paga ? 'Paga' : (atrasada ? 'Em atraso' : 'Em aberto');

    casa.innerHTML =
      '<div class="mensal-topo">' +
        '<div>' +
          '<span class="mensal-rotulo">Plano ' + laEscapar(a.plano || 'Mensal') + '</span>' +
          '<b class="mensal-valor">R$ ' + Number(c.valor).toFixed(2).replace('.', ',') + '</b>' +
          '<span class="mensal-comp">' + laNomeCompetencia(c.competencia) +
            ' · vence em ' + venc + '</span>' +
        '</div>' +
        '<span class="pilula-status" style="color:' + cor + '; border-color:' + cor + '">' +
          texto + '</span>' +
      '</div>' +
      (m.atrasadas > 1
        ? '<p style="margin-top:12px; font-size:.82rem; color:var(--la-red)">' +
          'Você tem ' + m.atrasadas + ' mensalidades em atraso, total ' +
          'R$ ' + m.valorEmAtraso.toFixed(2).replace('.', ',') + '. ' +
          'Procure a recepção para regularizar.</p>'
        : '') +
      (!paga
        ? '<button class="btn-primary js-pagar" style="margin-top:18px;">' +
            '<i class="fa-solid fa-circle-check"></i> Já paguei — avisar a recepção</button>'
        : '');

    const btn = casa.querySelector('.js-pagar');
    if (btn) {
      btn.addEventListener('click', () => {
        if (typeof laPagarCobranca === 'function') laPagarCobranca(c.id, 'recepcao');
        if (typeof laEnviarMensagem === 'function') {
          laEnviarMensagem(a.id, 'Registrei o pagamento de ' + laNomeCompetencia(c.competencia) +
            '. Valor: R$ ' + Number(c.valor).toFixed(2).replace('.', ',') + '.', 'aluno');
        }
        this.pintarMensalidade();
        this.pintarConversa();
      });
    }

    this.pintarHistoricoPag();
  },

  pintarHistoricoPag() {
    const casa = document.querySelector('.js-historico-pag');
    if (!casa || !this.aluno) return;
    const lista = laListarPagamentos(this.aluno.id);
    if (!lista.length) {
      casa.innerHTML = '<p class="vazio">Nenhum pagamento registrado ainda.</p>';
      return;
    }
    casa.innerHTML = lista.map(function (p) {
      const pago = p.status === 'pago';
      return '<div class="linha-pag">' +
               '<div><b>' + laNomeCompetencia(p.competencia) + '</b>' +
               '<span>Registrado em ' + laQuandoCurto(p.registradoEm) + '</span></div>' +
               '<span class="valor-pag">R$ ' + Number(p.valor || 0).toFixed(2).replace('.', ',') + '</span>' +
               '<span class="pilula-status" style="color:' +
                 (pago ? 'var(--la-accent-green)' : '#ffb020') + '; border-color:' +
                 (pago ? 'var(--la-accent-green)' : '#ffb020') + '">' +
                 (pago ? 'Pago' : 'Aguardando') + '</span>' +
             '</div>';
    }).join('');
  },

  ligarMensalidade() {
    /* nada a ligar aqui alem do que pintarMensalidade ja faz */
  }
};

/* ==========================================================================
   MENSALIDADE DO ALUNO — usa as cobranças do financeiro
   Mostra o mês, o vencimento, o valor e permite registrar o pagamento.
   ========================================================================== */

function laMensalidadeDoAluno(alunoId) {
  if (typeof laCobrancasDoAluno !== 'function') return null;
  if (typeof laAtualizarAtrasos === 'function') laAtualizarAtrasos();
  const lista = laCobrancasDoAluno(alunoId);
  if (!lista.length) return null;

  const comp = (typeof laCompetenciaDeHoje === 'function') ? laCompetenciaDeHoje() : '';
  const doMes = lista.find(function (c) { return c.competencia === comp; }) || lista[0];
  const atrasadas = lista.filter(function (c) { return c.status === 'atrasada'; });

  return {
    atual: doMes,
    todas: lista,
    atrasadas: atrasadas.length,
    valorEmAtraso: atrasadas.reduce(function (s, c) { return s + Number(c.valor || 0); }, 0)
  };
}
