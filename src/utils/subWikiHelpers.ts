import { ExtensionManager } from '../core/ExtensionManager';

/**
 * Utilitários reativos para validação dos módulos transformados em extensão (Update 3.05 - Requisito 3.05.3.g & 3.05.3.e):
 * - Wiki dos Livros (WikiBooksExtension)
 * - Wiki Universitário (WikiUniversityExtension)
 * - Jornal WazzimaGiygg (WazzimaGiyggNewsExtension)
 * - Modo de Manutenção (WikiMaintenanceModeExtension)
 */

export function isBooksModuleEnabled(): boolean {
  try {
    return ExtensionManager.getInstance().isExtensionEnabled('WikiBooksExtension');
  } catch {
    return true;
  }
}

export function isAcademicModuleEnabled(): boolean {
  try {
    return ExtensionManager.getInstance().isExtensionEnabled('WikiUniversityExtension');
  } catch {
    return true;
  }
}

export function isNewsModuleEnabled(): boolean {
  try {
    return ExtensionManager.getInstance().isExtensionEnabled('WazzimaGiyggNewsExtension');
  } catch {
    return true;
  }
}

export function isMaintenanceModeActive(): boolean {
  try {
    const manager = ExtensionManager.getInstance();
    if (!manager.isExtensionEnabled('WikiMaintenanceModeExtension')) {
      return false;
    }
    const settings = manager.getExtensionSettings('WikiMaintenanceModeExtension');
    return !!settings.maintenanceActive;
  } catch {
    return false;
  }
}

export function getMaintenanceSettings(): {
  maintenanceActive: boolean;
  maintenanceNoticeTitle: string;
  maintenanceNoticeMessage: string;
  allowBureaucratsOnly: boolean;
} {
  try {
    const manager = ExtensionManager.getInstance();
    const settings = manager.getExtensionSettings('WikiMaintenanceModeExtension');
    return {
      maintenanceActive: !!settings.maintenanceActive,
      maintenanceNoticeTitle: settings.maintenanceNoticeTitle || 'WikiWorldWeb em Manutenção Programada',
      maintenanceNoticeMessage:
        settings.maintenanceNoticeMessage ||
        'Estamos realizando atualizações técnicas no sistema. Apenas burocratas autorizados podem acessar as configurações durante a manutenção.',
      allowBureaucratsOnly: settings.allowBureaucratsOnly !== false,
    };
  } catch {
    return {
      maintenanceActive: false,
      maintenanceNoticeTitle: 'WikiWorldWeb em Manutenção Programada',
      maintenanceNoticeMessage: 'Estamos realizando atualizações técnicas no sistema.',
      allowBureaucratsOnly: true,
    };
  }
}
