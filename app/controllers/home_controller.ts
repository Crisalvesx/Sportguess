import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'

export default class HomeController {
  async index({ view }: HttpContext) {
    const categories = await Category.query().orderBy('id')
    return view.render('pages/home', { title: 'Início', categories })
  }
}
