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
import Visita from "./Schemas/Visita.js";
import Diario from "./Schemas/Diario.js";

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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// LOGIN
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

// USUARIO
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

app.get("/listarUsuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find();

    if(!usuarios || usuarios.length === 0){
      return res.status(404).json({message: "Usuários não encontrado.s"});
    }

    res.json(usuarios);

  } catch (error) {
    res.status(500).json({message:"Erro ao listar usuários", erorr: erorr.message});
  }
});

app.put("/editarUsuario/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const {nome, cpf, senha, funcao} = req.body;

    let updateData = {nome, cpf, funcao};
    if (senha) {
      updateData.senha = bcrypt.hashSync(senha, 8);
    }

    const usuarioAtualizado = await Usuario.findByIdAndUpdate(id, updateData, {new:true});

    if(!usuarioAtualizado){
      return res.status(400).json({message:"Usuário não encontrado."});
    }

    res.json({message:"Usuário atualizado com sucesso.", usuario:usuarioAtualizado});

  } catch (error) {
    res.status(500).json({message:"Erro ao cadastrar usuário.", error:error.message});
  }
});

app.delete("/excluirUsuario/:id", async (req, res) => {
  try {
    const {id} = req.params;

    const usuarioExcluido = await Usuario.findByIdAndDelete(id);

    if(!usuarioExcluido){
      res.status(404).json({message:"Usuário não encontrado."});
    }

    res.status(200).json({message:"Usuário excluído com sucesso."});
  } catch (error) {
    res.status(500).json({message:"Erro ao excluir usuário. ", error: error.message});
  }
});

