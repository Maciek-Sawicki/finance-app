import axios from 'axios';

// withCredentials makes the browser send the httpOnly session cookie
// automatically on every request - that's the only auth mechanism now.
// There used to also be a request interceptor attaching an
// Authorization: Bearer header from a token in localStorage, but nothing
// server-side ever needed both at once (authenticate() already preferred
// the cookie), and keeping a raw JWT in localStorage meant an XSS bug could
// read it directly, unlike the cookie.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:3000/api',
  withCredentials: true,
});

export default api;
