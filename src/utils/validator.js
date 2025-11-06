export const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&^])[A-Za-z\d@$!%*?#&^]{8,}$/;

export function validateEmail(email) {
  if (!email) return 'Email requerido';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Email inválido';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Contraseña requerida';
  if (!PASSWORD_POLICY.test(password)) return 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.';
  return null;
}
