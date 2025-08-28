const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://intervue-assignment-i8sj.onrender.com"
    : "http://localhost:3001"; // must match your backend port

const SOCKET_URL =
  import.meta.env.MODE === "production"
    ? "https://intervue-assignment-i8sj.onrender.com"
    : "http://localhost:3001";

export { API_BASE_URL, SOCKET_URL };
