import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import Video from '#models/video'

export default class Athlete extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare externalId: string | null

  @column()
  declare name: string

  @column()
  declare photoUrl: string | null

  @column()
  declare categoryId: number

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @hasMany(() => Video)
  declare videos: HasMany<typeof Video>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