// AREA
app.post("/cadastrarArea", async (req, res) => {
  try{
    const {nome, codigo, zona, categoria, mapaUrl} = req.body;

    if(!nome || !codigo || !zona || !categoria || !mapaUrl){
      return res.status(400).json({message:"Os campos são obrigatórios."});
    }

    const novaArea = await Area.create({nome, codigo, zona, categoria, mapaUrl});

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

app.put("/editarArea/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const {nome, codigo, zona, categoria, mapaUrl} = req.body;

    const updateData = {};
    if (nome) updateData.nome = nome;
    if (codigo) updateData.codigo = codigo;
    if (zona) updateData.zona = zona;
    if (categoria) updateData.categoria = categoria;
    if (mapaUrl) updateData.mapaUrl = mapaUrl;

    const areaAtualizada = await Area.findByIdAndUpdate(id, updateData, {new: true});

    if(!areaAtualizada){
      return res.status(404).json({message:"Área não encontrada."});
    };

    res.status(200).json({message: "Área editada com sucesso.", area:areaAtualizada});

  } catch (error) {
    res.status(500).json({message:"Erro ao editar área.", error:error.message});
  }
});

app.delete("/excluirArea/:id", async (req, res) => {
  try {
    const {id} = req.params;

    const areaExcluida = await Area.findByIdAndDelete(id);

    if(!areaExcluida){
      return res.status(404).json({message:"Área não encontrada."});
    };

    const quarteiroes = await Quarteirao.find({ idArea: id });
    const quarteiraoIds = quarteiroes.map(q => q._id);

    await Imovel.deleteMany({idQuarteirao: { $in: quarteiraoIds }})
    await Quarteirao.deleteMany({idArea: id});

    res.status(200).json({message:"Área e quarteirões excluídos com sucesso"});
  } catch (error) {
    res.status(500).json({message: "Erro ao excluir área", error:error.message});
  }
});

// QUARTEIRAO
app.post("/cadastrarQuarteirao", async (req, res) => {
  try {
    const {idArea, numero} = req.body;

    if (!idArea || numero === undefined){
      return res.status(400).json({message:"Id da área e número do quarteirão são obrigatórios."});
    }

    if(!areaExiste(idArea)){
      return res.status(404).json({message:"Área não encontrada."});
    }

    await Quarteirao.updateMany(
      { idArea, numero: { $gte: numero } },
      { $inc: { numero: 1 } }
    );

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

    if(!areaExiste(idArea)){
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

app.put("/editarQuarteirao/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const {numero, idArea} = req.body;

    let updateData = {};
    if (numero !== undefined) updateData.numero = numero;
    if (idArea){
      if(!areaExiste(idArea)){
        res.status(404).json({message:"Área não encontrada."});
      }
      updateData.idArea = idArea;
    }

    const quarteiraoAtualizado = await Quarteirao.findByIdAndUpdate(
      id,
      updateData,
      {new: true}
    );

    if (!quarteiraoAtualizado){
      res.status(404).json({message:"Quarteirão não encontrado."});
    }

    res.json({
      message:"Quarteirão editado com sucesso.",
      quarteirao: quarteiraoAtualizado
    });

  } catch (error) {
    res.status(500).json({message:"Erro ao editar quarteirão. ", error: error.message});
  }
});

app.delete("/excluirQuarteirao/:id", async (req, res) => {
  try {
    const {id} = req.params;

    const quarteiraoExcluido = await Quarteirao.findByIdAndDelete(id);
    if(!quarteiraoExcluido){
      res.status(404).json({message:"Quarteirão não encontrado."});
    }

    await Imovel.deleteMany({idQuarteirao:id});

    res.status(200).json({
      message:"Quarteirão e imóveis excluídos com sucesso.",
      quarteirao: quarteiraoExcluido
    });
  } catch (error) {
    res.status(500).json({message:"Erro ao excluir quarteirão.", error:error.message});
  }
});

// IMÓVEL
app.post("/cadastrarImovel", async (req, res) => {
  try {
    const {idQuarteirao, logradouro, numero, tipo, qtdHabitantes, qtdCachorros, qtdGatos, observacao, status} = req.body;

    if(!idQuarteirao || !logradouro || !numero || !tipo ){
      return res.status(400).json({message:"Id do quarteirão, tipo de imóvel e endereço são obrigatórios."});
    }

    if(!quarteiraoExiste(idQuarteirao)){
      return res.status(404).json({message:"Quarteirão não encontrado."});
    }
console.log(req.body);

    const novoImovel = await Imovel.create({
      idQuarteirao,
      logradouro,
      numero,
      tipo,
      qtdHabitantes: qtdHabitantes || 0,
      qtdCachorros: qtdCachorros || 0,
      qtdGatos: qtdGatos || 0,
      observacao: observacao || "Nenhuma observação.",
      status: status || "fechado",
    });

    res.status(500).json({
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

    if (!quarteiraoExiste(idQuarteirao)) {
      return res.status(404).json({ message:"Quarteirão não encontrado." });
    }

    const imoveis = await Imovel.find({idQuarteirao});

    if (!imoveis || imoveis.length === 0) {
      return res.status(404).json({ message: "Nenhum imóvel encontrado neste quarteirão." });
    }

    res.json(imoveis);

  } catch (error) {
    res.status(500).json({message:"Erro ao listar imóveis.", error:error.message});
  }
});

app.put("/editarImovel/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const {
      logradouro,
      numero,
      tipo,
      qtdHabitantes,
      qtdCachorros,
      qtdGatos,
      observacao,
      status,
    } = req.body;

    if(!imovelExiste(id)){
      res.status(404).json({message:"Imóvel não encontrado."});
    }

    const imovelAtualizado = await Imovel.findByIdAndUpdate(
      id,
      {
        logradouro,
        numero,
        tipo,
        qtdHabitantes,
        qtdCachorros,
        qtdGatos,
        observacao,
        status
    },
    {new: true}
    );

    res.status(200).json({message:"Imóvel editado com sucesso.", imovel: imovelAtualizado});

  } catch (error) {
    res.status(500).json({message:"Erro ao editar imóvel.", error:error.message});
  }
});

app.delete("/excluirImovel/:id", async (req, res) => {
  try {
    const {id} = req.params;

    if(!imovelExiste(id)){
      res.status(404).json({message:"Imóvel não encontrado."});
    }

    await Imovel.findByIdAndDelete(id);

    res.status(200).json({message:"Imóvel excluído com sucesso."});

  } catch (error) {
    res.status(500).json({message:"Erro ao excluir imóvel.", error:error.message});
  }
});

// VISITA
app.post("/cadastrarVisita", async (req, res) => {
  try {
    const {
      idImovel,
      idAgente,
      tipo,
      dataVisita,
      depositosInspecionados,
      qtdDepEliminado,
      foco,
      qtdLarvicida,
      qtdDepTratado,
      sincronizado,
      status
    } = req.body;

    if(!idImovel || !idAgente){
      return res.status(400).json({message:"Preencha os campos obrigatórios."});
    }

    const imovel = await Imovel.findById(idImovel);
    if(!imovel){
      return res.status(404).json({message: "Imóvel não encontrado."});
    }

    if(imovel.status === "visitado"){
      return res.status(400).json({ message: "Este imóvel já foi visitado." });
    }

    const dataBruta = dataVisita ? new Date(dataVisita) : new Date();

    const dataUTC = new Date(Date.UTC(dataBruta.getFullYear(), dataBruta.getMonth(), dataBruta.getDate(), 0, 0, 0));

    const novaVisita = await Visita.create({
      idImovel,
      idAgente,
      tipo: imovel.tipo,
      dataVisita: dataUTC,
      depositosInspecionados,
      qtdDepEliminado,
      foco,
      qtdLarvicida,
      qtdDepTratado,
      sincronizado,
      status
    });

    await Imovel.findByIdAndUpdate(idImovel, { status: status });

    res.status(200).json({
      message: "Visita realizada com sucesso",
      visita: novaVisita
    });

  } catch (error) {
    res.status(500).json({message:"Erro ao lançar visita.", error: error.message});
  }
});

app.get("/listarVisita", async (req, res) => {
  try {
    const { idAgente, data } = req.body;

    if (!idAgente || !data) {
      return res.status(400).json({ message: "Preencha os campos obrigatórios."});
    }

    const inicio = new Date(data);
    inicio.setHours(0,0,0,0);
    const fim = new Date(data);
    fim.setHours(23,59,59,999);

    const visitas = await Visita.find({
      idAgente,
      dataVisita: { $gte: inicio, $lte: fim }
    })
    .populate({
      path: "idImovel",
      populate: { path: "idQuarteirao" }
    });

    if (!visitas.length) {
      return res.status(404).json({ message: "Nenhuma visita encontrada para esse agente e data." });
    }

    res.status(200).json({ visitas });

  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar visitas.", error: error.message });
  }
});

app.put("/editarVisita/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      dataVisita,
      depositosInspecionados,
      qtdDepEliminado,
      foco,
      qtdLarvicida,
      qtdDepTratado,
      sincronizado,
      status
    } = req.body;

    const visitaExiste = await Visita.findById(id);
    if (!visitaExiste) {
      return res.status(404).json({ message: "Visita não encontrada." });
    }

    const dataAtualizada = dataVisita
      ? new Date(Date.UTC(new Date(dataVisita).getFullYear(), new Date(dataVisita).getMonth(), new Date(dataVisita).getDate(), 0, 0, 0))
      : visitaExiste.dataVisita;

    const visitaAtualizada = await Visita.findByIdAndUpdate(
      id,
      {
        tipo,
        dataVisita: dataAtualizada,
        depositosInspecionados,
        qtdDepEliminado,
        foco,
        qtdLarvicida,
        qtdDepTratado,
        sincronizado,
        status
      },
      { new: true }
    );

    res.status(200).json({
      message: "Visita editada com sucesso.",
      visita: visitaAtualizada
    });

  } catch (error) {
    res.status(500).json({ message: "Erro ao editar visita.", error: error.message });
  }
});

