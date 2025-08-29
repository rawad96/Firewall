import express, { Request, Response } from "express";
import prisma from "./config/db";
// import createTable from "./tables/db_table";
import rulesRouter from './routers/rules';
import authRouter from './routers/auth_router';
import accessRouter from './routers/access_router';
import usersRouter from './routers/users_router';
import { config } from "./config/env";

import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();


// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL via Prisma");

    // createTable();

    app.listen(config.PORT, () => {
      console.log(`🚀 Server running at http://localhost:${config.PORT}`);
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

// Raw swagger JSON for client consumption
app.get('/swagger.json', (_req: Request, res: Response) => {
  res.json(swaggerData);
});
