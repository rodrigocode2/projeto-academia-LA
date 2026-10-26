// ==========================================
// L.A FITNESS — JAVASCRIPT PRINCIPAL
// Extraído do index.html para facilitar manutenção.
// ==========================================

    // Configurações e Dados L.A Fitness
    const LA_WHATSAPP = '5561991719246'; // Número Real L.A Fitness

    // Navegação de Telas no Protótipo
    function switchView(viewId) {
      document.querySelectorAll('.view-screen').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.ux-btn').forEach(el => el.classList.remove('active'));

      const target = document.getElementById('view-' + viewId);
      if (target) target.classList.add('active');

      // Atualiza botões da barra superior
      const btnIndex = ['splash', 'landing', 'login', 'app-dash', 'app-workout'].indexOf(viewId);
      if (btnIndex !== -1) {
        document.querySelectorAll('.ux-btn')[btnIndex].classList.add('active');
      }

      window.scrollTo(0, 0);
    }

    // Abertura do WhatsApp da L.A Fitness
    function openWhatsapp(text) {
      const url = `https://wa.me/${LA_WHATSAPP}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }

    // Login do Aluno
    function handleLogin(e) {
      e.preventDefault();
      switchView('app-dash');
    }

    // Marcação de Séries no Treino
    function toggleSet(element) {
      element.classList.toggle('done');
    }

    // Chatbot Flutuante Logic
    function toggleChatbot() {
      const win = document.getElementById('chatWindow');
      win.classList.toggle('open');
    }

    function handleChatKey(e) {
      if (e.key === 'Enter') sendChatMessage();
    }

    function sendQuickMsg(text) {
      document.getElementById('chatInput').value = text;
      sendChatMessage();
    }

    function sendChatMessage() {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;

      appendMsg(text, 'user');
      input.value = '';

      // Análise da resposta do Bot
      setTimeout(() => {
        const lower = text.toLowerCase();

        // COMANDO SECRETO PARA PAINEL ADMIN
        if (lower.includes('/admin') || lower.includes('painel') || lower === 'admin') {
          appendMsg('🔒 <strong>Comando de Administrador Detectado!</strong> Por favor, digite a senha de acesso:', 'bot');
          return;
        }

        if (text === '1234' || lower === 'senha123') {
          appendMsg('✅ <strong>Senha Correta!</strong> Abrindo Painel Administrativo L.A Fitness...', 'bot');
          document.getElementById('modalAdmin').classList.add('active');
          return;
        }

        // Questões Simples
        if (lower.includes('horario') || lower.includes('hora')) {
          appendMsg('⏰ <strong>Horários L.A Fitness:</strong><br>• Segunda a Sexta: 06h às 22h<br>• Sábado: 08h às 14h', 'bot');
        }
        else if (lower.includes('endereço') || lower.includes('onde') || lower.includes('local')) {
          appendMsg('📍 Estamos localizados no <strong>Parque Nova Friburgo B, Cidade Ocidental - GO</strong> (SQ 15, Q 08, Lt 12).', 'bot');
        }
        else if (lower.includes('plano') || lower.includes('valor') || lower.includes('preço')) {
          appendMsg('💪 Temos planos Mensais, Recorrentes e parcerias com <strong>Wellhub / Gympass</strong>. Venha fazer uma visita para conhecer a melhor condição!', 'bot');
        }
        // Transbordo para WhatsApp
        else if (lower.includes('cancel') || lower.includes('trancar') || lower.includes('boleto') || lower.includes('atendente') || lower.includes('recepção')) {
          appendMsg('📌 <strong>Atendimento Exclusivo da Recepção:</strong> Essa solicitação é resolvida diretamente pela equipe da academia.<br><br><button class="quick-btn" style="background:var(--la-accent-green); color:#000; font-weight:700;" onclick="openWhatsapp(\'Olá! Preciso de atendimento da recepção L.A Fitness sobre: ' + text + '\')"><i class="fa-brands fa-whatsapp"></i> Falar no WhatsApp</button>', 'bot');
        }
        else {
          appendMsg('Entendi! Para essa dúvida específica, te conecto diretamente com a nossa recepção no WhatsApp.', 'bot');
          appendMsg('<button class="quick-btn" style="background:var(--la-accent-green); color:#000; font-weight:700;" onclick="openWhatsapp(\'Olá! Gostaria de informações sobre: ' + text + '\')"><i class="fa-brands fa-whatsapp"></i> Falar no WhatsApp da L.A</button>', 'bot');
        }
      }, 500);
    }

    function appendMsg(text, sender) {
      const body = document.getElementById('chatBody');
      const div = document.createElement('div');
      div.className = `msg-bubble msg-${sender}`;
      div.innerHTML = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    function closeAdminModal() {
      document.getElementById('modalAdmin').classList.remove('active');
    }
