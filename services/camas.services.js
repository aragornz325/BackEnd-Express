const boom = require('@hapi/boom');

const { Cama } = require('../db/models/cama.model');
const { Habitacion } = require('../db/models/habitacion.model');
const habitacionesService = require('./../services/habitaciones.services')
const services = new habitacionesService

class camasServices {

    async mostrarTodas(){
        const newCama = await Cama.findAll({
            include: { 
                model: Habitacion, 
                attributes: ['id', 'nombre'] 
                }
            })
        if(!newCama){
            throw boom.notFound('no se encontraron camas')
        }
        return newCama
    }

    async traeruna(id){
        const cama = await Cama.findByPk(id)
        if (!cama){
            throw boom.notFound(`no existe la cama ${id}`)
        } 
        return cama;
    }

    async crear(data){
    const {HabitacionId, precio} = data
    let habitacion = await Habitacion.findByPk( parseInt(HabitacionId));
        if(!habitacion) {
            throw boom.notFound('Habitacion no encontrada')};
        if(habitacion.privada){
            await Habitacion.update(
                { cantCamas: habitacion.cantCamas + 1 },
                { where : { id : data.HabitacionId } }
            )
            return {mensaje: `Cama Agregada a la Habitación con Id: ${HabitacionId}`  }
        }else{
            const cama = await Cama.create({
                precio: precio,
                HabitacionId: HabitacionId,
            })
            let cantCam = await Cama.count({where: {HabitacionId}})
            await Habitacion.update(
                {cantCamas: cantCam}, 
                {where: {id: cama.HabitacionId}})
            return cama
        }
    }

    async actualizar(id, cambios){
        const { precio, estado, nombre } = cambios;
        const checkCama = Cama.findByPk(id);
        if (!checkCama) {
        throw boom.notFound('no existe la cama que intenta actualizar')
        }
        const camaUpdate = Cama.update(
            {
            precio,
            estado,
            nombre
        },
            { where: {id : id}}
        )
        if(!camaUpdate) {
            throw boom.notFound('no se pudo actualizar');
        }
        return 'Cama actualizada';
    }

    async borrar(id, tipo) {
        if(tipo === 'Habitacion'){
            
                let habitacion = await Habitacion.findByPk( parseInt(id));
                if(!habitacion.privada){
                    const cama = await Cama.findOne({where:{HabitacionId: id}})
                    await Cama.destroy({where: { id: cama.id }})
                }
                await Habitacion.update(
                        { cantCamas: habitacion.cantCamas  - 1},
                        { where : { id } }
                )
                return `Se elimino una cama de la habitación con id: ${id}`
            
            }else if (tipo === 'Cama'){
                let camaAEliminar = await this.traeruna(id);
                let habitacioModificada = await services.buscaruno(camaAEliminar.HabitacionId)
                await Cama.destroy({where: { id }})
                await habitacioModificada.update(
                    { cantCamas: habitacioModificada.cantCamas  - 1,
                        precio: habitacioModificada.precio - camaAEliminar.precio
                    },
                    { where : { id: habitacioModificada.id } }
                )
                return `Se elimino la cama id: ${id}`
            }
            
       
        return {message: `Habitacion con id: ${id} fue borrada con exito`};
    }
}
module.exports = camasServices;