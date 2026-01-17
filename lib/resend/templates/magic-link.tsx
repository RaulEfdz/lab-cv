import React from 'react';

interface EmailTemplateProps {
  actionUrl: string;
}

const MagicLinkTemplate: React.FC<EmailTemplateProps> = ({ actionUrl }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
    <h1>Inicia sesión en CV Lab</h1>
    <p>
      Haz clic en el siguiente enlace para iniciar sesión en tu cuenta de forma
      segura:
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
      Iniciar Sesión
    </a>
    <p>
      Este enlace expirará en 5 minutos. Si no solicitaste este inicio de
      sesión, puedes ignorar este mensaje.
    </p>
  </div>
);

export default MagicLinkTemplate;
