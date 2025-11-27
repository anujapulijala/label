import { Readable } from 'stream';

export function formidableShimFromRequestHeaders(headers: Headers, buffer: Buffer): any {
  const shim: any = Object.assign(new Readable() as any, {
    headers: Object.fromEntries(headers as any),
    _read(this: any) {
      this.push(buffer);
      this.push(null);
    }
  });
  return shim;
}


