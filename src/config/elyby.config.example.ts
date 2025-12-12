// Configuración de OAuth 2.0 para Ely.by
// 
// INSTRUCCIONES:
// 1. Ve a https://account.ely.by/oauth2/applications
// 2. Crea una nueva aplicación (tipo: Website)
// 3. Establece la URI de redirección como: elyby://auth/callback
// 4. Copia el client_id y client_secret
// 5. Renombra este archivo a elyby.config.ts
// 6. Reemplaza los valores de ejemplo con tus credenciales reales

export const ELY_BY_OAUTH_CONFIG = {
  clientId: 'tu_client_id_aqui',
  clientSecret: 'tu_client_secret_aqui',
  redirectUri: 'elyby://auth/callback',
  scopes: 'account_info account_email'
};

