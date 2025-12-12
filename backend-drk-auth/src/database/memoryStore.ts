/**
 * Almacenamiento en memoria para desarrollo
 * En producción, reemplazar con una base de datos real (PostgreSQL, MongoDB, etc.)
 */

import bcrypt from 'bcrypt';
import { User, Session, Profile } from '../types/auth';
import { generateUserUUID, generateProfileUUID } from '../utils/crypto';

// Almacenamiento en memoria (simulado)
const users: Map<string, User> = new Map();
const sessions: Map<string, Session> = new Map();
const profiles: Map<string, Profile> = new Map();
const userProfiles: Map<string, string[]> = new Map(); // userId -> profileIds[]

/**
 * Inicializa la base de datos con un usuario de prueba
 */
export async function initializeDatabase(): Promise<void> {
  // Usuario de prueba: admin / admin123
  const testUserId = generateUserUUID();
  const testProfileId = generateProfileUUID();
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const testUser: User = {
    id: testUserId,
    username: 'admin',
    email: 'admin@drklauncher.com',
    passwordHash: hashedPassword,
    createdAt: new Date(),
  };
  
  const testProfile: Profile = {
    id: testProfileId,
    userId: testUserId,
    name: 'AdminPlayer',
    createdAt: new Date(),
  };
  
  users.set(testUserId, testUser);
  profiles.set(testProfileId, testProfile);
  userProfiles.set(testUserId, [testProfileId]);
  
  console.log('[Database] Usuario de prueba creado:');
  console.log('  Usuario: admin');
  console.log('  Contraseña: admin123');
  console.log('  Profile: AdminPlayer');
}

/**
 * Busca un usuario por email o username
 */
export async function findUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
  for (const user of users.values()) {
    if (user.email === emailOrUsername || user.username === emailOrUsername) {
      return user;
    }
  }
  return null;
}

/**
 * Busca un usuario por ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  return users.get(userId) || null;
}

/**
 * Crea un nuevo usuario
 */
export async function createUser(username: string, email: string, password: string): Promise<User> {
  const userId = generateUserUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user: User = {
    id: userId,
    username,
    email,
    passwordHash,
    createdAt: new Date(),
  };
  
  users.set(userId, user);
  return user;
}

/**
 * Verifica la contraseña de un usuario
 */
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

/**
 * Crea una nueva sesión
 */
export async function createSession(
  userId: string,
  username: string,
  accessToken: string,
  clientToken: string,
  expiresIn: number = 86400
): Promise<Session> {
  const session: Session = {
    accessToken,
    clientToken,
    userId,
    username,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    createdAt: new Date(),
  };
  
  sessions.set(accessToken, session);
  return session;
}

/**
 * Busca una sesión por accessToken
 */
export async function findSessionByAccessToken(accessToken: string): Promise<Session | null> {
  return sessions.get(accessToken) || null;
}

/**
 * Busca una sesión por clientToken
 */
export async function findSessionByClientToken(clientToken: string): Promise<Session | null> {
  for (const session of sessions.values()) {
    if (session.clientToken === clientToken) {
      return session;
    }
  }
  return null;
}

/**
 * Elimina una sesión
 */
export async function deleteSession(accessToken: string): Promise<void> {
  sessions.delete(accessToken);
}

/**
 * Elimina todas las sesiones expiradas
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

/**
 * Obtiene los perfiles de un usuario
 */
export async function getUserProfiles(userId: string): Promise<Profile[]> {
  const profileIds = userProfiles.get(userId) || [];
  return profileIds.map(id => profiles.get(id)!).filter(Boolean);
}

/**
 * Crea un nuevo perfil para un usuario
 */
export async function createProfile(userId: string, profileName: string): Promise<Profile> {
  const profileId = generateProfileUUID();
  
  const profile: Profile = {
    id: profileId,
    userId,
    name: profileName,
    createdAt: new Date(),
  };
  
  profiles.set(profileId, profile);
  
  const userProfileIds = userProfiles.get(userId) || [];
  userProfileIds.push(profileId);
  userProfiles.set(userId, userProfileIds);
  
  return profile;
}

/**
 * Busca un perfil por ID
 */
export async function findProfileById(profileId: string): Promise<Profile | null> {
  return profiles.get(profileId) || null;
}

