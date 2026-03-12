import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// On 419 (session/CSRF expired), redirect to login without showing the error page
const originalFetch = window.fetch;
window.fetch = function (...args) {
    return originalFetch.apply(this, args).then((response) => {
        if (response.status === 419) {
            window.location.replace('/login');
            return Promise.reject(new Error('Session expired'));
        }
        return response;
    });
};
