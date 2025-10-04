import mongoose from "mongoose";

import { Schema, Model, model } from "mongoose";

const quarteiraoModel = new Schema({
  idArea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
    required: true,
  },
  numero: {
    type: Number,
    required: true,
  },
  totalImoveisTipo: {
    r: { type: Number, default: 0 },
    c: { type: Number, default: 0 },
    tb: { type: Number, default: 0 },
    pe: { type: Number, default: 0 },
    out: { type: Number, default: 0 },
  },
  totalImoveis: {
    type: Number,
    default: 0,
  },
  qtdHabitantes: {
    type: Number,
    default: 0,
  },
  qtdCachorros: {
    type: Number,
    default: 0,
  },
  qtdGatos: {
    type: Number,
    default: 0,
  },
  idResponsavel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    default: null,
  },
  dataTrabalho: {
    type: Date,
  },
  trabalhadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    default: null,
  },
});

export default model("Quarteirao", quarteiraoModel);
