// src/services/apiMock.js
// Mock API simple que persiste en localStorage — REGISTER ya no exige confirmación por email.
const storageKey = 'tradingia_users_v1';
const authKey = 'tradingia_auth_v1';

function getUsersFromStorage() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
function saveUsersToStorage(users) { localStorage.setItem(storageKey, JSON.stringify(users)); }

export const mockApi = {
  register: async (payload) => {
    const users = getUsersFromStorage();
    const exists = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (exists) {
      throw new Error('El email ya está registrado.');
    }

    const id = Date.now().toString(36);
    const newUser = {
      id,
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      phone: payload.phone || null,
      createdAt: new Date().toISOString(),
      // YA ACTIVADO: no hay confirmación por email en esta versión
      activated: true,
      confirmationToken: null,
      profileCompleted: false,
      financialProfile: null,
      portfolios: payload.portfolios || [],
      portfolio: payload.portfolio || null
    };
    users.push(newUser);
    saveUsersToStorage(users);

    // Retornamos el usuario creado (no enviamos token ni requerimos confirmación)
    return { ok: true, user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, activated: newUser.activated } };
  },

  confirmEmail: async (token) => {
    // No-op: en esta versión la confirmación no es necesaria.
    // Mantener la función para compatibilidad en caso de que el router aún haga llamadas.
    return { ok: true };
  },

  login: async (email, password) => {
    const users = getUsersFromStorage();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Credenciales no válidas');
    }
    if (!user.activated) {
      // en teoría no debería ocurrir porque ahora registramos activado=true
      throw new Error('Cuenta no activada');
    }
    const token = Math.random().toString(36).slice(2);
    const auth = { token, userId: user.id, email: user.email };
    localStorage.setItem(authKey, JSON.stringify(auth));
    return { ok: true, auth, user };
  },

  logout: async () => {
    localStorage.removeItem(authKey);
    return { ok: true };
  },

  updateProfile: async (userId, patch) => {
    const users = getUsersFromStorage();
    const i = users.findIndex(u => u.id === userId);
    if (i === -1) {
      throw new Error('Usuario no encontrado');
    }
    users[i] = { ...users[i], ...patch };
    saveUsersToStorage(users);
    return { ok: true, user: users[i] };
  },

  changePassword: async (userId, oldP, newP) => {
    const users = getUsersFromStorage();
    const i = users.findIndex(u => u.id === userId);
    if (i === -1) {
      throw new Error('Usuario no encontrado');
    }
    if (users[i].password !== oldP) {
      throw new Error('Contraseña anterior incorrecta');
    }
    users[i].password = newP;
    saveUsersToStorage(users);
    return { ok: true };
  }
};
