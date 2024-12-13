
const jsonwebtoken = require('jsonwebtoken');
const { memorama } = require('../../database/memorama');
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

    describe('Función memorama', () => {
        it('debería recuperar juegos para un tipo específico', async () => {
            mockReq.body = { 
                cookie: 'validToken',
                tipo: 'animales'
            };

            mockConnection.query.mockResolvedValueOnce([[
                { descripcion: 'Juego 1', nombre: 'Juego de Animales' },
                { descripcion: 'Juego 2', nombre: 'Otro Juego de Animales' }
            ]]);

            await memorama(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    status: "ok",
                    message: "Todo bien",
                    body: expect.any(Array)
                })
            );
        });

        it('debería manejar el caso donde no se encuentren juegos', async () => {
            mockReq.body = { 
                cookie: 'validToken',
                tipo: 'inexistente'
            };

            mockConnection.query.mockResolvedValueOnce([[]]);

            await memorama(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    status: "error", 
                    message: "No se encontraron juegos" 
                })
            );
        });
    });
});
