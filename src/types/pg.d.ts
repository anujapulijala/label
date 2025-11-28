declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    connect(): Promise<any>;
    query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number }>;
    end(): Promise<void>;
  }
}