app.delete("/excluirVisita", async (req, res) => {
  try {
    const { idAgente, idImovel, data} = req.body;

    const inicio = new Date(data);
    inicio.setHours(0,0,0,0);
    const fim = new Date(data);
    fim.setHours(23,59,59,999);

    if (!idAgente || !idImovel || !data) {
      return res.status(400).json({ message: "Preencha os campos obrigatórios."});
    }

    const visitaRemovida = await Visita.findOneAndDelete({
      idAgente,
      idImovel,
      dataVisita: { $gte: inicio, $lte: fim }
    });

    if (!visitaRemovida) {
      return res.status(404).json({ message: "Nenhuma visita encontrada para remover." });
    }

    res.status(200).json({ message: "Visita removida com sucesso.", visita: visitaRemovida });

  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar visita.", error: error.message });
  }
});

//DIÁRIO
app.post("/cadastrarDiario", async (req, res) => {
  try {
    const { idAgente, idArea, data, atividade } = req.body;

    if (!idAgente || !idArea || !data) {
      return res.status(400).json({ message: "Preencha os campos obrigatórios." });
    }

    const dataRef = new Date(data);
    dataRef.setHours(0, 0, 0, 0);
    const inicioDia = new Date(dataRef);
    const fimDia = new Date(dataRef);
    fimDia.setHours(23, 59, 59, 999);

    let visitas = await Visita.find({
      idAgente,
      dataVisita: { $gte: inicioDia, $lte: fimDia },
      status: "visitado"
    }).populate({
      path: "idImovel",
      populate: { path: "idQuarteirao" }
    });

    visitas = visitas.filter(v => v.idImovel.idQuarteirao.idArea.toString() === idArea);

    if (!visitas.length) {
      return res.status(404).json({ message: "Nenhuma visita encontrada para essa data e área." });
    }

    const resumo = {
      totalQuarteiroesTrabalhados: new Set(visitas.map(v => v.idImovel.idQuarteirao._id.toString())).size,
      totalVisitas: visitas.length,
      totalVisitasTipo: { r:0, c:0, tb:0, pe:0, out:0 },
      totalDepInspecionados: { a1:0, a2:0, b:0, c:0, d1:0, d2:0, e:0 },
      totalDepEliminados: 0,
      totalImoveisLarvicida: 0,
      totalQtdLarvicida: 0,
      totalDepLarvicida: 0,
      imoveisComFoco: 0,
    };

    visitas.forEach(v => {
      resumo.totalVisitasTipo[v.tipo] += 1;

      for (let key in v.depositosInspecionados) {
        resumo.totalDepInspecionados[key] += v.depositosInspecionados[key];
      }

      resumo.totalDepEliminados += v.qtdDepEliminado;

      if (v.qtdLarvicida > 0) {
        resumo.totalImoveisLarvicida += 1;
        resumo.totalQtdLarvicida += v.qtdLarvicida;
        resumo.totalDepLarvicida += v.qtdDepTratado;
      }

      if (v.foco) {
      resumo.imoveisComFoco += 1;
      }
    });

    const semana = numeroSemana(dataRef);

    const diario = await Diario.create({
      idAgente,
      idArea,
      semana,
      data: dataRef,
      atividade: atividade || 4,
      resumo
    });

    res.status(200).json({
      message: "Diário cadastrado com sucesso.",
      diario
    });

  } catch (error) {
    res.status(500).json({ message: "Erro ao cadastrar diário.", error: error.message });
  }
});

