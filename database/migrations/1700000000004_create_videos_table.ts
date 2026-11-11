import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'videos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('athlete_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('athletes')
        .onDelete('CASCADE')
      table.string('file_path').notNullable() // ex.: /uploads/videos/abc123.mp4
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
