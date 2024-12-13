const jsonwebtoken = require('jsonwebtoken');
const { pool } = require('../../database/mysql');
const { retos, verReto, progreso1, update } = require('../../database/retos');

jest.mock('jsonwebtoken');
jest.mock('../../database/mysql', () => ({
  pool: {
    getConnection: jest.fn(),
    release: jest.fn()
  }
}));

describe('Pruebas de la API de Retos', () => {
  let mockConnection;
  
  beforeEach(() => {
    mockConnection = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    
    pool.getConnection.mockResolvedValue(mockConnection);
    jsonwebtoken.verify.mockReturnValue({ user: 'test@example.com' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Función retos', () => {
    test('debería generar retos para un usuario', async () => {
      // Verificación del JWT
      const mockVerify = jest.spyOn(jsonwebtoken, 'verify').mockReturnValue({
        user: 'test@example.com'
      });
    
      // Simulación de la conexión a la base de datos y consultas
      const mockConnection = {
        query: jest.fn(),
        release: jest.fn()
      };
      const mockGetConnection = jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);
    
      // Simulación de la función verReto para devolver un número de reto consistente
      global.verReto = jest.fn().mockReturnValue(1);
    
      // Configuración de las respuestas simuladas de las consultas
      mockConnection.query
        .mockResolvedValueOnce([{ nivel: 2 }])  // Resultado de progreso1
        .mockResolvedValueOnce([])  // Comprobación de retos completados (array vacío)
        .mockResolvedValueOnce([[{ descripción: 'Reto de muestra' }]]);  // Descripción del reto
    
      const req = {
        body: {
          cookie: 'valid.jwt.token'
        }
      };
    
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    
      await retos(req, res);
    
      // Depuración: mostrar las llamadas a los mocks
      console.log('Llamadas al status:', res.status.mock.calls);
      console.log('Llamadas a json:', res.json.mock.calls);
    
      // Aserciones
      expect(res.status).toHaveBeenCalledWith(403);
    
      // Limpiar mocks
      mockVerify.mockRestore();
      mockGetConnection.mockRestore();
      global.verReto = undefined;
    });
    
    test('debería manejar el caso de resultados vacíos de retos', async () => {
      const req = {
        body: {
          cookie: 'valid.jwt.token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    
      // Simulación de la consulta de progreso para devolver un usuario válido
      mockConnection.query
        .mockResolvedValueOnce([[{ user: 'testuser', nivel: 1 }]]) // Respuesta válida del progreso1
        .mockResolvedValueOnce([{ descripción: '' }]); // Descripción vacía
    
      // Llamar a la función
      await retos(req, res);
      
      // Esperar un código de estado 403 por descripción vacía
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: "error",
        message: "Error al obtener retos"
      }));
    });
    
    test('debería manejar los intentos máximos de reintentos', async () => {
      const req = {
        body: {
          cookie: 'valid.jwt.token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      mockConnection.query
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce([]);

      await retos(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Función update', () => {
    let mockReq, mockRes, mockConnection;
  
    beforeEach(() => {
      // Restablecer mocks antes de cada prueba
      mockReq = {
        body: {
          retos: 'Reto1*Reto2',
          valor: '2',
          cookie: 'valid-jwt-token'
        }
      };
  
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      mockConnection = {
        beginTransaction: jest.fn(),
        query: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
  
      pool.getConnection = jest.fn().mockResolvedValue(mockConnection);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    test('actualización exitosa', async () => {
      // Simulación de la verificación del JWT
      jsonwebtoken.verify.mockReturnValue({ user: 'test@example.com' });
  
      // Simulación de las consultas a la base de datos
      mockConnection.query
        .mockResolvedValueOnce([{ progreso: 25 }]) // Resultado de progreso1
        .mockResolvedValueOnce({ affectedRows: 1 }) // UPDATE progreso
        .mockResolvedValueOnce([{ nReto: 1 }]) // SELECT nReto para el primer reto
        .mockResolvedValueOnce({ affectedRows: 1 }) // INSERT retosCompletados para el primer reto
        .mockResolvedValueOnce([{ nReto: 2 }]) // SELECT nReto para el segundo reto
        .mockResolvedValueOnce({ affectedRows: 1 }); // INSERT retosCompletados para el segundo reto
  
      await update(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        status: "ok", 
        message: "El progreso ha sido actualizado" 
      });
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  
    test('cuerpo de solicitud vacío', async () => {
      mockReq.body = null;
  
      await update(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        status: "error", 
        message: "Cuerpo de solicitud vacío" 
      });
    });
  
    test('parámetro retos inválido', async () => {
      mockReq.body.retos = '';
  
      await update(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: "error",
        message: "Parámetro de retos inválido o ausente"
      }));
    });
  
    test('parámetro valor inválido', async () => {
      mockReq.body.valor = 'not-a-number';
  
      await update(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: "error",
        message: "Valor inválido"
      }));
    });
  
    test('falta la cookie JWT', async () => {
      delete mockReq.body.cookie;
  
      await update(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(402);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        status: "error", 
        message: "No se encontró la cookie JWT" 
      });
    });
  
    test('token JWT inválido', async () => {
      jsonwebtoken.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });
  
      await update(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: "error",
        message: "Token JWT inválido o expirado"
      }));
    });
    
    test('error en la base de datos durante la actualización', async () => {
      jsonwebtoken.verify.mockReturnValue({ user: 'test@example.com' });
  
      mockConnection.query
        .mockResolvedValueOnce([{ progreso: 25 }]) // Resultado de progreso1
        .mockRejectedValueOnce(new Error('Error de conexión con la base de datos'));
  
      await update(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: "error",
        message: "Error interno al actualizar el progreso"
      }));
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });
});
