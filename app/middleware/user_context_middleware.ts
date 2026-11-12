import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Roda em todas as rotas:
 *  - carrega o usuário logado (se houver) sem exigir login, para o visitante poder jogar;
 *  - compartilha dados com as views Edge;
 *  - o admin só administra: qualquer rota fora de /admin leva de volta ao painel.
 */
export default class UserContextMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()
    const user = ctx.auth.user ?? null
    const path = ctx.request.url()

    ctx.view.share({
      currentUser: user,
      currentPath: path,
      csrfToken: ctx.request.csrfToken,
    })

    if (user?.role === 'admin' && !path.startsWith('/admin') && path !== '/logout') {
      return ctx.response.redirect('/admin/videos')
    }

    return next()
  }
}
