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
import Semanal from "./Schemas/Semanal.js";

import conn from "./db/conn.js";

const SECRET_KEY = process.env.SECRET_KEY;
const PORT = process.env.PORT || 3333;

const startApp = async () => {
  const conectado = await conn();
  if (!conectado) {
    console.log("Falha ao conectar no BD.");
    process.exit(1);
  }
};

const app = express();
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
      return res.status(400).json({ message: "CPF e senha são obrigatórios." });
    }

    const usuario = await Usuario.findOne({ cpf });
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(400).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        cpf: usuario.cpf,
        nome: usuario.nome,
        funcao: usuario.funcao,
      },
      SECRET_KEY
      // { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro interno", error: error.message });
  }
});

// USUARIO
app.post("/cadastrarUsuario", async (req, res) => {
  try {
    const { nome, cpf, senha, funcao } = req.body;

    if (!nome || !senha || !cpf) {
      return res
        .status(400)
        .json({ message: "Nome, CPF e senha são obrigatórios." });
    }

    const cpfExiste = await Usuario.findOne({ cpf });
    if (cpfExiste) {
      return res
        .status(400)
        .json({ message: "Usuário com esse CPF já cadastrado." });
    }

    const senhaCriptografada = bcrypt.hashSync(senha, 8);

    const novoUsuario = await Usuario.create({
      nome,
      cpf,
      senha: senhaCriptografada,
      funcao: funcao || "agente",
    });

    res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      usuario: {
        id: novoUsuario._id,
        nome: novoUsuario.nome,
        cpf: novoUsuario.cpf,
        funcao: novoUsuario.funcao,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro interno. ", error: error.message });
  }
});

app.get("/listarUsuarios", async (req, res) => {
  try {
    const { funcao } = req.query;
    let usuarios;
    console.log(funcao);

    if (funcao) {
      usuarios = await Usuario.find({ funcao });
    } else {
      usuarios = await Usuario.find();
    }

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ message: "Usuários não encontrados" });
    }

    res.json(usuarios);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao listar usuários", error: error.message });
  }
});

app.put("/editarUsuario/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, senha, funcao } = req.body;

    let updateData = { nome, cpf, funcao };
    if (senha) {
      updateData.senha = bcrypt.hashSync(senha, 8);
    }

    const usuarioAtualizado = await Usuario.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!usuarioAtualizado) {
      return res.status(400).json({ message: "Usuário não encontrado." });
    }

    res.json({
      message: "Usuário atualizado com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao cadastrar usuário.", error: error.message });
  }
});

