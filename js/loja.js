/* ==========================================================================
   L.A FITNESS — LOJA
   Camada isolada: o resto do site nao sabe onde os produtos moram.
   Hoje: localStorage.  Depois: as mesmas funcoes viram chamadas ao Supabase.

   O que a academia cadastra no painel aparece na loja do aluno.
   ========================================================================== */

const LA_PRODUTOS_CHAVE = 'la_produtos';
const LA_COMPRAS_CHAVE   = 'la_compras';
const LA_CARRINHO_CHAVE  = 'la_carrinho';

/* ---------- produtos que vem de fabrica, so na primeira vez ---------- */
function laProdutosPadrao() {
  return [
    { id: 'p1', nome: 'Whey Protein 900g',    preco: 189.90, categoria: 'Suplemento', icone: 'fa-jar',          estoque: 10, ativo: true },
    { id: 'p2', nome: 'Creatina 300g',        preco: 129.90, categoria: 'Suplemento', icone: 'fa-jar',          estoque: 12, ativo: true },
    { id: 'p3', nome: 'Pré-treino 300g',      preco: 99.90,  categoria: 'Suplemento', icone: 'fa-jar',          estoque: 8,  ativo: true },
    { id: 'p4', nome: 'Camiseta L.A Fitness', preco: 69.90,  categoria: 'Vestuário',  icone: 'fa-shirt',        estoque: 20, ativo: true },
    { id: 'p5', nome: 'Regata Dry Fit',       preco: 79.90,  categoria: 'Vestuário',  icone: 'fa-shirt',        estoque: 15, ativo: true },
    { id: 'p6', nome: 'Garrafa 1L',           preco: 49.90,  categoria: 'Acessório',  icone: 'fa-bottle-water', estoque: 25, ativo: true },
    { id: 'p7', nome: 'Luva de treino',       preco: 59.90,  categoria: 'Acessório',  icone: 'fa-hand',         estoque: 10, ativo: true },
    { id: 'p8', nome: 'Corda de pular',       preco: 39.90,  categoria: 'Acessório',  icone: 'fa-link',         estoque: 18, ativo: true }
  ];
}

/* ==========================================================================
   PRODUTOS
   ========================================================================== */

function laListarProdutos() {
  try {
    const bruto = localStorage.getItem(LA_PRODUTOS_CHAVE);
    const lista = bruto ? JSON.parse(bruto) : null;
    if (Array.isArray(lista)) return lista;
    const padrao = laProdutosPadrao();
    localStorage.setItem(LA_PRODUTOS_CHAVE, JSON.stringify(padrao));
    return padrao;
  } catch (e) {
    return laProdutosPadrao();
  }
}

/* so os que o aluno pode ver */
function laProdutosVisiveis() {
  return laListarProdutos().filter(function (p) { return p.ativo !== false; });
}

function laSalvarProdutos(lista) {
  try { localStorage.setItem(LA_PRODUTOS_CHAVE, JSON.stringify(lista)); return true; }
  catch (e) { return false; }
}

function laBuscarProduto(id) {
  return laListarProdutos().find(function (p) { return p.id === id; }) || null;
}

function laCriarProduto(dados) {
  const lista = laListarProdutos();
  const p = {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    nome: (dados.nome || 'Produto').trim(),
    preco: Number(dados.preco) || 0,
    categoria: (dados.categoria || 'Outros').trim(),
    icone: dados.icone || 'fa-box',
    foto: dados.foto || '',
    estoque: (dados.estoque === '' || dados.estoque == null) ? null : Number(dados.estoque),
    ativo: dados.ativo !== false,
    criadoEm: new Date().toISOString()
  };
  lista.push(p);
  laSalvarProdutos(lista);
  return p;
}

function laAtualizarProduto(id, mudancas) {
  const lista = laListarProdutos();
  const i = lista.findIndex(function (p) { return p.id === id; });
  if (i === -1) return false;
  lista[i] = Object.assign({}, lista[i], mudancas);
  laSalvarProdutos(lista);
  return lista[i];
}

function laExcluirProduto(id) {
  laSalvarProdutos(laListarProdutos().filter(function (p) { return p.id !== id; }));
  return true;
}

/* baixa o estoque depois de uma venda; null = sem controle */
function laBaixarEstoque(id, quantidade) {
  const p = laBuscarProduto(id);
  if (!p || p.estoque == null) return;
  const novo = Math.max(0, Number(p.estoque) - Number(quantidade || 1));
  laAtualizarProduto(id, { estoque: novo });
}

function laTemEstoque(produto, quantidade) {
  if (!produto || produto.estoque == null) return true;
  return Number(produto.estoque) >= Number(quantidade || 1);
}

/* ==========================================================================
   CARRINHO DO ALUNO
   ========================================================================== */

function laLerCarrinhos() {
  try {
    const b = localStorage.getItem(LA_CARRINHO_CHAVE);
    const m = b ? JSON.parse(b) : {};
    return (m && typeof m === 'object') ? m : {};
  } catch (e) { return {}; }
}

