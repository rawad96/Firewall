import express, { Request, Response } from "express";
import pool from "./config/db";
import createTable from "./tables/db_table";
import rulesRouter from './routers/rules';
import authRouter from './routers/auth_router';
import accessRouter from './routers/access_router';
import usersRouter from './routers/users_router';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 5000;

app.use(express.json());

async function startServer() {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Connected to PostgreSQL");

    createTable();

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to PostgreSQL", error);
    process.exit(1);
  }
}

startServer();

const swaggerFile = path.join(__dirname, '../swagger/swagger.json');
const swaggerData = JSON.parse(fs.readFileSync(swaggerFile, 'utf-8'));

app.use('/rules', rulesRouter);
app.use('/auth', authRouter);
app.use('/access', accessRouter);
app.use('/users', usersRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerData));

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
