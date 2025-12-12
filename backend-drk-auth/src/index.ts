/**
 * Servidor de Autenticación y API de Skins para Drk Launcher
 * Backend principal
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import sessionsRoutes from './routes/sessions';
import { initializeDatabase, cleanupExpiredSessions } from './database/memoryStore';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/authserver', authRoutes);
app.use('/sessionserver', sessionsRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Drk Launcher Auth Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    service: 'Drk Launcher Authentication Server',
    version: '1.0.0',
    endpoints: {
      authenticate: 'POST /authserver/authenticate',
      refresh: 'POST /authserver/refresh',
      validate: 'POST /authserver/validate',
      profile: 'GET /sessionserver/session/minecraft/profile/<UUID>',
    },
  });
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({
    error: 'InternalServerError',
    errorMessage: err.message || 'An internal server error occurred.',
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    console.log('[Database] Base de datos inicializada');

    // Limpiar sesiones expiradas cada hora
    setInterval(async () => {
      await cleanupExpiredSessions();
      console.log('[Database] Sesiones expiradas limpiadas');
    }, 3600000); // 1 hora

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`[Server] Servidor de autenticación Drk Launcher iniciado`);
      console.log(`[Server] Escuchando en puerto ${PORT}`);
      console.log(`[Server] URL base: http://localhost:${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/health`);
      console.log(`[Server] Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Server] Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

