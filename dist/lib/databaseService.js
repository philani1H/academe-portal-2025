// Client-side database service
export class DatabaseService {
    static API_ENDPOINT = '/api/db';
    static async query(query, values) {
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
            return { data: data };
        }
        catch (error) {
            console.error('Database service error:', error);
            return { error: 'Failed to execute database operation' };
        }
    }
}
