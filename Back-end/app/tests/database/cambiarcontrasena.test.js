
const jsonwebtoken = require('jsonwebtoken');
const { cambiarcontrasena } = require('../../database/cambiarcontrasena');
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


    describe('Función cambiarcontrasena', () => {
        it('debería cambiar la contraseña con éxito', async () => {
            mockReq.body = {
                email: 'test@example.com',
                hashPassword: 'nuevaContraseñaHasheada'
            };

            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            await cambiarcontrasena(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: "ok",
                    message: "Contraseña cambiada"
                })
            );
        });

        it('debería manejar la falla al cambiar la contraseña', async () => {
            mockReq.body = {
                email: 'test@example.com',
                hashPassword: 'nuevaContraseñaHasheada'
            };

            mockConnection.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

            await cambiarcontrasena(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: "error",
                    message: "Error en el servidor"
                })
            );
        });
    });
});
