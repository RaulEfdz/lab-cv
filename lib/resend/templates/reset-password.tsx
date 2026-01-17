import React from 'react';

interface EmailTemplateProps {
  actionUrl: string;
}

const ResetPasswordTemplate: React.FC<EmailTemplateProps> = ({
  actionUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
    <h1>Restablecer tu contraseña</h1>
    <p>
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
      Si no has sido tú, ignora este mensaje.
    </p>
    <p>
      Haz clic en el siguiente enlace para elegir una nueva contraseña:
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
      Restablecer Contraseña
    </a>
  </div>
);

export default ResetPasswordTemplate;
