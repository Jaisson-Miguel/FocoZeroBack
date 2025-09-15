import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const conn = async () => {
  try {
    await mongoose.connect(process.env.URL_DATABASE);
    return true;
  } catch (error) {
    process.exit(1);
    return false;
  }
};

export default conn;
