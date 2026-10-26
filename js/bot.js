/* ==========================================================================
   L.A BOT — assistente da L.A Fitness
   Padrão do IAurélio (CiR): roteiros que casam por palavra-chave,
   transbordo para o WhatsApp e caminho secreto para o painel.

   Acesso ao dashboard DENTRO do chat:
     1. o visitante digita  /admin-academia-LA
     2. o bot pede a senha
     3. senha correta -> abre o painel
   ========================================================================== */

const LABot = {

  aberto: false,
  esperandoSenha: false,

  iniciar() {
    const gatilho = document.querySelector('.chatbot-trigger');
    const entrada = document.getElementById('chatInput');

    if (gatilho) gatilho.addEventListener('click', () => this.alternar());
    if (entrada) entrada.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.enviar(); });

    document.querySelectorAll('.js-bot-quick').forEach((b) => {
      b.addEventListener('click', () => {
        const msg = b.getAttribute('data-msg') || b.textContent.trim();
        this.enviarTexto(msg);
      });
    });

    this.saudacao();
  },

  alternar() {
    const janela = document.getElementById('chatWindow');
    if (!janela) return;
    this.aberto = !this.aberto;
    janela.classList.toggle('open', this.aberto);
    if (this.aberto) { const e = document.getElementById('chatInput'); if (e) e.focus(); }
  },

  saudacao() {
    const hora = new Date().getHours();
    let parte = 'Olá';
    if (hora < 12) parte = 'Bom dia';
    else if (hora < 18) parte = 'Boa tarde';
    else parte = 'Boa noite';

    this.escrever(
      parte + '! Bem-vindo à <strong>L.A Fitness</strong> em Cidade Ocidental. ' +
      'Sou o <strong>L.A Bot</strong> e posso te ajudar com horários, planos, endereço e matrícula.<br>Como posso ajudar?'
    );
  },

  enviar() {
    const entrada = document.getElementById('chatInput');
    if (!entrada) return;
    const texto = entrada.value.trim();
    if (!texto) return;
    entrada.value = '';
    this.processar(texto);
  },

  enviarTexto(texto) { if (texto) this.processar(texto); },

  /* ---------- o cérebro do bot ---------- */
  processar(texto) {
    this.usuario(texto);
    laRegistrarAcesso('bot', 'mensagem', { texto: String(texto).slice(0, 120) });

    const conteudo = laGarantirConteudo();
    const t = String(texto).toLowerCase().trim();

    setTimeout(() => {

      /* 1. esperando a senha do painel */
      if (this.esperandoSenha) {
        if (laVerificarSenhaAdmin(texto)) {
          this.esperandoSenha = false;
          this.escrever('✅ <strong>Senha correta.</strong> Abrindo o painel de controle da L.A Fitness...');
          laRegistrarAcesso('admin', 'acesso', { via: 'chat' });
          setTimeout(() => { window.location.href = 'admin.html'; }, 900);
        } else {
          this.escrever('❌ Senha incorreta. Tente de novo ou fale com a recepção.');
        }
        return;
      }

      /* 2. comando do painel */
      if (t === LA_COMANDO_ADMIN.toLowerCase() || (t.includes('admin') && t.includes('academia'))) {
        this.esperandoSenha = true;
        this.escrever('🔒 <strong>Acesso restrito.</strong> Digite a senha do painel de controle:');
        return;
      }

      /* 3. saudação */
      if (['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'e ai'].includes(t)) {
        this.escrever('Oi! Em que posso ajudar? Posso falar sobre <strong>horários</strong>, <strong>planos</strong>, <strong>endereço</strong> ou te encaminhar para a <strong>recepção</strong>.');
        return;
      }

      /* 4. agradecimento */
      if (t.includes('obrigad') || t.includes('valeu') || t.includes('brigad')) {
        this.escrever('Por nada! Qualquer coisa é só chamar. 💪');
        return;
      }

      /* 5. transbordo para a recepção */
      const precisaHumano = (conteudo.encaminharSempre || []).some((p) => t.includes(p));
      if (precisaHumano) {
        this.escrever('📌 <strong>Atendimento da recepção:</strong> essa solicitação é resolvida diretamente pela equipe da academia.');
        this.botaoWhatsApp(conteudo.whatsappBotao, 'Olá! Preciso de atendimento da recepção L.A Fitness sobre: ' + texto);
        return;
      }

      /* 6. roteiros prontos */
      for (const roteiro of (conteudo.roteiros || [])) {
        const casou = (roteiro.gatilhos || []).some((g) => t.includes(g));
        if (casou) {
          this.escrever(roteiro.resposta);
          if (roteiro.botao) this.botaoWhatsApp(roteiro.botao.texto, roteiro.botao.mensagem);
          return;
        }
      }

      /* 7. não reconheceu */
      this.escrever(conteudo.whatsappFallback || 'Vou te conectar com a recepção.');
      this.botaoWhatsApp(conteudo.whatsappBotao, 'Olá! Gostaria de informações sobre: ' + texto);

    }, 450);
  },

  usuario(texto) {
    const corpo = document.getElementById('chatBody');
    if (!corpo) return;
    const div = document.createElement('div');
    div.className = 'msg-bubble msg-user';
    div.textContent = texto;
    corpo.appendChild(div);
    corpo.scrollTop = corpo.scrollHeight;
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
function closeAdminModal() { const m = document.getElementById('modalAdmin'); if (m) m.classList.remove('active'); }
