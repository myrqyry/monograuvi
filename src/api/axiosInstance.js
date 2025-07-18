import axios from 'axios';
import { toast } from 'react-toastify';

// Utility to show toast notifications
// This will be effective once ToastContainer is set up in App.jsx
const showToast = (message, type = 'error') => {
  switch (type) {
    case 'error':
      toast.error(message);
      break;
    case 'success':
      toast.success(message);
      break;
    case 'warning':
      toast.warn(message);
      break;
    case 'info':
      toast.info(message);
      break;
    default:
      toast(message);
      break;
  }
};

const axiosInstance = axios.create({
  // Attempt to use Vite environment variable for base URL
  // Fallback for environments where it might not be set (e.g. some test runners if not configured)
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api', // Added /api
  timeout: 30000, // Optional: 30 second timeout
  // headers: { 'Content-Type': 'application/json' } // Default, but can be set
});

axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // You could also handle successful responses globally here if needed (e.g. show success toast)
    // Example: if (response.config.method !== 'get') showToast('Operation successful!', 'success');
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let errorCode = 'UNKNOWN_ERROR'; // Default error code

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response);
      const responseData = error.response.data;

      // Use detail from FastAPI error response, then statusText, then default
      errorMessage = responseData?.detail || error.response.statusText || `Server responded with status ${error.response.status}`;
      errorCode = responseData?.error_code || `HTTP_${error.response.status}`;

      // Specific handling based on status code or custom error_code from backend
      switch (error.response.status) {
        case 400:
          errorMessage = responseData?.detail || "Invalid request. Please check your input.";
          // errorCode already set from responseData?.error_code or defaults to HTTP_400
          break;
        case 401:
          errorMessage = responseData?.detail || 'Authentication failed. Please log in again.';
          // Potentially redirect to login page or trigger re-authentication
          // window.location.href = '/login';
          break;
        case 403:
          errorMessage = responseData?.detail || "You don't have permission to perform this action.";
          break;
        case 404:
          errorMessage = responseData?.detail || "The requested resource was not found.";
          break;
        case 500:
          errorMessage = responseData?.detail || "An unexpected internal server error occurred.";
          break;
        // Add more cases as needed based on your application's error codes
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response Error:', error.request);
      errorMessage = 'Could not connect to the server. Please check your network connection.';
      errorCode = 'NETWORK_ERROR';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
      errorMessage = `Error setting up request: ${error.message}`;
      errorCode = 'REQUEST_SETUP_ERROR';
    }

    // Display the error to the user via a toast notification
    // Include the error code for easier debugging or if users need to report it
    showToast(`Error: ${errorMessage} (Code: ${errorCode})`, 'error');

    // It's important to return a rejected promise so that individual .catch()
    // blocks in your components can still handle the error if needed (e.g., for UI state changes).
    return Promise.reject(error);
  }
);

export default axiosInstance;
