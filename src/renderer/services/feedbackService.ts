// ============================================
// SERVICIO DE FEEDBACK - DRK Launcher
// Envía recomendaciones y feedback por correo directamente
// ============================================

const FEEDBACK_EMAIL = 'darkyvastudio@gmail.com';

interface FeedbackData {
  subject: string;
  message: string;
  type: string;
  userEmail: string;
}

class FeedbackService {
  /**
   * Envía feedback directamente desde el launcher usando el proceso principal
   */
  async sendFeedback(data: FeedbackData): Promise<boolean> {
    try {
      // Formatear el cuerpo del mensaje
      const emailBody = this.formatEmailBody(data);
      
      // Debug: verificar disponibilidad del API
      console.log('Verificando API:', {
        hasWindow: typeof window !== 'undefined',
        hasApi: !!window.api,
        hasFeedback: !!window.api?.feedback,
        hasSend: !!window.api?.feedback?.send
      });
      
      // Enviar usando el proceso principal de Electron
      if (window.api?.feedback?.send) {
        const result = await window.api.feedback.send({
          to: FEEDBACK_EMAIL,
          subject: data.subject,
          body: emailBody,
          type: data.type,
          userEmail: data.userEmail
        });
        return result.success || false;
      } else {
        console.error('API de feedback no disponible. window.api:', window.api);
        // Fallback: intentar usar ipcRenderer directamente si está disponible
        if ((window as any).electron?.ipcRenderer) {
          console.log('Intentando usar ipcRenderer directamente...');
          const result = await (window as any).electron.ipcRenderer.invoke('feedback:send', {
            to: FEEDBACK_EMAIL,
            subject: data.subject,
            body: emailBody,
            type: data.type,
            userEmail: data.userEmail
          });
          return result?.success || false;
        }
        return false;
      }
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      return false;
    }
  }

  /**
   * Formatea el cuerpo del correo con información estructurada
   */
  private formatEmailBody(data: FeedbackData): string {
    const timestamp = new Date().toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'long'
    });

    return `Hola equipo de DRK Launcher,

${data.message}

─────────────────────────────────────
INFORMACIÓN ADICIONAL:
─────────────────────────────────────
• Tipo: ${this.getTypeLabel(data.type)}
• Correo del Usuario: ${data.userEmail}
• Fecha: ${timestamp}
• Versión del Launcher: ${this.getLauncherVersion()}
• Sistema Operativo: ${this.getOSInfo()}

Gracias por tu tiempo y por ayudarnos a mejorar DRK Launcher.
`.trim();
  }

  /**
   * Crea la URL mailto con todos los parámetros
   */
  private createMailtoUrl(subject: string, body: string): string {
    const params = new URLSearchParams({
      to: FEEDBACK_EMAIL,
      subject: encodeURIComponent(subject),
      body: encodeURIComponent(body)
    });

    return `mailto:${FEEDBACK_EMAIL}?${params.toString()}`;
  }

  /**
   * Obtiene la etiqueta legible del tipo de feedback
   */
  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'bug': 'Reporte de Error',
      'feature': 'Sugerencia de Funcionalidad',
      'improvement': 'Mejora de Funcionalidad',
      'modpack': 'Solicitud de Modpack',
      'performance': 'Problema de Rendimiento',
      'ui': 'Mejora de Interfaz',
      'other': 'Otro Asunto'
    };
    return labels[type] || 'Consulta General';
  }

  /**
   * Obtiene la versión del launcher
   */
  private getLauncherVersion(): string {
    // Intentar obtener la versión desde package.json o configuración
    try {
      if (window.api?.app?.getVersion) {
        return window.api.app.getVersion();
      }
    } catch (error) {
      console.error('Error al obtener versión:', error);
    }
    return 'Desconocida';
  }

  /**
   * Obtiene información del sistema operativo
   */
  private getOSInfo(): string {
    try {
      if (window.api?.os?.platform) {
        const platform = window.api.os.platform();
        const arch = window.api.os.arch?.() || 'unknown';
        return `${platform} (${arch})`;
      }
    } catch (error) {
      console.error('Error al obtener info del OS:', error);
    }
    return navigator.platform || 'Desconocido';
  }
}

export const feedbackService = new FeedbackService();
export default feedbackService;

