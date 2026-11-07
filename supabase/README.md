# Configuração da autenticação

O painel e o acesso dos alunos usam Supabase Auth. A função `la-students` cria
contas somente após validar uma sessão de administrador; a senha temporária
nunca é gravada na tabela `la_alunos`.

Os dados da conta do aluno — modelos e liberações de treino, progresso, medidas,
mensagens, pagamentos e cobranças — também podem sincronizar entre dispositivos
pela migração `20261106010500_student_data.sql`. O conteúdo antigo de
`localStorage` não é enviado automaticamente: no primeiro carregamento, o
navegador guarda uma cópia local em `la_legacy_backup_student_core` e os dados
remotos passam a preencher a aplicação. Revise ou exporte dados antigos antes
de entrar em um dispositivo que ainda os tenha.

## Preparação do projeto

1. Faça um backup da tabela `public.la_alunos`.
2. No SQL Editor do Supabase, revise e execute
   `migrations/20261105210000_student_auth.sql`.
   A migração apaga as senhas legadas em texto simples. Os alunos existentes
   precisarão receber um e-mail e uma nova senha temporária criada pela
   recepção antes de conseguirem entrar. Não execute sem planejar essa
   redefinição.
3. Execute `migrations/20261106010500_student_data.sql` para criar as tabelas
   de dados do aluno e suas políticas RLS.
4. Se as migrações anteriores já foram aplicadas (como no projeto atual),
   execute somente agora
   `migrations/20261106020000_student_data_constraints.sql`. Ela cria as
   unicidades usadas por pagamentos/cobranças e ajusta a FK Auth do aluno para
   `ON DELETE SET NULL`. Se houver pagamentos ou cobranças duplicados por
   aluno e competência, a migration para sem excluir registros. Para localizar
   os duplicados, rode:

   ```sql
   select aluno_id, competencia, count(*) as quantidade, array_agg(id) as ids
   from public.la_student_payments
   group by aluno_id, competencia
   having count(*) > 1;

   select aluno_id, competencia, count(*) as quantidade, array_agg(id) as ids
   from public.la_student_charges
   group by aluno_id, competencia
   having count(*) > 1;
   ```

   Revise esses registros e faça backup antes de qualquer correção manual; não
   apague duplicados automaticamente.
5. Crie o primeiro usuário administrativo em **Authentication → Users**.
   Copie o UUID desse usuário e promova somente essa conta no SQL Editor:

   ```sql
   insert into public.la_admins (user_id)
   values ('UUID_DO_USUARIO')
   on conflict (user_id) do nothing;
   ```

6. Instale e autentique a Supabase CLI, associe-a ao projeto e publique a
   função:

   ```powershell
   supabase link --project-ref jpodytaqzdadberficri
   supabase functions deploy la-students
   ```

   O arquivo `config.toml` desativa a verificação JWT automática no gateway
   porque o login de aluno não tem token. A ação de cadastro administrativo
   valida a sessão e a função `la_admins` no servidor. No chat, `#admin` apenas
   direciona para a tela de login; ele não é uma senha nem concede acesso.
   O painel autoriza somente a conta autenticada no Supabase e registrada em
   `la_admins`.
7. A função usa `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` e
   `SUPABASE_SECRET_KEYS` injetados pelo Supabase; não crie secrets
   customizados com prefixo `SUPABASE_`. Nunca coloque senha de conta ou chave
   secret no frontend, no Git ou em mensagens.
8. Publique o site. Faça primeiro um teste com um usuário e dados sintéticos:
   login administrativo, criação de aluno, login do aluno por CPF/matrícula e
   tentativa de acesso sem sessão. Verifique também treino, progresso, medidas,
   mensagens e pagamentos em outro dispositivo e confirme que um aluno não
   consegue consultar os dados de outro. Não use dados reais para testes.

## Alunos existentes

Para vincular um cadastro existente, abra **Alunos** no painel e crie uma conta
com o mesmo CPF, um e-mail exclusivo e uma senha temporária de pelo menos oito
caracteres. A função reaproveita a matrícula e associa o usuário Auth ao
cadastro. Entregue a senha por um canal privado. Para redefinir uma senha depois
da criação da conta, use a administração de usuários do Supabase Auth e entregue
a nova senha temporária em particular.
