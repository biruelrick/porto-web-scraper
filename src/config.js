// src/config.js
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  LOGIN_URL: process.env.LOGIN_URL,
  USERNAME: process.env.USERNAME,
  PASSWORD: process.env.PASSWORD
};
