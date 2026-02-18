import axios from 'axios';

// Backend API URL - This should ideally come from an environment variable
// Create a .env.local file with NEXT_PUBLIC_API_URL=http://localhost:8000/api
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Important for Sanctum CSRF cookie
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Check for token in localStorage (if using token-based auth alongside Sanctum)
        // Note: Sanctum SPA authentication uses cookies, but if we are using tokens for mobile/external access style:
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const { response } = error;

        // Handle 401 Unauthorized
        if (response && response.status === 401) {
            // Clear local storage and redirect to login
            localStorage.removeItem('admin_token'); // If using tokens

            // Avoid redirect loops if already on login page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
