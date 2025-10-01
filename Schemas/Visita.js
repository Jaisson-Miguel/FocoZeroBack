import mongoose from "mongoose";

import { Schema, Model, model } from "mongoose";

const visitaModel = new Schema({
  idImovel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Imovel",
    required: true,
  },
  idAgente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  tipo: {
    type: String,
    enum: ["r", "c", "tb", "out", "pe"],
    required: true,
  },
  dataVisita: {
    type: Date,
    default: Date.now,
  },
  depositosInspecionados: {
    a1: { type: Number, default: 0 },
    a2: { type: Number, default: 0 },
    b: { type: Number, default: 0 },
    c: { type: Number, default: 0 },
    d1: { type: Number, default: 0 },
    d2: { type: Number, default: 0 },
    e: { type: Number, default: 0 },
  },
  qtdDepEliminado: {
    type: Number,
    default: 0,
  },
  amostraInicial: {
    type: Number,
    default: 0,
  },
  amostraFinal: {
    type: Number,
    default: 0,
  },
  foco: {
    type: Boolean,
    default: false,
  },
  qtdLarvicida: {
    type: Number,
    default: 0,
  },
  qtdDepTratado: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["visitado", "recusa", "fechado"],
    default: "fechado",
  },
});

export default model("Visita", visitaModel);
