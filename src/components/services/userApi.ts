import axios from 'axios';

export interface User {
  id: number;
  first_name: string;
  surname: string;
}

export const fetchUserById = async (id: number): Promise<User | null> => {
  try {
    const response = await axios.get(
      `https://westrembomis.onrender.com/api/users/${id}`,
      { withCredentials: true }
    );
    
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    return null;
  }
};

export const getUserFullName = (user: User | null): string => {
  if (!user) return '—';
  return `${user.first_name ?? ''} ${user.surname ?? ''}`.trim() || '—';
};