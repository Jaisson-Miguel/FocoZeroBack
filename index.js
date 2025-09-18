import bcrypt from "bcrypt";
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import jwtVerify from "./services/jwt-verify.js";

import jwt from "jsonwebtoken";

import Usuario from "./Schemas/Usuario.js";
import Area from "./Schemas/Area.js";
import Quarteirao from "./Schemas/Quarteirao.js";
import Imovel from "./Schemas/Imovel.js";

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

app.get("/listarAreas", async (req, res) => {
  try {
    const areas = await Area.find();

    if(!areas || areas.length === 0){
      return res.status(404).json({message:"Nenhuma área encontrada."});
    }

    res.json(areas);
  } catch (error) {
    res.status(500).json({message:"Erro ao buscar áreas.", error: error.message});
  }
});

app.post("/cadastrarQuarteirao", async (req, res) => {
  try {
    const {idArea, numero} = req.body;

    if (!idArea || numero === undefined){
      return res.status(400).json({message:"Id da área e número do quarteirão são obrigatórios."});
    }

    const areaExiste = await Area.findById(idArea);
    if(!areaExiste){
      return res.status(404).json({message:"Área não encontrada."});
    }

    const quarteiraoExistente = await Quarteirao.findOne({ idArea, numero });
    if (quarteiraoExistente) {
      return res.status(400).json({ message: "Já existe um quarteirão com esse número nessa área." });
    }

    const novoQuarteirao = await Quarteirao.create({idArea, numero});

    res.status(200).json({
      message: "Quarteirão cadastrado com sucesso.",
      quarteirao: novoQuarteirao
    });
  } catch(error){
    res.status(500).json({message:"Erro ao cadastrar quarteirão.", error:error.message});
  }
});

app.get("/listarQuarteiroes/:idArea", async (req, res) => {
  try {
    const {idArea} = req.params;

    if (!mongoose.Types.ObjectId.isValid(idArea)) {
      return res.status(400).json({ message: "ID do quarteirão inválido." });
    }

    const areaExiste = await Area.findById(idArea);
    if(!areaExiste){
      return res.status(404).json({message:"Área não encontrada."});
    }

    const quarteiroes = await Quarteirao.find({idArea});

    if(!quarteiroes || quarteiroes.length === 0){
      return res.status(404).json({message:"Nenhum quarteirão encontrado."});
    }

    res.json(quarteiroes);
  } catch (error) {
    res.status(500).json({message:"Erro ao buscar quarteirões", error: error.message});
  }
});

app.post("/cadastrarImovel", async (req, res) => {
  try {
    const {idQuarteirao, logradouro, numero, status} = req.body;

    if(!idQuarteirao || !logradouro || !numero){
      return res.status(400).json({message:"Id do quarteirão e endereço são obrigatórios."});
    }

    const quarteiraoExistente = await Quarteirao.findById(idQuarteirao);
    if(!quarteiraoExistente){
      return res.status(404).json({message:"Quarteirão não encontrado."});
    }

    const novoImovel = await Imovel.create({
      idQuarteirao,
      logradouro,
      numero,
      status: status || "fechado",
    });

    res.status(200).json({
      message: "Imóvel cadastrado com sucesso.",
      imovel: novoImovel
    });

  } catch (error) {
    res.status(500).json({message:"Erro ao cadastrar imóvel.", error: error.message});
  }
});

app.get("/listarImoveis/:idQuarteirao", async (req, res) => {
  try {
    const {idQuarteirao} = req.params;

    if (!mongoose.Types.ObjectId.isValid(idQuarteirao)) {
      return res.status(400).json({ message: "ID do quarteirão inválido." });
    }

    const quarteiraoExiste = await Quarteirao.findById(idQuarteirao);
    if (!quarteiraoExiste) {
      return res.status(404).json({ message:"Quarteirão não encontrado." });
    }

    const imoveis = await Imovel.find({idQuarteirao});

    if (!imoveis || imoveis.length === 0) {
      return res.status(404).json({ message: "Nenhum imóvel encontrado neste quarteirão." });
    }

    res.json(imoveis);

  } catch (error) {
    res.status(200).json({message:"Erro ao listar imóveis.", error:error.message});
  }
});

startApp();