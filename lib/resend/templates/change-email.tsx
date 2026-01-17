import React from 'react';

interface EmailTemplateProps {
  actionUrl: string;
}

const ChangeEmailTemplate: React.FC<EmailTemplateProps> = ({ actionUrl }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
    <h1>Confirma tu nueva dirección de correo electrónico</h1>
    <p>
      Has solicitado cambiar tu dirección de correo electrónico. Por favor, haz
      clic en el siguiente enlace para confirmar tu nueva dirección:
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
      Confirmar nuevo correo
    </a>
  </div>
);

export default ChangeEmailTemplate;
