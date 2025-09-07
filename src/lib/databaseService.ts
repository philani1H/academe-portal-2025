// Client-side database service

type DatabaseResponse<T> = {
  data?: T;
  error?: string;
};

export class DatabaseService {
  private static readonly API_ENDPOINT = '/api/db';

  static async query<T>(query: string, values?: any[]): Promise<DatabaseResponse<T>> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, values }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data: data as T };
    } catch (error) {
      console.error('Database service error:', error);
      return { error: 'Failed to execute database operation' };
    }
  }
}