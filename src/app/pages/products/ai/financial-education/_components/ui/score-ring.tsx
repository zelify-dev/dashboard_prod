"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import zelifyLogoDark from "@/assets/logos/zelifyLogo_dark.svg";
import zelifyLogoLight from "@/assets/logos/zelifyLogo_ligth.svg";

interface ScoreRingProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
    secondaryProgress?: number;
}

export function ScoreRing({
    score,
    size = 200,
    strokeWidth = 10,
    label = "Your Zelify Score",
    secondaryProgress = 75,
}: ScoreRingProps) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const [animatedSecondary, setAnimatedSecondary] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        return () => observer.disconnect();
    }, []);

    // Color palette
    const blueDark = "#004492"; // Azul marino
    const blueMedium = "#3B82F6"; // Azul medio
    const grayLight = "#E5E7EB"; // Gris claro
    const greenSuccess = "#10B981"; // Verde brillante

    useEffect(() => {
        // Animate score on mount
        const duration = 1000;
        const steps = 60;
        const stepValue = score / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
                setAnimatedScore(Math.min(stepValue * currentStep, score));
            } else {
                clearInterval(interval);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [score]);

    useEffect(() => {
        // Animate secondary progress
        const duration = 800;
        const steps = 60;
        const stepValue = secondaryProgress / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
                setAnimatedSecondary(Math.min(stepValue * currentStep, secondaryProgress));
            } else {
                clearInterval(interval);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [secondaryProgress]);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    {/* Gradient for the progress ring */}
                    <linearGradient id={`score-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={blueDark} />
                        <stop offset="100%" stopColor={blueMedium} />
                    </linearGradient>
                </defs>
                {/* Background circle (light gray) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={grayLight}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle with gradient */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#score-gradient-${size})`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Central Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6" style={{ transform: 'translateY(-8px)' }}>
                {/* Zelify Logo */}
                <div className="mb-0 flex items-center justify-center">
                    <div className="relative h-8 w-20">
                        <Image
                            src={zelifyLogoLight}
                            fill
                            className="dark:hidden"
                            alt="Zelify logo"
                            role="presentation"
                            quality={100}
                        />
                        <Image
                            src={zelifyLogoDark}
                            fill
                            className="hidden dark:block"
                            alt="Zelify logo"
                            role="presentation"
                            quality={100}
                        />
                    </div>
                </div>

                {/* Main Score */}
                <div className="mb-1.5 flex items-baseline justify-center gap-0.5">
                    <span
                        className="text-6xl font-bold leading-none tracking-tight"
                        style={{ color: blueDark }}
                    >
                        {Math.round(animatedScore)}
                    </span>
                    <span
                        className="text-4xl font-bold leading-none"
                        style={{ color: blueDark }}
                    >
                        %
                    </span>
                </div>

                {/* Label */}
                {label && (
                    <div
                        className="mb-2 text-xs font-light tracking-wide"
                        style={{ color: `${blueDark}99` }}
                    >
                        {label}
                    </div>
                )}

                {/* Secondary Progress Bar - positioned inside the circle */}
                <div
                    className="h-1 w-24 overflow-hidden rounded-full"
                    style={{ backgroundColor: grayLight }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                            width: `${animatedSecondary}%`,
                            backgroundColor: greenSuccess,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
