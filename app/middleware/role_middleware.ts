import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/** Uso: middleware.role({ role: 'admin' }) depois de middleware.auth() */
export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { role: 'admin' | 'player' }) {
    const user = ctx.auth.user
    if (!user || user.role !== options.role) {
      ctx.session.flash('error', 'Você não tem acesso a essa página.')
      return ctx.response.redirect(user?.role === 'admin' ? '/admin/videos' : '/')
    }
    return next()
  }
}
