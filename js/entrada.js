/* ==========================================================================
   L.A FITNESS — entrada do aluno (login e cadastro)
   ========================================================================== */

const LA_PENDENTES = 'la_pendentes';

function laCadastrarAluno(dados) {
  const nome = String(dados.nome || '').trim();
  const cpf = String(dados.cpf || '').replace(/\D/g, '');
  const senha = String(dados.senha || '').trim();

  if (nome.split(/\s+/).length < 2) return { ok: false, erro: 'Informe nome e sobrenome.' };
  if (cpf.length !== 11) return { ok: false, erro: 'O CPF precisa ter 11 números.' };
  if (senha.length < 4) return { ok: false, erro: 'A senha precisa ter 4 caracteres ou mais.' };

  const jaTem = laListarAlunos().some(function (a) { return a.cpf === cpf; });
  if (jaTem) return { ok: false, erro: 'Já existe um cadastro com esse CPF. Tente entrar.' };

  const aluno = laCriarAluno({
    nome: nome,
    cpf: cpf,
    senha: senha,
    telefone: dados.zap || '',
    email: dados.email || '',
    plano: 'Aguardando',
    objetivo: ''
  });

  /* fica pendente até a academia liberar */
  laAtualizarAluno(aluno.id, { ativo: false, pendente: true });

  try {
    const b = localStorage.getItem(LA_PENDENTES);
    const lista = b ? JSON.parse(b) : [];
    lista.push({ id: aluno.id, nome: nome, cpf: cpf, quando: new Date().toISOString() });
    localStorage.setItem(LA_PENDENTES, JSON.stringify(lista));
  } catch (e) {}

  return { ok: true, aluno: aluno };
}
