# SportGuess (AdonisJS 6 + TypeScript + PostgreSQL)

Jogo de adivinhação: o jogador vê um vídeo borrado e tenta acertar o atleta.

- **Visitante** (sem conta): joga em `/jogar/futebol`, `/jogar/nba`, `/jogar/ufc`. Nada é salvo.
- **Jogador** (cadastrado): joga, a pontuação é salva e ele acessa `/ranking` e `/perfil`.
- **Admin**: só administra (`/admin/videos`, `/admin/atletas`). Não joga.

## 1. Criar o projeto

```bash
npm init adonisjs@2 sportguess-v6 -- --kit=web --db=postgres --auth-guard=session
cd sportguess-v6
```

Depois copie as pastas deste zip para dentro do projeto, **sobrescrevendo** os arquivos existentes
(`app/`, `database/`, `resources/`, `start/routes.ts`, `public/`).

Apague a migration de usuários que o Adonis gerou (a deste zip já cria a tabela com a coluna `role`):

```bash
rm database/migrations/*_create_users_table.ts   # só a gerada pelo Adonis, não a 1700000000001_...
```

## 2. Ajustes manuais (3 linhas)

**start/kernel.ts**: adicione o middleware global (por último na lista `router.use`) e o nomeado `role`:

```ts
router.use([
  // ... os que já existem (bodyparser, session, shield, initialize_auth ...)
  () => import('#middleware/user_context_middleware'),
])

export const middleware = router.named({
  // ... guest, auth já existem
  role: () => import('#middleware/role_middleware'),
})
```

**start/env.ts**: dentro do objeto do schema, adicione:

```ts
SPORTSDB_KEY: Env.schema.string.optional(),
```

**.env**: confira os dados do Postgres e adicione a chave da API:

```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=sportguess
SPORTSDB_KEY=3
```

## 3. Banco e execução

```bash
# crie o banco uma vez (psql ou pgAdmin): CREATE DATABASE sportguess;
node ace migration:run
node ace db:seed
npm run dev
```

Abra http://localhost:3333

Admin criado pelo seeder: `admin@sportguess.com` / `admin123` (troque depois).

## 4. Primeiro uso

1. Entre como admin. Em **Atletas**, busque um nome (ex.: Messi), escolha a categoria e clique em Adicionar.
2. Em **Vídeos**, clique em "+ Adicionar vídeo", escolha o atleta e envie um mp4/webm curto.
3. Saia, abra `/jogar` como visitante e jogue. Depois cadastre um jogador e veja o ranking.

Os vídeos ficam em `public/uploads/videos/` e o caminho vai para a tabela `videos`.

## Como cada caso de uso se encaixa

| Caso de uso | Onde está |
|---|---|
| Cadastrar-se | `AuthController.register`, `/cadastro` |
| Cadastrar vídeo | `Admin/VideosController.store`, `/admin/videos/novo` |
| Listar vídeos (BO) | `Admin/VideosController.index`, `/admin/videos` |
| Listar atletas (BO) | `Admin/AthletesController.index`, `/admin/atletas` |
| Editar vídeo | `Admin/VideosController.update`, `/admin/videos/:id/editar` |
| Jogar partida | `GameController` + `app/services/game_service.ts` + `public/js/game.js` |

## Visual

O layout usa **Bootstrap 5.3** carregado por CDN (tema escuro nativo) em `resources/views/partials/head.edge`.
O que é específico do jogo (blur, cards de categoria, hero) fica em `public/css/app.css`.
O CDN precisa de internet: se for apresentar offline, rode `npm i bootstrap` e copie
`node_modules/bootstrap/dist/css/bootstrap.min.css` e `dist/js/bootstrap.bundle.min.js` para `public/vendor/`, trocando os links no head e no foot.

## Observações

- A resposta nunca vai para o navegador antes do fim da rodada: o servidor guarda a partida na sessão e compara o palpite.
  O blur é aplicado por CSS, então quem abrir o DevTools pode removê-lo. Aceitável para o trabalho; para blindar, o servidor
  teria que gerar o vídeo já borrado (ex.: ffmpeg).
- A TheSportsDB pode não ter todos os lutadores. Por isso existe o cadastro manual de atleta.
- Confira na documentação da TheSportsDB o que a chave gratuita permite hoje.
