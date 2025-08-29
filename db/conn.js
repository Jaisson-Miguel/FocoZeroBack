import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const conn = async () => {
  try {
    await mongoose.connect(process.env.URL_DATABASE);
    console.log("🟢 Conectado ao MongoDB com sucesso!");
    return true;
  } catch (error) {
    console.log("🔴 Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
    return false;
  }
};

export default conn;
