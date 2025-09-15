import mongoose from "mongoose";

import { Schema, Model, model } from "mongoose";

const areaModel = new Schema({
  name: {
    type: String,
    required: true,
  },
  mapUrl: {
    type: String,
    required: true,
  }
});

export default model("Area", areaModel);
