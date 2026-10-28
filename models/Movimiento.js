const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Movimiento = sequelize.define('Movimiento', {
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_movimiento: {
    type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste'),
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0 }
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'movimientos',
  timestamps: false
});

module.exports = Movimiento;