const { verificar } = require('../../database/verificar');
const { pool } = require('../../database/mysql');
const dotenv = require('dotenv');
// Simulando dependencias
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

beforeEach(() => {
  dotenv.config();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('verificar', () => {
  let mockReq, mockRes, mockConnection;

  beforeEach(() => {
    mockReq = {
      body: {
        decodificada: {
          user: 'testuser@example.com',
        },
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockConnection = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool.getConnection.mockResolvedValue(mockConnection);
  });

  it('debería devolver 202 y "Los campos son correctos" si el usuario existe', async () => {
    const queryMock = jest.fn().mockResolvedValueOnce([[{ mail: 'testuser@example.com' }]]);
    mockConnection.query = queryMock;
  
    await verificar(mockReq, mockRes);
  
    expect(mockRes.status).toHaveBeenCalledWith(202);
    expect(mockRes.json).toHaveBeenCalledWith({ status: 'ok', message: 'Los campos son correctos' });
  });

  it('debería devolver 400 y "Los campos son incorrectos" si el usuario no existe', async () => {
    mockConnection.query.mockResolvedValueOnce([]);

    await verificar(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ status: 'error', message: 'Los campos son incorrectos' });
  });

  it('debería manejar errores y devolver 400 con un mensaje de error genérico', async () => {
    const errorMessage = 'Ocurrió un error';
    mockConnection.query.mockRejectedValueOnce(new Error(errorMessage));

    await verificar(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ status: 'error', message: 'Los campos son incorrectos' });
  });
});
