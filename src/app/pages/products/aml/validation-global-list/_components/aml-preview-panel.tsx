"use client";

import { useEffect, useState, useRef } from "react";
import { AMLConfig } from "./aml-config-types";
import { useAMLTranslations } from "./use-aml-translations";

interface AMLPreviewPanelProps {
    config: AMLConfig;
    isActive?: boolean;
}

// Reuse AnimatedHalftoneBackdrop from Auth
function AnimatedHalftoneBackdrop({ isDarkMode }: { isDarkMode: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

        const resize = () => {
            const { width, height } = parent.getBoundingClientRect();
            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(resize);
            observer.observe(parent);
            resizeObserverRef.current = observer;
        }

        let start = performance.now();
        const spacing = 26;
        const waveFrequency = 1.35;
        const waveSpeed = 0.35;

        const render = (time: number) => {
            const elapsed = (time - start) / 1000;
            const logicalWidth = canvas.width / dpr;
            const logicalHeight = canvas.height / dpr;
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);

            const centerX = logicalWidth / 2;
            const centerY = logicalHeight / 2;
            const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
            const [r, g, b] = isDarkMode ? [255, 255, 255] : [94, 109, 136];

            for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
                for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const normalizedDistance = distance / maxDistance;
                    const wavePhase = (normalizedDistance * waveFrequency - elapsed * waveSpeed) * Math.PI * 2;
                    const pulse = (Math.cos(wavePhase) + 1) / 2;
                    const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
                    const alpha = (0.06 + pulse * 0.45) * edgeFade;
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
        };
    }, [isDarkMode]);

    return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function EdgeFadeOverlay({ isDarkMode }: { isDarkMode: boolean }) {
    const fadeColor = isDarkMode ? "rgba(8,11,25,1)" : "rgba(250,252,255,1)";
    const gradientBackground = 'radial-gradient(circle at center, rgba(0,0,0,0) 60%, ' + fadeColor + ' 100%)';
    return (
        <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
                background: gradientBackground,
            }}
        ></div>
    );
}

