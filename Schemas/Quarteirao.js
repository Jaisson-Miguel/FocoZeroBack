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
});

export default model("Quarteirao", quarteiraoModel);
