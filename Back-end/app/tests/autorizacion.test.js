const jsonwebtoken = require('jsonwebtoken');
const dotenv = require('dotenv');
const verificar = require('../autorizacion/autorizacion'); // Ajusta la ruta según tu estructura de proyecto

// Simular dependencias
jest.mock('jsonwebtoken');
jest.mock('dotenv');

describe('Pruebas de Verificación de JWT', () => {
  // Configuración previa a las pruebas
  beforeEach(() => {
    dotenv.config();
    process.env.JWT_SECRET = 'test-secret';
    global.fetch = jest.fn();
  });

  // Limpiar mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });

  // CV1: Verificación exitosa con JWT válido
  test('Debe permitir verificación con JWT válido', async () => {
    // Preparar datos de prueba
    const mockJwtToken = 'token-jwt-valido';
    const mockDecodedToken = { userId: '123', email: 'usuario@ejemplo.com' };
    
    // Simular comportamiento de jsonwebtoken y fetch
    jsonwebtoken.verify.mockReturnValue(mockDecodedToken);
    global.fetch.mockResolvedValue({ ok: true });

    // Simular solicitud con cookie JWT
    const req = {
      body: { cookie: mockJwtToken }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Ejecutar función de verificación
    await verificar(req, res);

    // Verificar resultados esperados
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.send).toHaveBeenCalledWith({
      status: 'ok', 
      message: 'la autorizacion es correcta', 
      authorized: true
    });
  });

  // CV2: JWT inválido
  test('Debe rechazar JWT inválido', async () => {
    // Simular error de verificación de JWT
    jsonwebtoken.verify.mockImplementation(() => {
      throw new Error('JWT inválido');
    });

    const req = {
      body: { cookie: 'token-invalido' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Ejecutar función de verificación
    await verificar(req, res);

    // Verificar resultados esperados
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      status: 'error', 
      message: 'error con los procesos', 
      authorized: false
    });
  });

  // CV3: Sin cookie
  test('Debe manejar ausencia de cookie', async () => {
    const req = {
      body: { cookie: null }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Ejecutar función de verificación
    await verificar(req, res);

    // Verificar resultados esperados
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      status: 'error', 
      message: 'no se encontro la cookie', 
      authorized: false
    });
  });

  // CV4: Cookie JWT malformada
  test('Debe manejar cookie JWT malformada', async () => {
    const req = {
      body: { cookie: '' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Ejecutar función de verificación
    await verificar(req, res);

    // Verificar resultados esperados
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      status: 'error', 
      message: 'no se encontro la cookie', 
      authorized: false
    });
  });

  // CV5: JWT expirado
  test('Debe manejar JWT expirado', async () => {
    // Simular token expirado
    jsonwebtoken.verify.mockImplementation(() => {
      const error = new Error('Token expirado');
      error.name = 'TokenExpiredError';
      throw error;
    });

    const req = {
      body: { cookie: 'token-expirado' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Ejecutar función de verificación
    await verificar(req, res);

    // Verificar resultados esperados
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      status: 'error', 
      message: 'error con los procesos', 
      authorized: false
    });
  });
});