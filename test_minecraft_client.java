public class Main {
    public static void main(String[] args) {
        System.out.println("=== Iniciando Cliente de Minecraft ===");
        
        // Imprimir argumentos recibidos
        System.out.println("Argumentos recibidos:");
        for (int i = 0; i < args.length; i++) {
            System.out.println("  " + args[i] + (i + 1 < args.length ? " " + args[i + 1] : ""));
            i++; // Saltar el siguiente argumento ya que es el valor del actual
        }
        
        System.out.println("Cliente de Minecraft iniciado exitosamente!");
        System.out.println("Simulando carga del juego...");
        
        try {
            // Simular carga del juego
            for (int i = 1; i <= 5; i++) {
                System.out.println("Cargando... " + (i * 20) + "%");
                Thread.sleep(1000);
            }
            
            System.out.println("¡Minecraft está listo para jugar!");
            
            // Mantener el proceso vivo simulando el juego
            while (true) {
                Thread.sleep(1000);
                System.out.println("Minecraft en ejecución...");
            }
        } catch (InterruptedException e) {
            System.out.println("Cliente de Minecraft cerrado.");
        }
    }
}