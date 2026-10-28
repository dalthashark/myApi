const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
require('dotenv').config();

const { Producto, Categoria, Proveedor, Usuario, Movimiento } = require('./models');

const app = express();

// --- MIDDLEWARES ---
// Habilitar CORS para permitir peticiones desde el frontend (React)
app.use(cors());
// Parsear el body de las peticiones a JSON
app.use(express.json());

// --- RUTAS BÁSICAS DE PRUEBA ---
app.get('/', (req, res) => {
  res.send('¡API Backend funcionando exitosamente!');
});

app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos.' });
  }
});

app.get('/categorias', async (req, res) => {
  try {
    const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las categorías.' });
  }
});

app.post('/categorias', async (req, res) => {
  try {
    const categoria = await Categoria.create(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al crear la categoría.' });
  }
});

app.put('/categorias/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada.' });
    await categoria.update(req.body);
    res.json(categoria);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al actualizar la categoría.' });
  }
});

app.delete('/categorias/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada.' });
    await categoria.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(409).json({ message: 'No se puede eliminar una categoría que tenga productos asociados.' });
  }
});

app.get('/proveedores', async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({ order: [['razon_social', 'ASC']] });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los proveedores.' });
  }
});

app.post('/proveedores', async (req, res) => {
  try {
    const proveedor = await Proveedor.create(req.body);
    res.status(201).json(proveedor);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al crear el proveedor.' });
  }
});

app.put('/proveedores/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado.' });
    await proveedor.update(req.body);
    res.json(proveedor);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al actualizar el proveedor.' });
  }
});

app.delete('/proveedores/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado.' });
    await proveedor.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(409).json({ message: 'No se puede eliminar un proveedor que tenga productos asociados.' });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({ attributes: ['id', 'nombre', 'email', 'rol'] });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios.' });
  }
});

app.get('/movimientos', async (req, res) => {
  try {
    const movimientos = await Movimiento.findAll({
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'rol'] }
      ],
      order: [['fecha_hora', 'DESC']]
    });
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los movimientos.' });
  }
});

app.post('/movimientos', async (req, res) => {
  const { producto_id, usuario_id, tipo_movimiento, cantidad, observaciones } = req.body;
  const cantidadNumerica = Number(cantidad);

  const cantidadMinima = tipo_movimiento === 'Ajuste' ? 0 : 1;
  if (!Number.isInteger(cantidadNumerica) || cantidadNumerica < cantidadMinima) {
    return res.status(400).json({ message: `La cantidad debe ser un entero igual o mayor que ${cantidadMinima}.` });
  }

  if (!['Entrada', 'Salida', 'Ajuste'].includes(tipo_movimiento)) {
    return res.status(400).json({ message: 'El tipo debe ser Entrada, Salida o Ajuste.' });
  }

  try {
    const movimiento = await sequelize.transaction(async transaction => {
      const producto = await Producto.findByPk(producto_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!producto) {
        const error = new Error('Producto no encontrado.');
        error.status = 404;
        throw error;
      }

      const usuario = await Usuario.findByPk(usuario_id, { transaction });
      if (!usuario) {
        const error = new Error('Usuario no encontrado.');
        error.status = 404;
        throw error;
      }

      if (tipo_movimiento === 'Entrada') {
        producto.stock += cantidadNumerica;
      } else if (tipo_movimiento === 'Salida') {
        if (producto.stock < cantidadNumerica) {
          const error = new Error('No hay stock suficiente para registrar la salida.');
          error.status = 400;
          throw error;
        }
        producto.stock -= cantidadNumerica;
      } else {
        producto.stock = cantidadNumerica;
      }

      await producto.save({ transaction });
      return Movimiento.create({
        producto_id,
        usuario_id,
        tipo_movimiento,
        cantidad: cantidadNumerica,
        observaciones
      }, { transaction });
    });

    res.status(201).json(movimiento);
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message || 'Error al registrar el movimiento.' });
  }
});

app.post('/productos', async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria_id, proveedor_id } = req.body;
    if (!categoria_id || !(await Categoria.findByPk(categoria_id))) {
      return res.status(400).json({ message: 'Selecciona una categoría existente.' });
    }
    if (proveedor_id && !(await Proveedor.findByPk(proveedor_id))) {
      return res.status(400).json({ message: 'Selecciona un proveedor existente.' });
    }
    const producto = await Producto.create({
      nombre,
      descripcion,
      precio,
      stock: 0,
      categoria_id,
      proveedor_id: proveedor_id || null
    });
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al crear el producto.' });
  }
});

app.put('/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    const { nombre, descripcion, precio, categoria_id, proveedor_id } = req.body;
    if (!categoria_id || !(await Categoria.findByPk(categoria_id))) {
      return res.status(400).json({ message: 'Selecciona una categoría existente.' });
    }
    if (proveedor_id && !(await Proveedor.findByPk(proveedor_id))) {
      return res.status(400).json({ message: 'Selecciona un proveedor existente.' });
    }
    await producto.update({ nombre, descripcion, precio, categoria_id, proveedor_id: proveedor_id || null });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el producto.' });
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    await producto.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(409).json({ message: 'No se puede eliminar un producto con movimientos asociados.' });
  }
});

// --- SINCRONIZACIÓN Y ARRANQUE ---
const PORT = process.env.PORT || 3000;

// alter actualiza el esquema sin borrar las tablas existentes.
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Base de datos conectada y sincronizada.');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error al conectar con la base de datos:', error);
  });












































