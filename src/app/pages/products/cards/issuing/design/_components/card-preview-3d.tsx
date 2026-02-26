"use client";

import { CardDesignConfig } from "./card-editor";
import { useState, useRef, Suspense, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";
import { useLanguage } from "@/contexts/language-context";
import { cardsTranslations } from "../../../_components/cards-translations";

type CardPreview3DProps = {
  config: CardDesignConfig;
  isRotated: boolean;
  onRotate: () => void;
  rotationAngle?: number; // Ángulo de rotación personalizado en radianes (0 a Math.PI)
};

// Background color updater
function BackgroundColorUpdater({ color }: { color: string }) {
  const { gl } = useThree();
  useEffect(() => {
    const threeColor = new THREE.Color(color);
    gl.setClearColor(threeColor, 1);
  }, [color, gl]);
  return null;
}

// 3D Card Component
function Card3D({
  config,
  isRotated,
  backgroundColor,
  rotationAngle,
}: {
  config: CardDesignConfig;
  isRotated: boolean;
  backgroundColor: string;
  rotationAngle?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Create textures for front and back
  const [frontTexture, setFrontTexture] = useState<THREE.CanvasTexture | null>(
    null,
  );
  const [backTexture, setBackTexture] = useState<THREE.CanvasTexture | null>(
    null,
  );

  // Create front texture
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 856;
    canvas.height = 540;
    const ctx = canvas.getContext("2d")!;

    // Create rounded rectangle path function
    const radius = 50;
    const createRoundedRectPath = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height,
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Strategy: Fill entire canvas with background color, then draw rounded card on top
    // This ensures corners are always the background color

    // Step 1: Fill entire canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Step 2: Draw card background in rounded rectangle shape
    createRoundedRectPath(0, 0, canvas.width, canvas.height, radius);
    if (config.colorType === "solid") {
      ctx.fillStyle = config.solidColor;
      ctx.fill();
    } else {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const colors =
        config.gradientColors.length > 0
          ? config.gradientColors
          : ["#3B82F6", "#1E40AF"];
      colors.forEach((color, i) => {
        gradient.addColorStop(i / Math.max(colors.length - 1, 1), color);
      });
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Step 3: Now clip to rounded rectangle for card details
    ctx.save();
    createRoundedRectPath(0, 0, canvas.width, canvas.height, radius);
    ctx.clip();

    // Add card details (inside clipped rounded area)
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(50, 50, 120, 80); // Chip area

    // Cardholder name
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 36px Arial";
    ctx.fillText(config.cardholderName.toUpperCase(), 50, 450);

    ctx.restore();

    // Load and draw Visa/Mastercard logo
    const img = new Image();

    if (config.cardNetwork === "visa") {
      // Use the Visa logo image
      img.crossOrigin = "anonymous";
      img.src =
        "https://www.pngmart.com/files/22/Visa-Card-Logo-PNG-Isolated-Transparent-Picture.png";
    } else {
      // Mastercard logo - improved following official guide
      // Colores oficiales: Rojo #EB001B, Amarillo/Naranja #F79E1B, Intersección #FF5F00
      const svgData = `<svg width="128" height="80" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="#EB001B"/>
        <circle cx="22" cy="10" r="8" fill="#F79E1B"/>
        <path d="M16 6.5C17.2 7.6 18 9.2 18 11C18 12.8 17.2 14.4 16 15.5C14.8 14.4 14 12.8 14 11C14 9.2 14.8 7.6 16 6.5Z" fill="#FF5F00"/>
      </svg>`;
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }

    img.onload = () => {
      // Draw logo inside rounded rectangle area
      ctx.save();
      createRoundedRectPath(0, 0, canvas.width, canvas.height, radius);
      ctx.clip();

      // Draw logo in top right corner
      const logoWidth = 140;
      const logoHeight = (logoWidth * img.height) / img.width;
      const x = canvas.width - logoWidth - 40;
      const y = 40;

      // Draw logo
      if (config.cardNetwork === "visa") {
        // Invert colors for Visa logo to make it white
        ctx.filter = "brightness(0) invert(1)";
        ctx.drawImage(img, x, y, logoWidth, logoHeight);
        ctx.filter = "none";
      } else {
        // Draw Mastercard logo (SVG already has only circles, no text)
        ctx.drawImage(img, x, y, logoWidth, logoHeight);
      }

      ctx.restore();

      const newTexture = new THREE.CanvasTexture(canvas);
      newTexture.needsUpdate = true;
      newTexture.format = THREE.RGBAFormat;
      newTexture.premultiplyAlpha = false;
      setFrontTexture(newTexture);
    };

    img.onerror = () => {
      // Retry with different approach for Visa
      if (config.cardNetwork === "visa") {
        const retryImg = new Image();
        retryImg.crossOrigin = "anonymous";
        retryImg.src =
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/800px-Visa_Inc._logo.svg.png";
        retryImg.onload = () => {
          const logoWidth = 140;
          const logoHeight = (logoWidth * retryImg.height) / retryImg.width;
          const x = canvas.width - logoWidth - 40;
          const y = 40;
          ctx.save();
          ctx.filter = "brightness(0) invert(1)";
          ctx.drawImage(retryImg, x, y, logoWidth, logoHeight);
          ctx.restore();

          const newTexture = new THREE.CanvasTexture(canvas);
          newTexture.needsUpdate = true;
          setFrontTexture(newTexture);
        };
        retryImg.onerror = () => {
          // Final fallback: draw text logo
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.font = "bold 32px Arial";
          ctx.fillText("VISA", canvas.width - 150, 70);

          const newTexture = new THREE.CanvasTexture(canvas);
          newTexture.needsUpdate = true;
          setFrontTexture(newTexture);
        };
      } else {
        // Fallback: draw Mastercard logo as SVG (improved following official guide)
        // Colores oficiales: Rojo #EB001B, Amarillo/Naranja #F79E1B, Intersección #FF5F00
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = "anonymous";
        const svgData = `<svg width="128" height="80" viewBox="0 0 32 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="#EB001B"/>
          <circle cx="22" cy="10" r="8" fill="#F79E1B"/>
          <path d="M16 6.5C17.2 7.6 18 9.2 18 11C18 12.8 17.2 14.4 16 15.5C14.8 14.4 14 12.8 14 11C14 9.2 14.8 7.6 16 6.5Z" fill="#FF5F00"/>
        </svg>`;
        fallbackImg.src = "data:image/svg+xml;base64," + btoa(svgData);
        fallbackImg.onload = () => {
          ctx.save();
          createRoundedRectPath(0, 0, canvas.width, canvas.height, radius);
          ctx.clip();
          const logoWidth = 140;
          const logoHeight =
            (logoWidth * fallbackImg.height) / fallbackImg.width;
          const x = canvas.width - logoWidth - 40;
          const y = 40;
          ctx.drawImage(fallbackImg, x, y, logoWidth, logoHeight);
          ctx.restore();

          const newTexture = new THREE.CanvasTexture(canvas);
          newTexture.needsUpdate = true;
          setFrontTexture(newTexture);
        };
        fallbackImg.onerror = () => {
          // Final fallback: draw text logo
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.font = "bold 32px Arial";
          ctx.fillText("MC", canvas.width - 150, 70);

          const newTexture = new THREE.CanvasTexture(canvas);
          newTexture.needsUpdate = true;
          setFrontTexture(newTexture);
        };
      }
    };
  }, [
    config.colorType,
    config.solidColor,
    config.gradientColors,
    config.cardholderName,
    config.cardNetwork,
    backgroundColor,
  ]);

  // Create back texture (different design)
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 856;
    canvas.height = 540;
    const ctx = canvas.getContext("2d")!;

    // Create rounded rectangle path function
    const radius = 50;
    const createRoundedRectPath = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height,
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Strategy: Fill entire canvas with background color, then draw rounded card on top
    // This ensures corners are always the background color

    // Step 1: Fill entire canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Step 2: Draw card background in rounded rectangle shape
    createRoundedRectPath(0, 0, canvas.width, canvas.height, radius);
    if (config.colorType === "solid") {
      ctx.fillStyle = config.solidColor;
      ctx.fill();
    } else {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const colors =
        config.gradientColors.length > 0
          ? config.gradientColors
          : ["#3B82F6", "#1E40AF"];
      colors.forEach((color, i) => {
        gradient.addColorStop(i / Math.max(colors.length - 1, 1), color);
      });
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Step 3: Now clip to rounded rectangle for card details
    ctx.save();
    createRoundedRectPath(0, 0, canvas.width, canvas.height, radius);
    ctx.clip();

    // Add darker overlay for back
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Card number (at the top)
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 20px Arial";
    ctx.fillText("**** **** **** 1234", 50, 80);

    // Back card details - magnetic strip (moved higher)
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, canvas.height / 2 - 80, canvas.width, 60);

    // CVV area
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(canvas.width - 120, canvas.height - 100, 100, 50);

    // CVV number
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 18px Arial";
    ctx.fillText("123", canvas.width - 110, canvas.height - 70);

    // CVV label
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "10px Arial";
    ctx.fillText("CVV", canvas.width - 110, canvas.height - 85);

    // Signature area
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(50, canvas.height - 120, canvas.width - 200, 60);

    // Signature label
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "10px Arial";
    ctx.fillText("AUTHORIZED SIGNATURE", 60, canvas.height - 100);

    // Signature line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, canvas.height - 85);
    ctx.lineTo(canvas.width - 250, canvas.height - 85);
    ctx.stroke();

    ctx.restore();

    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.needsUpdate = true;
    newTexture.format = THREE.RGBAFormat;
    newTexture.premultiplyAlpha = false;
    setBackTexture(newTexture);
  }, [
    config.colorType,
    config.solidColor,
    config.gradientColors,
    backgroundColor,
  ]);

  useEffect(() => {
    // Materials are now separate for front and back, so we don't need to update them here
    // The rotation will handle which side is visible
  }, [frontTexture, backTexture, isRotated, config.finishType]);

  useFrame(() => {
    if (groupRef.current) {
      // Si hay un ángulo de rotación personalizado, usarlo; de lo contrario, usar la rotación completa
      const targetRotationY =
        rotationAngle !== undefined ? rotationAngle : isRotated ? Math.PI : 0;
      // Rotate the entire group (both faces) around Y axis
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotationY,
        0.1,
      );
    }
  });

  if (!frontTexture || !backTexture) {
    return null;
  }

  const cardWidth = 1.4;
  const cardHeight = 0.88;
  const cornerRadius = 50 / 856; // Convert pixel radius (50px) to 3D scale

  return (
    <group ref={groupRef}>
      {/* Front face */}
      <mesh
        ref={meshRef}
        scale={[cardWidth, cardHeight, 0.01]}
        position={[0, 0, 0.001]}
      >
        <boxGeometry args={[1, 1, 0.01]} />
        <meshStandardMaterial
          map={frontTexture}
          metalness={
            config.finishType === "metallic"
              ? 0.9
              : config.finishType === "embossed"
                ? 0.3
                : 0.1
          }
          roughness={
            config.finishType === "metallic"
              ? 0.1
              : config.finishType === "embossed"
                ? 0.4
                : 0.6
          }
          envMapIntensity={config.finishType === "metallic" ? 1.5 : 0.8}
        />
      </mesh>
      {/* Back face */}
      <mesh
        scale={[cardWidth, cardHeight, 0.01]}
        position={[0, 0, -0.001]}
        rotation={[0, Math.PI, 0]}
      >
        <boxGeometry args={[1, 1, 0.01]} />
        <meshStandardMaterial
          map={backTexture}
          metalness={
            config.finishType === "metallic"
              ? 0.9
              : config.finishType === "embossed"
                ? 0.3
                : 0.1
          }
          roughness={
            config.finishType === "metallic"
              ? 0.1
              : config.finishType === "embossed"
                ? 0.4
                : 0.6
          }
          envMapIntensity={config.finishType === "metallic" ? 1.5 : 0.8}
        />
      </mesh>
    </group>
  );
}

