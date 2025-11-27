declare module 'better-sqlite3' {
  export default class Database {
    constructor(filename: string);
    pragma(sql: string): void;
    prepare<T = any>(sql: string): {
      get: (...params: any[]) => T;
      all: (...params: any[]) => T[];
      run: (...params: any[]) => { changes: number; lastInsertRowid: number | bigint };
    };
    exec(sql: string): void;
  }
}


