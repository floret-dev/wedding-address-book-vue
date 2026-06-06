const BASE_URL = '/api';

const handleResponse = response => response.json().then(results => response.ok ? results : Promise.reject(results));

const requestWithBody = (method, url, body) => window.fetch(`${BASE_URL}${url}`, {
    method,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
}).then(handleResponse);

const get = (url, params) => window.fetch(`${BASE_URL}${url}?${new URLSearchParams(params)}`, {
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
}).then(handleResponse);

const put = (url, body) => requestWithBody('PUT', url, body);
const post = (url, body) => requestWithBody('POST', url, body);


export const getGuestForm = viewId => get('/form', { viewId });
export const sendFormLink = phoneNumber => post('/link', { phoneNumber });
export const sendFormView = id => put('/view', { id });
export const submitGuestDetails = payload => put('/submit', payload);
