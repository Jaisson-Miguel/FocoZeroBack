import mongoose from "mongoose";

import { Schema, Model, model } from "mongoose";

const areaModel = new Schema({
  nome: {
    type: String,
    required: true,
  },
  mapaUrl: {
    type: String,
    required: true,
  }
});

export default model("Area", areaModel);
