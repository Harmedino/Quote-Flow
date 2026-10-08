/**
 * The part of the native `bcrypt` package the API uses (it ships no type
 * declarations). The promise forms run on libuv's thread pool, so hashing
 * never blocks the event loop.
 */
declare module 'bcrypt' {
  interface Bcrypt {
    hash(data: string, saltOrRounds: string | number): Promise<string>;
    compare(data: string, encrypted: string): Promise<boolean>;
    getRounds(encrypted: string): number;
  }

  const bcrypt: Bcrypt;
  export default bcrypt;
}
