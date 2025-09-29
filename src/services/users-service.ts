/**
 * WordPress Users Service
 * Fetches WordPress users for location manager assignment
 */

export interface WordPressUser {
  id: number;
  name: string;
  username: string;
  email: string;
  roles: string[];
  display_name: string;
}

class UsersService {
  private baseUrl = '/api/users-matrix'; // Use WordPress Core API via proxy

  async getUsers(bustCache = false): Promise<WordPressUser[]> {
    try {
      // Always use cache busting to ensure real data
      const url = `${this.baseUrl}/users?_t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Data is already in the correct format from UsersMatrix API
      const users: WordPressUser[] = data.map((user: any) => ({
        id: user.id,
        name: user.name || user.display_name,
        username: user.username,
        email: user.email || '',
        roles: user.roles || [],
        display_name: user.display_name || user.name || user.username
      }));

      return users;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<WordPressUser | null> {
    try {
      // Always bust cache to get real data
      const users = await this.getUsers(true);
      const user = users.find(u => u.id === userId);
      
      if (user) {
        return user;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }
}

export const usersService = new UsersService();