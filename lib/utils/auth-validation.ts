/**
 * Utilidades de validación para autenticación
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Valida el formato de un email
 */
export function validateEmail(email: string): ValidationResult {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return { isValid: false, error: 'El email es requerido' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'El formato del email no es válido' }
  }

  return { isValid: true }
}

/**
 * Valida una contraseña con requisitos de seguridad
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'La contraseña es requerida' }
  }

  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una mayúscula' }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una minúscula' }
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos un número' }
  }

  // Lista de contraseñas comunes a evitar
  const commonPasswords = [
    'password', 'Password1', '12345678', 'qwerty123', 'Qwerty123',
    'abc12345', 'Abc12345', 'password123', 'Password123'
  ]

  if (commonPasswords.includes(password)) {
    return { isValid: false, error: 'Esta contraseña es demasiado común. Elige una más segura' }
  }

  return { isValid: true }
}

/**
 * Valida que dos contraseñas coincidan
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Las contraseñas no coinciden' }
  }
  return { isValid: true }
}

/**
 * Valida un nombre completo
 * - Entre 2 y 100 caracteres
 * - Solo letras, espacios, guiones y apóstrofes
 */
export function validateFullName(fullName: string): ValidationResult {
  const trimmedName = fullName.trim()

  if (!trimmedName) {
    return { isValid: false, error: 'El nombre es requerido' }
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' }
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'El nombre no puede tener más de 100 caracteres' }
  }

  // Permitir letras (incluyendo acentuadas), espacios, guiones y apóstrofes
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'El nombre solo puede contener letras, espacios, guiones y apóstrofes' }
  }

  return { isValid: true }
}

/**
 * Valida todos los campos de registro
 */
export function validateSignupForm(
  email: string,
  password: string,
  confirmPassword: string,
  fullName: string
): ValidationResult {
  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) return emailValidation

  const nameValidation = validateFullName(fullName)
  if (!nameValidation.isValid) return nameValidation

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) return passwordValidation

  const matchValidation = validatePasswordMatch(password, confirmPassword)
  if (!matchValidation.isValid) return matchValidation

  return { isValid: true }
}
