/* ==========================================================================
   L.A BOT — assistente da L.A Fitness
   Mesmo padrão do IAurélio (CiR): roteiros prontos que casam por palavra-chave,
   transbordo para o WhatsApp da recepção e navegação pública do site.
   ========================================================================== */

const LABot = {

  aberto: false,
  contexto: 'inicio',

  /* ---------- monta a janela do chat ---------- */
  iniciar() {
    const gatilho = document.querySelector('.chatbot-trigger');
    const janela  = document.getElementById('chatWindow');
    const entrada = document.getElementById('chatInput');

    if (gatilho) gatilho.addEventListener('click', () => this.alternar());
    if (entrada) entrada.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.enviar();
    });

    document.querySelectorAll('.js-bot-quick').forEach((b) => {
      b.addEventListener('click', () => {
        const msg = b.getAttribute('data-msg') || b.textContent.trim();
        this.enviarTexto(msg);
      });
    });

    this.saudacao();
  },

  /* ---------- resposta de saudação com o período do dia ---------- */
  respostaSaudacao(quem) {
    const h = new Date().getHours();
    const nome = this.nomeVisitante ? ', ' + this.nomeVisitante : '';

    /* aluno logado: chama pelo nome e fala do treino */
    if (quem === 'aluno') {
      const eu = (typeof laAlunoLogado === 'function') ? laAlunoLogado() : null;
      const apelido = eu && eu.nome ? String(eu.nome).trim().split(/\s+/)[0] : '';
      const chamada = apelido ? 'Olá, <strong>' + apelido + '</strong>! ' : 'Olá! ';
      const periodo = h < 12 ? 'Bom dia' : (h < 18 ? 'Boa tarde' : 'Boa noite');
      const emoji = h < 12 ? '☀️' : (h < 18 ? '🌤️' : '🌙');
      return chamada + periodo + '! ' + emoji + '<br>' +
        'Vou te ajudar com o seu treino hoje. 💪<br><br>' +
        'Me chama para falar de <strong>sua ficha</strong>, <strong>como fazer</strong> um exercício, ' +
        '<strong>alongamento</strong>, <strong>progresso</strong> ou o <strong>código de entrada</strong>.';
    }

    if (h < 12) {
      return `Bom dia${nome}! ☀️ Que bom te ver por aqui na <strong>L.A Fitness</strong>.<br>` +
        `Posso te ajudar com <strong>planos</strong>, <strong>horários</strong>, ` +
        `<strong>modalidades</strong> ou <strong>endereço</strong>. O que você procura?`;
    }
    if (h < 18) {
      return `Boa tarde${nome}! 🌤️ Bem-vindo à <strong>L.A Fitness</strong>.<br>` +
        `Quer saber sobre <strong>planos</strong>, <strong>horários</strong> ou ` +
        `<strong>aulas</strong>? É só me dizer.`;
    }
    return `Boa noite${nome}! 🌙 Que bom te ver por aqui na <strong>L.A Fitness</strong>.<br>` +
      `Posso falar sobre <strong>planos</strong>, <strong>horários</strong>, ` +
      `<strong>modalidades</strong> e <strong>matrícula</strong>. Como posso ajudar?`;
  },

  /* ---------- resposta de despedida com o período do dia ---------- */
  respostaDespedida() {
    const h = new Date().getHours();
    if (h < 12) return 'Até logo! Bom treino e volte sempre. 💪';
    if (h < 18) return 'Até mais! Bons treinos na L.A Fitness. 💪';
    return 'Boa noite! Descanse bem e até o próximo treino. 💪';
  },

  alternar() {
    const janela = document.getElementById('chatWindow');
    if (!janela) return;
    this.aberto = !this.aberto;
    janela.classList.toggle('open', this.aberto);
    if (this.aberto) {
      const entrada = document.getElementById('chatInput');
      if (entrada) entrada.focus();
    }
  },

  /* ---------- mensagem inicial ---------- */
  saudacao() {
    const hora = new Date().getHours();
    let parte = 'Olá';
    if (hora < 12) parte = 'Bom dia';
    else if (hora < 18) parte = 'Boa tarde';
    else parte = 'Boa noite';

    this.escrever(
      `${parte}! Bem-vindo à <strong>L.A Fitness</strong> em Cidade Ocidental. ` +
      `Sou o <strong>L.A Bot</strong> e posso te ajudar com horários, planos, endereço e matrícula.<br>` +
      `Como posso ajudar hoje?`
    );
  },

  /* ---------- envio ---------- */
  enviar() {
    const entrada = document.getElementById('chatInput');
    if (!entrada) return;
    const texto = entrada.value.trim();
    if (!texto) return;
    entrada.value = '';
    this.processar(texto);
  },

  enviarTexto(texto) {
    if (!texto) return;
    this.processar(texto);
  },

  /* ---------- o cérebro do bot ---------- */
  processar(texto) {
    const convite = String(texto || '').trim();
    const tentativaAdmin = convite.toLowerCase().startsWith('#admin');
    this.usuario(tentativaAdmin ? '••••••••' : texto);
    laRegistrarAcesso('bot', 'mensagem', {
      texto: tentativaAdmin ? '[convite administrativo omitido]' : String(texto).slice(0, 120)
    });

    if (tentativaAdmin) {
      this.abrirLoginAdmin();
      return;
    }

    const conteudo = laGarantirConteudo();
    const t = String(texto).toLowerCase().trim();

    setTimeout(() => {
      /* ---- 2.5 O VISITANTE DIZ O NOME: "meu nome é Rodrigo" ---- */
      const mNome = t.match(/(?:meu nome (?:e|é|eh)\s+|me chamo\s+|pode me chamar de\s+|sou (?:o|a)\s+)([a-zà-ú]{2,20})/i);
      if (mNome) {
        const bruto = mNome[1].trim();
        const nome = bruto.charAt(0).toUpperCase() + bruto.slice(1).toLowerCase();
        this.nomeVisitante = nome;
        try { localStorage.setItem('la_bot_nome', nome); } catch (e) {}
        this.escrever('Prazer, <strong>' + nome + '</strong>! 🤝 Que bom te ver na <strong>L.A Fitness</strong>.<br><br>' +
          'Me chama para falar de <strong>planos</strong>, <strong>horários</strong>, ' +
          '<strong>modalidades</strong>, <strong>endereço</strong> ou <strong>aula experimental</strong>.');
        return;
      }

      /* ---- 3. saudação, com o período do dia ---- */
      const saudacoes = ['oi','ola','olá','opa','eai','e ai','ei','bom dia','boa tarde',
                         'boa noite','tudo bem','tudo bom','td bem','beleza','salve'];
      if (saudacoes.some((s) => t === s || t === s + '!' || t.startsWith(s + ' '))) {
        const quem = this.quemE();
        this.escrever(this.respostaSaudacao(quem));
        return;
      }

      /* ---- 4. como está / tudo bem ---- */
      if (t.includes('como vai') || t.includes('como voce') || t.includes('como você') ||
          t.includes('tudo certo') || t.includes('de boa')) {
        this.escrever('Tudo ótimo por aqui, obrigado! 😄 E você, pronto(a) para treinar? ' +
          'Se quiser, posso falar sobre <strong>planos</strong>, <strong>horários</strong> ou <strong>aulas</strong>.');
        return;
      }

      /* ---- 5. agradecimento ---- */
      if (t.includes('obrigad') || t.includes('valeu') || t.includes('brigad') || t.includes('vlw')) {
        this.escrever('Por nada! Qualquer coisa é só chamar. 💪');
        return;
      }

      /* ---- 6. despedida ---- */
      if (['tchau','ate mais','até mais','falou','fui','adeus','boa noite tchau'].some((d) => t.includes(d))) {
        this.escrever(this.respostaDespedida());
        return;
      }

      /* ---- 7. elogio / reação ---- */
      if (t.includes('muito bom') || t.includes('otimo') || t.includes('ótimo') ||
          t.includes('legal') || t.includes('show') || t.includes('top') || t.includes('gostei')) {
        this.escrever('Que bom que gostou! 🙌 Se precisar de qualquer coisa da academia, estou aqui.');
        return;
      }

      /* ---- 8. quem é você ---- */
      if (t.includes('quem e voce') || t.includes('quem é você') || t.includes('seu nome') ||
          t.includes('voce e um robo') || t.includes('você é um robô')) {
        this.escrever('Sou o <strong>L.A Bot</strong>, o assistente virtual da L.A Fitness. ' +
          'Respondo sobre planos, horários, modalidades e endereço. Quando a dúvida for ' +
          'da recepção, te passo para o WhatsApp da equipe.');
        return;
      }

      /* ---- 9. ajuda / o que você faz ---- */
      if (t === 'ajuda' || t === 'help' || t.includes('o que voce faz') || t.includes('o que você faz')) {
        const quem = this.quemE();
        if (quem === 'aluno') {
          this.escrever('Posso te ajudar com:<br>' +
            '• <strong>Seu treino</strong> — ficha, exercícios, como fazer<br>' +
            '• <strong>Progresso</strong> — medidas e evolução<br>' +
            '• <strong>Alongamento</strong> e cuidados no treino<br>' +
            '• <strong>Código de entrada</strong> na catraca<br>' +
            '• <strong>Mural</strong> e avisos da academia<br><br>' +
            'Para <strong>mensalidade, plano ou cancelamento</strong>, falo com a recepção pra você.');
        } else {
          this.escrever('Posso te ajudar com:<br>' +
            '• <strong>Planos</strong> e valores<br>' +
            '• <strong>Horários</strong> de funcionamento<br>' +
            '• <strong>Modalidades</strong> (musculação, ginástica, funcional)<br>' +
            '• <strong>Endereço</strong> e como chegar<br>' +
            '• <strong>Matrícula</strong> e avaliação física<br>' +
            '• <strong>Aula experimental</strong><br><br>' +
            'É só escrever o que você quer saber!');
        }
        return;
      }

      /* ---- 10. transbordo para a recepção ---- */
      const precisaHumano = (conteudo.encaminharSempre || []).some((p) => t.includes(p));
      if (precisaHumano) {
        this.escrever(
          '📌 <strong>Atendimento da recepção:</strong> essa solicitação é resolvida diretamente pela equipe da academia.'
        );
        this.botaoWhatsApp(conteudo.whatsappBotao, 'Olá! Preciso de atendimento da recepção L.A Fitness sobre: ' + texto);
        return;
      }

      /* ---- 11. roteiros prontos ---- */
      for (const roteiro of (conteudo.roteiros || [])) {
        const casou = (roteiro.gatilhos || []).some((g) => t.includes(g));
        if (casou) {
          this.escrever(roteiro.resposta);
          if (roteiro.botao) this.botaoWhatsApp(roteiro.botao.texto, roteiro.botao.mensagem);
          return;
        }
      }

      /* ---- 12. não reconheceu: encaminha ---- */
      this.escrever(conteudo.whatsappFallback || 'Vou te conectar com a recepção.');
      this.botaoWhatsApp(conteudo.whatsappBotao, 'Olá! Gostaria de informações sobre: ' + texto);

    }, 450);
  },

  abrirLoginAdmin() {
    this.escrever('Para entrar no painel, <a href="admin.html">clique aqui para abrir o login administrativo</a>. ' +
      'O acesso ao painel só é liberado após entrar com uma conta administradora do Supabase.');
  },

  /* ---------- escreve as bolhas ---------- */
  usuario(texto) {
    const corpo = document.getElementById('chatBody');
    if (!corpo) return;
    const div = document.createElement('div');
    div.className = 'msg-bubble msg-user';
    div.textContent = texto;
    corpo.appendChild(div);
    corpo.scrollTop = corpo.scrollHeight;
  },

  /* quem esta falando comigo: visitante ou aluno logado */
  /* lembra o nome que a pessoa disse, mesmo se recarregar */
  lembrarNome() {
    if (this.nomeVisitante) return;
    try {
      const g = localStorage.getItem('la_bot_nome');
      if (g) this.nomeVisitante = g;
    } catch (e) {}
  },

  quemE() {
    try {
      if (typeof laAlunoLogado === 'function' && laAlunoLogado()) return 'aluno';
      if (typeof laAdminLogado === 'function' && laAdminLogado()) return 'admin';
    } catch (e) {}
    return 'visitante';
  },

  escrever(html) {
    const corpo = document.getElementById('chatBody');
    if (!corpo) return;

    const digitando = document.createElement('div');
    digitando.className = 'msg-bubble msg-bot msg-digitando';
    digitando.innerHTML = '<span></span><span></span><span></span>';
    corpo.appendChild(digitando);
    corpo.scrollTop = corpo.scrollHeight;

    setTimeout(() => {
      digitando.remove();
      const div = document.createElement('div');
      div.className = 'msg-bubble msg-bot';
      div.innerHTML = html;
      corpo.appendChild(div);
      corpo.scrollTop = corpo.scrollHeight;
    }, 380);
  },

  botaoWhatsApp(texto, mensagem) {
    const corpo = document.getElementById('chatBody');
    if (!corpo) return;
    const div = document.createElement('div');
    div.className = 'msg-bubble msg-bot';
    const b = document.createElement('button');
    b.className = 'quick-btn quick-btn-whats';
    b.innerHTML = '<i class="fa-brands fa-whatsapp"></i> ' + (texto || 'Falar no WhatsApp');
    b.addEventListener('click', () => LAWhatsApp.abrir(mensagem));
    div.appendChild(b);
    corpo.appendChild(div);
    corpo.scrollTop = corpo.scrollHeight;
  }
};

/* ==========================================================================
   WHATSAPP — um único lugar para montar o link
   ========================================================================== */

const LAWhatsApp = {
  abrir(mensagem) {
    const c = laGarantirConteudo();
    const numero = (c.geral && c.geral.telefone) ? c.geral.telefone : '5561991719246';
    laRegistrarAcesso('whatsapp', 'clique', { alvo: 'whatsapp', mensagem: String(mensagem).slice(0, 120) });
    window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(mensagem || ''), '_blank');
  }
};

/* compatibilidade com os onclick que já existiam no HTML */
function openWhatsapp(texto) { LAWhatsApp.abrir(texto); }
function toggleChatbot() { LABot.alternar(); }
function sendQuickMsg(texto) { LABot.enviarTexto(texto); }
function sendChatMessage() { LABot.enviar(); }
function handleChatKey(e) { if (e.key === 'Enter') LABot.enviar(); }
function closeAdminModal() {
  const m = document.getElementById('modalAdmin');
  if (m) m.classList.remove('active');
}
