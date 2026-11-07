/* ==========================================================================
   L.A FITNESS — área do aluno (app com 3 abas)
   Entrar / Cadastrar · Treinos · Loja · Perfil (com gráfico de evolução)
   Depende de: dados.js e treinos.js
   ========================================================================== */

const LA_LEMBRAR = 'la_lembrar';

/* ==========================================================================
   ENTRAR E SAIR
   ========================================================================== */

function laSalvarSessao(aluno, lembrar) {
  try {
    const dados = JSON.stringify({ id: aluno.id });
    sessionStorage.setItem(LA_LEMBRAR, dados);
    if (lembrar) localStorage.setItem(LA_LEMBRAR, dados);
    else localStorage.removeItem(LA_LEMBRAR);
    laAbrirSessaoAluno(aluno.id);
    return true;
  } catch (e) { return false; }
}

function laRecuperarSessao() {
  try {
    const b = localStorage.getItem(LA_LEMBRAR) || sessionStorage.getItem(LA_LEMBRAR);
    if (!b) return null;
    const dados = JSON.parse(b);
    return laBuscarAluno ? laBuscarAluno(dados.id) : null;
  } catch (e) { return null; }
}

async function laSairDeVez() {
  try {
    localStorage.removeItem(LA_LEMBRAR);
    sessionStorage.removeItem(LA_LEMBRAR);
    sessionStorage.removeItem(LA_SESSAO);
  } catch (e) {
    console.error('Não foi possível limpar os dados locais da sessão:', e);
  }
  if (window.LADB) await window.LADB.auth.signOut();
}

/* ==========================================================================
   CADASTRO — entra como "aguardando liberação"
   ========================================================================== */

/* ==========================================================================
   ABAS DO APP
   ========================================================================== */

function laTrocarAbaApp(qual) {
  document.querySelectorAll('.aba-app').forEach(function (a) { a.classList.remove('ativa'); });
  document.querySelectorAll('[data-aba-app]').forEach(function (b) { b.classList.remove('ativo'); });

  const painel = document.getElementById('aba-' + qual);
  if (painel) painel.classList.add('ativa');

  const botao = document.querySelector('[data-aba-app="' + qual + '"]');
  if (botao) botao.classList.add('ativo');

  /* o gráfico precisa ser desenhado quando a aba aparece */
  if (qual === 'perfil' && LAAluno.aluno) {
    setTimeout(function () {
      laDesenharGrafico(LAAluno.aluno.id);
      if (typeof laPintarPlano === 'function') laPintarPlano(LAAluno.aluno.id);
    }, 30);
  }
}

/* ==========================================================================
   GRÁFICO DE EVOLUÇÃO (peso ao longo do tempo)
   ========================================================================== */

function laDesenharGrafico(alunoId) {
  const cv = document.querySelector('.js-grafico-evolucao');
  const legenda = document.querySelector('.js-legenda-grafico');
  if (!cv) return;

  const medidas = laListarMedidas(alunoId);
  const ctx = cv.getContext('2d');

  const px = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 320;
  const h = 190;
  cv.width = w * px;
  cv.height = h * px;
  ctx.setTransform(px, 0, 0, px, 0, 0);
  ctx.clearRect(0, 0, w, h);

  if (medidas.length < 2) {
    ctx.fillStyle = 'rgba(154,154,176,0.7)';
    ctx.font = '12px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Registre 2 medidas para ver sua evolução', w / 2, h / 2);
    if (legenda) legenda.innerHTML = '<span class="texto-suave">O gráfico aparece a partir do segundo registro.</span>';
    return;
  }

  const pontos = medidas.slice(-8).map(function (m) {
    return { peso: parseFloat(String(m.peso).replace(',', '.')) || 0, quando: m.quando };
  }).filter(function (p) { return p.peso > 0; });

  if (pontos.length < 2) return;

  const pesos = pontos.map(function (p) { return p.peso; });
  const max = Math.max.apply(null, pesos) + 1;
  const min = Math.min.apply(null, pesos) - 1;
  const faixa = (max - min) || 1;

  const pad = { esq: 34, dir: 12, topo: 18, baixo: 28 };
  const larg = w - pad.esq - pad.dir;
  const alt = h - pad.topo - pad.baixo;

  /* linhas de grade */
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.fillStyle = 'rgba(240,240,245,0.4)';
  ctx.font = '10px Montserrat, sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= 3; i++) {
    const y = pad.topo + (alt * i / 3);
    const valor = max - (faixa * i / 3);
    ctx.beginPath();
    ctx.moveTo(pad.esq, y);
    ctx.lineTo(w - pad.dir, y);
    ctx.stroke();
    ctx.fillText(valor.toFixed(1), pad.esq - 6, y + 3);
  }

  /* pontos */
  const coord = pontos.map(function (p, i) {
    return {
      x: pad.esq + (larg * i / (pontos.length - 1)),
      y: pad.topo + alt - ((p.peso - min) / faixa) * alt,
      peso: p.peso,
      quando: p.quando
    };
  });

  /* área preenchida */
  const grad = ctx.createLinearGradient(0, pad.topo, 0, pad.topo + alt);
  grad.addColorStop(0, 'rgba(229,9,20,0.28)');
  grad.addColorStop(1, 'rgba(229,9,20,0)');

  ctx.beginPath();
  ctx.moveTo(coord[0].x, pad.topo + alt);
  coord.forEach(function (c) { ctx.lineTo(c.x, c.y); });
  ctx.lineTo(coord[coord.length - 1].x, pad.topo + alt);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  /* linha */
  ctx.beginPath();
  coord.forEach(function (c, i) { i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); });
  ctx.strokeStyle = '#E50914';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  /* bolinhas e datas */
  ctx.textAlign = 'center';
  coord.forEach(function (c, i) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#E50914';
    ctx.fill();
    ctx.strokeStyle = '#0b0b0d';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (pontos.length <= 5 || i % 2 === 0) {
      const d = new Date(c.quando);
      ctx.fillStyle = 'rgba(240,240,245,0.45)';
      ctx.font = '10px Montserrat, sans-serif';
      ctx.fillText(d.getDate().toString().padStart(2, '0') + '/' +
                   (d.getMonth() + 1).toString().padStart(2, '0'), c.x, h - 8);
    }
  });

  /* legenda com variação */
  if (legenda) {
    const primeiro = pesos[0], ultimo = pesos[pesos.length - 1];
    const dif = (ultimo - primeiro).toFixed(1);
    const sinal = dif > 0 ? '+' : '';
    const cor = dif < 0 ? 'var(--la-accent-green)' : (dif > 0 ? 'var(--la-red)' : 'var(--la-text-muted)');
    legenda.innerHTML =
      '<span class="texto-suave">' + pesos.length + ' registros · ' +
      '<b style="color:' + cor + '">' + sinal + dif + ' kg</b> desde o primeiro</span>';
  }
}

