import React from 'react';

interface EmailTemplateProps {
  actionUrl: string;
}

const ReauthenticationTemplate: React.FC<EmailTemplateProps> = ({
  actionUrl,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
    <h1>Confirma tu identidad</h1>
    <p>
      Se ha solicitado una acción sensible que requiere que confirmes tu
      identidad.
    </p>
    <p>Haz clic en el siguiente enlace para continuar:</p>
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
      Confirmar
    </a>
  </div>
);

export default ReauthenticationTemplate;
