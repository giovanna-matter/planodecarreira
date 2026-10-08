# Matter: plano de cargos e salários

Site com a landing page de cargos e salários da Matter e uma área de edição, lendo tudo do mesmo banco. O que o RH altera na área de edição aparece no site na hora.

## Páginas

- `/` página inicial: níveis, perfis, áreas, faixas salariais de todos os cargos e tipos de mobilidade
- `/cargos/<área>` fichas completas dos cargos de cada área (descrição, foco, requisitos, papel, faixa…)
- `/mobilidade` todos os caminhos entre cargos
- `/admin` área de edição: criar, editar e excluir cargos, faixas e mobilidades

## Senhas (variáveis de ambiente na Vercel)

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Banco Postgres. Criada sozinha ao conectar o Neon em Storage. |
| `APP_PASSWORD` | Senha para **ver** o site. Passe para o time. |
| `ADMIN_PASSWORD` | Senha para **editar**. Só para o RH. A senha de edição também dá acesso ao site. |
| `CONTATO_RH` | Contato que aparece no rodapé. |

Depois de criar ou mudar uma variável, faça Redeploy.

## Deploy (tudo pelo navegador)

1. Envie os arquivos desta pasta para um repositório **privado** no GitHub (Add file → Upload files).
2. Na Vercel: Add New → Project → importe o repositório → Deploy.
3. Storage → Create Database → Neon (Postgres) → conecte ao projeto, com o prefixo vazio.
4. Settings → Environment Variables: crie `APP_PASSWORD`, `ADMIN_PASSWORD` e `CONTATO_RH`.
5. Deployments → Redeploy.

No primeiro acesso, o sistema cria as tabelas e importa os 67 cargos e 104 mobilidades da planilha. Isso acontece uma única vez.

## Recomeçar do zero

No Neon (SQL Editor), rode o comando abaixo e recarregue o site. Apaga **tudo**, inclusive o que foi editado, e reimporta a planilha original:

```sql
drop table mobilidades, cargos, app_meta;
```

## Estrutura

```
app/page.tsx                 página inicial
app/cargos/[area]/page.tsx   fichas por área
app/mobilidade/page.tsx      tabela de mobilidade
app/admin/page.tsx           área de edição
app/login/page.tsx           login (ver ou editar)
app/api/...                  API usada pela área de edição
components/App.tsx           interface da área de edição
components/site/             cabeçalho, rodapé e peças do site
lib/dados.ts                 leitura e organização dos dados
lib/setup.ts                 cria tabelas e importa data/seed.json no primeiro acesso
lib/auth.ts, proxy.ts        controle das duas senhas
public/matter-logo.png       logo
```
