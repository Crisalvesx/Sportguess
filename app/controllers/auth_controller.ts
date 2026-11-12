import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default class AuthController {
  showLogin({ view }: HttpContext) {
    return view.render('pages/auth/login', { title: 'Entrar' })
  }

  async login({ request, response, auth, session }: HttpContext) {
    const email = String(request.input('email', '')).trim().toLowerCase()
    const password = String(request.input('password', ''))

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)
      return response.redirect(user.role === 'admin' ? '/admin/videos' : '/')
    } catch {
      session.flash('error', 'E-mail ou senha inválidos.')
      session.flash('email', email)
      return response.redirect().back()
    }
  }

  showRegister({ view }: HttpContext) {
    return view.render('pages/auth/register', { title: 'Cadastrar-se' })
  }

  async register({ request, response, auth, session }: HttpContext) {
    const fullName = String(request.input('fullName', '')).trim()
    const email = String(request.input('email', '')).trim().toLowerCase()
    const password = String(request.input('password', ''))

    session.flash('fullName', fullName)
    session.flash('email', email)

    if (fullName.length < 2) return this.fail(session, response, 'Informe seu nome.')
    if (!EMAIL_RE.test(email)) return this.fail(session, response, 'Informe um e-mail válido.')
    if (password.length < 8) return this.fail(session, response, 'A senha precisa ter ao menos 8 caracteres.')
    if (await User.findBy('email', email)) return this.fail(session, response, 'Esse e-mail já está cadastrado.')

    // quem se cadastra pelo site é sempre jogador; o admin vem do seeder
    const user = await User.create({ fullName, email, password, role: 'player' })
    await auth.use('web').login(user)
    return response.redirect('/')
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }

  private fail(session: HttpContext['session'], response: HttpContext['response'], msg: string) {
    session.flash('error', msg)
    return response.redirect().back()
  }
}
