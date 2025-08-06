import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api", //TODO: mover para o .env
});