app.delete("/excluirUsuario/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const usuarioExcluido = await Usuario.findByIdAndDelete(id);

    if (!usuarioExcluido) {
      res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json({ message: "Usuário excluído com sucesso." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao excluir usuário. ", error: error.message });
  }
});

// AREA
app.post("/cadastrarArea", async (req, res) => {
  try {
    const { nome, codigo, zona, categoria, mapaUrl, idResponsavel } = req.body;

    if (!nome || !codigo || !zona || !categoria || !mapaUrl) {
      return res.status(400).json({ message: "Os campos são obrigatórios." });
    }

    const novaArea = await Area.create({
      nome,
      codigo,
      zona,
      categoria,
      mapaUrl,
      idResponsavel,
    });

    res.status(201).json({
      message: "Área cadastrada com sucesso.",
      area: novaArea,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao cadastrar área.", error: error.message });
  }
});

app.get("/listarAreas", async (req, res) => {
  try {
    const areas = await Area.find();

    if (!areas || areas.length === 0) {
      return res.status(404).json({ message: "Nenhuma área encontrada." });
    }

    res.json(areas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar áreas.", error: error.message });
  }
});

app.put("/editarArea/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, codigo, zona, categoria, mapaUrl } = req.body;

    const updateData = {};
    if (nome) updateData.nome = nome;
    if (codigo) updateData.codigo = codigo;
    if (zona) updateData.zona = zona;
    if (categoria) updateData.categoria = categoria;
    if (mapaUrl) updateData.mapaUrl = mapaUrl;

    const areaAtualizada = await Area.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!areaAtualizada) {
      return res.status(404).json({ message: "Área não encontrada." });
    }

    res
      .status(200)
      .json({ message: "Área editada com sucesso.", area: areaAtualizada });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao editar área.", error: error.message });
  }
});

app.delete("/excluirArea/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const areaExcluida = await Area.findByIdAndDelete(id);

    if (!areaExcluida) {
      return res.status(404).json({ message: "Área não encontrada." });
    }

    const quarteiroes = await Quarteirao.find({ idArea: id });
    const quarteiraoIds = quarteiroes.map((q) => q._id);

    await Imovel.deleteMany({ idQuarteirao: { $in: quarteiraoIds } });
    await Quarteirao.deleteMany({ idArea: id });

    res
      .status(200)
      .json({ message: "Área e quarteirões excluídos com sucesso" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao excluir área", error: error.message });
  }
});

// QUARTEIRAO
app.post("/cadastrarQuarteirao", async (req, res) => {
  try {
    const { idArea, numero } = req.body;

    if (!idArea || numero === undefined) {
      return res.status(400).json({
        message: "Id da área e número do quarteirão são obrigatórios.",
      });
    }

    const areaExiste = await Area.findById(idArea);
    if (!areaExiste) {
      return res.status(404).json({ message: "Área não encontrada." });
    }

    await Quarteirao.updateMany(
      { idArea, numero: { $gte: numero } },
      { $inc: { numero: 1 } }
    );

    const novoQuarteirao = await Quarteirao.create({
      idArea,
      numero,
      totalImoveis: 0,
      totalImoveisTipo: {
        r: 0,
        c: 0,
        tb: 0,
        pe: 0,
        out: 0,
      },
      qtdHabitantes: 0,
      qtdCachorros: 0,
      qtdGatos: 0,
    });

    res.status(200).json({
      message: "Quarteirão cadastrado com sucesso.",
      quarteirao: novoQuarteirao,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao cadastrar quarteirão.", error: error.message });
  }
});

app.get("/listarQuarteiroes/:idArea", async (req, res) => {
  try {
    const { idArea } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idArea)) {
      return res.status(400).json({ message: "ID do quarteirão inválido." });
    }

    const areaExiste = await Area.findById(idArea);
    if (!areaExiste) {
      return res.status(404).json({ message: "Área não encontrada." });
    }

    const quarteiroes = await Quarteirao.find({ idArea }).sort({ numero: 1 });

    if (!quarteiroes || quarteiroes.length === 0) {
      return res.status(404).json({ message: "Nenhum quarteirão encontrado." });
    }

    res.json(quarteiroes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar quarteirões", error: error.message });
  }
});

app.put("/editarQuarteirao/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, idArea } = req.body;

    let updateData = {};
    if (numero !== undefined) updateData.numero = numero;
    if (idArea) {
      const areaExiste = Area.findById(idArea);
      if (!areaExiste) {
        res.status(404).json({ message: "Área não encontrada." });
      }
      updateData.idArea = idArea;
    }

    const quarteiraoAtualizado = await Quarteirao.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!quarteiraoAtualizado) {
      res.status(404).json({ message: "Quarteirão não encontrado." });
    }

    res.json({
      message: "Quarteirão editado com sucesso.",
      quarteirao: quarteiraoAtualizado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao editar quarteirão. ", error: error.message });
  }
});

app.post("/atribuirQuarteiroes", async (req, res) => {
  try {
    const { idAgente, quarteiroes } = req.body;

    // validações
    if (!idAgente) {
      return res.status(400).json({ message: "ID do agente é obrigatório." });
    }
    if (
      !quarteiroes ||
      !Array.isArray(quarteiroes) ||
      quarteiroes.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Lista de quarteirões é obrigatória." });
    }

    // checar se os IDs são válidos
    const invalidIds = quarteiroes.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Alguns IDs de quarteirão são inválidos.",
        invalidIds,
      });
    }

    // atualizar os quarteirões
    const resultados = await Promise.all(
      quarteiroes.map(async (id) => {
        const q = await Quarteirao.findById(id);
        if (!q) return null;
        q.idResponsavel = idAgente;
        return await q.save();
      })
    );

    res.json({
      message: "Quarteirões atribuídos com sucesso.",
      quarteiroes: resultados.filter((r) => r !== null),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao atribuir quarteirões", error: error.message });
  }
});

