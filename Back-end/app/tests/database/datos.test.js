const bcryptjs = require('bcryptjs');
const validator = require('validator');
const jsonwebtoken = require('jsonwebtoken');
const { datos } = require('../../database/datos');
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
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn(),
    hash: jest.fn(),
    compare: jest.fn()
}));

jest.mock('validator', () => ({
    isEmail: jest.fn(),
    isStrongPassword: jest.fn()
}));

jest.mock('jsonwebtoken');

describe('Funciones de Gestión de Usuario', () => {
  let mockConnection;
  let mockPool;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Restablecer los mocks antes de cada prueba
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
      
  describe('Función datos', () => {
    it('debería recuperar los datos del usuario', async () => {
      mockReq.body = { cookie: 'tokenValido' };

      mockConnection.query.mockResolvedValueOnce([[
        { 
          mail: 'test@example.com', 
          nombre: 'John', 
          apellidopat: 'Doe', 
          apellidomat: 'Smith' 
        }
      ]]);

      await datos(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          status: "ok",
          message: "Información obtenida",
          body: expect.objectContaining({
            mail: 'test@example.com',
            nombre: 'John',
            apellidopat: 'Doe',
            apellidomat: 'Smith'
          })
        })
      );
    });

    it('debería manejar la falla al obtener los datos del usuario', async () => {
      mockReq.body = { cookie: 'tokenValido' };

      mockConnection.query.mockResolvedValueOnce([[]]);

      await datos(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          status: "error", 
          message: "No se logró obtener la información" 
        })
      );
    });
  });
});
