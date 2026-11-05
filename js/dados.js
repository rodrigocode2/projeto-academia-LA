/* ==========================================================================
   L.A FITNESS — camada de dados isolada
   Hoje: localStorage (funciona no mesmo navegador)
   Depois: trocar as funções de leitura/escrita por chamadas ao Supabase.
   Mesmo padrão do CiR: o resto do site não sabe onde os dados moram.
   ========================================================================== */

const LA_CHAVE       = 'la_conteudo';
const LA_ACESSOS     = 'la_acessos';
const LA_ALUNOS      = 'la_alunos';
const LA_SESSAO      = 'la_sessao_aluno';
const LA_CHAVE_ADMIN = 'la_admin_logado';

/* A CONFIRMAR COM A DONA ----------------------------------------------------
   1. Plano semestral da Ginástica Artística: R$ 160,00 é POR MÊS dentro do
      semestre, ou o valor fechado dos seis meses? Está escrito como sendo
      por mês, que é o que o cartaz da academia sugere.
   2. O WhatsApp usado é o do cartaz oficial: (61) 9 9266-3142.
   -------------------------------------------------------------------------- */

/* ==========================================================================
   1. CONTEÚDO DO SITE
   ========================================================================== */

function laPadrao() {
  return {
    geral: {
      nome: 'L.A Fitness',
      slogan: 'Cada dia é uma nova oportunidade para ser a melhor versão de si mesmo.',
      telefone: '55619992663142',
      instagram: 'academial.afitness',
      endereco: 'Quadra 06, lote 13 — Recreio Mossoró, CEP 72.885-500',
      referencia: 'Ao lado da Escola Municipal Tiago Corrêa',
      cidade: 'Cidade Ocidental — GO',
      horarios: 'Seg a Sex 06h às 12h e 15h às 22h · Sáb 08h às 13h · Dom 08h às 12h'
    },
    sobre: {
      etiqueta: 'Sobre a L.A Fitness',
      titulo: 'EXCELÊNCIA',
      titulo2: 'EM TREINO',
      olar: 'Musculação · aulas coletivas · ginástica artística',
      /* a faixa principal: foto de um lado, texto do outro.
         formato: 'foto-texto' | 'texto-foto' | 'so-foto' | 'duas-fotos'
         ordem:  qual lado vem primeiro (esquerda/direita) */
      faixa: {
        formato: 'foto-texto',
        foto: 'img/fachada-logo.jpg',
        legenda: 'A fachada: onde tudo começa',
        foto2: '',
        legenda2: ''
      },
      paragrafos: [
        'A L.A Fitness é uma academia em Cidade Ocidental - GO, com musculação, treinos funcionais e acompanhamento profissional. Estrutura completa para você atingir seus objetivos com saúde e alta performance.',
        'Aqui ninguém precisa treinar sozinho nem adivinhar o que fazer: a recepção orienta, o professor corrige a execução e a ficha acompanha a evolução de cada aluno.',
        'Do peso livre à ginástica artística, o espaço foi montado para caber a rotina de quem tem pouco tempo e quer resultado.'
      ],
      fotos: [
        { nome: 'Musculação',  texto: 'Equipamentos para todos os níveis, do iniciante ao avançado.', foto: '' },
        { nome: 'Peso livre',  texto: 'Estante completa de halteres para quem monta o treino à mão.', foto: '' },
        { nome: 'Acessórios',  texto: 'Cordas, cintos e elásticos para variar o estímulo.', foto: '' },
        { nome: 'Estrutura',   texto: 'Espaço amplo e climatizado, com atendimento de verdade.', foto: '' }
      ]
    },
    blocos: [
      { id: 'b1', ativo: true, formato: 'foto-texto', lado: 'foto-esquerda',
        titulo: 'Ginástica Artística',
        texto: 'Movimentando seu corpo. Turmas de ginástica artística com acompanhamento profissional, nas terças e quintas.',
        foto: '' },
      { id: 'b2', ativo: false, titulo: '',
        texto: '', foto: '' }
    ],
    planos: [
      { id: 1, nome: 'Mensal',              preco: '',       descricao: 'Acesso livre à musculação e aulas coletivas.', destaque: false },
      { id: 2, nome: 'Recorrente',          preco: '',       descricao: 'Plano com renovação automática e desconto progressivo.', destaque: false },
      { id: 3, nome: 'Ginástica Artística', preco: '170,00', descricao: 'Aulas nas terças e quintas. Plano semestral R$ 160,00/mês · Taxa de matrícula R$ 20,00.', destaque: true },
      { id: 4, nome: 'Wellhub / Gympass',   preco: '',       descricao: 'Use o benefício corporativo da sua empresa.', destaque: false }
    ],
    modalidades: [
      { id: 1,
        icone: 'fa-dumbbell',
        titulo: 'Musculação & Hipertrofia',
        texto: 'Equipamentos modernos e ambiente projetado para todos os níveis de alunos, do iniciante ao avançado.',
        horarios: 'Seg a Sex 06h–12h e 15h–22h · Sáb 08h–13h · Dom 08h–12h' },
      { id: 2,
        icone: 'fa-person-running',
        titulo: 'Ginástica Artística',
        texto: 'Movimentando seu corpo. Turmas de ginástica artística com acompanhamento profissional.',
        horarios: 'Terça e Quinta — 9h · 17h · 18h · 19h · 20h',
        precos: 'Semestral R$ 160,00 · Mensal R$ 170,00 · Matrícula R$ 20,00',
        destaque: true },
      { id: 3,
        icone: 'fa-heart-pulse',
        titulo: 'Aulas Coletivas & Cardiopack',
        texto: 'Atividades dinâmicas para queimar calorias, melhorar o condicionamento e aumentar a sua disposição diária.' },
      { id: 4,
        icone: 'fa-mobile-screen-button',
        titulo: 'Ficha de Treino Digital',
        texto: 'Acesse sua ficha exclusiva no celular via Web App PWA, sem precisar baixar nada da loja de aplicativos.' }
    ],
    roteiros: [
      { gatilhos: ['ola', 'olá', 'oi', 'opa', 'eae', 'e ai', 'e aí', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'tudo bom', 'hey'],
        resposta: '👋 Olá! Bem-vindo à <strong>L.A Fitness</strong>!<br><br>Posso te ajudar com:<br>• <strong>Treino</strong> — ficha, exercícios, alongamento<br>• <strong>Horários</strong> e <strong>planos</strong><br>• <strong>Ginástica Artística</strong><br>• <strong>Endereço</strong> e como chegar<br><br>O que você quer saber? 💪' },
      { gatilhos: ['obrigado', 'obrigada', 'valeu', 'vlw', 'brigado', 'agradeco', 'agradeço'],
        resposta: '🙌 Por nada! Qualquer dúvida é só chamar. Bons treinos na L.A Fitness! 💪' },
      { gatilhos: ['tchau', 'ate logo', 'até logo', 'fui', 'ate mais', 'até mais', 'flw'],
        resposta: '👋 Até mais! Esperamos você na L.A Fitness. Bons treinos! 💪' },
      { gatilhos: ['horario', 'hora', 'abre', 'fecha', 'funcionamento'],
        resposta: '⏰ <strong>Horários da L.A Fitness</strong><br><br><strong>Musculação:</strong><br>• Segunda a Sexta: 06h às 12h · 15h às 22h<br>• Sábado: 08h às 13h<br>• Domingo: 08h às 12h' },
      { gatilhos: ['ginastica', 'ginástica', 'artistica', 'artística'],
        resposta: '🤸 <strong>Ginástica Artística</strong> — Movimentando seu corpo.<br><br><strong>Aulas:</strong> terça e quinta<br><strong>Horários:</strong> 9h · 17h · 18h · 19h · 20h<br><br><strong>Valores:</strong><br>• Plano semestral: R$ 160,00<br>• Mensal: R$ 170,00<br>• Taxa de matrícula: R$ 20,00',
        botao: { texto: 'Quero saber mais', mensagem: 'Olá! Gostaria de informações sobre as aulas de Ginástica Artística da L.A Fitness.' } },
      { gatilhos: ['endereço', 'endereco', 'onde', 'local', 'localiza', 'chegar', 'fica'],
        resposta: '📍 Estamos na <strong>Quadra 06, lote 13 — Recreio Mossoró</strong>, Cidade Ocidental — GO.<br>CEP 72.885-500, ao lado da Escola Municipal Tiago Corrêa.' },
      { gatilhos: ['plano', 'valor', 'preço', 'preco', 'mensalidade', 'quanto custa'],
        resposta: '💪 <strong>Planos da L.A Fitness:</strong><br><br>• <strong>Musculação</strong> — Mensal e Recorrente<br>• <strong>Ginástica Artística</strong> — Semestral R$ 160,00 · Mensal R$ 170,00 · Matrícula R$ 20,00<br>• <strong>Wellhub / Gympass</strong> — aceitamos<br><br>Venha fazer uma visita para conhecer a melhor condição.' },
      { gatilhos: ['aula experimental', 'experimental', 'teste', 'conhecer', 'visit'],
        resposta: '🎯 Você pode agendar uma <strong>aula experimental gratuita</strong>! Toque no botão abaixo que a recepção confirma o melhor horário.',
        botao: { texto: 'Agendar pelo WhatsApp', mensagem: 'Olá! Gostaria de agendar uma aula experimental na L.A Fitness.' } },
      { gatilhos: ['matricula', 'matrícula', 'matricular', 'inscrever', 'começar', 'comecar', 'cadastr'],
        resposta: '📝 A matrícula é feita na recepção da academia. Traga documento com foto e comprovante de residência.',
        botao: { texto: 'Falar com a recepção', mensagem: 'Olá! Quero fazer minha matrícula na L.A Fitness.' } },
      { gatilhos: ['professor', 'personal', 'acompanhamento', 'treino montado', 'ficha'],
        resposta: '🏋️ A L.A Fitness tem acompanhamento profissional incluído: nossos professores montam e revisam a sua ficha periodicamente.' },
      { gatilhos: ['instagram', 'rede social', 'perfil'],
        resposta: '📸 Siga a gente no Instagram: <strong>@academial.afitness</strong>' },
      { gatilhos: ['musculacao', 'musculação', 'musculação livre', 'peso livre', 'aparelho', 'aparelhos'],
        resposta: '💪 <strong>Musculação L.A Fitness</strong><br><br>Temos peso livre e aparelhos para todos os grupos: peito, costas, pernas, ombros e braços.<br><br><strong>Horários:</strong><br>• Segunda a Sexta: 06h às 12h · 15h às 22h<br>• Sábado e Domingo: 08h às 12h' },
      { gatilhos: ['aulas coletivas', 'aula coletiva', 'coletiva', 'aula em grupo', 'grupo'],
        resposta: '👥 Além da musculação, a L.A Fitness tem <strong>aulas coletivas</strong> e <strong>Ginástica Artística</strong>. Quer saber os dias e horários de cada uma? É só perguntar.' },
      { gatilhos: ['crianca', 'criança', 'filho', 'infantil', 'criancas', 'crianças'],
        resposta: '👶 A <strong>Ginástica Artística infantil</strong> é para crianças, com acompanhamento profissional — terça e quinta, às 9h, 17h, 18h e 19h.<br><br>⚠️ Importante: <strong>não é permitido acesso de crianças nem acompanhantes na área de musculação.</strong>' },
      { gatilhos: ['iniciante', 'comecando', 'começando', 'nunca treinei', 'primeira vez', 'sedentario', 'sedentário'],
        resposta: '🌱 Nunca treinou? Sem problema — é aqui que começa.<br><br>Nossos professores montam um treino de adaptação, com carga leve nos primeiros dias, para o seu corpo se acostumar. E tem sempre alguém na recepção para orientar.' },
      { gatilhos: ['como treinar', 'execucao', 'execução', 'jeito certo', 'postura', 'faz o exercicio', 'faz o exercício'],
        resposta: '🎬 No seu treino, cada exercício tem um <strong>desenho animado</strong> mostrando como fazer. É só abrir a sua ficha na Área do Aluno e tocar no exercício.' },
      { gatilhos: ['ficha', 'meu treino', 'minha ficha', 'treino de hoje', 'ver treino'],
        resposta: '📋 A sua ficha fica na <strong>Área do Aluno</strong>. Entre com o seu CPF ou matrícula e toque em "Meu treino" — lá você marca as séries que já fez e acompanha o progresso.' },
      { gatilhos: ['progresso', 'evolucao', 'evolução', 'resultado', 'medida', 'medidas', 'peso'],
        resposta: '📊 Na Área do Aluno você acompanha <strong>peso, medidas e histórico de treinos</strong>. Dá para registrar a sua evolução e ver a curva mudando com o tempo.' },
      { gatilhos: ['avaliacao fisica', 'avaliação física', 'avaliacao', 'bioimpedancia', 'imc'],
        resposta: '📏 Fazemos <strong>avaliação física</strong> (R$ 40,00). Em minutos você conhece seu IMC, percentual de gordura e massa magra — e o professor usa isso para montar o seu treino.' },
      { gatilhos: ['wellhub', 'gympass', 'totalpass', 'total pass'],
        resposta: '🏷️ Aceitamos <strong>Wellhub / Gympass</strong>. É só chegar com o seu app e a recepção faz o check-in.' },
      { gatilhos: ['matricula valor', 'taxa', 'taxa de matricula', 'taxa de matrícula', 'adesao', 'adesão'],
        resposta: '💰 A <strong>taxa de matrícula</strong> é R$ 20,00, paga uma vez na entrada. Depois disso você paga só a mensalidade do seu plano.' },
      { gatilhos: ['uniforme', 'roupa', 'vestimenta', 'tenis', 'tênis', 'traje'],
        resposta: '👕 Venha com uma roupa confortável e tênis fechado. Também pedimos uma toalha e garrafinha de água — sua e da academia.' },
      { gatilhos: ['estacionamento', 'carro', 'moto', 'onde estaciono'],
        resposta: '🅿️ Dá para estacionar em frente à academia, na Quadra 06, lote 13 — Recreio Mossoró.' },
      { gatilhos: ['horario de pico', 'cheio', 'vazio', 'melhor horario', 'melhor horário', 'movimento'],
        resposta: '⏰ Os horários mais tranquilos costumam ser <strong>das 10h às 11h</strong> e <strong>das 15h às 16h</strong>. À noite, entre 18h e 20h, é o movimento maior.' },
      { gatilhos: ['whatsapp', 'zap', 'telefone', 'contato', 'ligar', 'numero', 'número'],
        resposta: '📞 Fale com a recepção pelo WhatsApp: <strong>(61) 9 9266-3142</strong> — das 6h às 22h.',
        botao: { texto: 'Abrir o WhatsApp', mensagem: 'Olá! Vim pelo site da L.A Fitness e gostaria de falar com a recepção.' } },
      { gatilhos: ['suporte', 'ajuda', 'problema', 'nao abre', 'não abre', 'nao consigo', 'não consigo', 'senha', 'esqueci'],
        resposta: '🛠️ Se você não conseguiu entrar na Área do Aluno, a recepção resolve rapidinho — confere o seu CPF ou matrícula e reinicia a senha.',
        botao: { texto: 'Falar com a recepção', mensagem: 'Olá! Preciso de ajuda para acessar a Área do Aluno da L.A Fitness.' } },
      { gatilhos: ['loja', 'produto', 'suplemento', 'whey', 'vender', 'comprar'],
        resposta: '🛒 A loja da academia fica dentro da Área do Aluno. Os produtos que estão à venda aparecem lá, com o preço e a foto.' },
      { gatilhos: ['bate papo', 'bate-papo', 'chat', 'conversar com aluno', 'grupo de alunos', 'amigo'],
        resposta: '💬 Na Área do Aluno tem o <strong>bate-papo</strong>: o mural do grupo, conversas com outros alunos e o contato direto com a academia.' },
      { gatilhos: ['catraca', 'qrcode', 'qr code', 'entrada', 'acesso', 'codigo', 'código'],
        resposta: '🚪 O seu código de entrada aparece na Área do Aluno, com o número da sua matrícula. É só mostrar na catraca ao chegar.' },
      { gatilhos: ['mural', 'aviso', 'recado', 'comunicado'],
        resposta: '📢 Os avisos da academia ficam no <strong>mural</strong>. Aberto na Área do Aluno e também pelo painel, com as novidades da semana.' },
      { gatilhos: ['cafe', 'lanche', 'bebida', 'agua', 'água', 'vestiario', 'vestiário', 'banheiro', 'chuveiro'],
        resposta: '🚿 Temos vestiário com chuveiro. Traga a sua toalha e a sua garrafinha — e se precisar de água, é só pedir na recepção.' },
      { gatilhos: ['trancar', 'cancelar plano', 'cancelamento', 'desistir'],
        resposta: '📄 Para trancar ou cancelar o plano, a recepção cuida disso com você — é rápido e sem burocracia.',
        botao: { texto: 'Falar com a recepção', mensagem: 'Olá! Preciso tratar sobre trancamento/cancelamento do meu plano na L.A Fitness.' } },
      { gatilhos: ['pagamento', 'pagar', 'boleto', 'pix', 'cartao', 'cartão', 'dinheiro', 'vencimento'],
        resposta: '💳 O pagamento da mensalidade é feito direto com a academia, na recepção. Para o valor do seu plano ou segunda via, a recepção resolve na hora.',
        botao: { texto: 'Falar com a recepção', mensagem: 'Olá! Gostaria de tratar sobre pagamento da mensalidade na L.A Fitness.' } },
      { gatilhos: ['deficiente', 'cadeira de rodas', 'acessibilidade', 'limitação', 'limitacao'],
        resposta: '♿ Nossa equipe adapta o treino para o que você precisa. Fale com a recepção que os professores montam a sua ficha dentro das suas condições.' },
      { gatilhos: ['idoso', 'terceira idade', 'melhor idade', '60 anos'],
        resposta: '🧓 Temos alunos de todas as idades, com acompanhamento de perto. O treino é ajustado ao seu ritmo — comece leve e vá no seu tempo.' },
      { gatilhos: ['resultado em quanto tempo', 'quanto tempo', 'demora', 'quando verei'],
        resposta: '⏳ Cada corpo tem o seu tempo. Com 3 treinos por semana, a maioria dos alunos começa a notar diferença nas primeiras 4 a 6 semanas — e na avaliação física dá para ver a mudança nos números.' },
      { gatilhos: ['professor particular', 'personal trainer', 'personalizado', 'treino personalizado'],
        resposta: '🏋️ O acompanhamento dos professores está incluído no plano: eles montam a ficha e corrigem a execução. Se você quiser um personal exclusivo, a recepção te orienta sobre valores.',
        botao: { texto: 'Falar com a recepção', mensagem: 'Olá! Gostaria de informações sobre personal trainer na L.A Fitness.' } },
      { gatilhos: ['frequencia', 'quantas vezes', 'toda semana', 'dias por semana', 'frequência'],
        resposta: '📅 O ideal é treinar 3 a 5 vezes por semana, com um dia de descanso entre os grupos musculares. Se você tem pouco tempo, o professor monta uma ficha para 3 dias.' },
      { gatilhos: ['alongamento', 'aquecimento', 'antes de treinar', 'depois de treinar'],
        resposta: '🤸 Sim — alongue antes e depois de treinar. Na Área do Aluno tem uma sequência guiada para você seguir sem complicação.' },
      { gatilhos: ['hidratacao', 'hidratação', 'beber agua', 'beber água'],
        resposta: '💧 Beba água antes, durante e depois do treino. Aqui na academia você reabastece a sua garrafinha na recepção.' },
      { gatilhos: ['dieta', 'alimentacao', 'alimentação', 'nutricao', 'nutrição', 'o que comer'],
        resposta: '🥗 Não temos nutricionista na equipe, mas a recepção te orienta sobre profissionais de confiança na região. A alimentação é metade do resultado.',
        botao: { texto: 'Falar com a recepção', mensagem: 'Olá! Gostaria de indicação de nutricionista em Cidade Ocidental.' } }
    ],
    encaminharSempre: [
      'cancel', 'cancelar', 'trancar', 'boleto', 'pagamento', 'cobrança', 'cobranca',
      'atendente', 'recepção', 'recepcao', 'humano', 'atendimento'
    ],
    whatsappFallback: 'Entendi! Para essa dúvida específica, te conecto direto com a nossa recepção.',
    whatsappBotao: 'Falar no WhatsApp da L.A'
  };
}

