import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

// Sobreescribir las familias de fuentes por defecto de Tamagui para usar exclusivamente Nata Sans
const fontsObj = config.fonts as any
if (fontsObj) {
  Object.keys(fontsObj).forEach((key) => {
    if (fontsObj[key]) {
      fontsObj[key].family = 'Nata Sans, sans-serif'
    }
  })
}

const tamaguiConfig = createTamagui(config)

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