// Resetar todos os responsáveis
app.post("/resetarResponsaveis", async (req, res) => {
  try {
    // Atualiza todos os quarteirões que têm idResponsavel definido
    const resultado = await Quarteirao.updateMany(
      { idResponsavel: { $exists: true, $ne: null } },
      { $unset: { idResponsavel: "" } } // remove o campo
    );

    res.status(200).json({
      message: "Todos os responsáveis foram resetados.",
      quarteiroesAtualizados: resultado.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erro ao resetar responsáveis.",
      error: error.message,
    });
  }
});

app.put("/atualizarQuarteiroes", async (req, res) => {
  const { ids, trabalhadoPor } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ message: "É necessário enviar um array de IDs." });
  }

  try {
    const resultado = await Quarteirao.updateMany(
      { _id: { $in: ids } },
      {
        $unset: { idResponsavel: "" },
        $set: {
          dataTrabalho: new Date(),
          trabalhadoPor: trabalhadoPor || null,
        },
      }
    );

    res.status(200).json({
      message: "Quarteirões atualizados com sucesso.",
      quarteiroesAtualizados: resultado.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erro ao atualizar quarteirões.",
      error: error.message,
    });
  }
});

app.get("/baixarQuarteiroesResponsavel/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idUsuario)) {
      return res.status(400).json({ message: "ID do usuário inválido." });
    }

    const quarteiroes = await Quarteirao.aggregate([
      { $match: { idResponsavel: new mongoose.Types.ObjectId(idUsuario) } },
      {
        $lookup: {
          from: "areas",
          localField: "idArea",
          foreignField: "_id",
          as: "areaInfo",
        },
      },
      { $unwind: "$areaInfo" },
      {
        $project: {
          _id: 1,
          numero: 1,
          nome: 1,
          idArea: 1,
          nomeArea: "$areaInfo.nome",
        },
      },
      { $sort: { nomeArea: 1, numero: 1 } },
    ]);

    if (!quarteiroes || quarteiroes.length === 0) {
      return res.status(404).json({ message: "Nenhum quarteirão encontrado." });
    }

    res.json(quarteiroes);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar quarteirões",
      error: error.message,
    });
  }
});

app.get("/baixarImoveisResponsavel/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idUsuario)) {
      return res.status(400).json({ message: "ID do usuário inválido." });
    }

    // Primeiro busca os quarteirões do responsável
    const quarteiroesIds = await Quarteirao.find({
      idResponsavel: idUsuario,
    }).distinct("_id");

    // Depois busca todos os imóveis desses quarteirões
    const imoveis = await Imovel.find({
      idQuarteirao: { $in: quarteiroesIds },
    }).sort({ posicao: 1 });

    if (!imoveis || imoveis.length === 0) {
      return res.status(404).json({ message: "Nenhum imóvel encontrado." });
    }

    res.json(imoveis);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar imóveis",
      error: error.message,
    });
  }
});

app.delete("/excluirQuarteirao/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const quarteiraoExcluido = await Quarteirao.findByIdAndDelete(id);
    if (!quarteiraoExcluido) {
      res.status(404).json({ message: "Quarteirão não encontrado." });
    }

    await Imovel.deleteMany({ idQuarteirao: id });

    res.status(200).json({
      message: "Quarteirão e imóveis excluídos com sucesso.",
      quarteirao: quarteiraoExcluido,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao excluir quarteirão.", error: error.message });
  }
});