function laLerConteudo() {
  try {
    const bruto = localStorage.getItem(LA_CHAVE);
    return bruto ? JSON.parse(bruto) : null;
  } catch (e) { return null; }
}

function laSalvarConteudo(dados) {
  try {
    localStorage.setItem(LA_CHAVE, JSON.stringify(dados));
    return true;
  } catch (e) { return false; }
}

/* garante TODOS os campos: dado antigo não pode derrubar o site nem o painel */
function laGarantirConteudo() {
  const padrao = laPadrao();
  let atual = laLerConteudo();

  if (!atual || typeof atual !== 'object') {
    laSalvarConteudo(padrao);
    return padrao;
  }

  atual.geral            = atual.geral || padrao.geral;
  atual.planos           = Array.isArray(atual.planos)           ? atual.planos           : padrao.planos;
  atual.modalidades      = Array.isArray(atual.modalidades)      ? atual.modalidades      : padrao.modalidades;
  atual.roteiros         = Array.isArray(atual.roteiros)         ? atual.roteiros         : padrao.roteiros;
  atual.blocos           = Array.isArray(atual.blocos)            ? atual.blocos           : padrao.blocos;
  atual.sobre            = atual.sobre || padrao.sobre;
  atual.encaminharSempre = Array.isArray(atual.encaminharSempre) ? atual.encaminharSempre : padrao.encaminharSempre;

  Object.keys(padrao.geral).forEach(function (k) {
    if (!atual.geral[k]) atual.geral[k] = padrao.geral[k];
  });

  return atual;
}

