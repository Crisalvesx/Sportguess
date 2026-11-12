import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/category'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await Category.updateOrCreateMany('slug', [
      { slug: 'futebol', name: 'Futebol', icon: '⚽', description: 'Brasileirão • Champions League' },
      { slug: 'nba', name: 'NBA', icon: '🏀', description: 'O melhor do basquete' },
      { slug: 'ufc', name: 'UFC', icon: '🥊', description: 'Os maiores combates' },
    ])

    // Troque a senha do admin antes de qualquer uso fora de testes.
    await User.updateOrCreate(
      { email: 'admin@sportguess.com' },
      { fullName: 'Administrador', password: 'admin123', role: 'admin' }
    )
  }
}
