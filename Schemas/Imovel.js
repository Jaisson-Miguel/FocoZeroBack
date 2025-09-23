import mongoose from "mongoose";

import { Schema, Model, model } from "mongoose";

const imovelModel = new Schema({
  idQuarteirao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quarteirao",
    required: true,
  },
  logradouro: {
    type: String,
    required: true,
  },
  numero: {
    type: String,
    required: true,
  },
  tipo:{
    type: String,
    enum:["r", "c", "tb", "pe", "out"],
    required:true
  },
  qtdHabitantes:{
    type: Number,
    default: 0,
  },
  qtdCachorros:{
    type: Number,
    default: 0,
  },
  qtdGatos:{
    type: Number,
    default: 0,
  },
  observacao:{
    type: String,
    default: "Nenhuma observação."
  },
  status: {
    type: String,
    enum: ["visitado", "recusa", "fechado"],
    default: "fechado",
  }
});

export default model("Imovel", imovelModel);