// IMÓVEL
app.post("/cadastrarImovel", async (req, res) => {
  try {
    const {
      idQuarteirao,
      posicao,
      logradouro,
      numero,
      tipo,
      qtdHabitantes,
      qtdCachorros,
      qtdGatos,
      observacao,
    } = req.body;
    if (
      !idQuarteirao ||
      posicao === undefined ||
      !logradouro ||
      !numero ||
      !tipo
    ) {
      return res.status(400).json({
        message:
          "Id do quarteirão, posição, tipo de imóvel e endereço são obrigatórios.",
      });
    }

    const quarteiraoExistente = await Quarteirao.findById(idQuarteirao);
    if (!quarteiraoExistente) {
      return res.status(404).json({ message: "Quarteirão não encontrado." });
    }

    await Imovel.updateMany(
      { idQuarteirao, posicao: { $gte: posicao } },
      { $inc: { posicao: 1 } }
    );

    const novoImovel = await Imovel.create({
      idQuarteirao,
      posicao: posicao,
      logradouro,
      numero,
      tipo,
      qtdHabitantes: qtdHabitantes || 0,
      qtdCachorros: qtdCachorros || 0,
      qtdGatos: qtdGatos || 0,
      observacao: observacao || "Nenhuma observação.",
    });

    await Quarteirao.findByIdAndUpdate(idQuarteirao, {
      $inc: {
        totalImoveis: 1,
        [`totalImoveisTipo.${tipo}`]: 1,
        qtdHabitantes: qtdHabitantes || 0,
        qtdCachorros: qtdCachorros || 0,
        qtdGatos: qtdGatos || 0,
      },
    });

    res.status(200).json({
      message: "Imóvel cadastrado com sucesso.",
      imovel: novoImovel,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao cadastrar imóvel.", error: error.message });
  }
});

app.get("/listarImoveis/:idQuarteirao", async (req, res) => {
  try {
    const { idQuarteirao } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idQuarteirao)) {
      return res.status(400).json({ message: "ID do quarteirão inválido." });
    }

    const quarteiraoExiste = await Quarteirao.findById(idQuarteirao);
    if (!quarteiraoExiste) {
      return res.status(404).json({ message: "Quarteirão não encontrado." });
    }

    const imoveis = await Imovel.find({ idQuarteirao }).sort({ posicao: 1 });

    if (!imoveis || imoveis.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhum imóvel encontrado neste quarteirão." });
    }

    res.json(imoveis);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao listar imóveis.", error: error.message });
  }
});

