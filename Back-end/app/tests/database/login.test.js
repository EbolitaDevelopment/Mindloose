const bcryptjs = require('bcryptjs');
const validator = require('validator');
const jsonwebtoken = require('jsonwebtoken');
const { login } = require('../../database/login');
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

describe('Autenticación de Usuario', () => {
    // Configuración común para reducir la redundancia
    const setupMockConnection = () => ({
        query: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
    });

    const setupBasicMocks = () => {
        dotenv.config();
        process.env.JWT_SECRET = 'test-secret';
        
        validator.isEmail.mockReturnValue(true);
        validator.isStrongPassword.mockReturnValue(true);

        bcryptjs.genSalt.mockResolvedValue('salt');
        bcryptjs.hash.mockResolvedValue('hashedPassword');
    };

    describe('Función de Inicio de Sesión', () => {
        let mockConnection;
        let req;
        let res;

        beforeEach(() => {
            jest.clearAllMocks();
            mockConnection = {
                query: jest.fn(),
                beginTransaction: jest.fn(),
                commit: jest.fn(),
                rollback: jest.fn(),
                release: jest.fn()
            };

            pool.getConnection.mockResolvedValue(mockConnection);

            req = {
                body: {
                    email: 'test@example.com',
                    password: 'StrongPassword123!'
                }
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            bcryptjs.compare.mockResolvedValue(true);  // Simula que la contraseña es correcta
        });

        it('debería iniciar sesión con contraseña correcta', async () => {
            mockConnection.query.mockResolvedValueOnce([[{ contra: 'hashedPassword' }]]);

            await login(req, res);

            expect(mockConnection.query).toHaveBeenCalledTimes(1);
            expect(mockConnection.release).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ 
                status: 'ok', 
                message: 'Contraseña correcta' 
            });
        });

        it('debería devolver error si el usuario no existe', async () => {
            mockConnection.query.mockResolvedValueOnce([[]]);  // Simula que no existe el usuario

            await login(req, res);

            expect(mockConnection.query).toHaveBeenCalledTimes(1);
            expect(mockConnection.release).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                status: 'error', 
                message: 'Usuario no encontrado' 
            });
        });

        it('debería devolver error si la contraseña es incorrecta', async () => {
            mockConnection.query.mockResolvedValueOnce([[{ contra: 'hashedPassword' }]]);
            bcryptjs.compare.mockResolvedValue(false);  // Simula contraseña incorrecta

            await login(req, res);

            expect(mockConnection.query).toHaveBeenCalledTimes(1);
            expect(mockConnection.release).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(402);
            expect(res.json).toHaveBeenCalledWith({ 
                status: 'error', 
                message: 'Contraseña incorrecta' 
            });
        });

        it('debería manejar errores de base de datos correctamente', async () => {
            mockConnection.query.mockRejectedValueOnce(new Error('Error en la base de datos'));

            await login(req, res);

            expect(mockConnection.query).toHaveBeenCalledTimes(1);
            expect(mockConnection.release).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ 
                status: 'error', 
                message: 'Error en el servidor' 
            });
        });
    });
});
