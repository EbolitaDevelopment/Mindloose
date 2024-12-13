const bcryptjs = require('bcryptjs');
const validator = require('validator');
const { registrar } = require('../../database/registro');
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

describe('Autenticación de Usuarios', () => {
    // Configuración común para reducir redundancias
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

    describe('Función de Registro de Usuario', () => {
        let mockConnection, req, res;

        beforeEach(() => {
            jest.clearAllMocks();
            
            mockConnection = setupMockConnection();
            setupBasicMocks();
            
            pool.getConnection.mockResolvedValue(mockConnection);

            req = {
                body: {
                    email: 'test@example.com',
                    name: 'Test User',
                    apellidop: 'Test',
                    apellidom: 'User',
                    hashPassword: 'StrongPassword123!'
                }
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
        });

        it('debería registrar un nuevo usuario con éxito', async () => {
            mockConnection.query
                .mockResolvedValueOnce([[]])  // Simula la búsqueda de usuario
                .mockResolvedValueOnce([{ affectedRows: 1 }])  // Simula que la inserción fue exitosa
                .mockResolvedValueOnce([{ affectedRows: 1 }]); // Simula la confirmación de inserción final

            await registrar(req, res);

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.query).toHaveBeenCalledTimes(3);
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                status: 'ok', 
                message: 'Registrado con éxito' 
            });
        });

        it('debería evitar registrar un usuario ya existente', async () => {
            mockConnection.query
                .mockResolvedValueOnce([[{ email: 'test@example.com' }]]);  // Simula que ya existe el usuario

            await registrar(req, res);

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ 
                status: 'error', 
                message: 'El usuario ya existe' 
            });
        });

        it('debería manejar errores de inserción en base de datos', async () => {
            mockConnection.query
                .mockResolvedValueOnce([[]])  // Simula la búsqueda de usuario
                .mockRejectedValueOnce(new Error('Error de inserción en base de datos'));  // Simula fallo en la inserción

            await registrar(req, res);

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ 
                status: 'error', 
                message: 'Error en el registro' 
            });
        });
    });
});
