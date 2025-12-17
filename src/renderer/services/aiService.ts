// Servicio mínimo para interactuar con la API de OpenRouter
// Sin limitaciones de tasa, solo funcionalidad esencial

import { encrypt, decrypt } from '../utils/encryption';

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
  private cooldownPeriod: number = 60000; // 60 segundos de enfriamiento tras error 429 (aumentado para evitar 429)

  constructor() {
    // API key correcta proporcionada por el usuario
    const correctApiKey = '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';
    const oldApiKey = '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';
    
    // Recuperar la clave API almacenada localmente (encriptada)
    const storedKeyEncrypted = localStorage.getItem('openrouter-api-key-encrypted');
    if (storedKeyEncrypted) {
      try {
        const decryptedKey = decrypt(storedKeyEncrypted);
        // Si es la API key antigua, reemplazarla con la nueva
        if (decryptedKey === oldApiKey || decryptedKey.startsWith('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')) {
          this.setApiKey(correctApiKey);
        } else {
          this.apiKey = decryptedKey;
        }
      } catch (error) {
        // Usar la nueva API key por defecto
        this.setApiKey(correctApiKey);
      }
    } else {
      // Verificar si hay una versión sin encriptar (migración)
    const storedKey = localStorage.getItem('openrouter-api-key');
    if (storedKey) {
        // Si la clave almacenada es la antigua, reemplazarla con la nueva
        if (storedKey === oldApiKey || storedKey.startsWith('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')) {
          this.setApiKey(correctApiKey);
        } else {
      this.apiKey = storedKey;
          // Migrar a formato encriptado
          this.setApiKey(storedKey);
          // Eliminar versión sin encriptar
          localStorage.removeItem('openrouter-api-key');
        }
    } else {
        // Usar la API key proporcionada por el usuario
        this.setApiKey(correctApiKey);
      }
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
      // Error silencioso al parsear conversaciones
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

    // Verificar clave API (desencriptar si es necesario)
    let currentApiKey = this.apiKey;
    if (!currentApiKey) {
      const storedKeyEncrypted = localStorage.getItem('openrouter-api-key-encrypted');
      if (storedKeyEncrypted) {
        try {
          currentApiKey = decrypt(storedKeyEncrypted);
        } catch (error) {
          // Error silencioso al desencriptar
        }
      }
      // Fallback a versión sin encriptar (migración)
      if (!currentApiKey) {
        currentApiKey = localStorage.getItem('openrouter-api-key');
      }
    }
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
      // Manejar diferentes tipos de errores
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return "Clave de API inválida. Por favor, verifica tu clave de API.";
        }
        if (error.message.includes('429')) {
          // Registrar el tiempo del error 429 para activar el período de enfriamiento
          this.last429ErrorTime = Date.now();
          return "Demasiadas solicitudes. Por favor, espera unos momentos antes de intentar de nuevo.";
        }
      }

      return `Error: ${(error as Error).message || 'Error desconocido'}`;
    }
  }

  private async getAIResponseFromAPI(prompt: string, context: string = ''): Promise<string> {
    // Obtener y desencriptar la API key
    let currentApiKey = this.apiKey;
    if (!currentApiKey) {
      const storedKeyEncrypted = localStorage.getItem('openrouter-api-key-encrypted');
      if (storedKeyEncrypted) {
        try {
          currentApiKey = decrypt(storedKeyEncrypted);
        } catch (error) {
          // Error silencioso al desencriptar
        }
      }
      // Fallback a versión sin encriptar (migración)
      if (!currentApiKey) {
        currentApiKey = localStorage.getItem('openrouter-api-key');
      }
    }
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
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin || 'https://drk-launcher.app',
          'X-Title': 'DRK Launcher'
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

        // Manejar errores específicos
        if (errorCode === 401) {
          throw new Error(`401 - Clave de API inválida. Por favor, verifica tu clave de API de OpenRouter.`);
        }

        if (errorCode === 429) {
          // Registrar el tiempo del error 429 para activar el período de enfriamiento
          this.last429ErrorTime = Date.now();
          // Aumentar el período de enfriamiento después de un 429
          this.cooldownPeriod = Math.min(this.cooldownPeriod * 1.5, 120000); // Máximo 2 minutos
          return "Demasiadas solicitudes. Por favor, espera unos momentos antes de intentar de nuevo.";
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
    if (!apiKey || !apiKey.trim()) {
      return;
    }
    this.apiKey = apiKey.trim();
    // Guardar encriptada
    const encryptedKey = encrypt(this.apiKey);
    localStorage.setItem('openrouter-api-key-encrypted', encryptedKey);
    // Eliminar versión sin encriptar si existe (migración)
    localStorage.removeItem('openrouter-api-key');
  }

  public getApiKey(): string | null {
    return this.apiKey;
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

// Exponer función global para configurar la API key desde la consola
if (typeof window !== 'undefined') {
  (window as any).setOpenRouterApiKey = (apiKey: string) => {
    qwenService.setApiKey(apiKey);
  };
  
  // Verificar y actualizar la API key si es necesario al cargar
  setTimeout(() => {
    const currentKey = qwenService.getApiKey();
    const correctKey = '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';
    const oldKey = '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';
    if (currentKey && (currentKey === oldKey || currentKey.startsWith('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'))) {
      qwenService.setApiKey(correctKey);
    }
  }, 100);
}