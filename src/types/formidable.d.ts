declare module 'formidable' {
  export interface Files {
    [field: string]: any;
  }
  export class IncomingForm {
    constructor(opts?: any);
    parse(
      req: any,
      cb: (err: any, fields: Record<string, any>, files: Files) => void
    ): void;
  }
}


