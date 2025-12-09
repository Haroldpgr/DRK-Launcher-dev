/**
 * Utilidades para la validación y generación de UUIDs
 */

/**
 * Valida si una cadena es un UUID válido
 * @param uuid La cadena a validar
 * @returns true si es un UUID válido, false en caso contrario
 */
export function isValidUUID(uuid: string): boolean {
  // Expresión regular para validar UUID (formato 8-4-4-4-12 caracteres hexadecimales)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Genera un UUID válido en formato estándar
 * @returns Un UUID generado aleatoriamente
 */
export function generateValidUUID(): string {
  // Función auxiliar para generar caracteres hexadecimales aleatorios
  const randomHex = (count: number): string => {
    let result = '';
    for (let i = 0; i < count; i++) {
      result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
  };

  // Formato correcto de UUID v4: 8-4-4-4-12 caracteres hexadecimales
  const part1 = randomHex(8);  // 8 caracteres
  const part2 = randomHex(4);  // 4 caracteres
  const part3 = `4${randomHex(3)}`;  // 4 caracteres, comenzando con '4' para UUID v4
  const part4 = `${['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)]}${randomHex(3)}`;  // 4 caracteres, comenzando con 8, 9, a o b
  const part5 = randomHex(12); // 12 caracteres

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

/**
 * Asegura que una cadena sea un UUID válido, generando uno si es inválido
 * @param maybeUUID La cadena que puede ser un UUID
 * @returns Un UUID válido
 */
export function ensureValidUUID(maybeUUID: string | undefined | null): string {
  if (!maybeUUID) {
    return generateValidUUID();
  }
  
  if (isValidUUID(maybeUUID)) {
    return maybeUUID;
  }
  
  // Si no es un UUID válido, generar uno nuevo
  return generateValidUUID();
}