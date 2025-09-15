import {Schema, Model, model} from "mongoose";

const usuarioModel = new Schema({
    nonme:{
        type:String,
        required:true
    },
    cpf:{
        type:String,
        required:true,
        unique:true
    },
    senha:{
    type:String,
    required:true
    },
    funcao:{
    type:String,
    required:true,
    default:"agente"
    },
});

export default model("Usuario",usuarioModel);