app.put("/editarImovel/:id", async (req, res) => {
  try {
    const { id } = req.params;
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

    const imovelAntigo = await Imovel.findById(id);
    if (!imovelAntigo) {
      res.status(404).json({ message: "Imóvel não encontrado." });
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
        status,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Imóvel editado com sucesso.",
      imovel: imovelAtualizado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao editar imóvel.", error: error.message });
  }
});

app.delete("/excluirImovel/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const imovelExiste = await Imovel.findById(id);
    if (!imovelExiste) {
      res.status(404).json({ message: "Imóvel não encontrado." });
    }

    await Imovel.findByIdAndDelete(id);

    res.status(200).json({ message: "Imóvel excluído com sucesso." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao excluir imóvel.", error: error.message });
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
      status,
    } = req.body;

    if (!idImovel || !idAgente) {
      return res
        .status(400)
        .json({ message: "Preencha os campos obrigatórios." });
    }

    const imovelExiste = await Imovel.findById(idImovel);
    if (!imovelExiste) {
      return res.status(404).json({ message: "Imóvel não encontrado." });
    }

    if (imovelExiste.status === "visitado") {
      return res.status(400).json({ message: "Este imóvel já foi visitado." });
    }

    const dataBruta = dataVisita ? new Date(dataVisita) : new Date();

    const dataUTC = new Date(
      Date.UTC(
        dataBruta.getFullYear(),
        dataBruta.getMonth(),
        dataBruta.getDate(),
        0,
        0,
        0
      )
    );

    const novaVisita = await Visita.create({
      idImovel,
      idAgente,
      tipo: imovelExiste.tipo,
      dataVisita: dataUTC,
      depositosInspecionados,
      qtdDepEliminado,
      foco,
      qtdLarvicida,
      qtdDepTratado,
      status,
    });

    await Imovel.findByIdAndUpdate(idImovel, { status: status });

    res.status(200).json({
      message: "Visita realizada com sucesso",
      visita: novaVisita,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao lançar visita.", error: error.message });
  }
});

app.get("/listarVisita", async (req, res) => {
  try {
    const { idAgente, data } = req.body;

    if (!idAgente || !data) {
      return res
        .status(400)
        .json({ message: "Preencha os campos obrigatórios." });
    }

    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);

    const visitas = await Visita.find({
      idAgente,
      dataVisita: { $gte: inicio, $lte: fim },
    }).populate({
      path: "idImovel",
      populate: { path: "idQuarteirao" },
    });

    const visitasArea = visitas.filter((v) => {
      const quarteirao = v.idImovel?.idQuarteirao;
      return quarteirao && quarteirao.idArea?.toString() === idArea;
    });

    if (!visitas.length) {
      return res
        .status(404)
        .json({ message: "Nenhuma visita encontrada para essa data e área." });
    }

    const resumo = {
      totalQuarteiroesTrabalhados: new Set(
        visitasArea.map((v) => v.idImovel.idQuarteirao._id.toString())
      ).size,
      totalVisitas: 0,
      totalPorTipoImovel: { r: 0, c: 0, tb: 0, pe: 0, out: 0 },
      totalDepositosInspecionados: {
        a1: 0,
        a2: 0,
        b: 0,
        c: 0,
        d1: 0,
        d2: 0,
        e: 0,
      },
      totalImoveisLarvicida,
      totalDepEliminados: 0,
      imoveisComLarvicida: 0,
      totalLarvicidaAplicada: 0,
      depositosTratadosComLarvicida: 0,
    };

    visitas.forEach((v) => {
      if (v.status === "visitado") {
        resumo.totalVisitas += 1;
        resumo.totalPorTipoImovel[v.tipo] += 1;

        const depositos = v.depositosInspecionados.toObject();
        for (let key in depositos) {
          resumo.totalDepositosInspecionados[key] += depositos[key];
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
      }
    });

    const semana = numeroSemana(dataRef);

    const diario = await Diario.create({
      idAgente,
      idArea,
      semana,
      data: dataRef,
      atividade: atividade || 4,
      resumo,
    });

    res.status(200).json({
      message: "Diário cadastrado com sucesso.",
      diario,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao cadastrar diário.", error: error.message });
  }
});

app.get("/visitasPorData", async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({ message: "O campo 'data' é obrigatório." });
    }

    // Intervalo do dia
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);

    const visitas = await Visita.find({
      dataVisita: { $gte: inicio, $lte: fim },
    })
      .populate({
        path: "idImovel",
        populate: {
          path: "idQuarteirao",
          populate: { path: "idArea" }, // 🔹 adiciona o populate da área
        },
      })
      .populate("idAgente", "nome");

    if (!visitas.length) {
      return res
        .status(404)
        .json({ message: "Nenhuma visita encontrada para a data informada." });
    }

    // 🔹 Calcula o resumo
    const resumo = {
      totalVisitas: visitas.length,
      totalPorTipoImovel: { r: 0, c: 0, tb: 0, out: 0, pe: 0 },
      totalDepositosInspecionados: {
        a1: 0,
        a2: 0,
        b: 0,
        c: 0,
        d1: 0,
        d2: 0,
        e: 0,
      },
      totalDepEliminados: 0,
      totalImoveisLarvicida: 0,
      totalLarvicidaAplicada: 0,
      depositosTratadosComLarvicida: 0,
      totalAmostras: 0,
      totalFocos: 0,
    };

    visitas.forEach((v) => {
      // Soma tipo de imóvel
      if (resumo.totalPorTipoImovel[v.tipo] !== undefined) {
        resumo.totalPorTipoImovel[v.tipo] += 1;
      }

      // Soma depósitos inspecionados
      for (let key in v.depositosInspecionados) {
        resumo.totalDepositosInspecionados[key] +=
          v.depositosInspecionados[key];
      }

      // Depósitos eliminados
      resumo.totalDepEliminados += v.qtdDepEliminado;

      // Larvicida
      if ((v.qtdLarvicida || 0) > 0 || (v.qtdDepTratado || 0) > 0) {
        if ((v.qtdLarvicida || 0) > 0) resumo.totalImoveisLarvicida += 1;
        resumo.totalLarvicidaAplicada += v.qtdLarvicida || 0;
        resumo.depositosTratadosComLarvicida += v.qtdDepTratado || 0;
      }

      // Amostras
      resumo.totalAmostras += v.amostraFinal - v.amostraInicial;

      // Focos
      if (v.foco) resumo.totalFocos += 1;
    });

    return res.status(200).json({
      message: "Resumo diário gerado com sucesso.",
      data,
      resumo,
      visitas,
    });
  } catch (error) {
    console.error("Erro ao gerar resumo:", error);
    res.status(500).json({
      message: "Erro ao gerar resumo diário.",
      error: error.message,
    });
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
      status,
    } = req.body;

    const visitaExiste = await Visita.findById(id);
    if (!visitaExiste) {
      return res.status(404).json({ message: "Visita não encontrada." });
    }

    const dataAtualizada = dataVisita
      ? new Date(
          Date.UTC(
            new Date(dataVisita).getFullYear(),
            new Date(dataVisita).getMonth(),
            new Date(dataVisita).getDate(),
            0,
            0,
            0
          )
        )
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
        status,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Visita editada com sucesso.",
      visita: visitaAtualizada,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao editar visita.", error: error.message });
  }
});

