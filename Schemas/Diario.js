import mongoose from "mongoose";
import { Schema, model } from "mongoose";

const diarioModel = new Schema({
  idAgente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  idArea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
    required: true,
  },
  semana: {
    type: Number,
    required: true,
  },
  data: {
    type: Date,
    required: true,
  },
  atividade: {
    type: Number,
    enum: [1, 2, 3, 4, 5, 6],
    default: 4,
  },
  resumo: {
    quarteiroes: {
      type: [String],
      default: [],
    },
    totalQuarteiroes: {
      type: Number,
      default: 0,
    },
    totalVisitas: {
      type: Number,
      required: true,
    },
    totalVisitasTipo: {
      r: { type: Number, default: 0 },
      c: { type: Number, default: 0 },
      tb: { type: Number, default: 0 },
      pe: { type: Number, default: 0 },
      out: { type: Number, default: 0 },
    },
    totalDepInspecionados: {
      a1: { type: Number, default: 0 },
      a2: { type: Number, default: 0 },
      b: { type: Number, default: 0 },
      c: { type: Number, default: 0 },
      d1: { type: Number, default: 0 },
      d2: { type: Number, default: 0 },
      e: { type: Number, default: 0 },
    },
    totalDepEliminados: {
      type: Number,
      default: 0,
    },
    totalImoveisLarvicida: {
      type: Number,
      default: 0,
    },
    totalQtdLarvicida: {
      type: Number,
      default: 0,
    },
    totalDepLarvicida: {
      type: Number,
      default: 0,
    },
    imoveisComFoco: {
      type: Number,
      default: 0,
    },
    totalFocos: {
      type: Number,
      default: 0,
    },
    idsVisitas: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Visita",
      default: [],
    },
  },
});

export default model("Diario", diarioModel);
