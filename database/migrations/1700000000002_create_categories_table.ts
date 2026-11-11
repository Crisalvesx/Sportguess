import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('slug', 40).notNullable().unique()
      table.string('name', 80).notNullable()
      table.string('description').nullable()
      table.string('icon', 10).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
