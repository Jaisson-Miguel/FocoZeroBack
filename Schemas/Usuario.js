import {Schema, Model, model} from "mongoose";

const usuarioModel = new Schema({
    nome:{
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
        enum: ["agente", "adm", "fiscal"],
        default:"agente"
    },
});

export default model("Usuario",usuarioModel);