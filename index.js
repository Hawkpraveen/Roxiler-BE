import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./Database/config.js";
import { fetchAndSeedData } from "./Controllers/ProductContorller.js";
import router from "./Routers/ProductsRouter.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello, this is a REST API with Node.js and Express");
});

app.get('/initialize', async (req, res) => {
    try {
        await fetchAndSeedData();
        res.status(200).send('Database initialized with seed data.');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//api routes

app.use('/api/products',router)

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
