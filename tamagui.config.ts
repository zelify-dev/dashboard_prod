import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

// Clonar la configuración para evitar mutar propiedades de sólo lectura en tiempo de ejecución
const clonedConfig = { ...config }
if (clonedConfig.fonts) {
  const clonedFonts = {} as any
  Object.keys(clonedConfig.fonts).forEach((key) => {
    const originalFont = (clonedConfig.fonts as any)[key]
    if (originalFont) {
      clonedFonts[key] = {
        ...originalFont,
        family: 'Nata Sans, sans-serif'
      }
    }
  })
  clonedConfig.fonts = clonedFonts
}

const tamaguiConfig = createTamagui(clonedConfig)

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
