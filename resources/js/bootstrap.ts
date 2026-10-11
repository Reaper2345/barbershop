import axios from 'axios';

// Send the CSRF token with every request so Inertia form submissions pass
// Laravel's VerifyCsrfToken middleware.
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