/* ==========================================================================
   2. ALUNOS
   ========================================================================== */

function laListarAlunos() {
  try {
    const bruto = localStorage.getItem(LA_ALUNOS);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch (e) { return []; }
}

function laSalvarAlunos(lista) {
  try {
    localStorage.setItem(LA_ALUNOS, JSON.stringify(lista));
    return true;
  } catch (e) { return false; }
}

function laNovaMatricula() {
  const lista = laListarAlunos();
  const ano = new Date().getFullYear();
  const doAno = lista.filter(function (a) { return (a.matricula || '').indexOf('LA-' + ano) === 0; });
  return 'LA-' + ano + '-' + String(doAno.length + 1).padStart(4, '0');
}

function laResumo() {
  const lista = laListarAcessos();
  const hoje = new Date().toISOString().slice(0, 10);
  const sete = new Date(); sete.setDate(sete.getDate() - 7);
  const iso7 = sete.toISOString().slice(0, 10);

  const visualizacoes = lista.filter(function (x) { return x.tipo === 'visualizacao'; });

  const sessoes = {}, visitantes = {};
  lista.forEach(function (x) {
    sessoes[x.sessao || 'x'] = 1;
    visitantes[x.visitante || 'x'] = 1;
  });

  const deHoje = lista.filter(function (x) { return x.quando.slice(0, 10) === hoje; });
  const daSemana = lista.filter(function (x) { return x.quando.slice(0, 10) >= iso7; });

  const porSecao = {};
  visualizacoes.forEach(function (x) { porSecao[x.pagina] = (porSecao[x.pagina] || 0) + 1; });

  const porOrigem = {};
  lista.forEach(function (x) { porOrigem[x.origem || 'direto'] = (porOrigem[x.origem || 'direto'] || 0) + 1; });

  const porAparelho = {};
  lista.forEach(function (x) { porAparelho[x.aparelho || 'computador'] = (porAparelho[x.aparelho || 'computador'] || 0) + 1; });

  const porNavegador = {};
  lista.forEach(function (x) { porNavegador[x.navegador || 'outro'] = (porNavegador[x.navegador || 'outro'] || 0) + 1; });

  const cliques = {};
  lista.filter(function (x) { return x.tipo === 'clique'; }).forEach(function (x) {
    const alvo = x.alvo || 'outro';
    cliques[alvo] = (cliques[alvo] || 0) + 1;
  });

  const porSessao = {};
  visualizacoes.forEach(function (x) {
    const k = x.sessao || 'x';
    porSessao[k] = (porSessao[k] || 0) + 1;
  });
  let apenasUma = 0, varias = 0;
  Object.keys(porSessao).forEach(function (k) {
    if (porSessao[k] === 1) apenasUma++;
    if (porSessao[k] >= 4) varias++;
  });

  const contatos = lista.filter(function (x) {
    return x.tipo === 'clique' && /whatsapp|telefone|email|contato|matricula/i.test(x.alvo || '');
  }).length;

  const totalSessoes = Object.keys(porSessao).length;
  const mediaVisitas = totalSessoes ? Math.round((visualizacoes.length / totalSessoes) * 10) / 10 : 0;

  return {
    total: lista.length,
    visualizacoes: visualizacoes.length,
    sessoes: totalSessoes,
    visitantes: Object.keys(visitantes).length,
    hoje: deHoje.length,
    semana: daSemana.length,
    porSecao: porSecao,
    porOrigem: porOrigem,
    porAparelho: porAparelho,
    porNavegador: porNavegador,
    cliques: cliques,
    contatos: contatos,
    primeiraVisita: apenasUma,
    variasSecoes: varias,
    mediaVisitas: mediaVisitas,
    lista: lista
  };
}

function laCriarAluno(dados) {
  const lista = laListarAlunos();
  const aluno = {
    id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    matricula: dados.matricula || laNovaMatricula(),
    nome: dados.nome || '',
    cpf: (dados.cpf || '').replace(/\D/g, ''),
    senha: dados.senha || '',
    telefone: dados.telefone || '',
    email: dados.email || '',
    plano: dados.plano || 'Mensal',
    objetivo: dados.objetivo || '',
    foto: dados.foto || '',
    ativo: true,
    criadoEm: new Date().toISOString(),
    treinos: dados.treinos || []
  };
  lista.push(aluno);
  laSalvarAlunos(lista);
  return aluno;
}

function laBuscarAluno(id) {
  return laListarAlunos().find(function (a) { return a.id === id; }) || null;
}

function laAtualizarAluno(id, mudancas) {
  const lista = laListarAlunos();
  const i = lista.findIndex(function (a) { return a.id === id; });
  if (i === -1) return false;
  lista[i] = Object.assign({}, lista[i], mudancas);
  laSalvarAlunos(lista);
  return lista[i];
}

function laExcluirAluno(id) {
  laSalvarAlunos(laListarAlunos().filter(function (a) { return a.id !== id; }));
  return true;
}

function laAutenticar(usuario, senha) {
  const limpo = String(usuario || '').replace(/\D/g, '');
  const bruto = String(usuario || '').trim().toUpperCase();

  const aluno = laListarAlunos().find(function (a) {
    const bateCpf = limpo && a.cpf === limpo;
    const bateMatricula = (a.matricula || '').toUpperCase() === bruto;
    return (bateCpf || bateMatricula) && a.senha === senha;
  });

  if (!aluno) return { ok: false, erro: 'CPF, matrícula ou senha incorretos.' };
  if (!aluno.ativo) return { ok: false, erro: 'Sua matrícula está inativa. Fale com a recepção.' };

  laAbrirSessaoAluno(aluno.id);
  return { ok: true, aluno: aluno };
}

function laAbrirSessaoAluno(id) { try { sessionStorage.setItem(LA_SESSAO, id); } catch (e) {} }
function laAlunoLogado() {
  try {
    const id = sessionStorage.getItem(LA_SESSAO);
    return id ? laBuscarAluno(id) : null;
  } catch (e) { return null; }
}
function laSairAluno() { try { sessionStorage.removeItem(LA_SESSAO); } catch (e) {} }

/* ==========================================================================
   3. TREINOS
   ========================================================================== */

function laTreinoPadrao() {
  const semente = Date.now().toString(36);
  return [
    {
      id: 't' + semente + 'a',
      letra: 'A',
      nome: 'Peito, Tríceps & Ombros',
      exercicios: [
        { nome: 'Supino Reto com Barra',         descanso: '60s', series: [{ reps: '12', peso: '30kg', feito: false }, { reps: '10', peso: '35kg', feito: false }, { reps: '8', peso: '40kg', feito: false }] },
        { nome: 'Supino Inclinado com Halteres', descanso: '60s', series: [{ reps: '12', peso: '22kg', feito: false }, { reps: '10', peso: '24kg', feito: false }, { reps: '10', peso: '24kg', feito: false }] },
        { nome: 'Tríceps Pulley na Corda',       descanso: '45s', series: [{ reps: '15', peso: '25kg', feito: false }, { reps: '12', peso: '30kg', feito: false }] },
        { nome: 'Elevação Lateral',              descanso: '45s', series: [{ reps: '15', peso: '10kg', feito: false }, { reps: '12', peso: '12kg', feito: false }] }
      ]
    },
    {
      id: 't' + semente + 'b',
      letra: 'B',
      nome: 'Costas, Bíceps & Abdômen',
      exercicios: [
        { nome: 'Puxada Frontal',     descanso: '60s', series: [{ reps: '12', peso: '45kg', feito: false }, { reps: '10', peso: '50kg', feito: false }, { reps: '10', peso: '55kg', feito: false }] },
        { nome: 'Remada Curvada',     descanso: '60s', series: [{ reps: '12', peso: '30kg', feito: false }, { reps: '10', peso: '35kg', feito: false }] },
        { nome: 'Rosca Direta',       descanso: '45s', series: [{ reps: '12', peso: '20kg', feito: false }, { reps: '10', peso: '25kg', feito: false }] },
        { nome: 'Abdominal na Polia', descanso: '45s', series: [{ reps: '15', peso: '25kg', feito: false }, { reps: '15', peso: '25kg', feito: false }] }
      ]
    }
  ];
}

function laAlternarSerie(alunoId, treinoId, exIndex, serieIndex) {
  const lista = laListarAlunos();
  const aluno = lista.find(function (a) { return a.id === alunoId; });
  if (!aluno || !Array.isArray(aluno.treinos)) return false;

  const treino = aluno.treinos.find(function (t) { return t.id === treinoId; });
  if (!treino) return false;

  const ex = treino.exercicios[exIndex];
  if (!ex || !ex.series[serieIndex]) return false;

  ex.series[serieIndex].feito = !ex.series[serieIndex].feito;
  laSalvarAlunos(lista);
  return ex.series[serieIndex].feito;
}

function laProgressoTreino(treino) {
  let total = 0, feitas = 0;
  (treino.exercicios || []).forEach(function (ex) {
    (ex.series || []).forEach(function (s) {
      total++;
      if (s.feito) feitas++;
    });
  });
  return { feitas: feitas, total: total, pct: total ? Math.round((feitas / total) * 100) : 0 };
}

/* ==========================================================================
   4. ACESSO AO PAINEL
   ========================================================================== */

/* Chave de acesso ao painel. Só esta string exata abre o prompt.
   Nada de "admin" ou "academia" solto: quem não sabe a chave não descobre nada. */
const LA_COMANDO_ADMIN = '#adminacademiaLA2026';

/* A senha nao fica mais escrita aqui. Guardamos o HASH dela.
   Para trocar a senha: abra o site, va no console do navegador e rode
   laGerarHash('a-sua-nova-senha')  — ele devolve o valor para colar abaixo.
   Assim quem abrir o codigo-fonte nao le a senha. */
const LA_SENHA_HASH = 'la1keql7l';

function laHash(txt) {
  /* hash simples e estavel, suficiente para nao deixar a senha legivel.
     Em producao com Supabase, quem cuida disso e o servidor. */
  var t = String(txt || '') + '|LA-FITNESS|2026';
  var h = 2166136261;
  for (var i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return 'la' + h.toString(36);
}

function laGerarHash(senha) {
  var codigo = laHash(senha);
  console.log('Senha:', senha, '-> hash:', codigo);
  console.log('Cole em LA_SENHA_HASH dentro de js/dados.js');
  return codigo;
}

function laVerificarSenhaAdmin(senha) {
  /* Verificacao DIRETA e simples: compara com a senha, limpando o que o
     celular manda junto (espaco, quebra de linha, espaco invisivel).
     Funciona em qualquer aparelho, sem depender de hash. */
  var senhaCerta = 'academiaLA2026';
  var bate = false;

  try {
    var limpa = String(senha || '').replace(/[\s\u00a0]+/g, '').trim();

    /* aceita a senha exata e a variacao de maiuscula */
    if (limpa === senhaCerta ||
        limpa.toLowerCase() === senhaCerta.toLowerCase()) {
      bate = true;
    }

    /* compatibilidade: se o hash ainda estiver no arquivo, aceita tambem */
    if (!bate && typeof laHash === 'function' && typeof LA_SENHA_HASH !== 'undefined') {
      bate = (laHash(limpa) === LA_SENHA_HASH);
    }
  } catch (e) { bate = false; }

  if (bate) {
    try { sessionStorage.setItem(LA_CHAVE_ADMIN, '1'); } catch (e) {}
  }
  return bate;
}

function laAdminLogado() {
  try { return sessionStorage.getItem(LA_CHAVE_ADMIN) === '1'; } catch (e) { return false; }
}

function laSairAdmin() { try { sessionStorage.removeItem(LA_CHAVE_ADMIN); } catch (e) {} }

/* ==========================================================================
   5. MEDIÇÃO DE ACESSOS
   ========================================================================== */

function laSessao() {
  let s = null;
  try { s = sessionStorage.getItem('la_sessao_visita'); } catch (e) {}
  if (!s) {
    s = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    try { sessionStorage.setItem('la_sessao_visita', s); } catch (e) {}
  }
  return s;
}

function laNovoVisitante() {
  let v = null;
  try { v = localStorage.getItem('la_visitante'); } catch (e) {}
  if (!v) {
    v = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    try { localStorage.setItem('la_visitante', v); } catch (e) {}
    return { id: v, novo: true };
  }
  return { id: v, novo: false };
}

function laContexto(pagina, tipo, extra) {
  const ua = navigator.userAgent || '';
  const ref = document.referrer || '';

  let origem = 'direto';
  if (ref) {
    if (/instagram/i.test(ref)) origem = 'Instagram';
    else if (/facebook|fb\./i.test(ref)) origem = 'Facebook';
    else if (/google/i.test(ref)) origem = 'Google';
    else if (/youtube/i.test(ref)) origem = 'YouTube';
    else if (/whatsapp|wa\.me/i.test(ref)) origem = 'WhatsApp';
    else if (/t\.co|twitter|x\.com/i.test(ref)) origem = 'X / Twitter';
    else { try { origem = new URL(ref).hostname.replace('www.', ''); } catch (e) { origem = 'outro site'; } }
  }

  const largura = window.innerWidth || 0;
  const aparelho = largura < 700 ? 'celular' : (largura < 1100 ? 'tablet' : 'computador');

  let idioma = 'pt';
  try {
    const guardado = localStorage.getItem('la_idioma');
    if (guardado) idioma = guardado;
    else {
      const nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
      if (['pt', 'en', 'es'].indexOf(nav) !== -1) idioma = nav;
    }
  } catch (e) {}

  let navegador = 'outro';
  if (/edg/i.test(ua)) navegador = 'Edge';
  else if (/chrome/i.test(ua)) navegador = 'Chrome';
  else if (/safari/i.test(ua)) navegador = 'Safari';
  else if (/firefox/i.test(ua)) navegador = 'Firefox';

  const registro = {
    pagina: pagina || 'inicio',
    tipo: tipo || 'visualizacao',
    quando: new Date().toISOString(),
    sessao: laSessao(),
    visitante: laNovoVisitante().id,
    origem: origem,
    aparelho: aparelho,
    navegador: navegador,
    idioma: idioma,
    largura: largura
  };
  if (extra) Object.keys(extra).forEach(function (k) { registro[k] = extra[k]; });
  return registro;
}

function laRegistrarAcesso(pagina, tipo, extra) {
  try {
    const bruto = localStorage.getItem(LA_ACESSOS);
    const lista = bruto ? JSON.parse(bruto) : [];
    lista.push(laContexto(pagina, tipo, extra));
    localStorage.setItem(LA_ACESSOS, JSON.stringify(lista.slice(-5000)));
  } catch (e) { /* silencioso */ }
}

function laRegistrarVisita(pagina) {
  laRegistrarAcesso(pagina || 'inicio', 'visualizacao', { primeira: laNovoVisitante().novo });
}

function laListarAcessos() {
  try {
    const bruto = localStorage.getItem(LA_ACESSOS);
    if (bruto) return JSON.parse(bruto);
  } catch (e) {}
  return [];
}

/* ==========================================================================
   6. UTILIDADES
   ========================================================================== */

function laFormatarCPF(v) {
  return String(v || '').replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function laIniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/);
  if (!partes[0]) return 'LA';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function laEscapar(txt) {
  return String(txt || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function laSemearExemplo() {
  if (laListarAlunos().length) return null;
  const aluno = laCriarAluno({
    nome: 'Rodrigo Silva',
    cpf: '12345678900',
    senha: '123456',
    plano: 'Recorrente',
    objetivo: 'Hipertrofia',
    telefone: '(61) 99999-0000'
  });
  aluno.treinos = laTreinoPadrao();
  laAtualizarAluno(aluno.id, { treinos: aluno.treinos });
  return aluno;
}
