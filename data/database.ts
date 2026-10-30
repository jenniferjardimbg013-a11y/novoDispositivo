import * as SQLite from 'expo-sqlite';

export interface Tarefa {
  id: number;
  nome: string;
  imagem?: string | null; 
}

const DB_NAME = 'meubanco.db';

export async function setupDatabase() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  
 
  await db.execAsync(` 
    CREATE TABLE IF NOT EXISTS tarefas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      imagem TEXT 
    );
  `);
  
  return db;
}

export const dbService = {
 
  async create(db: SQLite.SQLiteDatabase, nome: string, imagem: string | null) {
    return await db.runAsync('INSERT INTO tarefas (nome, imagem) VALUES (?, ?)', [nome, imagem]);
  },

 
  async getAll(db: SQLite.SQLiteDatabase): Promise<Tarefa[]> {
    return await db.getAllAsync<Tarefa>('SELECT * FROM tarefas');
  },
  
 
  async update(db: SQLite.SQLiteDatabase, id: number, novoNome: string, novaImagem: string | null) {
    return await db.runAsync('UPDATE tarefas SET nome = ?, imagem = ? WHERE id = ?', [novoNome, novaImagem, id]);
  },


  async delete(db: SQLite.SQLiteDatabase, id: number) {
    return await db.runAsync('DELETE FROM tarefas WHERE id = ?', [id]);
  }
};