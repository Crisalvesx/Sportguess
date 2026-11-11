import type { HttpContext } from '@adonisjs/core/http'
import Athlete from '#models/athlete'
import Category from '#models/category'
import SportsApiService from '#services/sports_api_service'
import type { ApiAthlete } from '#services/sports_api_service'

export default class AdminAthletesController {
  async index({ view, request }: HttpContext) {
    const busca = String(request.input('busca', '')).trim()
    const categories = await Category.query().orderBy('id')
    const athletes = await Athlete.query().preload('category').withCount('videos').orderBy('name')

    let results: ApiAthlete[] = []
    let apiError: string | null = null
    if (busca.length >= 2) {
      try {
        results = await new SportsApiService().searchPlayers(busca)
      } catch (error) {
        apiError = 'Não foi possível consultar a API agora. Você pode cadastrar o atleta manualmente abaixo.'
      }
    }

    return view.render('pages/admin/athletes/index', {
      title: 'Atletas',
      athletes,
      categories,
      busca,
      results,
      apiError,
    })
  }

  async store({ request, response, session }: HttpContext) {
    const name = String(request.input('name', '')).trim()
    const categoryId = Number(request.input('categoryId'))
    const externalId = String(request.input('externalId', '')).trim() || null
    const photoUrl = String(request.input('photoUrl', '')).trim() || null

    if (name.length < 2) return this.fail(session, response, 'Informe o nome do atleta.')
    if (!(await Category.find(categoryId))) return this.fail(session, response, 'Escolha uma categoria.')

    if (externalId && (await Athlete.findBy('external_id', externalId))) {
      return this.fail(session, response, 'Esse atleta já está cadastrado.')
    }

    await Athlete.create({ name, categoryId, externalId, photoUrl })
    session.flash('success', `${name} cadastrado.`)
    return response.redirect('/admin/atletas')
  }

  async destroy({ params, response, session }: HttpContext) {
    const athlete = await Athlete.query().where('id', params.id).withCount('videos').firstOrFail()
    if (Number(athlete.$extras.videos_count) > 0) {
      return this.fail(session, response, 'Remova os vídeos desse atleta antes de excluí-lo.')
    }
    await athlete.delete()
    session.flash('success', 'Atleta removido.')
    return response.redirect('/admin/atletas')
  }

  private fail(session: HttpContext['session'], response: HttpContext['response'], msg: string) {
    session.flash('error', msg)
    return response.redirect().back()
  }
}
