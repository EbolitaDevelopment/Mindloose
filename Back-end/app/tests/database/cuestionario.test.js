const jsonwebtoken = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const { pool } = require('../../database/mysql');
const { cuestionario } = require('../../database/cuestionario'); // Update with actual path

// Simulando la configuración de la base de datos
jest.mock('jsonwebtoken');
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn().mockReturnValue({
        getConnection: jest.fn().mockResolvedValue({
            query: jest.fn(),
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn()
        }),
        release: jest.fn()
    })
}));

describe('cuestionario', () => {
  let mockReq, mockRes, mockConnection;

  beforeEach(() => {
    // Simulando el objeto de solicitud (req) y respuesta (res)
    mockReq = {
      body: {
        cookie: 'valid_jwt_token',  // Mock JWT token
        nivel: '3',
        suma: '10',
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.getConnection.mockResolvedValue(mockConnection);  // Mock de la conexión
  });

  it('debería devolver un error 402 si no se encuentra la cookie JWT', async () => {
    mockReq.body.cookie = null;  // No enviar cookie

    await cuestionario(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(402);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'No se encontró la cookie JWT',
    });
  });

  it('debería devolver un error 403 si el JWT es inválido', async () => {
    jsonwebtoken.verify.mockImplementationOnce(() => {
      throw new Error('Token inválido');
    });

    await cuestionario(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token JWT inválido o expirado',
      redirect: '/Procesoincompleto',
    });
  });

  it('debería devolver un error 403 si el JWT no contiene un usuario', async () => {
    jsonwebtoken.verify.mockImplementationOnce(() => ({
      user: null,  // No hay usuario en el token
    }));

    await cuestionario(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token JWT inválido',
      redirect: '/Procesoincompleto',
    });
  });

  it('debería devolver un error 400 si no se puede actualizar el progreso', async () => {
    jsonwebtoken.verify.mockImplementationOnce(() => ({
      user: 'test@example.com',
    }));

    mockConnection.query.mockResolvedValue([{ affectedRows: 0 }]);  // Simula que no se actualizó el progreso

    await cuestionario(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error al inicializar el progreso',
    });
  });

  it('debería devolver una respuesta exitosa 201 si el progreso se actualiza correctamente', async () => {
    jsonwebtoken.verify.mockImplementationOnce(() => ({
      user: 'test@example.com',
    }));

    mockConnection.query.mockResolvedValue([{ affectedRows: 1 }]);  // Simula que la actualización fue exitosa

    await cuestionario(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'ok',
      message: 'El progreso ha sido inicializado',
      redirect: '/procesocompleto',
    });
  });

  it('debería manejar errores en la transacción y devolver un error 500', async () => {
    jsonwebtoken.verify.mockImplementationOnce(() => ({
      user: 'test@example.com',
    }));

    mockConnection.query.mockRejectedValue(new Error('Error en la consulta'));  // Simula un error en la consulta

    await cuestionario(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error en el servidor',
    });
      });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
