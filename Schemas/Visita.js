import mongoose from "mongoose";

import { Schema, Model, model } from "mongoose";

const visitaModel = new Schema({
  idImovel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Imovel",
    required: true,
  },
  idQuarteirao:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quarteirao",
    required: true,
  },
  idAgente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  tipo:{
    type: String,
    enum: ["visitado", "recusa", "fechado"],
    required: true,
  },
  dataVisita:{
    type: Date,
    required: true,
    default: Date.now
  },
  depositos: {
    a1: { type: Number, default: 0 },
    a2: { type: Number, default: 0 },
    b: { type: Number, default: 0 },
    c: { type: Number, default: 0 },
    d1: { type: Number, default: 0 },
    d2: { type: Number, default: 0 },
    e: { type: Number, default: 0 },
  },
  foco:{
    type: Boolean,
    default: false,
    required: true,
  },
  qtdLarvicida:{
    type: Number,
    default: 0,
    required: true,
  },
  sincronizado:{
    type: String,
    enum:["pendente", "sincronizado"],
    default: "pendente",
    required: true,
  },
  status: {
    type: String,
    enum: ["visitado", "recusa", "fechado"],
    default: "fechado",
    required: true,
  }
});

export default model("Visita", visitaModel);
