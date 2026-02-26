export interface AMLBrandingConfig {
    logo: string | null;
    customColorTheme: string;
}

export interface AMLConfig {
    branding: {
        light: AMLBrandingConfig;
        dark: AMLBrandingConfig;
    };
}