app.get("/listarDiario/:idAgente/:idArea/:semana", async (req, res) => {
  try {
    const { idAgente, idArea, semana } = req.params;

    const diario = await Diario.findOne({
      idAgente,
      idArea,
      semana: parseInt(semana, 10)
    });

    if (!diario) {
      return res.status(404).json({ message: "Diário não encontrado para essa semana." });
    }

    res.json(diario);
  } catch (error) {
    res.status(500).json({message:"Erro ao listar diário.", error: error.message});
  }
});

app.put("/editarDiario/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      semana,
      data,
      atividade,
      resumo
    } = req.body;

    const diarioExiste = await Diario.findById(id);
    if (!diarioExiste) {
      return res.status(404).json({ message: "Diário não encontrado." });
    }

    const dataAtualizada = data
      ? new Date(Date.UTC(new Date(data).getFullYear(), new Date(data).getMonth(), new Date(data).getDate(), 0, 0, 0))
      : diarioExiste.data;

    const diarioAtualizado = await Diario.findByIdAndUpdate(
      id,
      {
        semana,
        data: dataAtualizada,
        atividade,
        resumo
      },
      { new: true }
    );

    res.status(200).json({
      message: "Diário editado com sucesso.",
      diario: diarioAtualizado
    });

  } catch (error) {
    res.status(500).json({ message: "Erro ao editar diário.", error: error.message });
  }
});

app.delete("/excluirDiario/:idAgente/:idArea/:semana", async (req, res) => {
  try {
    const { idAgente, idArea, semana } = req.params;

    const diarioRemovido = await Diario.findOneAndDelete({
      idAgente,
      idArea,
      semana: parseInt(semana, 10)
    });

    if (!diarioRemovido) {
      return res.status(404).json({ message: "Diário não encontrado para ser excluído." });
    }

    res.json({ message: "Diário excluído com sucesso.", diario: diarioRemovido });

  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir diário.", error: error.message });
  }
});

function numeroSemana(d) {
  const data = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dia = data.getDay() || 7;
  data.setDate(data.getDate() + 4 - dia);
  const ano1 = new Date(data.getFullYear(),0,1);
  return Math.ceil((((data - ano1) / 86400000) + 1)/7);
}

function areaExiste(id){
  const resposta = Area.findById(id);
  return resposta;
}

function quarteiraoExiste(id){
  const resposta = Quarteirao.findById(id);
  return resposta;
}

function imovelExiste(id){
  const resposta = Imovel.findById(id);
  return resposta;
}

startApp();