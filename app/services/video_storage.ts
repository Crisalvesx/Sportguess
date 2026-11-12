import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import { unlink } from 'node:fs/promises'
import type { MultipartFile } from '@adonisjs/core/bodyparser'

const DIR = 'uploads/videos'

export default class VideoStorage {
  /** Salva o arquivo em public/uploads/videos e devolve o caminho público. */
  static async save(file: MultipartFile) {
    const name = `${cuid()}.${file.extname}`
    await file.move(app.makePath('public', DIR), { name })
    return `/${DIR}/${name}`
  }

  static async remove(publicPath: string) {
    try {
      await unlink(app.makePath('public', publicPath))
    } catch {
      // arquivo já não existe
    }
  }
}