app.delete("/excluirVisita", async (req, res) => {
  try {
    const { idAgente, idImovel, data } = req.body;

    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);

    if (!idAgente || !idImovel || !data) {
      return res
        .status(400)
        .json({ message: "Preencha os campos obrigatórios." });
    }

    const visitaRemovida = await Visita.findOneAndDelete({
      idAgente,
      idImovel,
      dataVisita: { $gte: inicio, $lte: fim },
    });

    if (!visitaRemovida) {
      return res
        .status(404)
        .json({ message: "Nenhuma visita encontrada para remover." });
    }

    res.status(200).json({
      message: "Visita removida com sucesso.",
      visita: visitaRemovida,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao deletar visita.", error: error.message });
  }
});

// DIÁRIO
app.post("/cadastrarDiario", async (req, res) => {
  try {
    const { idAgente, idArea, data, atividade } = req.body;

    if (!idAgente || !idArea || !data) {
      return res
        .status(400)
        .json({ message: "Preencha os campos obrigatórios." });
    }

    const dataRef = new Date(data);
    dataRef.setHours(0, 0, 0, 0);
    const inicioDia = new Date(dataRef);
    const fimDia = new Date(dataRef);
    fimDia.setHours(23, 59, 59, 999);

    let visitas = await Visita.find({
      idAgente,
      dataVisita: { $gte: inicioDia, $lte: fimDia },
      status: "visitado",
    }).populate({
      path: "idImovel",
      populate: { path: "idQuarteirao" },
    });

    visitas = visitas.filter(
      (v) => v.idImovel?.idQuarteirao?.idArea?.toString() === idArea
    );

    if (!visitas.length) {
      return res
        .status(404)
        .json({ message: "Nenhuma visita encontrada para essa data e área." });
    }

    const resumo = {
      totalQuarteiroesTrabalhados: new Set(
        visitas.map((v) => v.idImovel.idQuarteirao.numero)
      ).size,
      totalVisitas: visitas.length,
      totalVisitasTipo: { r: 0, c: 0, tb: 0, pe: 0, out: 0 },
      totalDepInspecionados: { a1: 0, a2: 0, b: 0, c: 0, d1: 0, d2: 0, e: 0 },
      totalDepEliminados: 0,
      totalImoveisLarvicida: 0,
      totalQtdLarvicida: 0,
      totalDepLarvicida: 0,
      imoveisComFoco: 0,
      quarteiroesTrabalhados: "",
    };

    const quarteiroesSet = new Set();

    visitas.forEach((v) => {
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

      if (v.idImovel?.idQuarteirao?.numero) {
        quarteiroesSet.add(v.idImovel.idQuarteirao.numero);
      }
    });

    resumo.quarteiroesTrabalhados = Array.from(quarteiroesSet)
      .sort((a, b) => a - b)
      .join(", ");

    const semana = numeroSemana(dataRef);

    const diario = await Diario.create({
      idAgente,
      idArea,
      semana,
      data: dataRef,
      atividade: atividade || 4,
      resumo,
    });

    res.status(200).json({
      message: "Diário cadastrado com sucesso.",
      diario,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao cadastrar diário.", error: error.message });
  }
});

app.post("/listarDiario", async (req, res) => {
  try {
    const { idAgente, idArea, semana } = req.body;
    const filtro = {};

    if (idAgente) filtro.idAgente = idAgente;
    if (idArea) filtro.idArea = idArea;
    if (semana) filtro.semana = semana;

    const diario = await Diario.findOne({
      idAgente,
      idArea,
      semana: parseInt(semana, 10),
    });

    if (!diario) {
      return res
        .status(404)
        .json({ message: "Diário não encontrado para essa semana." });
    }

    res.status(200).json(diario);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao listar diário.", error: error.message });
  }
});

app.put("/editarDiario/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { semana, data, visita, visitas: visitasArea, resumo } = req.body;

    const diarioExiste = await Diario.findById(id);
    if (!diarioExiste) {
      return res.status(404).json({ message: "Diário não encontrado." });
    }

    const dataAtualizada = data
      ? new Date(
          Date.UTC(
            new Date(data).getFullYear(),
            new Date(data).getMonth(),
            new Date(data).getDate(),
            0,
            0,
            0
          )
        )
      : diarioExiste.data;

    const diarioAtualizado = await Diario.findByIdAndUpdate(
      id,
      {
        semana,
        data: dataAtualizada,
        atividade,
        resumo,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Diário editado com sucesso.",
      diario: diarioAtualizado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao gerar relatório diário.",
      error: error.message,
    });
  }
});

app.delete("/excluirDiario/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Preencha os campos obrigatórios." });
    }

    const diarioRemovido = await Diario.findByIdAndDelete(id);

    if (!diarioRemovido) {
      return res.status(404).json({ message: "Diário não encontrado." });
    }

    res.status(200).json({
      message: "Diário removido com sucesso.",
      diario: diarioRemovido,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao excluir diário.", error: error.message });
  }
});

