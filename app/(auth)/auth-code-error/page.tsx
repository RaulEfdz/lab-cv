import React from 'react';

export default function AuthCodeError() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Error de Autenticación</h1>
      <p>El enlace de autenticación no es válido o ha expirado.</p>
      <p>
        Por favor, solicita un nuevo enlace o contacta con el soporte si el
        problema persiste.
      </p>
    </div>
  );
}
