import { neon } from '@neondatabase/serverless';

let client: ReturnType<typeof neon> | null = null;

export const sql = (strings: TemplateStringsArray, ...values: any[]): Promise<any> => {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined");
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client(strings, ...values);
};
