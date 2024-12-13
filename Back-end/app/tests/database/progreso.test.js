
const jsonwebtoken = require('jsonwebtoken');
const { progreso } = require('../../database/progreso');
const { pool } = require('../../database/mysql');
const dotenv = require("dotenv");
dotenv.config();

// Mocks de dependencias externas
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

jest.mock('dotenv');

jest.mock('validator', () => ({
    isEmail: jest.fn(),
    isStrongPassword: jest.fn()
}));

jest.mock('jsonwebtoken');

describe('Funciones de Gestión de Usuarios', () => {
  let mockConnection;
  let mockPool;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Resetear mocks antes de cada prueba
    mockConnection = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    };

    mockReq = {
      body: {},
      headers: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };

    // Mock de dependencias externas
    jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);
    jest.spyOn(jsonwebtoken, 'verify').mockImplementation((token, secret) => ({ user: 'test@example.com' }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Función progreso', () => {
    it('debería devolver error si no se proporciona la cookie JWT', async () => {
      mockReq.body = { token: null };
      
      await progreso(mockReq, mockRes);
    
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          status: "error", 
          message: "No se encontró la cookie JWT" 
        })
      );
    });

    it('debería recuperar correctamente el progreso del usuario', async () => {
      mockReq.body = { token: 'validToken' };

      mockConnection.query.mockResolvedValueOnce([[
        { progreso: 50, nivel: 2 }
      ]]);

      await progreso(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          status: "ok", 
          body: 50,
          body2: 2
        })
      );
    });

    it('debería manejar el caso cuando no se encuentra progreso', async () => {
      mockReq.body = { token: 'validToken' };

      mockConnection.query.mockResolvedValueOnce([[]]);

      await progreso(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          status: "error", 
          message: "No se encontró progreso para el usuario" 
        })
      );
    });
  });
});
