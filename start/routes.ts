import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HomeController = () => import('#controllers/home_controller')
const AuthController = () => import('#controllers/auth_controller')
const GameController = () => import('#controllers/game_controller')
const RankingController = () => import('#controllers/ranking_controller')
const AdminVideosController = () => import('#controllers/admin/videos_controller')
const AdminAthletesController = () => import('#controllers/admin/athletes_controller')

// ---------- Público (visitante, jogador) ----------
router.get('/', [HomeController, 'index'])

router.get('/jogar', [GameController, 'categories'])
router.get('/jogar/partida', [GameController, 'play'])
router.get('/jogar/resultado', [GameController, 'result'])
router.post('/jogar/palpite', [GameController, 'guess'])
router.post('/jogar/proxima', [GameController, 'next'])
router.get('/jogar/:slug', [GameController, 'start']) // /jogar/futebol, /jogar/nba, /jogar/ufc

// ---------- Autenticação ----------
router.get('/login', [AuthController, 'showLogin']).use(middleware.guest())
router.post('/login', [AuthController, 'login']).use(middleware.guest())
router.get('/cadastro', [AuthController, 'showRegister']).use(middleware.guest())
router.post('/cadastro', [AuthController, 'register']).use(middleware.guest())
router.post('/logout', [AuthController, 'logout'])

// ---------- Só jogador cadastrado ----------
router
  .group(() => {
    router.get('/ranking', [RankingController, 'ranking'])
    router.get('/perfil', [RankingController, 'profile'])
  })
  .use([middleware.auth(), middleware.role({ role: 'player' })])

// ---------- Só administrador ----------
router
  .group(() => {
    router.get('/', async ({ response }) => response.redirect('/admin/videos'))

    router.get('/videos', [AdminVideosController, 'index'])
    router.get('/videos/novo', [AdminVideosController, 'create'])
    router.post('/videos', [AdminVideosController, 'store'])
    router.get('/videos/:id/editar', [AdminVideosController, 'edit'])
    router.post('/videos/:id', [AdminVideosController, 'update'])
    router.post('/videos/:id/remover', [AdminVideosController, 'destroy'])

    router.get('/atletas', [AdminAthletesController, 'index'])
    router.post('/atletas', [AdminAthletesController, 'store'])
    router.post('/atletas/:id/remover', [AdminAthletesController, 'destroy'])
  })
  .prefix('/admin')
  .use([middleware.auth(), middleware.role({ role: 'admin' })])
