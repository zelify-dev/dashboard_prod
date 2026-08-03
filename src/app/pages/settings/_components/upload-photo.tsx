"use client";

import { useState, useEffect } from "react";
import { UploadIcon, UserIcon } from "@/assets/icons";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import Image from "next/image";
import { getStoredUser, uploadProfilePhoto, syncMe, type AuthUser } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

export function UploadPhotoForm() {
  const translations = useUiTranslations();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica
    if (file.size > 4.5 * 1024 * 1024) {
      setError("La imagen no debe superar los 4.5MB");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await uploadProfilePhoto(file);
      await syncMe();
      setUser(getStoredUser());
      // Eliminamos el reload() ya que el sistema reactivo se encarga de actualizar el Header
    } catch (err: any) {
      setError(err.message || "Error al subir la foto");
    } finally {
      setIsUploading(false);
    }
  };

  // Añadimos un timestamp para evitar que el navegador use la versión antigua de la imagen (cache busting)
  const rawPhotoUrl = (user as any)?.photo || (user as any)?.url_photo;
  const USER = {
    name: user?.full_name ?? "Usuario",
    email: user?.email ?? "",
    image: rawPhotoUrl ? `${rawPhotoUrl}${rawPhotoUrl.includes('?') ? '&' : '?'}t=${new Date().getTime()}` : null,
  };
  const photoUrl = USER.image;

  return (
    <ShowcaseSection 
      title={translations.settings.yourPhoto} 
      rootClassName="h-full"
      className="!p-6 h-full flex flex-col justify-between"
    >
      <div>
        <div className="mb-6 flex items-center gap-4">
          <div className="relative size-14 overflow-hidden rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
            {photoUrl ? (
              <Image
                src={photoUrl}
                fill
                alt="User"
                className="object-cover"
                quality={90}
                unoptimized={photoUrl.startsWith("http")}
              />
            ) : (
              <div className="text-dark-6">
                <UserIcon className="size-8" />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>

          <div>
            <span className="mb-1 block text-sm font-normal text-dark">
              {translations.settings.editYourPhoto}
            </span>
            <span className="flex gap-3">
              <button 
                type="button" 
                className="text-xs font-light text-dark-6 hover:text-rose-600 transition-colors"
                onClick={() => setError("Funcionalidad de eliminar pronto disponible")}
              >
                {translations.settings.delete}
              </button>
              <label 
                htmlFor="profilePhoto" 
                className="cursor-pointer text-xs font-normal text-dark hover:underline transition-all"
              >
                {translations.settings.update}
              </label>
            </span>
          </div>
        </div>

        <div className={cn(
          "relative mb-4 block w-full rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 transition-all hover:bg-gray-50",
          isUploading && "opacity-50 pointer-events-none"
        )}>
          <input
            type="file"
            name="profilePhoto"
            id="profilePhoto"
            accept="image/png, image/jpg, image/jpeg, image/webp"
            onChange={handleFileChange}
            hidden
          />

          <label
            htmlFor="profilePhoto"
            className="flex cursor-pointer flex-col items-center justify-center py-8 px-4 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm mb-3">
              <UploadIcon className="text-zelify-midnight size-5" />
            </div>

            <p className="text-xs font-normal text-dark">
              {translations.settings.clickToUpload} <span className="text-dark-6 font-light">{translations.settings.orDragAndDrop}</span>
            </p>

            <p className="mt-1 text-[11px] font-light text-dark-6">
              {translations.settings.fileFormats} (Max 4.5MB)
            </p>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-2 rounded-xl bg-rose-50 p-2.5 text-xs font-light text-rose-600 border border-rose-100 flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-rose-500" />
          {error}
        </div>
      )}

    </ShowcaseSection>
  );
}
