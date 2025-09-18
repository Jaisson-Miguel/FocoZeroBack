import bcrypt from "bcrypt";
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import jwtVerify from "./services/jwt-verify.js";

import jwt from "jsonwebtoken";

import Usuario from "./Schemas/Usuario.js";
import Area from "./Schemas/Area.js";

import conn from "./db/conn.js";

const SECRET_KEY = process.env.SECRET_KEY;
const PORT = process.env.PORT || 3333;

const startApp = async () => {
  const conectado = await conn();
  if(!conectado){
    console.log("Falha ao conectar no BD.");
    process.exit(1);
  }
}

const app = express();
app.use(express.json());

app.post("/login", async (req, res) => {
  try {
    const {cpf, senha} = req.body;

    if (!cpf || !senha) {
      return res.status(400).json({message: "CPF e senha são obrigatórios."});
    }

    const usuario = await Usuario.findOne({cpf});
    if(!usuario){
      return res.status(404).json({message:"Usuário não encontrado."});
    }

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);

    if(!senhaCorreta){
      return res.status(400).json({message:"Senha incorreta."});
    }

    const token = jwt.sign(
      {id: usuario._id, name: usuario.nome, funcao: usuario.funcao},
      SECRET_KEY,
      {expiresIn: "1h"}
    );

    res.status(200).json({
      usuario:{
        id: usuario._id,
        nome: usuario.nome,
        cpf: usuario.cpf,
        funcao: usuario.funcao,
      },
      token
    });
  }catch(error){
    res.status(500).json({message:"Erro interno", error: error.message});
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.post("/cadastrarUsuario", async (req, res) => {
  try{
    const{nome, cpf, senha, funcao} = req.body;

    if (!nome || !senha || !cpf) {
      return res.status(400).json({message: "Nome, CPF e senha são obrigatórios."});
    }

    const cpfExiste = await Usuario.findOne({cpf});
    if(cpfExiste){
      return res.status(400).json({message:"Usuário com esse CPF já cadastrado."});
    }

    const senhaCriptografada = bcrypt.hashSync(senha, 8);

    const novoUsuario = await Usuario.create({
      nome, cpf, senha: senhaCriptografada, funcao: funcao || "agente",
    });

    res.status(201).json({message:"Usuário cadastrado com sucesso.", 
      usuario: {
        id: novoUsuario._id,
        nome: novoUsuario.nome,
        cpf: novoUsuario.cpf,
        funcao: novoUsuario.funcao,
      },
    });
  } catch (error) {
    res.status(500).json({message:"Erro interno. ", error: error.message});
  }
});

app.post("/cadastrarArea", async (req, res) => {
  try{
    const {nome, mapaUrl} = req.body;

    if(!nome || !mapaUrl){
      return res.status(400).json({message:"Nome e mapa são obrigatórios."});
    }

    const novaArea = await Area.create({nome, mapaUrl});

    res.status(201).json({
      message: "Área cadastrada com sucesso.",
      area: novaArea
    });
  } catch (error) {
    res.status(500).json({message: "Erro ao cadastrar área.", error: error.message});
  }
});

startApp();