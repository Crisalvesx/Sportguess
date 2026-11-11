import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Match from '#models/match'

export default class RankingController {
  async ranking({ view }: HttpContext) {
    const rows = await db
      .from('matches')
      .join('users', 'users.id', 'matches.user_id')
      .select('users.id', 'users.full_name')
      .sum('matches.score as total')
      .count('matches.id as partidas')
      .groupBy('users.id', 'users.full_name')
      .orderBy('total', 'desc')
      .limit(10)

    return view.render('pages/ranking', { title: 'Ranking', rows })
  }

  async profile({ view, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const matches = await Match.query()
      .where('user_id', user.id)
      .preload('category')
      .orderBy('created_at', 'desc')
      .limit(10)

    const totals = await db
      .from('matches')
      .where('user_id', user.id)
      .sum('score as total')
      .count('id as partidas')
      .first()

    return view.render('pages/profile', {
      title: 'Perfil',
      matches,
      total: totals?.total ?? 0,
      count: totals?.partidas ?? 0,
    })
  }
}