/* ==========================================================================
   PLANO DO ALUNO
   ========================================================================== */

function laPintarPlano(alunoId) {
  const casa = document.querySelector('.js-plano');
  if (!casa) return;

  const a = laBuscarAluno(alunoId);
  if (!a) return;

  const inicio = a.criadoEm ? new Date(a.criadoEm) : new Date();
  const vence = new Date(inicio);
  vence.setMonth(vence.getMonth() + 1);

  const hoje = new Date();
  const dias = Math.ceil((vence - hoje) / 86400000);

  const plano = a.plano && a.plano !== 'Aguardando' ? a.plano : 'Mensal';
  const cor = dias > 7 ? 'var(--la-accent-green)' : (dias > 0 ? '#ffb020' : 'var(--la-red)');
  const situacao = dias > 7 ? 'Em dia' : (dias > 0 ? 'Vence em breve' : 'Vencido');

  casa.innerHTML =
    '<div class="cartao-plano">' +
      '<div class="plano-topo">' +
        '<div><b>Plano ' + laEscapar(plano) + '</b>' +
        '<span>Desde ' + inicio.toLocaleDateString('pt-BR') + '</span></div>' +
        '<span class="pilula-status" style="color:' + cor + '; border-color:' + cor + '">' +
          situacao + '</span>' +
      '</div>' +
      '<div class="plano-linha">' +
        '<span>Válido até</span><b>' + vence.toLocaleDateString('pt-BR') + '</b>' +
      '</div>' +
      '<div class="plano-linha">' +
        '<span>Dias restantes</span><b>' + (dias > 0 ? dias + ' dias' : 'expirado') + '</b>' +
      '</div>' +
      '<p class="texto-suave" style="margin-top:10px">Pagamento e renovação na recepção da L.A Fitness.</p>' +
    '</div>';
}

/* ==========================================================================
   LOJA
   ========================================================================== */

const LA_PRODUTOS = [
  { id: 'p1', nome: 'Whey Protein 900g', preco: 189.9, categoria: 'Suplemento', icone: 'fa-jar' },
  { id: 'p2', nome: 'Creatina 300g', preco: 129.9, categoria: 'Suplemento', icone: 'fa-jar' },
  { id: 'p3', nome: 'Pré-treino 300g', preco: 99.9, categoria: 'Suplemento', icone: 'fa-jar' },
  { id: 'p4', nome: 'Camiseta L.A Fitness', preco: 69.9, categoria: 'Vestuário', icone: 'fa-shirt' },
  { id: 'p5', nome: 'Regata Dry Fit', preco: 79.9, categoria: 'Vestuário', icone: 'fa-shirt' },
  { id: 'p6', nome: 'Garrafa 1L', preco: 49.9, categoria: 'Acessório', icone: 'fa-bottle-water' },
  { id: 'p7', nome: 'Luva de treino', preco: 59.9, categoria: 'Acessório', icone: 'fa-hand' },
  { id: 'p8', nome: 'Corda de pular', preco: 39.9, categoria: 'Acessório', icone: 'fa-link' }
];

