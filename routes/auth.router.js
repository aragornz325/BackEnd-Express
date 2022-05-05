const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../db/models/usuario.model');
const {config} = require('../config/config.js')
const {checkApiKey} =require('../middleware/auth.handler');
const boom = require('@hapi/boom')
const AuthService = require('../services/auth.services');
const service = new AuthService;



//TODO: usar lo de rodrigo
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/login',
checkApiKey, 
passport.authenticate('local', {session: false}),
async (req, res, next) => {
  try {
    if(req.user.isBoom === true) {
      res.json(boom.unauthorized('usuario o password inexistente'))
    }
    const usuario = req.user.dataValues;
    res.json(await service.firmarToken(usuario))
    } catch (error) {
    next(error);
  }
});


router.get("/google", (req, res)=> 
res.send('aca va a ir google')
)

router.post('/recuperacion',
checkApiKey, 
async (req, res, next) => {
  try { 
    const { email } = req.body
    const respuesta = await service.enviarRecuperacion(email)
    res.json(respuesta);
  } catch (error) {
    next(error);
  }
});

router.post('/cambiar-password', 
checkApiKey,
async (req, res, next) => {
  try { 
    const { token, newPassword } = req.body;
    const respuesta = await service.cambiarPaswword(token, newPassword)
    res.json(respuesta);
  } catch (error) {
    next(error);
  }
});


router.post("/auth/google", async (req, res) => {
  const { googleId } = req.body;
  console.log(req.body)
  const token = req.headers.authorization.split(" ")[1]
  console.log(req.headers.authorization)
  console.log(token)
  const payload = jwt.decode(token)
  try {
    res.json({ success: true, googleId, payload, body:req.body})
  } catch (error) {
    res.json(error)
}
})

  //TODO: busco el googleId en la base, si no está, registro el usuario
router.post("/signup",async (req ,res) => {
  const {dni,googleId,name,lastname,email,password,genre,birthdate,nationality,typeofdocument,avatar} = req.body;
  let existeUsuarioGoogle = null;
  let existeUsuario = null;
  console.log(req.body)
  try {
    
    if(googleId){
       existeUsuarioGoogle = await Usuario.findOne({where:{ googleId }});
    }else{
       existeUsuario = await Usuario.findOne({where:{dni}});
    }
    

    if(existeUsuarioGoogle !== null || existeUsuario !== null){

      return res.json({success: false, msg:"Ya existe el usuario"})

    }else{

      const newUser = await Usuario.create({
        dni,
        googleId,
        nombre:name,
        apellido:lastname,
        email,
        password:await bcrypt.hash(password,12),
        genero:genre,
        fechaNacimiento:birthdate,
        avatar,
        rol:"cliente",
        nacionalidad:nationality,
        tipoDocumento:typeofdocument,
      })
      res.json({success:true, msg:"Usuario creado con éxito"})

    }
  } catch (error) {
    console.log(error)
    res.status(400).json({error})
  }

})

router.post("/registradoGoogle", async (req, res) => {
  const {googleId} = req.body;
  try {
    const registrado = await Usuario.findOne({ where: { googleId }})
    res.json({success: registrado !== null})
  } catch (error) {
    res.status(400).json({ error })
  }
})

module.exports = router;
