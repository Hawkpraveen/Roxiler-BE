import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongo_URI = process.env.MONGO_URI;

const connectDB = async (req, res) => {
  try {
    const connection = await mongoose.connect(mongo_URI);
    console.log('Mongo Db connected');
    return connection;
    
  } catch (error) {
    console.log(error.message);
  }
};

export default connectDB;
