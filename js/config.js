// API Configuration
const API_BASE_URL = 'https://zeltivehrms.pythonanywhere.com'; // Change this to your backend URL when deployed

// API Endpoints
const API_ENDPOINTS = {
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    checkIn: `${API_BASE_URL}/api/attendance/checkin`,
    checkOut: `${API_BASE_URL}/api/attendance/checkout`,
    getAttendance: `${API_BASE_URL}/api/attendance/records`,
    getCurrentUser: `${API_BASE_URL}/api/auth/current`
};
