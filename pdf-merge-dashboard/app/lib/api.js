import axios from "axios";

const API_URL = "http://localhost:4000/v1";

export const api = axios.create({
  baseURL: API_URL,
});
