// Servicio mínimo para interactuar con la API de OpenRouter
// Sin limitaciones de tasa, solo funcionalidad esencial

// Tipos para manejar conversaciones
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  messages: Message[];
  createdAt: number;
  lastActive: number;
  isActive: boolean;
}

export class QwenAIService {
  private apiKey: string | null = null;
  private baseURL: string = 'https://openrouter.ai/api/v1/chat/completions';
  private currentConversationId: string | null = null;
  private maxMessagesPerConversation: number = 5; // Límite de 5 mensajes por conversación
  private conversationTimeout: number = 3600000; // 1 hora de inactividad antes de cerrar conversación
  private last429ErrorTime: number = 0; // Momento del último error 429
  private cooldownPeriod: number = 30000; // 30 segundos de enfriamiento tras error 429

  constructor() {
    // Recuperar la clave API almacenada localmente
    const storedKey = localStorage.getItem('openrouter-api-key');
    if (storedKey) {
      this.apiKey = storedKey;
    } else {
      // Almacenar la clave API por defecto si no existe
      const defaultKey = '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';
      localStorage.setItem('openrouter-api-key', defaultKey);
      this.apiKey = defaultKey;
    }

    // Inicializar una nueva conversación
    this.startNewConversation();
  }

  private startNewConversation(): void {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newConversation: Conversation = {
      id: conversationId,
      messages: [],
      createdAt: Date.now(),
      lastActive: Date.now(),
      isActive: true
    };

    this.currentConversationId = conversationId;
    this.saveConversation(newConversation);
  }

  private getConversation(conversationId: string): Conversation | null {
    const conversationsStr = localStorage.getItem('ai_conversations') || '{}';
    let conversations: Record<string, Conversation> = {};

    try {
      conversations = JSON.parse(conversationsStr);
    } catch (e) {
      console.error('Error al parsear conversaciones:', e);
    }

    return conversations[conversationId] || null;
  }

  private saveConversation(conversation: Conversation): void {
    const conversationsStr = localStorage.getItem('ai_conversations') || '{}';
    let conversations: Record<string, Conversation> = {};

    try {
      conversations = JSON.parse(conversationsStr);
    } catch (e) {
      conversations = {};
    }

    conversations[conversation.id] = conversation;
    localStorage.setItem('ai_conversations', JSON.stringify(conversations));
  }

  private updateConversationLastActive(): void {
    if (!this.currentConversationId) return;

    const conversation = this.getConversation(this.currentConversationId);
    if (conversation) {
      conversation.lastActive = Date.now();
      this.saveConversation(conversation);
    }
  }

  private checkConversationTimeout(): boolean {
    if (!this.currentConversationId) return false;

    const conversation = this.getConversation(this.currentConversationId);
    if (conversation && Date.now() - conversation.lastActive > this.conversationTimeout) {
      // Marcar conversación como inactiva
      conversation.isActive = false;
      this.saveConversation(conversation);
      return true;
    }
    return false;
  }

  private async makeRequest(prompt: string, context: string = ''): Promise<string> {
    // Verificar si la conversación actual ha expirado
    if (this.checkConversationTimeout()) {
      return "Esta conversación ha expirado por inactividad. Por favor, inicia una nueva conversación.";
    }

    // Verificar si hay una conversación activa
    if (!this.currentConversationId) {
      this.startNewConversation();
    }

    const conversation = this.getConversation(this.currentConversationId!);
    if (!conversation) {
      this.startNewConversation();
      return await this.makeRequest(prompt, context); // Reintentar
    }

    // Verificar límite de mensajes por conversación
    if (conversation.messages.length >= this.maxMessagesPerConversation * 2) { // Contar ambos roles (usuario y asistente)
      return `Has alcanzado el límite de ${this.maxMessagesPerConversation} interacciones (10 mensajes totales) en esta conversación.`;
    }

    // Verificar período de enfriamiento tras error 429
    const now = Date.now();
    if (now - this.last429ErrorTime < this.cooldownPeriod) {
      const remainingCooldown = Math.ceil((this.cooldownPeriod - (now - this.last429ErrorTime)) / 1000);
      return `La IA está temporalmente ocupada. Por favor, espera ${remainingCooldown} segundos antes de enviar otra pregunta.`;
    }

    // Verificar clave API
    const currentApiKey = this.apiKey || localStorage.getItem('openrouter-api-key');
    if (!currentApiKey) {
      return "Por favor, configura tu clave de API de OpenRouter.";
    }

    try {
      // Obtener respuesta desde la API
      const response = await this.getAIResponseFromAPI(prompt, context);

      // Agregar mensajes a la conversación
      const userMessage: Message = {
        id: `msg_user_${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      };

      const aiMessage: Message = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      conversation.messages.push(userMessage, aiMessage);
      conversation.lastActive = Date.now();
      this.saveConversation(conversation);

      return response;
    } catch (error) {
      console.error('Error al llamar a la API de OpenRouter:', error);

      // Manejar diferentes tipos de errores
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return "Clave de API inválida. Por favor, verifica tu clave de API.";
        }
        if (error.message.includes('429')) {
          // Registrar el tiempo del error 429 para activar el período de enfriamiento
          this.last429ErrorTime = Date.now();
          return "Demasiadas solicitudes al proveedor. La IA está temporalmente ocupada, por favor espera un momento.";
        }
      }

      return `Error: ${(error as Error).message || 'Error desconocido'}`;
    }
  }

  private async getAIResponseFromAPI(prompt: string, context: string = ''): Promise<string> {
    const currentApiKey = this.apiKey || localStorage.getItem('openrouter-api-key');
    if (!currentApiKey) {
      throw new Error('No se encontró la clave de API.');
    }

    // Preparar mensajes con instrucciones claras para análisis profundo
    const messages = [
      {
        role: 'system',
        content: `Eres un asistente de IA experto en Minecraft. ANALIZA CUIDADOSAMENTE cada entrada.
        Comprende completamente el problema antes de responder.
        Proporciona respuestas precisas, detalladas y directamente relacionadas con la pregunta.`
      },
      ...(context ? [{
        role: 'system',
        content: `ANÁLISIS DEL CONTEXTO:\n\n${context}`
      }] : []),
      {
        role: 'user',
        content: `Analiza y responde detalladamente:\n\n${prompt}`
      }
    ];

    // Hacer solicitud sin límites de tasa
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-235b-a22b:free',  // Modelo Qwen gratuito correcto según tu ejemplo
          messages: messages,
          temperature: 0.7,
          max_tokens: 1500,
          top_p: 0.9
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        const errorCode = response.status;

        // En lugar de lanzar un error para 429, devolvemos un mensaje informativo
        if (errorCode === 429) {
          return "Demasiadas solicitudes al proveedor de IA. La IA está temporalmente ocupada, por favor intenta de nuevo en unos momentos.";
        }

        throw new Error(`${errorCode} - ${errorMessage}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return 'Tiempo de espera agotado. La solicitud tardó demasiado en procesarse.';
      }
      throw error; // Re-lanzar otros errores
    }
  }

  public async getResponse(userInput: string, context: string = ''): Promise<string> {
    try {
      return await this.makeRequest(userInput, context);
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('openrouter-api-key', apiKey);
  }

  public hasApiKey(): boolean {
    return this.apiKey !== null;
  }

  public resetMessageCount(): void {
    this.messageCount = 0;
  }

  public getMessageCount(): number {
    return this.messageCount;
  }
}

// Instancia singleton
export const qwenService = new QwenAIService();