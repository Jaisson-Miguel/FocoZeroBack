import mongoose from "mongoose";

import { Schema, Model, model } from "mongoose";

const imovelModel = new Schema({
  idQuarteirao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quarteirao",
    required: true,
  },
  endereco: {
    type: String,
    required: true,
  },
  status:{
    type: String,
    enum: ["visitado", "recusa", "fechado"],
    default: "fechado",
    required: true,
  },
});

export default model("Imovel", imovelModel);
