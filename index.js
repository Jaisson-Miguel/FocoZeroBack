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
  console.log(`Servidor rodando em http://192.168.1.111:${PORT}`);
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

app.get("/areas/:idArea", async (req, res) => {
  const { idArea } = req.params;

  if (!mongoose.Types.ObjectId.isValid(idArea)) {
    console.warn(`Tentativa de busca com ID inválido: ${idArea}`);
    return res.status(400).json({
      message: "ID de Área inválido. O ID deve ser um ObjectId válido.",
    });
  }

  try {
    const area = await Area.findById(idArea);

    if (!area) {
      return res.status(404).json({ message: "Área não encontrada." });
    }

    res.status(200).json({
      nome: area.nome || area.nomeArea || `Área ID: ${area._id}`,
      id: area._id,
    });
  } catch (error) {
    console.error("Erro ao buscar área por ID:", error.message);
    res.status(500).json({
      message: "Erro interno no servidor ao buscar área.",
      error: error.message,
    });
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
      return res.status(400).json({ message: "ID da área inválido." });
    }

    const areaObjectId = new mongoose.Types.ObjectId(idArea);

    const areaExiste = await Area.findById(idArea).select("nome");
    if (!areaExiste) {
      return res.status(404).json({ message: "Área não encontrada." });
    }

    const quarteiroes = await Quarteirao.aggregate([
      { $match: { idArea: areaObjectId } },

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
          nomeArea: "$areaInfo.nome",
          codigoArea: "$areaInfo.codigo",
          zonaArea: "$areaInfo.zona",
          idArea: 1,
        },
      },

      { $sort: { numero: 1 } },
    ]);

    if (!quarteiroes || quarteiroes.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhum quarteirão encontrado nesta área." });
    }

    res.json(quarteiroes);
  } catch (error) {
    console.error("Erro em /listarQuarteiroes/:idArea:", error);
    res
      .status(500)
      .json({ message: "Erro ao buscar quarteirões", error: error.message });
  }
});

app.get("/listarRepasse/:idQuarteirao", async (req, res) => {
  try {
    const { idQuarteirao } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idQuarteirao)) {
      return res.status(400).json({
        message: "ID do Quarteirão inválido.",
      });
    }

    const imoveis = await Imovel.find({
      idQuarteirao: idQuarteirao,
      status: { $in: ["fechado", "recusa"] },
    });

    if (!imoveis || imoveis.length === 0) {
      return res.status(404).json({
        message: `Nenhum imóvel com status 'fechado' ou 'recusa' encontrado para o Quarteirão ${idQuarteirao}.`,
      });
    }

    res.status(200).json(imoveis);
  } catch (error) {
    res.status(500).json({
      message: "Erro interno do servidor ao buscar os imóveis.",
      error: error.message,
    });
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

    const invalidIds = quarteiroes.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Alguns IDs de quarteirão são inválidos.",
        invalidIds,
      });
    }

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

