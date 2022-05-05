const boom = require('@hapi/boom');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {enviarEmail} = require('../utils/mailer')
const { Usuario } = require('../db/models/usuario.model');
const {config} = require('../config/config');
const {plantillaEmailReset} = require('../utils/PlantillasEmail')
const UserService = require('./usuarios.services');
const service = new UserService;

class AuthServices {

    async traerUsuario(email, password){
        const usuario = await service.buscarPorEmail(email);
      if (!usuario) {
        console.log('estoy aca')
        return boom.unauthorized();
      }
      const isMatch = await bcrypt.compare(password, usuario.password);
      if (!isMatch) {
        return boom.unauthorized();
      }
      delete usuario.dataValues.password;
      return usuario
    }


    async firmarToken(usuario){
        const payload = {
        sub:usuario.dni,
        role: usuario.rol,
        }
        const token = jwt.sign(payload, config.jwtSecret );
        return ({
        usuario :usuario.email,
        rol: usuario.rol,
        avatar:usuario.avatar,
        token,
        // refreshToken
    });
    }

  
    


    async enviarRecuperacion(email){
        const usuario = await service.buscarPorEmail(email);
        if (!usuario) {
        throw boom.unauthorized();
        }
        const payload = {sub: usuario.dni };
        const token = jwt.sign(payload, config.jwtSecret, {expiresIn: '10min'} );
        //TODO: cambiar luego
        /* const link = `http://rodrigoquintero.tamarindorivas.com?token=${token}` */
        const link = `http://localhost:3000/changepassword?token=${token}`;
        await service.actualizar(usuario.dni, {tokenRecuperacion: token });
        const mail = {
          from: 'WebMaster',
          to: `${usuario.email}`, 
          subject: "Email para recuperar contraseña",
          html: plantillaEmailReset(link),
        }
        const respuesta = await enviarEmail(mail);
        return respuesta;
      }

    async cambiarPaswword(token, newPassword){

      const payload = jwt.verify(token, config.jwtSecret);

        const usuario = await service.mostrarByDni(payload.sub);
        console.log('soy el token---->',usuario._previousDataValues.tokenRecuperacion)
        if (usuario._previousDataValues.tokenRecuperacion !== token){
          throw boom.unauthorized();
        }
        const hash = await bcrypt.hash(newPassword, 12)
        const cambiar= await service.actualizar(usuario.dni, {tokenRecuperacion: null, password: hash })
        if(!cambiar){
          throw boom.badData('no se cambio ni mierda!!!')
        }
        return { message: 'password actualizado'}
      
      }

      async refreshToken (data) {
        const refreshToken = data.headers.refresh
        if(!refreshToken) {
          return boom.badData('falta refreshToken')
        }
        try {
          const vericarToken = jwt.verify(refreshToken, config.jwtRefresh)
          const {sub} = vericarToken
          const usuario = await Usuario.findByPk(sub)
          const payload = {
            sub:usuario.dni,
            role: usuario.rol,
            }
            const token = jwt.sign(payload, config.jwtSecret, {expiresIn: '1h'} );
            await service.actualizar(usuario.dni, {refreshToken: token });
            
          return ({
            message: 'procedimiento de refresh-token Ok',
            token
          })
        } catch(error) {
          return boom.badData(error.message)
        }
        
  
  
      }
}


module.exports = AuthServices;