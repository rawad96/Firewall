import prisma from '../config/db';

const createTable = async () => {
  try {
    // Prisma will handle table creation through migrations
    // This function is kept for compatibility but now just ensures connection
    await prisma.$connect();
    console.log("Database connected successfully!");
    
    // You can run this command to create tables:
    // npx prisma migrate dev --name init
    // Or for production:
    // npx prisma migrate deploy
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

export default createTable;