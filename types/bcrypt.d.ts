declare module 'bcrypt' {
  export function compare(data: string, encrypted: string): Promise<boolean>
  export function hash(data: string, saltOrRounds: string | number): Promise<string>
  export function genSalt(rounds?: number): Promise<string>
} 