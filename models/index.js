const Producto = require('./Producto');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Usuario = require('./Usuario');
const Movimiento = require('./Movimiento');

Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos', onDelete: 'RESTRICT' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria', onDelete: 'RESTRICT' });

Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos', onDelete: 'RESTRICT' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor', onDelete: 'RESTRICT' });

Producto.hasMany(Movimiento, { foreignKey: 'producto_id', as: 'movimientos', onDelete: 'RESTRICT' });
Movimiento.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto', onDelete: 'RESTRICT' });

Usuario.hasMany(Movimiento, { foreignKey: 'usuario_id', as: 'movimientos' });
Movimiento.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = { Producto, Categoria, Proveedor, Usuario, Movimiento };