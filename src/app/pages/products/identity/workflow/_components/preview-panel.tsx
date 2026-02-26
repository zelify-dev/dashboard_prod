"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { WorkflowConfig, ViewMode, Country, DocumentType, LivenessType, ScreenStep } from "./workflow-config";
import { useIdentityWorkflowTranslations } from "./use-identity-translations";
import { useCTAButtonAnimations } from "@/hooks/use-cta-button-animations";

interface PreviewPanelProps {
  config: WorkflowConfig;
  updateConfig: (updates: Partial<WorkflowConfig>) => void;
}

function MobileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

function WebIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

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
      const { color, baseAlpha, pulseAlpha } = isDarkMode
        ? { color: [255, 255, 255], baseAlpha: 0.06, pulseAlpha: 0.45 }
        : { color: [58, 82, 190], baseAlpha: 0.2, pulseAlpha: 0.75 };
      const [r, g, b] = color as [number, number, number];

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase = (normalizedDistance * waveFrequency - elapsed * waveSpeed) * Math.PI * 2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (baseAlpha + pulse * pulseAlpha) * edgeFade;
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
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-3xl"
      style={{
        background: `radial-gradient(circle at center, rgba(0,0,0,0) 60%, ${fadeColor} 100%)`,
      }}
    ></div>
  );
}


