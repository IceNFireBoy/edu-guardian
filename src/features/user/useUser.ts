import { UserProfile, UserActivity } from 'types/user';
import { api } from 'utils/api';

// Fix the error handling
throw new Error(response.message || 'Failed to fetch user profile');
throw new Error(response.message || 'Failed to log study completion');
throw new Error(response.message || 'Failed to update user profile'); 