app.post("/resetarResponsaveis", async (req, res) => {
  try {
    const resultado = await Quarteirao.updateMany(
      { idResponsavel: { $exists: true, $ne: null } },
      { $unset: { idResponsavel: "" } }
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
    const agora = new Date();
    const dataUTC = new Date(
      Date.UTC(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        0,
        0,
        0,
        0
      )
    );

    const resultado = await Quarteirao.updateMany(
      { _id: { $in: ids } },
      {
        $unset: { idResponsavel: "" },
        $set: {
          dataTrabalho: dataUTC,
          trabalhadoPor: trabalhadoPor || null,
          trabalhado: true,
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
          codigoArea: "$areaInfo.codigo",
          zonaArea: "$areaInfo.zona",
          mapaUrl: "$areaInfo.mapaUrl",
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

    const quarteiroesIds = await Quarteirao.find({
      idResponsavel: idUsuario,
    }).distinct("_id");

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

    if (posicao !== 0) {
      await Imovel.updateMany(
        { idQuarteirao, posicao: { $gte: posicao } },
        { $inc: { posicao: 1 } }
      );
    }

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

    if (posicao === 0) {
      await Imovel.updateMany({ idQuarteirao }, { $inc: { posicao: 1 } });
    }

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
      qtdLarvicida,
      qtdDepTratado,
      status,
      qtdFoco, // novo campo
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
        0,
        0
      )
    );

    // trata qtdFoco e foco automaticamente
    const qtdFocoNumber = Number(qtdFoco) || 0;
    const foco = qtdFocoNumber > 0;

    const novaVisita = await Visita.create({
      idImovel,
      idAgente,
      tipo: imovelExiste.tipo,
      dataVisita: dataUTC,
      depositosInspecionados,
      qtdDepEliminado,
      qtdLarvicida,
      qtdDepTratado,
      status,
      qtdFoco: qtdFocoNumber,
      foco,
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

    const dataLocal = new Date(data);
    const inicio = new Date(
      Date.UTC(
        dataLocal.getFullYear(),
        dataLocal.getMonth(),
        dataLocal.getDate(),
        0,
        0,
        0
      )
    );
    const fim = new Date(
      Date.UTC(
        dataLocal.getFullYear(),
        dataLocal.getMonth(),
        dataLocal.getDate(),
        23,
        59,
        59,
        999
      )
    );

    const visitas = await Visita.find({
      dataVisita: { $gte: inicio, $lte: fim },
    })
      .populate({
        path: "idImovel",
        populate: {
          path: "idQuarteirao",
          populate: { path: "idArea" },
        },
      })
      .populate("idAgente", "nome")
      .lean();

    if (!visitas.length) {
      return res
        .status(404)
        .json({ message: "Nenhuma visita encontrada para a data informada." });
    }

    const resumoPorArea = {};

    visitas.forEach((v) => {
      const area = v.idImovel?.idQuarteirao?.idArea;
      const areaId = area?._id?.toString();
      if (!areaId) return;

      if (!resumoPorArea[areaId]) {
        resumoPorArea[areaId] = {
          idArea: areaId,
          nomeArea: area.nome || "Sem nome",
          totalVisitas: 0,
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
      }

      const resumo = resumoPorArea[areaId];
      resumo.totalVisitas++;

      if (resumo.totalPorTipoImovel[v.tipo] !== undefined) {
        resumo.totalPorTipoImovel[v.tipo]++;
      }

      for (let key in v.depositosInspecionados) {
        resumo.totalDepositosInspecionados[key] +=
          v.depositosInspecionados[key];
      }

      resumo.totalDepEliminados += v.qtdDepEliminado || 0;

      if ((v.qtdLarvicida || 0) > 0 || (v.qtdDepTratado || 0) > 0) {
        if ((v.qtdLarvicida || 0) > 0) resumo.totalImoveisLarvicida++;
        resumo.totalLarvicidaAplicada += v.qtdLarvicida || 0;
        resumo.depositosTratadosComLarvicida += v.qtdDepTratado || 0;
      }

      resumo.totalAmostras += (v.amostraFinal || 0) - (v.amostraInicial || 0);

      if (v.foco) resumo.totalFocos++;
    });

    return res.status(200).json({
      message: "Resumo diário por área gerado com sucesso.",
      data,
      resumoPorArea: Object.values(resumoPorArea),
    });
  } catch (error) {
    console.error("Erro ao gerar resumo:", error);
    res.status(500).json({
      message: "Erro ao gerar resumo diário por área.",
      error: error.message,
    });
  }
});

app.get("/visitas/detalhes/diario/:diarioId", async (req, res) => {
  try {
    const { diarioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(diarioId)) {
      return res.status(400).json({ message: "ID do Diário inválido." });
    }

    const diario = await Diario.findById(diarioId)
      .select("resumo.idsVisitas")
      .lean();

    if (
      !diario ||
      !diario.resumo ||
      !diario.resumo.idsVisitas ||
      diario.resumo.idsVisitas.length === 0
    ) {
      return res.status(200).json([]);
    }

    const idsVisitas = diario.resumo.idsVisitas;

    const visitas = await Visita.find({
      _id: { $in: idsVisitas },
    })
      .populate({
        path: "idImovel",
        select: "logradouro numero idQuarteirao tipo posicao",
        populate: {
          path: "idQuarteirao",
          select: "numero idArea",
          populate: {
            path: "idArea",
            select: "nome",
          },
        },
      })
      .lean();

    if (!visitas.length) {
      return res.status(200).json([]);
    }

    const visitasAgrupadas = {};

    visitas.forEach((v) => {
      const quarteirao = v.idImovel?.idQuarteirao;

      if (!quarteirao || !quarteirao._id) return;

      const quarteiraoId = quarteirao._id.toString();

      if (!visitasAgrupadas[quarteiraoId]) {
        visitasAgrupadas[quarteiraoId] = {
          _id: quarteiraoId,
          numeroQuarteirao: quarteirao.numero || "QRT sem número",
          nomeArea: quarteirao.idArea?.nome || "Área Desconhecida",
          visitas: [],
        };
      }

      visitasAgrupadas[quarteiraoId].visitas.push({
        _id: v._id,
        tipoImovel: v.idImovel.tipo || v.tipo,
        rua: v.idImovel.logradouro || "Rua não informada",
        numeroImovel: v.idImovel.numero || "S/N",
        dataVisita: v.dataVisita,
        posicaoImovel: v.idImovel.posicao,
      });
    });

    const resultadoFinal = Object.values(visitasAgrupadas);

    return res.status(200).json(resultadoFinal);
  } catch (error) {
    console.error(
      "ERRO CRÍTICO na rota /visitas/detalhes/diario/:diarioId:",
      error
    );
    res.status(500).json({
      message: "Erro interno no servidor ao buscar detalhes das visitas.",
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
    const { idAgente, idArea, data, atividade, resumo } = req.body;

    if (!idAgente || !idArea || !data || !resumo) {
      return res
        .status(400)
        .json({ message: "Preencha os campos obrigatórios." });
    }

    const dataBruta = new Date(data);
    const ano = dataBruta.getUTCFullYear();
    const mes = dataBruta.getUTCMonth();
    const dia = dataBruta.getUTCDate();
    const inicioDia = new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));

    const semana = numeroSemana(inicioDia);

    const diario = await Diario.create({
      idAgente,
      idArea,
      semana,
      data: inicioDia,
      atividade: atividade || 4,
      resumo: {
        quarteiroes: resumo.quarteiroes || [],
        totalQuarteiroes: resumo.totalQuarteiroes || 0,
        totalVisitas: resumo.totalVisitas,
        totalVisitasTipo: resumo.totalVisitasTipo || {},
        totalDepInspecionados: resumo.totalDepInspecionados || {},
        totalDepEliminados: resumo.totalDepEliminados || 0,
        totalImoveisLarvicida: resumo.totalImoveisLarvicida || 0,
        totalQtdLarvicida: resumo.totalQtdLarvicida || 0,
        totalDepLarvicida: resumo.totalDepLarvicida || 0,
        imoveisComFoco: resumo.imoveisComFoco || 0, // vindo do front
        totalFocos: resumo.totalFocos || 0, // vindo do front
        idsVisitas: resumo.idsVisitas || [],
      },
    });

    res.status(200).json({
      message: "Diário cadastrado com sucesso.",
      diario,
    });
  } catch (error) {
    console.error("Erro ao cadastrar diário:", error);
    res
      .status(500)
      .json({ message: "Erro ao cadastrar diário.", error: error.message });
  }
});

app.get("/diarios/agente/:idAgente", async (req, res) => {
  const { idAgente } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(idAgente)) {
      return res.status(400).json({ message: "ID do Agente inválido." });
    }
    const agenteObjectId = new mongoose.Types.ObjectId(idAgente);

    const diáriosAgrupados = await Diario.aggregate([
      {
        $match: {
          idAgente: agenteObjectId,
        },
      },
      {
        $group: {
          _id: "$semana",
          totalDiarios: { $sum: 1 },
          diarios: {
            $push: {
              _id: "$_id",
              data: "$data",
              idArea: "$idArea",
              totalVisitas: "$resumo.totalVisitas",
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    console.log(
      `[BACKEND LOG] ${diáriosAgrupados.length} grupos de semanas encontrados.`
    );

    res.status(200).json(diáriosAgrupados);
  } catch (error) {
    console.error("ERRO CRÍTICO na rota /diarios/agente/:idAgente:", error);
    res.status(500).json({
      message: "Erro interno no servidor ao listar diários.",
      error: error.message,
    });
  }
});

app.get("/diarios/:diarioId", async (req, res) => {
  const { diarioId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(diarioId)) {
    return res.status(400).json({
      message: "ID do diário inválido.",
      details: "O formato do ID fornecido não é um ObjectId válido.",
    });
  }

  try {
    const diario = await Diario.findById(diarioId).lean();

    if (!diario) {
      return res.status(404).json({
        message: "Diário não encontrado.",
        details: `Nenhum diário foi encontrado com o ID: ${diarioId}`,
      });
    }

    return res.status(200).json(diario);
  } catch (error) {
    console.error(`ERRO CRÍTICO na rota /diarios/${diarioId}:`, error);

    return res.status(500).json({
      message: "Erro interno do servidor ao buscar diário.",
      error: error.message,
    });
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

app.get("/resumoDiario", async (req, res) => {
  try {
    const { idAgente, data } = req.query;
    console.log("📥 Requisição recebida em /resumoDiario");
    console.log("🔹 idAgente:", idAgente);
    console.log("🔹 data:", data);

    if (!idAgente || !data) {
      console.log("⚠️ Faltando parâmetros obrigatórios!");
      return res
        .status(400)
        .json({ message: "Os campos 'idAgente' e 'data' são obrigatórios." });
    }

    const d = new Date(data);
    const inicio = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      0,
      0,
      0,
      0
    );
    const fim = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      999
    );

    console.log(
      "🕒 Intervalo de busca:",
      inicio.toISOString(),
      "→",
      fim.toISOString()
    );

    // Busca os quarteirões
    const quarteiroes = await Quarteirao.find({
      trabalhadoPor: idAgente,
      dataTrabalho: { $gte: inicio, $lte: fim },
    })
      .populate("idArea", "nome")
      .lean();
    console.log(`📦 Quarteirões encontrados: ${quarteiroes.length}`);

    // Busca as visitas
    const visitas = await Visita.find({
      idAgente,
      dataVisita: { $gte: inicio, $lte: fim },
    })
      .populate({
        path: "idImovel",
        populate: {
          path: "idQuarteirao",
          populate: { path: "idArea" },
        },
      })
      .populate("idAgente", "nome")
      .lean();
    console.log(`👣 Visitas encontradas: ${visitas.length}`);

    // Busca os diários
    const diarios = await Diario.find({
      idAgente,
      data: { $gte: inicio, $lte: fim },
    }).lean();
    console.log(`📘 Diários encontrados: ${diarios.length}`);

    const areasFechadas = diarios.map((d) => d.idArea.toString());
    const resumoPorArea = {};

    // Monta estrutura inicial por área
    quarteiroes.forEach((q) => {
      const area = q.idArea;
      const areaId = area?._id?.toString();
      if (!areaId) return;

      if (!resumoPorArea[areaId]) {
        resumoPorArea[areaId] = {
          idArea: areaId,
          nomeArea: area.nome || "Sem nome",
          totalVisitas: 0,
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
          totalFocos: 0, // qtdFocos
          imoveisComFoco: 0, // visitas com foco
          quarteiroes: [],
          totalQuarteiroes: 0,
          jaFechado: areasFechadas.includes(areaId),
          idsVisitas: [],
        };
      }

      const resumo = resumoPorArea[areaId];
      resumo.quarteiroes.push(q.numero || "Sem número");
      resumo.totalQuarteiroes = resumo.quarteiroes.length;
    });

    // Processa as visitas
    visitas.forEach((v) => {
      const area = v.idImovel?.idQuarteirao?.idArea;
      const areaId = area?._id?.toString();
      if (!areaId) return;

      if (!resumoPorArea[areaId]) {
        resumoPorArea[areaId] = {
          idArea: areaId,
          nomeArea: area.nome || "Sem nome",
          totalVisitas: 0,
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
          imoveisComFoco: 0,
          quarteiroes: [],
          totalQuarteiroes: 0,
          jaFechado: areasFechadas.includes(areaId),
          idsVisitas: [],
        };
      }

      const resumo = resumoPorArea[areaId];
      resumo.totalVisitas++;
      resumo.idsVisitas.push(v._id.toString());

      if (resumo.totalPorTipoImovel[v.tipo] !== undefined) {
        resumo.totalPorTipoImovel[v.tipo]++;
      }

      for (let k in v.depositosInspecionados) {
        resumo.totalDepositosInspecionados[k] += v.depositosInspecionados[k];
      }

      resumo.totalDepEliminados += v.qtdDepEliminado || 0;

      if ((v.qtdLarvicida || 0) > 0 || (v.qtdDepTratado || 0) > 0) {
        if ((v.qtdLarvicida || 0) > 0) resumo.totalImoveisLarvicida++;
        resumo.totalLarvicidaAplicada += v.qtdLarvicida || 0;
        resumo.depositosTratadosComLarvicida += v.qtdDepTratado || 0;
      }

      resumo.totalAmostras += (v.amostraFinal || 0) - (v.amostraInicial || 0);

      // Soma focos
      resumo.totalFocos += v.qtdFoco || (v.foco ? 1 : 0); // qtdFocos
      if (v.foco) resumo.imoveisComFoco++; // visitas com foco
    });

    console.log("✅ Resumo diário gerado com sucesso!");
    console.log("📊 Áreas com resumo:", Object.keys(resumoPorArea).length);

    return res.status(200).json({
      message: "Resumo diário gerado com sucesso.",
      agente: idAgente,
      totalVisitas: visitas.length,
      totalQuarteiroesTrabalhados: quarteiroes.length,
      quarteiroesTrabalhados: quarteiroes.map((q) => ({
        id: q._id,
        nome: q.numero || "Sem número",
        area: q.idArea?.nome || "Sem área",
        dataTrabalho: q.dataTrabalho,
        trabalhado: q.trabalhado,
      })),
      resumoPorArea: Object.values(resumoPorArea),
    });
  } catch (error) {
    console.error("❌ Erro no resumo diário:", error);
    res.status(500).json({
      message: "Erro ao gerar resumo diário.",
      error: error.message,
    });
  }
});

app.get("/diariosPendentesFechamento/:idAgente/:semana", async (req, res) => {
  try {
    const { idAgente, semana } = req.params;

    // 1. Encontrar todas as áreas que JÁ FORAM fechadas naquela semana/agente.
    const semanaisFechados = await Semanal.find({ idAgente, semana })
      .select("idArea")
      .lean();

    const idsAreasFechadas = semanaisFechados.map((s) => s.idArea.toString());

    // 2. Encontrar todos os Diários para o Agente e Semana
    // Projetamos apenas os campos necessários para otimizar a busca.
    const diarios = await Diario.find({ idAgente, semana })
      .select("idArea data")
      .lean();

    if (!diarios.length) {
      // Nenhum diário encontrado (mesmo que não haja semanais fechados)
      return res.status(404).json({
        message:
          "Nenhum diário pendente ou já fechado encontrado para esta semana.",
      });
    }

    // 3. Agrupar os diários por idArea, filtrando as que JÁ estão fechadas
    const areasPendentesMap = diarios.reduce((acc, diario) => {
      const idArea = diario.idArea.toString();

      // Verifica se a área JÁ FOI FECHADA semanalmente
      if (!idsAreasFechadas.includes(idArea)) {
        if (!acc[idArea]) {
          acc[idArea] = {
            idArea: diario.idArea,
            diariosCount: 0,
            datasTrabalhadas: new Set(),
            // Inicializa o campo para o nome, se for buscar
            nomeArea: null,
          };
        }
        acc[idArea].diariosCount += 1;

        // Adiciona a data (apenas a parte da data) para contagem de dias trabalhados
        if (diario.data) {
          acc[idArea].datasTrabalhadas.add(
            new Date(diario.data).toISOString().slice(0, 10)
          );
        }
      }
      return acc;
    }, {});

    const areasPendentes = Object.values(areasPendentesMap);

    if (!areasPendentes.length) {
      // Todos os diários encontrados já foram fechados em um relatório Semanal.
      return res.status(404).json({
        message:
          "Todos os diários desta semana já foram fechados em relatórios semanais.",
      });
    }

    // 4. (Opcional, mas RECOMENDADO): Buscar os nomes das Áreas
    const idsParaBuscarNome = areasPendentes.map((area) => area.idArea);

    // Buscamos os nomes das áreas de uma vez
    const areasComNome = await Area.find({ _id: { $in: idsParaBuscarNome } })
      .select("_id nome nomeArea") // Ajuste 'nome' ou 'nomeArea' conforme seu schema Area
      .lean();

    const areaNomeLookup = areasComNome.reduce((acc, area) => {
      acc[area._id.toString()] =
        area.nome ||
        area.nomeArea ||
        `Área ID: ${area._id.toString().slice(-4)}`;
      return acc;
    }, {});

    // 5. Formatar a resposta final
    const areasFormatadas = areasPendentes.map((area) => ({
      idArea: area.idArea,
      // Adiciona o nome encontrado
      nomeArea:
        areaNomeLookup[area.idArea.toString()] ||
        `Área ID: ${area.idArea.toString().slice(-4)}`,
      diariosCount: area.diariosCount,
      qtdDiasTrabalhados: area.datasTrabalhadas.size,
      semana: parseInt(semana), // Inclui a semana de volta (útil para o frontend)
    }));

    res.status(200).json(areasFormatadas);
  } catch (error) {
    console.error(
      "Erro ao buscar diários pendentes para fechamento semanal:",
      error
    );
    res.status(500).json({
      message: "Erro interno do servidor ao buscar áreas pendentes.",
      error: error.message,
    });
  }
});

// SEMANAL
app.post("/cadastrarSemanal", async (req, res) => {
  try {
    const { idAgente, idArea, semana, atividade } = req.body;

    if (!idAgente || !idArea || !semana) {
      return res.status(400).json({
        message: "Preencha os campos obrigatórios: idAgente, idArea e semana.",
      });
    }

    // 1. Encontrar todos os diários da semana e área
    const diarios = await Diario.find({
      idAgente,
      idArea,
      semana,
      // Opcional: Você pode querer ignorar diários que já foram ligados a um semanal
      // (Assumindo que você teria um campo 'idSemanal' no Diario)
    });

    if (!diarios.length) {
      return res
        .status(404)
        .json({ message: "Nenhum diário encontrado para essa semana e área." });
    }

    // 2. Coletar os IDs dos diários para ligar ao Semanal
    const idsDiarios = diarios.map((d) => d._id); // <<< CORREÇÃO PRINCIPAL

    // 3. Inicialização e Agregação do Resumo
    const resumo = {
      quarteiroesTrabalhados: "", // Será preenchido abaixo
      totalQuarteiroesTrabalhados: 0,
      totalVisitas: 0,
      totalVisitasTipo: { r: 0, c: 0, tb: 0, pe: 0, out: 0 },
      totalDepInspecionados: { a1: 0, a2: 0, b: 0, c: 0, d1: 0, d2: 0, e: 0 },
      totalDepEliminados: 0,
      totalImoveisLarvicida: 0,
      totalQtdLarvicida: 0,
      totalDepLarvicida: 0,
      imoveisComFoco: 0,
      totalFocos: 0,
    };

    const quarteiroesSet = new Set();
    const diasSet = new Set();

    diarios.forEach((d) => {
      // Soma simples dos campos
      resumo.totalQuarteiroesTrabalhados +=
        d.resumo.totalQuarteiroesTrabalhados || 0;
      resumo.totalVisitas += d.resumo.totalVisitas || 0;
      resumo.totalDepEliminados += d.resumo.totalDepEliminados || 0;
      resumo.totalImoveisLarvicida += d.resumo.totalImoveisLarvicida || 0;
      resumo.totalQtdLarvicida += d.resumo.totalQtdLarvicida || 0;
      resumo.totalDepLarvicida += d.resumo.totalDepLarvicida || 0;
      resumo.imoveisComFoco += d.resumo.imoveisComFoco || 0;
      resumo.totalFocos += Number(d.resumo.totalFocos || 0);

      // Agregação de tipos de visita
      for (let key in resumo.totalVisitasTipo) {
        resumo.totalVisitasTipo[key] += d.resumo.totalVisitasTipo[key] || 0;
      }

      // Agregação de depósitos inspecionados
      for (let key in resumo.totalDepInspecionados) {
        resumo.totalDepInspecionados[key] +=
          d.resumo.totalDepInspecionados[key] || 0;
      }

      // Agregação dos quarteirões (eliminando duplicatas)
      if (d.resumo.quarteiroesTrabalhados) {
        // Supondo que 'quarteiroesTrabalhados' é uma string de quarteirões separados por vírgula no Diario
        d.resumo.quarteiroesTrabalhados
          .split(",")
          .forEach((q) => quarteiroesSet.add(q.trim()));
      }

      // Agregação dos dias trabalhados (eliminando duplicatas)
      if (d.data) {
        diasSet.add(d.data.toISOString().slice(0, 10));
      }
    });

    // Finaliza o resumo e calcula dias trabalhados
    resumo.quarteiroesTrabalhados = Array.from(quarteiroesSet)
      .sort()
      .join(", ");
    const qtdDiasTrabalhados = diasSet.size;

    // 4. Cria o registro Semanal
    const semanal = await Semanal.create({
      idAgente,
      idArea,
      semana,
      atividade: atividade || 4,
      qtdDiasTrabalhados,
      observacoes: "", // Adicionar observação, se necessário
      resumo, // <<< O objeto resumo inteiro, incluindo 'quarteiroesTrabalhados'
      idsDiarios, // <<< CORREÇÃO: Passando os IDs dos diários
    });

    // Opcional: Atualizar os diários para marcar que foram processados (bom para evitar reprocessamento)
    // await Diario.updateMany(
    //     { _id: { $in: idsDiarios } },
    //     { $set: { idSemanal: semanal._id, fechado: true } }
    // );

    res.status(201).json({
      // Mudança para 201 Created
      message: "Relatório semanal cadastrado com sucesso.",
      semanal,
    });
  } catch (error) {
    // Melhoria no tratamento de erro para diagnosticar o problema
    if (error.name === "CastError") {
      return res.status(400).json({
        message:
          "Erro de formato (CastError). Verifique se os IDs fornecidos são ObjectIds válidos.",
        details: error.message,
      });
    }
    if (error.name === "ValidationError") {
      console.error("Erro de Validação Mongoose:", error.errors);
      return res.status(400).json({
        message:
          "Erro de validação: campos obrigatórios no resumo ou no modelo principal estão faltando.",
        errors: error.errors,
      });
    }

    console.error("Erro ao cadastrar relatório semanal:", error.message);
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

    const resultadoImoveis = await Imovel.updateMany(
      { status: "visitado" },
      { status: "fechado" }
    );

    const resultadoQuarteiroes = await Quarteirao.updateMany(
      {},
      {
        $set: {
          trabalhado: false,
        },
      }
    );

    res.status(200).json({
      message:
        "Ciclo resetado com sucesso. Todos os imóveis foram fechados e quarteirões foram marcados como não trabalhados.",
      totalImoveisAtualizados: resultadoImoveis.modifiedCount,
      totalQuarteiroesAtualizados: resultadoQuarteiroes.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Não foi possível resetar o ciclo.",
      error: error.message,
    });
  }
});

app.get("/resumoCiclo/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário existe
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (usuario.funcao !== "adm") {
      return res
        .status(403)
        .json({ message: "Seu usuário não tem acesso a essa função." });
    }

    // Busca todos os imóveis
    const imoveis = await Imovel.find()
      .populate({
        path: "idQuarteirao",
        populate: { path: "idArea" },
      })
      .lean();

    // Busca semanais sem ciclo
    const semanaisVazios = await Semanal.find({ ciclo: { $exists: false } })
      .populate("idArea")
      .lean();

    // Agrupa resumo dos semanais por área
    const resumoSemanaisPorArea = {};

    semanaisVazios.forEach((s) => {
      const area = s.idArea;
      if (!area) return;

      const idArea = area._id.toString();
      if (!resumoSemanaisPorArea[idArea]) {
        resumoSemanaisPorArea[idArea] = {
          idArea,
          nomeArea: area.nome,
          totalQuarteiroesTrabalhados: 0,
          totalVisitas: 0,
          totalDepEliminados: 0,
          totalImoveisLarvicida: 0,
          totalQtdLarvicida: 0,
          totalDepLarvicida: 0,
          imoveisComFoco: 0,
          totalFocos: 0,
          totalVisitasTipo: { r: 0, c: 0, tb: 0, pe: 0, out: 0 },
          totalDepInspecionados: {
            a1: 0,
            a2: 0,
            b: 0,
            c: 0,
            d1: 0,
            d2: 0,
            e: 0,
          },
          quarteiroesTrabalhados: new Set(),
        };
      }

      const resumo = resumoSemanaisPorArea[idArea];

      // Soma os campos
      resumo.totalQuarteiroesTrabalhados +=
        s.resumo.totalQuarteiroesTrabalhados || 0;
      resumo.totalVisitas += s.resumo.totalVisitas || 0;
      resumo.totalDepEliminados += s.resumo.totalDepEliminados || 0;
      resumo.totalImoveisLarvicida += s.resumo.totalImoveisLarvicida || 0;
      resumo.totalQtdLarvicida += s.resumo.totalQtdLarvicida || 0;
      resumo.totalDepLarvicida += s.resumo.totalDepLarvicida || 0;
      resumo.imoveisComFoco += s.resumo.imoveisComFoco || 0;
      resumo.totalFocos += s.resumo.totalFocos || 0;

      // Soma tipos de visita
      for (let key in resumo.totalVisitasTipo) {
        resumo.totalVisitasTipo[key] += s.resumo.totalVisitasTipo[key] || 0;
      }

      // Soma depósitos inspecionados
      for (let key in resumo.totalDepInspecionados) {
        resumo.totalDepInspecionados[key] +=
          s.resumo.totalDepInspecionados[key] || 0;
      }

      // Junta quarteirões trabalhados sem duplicar
      if (s.resumo.quarteiroesTrabalhados) {
        s.resumo.quarteiroesTrabalhados
          .split(",")
          .forEach((q) => resumo.quarteiroesTrabalhados.add(q.trim()));
      }
    });

    // Converte Set em string para enviar ao frontend
    Object.values(resumoSemanaisPorArea).forEach((area) => {
      area.quarteiroesTrabalhados = Array.from(area.quarteiroesTrabalhados)
        .sort()
        .join(", ");
    });

    const resumoSemanaPorAreaArray = Object.values(resumoSemanaisPorArea);

    // Agrupa por área também os imóveis
    const agrupadoPorArea = {};
    for (const imovel of imoveis) {
      const area = imovel.idQuarteirao?.idArea;
      if (!area) continue;

      const idArea = area._id.toString();
      if (!agrupadoPorArea[idArea]) {
        agrupadoPorArea[idArea] = {
          idArea,
          nomeArea: area.nome,
          totalVisitados: 0,
          totalNaoVisitados: 0,
        };
      }

      if (imovel.status === "visitado") {
        agrupadoPorArea[idArea].totalVisitados += 1;
      } else {
        agrupadoPorArea[idArea].totalNaoVisitados += 1;
      }
    }

    const resultado = Object.values(agrupadoPorArea);

    // Totais gerais
    const totalVisitados = imoveis.filter(
      (i) => i.status === "visitado"
    ).length;
    const totalNaoVisitados = imoveis.filter(
      (i) => i.status !== "visitado"
    ).length;
    const totalGeral = totalVisitados + totalNaoVisitados;
    const percentualNaoVisitados =
      totalGeral > 0 ? ((totalNaoVisitados / totalGeral) * 100).toFixed(2) : 0;

    res.status(200).json({
      message: "Resumo de imóveis e semanais gerado com sucesso.",
      totalVisitados,
      totalNaoVisitados,
      totalGeral,
      percentualNaoVisitados: Number(percentualNaoVisitados),
      resumoImoveis: resultado,
      resumoSemanaisPorArea: resumoSemanaPorAreaArray,
    });
  } catch (error) {
    console.error("Erro no /resumoCiclo:", error);
    res.status(500).json({
      message: "Erro ao gerar resumo de imóveis e semanais.",
      error: error.message,
    });
  }
});

function numeroSemana(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);

  // Pega o primeiro dia do ano
  const inicioAno = new Date(d.getFullYear(), 0, 1);
  inicioAno.setHours(0, 0, 0, 0);

  // Calcula o número de dias entre o início do ano e a data atual
  const diffDias = Math.floor((d - inicioAno) / 86400000);

  // Pega o dia da semana do primeiro dia do ano (0 = domingo)
  const primeiroDiaSemana = inicioAno.getDay();

  // Ajusta o deslocamento para que a semana comece no domingo
  const ajuste = (diffDias + primeiroDiaSemana) / 7;

  // Retorna o número da semana (começando no domingo)
  return Math.floor(ajuste) + 1;
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