export function AMLPreviewPanel({ config, isActive = true }: AMLPreviewPanelProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dots, setDots] = useState("");
    const [currentValidationText, setCurrentValidationText] = useState(0);
    const [particles] = useState(() => {
        return Array.from({ length: 6 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 3 + Math.random() * 3,
        }));
    });
    const scanLineRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<SVGCircleElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const translations = useAMLTranslations();

    // Textos de validación que rotan (dinámicos según idioma)
    const validationTexts = [
        translations.faceScan.validatingInternalLists,
        translations.faceScan.validatingInternalList,
        translations.faceScan.validatingGlobalLists,
    ];

    const [scanPhase, setScanPhase] = useState<'scanning' | 'success'>('scanning');

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Ref para controlar si el componente está montado y evitar race conditions
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);



    // Animación de puntos
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => {
                if (prev === "") return ".";
                if (prev === ".") return "..";
                if (prev === "..") return "...";
                return "";
            });
        }, 900);
        return () => clearInterval(interval);
    }, []);

    // Rotación de textos de validación
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentValidationText(prev => (prev + 1) % validationTexts.length);
        }, 3000); // Cambiar cada 3 segundos
        return () => clearInterval(interval);
    }, [validationTexts.length]);

    // Request camera access
    const requestCameraAccess = async () => {
        try {
            setCameraError(null);

            // Stop any previous stream before requesting a new one
            // Estricta limpieza: Detener cualquier stream existente en la referencia antes de solicitar uno nuevo
            if (streamRef.current) {
                console.log("Cleaning up previous stream before new request");
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                    // Asegurar que el evento 'ended' se dispare si alguien lo escucha
                    track.enabled = false;
                });
                streamRef.current = null;
            }
            setCameraStream(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // Verificación crítica: Si el componente se desmontó o isActive cambió a false mientras esperábamos
            if (!isMounted.current || !isActive) {
                stream.getTracks().forEach(track => track.stop());
                return false;
            }

            if (!stream.active) {
                stream.getTracks().forEach(track => track.stop());
                throw new Error('Camera stream is not active');
            }

            const activeTracks = stream.getVideoTracks().filter(track => track.readyState === 'live');
            if (activeTracks.length === 0) {
                stream.getTracks().forEach(track => track.stop());
                throw new Error('No active video tracks');
            }

            setCameraStream(stream);
            streamRef.current = stream;
            return true;
        } catch (error: any) {
            console.error('Error accessing camera:', error);
            if (isMounted.current) {
                setCameraError(error.message || 'Could not access camera');
                setCameraStream(null);
            }
            streamRef.current = null;
            return false;
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraStream(null);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Activar cámara automáticamente cuando isActive es true
    // Limpieza al desmontar el componente (Global safety net)
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Control de activación basado en props y fase
    useEffect(() => {
        if (isActive && scanPhase === 'scanning') {
            requestCameraAccess();
        } else {
            stopCamera();
        }
        // Nota: No incluimos cleanup aquí porque el cleanup global ya lo maneja, 
        // y queremos evitar doble llamada o condiciones de carrera en re-renders rápidos.
        // Solo reaccionamos a cambios de estado.
    }, [isActive, scanPhase]);

    // Connect el stream al video cuando esté disponible
    useEffect(() => {
        const video = videoRef.current;
        if (video && cameraStream) {
            video.srcObject = cameraStream;
            video.play().catch(console.error);
        }

        return () => {
            if (video) {
                video.srcObject = null;
            }
        };
    }, [cameraStream]);

    // Ciclo de fases y animación de progreso
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let progressInterval: NodeJS.Timeout;

        if (scanPhase === 'scanning') {
            // Fase de escaneo (4 segundos)
            setProgress(0);

            const startTime = Date.now();
            const duration = 4000;

            progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const newProgress = Math.min((elapsed / duration) * 100, 100);
                setProgress(newProgress);
            }, 50);

            timeoutId = setTimeout(() => {
                setScanPhase('success');
                setProgress(100);
            }, duration);

        } else {
            // Fase de éxito (3 segundos)
            setProgress(100);
            timeoutId = setTimeout(() => {
                setScanPhase('scanning');
                setProgress(0);
            }, 3000);
        }

        return () => {
            clearTimeout(timeoutId);
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [scanPhase]);

    // Animación de línea de escaneo
    useEffect(() => {
        if (!scanLineRef.current) return;
        let position = 0;
        let direction = 1;
        const speed = 2;

        const animate = () => {
            position += direction * speed;
            if (position >= 100) {
                direction = -1;
                position = 100;
            } else if (position <= 0) {
                direction = 1;
                position = 0;
            }

            if (scanLineRef.current) {
                scanLineRef.current.style.top = position + '%';
            }
            requestAnimationFrame(animate);
        };
        animate();
    }, []);

    // Animación del anillo
    useEffect(() => {
        if (!ringRef.current) return;
        let rotation = 0;
        const animate = () => {
            rotation += 0.5;
            if (ringRef.current) {
                ringRef.current.style.transform = 'rotate(' + rotation + 'deg)';
            }
            requestAnimationFrame(animate);
        };
        animate();
    }, []);

    // Inyectar estilos CSS para animaciones
    useEffect(() => {
        const styleId = 'aml-face-scan-animations';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes pulse-mesh {
                0%, 100% { opacity: 0.65; }
                50% { opacity: 1; }
            }
            @keyframes float-0 {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
                50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
            }
            @keyframes float-1 {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
                50% { transform: translateY(-15px) translateX(-8px); opacity: 0.7; }
            }
            @keyframes float-2 {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
                50% { transform: translateY(-25px) translateX(5px); opacity: 0.9; }
            }
            @keyframes float-3 {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
                50% { transform: translateY(-18px) translateX(-12px); opacity: 0.6; }
            }
            @keyframes float-4 {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
                50% { transform: translateY(-22px) translateX(8px); opacity: 0.8; }
            }
            @keyframes float-5 {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
                50% { transform: translateY(-16px) translateX(-5px); opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);

        return () => {
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);


    const currentBranding = config.branding.light;
    const themeColor = currentBranding.customColorTheme || "#004492";

    // Parámetros configurables del gradiente y padding
    const GRADIENT_DARKEN_AMOUNT = 150; // Qué tan oscuro es el color inferior (0-255)
    const GRADIENT_MID_POINT = 30; // Hasta qué altura llega el gradiente (0-100%)
    const GRADIENT_FADE_START = 50; // Dónde empieza a desvanecerse (0-100%)
    const GRADIENT_FADE_END = 100; // Dónde termina de desvanecerse (0-100%)
    const CARD_PADDING_HORIZONTAL = 16; // Padding lateral en píxeles (mx-4 = 16px)
    const CARD_PADDING_BOTTOM = 36; // Padding inferior en píxeles (mb-4 = 16px)
    const CARD_PADDING_TOP = 32; // Padding superior interno en píxeles
    const CARD_PADDING_INTERNAL_HORIZONTAL = 16; // Padding interno horizontal en píxeles
    const CARD_PADDING_INTERNAL_BOTTOM = 24; // Padding interno inferior en píxeles

    // Función para oscurecer el color
    const darkenColor = (hex: string, amount: number) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, ((num >> 16) & 0xFF) - amount);
        const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
        const b = Math.max(0, (num & 0xFF) - amount);
        return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const almostBlackColor = darkenColor(themeColor, GRADIENT_DARKEN_AMOUNT);
    const cardGradient = 'linear-gradient(to top, ' + almostBlackColor + ' 0%, ' + themeColor + ' ' + GRADIENT_MID_POINT + '%, rgba(255,255,255,0) ' + GRADIENT_FADE_START + '%, rgba(255,255,255,0) ' + GRADIENT_FADE_END + '%)';

    return (
        <div className="relative flex h-full min-h-[600px] w-full items-center justify-center overflow-hidden rounded-3xl bg-gray-50 p-8 dark:bg-[#080b19]">
            {/* Background Animations */}
            <div className="absolute inset-0 z-0">
                <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
                <EdgeFadeOverlay isDarkMode={isDarkMode} />
            </div>

            {/* iPhone Frame */}
            <div className="relative mx-auto max-w-[340px] z-10">
                <div className="relative mx-auto">
                    {/* Outer frame with iPhone-like design */}
                    <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
                        {/* Screen - Fixed height container */}
                        <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
                            {/* Status bar with Dynamic Island and icons aligned */}
                            <div className="relative flex items-center justify-between bg-white dark:bg-black px-6 pt-10 pb-2 flex-shrink-0">
                                {/* Left side - Time aligned with Dynamic Island */}
                                <div className="absolute left-6 top-4 flex items-center">
                                    <span className="text-xs font-semibold text-black dark:text-white">9:41</span>
                                </div>

                                {/* Center - Dynamic Island */}
                                <div className="absolute left-1/2 top-3 -translate-x-1/2">
                                    <div className="h-5 w-24 rounded-full bg-black dark:bg-white/20"></div>
                                    {/* Speaker */}
                                    <div className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-white/30"></div>
                                </div>

                                {/* Right side - Signal and Battery aligned with Dynamic Island */}
                                <div className="absolute right-6 top-4 flex items-center gap-1.5">
                                    <svg className="h-3 w-5" fill="none" viewBox="0 0 20 12">
                                        <path
                                            d="M1 8h2v2H1V8zm3-2h2v4H4V6zm3-2h2v6H7V4zm3-1h2v7h-2V3z"
                                            fill="currentColor"
                                            className="text-black dark:text-white"
                                        />
                                    </svg>
                                    <div className="h-2.5 w-6 rounded-sm border border-black dark:border-white">
                                        <div className="h-full w-4/5 rounded-sm bg-black dark:bg-white"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Content area */}
                            <div className="flex-1 min-h-0 bg-white dark:bg-black overflow-hidden flex flex-col relative">
                                {/* Header */}
                                <div className="relative flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0 z-20">
                                    {/* Botón Back */}
                                    <button className="flex items-center text-[16px] font-normal text-[#AAB2BF] hover:text-[#6B7280] transition-colors">
                                        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span>{translations.faceScan.back}</span>
                                    </button>

                                    {/* Logo centrado - Solo se muestra si hay un logo configurado */}
                                    {currentBranding.logo && (
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
                                            <img
                                                src={currentBranding.logo}
                                                alt="Logo"
                                                className="h-8 w-auto max-w-[120px] object-contain"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Tarjeta con gradiente y contenido */}
                                <div
                                    className="flex-1 flex flex-col items-center justify-center rounded-3xl overflow-hidden"
                                    style={{
                                        background: cardGradient,
                                        marginLeft: CARD_PADDING_HORIZONTAL + 'px',
                                        marginRight: CARD_PADDING_HORIZONTAL + 'px',
                                        marginBottom: CARD_PADDING_BOTTOM + 'px',
                                        paddingTop: CARD_PADDING_TOP + 'px',
                                        paddingBottom: CARD_PADDING_INTERNAL_BOTTOM + 'px',
                                        paddingLeft: CARD_PADDING_INTERNAL_HORIZONTAL + 'px',
                                        paddingRight: CARD_PADDING_INTERNAL_HORIZONTAL + 'px'
                                    }}
                                >
                                    {/* Título principal */}
                                    <h1 className="text-center mb-6">
                                        <span
                                            className="text-[22px] font-bold leading-tight"
                                            style={{ color: themeColor }}
                                        >
                                            {translations.faceScan.scanning}
                                        </span>
                                        <span
                                            className="text-[22px] font-normal leading-tight ml-2"
                                            style={{ color: themeColor, opacity: 0.7 }}
                                        >
                                            {translations.faceScan.yourFace}
                                        </span>
                                    </h1>

                                    {/* Módulo de escaneo central */}
                                    <div className="relative w-[240px] h-[240px] flex items-center justify-center">
                                        {/* Anillo circular exterior animado */}
                                        <svg
                                            className="absolute inset-0 w-full h-full"
                                            viewBox="0 0 240 240"
                                        >
                                            <circle
                                                ref={ringRef}
                                                cx="120"
                                                cy="120"
                                                r="110"
                                                fill="none"
                                                stroke={themeColor}
                                                strokeWidth="3"
                                                strokeDasharray="20 10"
                                                strokeLinecap="round"
                                                opacity="0.6"
                                                style={{
                                                    transformOrigin: '120px 120px',
                                                    transition: 'none'
                                                }}
                                            />
                                        </svg>

                                        {/* Círculo interno con ilustración */}
                                        <div
                                            className="relative w-[200px] h-[200px] rounded-full overflow-hidden"
                                            style={{
                                                background: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(200,220,255,0.8) 50%, rgba(150,180,255,0.6) 100%)',
                                                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1), 0 0 30px rgba(0,0,0,0.2)',
                                                border: '2px solid rgba(255,255,255,0.3)'
                                            }}
                                        >
                                            {/* Video de cámara en vivo */}
                                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full bg-black">
                                                {scanPhase === 'scanning' ? (
                                                    <>
                                                        <video
                                                            ref={videoRef}
                                                            autoPlay
                                                            playsInline
                                                            muted
                                                            className="w-full h-full object-cover"
                                                            style={{
                                                                transform: 'scaleX(-1)', // Espejo horizontal
                                                                display: 'block',
                                                                position: 'relative',
                                                                zIndex: 1,
                                                                backgroundColor: '#000',
                                                            }}
                                                        />

                                                        {/* Mensaje si no hay cámara */}
                                                        {!cameraStream && !cameraError && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 rounded-full">
                                                                <p className="text-white text-sm">{translations.faceScan.startingCamera}</p>
                                                            </div>
                                                        )}

                                                        {/* Mensaje de error */}
                                                        {cameraError && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 rounded-full">
                                                                <p className="text-white text-xs text-center px-4">{cameraError}</p>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-emerald-500">
                                                        <svg
                                                            className="h-20 w-20 text-white animate-in zoom-in duration-300"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={3}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Elementos de escaneo (solo visibles en fase scanning) */}
                                            {scanPhase === 'scanning' && (
                                                <>
                                                    {/* Línea de escaneo horizontal */}
                                                    <div
                                                        ref={scanLineRef}
                                                        className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent z-20"
                                                        style={{
                                                            top: '50%',
                                                            boxShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.4)',
                                                            filter: 'blur(1px)',
                                                            transition: 'top 0.05s linear'
                                                        }}
                                                    />

                                                    {/* Destellos/partículas */}
                                                    <div className="absolute inset-0">
                                                        {particles.map((p) => {
                                                            const leftValue = p.x + '%';
                                                            const topValue = p.y + '%';
                                                            const animationValue = 'float-' + p.id + ' ' + p.duration + 's ease-in-out infinite';
                                                            const delayValue = p.delay + 's';
                                                            return (
                                                                <div
                                                                    key={p.id}
                                                                    className="absolute w-1 h-1 rounded-full bg-cyan-400 opacity-40 z-20"
                                                                    style={{
                                                                        left: leftValue,
                                                                        top: topValue,
                                                                        animation: animationValue,
                                                                        animationDelay: delayValue,
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Texto "Completando verificación" - Cambiar según fase */}
                                    <p className="text-center text-white/70 text-[16px] mb-2 mt-6">
                                        {scanPhase === 'success'
                                            ? translations.faceScan.verificationComplete || "Verification complete"
                                            : translations.faceScan.completingVerification
                                        }
                                    </p>

                                    {/* Texto que cambia - Ocultar en éxito */}
                                    <p className="text-center text-white text-[14px] font-semibold mb-4 min-h-[20px] whitespace-nowrap">
                                        {scanPhase === 'success'
                                            ? " "
                                            : validationTexts[currentValidationText]
                                        }
                                    </p>

                                    {/* Barra de progreso */}
                                    <div className="w-full max-w-xs mx-auto">
                                        <div className="w-full bg-gray-400 rounded-full h-[12px] overflow-hidden">
                                            <div
                                                className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                                                style={{
                                                    width: progress + '%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Home indicator - Fixed at bottom */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-shrink-0 z-20">
                                <div className="h-1 w-32 rounded-full bg-black/30 dark:bg-white/30"></div>
                            </div>
                        </div>

                        {/* Side buttons */}
                        <div className="absolute -left-1 top-24 h-12 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
                        <div className="absolute -left-1 top-40 h-8 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
                        <div className="absolute -right-1 top-32 h-10 w-1 rounded-r bg-gray-800 dark:bg-gray-700"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