export function PreviewPanel({ config, updateConfig }: PreviewPanelProps) {
  const { viewMode, country, currentScreen, enabledScreens, documentTypes, livenessTypes, selectedDocumentType, selectedLivenessType, result, branding } = config;
  const identityTranslations = useIdentityWorkflowTranslations();
  const {
    preview: previewTexts,
    countries: countryNames,
    documents: documentNames,
    livenessTypeNames,
  } = identityTranslations;
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [captureStep, setCaptureStep] = useState<"front" | "back">("front");
  const [isCapturing, setIsCapturing] = useState(false);
  const [frontCaptured, setFrontCaptured] = useState(false);
  const [backCaptured, setBackCaptured] = useState(false);
  const [isFaceIdScanning, setIsFaceIdScanning] = useState(false);
  const [faceIdProgress, setFaceIdProgress] = useState(0);
  const [isCircleFilling, setIsCircleFilling] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeWelcomeCard, setActiveWelcomeCard] = useState<number>(0); // Estado para la tarjeta activa
  const [activeDocumentCard, setActiveDocumentCard] = useState<number | null>(null); // Estado para la tarjeta activa de documentos
  const [activeLivenessCard, setActiveLivenessCard] = useState<number | null>(null); // Estado para la tarjeta activa de liveness

  // Configuración compartida para tarjetas verticales (accordion cards / stacked cards)
  // Controla el redondeo de bordes: valores más altos = más redondeado (pastilla), valores más bajos = más cuadrado
  const VERTICAL_CARDS_BORDER_RADIUS = {
    active: 25,    // Border radius para tarjeta activa (en px)
    inactive: 16, // Border radius para tarjetas inactivas (en px)
  };
  
  // Resetear activeDocumentCard cuando cambia la pantalla
  useEffect(() => {
    if (currentScreen === "document_selection") {
      const availableDocs = Object.entries(documentTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type as DocumentType);
      if (availableDocs.length > 0) {
        const selectedIndex = selectedDocumentType 
          ? availableDocs.findIndex(doc => doc === selectedDocumentType)
          : 0;
        setActiveDocumentCard(selectedIndex >= 0 ? selectedIndex : 0);
      }
    } else {
      setActiveDocumentCard(null);
    }
  }, [currentScreen, documentTypes, selectedDocumentType]);

  // Resetear activeLivenessCard cuando cambia la pantalla
  useEffect(() => {
    if (currentScreen === "liveness_check") {
      const availableLiveness = Object.entries(livenessTypes)
        .filter(([type, enabled]) => enabled && (type === "selfie_photo" || type === "selfie_video"))
        .map(([type]) => type as "selfie_photo" | "selfie_video");
      if (availableLiveness.length > 0) {
        const selectedIndex = selectedLivenessType
          ? availableLiveness.findIndex(liveness => liveness === selectedLivenessType)
          : 0;
        setActiveLivenessCard(selectedIndex >= 0 ? selectedIndex : 0);
      }
    } else {
      setActiveLivenessCard(null);
    }
  }, [currentScreen, livenessTypes, selectedLivenessType]);
  
  useEffect(() => {
    // Add global styles for animations
    const styleId = 'workflow-glow-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.1;
            transform: scale(0.6);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.4);
          }
        }
        
        @keyframes halftonePulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes halftoneFade {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes captureFlash {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes faceIdScan {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        
        @keyframes faceIdPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @keyframes faceIdRing {
          0% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -628;
            opacity: 0.3;
          }
        }
        
        @keyframes rotate360 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes faceIdComplete {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes scanLine {
          0% {
            transform: translateY(-100%) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-20px) translateX(10px) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes faceIdRingPulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @keyframes faceIdVerticalScan {
          0% {
            transform: translateY(-100%) translateX(-50%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%) translateX(-50%);
            opacity: 0;
          }
        }
        
        @keyframes faceIdRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes faceIdLinePulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
            stroke-width: 1;
          }
          50% {
            opacity: 0.9;
            transform: scale(1.15);
            stroke-width: 2;
          }
        }
        
        @keyframes faceIdLineRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes faceIdDashRotate {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 40;
          }
        }
        
        @keyframes faceIdLineRotatePulse {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: rotate(180deg) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: rotate(360deg) scale(1);
            opacity: 0.3;
          }
        }
        
        @keyframes faceIdWaterRipple {
          0% {
            transform: scale(0.95);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.7;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.4;
          }
        }
        
        @keyframes faceIdWaterRipple2 {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.6;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
        
        @keyframes faceIdWaterRipple3 {
          0% {
            transform: scale(1.05);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.05);
            opacity: 0.25;
          }
        }
        
        @keyframes faceIdRotateAndRipple {
          0% {
            transform: rotate(0deg) scale(0.95);
            opacity: 0.4;
          }
          25% {
            transform: rotate(90deg) scale(1.1);
            opacity: 0.6;
          }
          50% {
            transform: rotate(180deg) scale(1.15);
            opacity: 0.7;
          }
          75% {
            transform: rotate(270deg) scale(1.1);
            opacity: 0.6;
          }
          100% {
            transform: rotate(360deg) scale(0.95);
            opacity: 0.4;
          }
        }
        
        @keyframes faceIdRotateAndRipple2 {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: rotate(-90deg) scale(1.15);
            opacity: 0.5;
          }
          50% {
            transform: rotate(-180deg) scale(1.2);
            opacity: 0.6;
          }
          75% {
            transform: rotate(-270deg) scale(1.15);
            opacity: 0.5;
          }
          100% {
            transform: rotate(-360deg) scale(1);
            opacity: 0.3;
          }
        }
        
        @keyframes faceIdRotateAndRipple3 {
          0% {
            transform: rotate(0deg) scale(1.05);
            opacity: 0.25;
          }
          25% {
            transform: rotate(90deg) scale(1.2);
            opacity: 0.4;
          }
          50% {
            transform: rotate(180deg) scale(1.25);
            opacity: 0.5;
          }
          75% {
            transform: rotate(270deg) scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: rotate(360deg) scale(1.05);
            opacity: 0.25;
          }
        }
        
        @keyframes circleFill {
          0% {
            clip-path: circle(0% at 50% 50%);
            opacity: 0.75;
          }
          100% {
            clip-path: circle(100% at 50% 50%);
            opacity: 0.75;
          }
        }
        
        @keyframes fadeInSlide {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes checkmarkAppear {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Reset capture step when entering document capture screen
  useEffect(() => {
    if (currentScreen === "document_capture") {
      setCaptureStep("front");
      setFrontCaptured(false);
      setBackCaptured(false);
    }
  }, [currentScreen]);

  // Reset camera when changing screen or when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (currentScreen !== "liveness_check" || !isFaceIdScanning) {
      if (cameraStream) {
        stopCamera();
      }
      // Reset animation states when leaving liveness check or stopping scan
      setIsCircleFilling(false);
      setShowCheckmark(false);
      setFaceIdProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, isFaceIdScanning]);

  // Video configuration when stream changes and video is available
  useEffect(() => {
    // Only configure video if we're on the liveness screen and scanning
    if (currentScreen !== "liveness_check" || !isFaceIdScanning) {
      return;
    }
    
    const video = videoRef.current;
    if (!video) {
      console.log('Video ref not available yet, waiting...');
      // Wait a bit and retry
      const timeout = setTimeout(() => {
        const retryVideo = videoRef.current;
        if (retryVideo && cameraStream) {
          console.log('Retrying to configure video after delay');
          retryVideo.srcObject = cameraStream;
          retryVideo.play().catch(console.error);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
    
    if (cameraStream) {
      // Verify that the stream is active and has active tracks
      const videoTracks = cameraStream.getVideoTracks();
      const activeTracks = videoTracks.filter(track => track.readyState === 'live');
      
      console.log('Setting video srcObject');
      console.log('Total tracks:', videoTracks.length);
      console.log('Active tracks:', activeTracks.length);
      console.log('Stream active:', cameraStream.active);
      
      if (activeTracks.length === 0) {
        console.warn('No active tracks in stream');
        // Check if the stream ended
        if (!cameraStream.active) {
          console.warn('Stream is not active, need to get a new one');
        }
        return;
      }
      
      // Clean any previous stream
      if (video.srcObject) {
        const oldStream = video.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => {
          if (track.readyState !== 'ended') {
            track.stop();
          }
        });
      }
      
      video.srcObject = cameraStream;
      
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded, attempting to play');
        video.play().catch(err => {
          console.error('Error playing video after loading metadata:', err);
        });
      };
      
      const handleCanPlay = () => {
        console.log('Video can play');
        video.play().catch(err => {
          console.error('Error playing on canplay:', err);
        });
      };
      
      const handlePlaying = () => {
        console.log('Video is now playing');
      };
      
      const handleError = (e: Event) => {
        console.error('Error in video element:', e);
      };
      
      const handleEnded = () => {
        console.warn('Video stream ended unexpectedly');
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('error', handleError);
      
      // Monitor track state
      activeTracks.forEach(track => {
        track.addEventListener('ended', handleEnded);
      });
      
      // Try to play immediately
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playing successfully');
          })
          .catch(err => {
            console.error('Error playing video immediately:', err);
            // Try again after a delay
            setTimeout(() => {
              if (video && video.srcObject) {
                video.play().catch(console.error);
              }
            }, 300);
          });
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('error', handleError);
        activeTracks.forEach(track => {
          track.removeEventListener('ended', handleEnded);
        });
      };
    } else {
      console.log('No camera stream, cleaning video');
      if (video) {
      video.srcObject = null;
    }
    }
  }, [cameraStream, currentScreen, isFaceIdScanning]);

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      if (captureStep === "front") {
        setFrontCaptured(true);
        setTimeout(() => {
          setCaptureStep("back");
        }, 500);
      } else {
        setBackCaptured(true);
        // After capturing both sides, show selfie check options
        setTimeout(() => {
          updateConfig({ currentScreen: "liveness_check" });
        }, 500);
      }
    }, 300);
  };

  // Request camera access
  const requestCameraAccess = async () => {
    try {
      setCameraError(null);
      
      // Stop any previous stream before requesting a new one
      if (cameraStream) {
        console.log('Stopping previous stream before requesting a new one');
        cameraStream.getTracks().forEach(track => {
          if (track.readyState !== 'ended') {
            track.stop();
          }
        });
        setCameraStream(null);
        // Wait a moment for the previous stream to clean up completely
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('Camera stream obtained:', stream);
      console.log('Stream active:', stream.active);
      console.log('Video tracks:', stream.getVideoTracks());
      
      // Verify that tracks are active
      stream.getVideoTracks().forEach(track => {
        console.log('Track state:', track.readyState, 'enabled:', track.enabled);
        console.log('Track ID:', track.id);
        console.log('Track label:', track.label);
        
        // Set up listeners to monitor track state
        track.onended = () => {
          console.warn('Video track ended unexpectedly - ID:', track.id);
        };
        
        track.onmute = () => {
          console.warn('Video track muted - ID:', track.id);
        };
        
        track.onunmute = () => {
          console.log('Video track unmuted - ID:', track.id);
        };
      });
      
      // Verify that the stream is actually active before setting it
      if (!stream.active) {
        console.error('The obtained stream is not active');
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Camera stream is not active');
      }
      
      const activeTracks = stream.getVideoTracks().filter(track => track.readyState === 'live');
      if (activeTracks.length === 0) {
        console.error('No active tracks in the obtained stream');
        stream.getTracks().forEach(track => track.stop());
        throw new Error('No active video tracks');
      }
      
      console.log('Stream verified correctly, setting in state');
      setCameraStream(stream);
      return true;
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setCameraError(error.message || 'Could not access camera');
      setCameraStream(null);
      return false;
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleSelfieCheck = async (type: "selfie_photo" | "selfie_video") => {
    updateConfig({ selectedLivenessType: type });
    
    // First set isFaceIdScanning so the video is in the DOM
    setIsFaceIdScanning(true);
    
    // Wait a moment for React to render the video in the DOM
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Request camera access
    const hasAccess = await requestCameraAccess();
    if (!hasAccess) {
      setIsFaceIdScanning(false);
      return;
    }
    
    // Wait a moment for the video to configure with the stream
    setTimeout(() => {
      startFaceIdScan();
    }, 300);
  };

  const startFaceIdScan = () => {
    setIsFaceIdScanning(true);
    setFaceIdProgress(0);
    setIsCircleFilling(false);
    setShowCheckmark(false);
    
    // Total duration: 5 seconds (5000ms) - similar to iPhone Face ID
    const duration = 5000;
    const interval = 50; // Update every 50ms for smooth animation
    const increment = 100 / (duration / interval); // Calculate increment to reach 100% in 5 seconds
    
    const progressInterval = setInterval(() => {
      setFaceIdProgress((prev) => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          
          // Capture photo from video when it reaches 100%
          if (videoRef.current && cameraStream) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = videoRef.current.videoWidth || 640;
              canvas.height = videoRef.current.videoHeight || 480;
              const ctx = canvas.getContext('2d');
              if (ctx && videoRef.current) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                // The captured photo is in the canvas (you can save it or process it here)
                console.log('Photo captured from Face ID scan');
              }
            } catch (error) {
              console.error('Error capturing photo:', error);
            }
          }
          
          // Stop camera and finish when progress reaches 100%
          setTimeout(() => {
            stopCamera();
            setIsFaceIdScanning(false);
            setIsCircleFilling(false);
            setShowCheckmark(false);
            updateConfig({ result: Math.random() > 0.3 ? "approved" : "rejected" });
            updateConfig({ currentScreen: "result" });
          }, 100);
          return 100;
        }
        return newProgress;
      });
    }, interval);
  };
  
  const currentBranding = branding.light;
  
  // Funciones helper para manipular colores (igual que en auth)
  const themeColor = currentBranding.customColorTheme || '#004492';
  
  // Inicializar animaciones CTA
  useCTAButtonAnimations(themeColor);
  
  const darkenColor = (color: string, amount: number = 0.3): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };
  
  const getAlmostBlackColor = (color: string): string => {
    return darkenColor(color, 0.7);
  };
  
  const lightenColor = (color: string, amount: number = 0.2): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };
  
  const darkThemeColor = darkenColor(themeColor, 0.3);
  const almostBlackColor = getAlmostBlackColor(themeColor);
  const blackColor = '#000000';

  const toggleViewMode = () => {
    updateConfig({ viewMode: viewMode === "mobile" ? "web" : "mobile" });
  };

  const navigateToScreen = (screen: ScreenStep) => {
    if (enabledScreens[screen]) {
      updateConfig({ currentScreen: screen });
    }
  };

  const getNextScreen = (): ScreenStep | null => {
    const screens: ScreenStep[] = ["welcome", "document_selection", "document_capture", "liveness_check", "result"];
    const currentIndex = screens.indexOf(currentScreen);
    if (currentIndex < screens.length - 1) {
      const nextScreen = screens[currentIndex + 1];
      if (enabledScreens[nextScreen]) {
        return nextScreen;
      }
    }
    return null;
  };

  const getPreviousScreen = (): ScreenStep | null => {
    const screens: ScreenStep[] = ["welcome", "document_selection", "document_capture", "liveness_check", "result"];
    const currentIndex = screens.indexOf(currentScreen);
    if (currentIndex > 0) {
      const prevScreen = screens[currentIndex - 1];
      if (enabledScreens[prevScreen]) {
        return prevScreen;
      }
    }
    return null;
  };

  const handleNext = () => {
    const next = getNextScreen();
    if (next) {
      navigateToScreen(next);
    }
  };

  const handlePrevious = () => {
    const prev = getPreviousScreen();
    if (prev) {
      navigateToScreen(prev);
    }
  };

  // Screen 1: Welcome
  const renderWelcomeScreen = () => {
    const { welcome } = previewTexts;
    
    // SVG geométrico (forma organica2.svg) adaptado al customColorTheme
    const GeometricSVG = () => {
      const lightThemeColor = lightenColor(themeColor, 0.3);
      const baseId = 'identity-welcome';
      
      return (
        <div className="flex justify-center py-2">
          <svg 
            id={`Capa_2_${baseId}`}
            data-name="Capa 2" 
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 215.02 215.02"
            className="h-48 w-48 opacity-80"
          >
            <defs>
              <linearGradient id={`identity-gradient-${baseId}`} x1="4.35" y1="612.77" x2="210.66" y2="612.77" gradientTransform="translate(0 720.29) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={lightThemeColor} />
                <stop offset="1" stopColor={darkThemeColor} />
              </linearGradient>
              <linearGradient id={`identity-gradient-2-${baseId}`} x1="5.57" y1="612.78" x2="209.46" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-3-${baseId}`} x1="20.99" y1="612.78" x2="194.05" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-4-${baseId}`} x1="0" y1="612.78" x2="215.02" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-5-${baseId}`} x1="17.91" y1="612.78" x2="197.11" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-6-${baseId}`} x1="7.41" y1="612.77" x2="207.62" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-7-${baseId}`} x1="2.97" y1="612.78" x2="212.04" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-8-${baseId}`} x1="26.88" y1="612.78" x2="188.15" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-9-${baseId}`} x1=".65" y1="612.78" x2="214.38" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-10-${baseId}`} x1="13.07" y1="612.77" x2="201.95" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-11-${baseId}`} x1="11.2" y1="612.78" x2="203.81" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-12-${baseId}`} x1="1.17" y1="612.78" x2="213.84" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-13-${baseId}`} x1="29.6" y1="612.77" x2="185.42" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-14-${baseId}`} x1="2.1" y1="612.77" x2="212.92" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-15-${baseId}`} x1="8.95" y1="612.78" x2="206.07" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-16-${baseId}`} x1="15.74" y1="612.78" x2="199.28" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-17-${baseId}`} x1=".19" y1="612.77" x2="214.85" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-18-${baseId}`} x1="23.44" y1="612.78" x2="191.59" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-19-${baseId}`} x1="5.57" y1="612.78" x2="209.46" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-20-${baseId}`} x1="20.99" y1="612.78" x2="194.05" y2="612.78" href={`#identity-gradient-${baseId}`} />
            </defs>
            <g id="object">
              <g>
                <path fill={`url(#identity-gradient-9-${baseId})`} d="M77.1,210.67l-.14-.25L4.35,77.11,137.91,4.37l.14.25,72.61,133.31-133.56,72.74h0ZM5.13,77.33l72.2,132.57,132.57-72.2L137.7,5.13S5.13,77.33,5.13,77.33Z" />
                <path fill={`url(#identity-gradient-${baseId})`} d="M141.77,209.45L5.57,141.77l.13-.25L73.26,5.58l136.2,67.68-.13.25-67.56,135.94h0ZM6.33,141.52l135.18,67.18,67.18-135.18L73.51,6.34,6.33,141.52h0Z" />
                <path fill={`url(#identity-gradient-2-${baseId})`} d="M43.66,194.05l-.04-.28L20.99,43.66l150.39-22.68.04.28,22.63,150.11-150.39,22.68h0ZM21.62,44.14l22.51,149.26,149.26-22.51-22.51-149.26L21.61,44.14h.01Z" />
                <path fill={`url(#identity-gradient-5-${baseId})`} d="M104.84,215.02l-.2-.21L0,104.83,110.18,0l.2.21,104.64,109.98-110.18,104.83h0ZM.8,104.86l104.05,109.36,109.36-104.05L110.16.81.8,104.86Z" />
                <path fill={`url(#identity-gradient-6-${baseId})`} d="M166.98,197.11l-149.07-30.13L48.04,17.91l149.07,30.13-30.13,149.07ZM18.58,166.55l147.96,29.9,29.9-147.96L48.48,18.59l-29.9,147.96Z" />
                <path fill={`url(#identity-gradient-3-${baseId})`} d="M68.23,207.63l-.11-.26L7.41,68.24,146.8,7.41l.11.26,60.71,139.13-139.39,60.83h0ZM8.15,68.53l60.37,138.35,138.35-60.37L146.5,8.16,8.15,68.53Z" />
                <path fill={`url(#identity-gradient-4-${baseId})`} d="M132.75,212.05l-.24-.15L2.97,132.75,82.26,2.97l.24.15,129.54,79.15-79.29,129.78h0ZM3.75,132.57l128.81,78.7,78.7-128.81L82.45,3.76,3.75,132.57Z" />
                <path fill={`url(#identity-gradient-7-${baseId})`} d="M36.36,188.15L26.88,36.36l151.79-9.48,9.48,151.79-151.79,9.48ZM27.47,36.89l9.41,150.66,150.66-9.41-9.41-150.66L27.47,36.89Z" />
                <path fill={`url(#identity-gradient-8-${baseId})`} d="M95.48,214.38l-.18-.22L.65,95.48l.22-.18L119.55.65l.18.22,94.65,118.68-.22.18-118.68,94.65h0ZM1.44,95.57l94.12,118.01,118.01-94.12L119.45,1.45,1.44,95.57h0Z" />
                <path fill={`url(#identity-gradient-11-${baseId})`} d="M158.95,201.96l-.27-.08L13.07,158.96l.08-.27L56.07,13.08l.27.08,145.61,42.92-.08.27-42.92,145.61h0ZM13.77,158.57l144.79,42.68,42.68-144.79L56.45,13.78,13.77,158.57h0Z" />
                <path fill={`url(#identity-gradient-12-${baseId})`} d="M59.65,203.82l-.09-.27L11.2,59.66l.27-.09L155.36,11.21l.09.27,48.36,143.89-.27.09-143.89,48.36h0ZM11.92,60.01l48.09,143.09,143.09-48.09L155.01,11.92,11.92,60.01Z" />
                <path fill={`url(#identity-gradient-13-${baseId})`} d="M123.54,213.85L1.17,123.55,91.47,1.18l122.37,90.3-90.3,122.37h0ZM1.96,123.43l121.46,89.63,89.63-121.46L91.59,1.97,1.96,123.43Z" />
                <path fill={`url(#identity-gradient-14-${baseId})`} d="M181.64,185.43l-152.04-3.78v-.28l3.78-151.76,152.04,3.78v.28l-3.78,151.76h0ZM30.18,181.09l150.91,3.75,3.75-150.91-150.91-3.75-3.75,150.91Z" />
                <path fill={`url(#identity-gradient-15-${baseId})`} d="M86.21,212.93L2.1,86.22,128.81,2.11l84.11,126.71-126.71,84.11ZM2.88,86.37l83.48,125.77,125.77-83.48L128.65,2.89,2.88,86.37Z" />
                <path fill={`url(#identity-gradient-16-${baseId})`} d="M150.52,206.08l-.26-.1L8.95,150.53,64.5,8.95l.26.1,141.31,55.45-55.55,141.58ZM9.68,150.21l140.52,55.14,55.14-140.52L64.82,9.69,9.68,150.21Z" />
                <path fill={`url(#identity-gradient-19-${baseId})`} d="M51.44,199.28l-.07-.28L15.74,51.44,163.58,15.74l.07.28,35.63,147.56-147.84,35.7ZM16.43,51.86l35.43,146.74,146.74-35.43L163.17,16.43S16.43,51.86,16.43,51.86Z" />
                <path fill={`url(#identity-gradient-17-${baseId})`} d="M114.22,214.85l-.21-.19L.19,114.22l.19-.21L100.82.19l.21.19,113.82,100.44-.19.21-100.44,113.82h0ZM.98,114.17l113.19,99.88,99.88-113.19L100.86.98.98,114.17h0Z" />
                <path fill={`url(#identity-gradient-18-${baseId})`} d="M174.57,191.59l-151.13-17.02.03-.28L40.46,23.44l151.13,17.02-.03.28-16.99,150.85ZM24.06,174.07l150,16.89,16.89-150L40.95,24.07l-16.89,150Z" />
                <path fill={`url(#identity-gradient-9-${baseId})`} d="M77.1,210.67l-.14-.25L4.35,77.11,137.91,4.37l.14.25,72.61,133.31-133.56,72.74h0ZM5.13,77.33l72.2,132.57,132.57-72.2L137.7,5.13S5.13,77.33,5.13,77.33Z" />
                <path fill={`url(#identity-gradient-${baseId})`} d="M141.77,209.45L5.57,141.77l.13-.25L73.26,5.58l136.2,67.68-.13.25-67.56,135.94h0ZM6.33,141.52l135.18,67.18,67.18-135.18L73.51,6.34,6.33,141.52h0Z" />
                <path fill={`url(#identity-gradient-2-${baseId})`} d="M43.66,194.05l-.04-.28L20.99,43.66l150.39-22.68.04.28,22.63,150.11-150.39,22.68h0ZM21.62,44.14l22.51,149.26,149.26-22.51-22.51-149.26L21.61,44.14h.01Z" />
              </g>
            </g>
          </svg>
        </div>
      );
    };
    
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header con back y logo */}
        <div className="relative mb-3 flex flex-shrink-0 items-center justify-between">
          <button className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            &lt; {previewTexts.navigation.back}
          </button>
          {currentBranding.logo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
            </div>
          )}
          <div className="w-12"></div> {/* Spacer para centrar el logo */}
        </div>

        {/* SVG Geométrico - Reemplazado por GIF Animado */}
        <div className="relative mb-0 flex-shrink-0 z-0 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt="Connecting Animation"
            className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Título y subtítulo */}
        <div className="relative z-10 text-center px-6 mb-6">
          <h2 className="mb-1 text-2xl font-bold leading-tight" style={{ color: themeColor }}>
            {welcome.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{welcome.subtitle}</p>
        </div>

        {/* Spacer para empujar el contenedor gris hacia abajo */}
        <div className="flex-1"></div>

        {/* Tarjeta con fondo gris translúcido en la parte inferior */}
        <div 
          className="relative z-10 overflow-hidden backdrop-blur-sm flex flex-col"
          style={{ 
            backgroundColor: 'rgba(197, 197, 197, 0.18)',
            padding: '15px 11px 8px 11px',
            margin: '0 10px 60px 10px',
            borderRadius: '20px',
          }}
        >
          <div className="flex flex-col">
            <div className="flex flex-col" style={{ minHeight: '190px' }}>
              {/* Tarjetas informativas horizontales con efecto acordeón - pegadas arriba */}
              <div className="relative flex items-center justify-center py-1 overflow-visible" style={{ marginTop: '0' }}>
                <div className="relative" style={{ width: '100%', height: '60px', maxWidth: '100%', overflow: 'visible', paddingLeft: '40px', paddingRight: '40px' }}>
                {welcome.checklist.map((item, index) => {
                  const isActive = activeWelcomeCard === index;
                  
                  // Dimensiones de las tarjetas
                    const activeCardWidth = 210;
                  const inactiveCardWidth = 55;
                  const visiblePart = 40; // Parte visible de las tarjetas inactivas (30px)
                  const overlapAmount = inactiveCardWidth - visiblePart; // 20px de superposición
                  
                  // Calcular posición según qué tarjeta está activa
                    // El contenedor tiene padding de 40px a cada lado para que las tarjetas parcialmente visibles no se corten
                    let leftOffset: number | string = 0;
                  
                  if (isActive) {
                      // La tarjeta activa se alinea según su posición:
                      if (activeWelcomeCard === 0) {
                        // Primera activa: alineada a la izquierda (respetando el padding)
                        leftOffset = 0;
                      } else if (activeWelcomeCard === 1) {
                        // Segunda activa: centrada
                        leftOffset = `calc((100% - ${activeCardWidth}px) / 2)`;
                      } else if (activeWelcomeCard === 2) {
                        // Tercera activa: alineada a la derecha (respetando el padding)
                        leftOffset = `calc(100% - ${activeCardWidth}px)`;
                      }
                  } else if (index < activeWelcomeCard) {
                    // Tarjetas a la izquierda de la activa - parcialmente visibles
                    const cardsBefore = activeWelcomeCard - index;
                      if (activeWelcomeCard === 1) {
                        // Segunda activa: las de la izquierda parcialmente visibles
                        // Calcular desde el centro hacia la izquierda
                        const centerX = `calc((100% - ${activeCardWidth}px) / 2)`;
                        leftOffset = `calc(${centerX} - ${inactiveCardWidth - visiblePart}px * ${cardsBefore})`;
                      } else if (activeWelcomeCard === 2) {
                        // Tercera activa: las de la izquierda parcialmente visibles
                        const rightX = `calc(100% - ${activeCardWidth}px)`;
                        leftOffset = `calc(${rightX} - ${inactiveCardWidth - visiblePart}px * ${cardsBefore})`;
                      }
                  } else {
                    // Tarjetas a la derecha de la activa - parcialmente visibles
                    const cardsAfter = index - activeWelcomeCard;
                      if (activeWelcomeCard === 0) {
                        // Primera activa: las de la derecha parcialmente visibles
                        if (cardsAfter === 1) {
                          leftOffset = activeCardWidth - visiblePart;
                        } else if (cardsAfter === 2) {
                          leftOffset = activeCardWidth + inactiveCardWidth - visiblePart * 2;
                        }
                      } else if (activeWelcomeCard === 1) {
                        // Segunda activa: las de la derecha parcialmente visibles
                        // Calcular desde el centro hacia la derecha, asegurando que el icono sea visible
                        const centerX = `calc((100% - ${activeCardWidth}px) / 2)`;
                        leftOffset = `calc(${centerX} + ${activeCardWidth}px - ${overlapAmount * cardsAfter}px)`;
                      }
                  }
                  
                  // Asegurar que las tarjetas inactivas sean visibles
                  // Si la primera está activa, las otras dos deben verse a la derecha
                  // Si la del centro está activa, las otras dos a los lados
                  // Si la última está activa, las otras dos a la izquierda
                  
                  // Z-index dinámico según qué tarjeta está activa:
                  // Caso 1: Tarjeta 0 activa -> 0 arriba, 1 medio, 2 abajo
                  // Caso 2: Tarjeta 1 activa -> 1 arriba, 0 y 2 abajo (mismo nivel)
                  // Caso 3: Tarjeta 2 activa -> 2 arriba, 1 medio, 0 abajo
                  let zIndex = 10;
                  if (isActive) {
                    zIndex = 30; // La activa siempre arriba
                  } else {
                    if (activeWelcomeCard === 0) {
                      // Caso 1: Tarjeta 0 activa
                      zIndex = 20 - index; // 0=30 (activa), 1=19, 2=18
                    } else if (activeWelcomeCard === 1) {
                      // Caso 2: Tarjeta 1 activa (centro)
                      zIndex = index === 0 || index === 2 ? 15 : 30; // 0 y 2 en capa 2, 1 arriba
                    } else if (activeWelcomeCard === 2) {
                      // Caso 3: Tarjeta 2 activa
                      zIndex = 20 + index; // 0=20, 1=21, 2=30 (activa)
                    }
                  }
                  
                  return (
                    <div
                      key={item.title}
                      onClick={() => setActiveWelcomeCard(index)}
                        className={`absolute top-0 flex cursor-pointer items-center gap-3 ${isActive
                          ? 'shadow-lg rounded-xl' 
                          : 'border border-stroke bg-gray-2 dark:border-dark-3 dark:bg-dark-2 rounded-xl'
                      }`}
                      style={{
                        ...(isActive 
                          ? { 
                              background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                              border: '2px solid white',
                            }
                          : { 
                              backgroundColor: '#9BA2AF', // Color gris para tarjetas inactivas
                              border: '2px solid white',
                            }
                        ),
                          left: typeof leftOffset === 'string' ? leftOffset : `${leftOffset}px`,
                        width: isActive ? `${activeCardWidth}px` : `${inactiveCardWidth}px`,
                          maxWidth: isActive ? `${activeCardWidth}px` : `${inactiveCardWidth}px`,
                        height: '55px',
                          paddingLeft: isActive ? '16px' : (index < activeWelcomeCard ? '0' : (index > activeWelcomeCard && activeWelcomeCard === 1 ? '0' : '0')),
                          paddingRight: isActive ? '16px' : (index > activeWelcomeCard && activeWelcomeCard === 1 ? '12px' : '0'),
                          minWidth: isActive ? `${activeCardWidth}px` : `${inactiveCardWidth}px`,
                          justifyContent: isActive ? 'flex-start' : (index > activeWelcomeCard && activeWelcomeCard === 1 ? 'flex-end' : (index < activeWelcomeCard ? 'center' : 'center')),
                        zIndex: zIndex,
                        borderRadius: '12px', // Esquinas curvas pero no tan redondeadas como rounded-full
                        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Transición más suave y fluida
                      }}
                    >
                        {/* Icono - siempre visible, centrado cuando inactiva, alineado a la derecha cuando está parcialmente visible a la derecha */}
                      <div 
                        className="flex shrink-0 items-center justify-center" 
                        style={{ 
                            width: isActive ? '32px' : 'auto',
                          height: '32px',
                            marginLeft: isActive ? '0' : (index > activeWelcomeCard && activeWelcomeCard === 1 ? 'auto' : '0'),
                            marginRight: index > activeWelcomeCard && activeWelcomeCard === 1 && !isActive ? '12px' : '0',
                        }}
                      >
                        {index === 0 && (
                          <svg className="h-5 w-5" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        {index === 1 && (
                          <svg className="h-5 w-5" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {index === 2 && (
                          <svg className="h-5 w-5" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      
                        {/* Texto - solo visible cuando está activa (en inactivas solo se ven los iconos) */}
                      <div 
                          className="flex-1 overflow-hidden"
                        style={{
                            opacity: isActive ? 1 : 0,
                            maxWidth: isActive ? '170px' : '0',
                          transition: isActive 
                            ? 'opacity 0.25s ease-out 0.7s, max-width 0s linear 0.7s'
                              : 'opacity 0.1s ease-in, max-width 0s linear 0.1s',
                            pointerEvents: isActive ? 'auto' : 'none',
                          whiteSpace: 'nowrap',
                            visibility: isActive ? 'visible' : 'hidden',
                        }}
                      >
                          <p className="text-[11px] font-bold leading-tight text-white">
                              {item.title}
                            </p>
                          <p className="mt-0.5 text-[9px] leading-tight text-white/90">
                              {item.description}
                            </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

              {/* Sección inferior con botón y texto - pegada al fondo */}
              <div className="flex flex-col" style={{ marginTop: 'auto', paddingTop: '8px', paddingBottom: '2px' }}>
                {/* Botón con gradiente - más estrecho con icono > */}
                <div className="flex justify-center">
            <button
              onClick={() => navigateToScreen("document_selection")}
                    className="group relative flex items-center justify-between overflow-hidden rounded-xl border px-4 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                borderColor: themeColor,
                boxShadow: `0 4px 14px 0 ${themeColor}40`,
                animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                width: 'auto',
                minWidth: '190px',
              }}
            >
              <span className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
              <span className="absolute inset-0 rounded-xl -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
              <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                    <span>{welcome.startButton}</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
            </button>
                </div>

                {/* Texto de términos debajo del botón */}
                <p className="text-center text-[9px] text-gray-600 dark:text-gray-400 px-2" style={{ marginTop: '4px', marginBottom: '0' }}>
                  {welcome.consent.prefix}
                  <span className="font-bold">{welcome.consent.privacyPolicy}</span>
                  {welcome.consent.connector}
                  <span className="font-bold">{welcome.consent.terms}</span>
                  {welcome.consent.suffix}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Screen 2: Document Selection
  const renderDocumentSelectionScreen = () => {
    const availableDocs = Object.entries(documentTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type as DocumentType);
    const { documentSelection } = previewTexts;
    
    // Inicializar activeDocumentCard si es null
    if (activeDocumentCard === null && availableDocs.length > 0) {
      const selectedIndex = selectedDocumentType 
        ? availableDocs.findIndex(doc => doc === selectedDocumentType)
        : 0;
      if (selectedIndex >= 0) {
        setActiveDocumentCard(selectedIndex);
      } else {
        setActiveDocumentCard(0);
      }
    }
    
    // SVG geométrico reutilizado para document selection (mismo tamaño que welcome)
    const GeometricSVG = () => {
      const lightThemeColor = lightenColor(themeColor, 0.3);
      const baseId = 'identity-document-selection';
      
      return (
        <div className="flex justify-center py-2">
          <svg 
            id={`Capa_2_${baseId}`}
            data-name="Capa 2" 
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 215.02 215.02"
            className="h-48 w-48 opacity-80"
          >
            <defs>
              <linearGradient id={`identity-gradient-${baseId}`} x1="4.35" y1="612.77" x2="210.66" y2="612.77" gradientTransform="translate(0 720.29) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={lightThemeColor} />
                <stop offset="1" stopColor={darkThemeColor} />
              </linearGradient>
              <linearGradient id={`identity-gradient-2-${baseId}`} x1="5.57" y1="612.78" x2="209.46" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-3-${baseId}`} x1="20.99" y1="612.78" x2="194.05" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-4-${baseId}`} x1="0" y1="612.78" x2="215.02" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-5-${baseId}`} x1="17.91" y1="612.78" x2="197.11" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-6-${baseId}`} x1="7.41" y1="612.77" x2="207.62" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-7-${baseId}`} x1="2.97" y1="612.78" x2="212.04" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-8-${baseId}`} x1="26.88" y1="612.78" x2="188.15" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-9-${baseId}`} x1=".65" y1="612.78" x2="214.38" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-10-${baseId}`} x1="13.07" y1="612.77" x2="201.95" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-11-${baseId}`} x1="11.2" y1="612.78" x2="203.81" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-12-${baseId}`} x1="1.17" y1="612.78" x2="213.84" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-13-${baseId}`} x1="29.6" y1="612.77" x2="185.42" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-14-${baseId}`} x1="2.1" y1="612.77" x2="212.92" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-15-${baseId}`} x1="8.95" y1="612.78" x2="206.07" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-16-${baseId}`} x1="15.74" y1="612.78" x2="199.28" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-17-${baseId}`} x1=".19" y1="612.77" x2="214.85" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-18-${baseId}`} x1="23.44" y1="612.78" x2="191.59" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-19-${baseId}`} x1="5.57" y1="612.78" x2="209.46" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-20-${baseId}`} x1="20.99" y1="612.78" x2="194.05" y2="612.78" href={`#identity-gradient-${baseId}`} />
            </defs>
            <g id="object">
              <g>
                <path fill={`url(#identity-gradient-9-${baseId})`} d="M77.1,210.67l-.14-.25L4.35,77.11,137.91,4.37l.14.25,72.61,133.31-133.56,72.74h0ZM5.13,77.33l72.2,132.57,132.57-72.2L137.7,5.13S5.13,77.33,5.13,77.33Z" />
                <path fill={`url(#identity-gradient-${baseId})`} d="M141.77,209.45L5.57,141.77l.13-.25L73.26,5.58l136.2,67.68-.13.25-67.56,135.94h0ZM6.33,141.52l135.18,67.18,67.18-135.18L73.51,6.34,6.33,141.52h0Z" />
                <path fill={`url(#identity-gradient-2-${baseId})`} d="M43.66,194.05l-.04-.28L20.99,43.66l150.39-22.68.04.28,22.63,150.11-150.39,22.68h0ZM21.62,44.14l22.51,149.26,149.26-22.51-22.51-149.26L21.61,44.14h.01Z" />
                <path fill={`url(#identity-gradient-5-${baseId})`} d="M104.84,215.02l-.2-.21L0,104.83,110.18,0l.2.21,104.64,109.98-110.18,104.83h0ZM.8,104.86l104.05,109.36,109.36-104.05L110.16.81.8,104.86Z" />
                <path fill={`url(#identity-gradient-6-${baseId})`} d="M166.98,197.11l-149.07-30.13L48.04,17.91l149.07,30.13-30.13,149.07ZM18.58,166.55l147.96,29.9,29.9-147.96L48.48,18.59l-29.9,147.96Z" />
                <path fill={`url(#identity-gradient-3-${baseId})`} d="M68.23,207.63l-.11-.26L7.41,68.24,146.8,7.41l.11.26,60.71,139.13-139.39,60.83h0ZM8.15,68.53l60.37,138.35,138.35-60.37L146.5,8.16,8.15,68.53Z" />
                <path fill={`url(#identity-gradient-4-${baseId})`} d="M132.75,212.05l-.24-.15L2.97,132.75,82.26,2.97l.24.15,129.54,79.15-79.29,129.78h0ZM3.75,132.57l128.81,78.7,78.7-128.81L82.45,3.76,3.75,132.57Z" />
                <path fill={`url(#identity-gradient-7-${baseId})`} d="M36.36,188.15L26.88,36.36l151.79-9.48,9.48,151.79-151.79,9.48ZM27.47,36.89l9.41,150.66,150.66-9.41-9.41-150.66L27.47,36.89Z" />
                <path fill={`url(#identity-gradient-8-${baseId})`} d="M95.48,214.38l-.18-.22L.65,95.48l.22-.18L119.55.65l.18.22,94.65,118.68-.22.18-118.68,94.65h0ZM1.44,95.57l94.12,118.01,118.01-94.12L119.45,1.45,1.44,95.57h0Z" />
                <path fill={`url(#identity-gradient-11-${baseId})`} d="M158.95,201.96l-.27-.08L13.07,158.96l.08-.27L56.07,13.08l.27.08,145.61,42.92-.08.27-42.92,145.61h0ZM13.77,158.57l144.79,42.68,42.68-144.79L56.45,13.78,13.77,158.57h0Z" />
                <path fill={`url(#identity-gradient-12-${baseId})`} d="M59.65,203.82l-.09-.27L11.2,59.66l.27-.09L155.36,11.21l.09.27,48.36,143.89-.27.09-143.89,48.36h0ZM11.92,60.01l48.09,143.09,143.09-48.09L155.01,11.92,11.92,60.01Z" />
                <path fill={`url(#identity-gradient-13-${baseId})`} d="M123.54,213.85L1.17,123.55,91.47,1.18l122.37,90.3-90.3,122.37h0ZM1.96,123.43l121.46,89.63,89.63-121.46L91.59,1.97,1.96,123.43Z" />
                <path fill={`url(#identity-gradient-14-${baseId})`} d="M181.64,185.43l-152.04-3.78v-.28l3.78-151.76,152.04,3.78v.28l-3.78,151.76h0ZM30.18,181.09l150.91,3.75,3.75-150.91-150.91-3.75-3.75,150.91Z" />
                <path fill={`url(#identity-gradient-15-${baseId})`} d="M86.21,212.93L2.1,86.22,128.81,2.11l84.11,126.71-126.71,84.11ZM2.88,86.37l83.48,125.77,125.77-83.48L128.65,2.89,2.88,86.37Z" />
                <path fill={`url(#identity-gradient-16-${baseId})`} d="M150.52,206.08l-.26-.1L8.95,150.53,64.5,8.95l.26.1,141.31,55.45-55.55,141.58ZM9.68,150.21l140.52,55.14,55.14-140.52L64.82,9.69,9.68,150.21Z" />
                <path fill={`url(#identity-gradient-19-${baseId})`} d="M51.44,199.28l-.07-.28L15.74,51.44,163.58,15.74l.07.28,35.63,147.56-147.84,35.7ZM16.43,51.86l35.43,146.74,146.74-35.43L163.17,16.43S16.43,51.86,16.43,51.86Z" />
                <path fill={`url(#identity-gradient-17-${baseId})`} d="M114.22,214.85l-.21-.19L.19,114.22l.19-.21L100.82.19l.21.19,113.82,100.44-.19.21-100.44,113.82h0ZM.98,114.17l113.19,99.88,99.88-113.19L100.86.98.98,114.17h0Z" />
                <path fill={`url(#identity-gradient-18-${baseId})`} d="M174.57,191.59l-151.13-17.02.03-.28L40.46,23.44l151.13,17.02-.03.28-16.99,150.85ZM24.06,174.07l150,16.89,16.89-150L40.95,24.07l-16.89,150Z" />
                <path fill={`url(#identity-gradient-9-${baseId})`} d="M77.1,210.67l-.14-.25L4.35,77.11,137.91,4.37l.14.25,72.61,133.31-133.56,72.74h0ZM5.13,77.33l72.2,132.57,132.57-72.2L137.7,5.13S5.13,77.33,5.13,77.33Z" />
                <path fill={`url(#identity-gradient-${baseId})`} d="M141.77,209.45L5.57,141.77l.13-.25L73.26,5.58l136.2,67.68-.13.25-67.56,135.94h0ZM6.33,141.52l135.18,67.18,67.18-135.18L73.51,6.34,6.33,141.52h0Z" />
                <path fill={`url(#identity-gradient-2-${baseId})`} d="M43.66,194.05l-.04-.28L20.99,43.66l150.39-22.68.04.28,22.63,150.11-150.39,22.68h0ZM21.62,44.14l22.51,149.26,149.26-22.51-22.51-149.26L21.61,44.14h.01Z" />
              </g>
            </g>
          </svg>
        </div>
      );
    };

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header con back y logo */}
        <div className="relative mb-3 flex flex-shrink-0 items-center justify-between">
          <button 
            onClick={() => navigateToScreen("welcome")}
            className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            &lt; {previewTexts.navigation.back}
          </button>
          {currentBranding.logo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
            </div>
          )}
          <div className="w-12"></div> {/* Spacer para centrar el logo */}
        </div>

        {/* SVG Geométrico - Reemplazado por GIF Animado */}
        <div className="relative -mb-16 flex-shrink-0 z-0 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt="Connecting Animation"
            className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Tarjeta con fondo blanco translúcido - rectangular vertical con bordes ligeramente redondeados */}
        <div 
          className="relative z-10 flex-1 overflow-hidden backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            padding: '10px',
            margin: '10px', // Padding con los bordes del celular
            borderRadius: '20px', // Bordes ligeramente redondeados (no en punta, pero rectangular)
          }}
        >
          <div className="space-y-3">
            {/* Título */}
            <div className="text-center">
              <h2 className="mb-1 text-xl font-bold" style={{ color: themeColor }}>
                {documentSelection.title}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{documentSelection.subtitle}</p>
            </div>

            {/* Tarjetas de documentos en vertical con efecto acordeón */}
            <div className="relative flex items-center justify-center py-2">
              <div className="relative w-full" style={{ height: `${Math.min(availableDocs.length * 75, 220)}px` }}>
                {availableDocs.map((docType, index) => {
                  const isActive = activeDocumentCard === index;
                  const currentActive = activeDocumentCard ?? 0;
                  
                  // Dimensiones de las tarjetas verticales
                  const activeCardHeight = 75;
                  const inactiveCardHeight = 60; // Aumentado para que se vea mejor el efecto de corte cuando está debajo

                  // Porcentajes de superposición individuales: controla cuánto cubre cada tarjeta sobre la que está inmediatamente debajo
                  // Ajusta estos valores para cambiar cuánto se ve de cada tarjeta inactiva (0.0 = sin superposición, 1.0 = completamente superpuesta)
                  const overlapPercentage1to2 = 0.3; // Cuánto cubre la tarjeta 1 sobre la 2 (cuando 1 está activa)
                  const overlapPercentage2to3 = 0.3; // Cuánto cubre la tarjeta 2 sobre la 3 (cuando 2 está activa)

                  // Usar la configuración compartida de borderRadius para tarjetas verticales
                  const borderRadiusActive = VERTICAL_CARDS_BORDER_RADIUS.active;
                  const borderRadiusInactive = VERTICAL_CARDS_BORDER_RADIUS.inactive;

                  // Determinar qué porcentaje usar según la posición
                  let overlapPercentage = 0.3; // Default
                  if (currentActive === 0 && index === 1) {
                    // Primera activa, segunda inactiva debajo
                    overlapPercentage = overlapPercentage1to2;
                  } else if (currentActive === 0 && index === 2) {
                    // Primera activa, tercera inactiva (usa el porcentaje de 1 a 2, pero ajustado)
                    overlapPercentage = overlapPercentage1to2 * 0.8; // Un poco menos para la tercera
                  } else if (currentActive === 1 && index === 2) {
                    // Segunda activa, tercera inactiva debajo
                    overlapPercentage = overlapPercentage2to3;
                  } else if (currentActive === 1 && index === 0) {
                    // Segunda activa, primera inactiva arriba (usa el porcentaje de 1 a 2)
                    overlapPercentage = overlapPercentage1to2;
                  } else {
                    // Otros casos: usar el porcentaje por defecto
                    overlapPercentage = 0.3;
                  }

                  const visiblePart = Math.round(inactiveCardHeight * (1 - overlapPercentage)); // Parte visible de la inactiva
                  const overlapAmount = inactiveCardHeight - visiblePart; // Cantidad de superposición
                  
                  // Calcular posición vertical
                  let topOffset = 0;
                  const containerHeight = Math.min(availableDocs.length * 75, 220);
                  let centerY = (containerHeight - activeCardHeight) / 2;
                  
                  // Cuando la primera tarjeta está activa y hay múltiples documentos, mover más arriba
                  if (currentActive === 0 && availableDocs.length > 1) {
                    centerY = (containerHeight - activeCardHeight) / 2 - 30; // Mover 30px hacia arriba
                  }
                  
                  if (isActive) {
                    // La tarjeta activa está centrada verticalmente (o más arriba si es la primera)
                    topOffset = centerY;
                  } else if (index < currentActive) {
                    // Tarjetas arriba de la activa - parcialmente visibles
                    const cardsAbove = currentActive - index;
                    topOffset = centerY - visiblePart * cardsAbove;
                  } else {
                    // Tarjetas abajo de la activa - parcialmente visibles
                    const cardsBelow = index - currentActive;
                    // Cuando la primera tarjeta está activa, asegurar que ambas de abajo sean visibles
                    if (currentActive === 0) {
                      // Primera activa (Licencia): controlar independientemente ambas tarjetas de abajo
                      if (cardsBelow === 1) {
                        // Cédula de identidad - posición basada en overlapPercentage1to2 (distancia desde Licencia)
                        const visiblePart1to2 = Math.round(inactiveCardHeight * (1 - overlapPercentage1to2));
                        const overlapAmount1to2 = inactiveCardHeight - visiblePart1to2;
                        topOffset = centerY + activeCardHeight - overlapAmount1to2;
                      } else if (cardsBelow === 2) {
                        // Pasaporte - posición basada en overlapPercentage2to3 (distancia desde Cédula)
                        // Primero calcular dónde está Cédula usando overlapPercentage1to2
                        const visiblePart1to2 = Math.round(inactiveCardHeight * (1 - overlapPercentage1to2));
                        const overlapAmount1to2 = inactiveCardHeight - visiblePart1to2;
                        const cedulaTop = centerY + activeCardHeight - overlapAmount1to2;
                        // Luego calcular dónde está Pasaporte usando overlapPercentage2to3 desde Cédula
                        const visiblePart2to3 = Math.round(inactiveCardHeight * (1 - overlapPercentage2to3));
                        const overlapAmount2to3 = inactiveCardHeight - visiblePart2to3;
                        topOffset = cedulaTop + inactiveCardHeight - overlapAmount2to3;
                      }
                    } else if (currentActive === 1) {
                      // Segunda activa: usar overlapPercentage2to3 para la tercera tarjeta
                      if (cardsBelow === 1 && index === 2) {
                        // Tercera tarjeta (index 2) - usar overlapPercentage2to3 directamente
                        const visiblePart2to3 = Math.round(inactiveCardHeight * (1 - overlapPercentage2to3));
                        const overlapAmount2to3 = inactiveCardHeight - visiblePart2to3;
                        topOffset = centerY + activeCardHeight - overlapAmount2to3;
                    } else {
                        topOffset = centerY + activeCardHeight - overlapAmount * cardsBelow;
                      }
                    } else {
                      // Otras activas: posición normal basada en overlapPercentage
                      topOffset = centerY + activeCardHeight - overlapAmount * cardsBelow;
                    }
                  }
                  
                  // Z-index dinámico según qué tarjeta está activa (similar a welcome pero vertical)
                  let zIndex = 10;
                  if (isActive) {
                    zIndex = 30; // La activa siempre arriba
                  } else {
                    if (currentActive === 0) {
                      // Caso 1: Primera tarjeta activa
                      zIndex = 20 - index; // 0=30 (activa), 1=19, 2=18
                    } else if (currentActive === 1) {
                      // Caso 2: Tarjeta del medio activa
                      zIndex = index === 0 || index === 2 ? 15 : 30; // 0 y 2 en capa 2, 1 arriba
                    } else if (currentActive === 2) {
                      // Caso 3: Última tarjeta activa
                      zIndex = 20 + index; // 0=20, 1=21, 2=30 (activa)
                    }
                  }
                  
                  return (
                    <div
                      key={docType}
                      onClick={() => {
                        setActiveDocumentCard(index);
                        updateConfig({ selectedDocumentType: docType });
                      }}
                      className={`absolute left-0 right-0 flex cursor-pointer items-center gap-3 rounded-xl transition-all duration-300 ease-in-out ${isActive
                          ? 'shadow-lg' 
                          : ''
                      }`}
                      style={{
                        ...(isActive 
                          ? { 
                              background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                              border: '2px solid white',
                            }
                          : { 
                              backgroundColor: '#9BA2AF', // Color gris para tarjetas inactivas
                              border: '2px solid white',
                            }
                        ),
                        top: `${topOffset}px`,
                        height: isActive ? `${activeCardHeight}px` : `${inactiveCardHeight}px`,
                        width: '100%', // Ambas tarjetas tienen el mismo ancho
                        paddingLeft: isActive ? '16px' : '0',
                        paddingRight: isActive ? '16px' : '0',
                        paddingTop: isActive ? '12px' : '0',
                        paddingBottom: isActive ? '12px' : '0',
                        justifyContent: isActive ? 'flex-start' : 'center',
                        zIndex: zIndex,
                        borderRadius: isActive ? `${borderRadiusActive}px` : `${borderRadiusInactive}px`, // Controlado por variables
                        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      }}
                    >
                      {/* Icono - siempre visible, centrado cuando inactiva */}
                      <div 
                        className="flex shrink-0 items-center justify-center" 
                        style={{ 
                          width: isActive ? '48px' : '60px', 
                          height: isActive ? '48px' : '60px',
                        }}
                      >
                        {docType === "drivers_license" && (
                          <svg className="h-6 w-6" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {docType === "id_card" && (
                          <svg className="h-6 w-6" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                        )}
                        {docType === "passport" && (
                          <svg className="h-6 w-6" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Texto - visible siempre, pero con diferentes estilos según estado */}
                      <div 
                        className="flex-1 overflow-hidden"
                        style={{
                          opacity: isActive ? 1 : 1,
                          maxHeight: isActive ? '100px' : 'none',
                          transition: isActive 
                            ? 'opacity 0.25s ease-out 0.7s, max-height 0s linear 0.7s'
                            : 'opacity 0.1s ease-in',
                          pointerEvents: 'auto',
                          visibility: 'visible',
                        }}
                      >
                        {isActive ? (
                          <>
                            <p className="text-sm font-bold leading-tight text-white">
                              {documentNames[country][docType]}
                            </p>
                            <p className="mt-1 text-xs leading-tight text-white/90">
                              {documentSelection.descriptions[docType]}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-medium leading-tight text-white">
                            {documentNames[country][docType]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botón Siguiente con gradiente y animaciones CTA */}
            <div className="flex justify-center">
            <button
              onClick={() => {
                if (selectedDocumentType) {
                  navigateToScreen("document_capture");
                }
              }}
              disabled={!selectedDocumentType}
              className="group relative flex items-center justify-between overflow-hidden rounded-xl border px-4 py-2.5 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedDocumentType
                  ? `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`
                  : '#9BA2AF',
                borderColor: selectedDocumentType ? themeColor : '#9BA2AF',
                boxShadow: selectedDocumentType ? `0 4px 14px 0 ${themeColor}40` : 'none',
                animation: selectedDocumentType ? 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite' : 'none',
                width: 'auto',
                minWidth: '200px',
              }}
            >
              {selectedDocumentType && (
                <>
                  <span className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                  <span className="absolute inset-0 rounded-xl -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
                </>
              )}
              <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: selectedDocumentType ? 'cta-glow-pulse 2s ease-in-out infinite' : 'none' }}>
                {previewTexts.navigation.next}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ animation: selectedDocumentType ? 'cta-bounce-arrow 1.2s ease-in-out infinite' : 'none' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
            </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Screen 3: Document Capture
  const renderDocumentCaptureScreen = () => {
    const { documentCapture } = previewTexts;

    // Construct title: "Capture [Document Type]"
    const docName = selectedDocumentType ? documentNames[country][selectedDocumentType] : documentCapture.fallbackTitle;

    const captureInstruction = captureStep === "front" ? documentCapture.instructions.front : documentCapture.instructions.back;
    const overlayTitle = captureStep === "front" ? documentCapture.overlayTitle.front : documentCapture.overlayTitle.back;

    // Helper to extract RGB from hex for gradient opacity
    const hexToRgb = (hex: string) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0'; // fail safe
    };

    // Convertir todos los colores del gradiente horizontal a RGB para el gradiente vertical
    const themeRgb = hexToRgb(themeColor);
    const darkThemeRgb = hexToRgb(darkThemeColor);
    const almostBlackRgb = hexToRgb(almostBlackColor);
    const blackRgb = '0, 0, 0'; // blackColor es '#000000'

    return (
      <div className="flex h-full flex-col relative overflow-hidden bg-white">
        {/* Header con back y logo centrado */}
        <div className="relative mb-3 flex flex-shrink-0 items-center justify-between z-20">
          <button
            onClick={() => navigateToScreen("document_selection")}
            className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            &lt; {previewTexts.navigation.back}
          </button>
          {currentBranding.logo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
            </div>
          )}
          <div className="w-12"></div> {/* Spacer para centrar el logo */}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative flex-1 flex flex-col w-full h-full z-10 px-6">

          {/* Indicador de progreso (solo cuando se captura la parte posterior) - FUERA del div con gradiente */}
          {captureStep === "back" && frontCaptured && (
            <div className="mb-4 flex items-center justify-center gap-2 relative z-20">
              <div className="relative flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <span className="text-xs font-medium text-gray-700">{documentCapture.capturedLabel}</span>
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: themeColor }}>
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Div con gradiente que envuelve título, área de captura e instrucciones */}
          {/* Gradiente vertical con misma intensidad que el horizontal: negro abajo, theme arriba, desvanece desde la mitad */}
          <div
            className="relative mx-auto w-full max-w-sm rounded-3xl px-6 py-8 mb-8"
            style={{
              background: `linear-gradient(to top, rgba(${blackRgb}, 1) 0%, rgba(${almostBlackRgb}, 1) 10%, rgba(${darkThemeRgb}, 1) 20%, rgba(${themeRgb}, 0.8) 30%, rgba(${themeRgb}, 0.4) 40%, transparent 50%, transparent 100%)`,
              minHeight: '400px',
            }}
          >
            {/* Título y subtítulo centrados con mismo ancho */}
            <div className="mb-8 text-center relative z-20">
              <div className="mx-auto" style={{ width: '100%', maxWidth: '320px' }}>
                <h2 className="mb-2 text-2xl leading-tight" style={{ color: themeColor }}>
                  <span className="font-normal">{documentCapture.titlePrefix}</span>{' '}
                  <span className="font-bold">{docName}</span>
          </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight" style={{ width: '100%' }}>
                  {captureInstruction}
                </p>
              </div>
        </div>

            {/* Área de captura con borde punteado */}
            <div className="relative mx-auto mb-6" style={{ width: '100%', maxWidth: '280px', height: '140px' }}>
              <div
                className="w-full h-full rounded-2xl border-2 border-dashed bg-white"
                style={{ borderColor: themeColor }}
              >
            {/* Flash effect when capturing */}
            {isCapturing && (
              <div 
                    className="absolute inset-0 z-20 bg-white rounded-2xl"
                style={{
                  animation: 'captureFlash 0.3s ease-out',
                }}
              />
            )}
            
            {/* Captured document simulation */}
            {(frontCaptured || backCaptured) && (
                  <div className="absolute inset-4 rounded-lg bg-white shadow-lg overflow-hidden">
                <div className="flex h-full flex-col p-3">
                      <div className="mb-2 h-1.5 w-12 rounded bg-gray-300"></div>
                      <div className="mb-3 h-1.5 w-16 rounded bg-gray-300"></div>
                      <div className="mb-1.5 h-0.5 w-full rounded bg-gray-200"></div>
                      <div className="mb-1.5 h-0.5 w-3/4 rounded bg-gray-200"></div>
                      <div className="mb-1.5 h-0.5 w-5/6 rounded bg-gray-200"></div>
                  <div className="mt-auto flex gap-2">
                        <div className="h-10 w-10 rounded bg-gray-200 flex-shrink-0"></div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="h-1.5 w-full rounded bg-gray-200"></div>
                          <div className="h-1.5 w-2/3 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

            {/* Texto de instrucciones (frente/reverso) */}
            <div className="text-center">
              <p className="text-base font-bold text-white mb-1">
                {overlayTitle}
              </p>
              <p className="text-xs text-white/90 leading-tight">
                {documentCapture.overlayHint}
              </p>
            </div>
          </div>
          {/* Fin del div con gradiente */}
        </div>
        {/* Fin del CONTENIDO PRINCIPAL */}
        
        {/* Botón de captura posicionado absolutamente sobre todo el contenido */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50 pb-4">
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="group relative flex items-center justify-center h-16 w-16 rounded-full transition-transform active:scale-95 shadow-lg hover:shadow-xl hover:scale-105"
            style={{
              background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
            }}
          >
            {/* Gradient Border Ring simulated with pseudo element or wrapper if needed,
                   but standard white border works well for "camera button" look */}
            <div className="absolute inset-0 rounded-full border-[4px] border-white/20"></div>

            {isCapturing ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V8C4 6.89543 4.89543 6 6 6H7.757L8.757 3.5H15.243L16.243 6H18C19.1046 6 20 6.89543 20 8V19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>

        {/* Flash Effect */}
        {isCapturing && (
          <div className="absolute inset-0 z-60 bg-white animate-[captureFlash_0.3s_ease-out]" />
        )}
      </div>
    );
  };

  // Screen 4: Liveness Check
  const renderLivenessCheckScreen = () => {
    // If scanning Face ID, show the animation
    const { liveness } = previewTexts;

    if (isFaceIdScanning && (selectedLivenessType === "selfie_photo" || selectedLivenessType === "selfie_video")) {
      const normalizedProgress = Math.min(Math.max(faceIdProgress, 0), 100);
      const progressStrokeWidth = 3;
      const viewBoxSize = 256;
      const perimeterProgressRadius = viewBoxSize / 2 - progressStrokeWidth / 2;
      const perimeterCircumference = 2 * Math.PI * perimeterProgressRadius;
      const perimeterOffset = perimeterCircumference * (1 - normalizedProgress / 100);

      // Helper to extract RGB from hex for gradient opacity (igual que en document_capture)
      const hexToRgb = (hex: string) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
      };

      // Convertir todos los colores del gradiente a RGB
      const themeRgb = hexToRgb(themeColor);
      const darkThemeRgb = hexToRgb(darkThemeColor);
      const almostBlackRgb = hexToRgb(almostBlackColor);
      const blackRgb = '0, 0, 0';

      return (
        <div className="flex h-full flex-col relative overflow-hidden bg-white" style={{ paddingBottom: '100px', paddingLeft: '10px', paddingRight: '10px' }}>
          {/* Header con logo */}
          <div className="relative mb-3 flex flex-shrink-0 items-center justify-between px-6 pt-6 z-20">
            {currentBranding.logo && (
              <div className="absolute left-1/2 -translate-x-1/2">
                <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
              </div>
            )}
            <div className="w-full"></div> {/* Spacer para centrar el logo */}
          </div>

          {/* Div con gradiente (mismo que captura de documento) */}
          <div
            className="relative mx-auto w-full max-w-sm rounded-3xl px-6 py-8 flex-1 flex flex-col"
            style={{
              background: `linear-gradient(to top, rgba(${blackRgb}, 1) 0%, rgba(${almostBlackRgb}, 1) 10%, rgba(${darkThemeRgb}, 1) 20%, rgba(${themeRgb}, 0.8) 30%, rgba(${themeRgb}, 0.4) 40%, transparent 50%, transparent 100%)`,
              minHeight: '500px',
            }}
          >
            {/* Título arriba del div - pegado a la parte superior */}
            <div className="text-center mb-6 mt-0">
              <h2 className="text-xl leading-tight" style={{ color: themeColor }}>
                {liveness.scanning.pendingTitle}
              </h2>
            </div>

            {/* Círculo de carga con animaciones - centrado */}
            <div className="relative flex-1 flex items-center justify-center">
              <div className="relative">
            {/* Container with decorative effects around the circle */}
                <div className="relative h-64 w-64 flex items-center justify-center">
              {/* Decorative rotating lines around the circle - Layer 1 (with water effect) */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 320 320"
                style={{
                  animation: 'faceIdRotateAndRipple 8s ease-in-out infinite',
                  transformOrigin: '50% 50%',
                }}
              >
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  strokeDasharray="4 8"
                  style={{
                        color: themeColor,
                    animation: 'faceIdDashRotate 3s linear infinite',
                  }}
                />
                <circle
                  cx="160"
                  cy="160"
                  r="150"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                  strokeDasharray="3 6"
                  style={{
                        color: themeColor,
                    animation: 'faceIdDashRotate 4s linear infinite reverse',
                  }}
                />
              </svg>
              
              {/* Decorative rotating lines - Layer 2 (opposite direction with water effect) */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 320 320"
                style={{
                  animation: 'faceIdRotateAndRipple2 12s ease-in-out infinite',
                  transformOrigin: '50% 50%',
                }}
              >
                <circle
                  cx="160"
                  cy="160"
                  r="145"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeOpacity="0.35"
                  strokeDasharray="5 10"
                  style={{
                        color: themeColor,
                    animation: 'faceIdDashRotate 5s linear infinite',
                  }}
                />
                <circle
                  cx="160"
                  cy="160"
                  r="130"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                  strokeDasharray="2 4"
                  style={{
                        color: themeColor,
                    animation: 'faceIdDashRotate 2.5s linear infinite reverse',
                  }}
                />
              </svg>
              
              {/* Decorative rotating lines - Layer 3 (pulsing with water effect) */}
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 320 320"
                style={{
                  animation: 'faceIdRotateAndRipple3 10s ease-in-out infinite',
                  transformOrigin: '50% 50%',
                }}
              >
                <circle
                  cx="160"
                  cy="160"
                  r="135"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeOpacity="0.25"
                  strokeDasharray="6 12"
                  style={{
                        color: themeColor,
                    animation: 'faceIdDashRotate 6s linear infinite',
                  }}
                />
              </svg>
              
              {/* Camera video inside the circle */}
                  <div className="relative h-52 w-52 overflow-hidden rounded-full shadow-2xl bg-gray-900 z-10">
                {/* Circular perimeter progress indicator */}
                <svg
                  className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                  viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                  fill="none"
                >
                  <circle
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={perimeterProgressRadius}
                        stroke={themeColor}
                    strokeWidth={progressStrokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={perimeterCircumference}
                    strokeDashoffset={perimeterOffset}
                    transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                    style={{ transition: "stroke-dashoffset 0.2s ease-out" }}
                  />
                </svg>
                
                
                {/* Video always present in the DOM */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                  className="w-full h-full object-cover"
                      style={{ 
                    transform: 'scaleX(-1)', // Horizontal mirror
                        display: 'block',
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: '#000',
                  }}
                />
                
                {/* Message overlay */}
                {!cameraStream && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                    <p className="text-white text-sm text-center px-4">{liveness.scanning.startingCamera}</p>
                  </div>
                )}
              
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                    <p className="text-red-400 text-sm text-center px-4">{cameraError}</p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sección inferior - en la parte oscura del gradiente */}
            <div className="flex flex-col mt-auto" style={{ paddingBottom: '16px' }}>
              {/* Textos en blanco */}
              <div className="text-center mb-4">
                <p className="text-sm text-white mb-1">
                  {liveness.scanning.progressLabelPending}
              </p>
                <p className="text-base font-bold text-white">
                  {liveness.scanning.verifyingTitle}
                </p>
              </div>

              {/* Barra de progreso horizontal - gris medio oscuro, se llena con blanco */}
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#4B5563' }}>
                  <div
                  className="h-full rounded-full transition-all duration-100 ease-out"
                  style={{
                    width: normalizedProgress + '%',
                    backgroundColor: '#FFFFFF',
                  }}
                  />
                </div>
            </div>
          </div>
        </div>
      );
    }

    // Filter only selfie check options
    const selfieOptions = Object.entries(livenessTypes)
      .filter(([type, enabled]) => enabled && (type === "selfie_photo" || type === "selfie_video"))
      .map(([type]) => type as "selfie_photo" | "selfie_video");

    // Inicializar activeLivenessCard si es null
    if (activeLivenessCard === null && selfieOptions.length > 0) {
      const selectedIndex = selectedLivenessType
        ? selfieOptions.findIndex(liveness => liveness === selectedLivenessType)
        : 0;
      if (selectedIndex >= 0) {
        setActiveLivenessCard(selectedIndex);
      } else {
        setActiveLivenessCard(0);
      }
    }

    // SVG geométrico reutilizado para liveness check
    const GeometricSVG = () => {
      const lightThemeColor = lightenColor(themeColor, 0.3);
      const baseId = 'identity-liveness-check';

    return (
        <div className="flex justify-center py-2">
          <svg
            id={`Capa_2_${baseId}`}
            data-name="Capa 2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 215.02 215.02"
            className="h-48 w-48 opacity-80"
          >
            <defs>
              <linearGradient id={`identity-gradient-${baseId}`} x1="4.35" y1="612.77" x2="210.66" y2="612.77" gradientTransform="translate(0 720.29) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor={lightThemeColor} />
                <stop offset="1" stopColor={darkThemeColor} />
              </linearGradient>
              <linearGradient id={`identity-gradient-2-${baseId}`} x1="5.57" y1="612.78" x2="209.46" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-3-${baseId}`} x1="20.99" y1="612.78" x2="194.05" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-4-${baseId}`} x1="0" y1="612.78" x2="215.02" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-5-${baseId}`} x1="17.91" y1="612.78" x2="197.11" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-6-${baseId}`} x1="7.41" y1="612.77" x2="207.62" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-7-${baseId}`} x1="2.97" y1="612.78" x2="212.04" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-8-${baseId}`} x1="26.88" y1="612.78" x2="188.15" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-9-${baseId}`} x1=".65" y1="612.78" x2="214.38" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-10-${baseId}`} x1="13.07" y1="612.77" x2="201.95" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-11-${baseId}`} x1="11.2" y1="612.78" x2="203.81" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-12-${baseId}`} x1="1.17" y1="612.78" x2="213.84" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-13-${baseId}`} x1="29.6" y1="612.77" x2="185.42" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-14-${baseId}`} x1="2.1" y1="612.77" x2="212.92" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-15-${baseId}`} x1="8.95" y1="612.78" x2="206.07" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-16-${baseId}`} x1="15.74" y1="612.78" x2="199.28" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-17-${baseId}`} x1=".19" y1="612.77" x2="214.85" y2="612.77" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-18-${baseId}`} x1="23.44" y1="612.78" x2="191.59" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-19-${baseId}`} x1="5.57" y1="612.78" x2="209.46" y2="612.78" href={`#identity-gradient-${baseId}`} />
              <linearGradient id={`identity-gradient-20-${baseId}`} x1="20.99" y1="612.78" x2="194.05" y2="612.78" href={`#identity-gradient-${baseId}`} />
            </defs>
            <g id="object">
              <g>
                <path fill={`url(#identity-gradient-9-${baseId})`} d="M77.1,210.67l-.14-.25L4.35,77.11,137.91,4.37l.14.25,72.61,133.31-133.56,72.74h0ZM5.13,77.33l72.2,132.57,132.57-72.2L137.7,5.13S5.13,77.33,5.13,77.33Z" />
                <path fill={`url(#identity-gradient-${baseId})`} d="M141.77,209.45L5.57,141.77l.13-.25L73.26,5.58l136.2,67.68-.13.25-67.56,135.94h0ZM6.33,141.52l135.18,67.18,67.18-135.18L73.51,6.34,6.33,141.52h0Z" />
                <path fill={`url(#identity-gradient-2-${baseId})`} d="M43.66,194.05l-.04-.28L20.99,43.66l150.39-22.68.04.28,22.63,150.11-150.39,22.68h0ZM21.62,44.14l22.51,149.26,149.26-22.51-22.51-149.26L21.61,44.14h.01Z" />
                <path fill={`url(#identity-gradient-5-${baseId})`} d="M104.84,215.02l-.2-.21L0,104.83,110.18,0l.2.21,104.64,109.98-110.18,104.83h0ZM.8,104.86l104.05,109.36,109.36-104.05L110.16.81.8,104.86Z" />
                <path fill={`url(#identity-gradient-6-${baseId})`} d="M166.98,197.11l-149.07-30.13L48.04,17.91l149.07,30.13-30.13,149.07ZM18.58,166.55l147.96,29.9,29.9-147.96L48.48,18.59l-29.9,147.96Z" />
                <path fill={`url(#identity-gradient-3-${baseId})`} d="M68.23,207.63l-.11-.26L7.41,68.24,146.8,7.41l.11.26,60.71,139.13-139.39,60.83h0ZM8.15,68.53l60.37,138.35,138.35-60.37L146.5,8.16,8.15,68.53Z" />
                <path fill={`url(#identity-gradient-4-${baseId})`} d="M132.75,212.05l-.24-.15L2.97,132.75,82.26,2.97l.24.15,129.54,79.15-79.29,129.78h0ZM3.75,132.57l128.81,78.7,78.7-128.81L82.45,3.76,3.75,132.57Z" />
                <path fill={`url(#identity-gradient-7-${baseId})`} d="M36.36,188.15L26.88,36.36l151.79-9.48,9.48,151.79-151.79,9.48ZM27.47,36.89l9.41,150.66,150.66-9.41-9.41-150.66L27.47,36.89Z" />
                <path fill={`url(#identity-gradient-8-${baseId})`} d="M95.48,214.38l-.18-.22L.65,95.48l.22-.18L119.55.65l.18.22,94.65,118.68-.22.18-118.68,94.65h0ZM1.44,95.57l94.12,118.01,118.01-94.12L119.45,1.45,1.44,95.57h0Z" />
                <path fill={`url(#identity-gradient-11-${baseId})`} d="M158.95,201.96l-.27-.08L13.07,158.96l.08-.27L56.07,13.08l.27.08,145.61,42.92-.08.27-42.92,145.61h0ZM13.77,158.57l144.79,42.68,42.68-144.79L56.45,13.78,13.77,158.57h0Z" />
                <path fill={`url(#identity-gradient-12-${baseId})`} d="M59.65,203.82l-.09-.27L11.2,59.66l.27-.09L155.36,11.21l.09.27,48.36,143.89-.27.09-143.89,48.36h0ZM11.92,60.01l48.09,143.09,143.09-48.09L155.01,11.92,11.92,60.01Z" />
                <path fill={`url(#identity-gradient-13-${baseId})`} d="M123.54,213.85L1.17,123.55,91.47,1.18l122.37,90.3-90.3,122.37h0ZM1.96,123.43l121.46,89.63,89.63-121.46L91.59,1.97,1.96,123.43Z" />
                <path fill={`url(#identity-gradient-14-${baseId})`} d="M181.64,185.43l-152.04-3.78v-.28l3.78-151.76,152.04,3.78v.28l-3.78,151.76h0ZM30.18,181.09l150.91,3.75,3.75-150.91-150.91-3.75-3.75,150.91Z" />
                <path fill={`url(#identity-gradient-15-${baseId})`} d="M86.21,212.93L2.1,86.22,128.81,2.11l84.11,126.71-126.71,84.11ZM2.88,86.37l83.48,125.77,125.77-83.48L128.65,2.89,2.88,86.37Z" />
                <path fill={`url(#identity-gradient-16-${baseId})`} d="M150.52,206.08l-.26-.1L8.95,150.53,64.5,8.95l.26.1,141.31,55.45-55.55,141.58ZM9.68,150.21l140.52,55.14,55.14-140.52L64.82,9.69,9.68,150.21Z" />
                <path fill={`url(#identity-gradient-19-${baseId})`} d="M51.44,199.28l-.07-.28L15.74,51.44,163.58,15.74l.07.28,35.63,147.56-147.84,35.7ZM16.43,51.86l35.43,146.74,146.74-35.43L163.17,16.43S16.43,51.86,16.43,51.86Z" />
                <path fill={`url(#identity-gradient-17-${baseId})`} d="M114.22,214.85l-.21-.19L.19,114.22l.19-.21L100.82.19l.21.19,113.82,100.44-.19.21-100.44,113.82h0ZM.98,114.17l113.19,99.88,99.88-113.19L100.86.98.98,114.17h0Z" />
                <path fill={`url(#identity-gradient-18-${baseId})`} d="M174.57,191.59l-151.13-17.02.03-.28L40.46,23.44l151.13,17.02-.03.28-16.99,150.85ZM24.06,174.07l150,16.89,16.89-150L40.95,24.07l-16.89,150Z" />
                <path fill={`url(#identity-gradient-9-${baseId})`} d="M77.1,210.67l-.14-.25L4.35,77.11,137.91,4.37l.14.25,72.61,133.31-133.56,72.74h0ZM5.13,77.33l72.2,132.57,132.57-72.2L137.7,5.13S5.13,77.33,5.13,77.33Z" />
                <path fill={`url(#identity-gradient-${baseId})`} d="M141.77,209.45L5.57,141.77l.13-.25L73.26,5.58l136.2,67.68-.13.25-67.56,135.94h0ZM6.33,141.52l135.18,67.18,67.18-135.18L73.51,6.34,6.33,141.52h0Z" />
                <path fill={`url(#identity-gradient-2-${baseId})`} d="M43.66,194.05l-.04-.28L20.99,43.66l150.39-22.68.04.28,22.63,150.11-150.39,22.68h0ZM21.62,44.14l22.51,149.26,149.26-22.51-22.51-149.26L21.61,44.14h.01Z" />
              </g>
            </g>
            </svg>
        </div>
      );
    };

    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header con back y logo */}
        <div className="relative mb-3 flex flex-shrink-0 items-center justify-between">
              <button
            onClick={() => navigateToScreen("document_capture")}
            className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            &lt; {previewTexts.navigation.back}
          </button>
          {currentBranding.logo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
            </div>
          )}
          <div className="w-12"></div> {/* Spacer para centrar el logo */}
        </div>

        {/* SVG Geométrico - Reemplazado por GIF Animado */}
        <div className="relative -mb-16 flex-shrink-0 z-0 flex justify-center">
          <img
            src="/gift/ANIMACION%201.gif"
            alt="Connecting Animation"
            className="h-48 w-48 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
          />
        </div>

        {/* Tarjeta con fondo blanco translúcido */}
        <div
          className="relative z-10 flex-1 overflow-hidden rounded-2xl p-5 backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
          }}
          data-tour-id="tour-identity-workflow-liveness-preview"
        >
          <div className="space-y-4">
            {/* Título */}
            <div className="text-center">
              <h2 className="mb-1 text-xl font-bold" style={{ color: themeColor }}>
                {liveness.title}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{liveness.subtitle}</p>
            </div>

            {/* Tarjetas de liveness en vertical con efecto acordeón */}
            <div className="relative flex items-center justify-center py-2">
              <div className="relative w-full" style={{ height: `${Math.min(selfieOptions.length * 75, 220)}px` }}>
                {selfieOptions.map((livenessType, index) => {
                  const isActive = activeLivenessCard === index;
                  const currentActive = activeLivenessCard ?? 0;

                  // Dimensiones de las tarjetas verticales
                  const activeCardHeight = 75;
                  const inactiveCardHeight = 60; // Aumentado para que se vea mejor el efecto de corte cuando está debajo

                  // Porcentaje de superposición: controla cuánto cubre la tarjeta activa sobre la inactiva (0.0 = sin superposición, 1.0 = completamente superpuesta)
                  // Ajusta este valor para cambiar cuánto se ve de la tarjeta inactiva debajo
                  const overlapPercentage = 0.3; // 42% de superposición (puedes cambiar este valor entre 0.0 y 1.0)

                  // Usar la configuración compartida de borderRadius para tarjetas verticales
                  const borderRadiusActive = VERTICAL_CARDS_BORDER_RADIUS.active;
                  const borderRadiusInactive = VERTICAL_CARDS_BORDER_RADIUS.inactive;

                  const visiblePart = Math.round(inactiveCardHeight * (1 - overlapPercentage)); // Parte visible de la inactiva
                  const overlapAmount = inactiveCardHeight - visiblePart; // Cantidad de superposición

                  // Calcular posición vertical (similar a document_selection)
                  let topOffset = 0;
                  const containerHeight = Math.min(selfieOptions.length * 75, 220);
                  let centerY = (containerHeight - activeCardHeight) / 2;

                  if (currentActive === 0) {
                    centerY = (containerHeight - activeCardHeight) / 2 - 30;
                  }

                  if (isActive) {
                    topOffset = centerY;
                  } else if (index < currentActive) {
                    const cardsAbove = currentActive - index;
                    topOffset = centerY - visiblePart * cardsAbove;
                  } else {
                    const cardsBelow = index - currentActive;
                    if (currentActive === 0) {
                      if (cardsBelow === 1) {
                        // La tarjeta inactiva debajo de la activa: posición basada en overlapPercentage
                        topOffset = centerY + activeCardHeight - overlapAmount;
                      }
                    } else {
                      topOffset = centerY + activeCardHeight - overlapAmount * cardsBelow;
                    }
                  }

                  // Z-index dinámico
                  let zIndex = 10;
                  if (isActive) {
                    zIndex = 30;
                  } else {
                    if (currentActive === 0) {
                      zIndex = 20 - index;
                    } else if (currentActive === 1) {
                      zIndex = index === 0 ? 15 : 30;
                    }
                  }

                  return (
                    <div
                      key={livenessType}
                      onClick={() => {
                        setActiveLivenessCard(index);
                        updateConfig({ selectedLivenessType: livenessType });
                      }}
                      className={`absolute left-0 right-0 flex cursor-pointer items-center gap-3 rounded-xl transition-all duration-300 ease-in-out ${isActive ? 'shadow-lg' : ''
                        }`}
                      style={{
                        ...(isActive
                          ? {
                            background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                            border: '2px solid white',
                          }
                          : {
                            backgroundColor: '#9BA2AF',
                            border: '2px solid white',
                          }
                        ),
                        top: `${topOffset}px`,
                        height: isActive ? `${activeCardHeight}px` : `${inactiveCardHeight}px`,
                        width: '100%', // Ambas tarjetas tienen el mismo ancho
                        paddingLeft: isActive ? '16px' : '12px',
                        paddingRight: isActive ? '16px' : '12px',
                        zIndex: zIndex,
                        borderRadius: isActive ? `${borderRadiusActive}px` : `${borderRadiusInactive}px`, // Controlado por variables
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      {/* Icono */}
                      <div
                        className="flex shrink-0 items-center justify-center"
                        style={{
                          width: isActive ? '32px' : '24px',
                          height: '32px',
                        }}
                      >
                    {livenessType === "selfie_photo" && (
                          <svg className="h-6 w-6" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {livenessType === "selfie_video" && (
                          <svg className="h-6 w-6" style={{ color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                      {/* Texto - visible siempre, pero con diferentes estilos según estado */}
                      <div
                        className="flex-1 overflow-hidden"
                        style={{
                          opacity: isActive ? 1 : 1,
                          visibility: 'visible',
                        }}
                      >
                        {isActive ? (
                          <>
                            <p className="text-sm font-bold leading-tight text-white">
                      {liveness.optionTitles[livenessType]}
                    </p>
                            <p className="mt-1 text-xs leading-tight text-white/90">
                      {liveness.optionDescriptions[livenessType]}
                    </p>
                          </>
                        ) : (
                          <p className="text-xs font-medium leading-tight text-white">
                            {liveness.optionTitles[livenessType]}
                          </p>
                  )}
                </div>
                    </div>
                  );
                })}
              </div>
            </div>
              
            {/* Botón Iniciar verificación con chevron */}
            {selectedLivenessType && (selectedLivenessType === "selfie_photo" || selectedLivenessType === "selfie_video") && !isFaceIdScanning && (
                <button
                onClick={() => {
                  if (selectedLivenessType === "selfie_photo" || selectedLivenessType === "selfie_video") {
                    handleSelfieCheck(selectedLivenessType);
                  }
                }}
                className="group relative w-full overflow-hidden rounded-xl border px-4 py-2.5 text-xs font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
                    borderColor: themeColor,
                    boxShadow: `0 4px 14px 0 ${themeColor}40`,
                    animation: 'cta-pulse-glow 2s ease-in-out infinite, cta-button-pulse 2.5s ease-in-out infinite',
                  }}
                >
                  <span className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10" style={{ background: themeColor, animation: 'cta-pulse-ring 2s ease-in-out infinite' }}></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -z-10" style={{ animation: 'cta-shine-sweep 2.5s linear infinite' }}></span>
                  <span className="absolute inset-0 rounded-xl -z-10" style={{ background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`, animation: 'cta-glow-pulse 2s ease-in-out infinite' }}></span>
                  <span className="relative z-10 flex items-center justify-center gap-2" style={{ animation: 'cta-glow-pulse 2s ease-in-out infinite' }}>
                    {liveness.startButton}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ animation: 'cta-bounce-arrow 1.2s ease-in-out infinite' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
                </button>
              )}
            </div>
        </div>
      </div>
    );
  };

  // Screen 5: Result
  const renderResultScreen = () => {
    const resultCopy = previewTexts.result;
    const isApproved = result === "approved";

    return (
      <div className="flex h-full flex-col relative overflow-hidden bg-white">
        {/* Header con back y logo */}
        <div className="relative mb-3 flex flex-shrink-0 items-center justify-between z-20">
          <button
            onClick={() => navigateToScreen("liveness_check")}
            className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            &lt; {previewTexts.navigation.back}
          </button>
          {currentBranding.logo && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <img src={currentBranding.logo} alt="Logo" className="h-8 max-w-full object-contain" />
            </div>
          )}
          <div className="w-12"></div> {/* Spacer para centrar el logo */}
        </div>

        {/* Card/div con gradiente (mismo que botón Siguiente >) */}
        <div
          className="relative rounded-3xl flex flex-col items-center justify-center"
          style={{
            background: `linear-gradient(to right, ${themeColor} 0%, ${darkThemeColor} 40%, ${almostBlackColor} 70%, ${blackColor} 100%)`,
            marginTop: '20px',
            marginLeft: '10px',
            marginRight: '10px',
            marginBottom: '80px',
            width: 'calc(100% - 20px)', // Ancho total menos los márgenes laterales (10px + 10px)
            height: 'calc(100% - 10px)', // Altura total menos el margen inferior
            boxSizing: 'border-box',
            padding: '40px 20px',
          }}
        >
          {/* Contenido centrado */}
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            {/* Icono: Visto (checkmark) o X */}
            {isApproved ? (
              <svg
                className="h-24 w-24"
                style={{ color: 'white' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  style={{ transform: 'rotate(-2deg)' }}
                />
              </svg>
            ) : (
              <svg
                className="h-24 w-24"
                style={{ color: 'white' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}

            {/* Título principal */}
          <h2
              className="text-3xl font-bold leading-tight"
              style={{ color: 'white' }}
          >
              {isApproved ? resultCopy.approvedTitle : resultCopy.rejectedTitle}
          </h2>

            {/* Subtítulo */}
            <div className="flex flex-col items-center space-y-2">
              <p
                className="text-base leading-relaxed"
                style={{ color: 'white', opacity: 0.9 }}
              >
                {isApproved ? resultCopy.approvedDescription : resultCopy.rejectedDescription}
              </p>
            </div>
        </div>
        </div>
      </div>
    );
  };

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return renderWelcomeScreen();
      case "document_selection":
        return renderDocumentSelectionScreen();
      case "document_capture":
        return renderDocumentCaptureScreen();
      case "liveness_check":
        return renderLivenessCheckScreen();
      case "result":
        return renderResultScreen();
      default:
        return renderWelcomeScreen();
    }
  };

  const previewContent = renderCurrentScreen();
  const isWebMode = viewMode === "web";

  if (viewMode === "mobile") {
    return (
      <div className="rounded-lg bg-transparent p-6 shadow-sm dark:bg-transparent" data-tour-id="tour-identity-workflow-preview">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark dark:text-white">{previewTexts.toggles.mobilePreview}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleViewMode}
              className="group rounded-full bg-gray-2 p-[5px] text-[#111928] outline-1 outline-primary focus-visible:outline dark:bg-dark-3 dark:text-current"
            >
              <span className="sr-only">
                {isWebMode ? previewTexts.toggles.switchToMobile : previewTexts.toggles.switchToWeb}
              </span>
              <span aria-hidden className="relative flex gap-2.5">
                <span className={cn(
                  "absolute h-[38px] w-[90px] rounded-full border border-gray-200 bg-white transition-all dark:border-none dark:bg-dark-2 dark:group-hover:bg-dark-3",
                  isWebMode && "translate-x-[100px]"
                )} />
                <span className="relative flex h-[38px] w-[90px] items-center justify-center gap-1.5 rounded-full">
                  <MobileIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{previewTexts.toggles.mobileLabel}</span>
                </span>
                <span className="relative flex h-[38px] w-[90px] items-center justify-center gap-1.5 rounded-full">
                  <WebIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{previewTexts.toggles.webLabel}</span>
                </span>
              </span>
            </button>
          </div>
        </div>
        <div className="relative -mx-6 w-[calc(100%+3rem)] py-12">
          {/* Interactive animated background with halftone dots and glow */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl" style={{ minHeight: '850px' }}>
            {/* Base gradient background */}
            <div 
              className="absolute inset-0 rounded-3xl"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 1) 50%, rgba(15, 23, 42, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 1) 50%, rgba(241, 245, 249, 0.95) 100%)',
              }}
            ></div>
            
            <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
            <EdgeFadeOverlay isDarkMode={isDarkMode} />
            
            {/* Additional animated halftone layer for depth */}
            <div 
              className="absolute inset-0 rounded-3xl mix-blend-overlay"
              style={{
                backgroundImage: isDarkMode
                  ? `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1.2px, transparent 0)`
                  : `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.12) 1.2px, transparent 0)`,
                backgroundSize: '28px 28px',
                opacity: 0.5,
                animation: 'halftonePulse 8s ease-in-out infinite',
              }}
            ></div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={handlePrevious}
            disabled={!getPreviousScreen()}
            className={cn(
              "absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-dark-2/90 dark:hover:bg-dark-2",
              !getPreviousScreen() && "pointer-events-none"
            )}
          >
            <svg className="h-6 w-6 text-dark dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            disabled={!getNextScreen()}
            className={cn(
              "absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-dark-2/90 dark:hover:bg-dark-2",
              !getNextScreen() && "pointer-events-none"
            )}
          >
            <svg className="h-6 w-6 text-dark dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="relative mx-auto max-w-[340px] z-10">
            <div className="relative overflow-hidden rounded-[3rem] border-[4px] border-gray-800/80 dark:border-gray-700/60 bg-gray-900/95 dark:bg-gray-800/95 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_20px_60px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="relative h-[680px] overflow-hidden rounded-[2.5rem] bg-white dark:bg-black m-0.5 flex flex-col">
                <div className="relative flex items-center justify-between bg-white dark:bg-black px-6 pt-10 pb-2 flex-shrink-0">
                  <div className="absolute left-6 top-4 flex items-center">
                    <span className="text-xs font-semibold text-black dark:text-white">9:41</span>
                  </div>
                  <div className="absolute left-1/2 top-3 -translate-x-1/2">
                    <div className="h-5 w-24 rounded-full bg-black dark:bg-white/20"></div>
                    <div className="absolute left-1/2 top-1/2 h-0.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800 dark:bg-white/30"></div>
                  </div>
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
                <div className="flex-1 min-h-0 bg-white dark:bg-black overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {previewContent}
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-shrink-0 z-[100]">
                  <div className="h-1 w-32 rounded-full bg-black/30 dark:bg-white/30"></div>
                </div>
              </div>
              <div className="absolute -left-1 top-24 h-12 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
              <div className="absolute -left-1 top-40 h-8 w-1 rounded-l bg-gray-800 dark:bg-gray-700"></div>
              <div className="absolute -right-1 top-32 h-10 w-1 rounded-r bg-gray-800 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-dark-2" data-tour-id="tour-identity-workflow-preview">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark dark:text-white">{previewTexts.toggles.webPreview}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleViewMode}
            className="group rounded-full bg-gray-2 p-[5px] text-[#111928] outline-1 outline-primary focus-visible:outline dark:bg-dark-3 dark:text-current"
          >
            <span className="sr-only">
              {isWebMode ? previewTexts.toggles.switchToMobile : previewTexts.toggles.switchToWeb}
            </span>
            <span aria-hidden className="relative flex gap-2.5">
              <span className={cn(
                "absolute h-[38px] w-[90px] rounded-full border border-gray-200 bg-white transition-all dark:border-none dark:bg-dark-2 dark:group-hover:bg-dark-3",
                isWebMode && "translate-x-[100px]"
              )} />
              <span className="relative flex h-[38px] w-[90px] items-center justify-center gap-1.5 rounded-full">
                <MobileIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{previewTexts.toggles.mobileLabel}</span>
              </span>
              <span className="relative flex h-[38px] w-[90px] items-center justify-center gap-1.5 rounded-full">
                <WebIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{previewTexts.toggles.webLabel}</span>
              </span>
            </span>
          </button>
        </div>
      </div>
      <div className="relative rounded-lg border border-stroke overflow-hidden p-8 dark:border-dark-3">
        {/* Background with halftone gradient and glow dots */}
        <div className="absolute inset-0 -z-10">
          {/* Base gradient background */}
          <div 
            className="absolute inset-0"
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 1) 50%, rgba(15, 23, 42, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 1) 50%, rgba(241, 245, 249, 0.95) 100%)',
            }}
          ></div>
          
          <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />
          <EdgeFadeOverlay isDarkMode={isDarkMode} />
        </div>

        {/* Navigation arrows */}
        <button
          onClick={handlePrevious}
          disabled={!getPreviousScreen()}
          className={cn(
            "absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-dark-2/90 dark:hover:bg-dark-2",
            !getPreviousScreen() && "pointer-events-none"
          )}
        >
          <svg className="h-6 w-6 text-dark dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={handleNext}
          disabled={!getNextScreen()}
          className={cn(
            "absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-dark-2/90 dark:hover:bg-dark-2",
            !getNextScreen() && "pointer-events-none"
          )}
        >
          <svg className="h-6 w-6 text-dark dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="relative mx-auto max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-dark-2 min-h-[600px]">
            {previewContent}
          </div>
        </div>
      </div>
    </div>
  );
}
