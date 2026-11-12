import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import Video from '#models/video'
import Match from '#models/match'
import {
  BLUR_STEP,
  MAX_TRIES,
  ROUNDS,
  START_BLUR,
  blurFor,
  isCorrect,
  roundScore,
  shuffle,
  type GameSession,
} from '#services/game_service'

/**
 * Partida aberta a todos. O estado fica na sessão e a resposta só sai do servidor
 * quando a rodada termina. Só jogador logado tem a partida gravada no banco.
 */
export default class GameController {
  async categories({ view }: HttpContext) {
    const categories = await Category.query().orderBy('id')
    return view.render('pages/game/categories', { title: 'Jogar', categories })
  }

  async start({ params, response, session }: HttpContext) {
    const category = await Category.findBy('slug', params.slug)
    if (!category) return response.redirect('/jogar')

    const videos = await Video.query().whereHas('athlete', (q) => q.where('category_id', category.id))
    if (videos.length === 0) {
      session.flash('error', 'Ainda não há vídeos cadastrados nessa categoria.')
      return response.redirect('/jogar')
    }

    const game: GameSession = {
      categoryId: category.id,
      slug: category.slug,
      videoIds: shuffle(videos.map((v) => v.id)).slice(0, ROUNDS),
      index: 0,
      tries: 0,
      score: 0,
      correct: 0,
      roundDone: false,
      finished: false,
      saved: false,
    }
    session.put('game', game)
    return response.redirect('/jogar/partida')
  }

  async play({ view, response, session }: HttpContext) {
    const game = session.get('game') as GameSession | undefined
    if (!game || game.finished) return response.redirect('/jogar')

    const [video, category] = await Promise.all([
      this.currentVideo(game),
      Category.findOrFail(game.categoryId),
    ])

    return view.render('pages/game/play', {
      title: category.name,
      category,
      round: game.index + 1,
      total: game.videoIds.length,
      tries: game.tries,
      maxTries: MAX_TRIES,
      score: game.score,
      blur: blurFor(game.tries, game.roundDone),
      done: game.roundDone,
      isLast: game.index + 1 >= game.videoIds.length,
      videoUrl: video.filePath,
      // a resposta só é enviada à página depois que a rodada acaba
      athlete: game.roundDone ? { name: video.athlete.name, photoUrl: video.athlete.photoUrl } : null,
    })
  }

  async guess({ request, response, session }: HttpContext) {
    const game = session.get('game') as GameSession | undefined
    if (!game || game.finished) {
      return response.status(409).json({ error: 'Nenhuma partida em andamento.' })
    }

    const video = await this.currentVideo(game)
    let correct = false
    let gained = 0

    if (!game.roundDone) {
      const guess = String(request.input('guess', '')).trim()
      if (guess.length < 2) {
        return response.status(422).json({ error: 'Digite pelo menos 2 letras.' })
      }

      game.tries++
      correct = isCorrect(guess, video.athlete.name)
      if (correct) {
        gained = roundScore(game.tries)
        game.score += gained
        game.correct++
        game.roundDone = true
      } else if (game.tries >= MAX_TRIES) {
        game.roundDone = true
      }
      session.put('game', game)
    }

    return response.json({
      correct,
      gained,
      done: game.roundDone,
      tries: game.tries,
      maxTries: MAX_TRIES,
      score: game.score,
      blur: blurFor(game.tries, game.roundDone),
      isLast: game.index + 1 >= game.videoIds.length,
      athlete: game.roundDone ? { name: video.athlete.name, photoUrl: video.athlete.photoUrl } : null,
    })
  }

  async next({ response, session, auth }: HttpContext) {
    const game = session.get('game') as GameSession | undefined
    if (!game || game.finished || !game.roundDone) {
      return response.status(409).json({ error: 'A rodada ainda não terminou.' })
    }

    game.index++

    if (game.index >= game.videoIds.length) {
      game.finished = true
      // visitante não salva nada; jogador logado entra no ranking
      if (!game.saved && auth.user?.role === 'player') {
        await Match.create({
          userId: auth.user.id,
          categoryId: game.categoryId,
          score: game.score,
          correctCount: game.correct,
          rounds: game.videoIds.length,
        })
        game.saved = true
      }
      session.put('game', game)
      return response.json({ finished: true, redirect: '/jogar/resultado' })
    }

    game.tries = 0
    game.roundDone = false
    session.put('game', game)

    const video = await this.currentVideo(game)
    return response.json({
      finished: false,
      round: game.index + 1,
      total: game.videoIds.length,
      videoUrl: video.filePath,
      blur: START_BLUR,
      blurStep: BLUR_STEP,
      tries: 0,
      score: game.score,
      isLast: game.index + 1 >= game.videoIds.length,
    })
  }

  async result({ view, response, session, auth }: HttpContext) {
    const game = session.get('game') as GameSession | undefined
    if (!game || !game.finished) return response.redirect('/jogar')

    return view.render('pages/game/result', {
      title: 'Resultado',
      score: game.score,
      correct: game.correct,
      total: game.videoIds.length,
      slug: game.slug,
      isPlayer: auth.user?.role === 'player',
    })
  }

  private currentVideo(game: GameSession) {
    return Video.query()
      .where('id', game.videoIds[game.index])
      .preload('athlete')
      .firstOrFail()
  }
}
