import type { HttpContext } from '@adonisjs/core/http'
import Athlete from '#models/athlete'
import Video from '#models/video'
import VideoStorage from '#services/video_storage'

const FILE_RULES = { size: '30mb', extnames: ['mp4', 'webm'] }

export default class AdminVideosController {
  async index({ view, request }: HttpContext) {
    const busca = String(request.input('busca', '')).trim()
    const videos = await Video.query()
      .preload('athlete', (q) => q.preload('category'))
      .if(busca, (q) => q.whereHas('athlete', (a) => a.whereILike('name', `%${busca}%`)))
      .orderBy('id', 'desc')

    return view.render('pages/admin/videos/index', { title: 'Gerenciar vídeos', videos, busca })
  }

  async create({ view }: HttpContext) {
    const athletes = await Athlete.query().preload('category').orderBy('name')
    return view.render('pages/admin/videos/form', { title: 'Novo vídeo', video: null, athletes })
  }

  async store({ request, response, session }: HttpContext) {
    const athleteId = Number(request.input('athleteId'))
    const file = request.file('video', FILE_RULES)

    if (!(await Athlete.find(athleteId))) return this.fail(session, response, 'Escolha um atleta.')
    if (!file) return this.fail(session, response, 'Envie o arquivo do vídeo (mp4 ou webm).')
    if (!file.isValid) return this.fail(session, response, file.errors.map((e) => e.message).join(' '))

    const filePath = await VideoStorage.save(file)
    await Video.create({ athleteId, filePath })

    session.flash('success', 'Vídeo cadastrado.')
    return response.redirect('/admin/videos')
  }

  async edit({ params, view }: HttpContext) {
    const video = await Video.findOrFail(params.id)
    const athletes = await Athlete.query().preload('category').orderBy('name')
    return view.render('pages/admin/videos/form', { title: 'Editar vídeo', video, athletes })
  }

  async update({ params, request, response, session }: HttpContext) {
    const video = await Video.findOrFail(params.id)
    const athleteId = Number(request.input('athleteId'))
    const file = request.file('video', FILE_RULES)

    if (!(await Athlete.find(athleteId))) return this.fail(session, response, 'Escolha um atleta.')
    if (file && !file.isValid) {
      return this.fail(session, response, file.errors.map((e) => e.message).join(' '))
    }

    if (file) {
      const oldPath = video.filePath
      video.filePath = await VideoStorage.save(file)
      await VideoStorage.remove(oldPath)
    }
    video.athleteId = athleteId
    await video.save()

    session.flash('success', 'Vídeo atualizado.')
    return response.redirect('/admin/videos')
  }

  async destroy({ params, response, session }: HttpContext) {
    const video = await Video.findOrFail(params.id)
    await VideoStorage.remove(video.filePath)
    await video.delete()

    session.flash('success', 'Vídeo removido.')
    return response.redirect('/admin/videos')
  }

  private fail(session: HttpContext['session'], response: HttpContext['response'], msg: string) {
    session.flash('error', msg)
    return response.redirect().back()
  }
}
