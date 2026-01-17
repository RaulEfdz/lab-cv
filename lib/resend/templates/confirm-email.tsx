import React from 'react';

interface EmailTemplateProps {
  actionUrl: string;
}

const ConfirmEmailTemplate: React.FC<EmailTemplateProps> = ({ actionUrl }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
    <h1>Confirma tu dirección de correo electrónico</h1>
    <p>
      Gracias por registrarte. Por favor, haz clic en el siguiente enlace para
      confirmar tu dirección de correo electrónico:
    </p>
    <a
      href={actionUrl}
      style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '10px 20px',
        textDecoration: 'none',
        borderRadius: '5px',
      }}
    >
      Confirmar correo electrónico
    </a>
    <p>Si no te registraste, por favor ignora este mensaje.</p>
  </div>
);

export default ConfirmEmailTemplate;
