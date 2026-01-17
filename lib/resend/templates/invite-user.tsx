import React from 'react';

interface EmailTemplateProps {
  actionUrl: string;
}

const InviteUserTemplate: React.FC<EmailTemplateProps> = ({ actionUrl }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
    <h1>Has sido invitado a CV Lab</h1>
    <p>
      Haz clic en el siguiente enlace para aceptar la invitación y crear tu
      cuenta:
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
      Aceptar Invitación
    </a>
  </div>
);

export default InviteUserTemplate;