// SEMANAL
app.post("/cadastrarSemanal", async (req, res) => {
  try {
    const { idAgente, idArea, semana, atividade } = req.body;

    if (!idAgente || !idArea || !semana) {
      return res
        .status(400)
        .json({ message: "Preencha os campos obrigatórios." });
    }

    const diarios = await Diario.find({
      idAgente,
      idArea,
      semana,
    });

    if (!diarios.length) {
      return res
        .status(404)
        .json({ message: "Nenhum diário encontrado para essa semana e área." });
    }

    const resumo = {
      totalQuarteiroesTrabalhados: 0,
      totalVisitas: 0,
      totalVisitasTipo: { r: 0, c: 0, tb: 0, pe: 0, out: 0 },
      totalDepInspecionados: { a1: 0, a2: 0, b: 0, c: 0, d1: 0, d2: 0, e: 0 },
      totalDepEliminados: 0,
      totalImoveisLarvicida: 0,
      totalQtdLarvicida: 0,
      totalDepLarvicida: 0,
      imoveisComFoco: 0,
    };

    const quarteiroesSet = new Set();
    const diasSet = new Set();

    diarios.forEach((d) => {
      resumo.totalQuarteiroesTrabalhados +=
        d.resumo.totalQuarteiroesTrabalhados;
      resumo.totalVisitas += d.resumo.totalVisitas;

      for (let key in resumo.totalVisitasTipo) {
        resumo.totalVisitasTipo[key] += d.resumo.totalVisitasTipo[key] || 0;
      }

      for (let key in resumo.totalDepInspecionados) {
        resumo.totalDepInspecionados[key] +=
          d.resumo.totalDepInspecionados[key] || 0;
      }

      resumo.totalDepEliminados += d.resumo.totalDepEliminados;
      resumo.totalImoveisLarvicida += d.resumo.totalImoveisLarvicida;
      resumo.totalQtdLarvicida += d.resumo.totalQtdLarvicida;
      resumo.totalDepLarvicida += d.resumo.totalDepLarvicida;
      resumo.imoveisComFoco += d.resumo.imoveisComFoco;

      if (d.resumo.quarteiroesTrabalhados) {
        d.resumo.quarteiroesTrabalhados
          .split(",")
          .forEach((q) => quarteiroesSet.add(q.trim()));
      }

      diasSet.add(d.data.toISOString().slice(0, 10));
    });

    resumo.quarteiroesTrabalhados = Array.from(quarteiroesSet)
      .sort()
      .join(", ");
    const qtdDiasTrabalhados = diasSet.size;

    const semanal = await Semanal.create({
      idAgente,
      idArea,
      semana,
      atividade: atividade || 4,
      quarteiroesTrabalhados: resumo.quarteiroesTrabalhados,
      qtdDiasTrabalhados,
      resumo,
    });

    res.status(200).json({
      message: "Relatório semanal cadastrado com sucesso.",
      semanal,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao cadastrar relatório semanal.",
      error: error.message,
    });
  }
});

