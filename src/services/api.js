const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem('token');
  const { headers: customHeaders, ...restOptions } = options;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customHeaders,
    },
    ...restOptions,
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, config);
  } catch (err) {
    throw new Error('Unable to connect to server. Make sure the backend is running.');
  }

  // Handle empty responses
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Server returned an invalid response. Make sure the backend is running on port 5000.');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;
