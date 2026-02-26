"use client";

import { useTour } from "@/contexts/tour-context";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUiTranslations } from "@/hooks/use-ui-translations";

export function TourOverlay() {
  const {
    isTourActive,
    isPaused,
    currentStep,
    steps,
    nextStep,
    previousStep,
    endTour,
    pauseTour,
    resumeTour,
  } = useTour();
  const translations = useUiTranslations();
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const resultsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  const updatePositionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const updatePositionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isTourActive || steps.length === 0) {
      setHighlightPosition(null);
      setTooltipPosition(null);
      return;
    }

    const currentStepData = steps[currentStep];
    if (!currentStepData) {
      setHighlightPosition(null);
      setTooltipPosition(null);
      return;
    }

    // Función para cerrar todos los modales abiertos
    const closeAllModals = () => {
      // Buscar todos los overlays de modales (generalmente tienen bg-black/50 y z-50 o z-[50])
      const allOverlays = document.querySelectorAll("div.fixed.inset-0");

      allOverlays.forEach((overlay) => {
        const overlayEl = overlay as HTMLElement;
        const zIndex = window.getComputedStyle(overlayEl).zIndex;
        const zIndexNum = parseInt(zIndex) || 0;

        // Verificar que no sea el overlay del tour (z-index >= 100)
        const isTourOverlay =
          zIndexNum >= 100 ||
          overlayEl.classList.contains("z-[100]") ||
          overlayEl.classList.contains("z-[110]") ||
          overlayEl.hasAttribute("data-tour-id") ||
          (currentStepData.target &&
            overlayEl.querySelector(
              `[data-tour-id="${currentStepData.target}"]`,
            ));

        // Solo procesar overlays que parecen modales (tienen bg-black y z-index < 100)
        const hasBlackBg =
          overlayEl.classList.contains("bg-black") ||
          overlayEl.classList.contains("bg-black/50") ||
          window
            .getComputedStyle(overlayEl)
            .backgroundColor.includes("rgba(0, 0, 0");

        if (!isTourOverlay && hasBlackBg && zIndexNum < 100) {
          // Buscar botones de cerrar dentro del modal
          const allButtons = overlayEl.querySelectorAll("button");

          for (let i = 0; i < allButtons.length; i++) {
            const btn = allButtons[i] as HTMLElement;
            const text = btn.textContent?.toLowerCase() || "";
            const ariaLabel =
              btn.getAttribute("aria-label")?.toLowerCase() || "";

            // Buscar botones de cerrar por texto, aria-label, o SVG de X
            const isCloseButton =
              text.includes("cancel") ||
              text.includes("cerrar") ||
              text.includes("close") ||
              ariaLabel.includes("close") ||
              ariaLabel.includes("cerrar") ||
              btn.querySelector('svg path[d*="M6 18"]') ||
              btn.querySelector('svg path[d*="M18 6"]');

            if (isCloseButton) {
              btn.click();
              break; // Solo cerrar el primer botón encontrado
            }
          }
        }
      });
    };

    // Cerrar modales antes de navegar
    closeAllModals();

    // Navegar si hay URL
    if (currentStepData.url) {
      router.push(currentStepData.url);
      // Cerrar modales después de la navegación también
      setTimeout(() => {
        closeAllModals();
      }, 100);
    }

    const findElement = (): HTMLElement | null => {
      // Para branding, intentar primero encontrar el elemento objetivo
      let element = document.querySelector(
        `[data-tour-id="${currentStepData.target}"]`,
      ) as HTMLElement;

      // Si no se encuentra y es branding-content, intentar con branding-section
      if (!element && currentStepData.target === "tour-branding-content") {
        element = document.querySelector(
          `[data-tour-id="tour-branding-section"]`,
        ) as HTMLElement;
      }

      // Para geolocalization-results, intentar encontrar el contenedor padre completo
      if (
        currentStepData.target === "tour-geolocalization-results" &&
        element
      ) {
        // Buscar el contenedor padre que tiene el fondo blanco y contiene tanto el formulario como los resultados
        const parentContainer = element.closest(
          ".rounded-lg.bg-white.dark\\:bg-dark-2, .rounded-lg.bg-white",
        );
        if (parentContainer) {
          return parentContainer as HTMLElement;
        }
      }

      // Para device-information-modal, el modal puede no estar en el DOM inicialmente
      // Intentar encontrarlo varias veces si no está disponible
      if (
        currentStepData.target === "tour-device-information-modal" &&
        !element
      ) {
        // El modal se renderiza condicionalmente, así que puede no estar disponible inmediatamente
        // Se manejará con el delay y los reintentos en el timeout
      }

      // Para identity-workflow-liveness-preview, el elemento puede no estar en el DOM inicialmente
      // porque necesita que currentScreen === "liveness_check"
      if (
        currentStepData.target === "tour-identity-workflow-liveness-preview" &&
        !element
      ) {
        // El elemento se renderiza condicionalmente cuando currentScreen === "liveness_check"
        // Se manejará con el delay y los reintentos en el timeout
      }

      return element;
    };

    // Usar ref para mantener una referencia estable
    const currentStepDataRef = { current: currentStepData };

    const updatePosition = () => {
      const stepData = currentStepDataRef.current;
      if (!stepData) return;

      const element = findElement();
      if (!element) {
        setHighlightPosition(null);
        setTooltipPosition(null);
        setTimeout(updatePosition, 100);
        return;
      }

      // Hacer scroll al elemento si es necesario (especialmente para resultados)
      if (stepData.target === "tour-geolocalization-results") {
        // Establecer posición inicial inmediatamente para que se vea algo
        const initialRect = element.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        const padding = 16;

        setHighlightPosition({
          top: initialRect.top - padding,
          left: initialRect.left - padding,
          width: initialRect.width + padding * 2,
          height: initialRect.height + padding * 2,
        });

        // Posicionar tooltip usando coordenadas de viewport (sin scroll) para que no se mueva
        const position = stepData.position || "left";
        let tooltipLeft = initialRect.left - 360; // Sin scrollX, coordenadas de viewport
        const tooltipWidth = 320;
        if (tooltipLeft < 10) {
          tooltipLeft = initialRect.right + 20;
        }
        if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
          tooltipLeft = window.innerWidth - tooltipWidth - 10;
        }
        // Usar coordenadas de viewport para el tooltip
        setTooltipPosition({
          top: initialRect.top + initialRect.height / 2 + 80,
          left: tooltipLeft,
        });

        // Luego hacer scroll y refinar la posición
        element.scrollIntoView({ behavior: "smooth", block: "start" });

        // Refinar posición después del scroll - actualizar constantemente
        // Limpiar intervalo anterior si existe
        if (resultsIntervalRef.current) {
          clearInterval(resultsIntervalRef.current);
        }

        resultsIntervalRef.current = setInterval(() => {
          const updatedElement = findElement();
          if (!updatedElement) {
            if (resultsIntervalRef.current) {
              clearInterval(resultsIntervalRef.current);
              resultsIntervalRef.current = null;
            }
            return;
          }

          const newRect = updatedElement.getBoundingClientRect();
          const newScrollY = window.scrollY;
          const newScrollX = window.scrollX;

          // Actualizar highlight con coordenadas de viewport
          setHighlightPosition({
            top: newRect.top - padding,
            left: newRect.left - padding,
            width: newRect.width + padding * 2,
            height: newRect.height + padding * 2,
          });

          // Actualizar tooltip con coordenadas de viewport (sin scroll)
          let refinedTooltipLeft = newRect.left - 360;
          if (refinedTooltipLeft < 10) {
            refinedTooltipLeft = newRect.right + 20;
          }
          if (refinedTooltipLeft + tooltipWidth > window.innerWidth - 10) {
            refinedTooltipLeft = window.innerWidth - tooltipWidth - 10;
          }

          setTooltipPosition({
            top: newRect.top + newRect.height / 2 + 80,
            left: refinedTooltipLeft,
          });
        }, 50); // Actualizar cada 50ms para seguir el scroll

        return; // Salir temprano, la actualización inicial ya se hizo
      }

      let elementRect = element.getBoundingClientRect();

      // Ajustar para cards-transactions (incluir toda la sección con título y tabla)
      if (stepData.target === "tour-cards-transactions") {
        // Buscar el contenedor padre que incluye tanto el título como la tabla
        const container = element.closest(
          '[data-tour-id="tour-cards-transactions"]',
        );
        if (container) {
          elementRect = container.getBoundingClientRect();
        }
      }

      // Ajustar para auth-product (incluir todo el dropdown)
      if (stepData.target === "tour-product-auth") {
        const parentLi = element.closest("li");
        if (parentLi) {
          const expandedUl = parentLi.querySelector("ul");
          if (expandedUl) {
            const parentRect = parentLi.getBoundingClientRect();
            const expandedRect = expandedUl.getBoundingClientRect();
            elementRect = {
              top: Math.min(parentRect.top, expandedRect.top),
              left: parentRect.left,
              right: Math.max(parentRect.right, expandedRect.right),
              bottom: Math.max(parentRect.bottom, expandedRect.bottom),
              width: Math.max(parentRect.width, expandedRect.width),
              height:
                expandedRect.bottom -
                Math.min(parentRect.top, expandedRect.top),
            } as DOMRect;
          }
        }
      }

      // Ajustar para branding-content
      if (stepData.target === "tour-branding-content") {
        const section = element.closest(
          '[data-tour-id="tour-branding-section"]',
        );
        if (section) {
          elementRect = section.getBoundingClientRect();
        }
      }

      // Agregar padding para otros elementos que lo necesiten
      let padding = 0;

      if (
        stepData.target === "tour-aml-validations-list" ||
        stepData.target === "tour-cards-transactions"
      ) {
        padding = 8;
      }

      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      setHighlightPosition({
        top: elementRect.top - padding,
        left: elementRect.left - padding,
        width: elementRect.width + padding * 2,
        height: elementRect.height + padding * 2,
      });

      // Recalcular posición del tooltip
      // Detectar si el elemento está en el sidebar
      const isInSidebar =
        element.closest("aside") !== null ||
        element.closest('[class*="sidebar"]') !== null ||
        element.closest('[data-tour-id="tour-sidebar"]') !== null ||
        element.closest('[class*="Sidebar"]') !== null;

      // Si está en el sidebar, forzar posición "right"
      let position = stepData.position || "bottom";
      if (isInSidebar) {
        position = "right";
      }

      let tooltipTop = 0;
      let tooltipLeft = 0;
      const tooltipWidth = 320; // w-80 = 320px
      const tooltipHeight = 200; // Altura aproximada del tooltip (incluyendo contenido y botones)

      // Lógica específica para cards-transactions (centrado absoluto)
      if (stepData.target === "tour-cards-transactions") {
        tooltipLeft =
          elementRect.left + elementRect.width / 2 - tooltipWidth / 2;
        tooltipTop =
          elementRect.top + elementRect.height / 2 - tooltipHeight / 2;

        // Asegurar que no se salga por los lados
        if (tooltipLeft < 20) {
          tooltipLeft = 20;
        } else if (tooltipLeft + tooltipWidth > window.innerWidth - 20) {
          tooltipLeft = window.innerWidth - tooltipWidth - 20;
        }
      } else if (position === "bottom") {
        // Centrar horizontalmente el tooltip
        tooltipLeft =
          elementRect.left + elementRect.width / 2 - tooltipWidth / 2;
        tooltipTop = elementRect.bottom + 10;

        // Ajuste específico para tour-cards-diligence-list (mover un poco a la derecha)
        if (stepData.target === "tour-cards-diligence-list") {
          tooltipLeft += 80;
        }

        // Verificar que no se salga por los lados
        if (tooltipLeft < 10) {
          tooltipLeft = 10;
        } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
          tooltipLeft = window.innerWidth - tooltipWidth - 10;
        }

        // Verificar si el tooltip se sale por abajo (NO aplicar para cards-transactions)
        if (stepData.target !== "tour-cards-transactions") {
          const tooltipBottom = tooltipTop + tooltipHeight;
          const viewportBottom = window.innerHeight;

          if (tooltipBottom > viewportBottom - 20) {
            // Si se sale por abajo, colocarlo arriba del elemento
            tooltipTop = elementRect.top - tooltipHeight - 10;

            // Si también se sale por arriba, centrarlo verticalmente al lado del elemento
            if (tooltipTop < 10) {
              tooltipTop =
                elementRect.top + elementRect.height / 2 - tooltipHeight / 2;
              // Colocarlo a la derecha del elemento
              tooltipLeft = elementRect.right + 20;

              // Si se sale por la derecha, colocarlo a la izquierda
              if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
                tooltipLeft = elementRect.left + scrollX - tooltipWidth - 20;
                // Si también se sale por la izquierda, centrarlo horizontalmente
                if (tooltipLeft < 10) {
                  tooltipLeft =
                    elementRect.left +
                    scrollX +
                    elementRect.width / 2 -
                    tooltipWidth / 2;
                  if (tooltipLeft < 10) {
                    tooltipLeft = 10;
                  } else if (
                    tooltipLeft + tooltipWidth >
                    window.innerWidth - 10
                  ) {
                    tooltipLeft = window.innerWidth - tooltipWidth - 10;
                  }
                }
              }
            }
          }
        }

        // Hacer scroll automático al elemento si está fuera de la vista
        const elementTop = elementRect.top + scrollY;
        const elementBottom = elementRect.bottom + scrollY;
        const viewportTop = scrollY;
        const viewportBottomForScroll = scrollY + window.innerHeight;

        if (
          elementTop < viewportTop ||
          elementBottom > viewportBottomForScroll
        ) {
          // Calcular la posición de scroll para centrar el elemento
          const scrollTo =
            elementTop - window.innerHeight / 2 + elementRect.height / 2;
          window.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: "smooth",
          });

          // Recalcular el tooltip después del scroll (el listener de scroll también lo hará, pero esto asegura que se haga después de un delay)
          setTimeout(() => {
            const newElementRect = element.getBoundingClientRect();
            const newScrollY = window.scrollY;
            const newScrollX = window.scrollX;

            // Recalcular posición del tooltip
            let newTooltipLeft =
              newElementRect.left + newElementRect.width / 2 - tooltipWidth / 2;
            let newTooltipTop = newElementRect.bottom + 10;

            // Verificar que no se salga por los lados
            if (newTooltipLeft < 10) {
              newTooltipLeft = 10;
            } else if (newTooltipLeft + tooltipWidth > window.innerWidth - 10) {
              newTooltipLeft = window.innerWidth - tooltipWidth - 10;
            }

            // Verificar si el tooltip se sale por abajo
            const newTooltipBottom = newTooltipTop + tooltipHeight;
            const newViewportBottom = newScrollY + window.innerHeight;

            if (newTooltipBottom > window.innerHeight - 20) {
              // Si se sale por abajo, colocarlo arriba del elemento
              newTooltipTop = newElementRect.top - tooltipHeight - 10;

              // Si también se sale por arriba, centrarlo verticalmente al lado del elemento
              if (newTooltipTop < 10) {
                newTooltipTop =
                  newElementRect.top +
                  newElementRect.height / 2 -
                  tooltipHeight / 2;
                // Colocarlo a la derecha del elemento
                newTooltipLeft = newElementRect.right + 20;

                // Si se sale por la derecha, colocarlo a la izquierda
                if (newTooltipLeft + tooltipWidth > window.innerWidth - 10) {
                  newTooltipLeft =
                    newElementRect.left + newScrollX - tooltipWidth - 20;
                  // Si también se sale por la izquierda, centrarlo horizontalmente
                  if (newTooltipLeft < 10) {
                    newTooltipLeft =
                      newElementRect.left +
                      newElementRect.width / 2 -
                      tooltipWidth / 2;
                    if (newTooltipLeft < 10) {
                      newTooltipLeft = 10;
                    } else if (
                      newTooltipLeft + tooltipWidth >
                      window.innerWidth - 10
                    ) {
                      newTooltipLeft = window.innerWidth - tooltipWidth - 10;
                    }
                  }
                }
              }
            }

            setTooltipPosition({ top: newTooltipTop, left: newTooltipLeft });
          }, 500); // Esperar 500ms para que el scroll smooth termine
        }
      } else if (position === "top") {
        tooltipTop = elementRect.top - tooltipHeight - 10;
        tooltipLeft =
          elementRect.left + elementRect.width / 2 - tooltipWidth / 2;

        // Verificar que no se salga por arriba
        if (tooltipTop < 10) {
          // Si se sale por arriba, colocarlo abajo del elemento
          tooltipTop = elementRect.bottom + 10;

          // Verificar que no se salga por abajo
          const tooltipBottom = tooltipTop + tooltipHeight;

          if (tooltipBottom > window.innerHeight - 20) {
            // Si también se sale por abajo, centrarlo verticalmente al lado del elemento
            tooltipTop =
              elementRect.top + elementRect.height / 2 - tooltipHeight / 2;
            // Colocarlo a la derecha del elemento
            tooltipLeft = elementRect.right + 20;

            // Si se sale por la derecha, colocarlo a la izquierda
            if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
              tooltipLeft = elementRect.left + scrollX - tooltipWidth - 20;
              // Si también se sale por la izquierda, centrarlo horizontalmente
              if (tooltipLeft < 10) {
                tooltipLeft =
                  elementRect.left +
                  scrollX +
                  elementRect.width / 2 -
                  tooltipWidth / 2;
                if (tooltipLeft < 10) {
                  tooltipLeft = 10;
                } else if (
                  tooltipLeft + tooltipWidth >
                  window.innerWidth - 10
                ) {
                  tooltipLeft = window.innerWidth - tooltipWidth - 10;
                }
              }
            }
          }
        }

        // Verificar que no se salga por los lados
        if (tooltipLeft < 10) {
          tooltipLeft = 10;
        } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
          tooltipLeft = window.innerWidth - tooltipWidth - 10;
        }

        // Hacer scroll automático al elemento si está fuera de la vista
        const elementTop = elementRect.top + scrollY;
        const elementBottom = elementRect.bottom + scrollY;
        const viewportTop = scrollY;
        const viewportBottomForScroll = scrollY + window.innerHeight;

        if (
          elementTop < viewportTop ||
          elementBottom > viewportBottomForScroll
        ) {
          // Calcular la posición de scroll para centrar el elemento
          const scrollTo =
            elementTop - window.innerHeight / 2 + elementRect.height / 2;
          window.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: "smooth",
          });

          // Recalcular el tooltip después del scroll
          setTimeout(() => {
            const newElementRect = element.getBoundingClientRect();
            const newScrollY = window.scrollY;
            const newScrollX = window.scrollX;

            // Recalcular posición del tooltip arriba del elemento
            let newTooltipTop = newElementRect.top - tooltipHeight - 10;
            let newTooltipLeft =
              newElementRect.left + newElementRect.width / 2 - tooltipWidth / 2;

            // Verificar que no se salga por arriba
            if (newTooltipTop < 10) {
              // Si se sale por arriba, colocarlo abajo del elemento
              newTooltipTop = newElementRect.bottom + 10;

              // Verificar que no se salga por abajo
              const newTooltipBottom = newTooltipTop + tooltipHeight;

              if (newTooltipBottom > window.innerHeight - 20) {
                // Si también se sale por abajo, centrarlo verticalmente al lado del elemento
                newTooltipTop =
                  newElementRect.top +
                  newElementRect.height / 2 -
                  tooltipHeight / 2;
                // Colocarlo a la derecha del elemento
                newTooltipLeft = newElementRect.right + 20;

                // Si se sale por la derecha, colocarlo a la izquierda
                if (newTooltipLeft + tooltipWidth > window.innerWidth - 10) {
                  newTooltipLeft =
                    newElementRect.left + newScrollX - tooltipWidth - 20;
                  // Si también se sale por la izquierda, centrarlo horizontalmente
                  if (newTooltipLeft < 10) {
                    newTooltipLeft =
                      newElementRect.left +
                      newElementRect.width / 2 -
                      tooltipWidth / 2;
                    if (newTooltipLeft < 10) {
                      newTooltipLeft = 10;
                    } else if (
                      newTooltipLeft + tooltipWidth >
                      window.innerWidth - 10
                    ) {
                      newTooltipLeft = window.innerWidth - tooltipWidth - 10;
                    }
                  }
                }
              }
            }

            // Verificar que no se salga por los lados
            if (newTooltipLeft < 10) {
              newTooltipLeft = 10;
            } else if (newTooltipLeft + tooltipWidth > window.innerWidth - 10) {
              newTooltipLeft = window.innerWidth - tooltipWidth - 10;
            }

            setTooltipPosition({ top: newTooltipTop, left: newTooltipLeft });
          }, 500); // Esperar 500ms para que el scroll smooth termine
        }
      } else if (position === "right") {
        tooltipTop = elementRect.top + elementRect.height / 2;
        tooltipLeft = elementRect.right + 20;
        // Asegurar que el tooltip no se salga de la pantalla
        if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
          // Si se sale por la derecha, colocarlo a la izquierda del elemento
          tooltipLeft = elementRect.left - tooltipWidth - 20;
          // Si también se sale por la izquierda, centrarlo debajo del elemento
          if (tooltipLeft < 10) {
            tooltipTop = elementRect.bottom + 10;
            tooltipLeft =
              elementRect.left + elementRect.width / 2 - tooltipWidth / 2;
            // Asegurar que no se salga por los lados
            if (tooltipLeft < 10) {
              tooltipLeft = 10;
            } else if (tooltipLeft + tooltipWidth > window.innerWidth - 10) {
              tooltipLeft = window.innerWidth - tooltipWidth - 10;
            }
          }
        }
      } else if (position === "left") {
        tooltipTop = elementRect.top + elementRect.height / 2;
        tooltipLeft = elementRect.left - 350;
        // Asegurar que el tooltip no se salga de la pantalla
        if (tooltipLeft < 10) {
          tooltipLeft = elementRect.right + 20;
        }
      } else {
        tooltipTop = elementRect.top + elementRect.height / 2;
        tooltipLeft = elementRect.left - 10;
      }

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
    };

    // Guardar la función en el ref para que esté disponible en otros efectos
    updatePositionRef.current = updatePosition;

    // Actualizar referencia
    currentStepDataRef.current = currentStepData;

    // Esperar un poco para que el DOM se actualice después de la navegación
    // Para branding, esperar más tiempo para que la sección se abra
    // Para geolocalization-results, esperar menos tiempo ya que establecemos posición inicial inmediatamente
    // Para device-information-modal, esperar más tiempo para que el modal se abra después del clic
    // Para identity-workflow-liveness-preview, esperar más tiempo para que se cambie la pantalla y se renderice
    // Para identity-workflow-config-liveness, esperar más tiempo para que la sección se abra
    const delay =
      currentStepData.target === "tour-branding-content" ||
      currentStepData.target === "tour-branding-section"
        ? 300
        : currentStepData.target === "tour-geolocalization-results"
          ? 200
          : currentStepData.target === "tour-device-information-modal"
            ? 1200
            : currentStepData.target ===
                "tour-identity-workflow-liveness-preview"
              ? 1000
              : currentStepData.target ===
                  "tour-identity-workflow-config-liveness"
                ? 400
                : currentStepData.target === "tour-cards-transactions"
                  ? 300
                  : currentStepData.target === "tour-cards-transactions-detail"
                    ? 1000
                    : 100;
    const timeoutId = setTimeout(() => {
      updatePosition();
      // Si es branding y no se encontró el elemento, intentar de nuevo después de un delay adicional
      if (
        (currentStepData.target === "tour-branding-content" ||
          currentStepData.target === "tour-branding-section") &&
        !document.querySelector(`[data-tour-id="${currentStepData.target}"]`)
      ) {
        setTimeout(() => {
          updatePosition();
        }, 200);
      }
      // Si es geolocalization-results y no se encontró el elemento, intentar de nuevo después de un delay adicional
      if (currentStepData.target === "tour-geolocalization-results") {
        const checkElement = () => {
          const element = document.querySelector(
            `[data-tour-id="tour-geolocalization-results"]`,
          );
          if (!element) {
            setTimeout(checkElement, 200);
          } else {
            updatePosition();
          }
        };
        if (
          !document.querySelector(
            `[data-tour-id="tour-geolocalization-results"]`,
          )
        ) {
          checkElement();
        }
      }
      // Si es identity-workflow-config-liveness y no se encontró el elemento, intentar de nuevo después de un delay adicional
      if (currentStepData.target === "tour-identity-workflow-config-liveness") {
        let attempts = 0;
        const maxAttempts = 15; // 15 intentos = 3 segundos
        const checkElement = () => {
          attempts++;
          const element = document.querySelector(
            `[data-tour-id="tour-identity-workflow-config-liveness"]`,
          );
          if (element) {
            updatePosition();
          } else if (attempts < maxAttempts) {
            setTimeout(checkElement, 200);
          }
        };
        if (
          !document.querySelector(
            `[data-tour-id="tour-identity-workflow-config-liveness"]`,
          )
        ) {
          setTimeout(checkElement, 200);
        }
      }
      // Retry logic for transactions table - optimizado para evitar congelamientos
      if (currentStepData.target === "tour-cards-transactions") {
        let attempts = 0;
        const maxAttempts = 5; // Reducido para evitar congelamientos
        const checkElement = () => {
          attempts++;
          const element = document.querySelector(
            `[data-tour-id="tour-cards-transactions"]`,
          );
          if (element) {
            // Usar requestAnimationFrame para evitar bloqueos
            requestAnimationFrame(() => {
              updatePosition();
            });
          } else if (attempts < maxAttempts) {
            setTimeout(checkElement, 300); // Aumentado el intervalo
          }
        };
        const element = document.querySelector(
          `[data-tour-id="tour-cards-transactions"]`,
        );
        if (!element) {
          setTimeout(checkElement, 300);
        }
      }
      // Si es identity-workflow-liveness-preview y no se encontró el elemento, intentar de nuevo después de un delay adicional
      if (
        currentStepData.target === "tour-identity-workflow-liveness-preview"
      ) {
        let attempts = 0;
        const maxAttempts = 25; // 25 intentos = 5 segundos
        const checkElement = () => {
          attempts++;
          const element = document.querySelector(
            `[data-tour-id="tour-identity-workflow-liveness-preview"]`,
          );
          if (element) {
            updatePosition();
          } else if (attempts < maxAttempts) {
            setTimeout(checkElement, 200);
          }
        };
        if (
          !document.querySelector(
            `[data-tour-id="tour-identity-workflow-liveness-preview"]`,
          )
        ) {
          setTimeout(checkElement, 200);
        }
      }
      // Si es connect-credentials y no se encontró el elemento, intentar de nuevo después de un delay adicional
      if (currentStepData.target === "tour-connect-credentials") {
        let attempts = 0;
        const maxAttempts = 20; // 20 intentos = 4 segundos
        const checkElement = () => {
          attempts++;
          const element = document.querySelector(
            `[data-tour-id="tour-connect-credentials"]`,
          );
          if (element) {
            updatePosition();
          } else if (attempts < maxAttempts) {
            setTimeout(checkElement, 200);
          }
        };
        if (
          !document.querySelector(`[data-tour-id="tour-connect-credentials"]`)
        ) {
          setTimeout(checkElement, 200);
        }
      }
      // Si es device-information-modal y no se encontró el elemento, intentar de nuevo después de un delay adicional
      if (currentStepData.target === "tour-device-information-modal") {
        let attempts = 0;
        const maxAttempts = 15; // 15 intentos = 4.5 segundos
        const checkModal = () => {
          const element = document.querySelector(
            `[data-tour-id="tour-device-information-modal"]`,
          );
          if (!element && attempts < maxAttempts) {
            attempts++;
            setTimeout(checkModal, 300);
          } else if (element) {
            updatePosition();
          }
        };
        if (
          !document.querySelector(
            `[data-tour-id="tour-device-information-modal"]`,
          )
        ) {
          checkModal();
        }
      }
    }, delay);

    // Agregar listeners para scroll y resize usando capture para detectar scroll en contenedores
    // Optimizar para evitar congelamientos, especialmente en cards
    let rafId: number | null = null;
    const handleScrollOrResize = () => {
      // Para cards-transactions, usar debounce más agresivo para evitar congelamientos
      const stepData = currentStepDataRef.current;
      if (stepData?.target === "tour-cards-transactions") {
        if (updatePositionDebounceRef.current) {
          clearTimeout(updatePositionDebounceRef.current);
        }
        updatePositionDebounceRef.current = setTimeout(() => {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
          rafId = requestAnimationFrame(() => {
            updatePosition();
            rafId = null;
          });
          updatePositionDebounceRef.current = null;
        }, 100); // Debounce de 100ms para cards
        return;
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        updatePosition();
        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScrollOrResize, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (updatePositionDebounceRef.current) {
        clearTimeout(updatePositionDebounceRef.current);
        updatePositionDebounceRef.current = null;
      }
      window.removeEventListener("scroll", handleScrollOrResize, {
        capture: true,
      } as any);
      window.removeEventListener("resize", handleScrollOrResize);
      // Limpiar intervalo de resultados si existe
      if (resultsIntervalRef.current) {
        clearInterval(resultsIntervalRef.current);
        resultsIntervalRef.current = null;
      }
      // Restaurar opacidad del elemento anterior si existe
      if (highlightedElementRef.current) {
        const element = highlightedElementRef.current;
        element.style.removeProperty("opacity");
        element.style.removeProperty("position");
        element.style.removeProperty("z-index");
        element.style.removeProperty("background-color");
        const allChildren = element.querySelectorAll("*");
        allChildren.forEach((child) => {
          const childEl = child as HTMLElement;
          childEl.style.removeProperty("opacity");
          childEl.style.removeProperty("position");
          childEl.style.removeProperty("z-index");
          childEl.style.removeProperty("background-color");
        });
        highlightedElementRef.current = null;
      }
    };
  }, [isTourActive, currentStep, steps, nextStep, endTour, router]);

  // Efecto para eliminar opacidad de elementos dentro del área destacada
  useEffect(() => {
    if (!isTourActive || !highlightPosition || steps.length === 0) {
      // Restaurar opacidad si el tour no está activo
      if (highlightedElementRef.current) {
        const element = highlightedElementRef.current;
        element.style.removeProperty("opacity");
        element.style.removeProperty("position");
        element.style.removeProperty("z-index");
        element.style.removeProperty("background-color");
        let currentElement: HTMLElement | null = element;
        while (currentElement && currentElement !== document.body) {
          currentElement.style.removeProperty("opacity");
          currentElement = currentElement.parentElement;
        }
        const allChildren = element.querySelectorAll("*");
        allChildren.forEach((child) => {
          const childEl = child as HTMLElement;
          childEl.style.removeProperty("opacity");
          childEl.style.removeProperty("position");
          childEl.style.removeProperty("z-index");
          childEl.style.removeProperty("background-color");
        });
        highlightedElementRef.current = null;
      }
      return;
    }

    const currentStepData = steps[currentStep];
    if (!currentStepData) return;

    // Verificar si este elemento necesita visibilidad completa
    const isAML =
      currentStepData.target === "tour-product-aml" ||
      currentStepData.target === "tour-aml-validation-global-list" ||
      currentStepData.target === "tour-aml-preview" ||
      currentStepData.target === "tour-aml-validations-list" ||
      currentStepData.target === "tour-aml-list-config";
    const isIdentity =
      currentStepData.target === "tour-product-identity" ||
      currentStepData.target === "tour-identity-workflow" ||
      currentStepData.target === "tour-identity-new-workflow-button" ||
      currentStepData.target === "tour-identity-workflow-preview" ||
      currentStepData.target === "tour-identity-workflow-config-country" ||
      currentStepData.target === "tour-identity-workflow-config-documents" ||
      currentStepData.target === "tour-identity-workflow-config-liveness" ||
      currentStepData.target === "tour-identity-workflow-liveness-preview";
    const isConnect =
      currentStepData.target === "tour-product-connect" ||
      currentStepData.target === "tour-connect-bank-account-linking" ||
      currentStepData.target === "tour-connect-config" ||
      currentStepData.target === "tour-connect-preview" ||
      currentStepData.target === "tour-connect-credentials" ||
      currentStepData.target === "tour-connect-wallet";
    const isCards =
      currentStepData.target === "tour-product-cards" ||
      currentStepData.target === "tour-cards-config-branding" ||
      currentStepData.target === "tour-cards-preview-main" ||
      currentStepData.target === "tour-cards-issuing-design" ||
      currentStepData.target === "tour-cards-create-design" ||
      currentStepData.target === "tour-cards-design-editor" ||
      currentStepData.target === "tour-cards-preview" ||
      currentStepData.target === "tour-cards-transactions" ||
      currentStepData.target === "tour-cards-diligence-list";
    const isTransfers =
      currentStepData.target === "tour-product-transfers" ||
      currentStepData.target === "tour-transfers-config" ||
      currentStepData.target === "tour-transfers-region-panel" ||
      currentStepData.target === "tour-transfers-preview";
    const isPayments =
      currentStepData.target === "tour-product-payments" ||
      currentStepData.target === "tour-payments-basic-services" ||
      currentStepData.target === "tour-transfers-config" ||
      currentStepData.target === "tour-transfers-region-panel" ||
      currentStepData.target === "tour-transfers-preview" ||
      currentStepData.target === "tour-payments-custom-keys" ||
      currentStepData.target === "tour-payments-custom-keys-config" ||
      currentStepData.target === "tour-payments-custom-keys-preview" ||
      currentStepData.target === "tour-payments-qr" ||
      currentStepData.target === "tour-payments-qr-config" ||
      currentStepData.target === "tour-payments-qr-preview";
    const isTx =
      currentStepData.target === "tour-product-tx" ||
      currentStepData.target === "tour-tx-international-transfers" ||
      currentStepData.target === "tour-tx-config" ||
      currentStepData.target === "tour-tx-preview";
    const isAI =
      currentStepData.target === "tour-product-ai" ||
      currentStepData.target === "tour-ai-alaiza" ||
      currentStepData.target === "tour-ai-alaiza-config" ||
      currentStepData.target === "tour-ai-alaiza-preview" ||
      currentStepData.target === "tour-ai-behavior-analysis" ||
      currentStepData.target === "tour-behavior-categories" ||
      currentStepData.target === "tour-behavior-preview" ||
      currentStepData.target === "tour-ai-financial-education" ||
      currentStepData.target === "tour-financial-academy" ||
      currentStepData.target === "tour-financial-blogs" ||
      currentStepData.target === "tour-financial-preview";
    const isDiscounts =
      currentStepData.target === "tour-product-discounts" ||
      currentStepData.target === "tour-discounts-list" ||
      currentStepData.target === "tour-discounts-preview" ||
      currentStepData.target === "tour-discounts-config-panel" ||
      currentStepData.target === "tour-discounts-coupons" ||
      currentStepData.target === "tour-discounts-create" ||
      currentStepData.target === "tour-discounts-coupon-detail" ||
      currentStepData.target === "tour-discounts-analytics";
    const isSidebar =
      currentStepData.target === "tour-sidebar" ||
      currentStepData.target === "tour-products-section" ||
      currentStepData.target === "tour-product-auth" ||
      currentStepData.target === "tour-auth-authentication" ||
      currentStepData.target === "tour-geolocalization" ||
      currentStepData.target === "tour-device-information";
    const isPreview = currentStepData.target === "tour-auth-preview";
    const isBranding =
      currentStepData.target === "tour-branding-content" ||
      currentStepData.target === "tour-branding-section";
    const isGeolocalizationDevice =
      currentStepData.target === "tour-geolocalization-device";
    const isGeolocalizationSearch =
      currentStepData.target === "tour-geolocalization-search";
    const isGeolocalizationResults =
      currentStepData.target === "tour-geolocalization-results";
    const isDeviceInformation =
      currentStepData.target === "tour-device-information";
    const isDeviceInformationTable =
      currentStepData.target === "tour-device-information-table";
    const isDeviceInformationFirstRow =
      currentStepData.target === "tour-device-information-first-row";
    const isDeviceInformationModal =
      currentStepData.target === "tour-device-information-modal";

    const needsFullVisibility =
      isSidebar ||
      isPreview ||
      isBranding ||
      isGeolocalizationDevice ||
      isGeolocalizationSearch ||
      isGeolocalizationResults ||
      isDeviceInformation ||
      isDeviceInformationTable ||
      isDeviceInformationFirstRow ||
      isDeviceInformationModal ||
      isAML ||
      isIdentity ||
      isConnect ||
      isCards ||
      isTransfers ||
      isTx ||
      isAI ||
      isPayments ||
      isDiscounts;

    // Solo aplicar si necesita visibilidad completa
    if (needsFullVisibility) {
      const element = document.querySelector(
        `[data-tour-id="${currentStepData.target}"]`,
      ) as HTMLElement;
      if (element) {
        highlightedElementRef.current = element;

        // Forzar visibilidad y levantar sobre el overlay
        element.style.opacity = "1";
        element.style.position = "relative";
        // Para modales, usar z-index máximo para que queden sobre el overlay completo
        // Para otros elementos, NO aplicamos z-index porque están dentro de <main isolate>
        // que crea su propio stacking context. Los overlays cutout ya manejan la visibilidad.
        const isModal =
          currentStepData.target === "tour-device-information-modal" ||
          currentStepData.target === "tour-discounts-coupon-detail";

        // Si es un modal, aplicar z-index al elemento y al contenedor padre
        if (isModal) {
          element.style.zIndex = "2147483646"; // z-index alto pero menor que el tooltip (2147483647)
          const modalOverlay = element.closest(".fixed.inset-0") as HTMLElement;
          if (modalOverlay) {
            modalOverlay.style.zIndex = "2147483646";
          }
        }
        // Para no-modales, no aplicamos z-index (los cutout overlays manejan la visibilidad)

        // Asegurar que el fondo sea opaco para que no se mezcle con el overlay
        const computedStyle = window.getComputedStyle(element);
        if (
          computedStyle.backgroundColor === "rgba(0, 0, 0, 0)" ||
          computedStyle.backgroundColor === "transparent"
        ) {
          element.style.backgroundColor =
            document.documentElement.classList.contains("dark")
              ? "#1e293b"
              : "#ffffff";
        }

        // Asegurar que todos los padres hasta el body tengan opacidad 1
        let currentElement: HTMLElement | null = element.parentElement;
        while (currentElement && currentElement !== document.body) {
          currentElement.style.opacity = "1";
          currentElement = currentElement.parentElement;
        }

        // Asegurar que todos los hijos tengan opacidad 1
        const allChildren = element.querySelectorAll("*");
        allChildren.forEach((child) => {
          (child as HTMLElement).style.opacity = "1";
        });
      }
    } else {
      // Logic for non-highlighted elements remains...
    }

    // Encontrar el elemento destacado
    const findElement = (): HTMLElement | null => {
      let element = document.querySelector(
        `[data-tour-id="${currentStepData.target}"]`,
      ) as HTMLElement;
      if (!element && currentStepData.target === "tour-branding-content") {
        element = document.querySelector(
          `[data-tour-id="tour-branding-section"]`,
        ) as HTMLElement;
      }
      // Para elementos dentro de contenedores, buscar el contenedor padre más cercano
      if (!element) {
        // Intentar encontrar cualquier elemento hijo que tenga el data-tour-id
        const allElements = document.querySelectorAll(`[data-tour-id]`);
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          if (el.getAttribute("data-tour-id") === currentStepData.target) {
            return el;
          }
        }
      }
      return element;
    };

    // Función para aplicar opacidad
    const applyOpacity = (element: HTMLElement) => {
      // Eliminar opacidad del elemento actual y todos sus ancestros y descendientes
      let currentElement: HTMLElement | null = element;
      while (currentElement && currentElement !== document.body) {
        currentElement.style.setProperty("opacity", "1", "important");
        currentElement = currentElement.parentElement;
      }

      // Eliminar opacidad de todos los hijos
      const allChildren = element.querySelectorAll("*");
      allChildren.forEach((child) => {
        const childEl = child as HTMLElement;
        childEl.style.setProperty("opacity", "1", "important");
      });
    };

    // Usar múltiples intentos para encontrar el elemento
    // Para identity-workflow-liveness-preview, necesitamos más intentos porque el elemento se renderiza condicionalmente
    // Para cards-transactions, usar menos intentos para evitar congelamientos
    let attempts = 0;
    const maxAttempts =
      currentStepData.target === "tour-identity-workflow-liveness-preview"
        ? 30
        : currentStepData.target === "tour-cards-transactions"
          ? 5
          : 15;
    const attemptInterval =
      currentStepData.target === "tour-cards-transactions" ? 150 : 100;

    const tryFindAndApply = () => {
      const element = findElement();
      if (element) {
        // Restaurar opacidad del elemento anterior si existe
        if (
          highlightedElementRef.current &&
          highlightedElementRef.current !== element
        ) {
          const prevElement = highlightedElementRef.current;
          prevElement.style.removeProperty("opacity");
          prevElement.style.removeProperty("position");
          prevElement.style.removeProperty("z-index");
          prevElement.style.removeProperty("background-color");
          let currentElement: HTMLElement | null = prevElement;
          while (currentElement && currentElement !== document.body) {
            currentElement.style.removeProperty("opacity");
            currentElement = currentElement.parentElement;
          }
          const prevChildren = prevElement.querySelectorAll("*");
          prevChildren.forEach((child) => {
            const childEl = child as HTMLElement;
            childEl.style.removeProperty("opacity");
            childEl.style.removeProperty("position");
            childEl.style.removeProperty("z-index");
            childEl.style.removeProperty("background-color");
          });
        }

        applyOpacity(element);
        highlightedElementRef.current = element;
        // Important: Update position state to trigger render
        return true;
      }
      return false;
    };

    // Intentar inmediatamente
    let intervalId: NodeJS.Timeout | null = null;
    if (!tryFindAndApply()) {
      // Si no se encuentra, intentar varias veces con delay
      intervalId = setInterval(() => {
        attempts++;
        if (tryFindAndApply() || attempts >= maxAttempts) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      }, attemptInterval);
    }

    const onScrollOrResize = () => {
      if (updatePositionRef.current) {
        requestAnimationFrame(updatePositionRef.current);
      }
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);

      // Limpiar intervalo si existe
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      // Restaurar opacidad al desmontar
      if (highlightedElementRef.current) {
        const element = highlightedElementRef.current;
        element.style.removeProperty("opacity");
        element.style.removeProperty("position");
        element.style.removeProperty("z-index");
        element.style.removeProperty("background-color");
        let currentElement: HTMLElement | null = element;
        while (currentElement && currentElement !== document.body) {
          currentElement.style.removeProperty("opacity");
          currentElement = currentElement.parentElement;
        }
        const allChildren = element.querySelectorAll("*");
        allChildren.forEach((child) => {
          const childEl = child as HTMLElement;
          childEl.style.removeProperty("opacity");
        });
        highlightedElementRef.current = null;
      }
    };
  }, [isTourActive, currentStep, steps]);

  if (!isTourActive || steps.length === 0 || !highlightPosition) {
    return null;
  }

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  // El sidebar solo se resalta cuando es el target específico del paso actual
  // Después del paso 3, no se resalta en pasos intermedios hasta que vuelva a ser el target
  const isSidebar =
    currentStepData.target === "tour-sidebar" ||
    currentStepData.target === "tour-products-section" ||
    currentStepData.target === "tour-product-auth" ||
    currentStepData.target === "tour-auth-authentication" ||
    currentStepData.target === "tour-geolocalization" ||
    currentStepData.target === "tour-device-information";

  const isPreview = currentStepData.target === "tour-auth-preview";
  const isBranding =
    currentStepData.target === "tour-branding-content" ||
    currentStepData.target === "tour-branding-section";
  const isGeolocalizationDevice =
    currentStepData.target === "tour-geolocalization-device";
  const isGeolocalizationSearch =
    currentStepData.target === "tour-geolocalization-search";
  const isGeolocalizationResults =
    currentStepData.target === "tour-geolocalization-results";
  const isDeviceInformation =
    currentStepData.target === "tour-device-information";
  const isDeviceInformationTable =
    currentStepData.target === "tour-device-information-table";
  const isDeviceInformationFirstRow =
    currentStepData.target === "tour-device-information-first-row";
  const isDeviceInformationModal =
    currentStepData.target === "tour-device-information-modal";

  // Nuevos módulos - todos necesitan visibilidad completa
  const isAML =
    currentStepData.target === "tour-product-aml" ||
    currentStepData.target === "tour-aml-validation-global-list" ||
    currentStepData.target === "tour-aml-preview" ||
    currentStepData.target === "tour-aml-validations-list" ||
    currentStepData.target === "tour-aml-list-config";
  const isIdentity =
    currentStepData.target === "tour-product-identity" ||
    currentStepData.target === "tour-identity-workflow" ||
    currentStepData.target === "tour-identity-new-workflow-button" ||
    currentStepData.target === "tour-identity-workflow-preview" ||
    currentStepData.target === "tour-identity-workflow-config-country" ||
    currentStepData.target === "tour-identity-workflow-config-documents" ||
    currentStepData.target === "tour-identity-workflow-config-liveness" ||
    currentStepData.target === "tour-identity-workflow-liveness-preview";
  const isConnect =
    currentStepData.target === "tour-product-connect" ||
    currentStepData.target === "tour-connect-bank-account-linking" ||
    currentStepData.target === "tour-connect-config" ||
    currentStepData.target === "tour-connect-preview" ||
    currentStepData.target === "tour-connect-credentials" ||
    currentStepData.target === "tour-connect-wallet";
  const isCards =
    currentStepData.target === "tour-product-cards" ||
    currentStepData.target === "tour-cards-config-branding" ||
    currentStepData.target === "tour-cards-preview-main" ||
    currentStepData.target === "tour-cards-issuing-design" ||
    currentStepData.target === "tour-cards-create-design" ||
    currentStepData.target === "tour-cards-design-editor" ||
    currentStepData.target === "tour-cards-preview" ||
    currentStepData.target === "tour-cards-transactions" ||
    currentStepData.target === "tour-cards-diligence" ||
    currentStepData.target === "tour-cards-diligence-create" ||
    currentStepData.target === "tour-cards-diligence-list";
  const isTransfers =
    currentStepData.target === "tour-product-transfers" ||
    currentStepData.target === "tour-transfers-config" ||
    currentStepData.target === "tour-transfers-region-panel" ||
    currentStepData.target === "tour-transfers-preview";
  const isTx =
    currentStepData.target === "tour-product-tx" ||
    currentStepData.target === "tour-tx-international-transfers" ||
    currentStepData.target === "tour-tx-config" ||
    currentStepData.target === "tour-tx-preview";
  const isAI =
    currentStepData.target === "tour-product-ai" ||
    currentStepData.target === "tour-ai-alaiza" ||
    currentStepData.target === "tour-ai-alaiza-config" ||
    currentStepData.target === "tour-ai-alaiza-preview";
  const isPayments =
    currentStepData.target === "tour-product-payments" ||
    currentStepData.target === "tour-payments-basic-services" ||
    currentStepData.target === "tour-transfers-config" ||
    currentStepData.target === "tour-transfers-region-panel" ||
    currentStepData.target === "tour-transfers-preview" ||
    currentStepData.target === "tour-payments-custom-keys" ||
    currentStepData.target === "tour-payments-custom-keys-config" ||
    currentStepData.target === "tour-payments-custom-keys-preview" ||
    currentStepData.target === "tour-payments-qr" ||
    currentStepData.target === "tour-payments-qr-config" ||
    currentStepData.target === "tour-payments-qr-preview";
  const isDiscounts =
    currentStepData.target === "tour-product-discounts" ||
    currentStepData.target === "tour-discounts-list" ||
    currentStepData.target === "tour-discounts-preview" ||
    currentStepData.target === "tour-discounts-config-panel" ||
    currentStepData.target === "tour-discounts-coupons" ||
    currentStepData.target === "tour-discounts-coupon-detail" ||
    currentStepData.target === "tour-discounts-create" ||
    currentStepData.target === "tour-discounts-analytics";

  // Determinar si el elemento necesita mostrarse completamente sin opacidad
  const needsFullVisibility =
    isSidebar ||
    isPreview ||
    isBranding ||
    isGeolocalizationDevice ||
    isGeolocalizationSearch ||
    isGeolocalizationResults ||
    isDeviceInformation ||
    isDeviceInformationTable ||
    isDeviceInformationFirstRow ||
    isDeviceInformationModal ||
    isAML ||
    isIdentity ||
    isConnect ||
    isCards ||
    isTransfers ||
    isTx ||
    isAI ||
    isPayments ||
    isDiscounts;

  // Para modales, usar overlay completo que cubra toda la pantalla incluyendo navbar
  const isModalStep =
    currentStepData.target === "tour-device-information-modal" ||
    currentStepData.target === "tour-discounts-coupon-detail";

  const position = currentStepData.position || "bottom";
  const tooltipTransform = isModalStep
    ? "translate(-50%, -50%)"
    : position === "left"
      ? "translateX(0) translateY(-50%)"
      : position === "right"
        ? "translateX(0) translateY(-50%)"
        : position === "top"
          ? "translateX(-50%) translateY(-100%)"
          : "translateX(-50%) translateY(0)";
  const overlayOpacity = 0.09;
  const overlayBackground = `rgba(0, 0, 0, ${overlayOpacity})`;

  return (
    <>
      {/* Overlay con huecos para elementos que necesitan visibilidad completa */}
      {needsFullVisibility && !isModalStep ? (
        <>
          {/* Overlay superior */}
          <div
            className="fixed"
            style={{
              zIndex: 2147483645,
              top: 0,
              left: 0,
              right: 0,
              height: `${highlightPosition.top}px`,
              backgroundColor: overlayBackground,
            }}
          />
          {/* Overlay inferior */}
          <div
            className="fixed"
            style={{
              zIndex: 2147483645,
              top: `${highlightPosition.top + highlightPosition.height}px`,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: overlayBackground,
            }}
          />
          {/* Overlay izquierdo */}
          <div
            className="fixed"
            style={{
              zIndex: 2147483645,
              top: `${highlightPosition.top}px`,
              left: 0,
              width: `${highlightPosition.left}px`,
              height: `${highlightPosition.height}px`,
              backgroundColor: overlayBackground,
            }}
          />
          {/* Overlay derecho */}
          <div
            className="fixed"
            style={{
              zIndex: 2147483645,
              top: `${highlightPosition.top}px`,
              left: `${highlightPosition.left + highlightPosition.width}px`,
              right: 0,
              height: `${highlightPosition.height}px`,
              backgroundColor: overlayBackground,
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0"
          style={{
            zIndex: isModalStep ? 2147483645 : 100, // Menor que el elemento destacado (2147483646)
            backgroundColor: overlayBackground,
          }}
        />
      )}

      {/* Estilo global para eliminar opacidad en el área destacada */}
      {needsFullVisibility && (
        <style>{`
          * {
            transition: opacity 0s !important;
          }
        `}</style>
      )}

      {/* Highlight border */}
      {needsFullVisibility ? (
        <div
          className="pointer-events-none fixed rounded-lg border-4 border-primary"
          style={{
            zIndex: 99,
            top: `${highlightPosition.top}px`,
            left: `${highlightPosition.left}px`,
            width: `${highlightPosition.width}px`,
            height: `${highlightPosition.height}px`,
          }}
        />
      ) : (
        <div
          className="pointer-events-none fixed z-[99] rounded-lg border-4 border-primary"
          style={{
            top: `${highlightPosition.top}px`,
            left: `${highlightPosition.left}px`,
            width: `${highlightPosition.width}px`,
            height: `${highlightPosition.height}px`,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          ref={tooltipRef}
          className="fixed w-80 rounded-lg bg-white p-4 shadow-xl dark:bg-dark-2"
          style={{
            zIndex: 2147483647,
            top: isModalStep ? "50%" : `${tooltipPosition.top}px`,
            left: isModalStep ? "50%" : `${tooltipPosition.left}px`,
            transform:
              currentStepData.target === "tour-geolocalization-results"
                ? "translateY(-50%)"
                : tooltipTransform,
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark dark:text-white">
              {currentStepData.title}
            </h3>
            <button
              onClick={endTour}
              className="text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mb-4 text-sm text-dark-6 dark:text-dark-6">
            {currentStepData.content}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-dark-6 dark:text-dark-6">
              {translations.tourOverlay.step} {currentStep + 1}{" "}
              {translations.tourOverlay.of} {steps.length}
            </span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={previousStep}
                  disabled={isPaused}
                  className="rounded-lg border border-stroke px-3 py-1.5 text-sm font-medium text-dark transition-colors hover:bg-gray-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-stroke-dark dark:text-white dark:hover:bg-dark-3"
                >
                  {translations.tourOverlay.previous}
                </button>
              )}
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={isPaused}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {translations.tourOverlay.next}
                </button>
              ) : (
                <button
                  onClick={endTour}
                  disabled={isPaused}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {translations.tourOverlay.finish}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