function laCarrinhoDoAluno(alunoId) {
  const m = laLerCarrinhos();
  return Array.isArray(m[alunoId]) ? m[alunoId] : [];
}

function laSalvarCarrinho(alunoId, itens) {
  try {
    const m = laLerCarrinhos();
    m[alunoId] = itens;
    localStorage.setItem(LA_CARRINHO_CHAVE, JSON.stringify(m));
    return true;
  } catch (e) { return false; }
}

function laAdicionarAoCarrinho(alunoId, produtoId, quantidade) {
  const p = laBuscarProduto(produtoId);
  if (!p) return { ok: false, erro: 'Produto não encontrado.' };
  const qtd = Number(quantidade) || 1;
  const itens = laCarrinhoDoAluno(alunoId);
  const jaTem = itens.find(function (i) { return i.produtoId === produtoId; });
  const total = (jaTem ? jaTem.quantidade : 0) + qtd;

  if (p.estoque != null && total > p.estoque) {
    return { ok: false, erro: 'Só temos ' + p.estoque + ' em estoque.' };
  }

  if (jaTem) jaTem.quantidade = total;
  else itens.push({ produtoId: produtoId, quantidade: qtd });

  laSalvarCarrinho(alunoId, itens);
  return { ok: true };
}

function laRemoverDoCarrinho(alunoId, produtoId) {
  laSalvarCarrinho(alunoId, laCarrinhoDoAluno(alunoId).filter(function (i) {
    return i.produtoId !== produtoId;
  }));
}

function laTotalDoCarrinho(alunoId) {
  return laCarrinhoDoAluno(alunoId).reduce(function (soma, i) {
    const p = laBuscarProduto(i.produtoId);
    return soma + (p ? p.preco * i.quantidade : 0);
  }, 0);
}

/* ==========================================================================
   COMPRAS / VENDAS
   ========================================================================== */

function laListarCompras() {
  try {
    const b = localStorage.getItem(LA_COMPRAS_CHAVE);
    const l = b ? JSON.parse(b) : [];
    return Array.isArray(l) ? l : [];
  } catch (e) { return []; }
}

function laSalvarCompras(l) {
  try { localStorage.setItem(LA_COMPRAS_CHAVE, JSON.stringify(l)); return true; }
  catch (e) { return false; }
}

function laComprasDoAluno(alunoId) {
  return laListarCompras()
    .filter(function (c) { return c.alunoId === alunoId; })
    .sort(function (a, b) { return String(b.quando).localeCompare(String(a.quando)); });
}

/* o aluno fecha o pedido: vira venda aguardando pagamento */
function laFecharCompra(alunoId, formaPagamento) {
  const itens = laCarrinhoDoAluno(alunoId);
  if (!itens.length) return { ok: false, erro: 'O carrinho está vazio.' };

  const aluno = (typeof laBuscarAluno === 'function') ? laBuscarAluno(alunoId) : null;
  const detalhes = itens.map(function (i) {
    const p = laBuscarProduto(i.produtoId);
    return {
      produtoId: i.produtoId,
      nome: p ? p.nome : 'Produto',
      preco: p ? p.preco : 0,
      quantidade: i.quantidade,
      subtotal: (p ? p.preco : 0) * i.quantidade
    };
  });

  const total = detalhes.reduce(function (s, d) { return s + d.subtotal; }, 0);

  const compra = {
    id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    alunoId: alunoId,
    aluno: aluno ? aluno.nome : '',
    itens: detalhes,
    total: total,
    formaPagamento: formaPagamento || 'recepcao',
    status: 'aguardando',      /* aguardando | pago | entregue | cancelado */
    quando: new Date().toISOString()
  };

  const lista = laListarCompras();
  lista.push(compra);
  laSalvarCompras(lista);

  /* baixa o estoque */
  detalhes.forEach(function (d) { laBaixarEstoque(d.produtoId, d.quantidade); });

  laSalvarCarrinho(alunoId, []);
  return { ok: true, compra: compra };
}

function laAtualizarCompra(id, status) {
  const lista = laListarCompras();
  const c = lista.find(function (x) { return x.id === id; });
  if (!c) return false;
  c.status = status;
  if (status === 'pago') c.pagoEm = new Date().toISOString();
  if (status === 'entregue') c.entregueEm = new Date().toISOString();
  laSalvarCompras(lista);
  return true;
}

function laTotalVendido() {
  return laListarCompras()
    .filter(function (c) { return c.status === 'pago' || c.status === 'entregue'; })
    .reduce(function (s, c) { return s + Number(c.total || 0); }, 0);
}

function laProdutosMaisVendidos() {
  const conta = {};
  laListarCompras().forEach(function (c) {
    if (c.status === 'cancelado') return;
    (c.itens || []).forEach(function (i) {
      conta[i.nome] = (conta[i.nome] || 0) + Number(i.quantidade || 0);
    });
  });
  return Object.keys(conta)
    .map(function (k) { return { nome: k, quantidade: conta[k] }; })
    .sort(function (a, b) { return b.quantidade - a.quantidade; });
}
