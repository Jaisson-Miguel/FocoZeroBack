import express from "express";
import cors from "cors";

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
  res.json({ message: "Conexão bem-sucedida!" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
