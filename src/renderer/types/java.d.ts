// types/java.d.ts

interface JavaInfo {
  id: string;
  path: string;
  version: string;
  isWorking: boolean;
  source: 'global' | 'installed' | 'JAVA_HOME' | 'PATH';
  downloadDate?: string;
  isDefault?: boolean;
}

interface JavaInstallResult {
  success: boolean;
  javaInfo?: JavaInfo;
  message?: string;
}

interface JavaTestResult {
  isWorking: boolean;
  version?: string;
  output?: string;
  error?: string;
}

interface JavaCompatibility {
  requiredVersion: string;
  recommendedVersion: string;
  note: string;
}

interface Window {
  api: {
    java: {
      detect: () => Promise<JavaInfo[]>;
      explore: () => Promise<string | null>;
      test: (path: string) => Promise<JavaTestResult>;
      install: (version: string) => Promise<JavaInstallResult>;
      getAll: () => Promise<JavaInfo[]>;
      getDefault: () => Promise<JavaInfo | null>;
      setDefault: (javaId: string) => Promise<boolean>;
      remove: (javaId: string) => Promise<boolean>;
      getCompatibility: (minecraftVersion: string) => Promise<JavaCompatibility | null>;
    };
  };
}