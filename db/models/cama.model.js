const {Model, DataTypes, Sequelize} = require('sequelize')

const CAMA_TABLE = 'camas';

const CamaSchema = {
  id:{
    type:DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  /* id:{
    type:DataTypes.INTEGER,
    allowNull:false,
    primaryKey:true,
    autoIncrement:true,
  }, */
  nombre: {
    type:DataTypes.STRING,
  },
  precio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  estado:{
    type: DataTypes.ENUM('reservada', 'ocupada', 'libre', 'mantenimiento'),
    allowNull: false,
    defaultValue: 'libre',
  },
}
// id reserva
// id cama
// id habitacion o cama
// estado

class Cama extends Model {
  static associate() {
    // asociaciones
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: CAMA_TABLE,
      modelName: 'Cama',
      timestamps: false
    }
  }
}


module.exports = { CAMA_TABLE, CamaSchema, Cama }
