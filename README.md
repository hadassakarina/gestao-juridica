This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Cadastro e confirmação por e-mail

Use o `.env.example` como modelo para configurar `SUPABASE_URL` e
`SUPABASE_PUBLISHABLE_KEY` no `.env.local`. Use a chave `sb_publishable_…`.
No Supabase, habilite o cadastro por e-mail e adicione
`http://localhost:3000/auth/callback` à lista **Redirect URLs** em **Authentication → URL Configuration**.
Adicione também a URL de produção com o mesmo caminho quando publicar o app.

Com a confirmação por e-mail habilitada, abra o link no navegador usado para
criar a conta para iniciar a sessão automaticamente. Em outro navegador, entre
pelo formulário de login após confirmar o endereço.

### Escritórios, equipe e processos

Aplique o SQL de `supabase/migrations/20261117010000_escritorios_processos.sql`
no SQL Editor do projeto Supabase antes de abrir o módulo **Processos**.
As tabelas novas só ficam acessíveis a usuários autenticados com as permissões
definidas pelas políticas RLS. O administrador cria o escritório e adiciona
convites por e-mail confirmado. A pessoa convidada abre **Processos** com a
conta do mesmo e-mail e aceita o convite na tela. O app registra o convite no banco.
Compartilhe o endereço do aplicativo com a pessoa convidada.

Teste com um administrador, um convidado e uma conta de fora do escritório.
O convidado deve ver os processos só depois de aceitar o convite. A conta de
fora deve permanecer sem acesso. Remova o membro e confirme que o acesso dele
é revogado.

### Prazos

Depois da migração de escritórios e processos, aplique também
`supabase/migrations/20261117020000_prazos.sql`. Abra **Prazos** no painel,
escolha um processo e informe o vencimento. É possível atribuir um membro
do escritório como responsável e marcar o prazo como concluído. Ao remover
um membro da equipe, os prazos dele ficam sem responsável.

O painel soma os prazos pendentes dos escritórios aos quais a conta tem acesso
e mostra os três com vencimento mais antigo, incluindo atrasos. As datas são
informadas manualmente.

### Clientes

Com as migrações anteriores aplicadas, execute
`supabase/migrations/20261117030000_clientes.sql`. Abra **Clientes** no painel
ou em **Processos**. Cadastre o nome do cliente e, se quiser, o e-mail e o
telefone. Selecione o cliente para vincular ou desvincular processos do
mesmo escritório. Um cliente pode ter vários processos e cada processo
pode ter um cliente.

### Publicações e intimações

Após as migrações de escritórios, processos e prazos, aplique
`supabase/migrations/20261117040000_comunicacoes.sql`. Use **Publicações**
ou **Intimações** na barra lateral para registrar uma comunicação com
título, processo, data e observações opcionais. **Criar prazo** abre a
agenda com o escritório e o processo preenchidos. Informe o vencimento
no formulário. A consulta ao diário e o cálculo de prazos são manuais.

### Tarefas, documentos e configurações

Aplique `supabase/migrations/20261117050000_tarefas_documentos_configuracoes.sql`.
Em **Tarefas**, atribua atividades, vincule um processo e informe o vencimento
quando necessário. O painel mostra as pendências. **Documentos** recebe PDFs
de até 4 MB em um bucket privado, com acesso por escritório e processo.
Em **Configurações**, administradores podem renomear o escritório e abrir a
gestão de equipe do escritório selecionado.

### Segurança em produção

O repositório GitHub armazena o código. Para disponibilizar o aplicativo,
conecte-o a uma hospedagem que execute Next.js com Server Actions e Route
Handlers. Configure as variáveis do `.env.example` no painel da hospedagem,
use a URL HTTPS pública em `APP_ORIGIN` e cadastre
`https://seu-dominio/auth/callback` nos redirecionamentos do Supabase.

A auditoria de 17/11/2026 apontou o aviso GHSA-fc5q-39xc-vjpf no
`picomatch`, dependência transitiva das ferramentas de desenvolvimento.
Na data da verificação, o aviso oficial informava ausência de versão
corrigida. Reavalie esse alerta antes da publicação.
[Aviso oficial](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)

- Configure `APP_ORIGIN` com a URL HTTPS pública e habilite o redirecionamento
  HTTP → HTTPS no provedor de hospedagem, incluindo arquivos estáticos. Se houver
  proxy reverso, ele deve sobrescrever `X-Forwarded-Proto`. Cadastre a URL HTTPS
  de confirmação no Supabase. Use **Sair** e entre novamente para renovar cookies
  emitidos pela versão anterior.
- Os limites de login, cadastro e confirmação são aplicados pelo Supabase Auth.
  Revise **Authentication → Rate Limits** no projeto. Para limitar por
  visitante antes de chegar ao servidor, configure o rate limit no proxy ou WAF
  da hospedagem. Chamadas de Auth feitas pelo servidor podem compartilhar a
  cota de IP.
- Para habilitar proteção contra bots, crie um widget Cloudflare Turnstile.
  Configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no app e guarde a chave secreta do
  widget no painel do Supabase em **Authentication → Bot and Abuse Protection**.
  Publique a configuração do widget e a do Supabase juntas para preservar
  login e cadastro. [Configuração de CAPTCHA no Supabase](https://supabase.com/docs/guides/auth/auth-captcha)
- Supabase Auth armazena hashes de senha com bcrypt. No Supabase hospedado, a
  plataforma fornece criptografia em repouso. O aplicativo exige HTTPS para
  conexões remotas com o Supabase. [Senhas](https://supabase.com/docs/guides/auth/password-security) ·
  [Criptografia do serviço](https://supabase.com/downloads/docs/Supabase%2BDPA%2B231211.pdf)
- As ações de formulário aceitam campos específicos e têm limite de 32 KB
  por requisição. A rota de documentos valida o cabeçalho PDF e o tamanho.
  Os arquivos são baixados como anexos autenticados. A validação não inclui
  varredura antivírus.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
