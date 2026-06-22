import axios from "axios";
import Cookies from "js-cookie";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const instance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send cookies with requests
});

// Fallback interceptor: read token from cookie if not already set
instance.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = Cookies.get("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token) {
  if (token) {
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    Cookies.set("token", token, { expires: 7 }); // 7 days
  } else {
    delete instance.defaults.headers.common["Authorization"];
    Cookies.remove("token");
    Cookies.remove("user");
  }
}

export default instance;