export function CardPreview3D({
  config,
  isRotated,
  onRotate,
  rotationAngle,
}: CardPreview3DProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const { language } = useLanguage();
  const t = cardsTranslations[language];

  // Match the background colors from the layout
  // In dark mode, use the same color as the container (dark-2: #1F2A37)
  const backgroundColor = isDarkMode ? "#1F2A37" : "#FFFFFF";

  return (
    <div className="relative flex w-full flex-col items-center gap-6">
      {/* Rotate Button */}
      <button
        onClick={onRotate}
        className="z-10 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-primary/90"
      >
        {isRotated ? t.issuing.editor.viewFront : t.issuing.editor.viewBack}
      </button>

      {/* 3D Canvas */}
      <div
        className="relative h-[500px] w-full rounded-lg"
        style={{ backgroundColor }}
        data-tour-id="tour-cards-preview"
      >
        <Canvas
          shadows
          gl={{
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: false,
          }}
          style={{ background: backgroundColor }}
        >
          <Suspense fallback={null}>
            <BackgroundColorUpdater color={backgroundColor} />
            <PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={45} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
            <directionalLight position={[-5, 3, -5]} intensity={0.4} />
            <pointLight position={[0, -5, 0]} intensity={0.3} />
            <Card3D
              config={config}
              isRotated={isRotated}
              backgroundColor={backgroundColor}
              rotationAngle={rotationAngle}
            />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={2.0}
              maxDistance={4.0}
              minPolarAngle={Math.PI / 2.5}
              maxPolarAngle={Math.PI / 1.6}
              minAzimuthAngle={-Math.PI / 4}
              maxAzimuthAngle={Math.PI / 4}
              autoRotate={false}
            />
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