app.post("/listarSemanal", async (req, res) => {
  try {
    const { idAgente, idArea, semana } = req.body;
    const filtro = {};

    if (idAgente) filtro.idAgente = idAgente;
    if (idArea) filtro.idArea = idArea;
    if (semana) filtro.semana = semana;

    const semanais = await Semanal.find(filtro);

    if (!semanais.length) {
      return res
        .status(404)
        .json({ message: "Nenhum relatório semanal encontrado." });
    }

    res.status(200).json(semanais);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar relatórios semanais.",
      error: error.message,
    });
  }
});

app.get("/listarSemanal/:id", async (req, res) => {
  try {
    const semanal = await Semanal.findById(req.params.id);

    if (!semanal) {
      return res
        .status(404)
        .json({ message: "Relatório semanal não encontrado." });
    }

    res.status(200).json(semanal);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar relatório semanal.",
      error: error.message,
    });
  }
});

app.put("/editarSemanal/:id", async (req, res) => {
  try {
    const { atividade, quarteiroesTrabalhados, qtdDiasTrabalhados, resumo } =
      req.body;

    const semanal = await Semanal.findByIdAndUpdate(
      req.params.id,
      { atividade, quarteiroesTrabalhados, qtdDiasTrabalhados, resumo },
      { new: true, runValidators: true }
    );

    if (!semanal) {
      return res
        .status(404)
        .json({ message: "Relatório semanal não encontrado." });
    }

    res.status(200).json({
      message: "Relatório semanal atualizado com sucesso.",
      semanal,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar relatório semanal.",
      error: error.message,
    });
  }
});

app.delete("/excluirSemanal/:id", async (req, res) => {
  try {
    const semanal = await Semanal.findByIdAndDelete(req.params.id);

    if (!semanal) {
      return res
        .status(404)
        .json({ message: "Relatório semanal não encontrado." });
    }

    res
      .status(200)
      .json({ message: "Relatório semanal removido com sucesso." });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao remover relatório semanal.",
      error: error.message,
    });
  }
});

// RESETAR
app.post("/resetarCiclo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (usuario.funcao !== "adm") {
      return res
        .status(403)
        .json({ message: "Seu usuário não tem acesso a essa função." });
    }

    const resultado = await Imovel.updateMany(
      { status: "visitado" },
      { status: "fechado" }
    );
    res.status(200).json({
      message: "Ciclo resetado com sucesso. Todos os imóveis foram fechados.",
      totalAtualizados: resultado.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Não foi possível resetar o ciclo.",
      error: error.message,
    });
  }
});

app.get("/resumoCiclo/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (usuario.funcao !== "adm") {
      return res
        .status(403)
        .json({ message: "Seu usuário não tem acesso a essa função." });
    }

    // Busca todos os imóveis com status "visitado"
    const imoveisVisitados = await Imovel.find({ status: "visitado" });

    if (imoveisVisitados.length === 0) {
      return res.status(200).json({
        message: "Nenhum imóvel visitado encontrado.",
        resumo: {},
        totalVisitados: 0,
      });
    }

    // Gera o resumo por tipo
    const resumoPorTipo = {};
    for (const imovel of imoveisVisitados) {
      const tipo = imovel.tipo || "não definido";
      resumoPorTipo[tipo] = (resumoPorTipo[tipo] || 0) + 1;
    }

    res.status(200).json({
      message: "Resumo gerado com sucesso.",
      totalVisitados: imoveisVisitados.length,
      resumo: resumoPorTipo,
    });
  } catch (error) {
    res.status(500).json({
      message: "Não foi possível gerar o resumo do ciclo.",
      error: error.message,
    });
  }
});

function numeroSemana(d) {
  const data = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dia = data.getDay() || 7;
  data.setDate(data.getDate() + 4 - dia);
  const ano1 = new Date(data.getFullYear(), 0, 1);
  return Math.ceil(((data - ano1) / 86400000 + 1) / 7);
}

function areaExiste(id) {
  const resposta = Area.findById(id);
  return resposta;
}

function quarteiraoExiste(id) {
  const resposta = Quarteirao.findById(id);
  return resposta;
}

function imovelExiste(id) {
  const resposta = Imovel.findById(id);
  return resposta;
}

startApp();