const LA_PEDIDOS = 'la_pedidos';

function laPintarLoja(alunoId) {
  const casa = document.querySelector('.js-loja');
  if (!casa) return;

  casa.innerHTML = LA_PRODUTOS.map(function (p) {
    return '<div class="item-loja">' +
             '<div class="icone-loja"><i class="fa-solid ' + p.icone + '"></i></div>' +
             '<div class="info-loja">' +
               '<b>' + laEscapar(p.nome) + '</b>' +
               '<span>' + laEscapar(p.categoria) + '</span>' +
               '<strong>R$ ' + p.preco.toFixed(2).replace('.', ',') + '</strong>' +
             '</div>' +
             '<button class="btn-reservar js-reservar" data-id="' + p.id + '">Reservar</button>' +
           '</div>';
  }).join('');

  casa.querySelectorAll('.js-reservar').forEach(function (b) {
    b.addEventListener('click', function () {
      const prod = LA_PRODUTOS.find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (!prod) return;

      try {
        const bruto = localStorage.getItem(LA_PEDIDOS);
        const lista = bruto ? JSON.parse(bruto) : [];
        lista.push({
          alunoId: alunoId,
          aluno: (laBuscarAluno(alunoId) || {}).nome || '',
          produto: prod.nome,
          preco: prod.preco,
          status: 'reservado',
          quando: new Date().toISOString()
        });
        localStorage.setItem(LA_PEDIDOS, JSON.stringify(lista));
      } catch (e) {}

      b.textContent = 'Reservado ✓';
      b.disabled = true;
      b.classList.add('reservado');
    });
  });
}

/* ==========================================================================
   LIGAÇÕES DA TELA DE ENTRADA
   ========================================================================== */

function laLigarEntrada() {
  /* alternador entrar/cadastrar */
  document.querySelectorAll('.aba-entrada').forEach(function (b) {
    b.addEventListener('click', function () {
      const qual = b.getAttribute('data-aba');
      document.querySelectorAll('.aba-entrada').forEach(function (x) { x.classList.remove('ativa'); });
      document.querySelectorAll('.painel-entrada').forEach(function (x) { x.classList.remove('ativa'); });
      b.classList.add('ativa');
      const painel = document.getElementById('painel-' + qual);
      if (painel) painel.classList.add('ativa');
    });
  });

  /* login */
  const formLogin = document.getElementById('form-login-aluno');
  if (formLogin && !formLogin._ligado) {
    formLogin._ligado = true;
    formLogin.addEventListener('submit', async function (e) {
      e.preventDefault();
      const usuario = document.getElementById('login-usuario').value;
      const senha = document.getElementById('login-senha').value;
      const aviso = document.getElementById('login-aviso');
      const lembrar = document.getElementById('login-lembrar');

      const botao = formLogin.querySelector('[type="submit"]');
      if (botao) botao.disabled = true;
      try {
        const aluno = await LADB.auth.studentLogin(usuario, senha, lembrar ? lembrar.checked : false);
        if (aviso) aviso.classList.add('hidden');
        laSalvarSessao(aluno, lembrar ? lembrar.checked : false);
        LASite.entrarApp(aluno);
      } catch (error) {
        if (aviso) {
          aviso.textContent = error.message || 'Não foi possível entrar. Tente novamente.';
          aviso.classList.remove('hidden');
        }
      } finally {
        if (botao) botao.disabled = false;
      }
    });
  }

  const pedirAcesso = document.querySelector('.js-pedir-acesso');
  if (pedirAcesso && !pedirAcesso._ligado) {
    pedirAcesso._ligado = true;
    pedirAcesso.addEventListener('click', function () {
      LAWhatsApp.abrir('Olá! Gostaria de solicitar meu acesso à Área do Aluno da L.A Fitness.');
    });
  }

  /* esqueci a senha */
  const esqueci = document.querySelector('.js-esqueci');
  if (esqueci && !esqueci._ligado) {
    esqueci._ligado = true;
    esqueci.addEventListener('click', function () {
      alert('Fale com a recepção da L.A Fitness para redefinir sua senha.\n' +
            'WhatsApp da academia: (61) 9 9266-3142');
    });
  }

  /* abas do app */
  document.querySelectorAll('[data-aba-app]').forEach(function (b) {
    if (b._ligado) return;
    b._ligado = true;
    b.addEventListener('click', function () { laTrocarAbaApp(b.getAttribute('data-aba-app')); });
  });

  /* sair */
  document.querySelectorAll('.js-sair-aluno').forEach(function (b) {
    if (b._ligado) return;
    b._ligado = true;
    b.addEventListener('click', function () {
      if (!confirm('Sair da sua conta neste aparelho?')) return;
      laSairDeVez().then(function () {
        window.location.href = 'index.html';
      }).catch(function (error) {
        alert(error.message || 'Não foi possível encerrar a sessão.');
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () { laLigarEntrada(); });
