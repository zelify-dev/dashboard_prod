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
      className="!p-7 h-full flex flex-col"
    >
      <div className="mb-6 flex items-center gap-4">
        <div className="relative size-16 overflow-hidden rounded-full border-2 border-stroke dark:border-dark-3 bg-gray-2 dark:bg-dark-3 flex items-center justify-center shadow-sm">
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
              <UserIcon className="size-10" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <span className="mb-1 block text-lg font-bold text-dark dark:text-white">
            {translations.settings.editYourPhoto}
          </span>
          <span className="flex gap-4">
            <button 
              type="button" 
              className="text-sm font-semibold text-dark-6 hover:text-red transition-colors"
              onClick={() => setError("Funcionalidad de eliminar pronto disponible")}
            >
              {translations.settings.delete}
            </button>
            <label 
              htmlFor="profilePhoto" 
              className="cursor-pointer text-sm font-semibold text-primary hover:underline transition-all"
            >
              {translations.settings.update}
            </label>
          </span>
        </div>
      </div>

      <div className={cn(
        "relative mb-6 block w-full rounded-2xl border-2 border-dashed border-gray-4 bg-gray-2 transition-all hover:border-primary hover:bg-gray-3 dark:border-dark-3 dark:bg-dark-2 dark:hover:border-primary dark:hover:bg-dark-3",
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
          className="flex cursor-pointer flex-col items-center justify-center py-12 px-4"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark shadow-sm group-hover:scale-110 transition-transform">
            <UploadIcon className="text-primary" />
          </div>

          <p className="mt-4 text-sm font-bold">
            <span className="text-primary">{translations.settings.clickToUpload}</span> 
            <span className="text-dark-6 ml-1 font-medium">{translations.settings.orDragAndDrop}</span>
          </p>

          <p className="mt-2 text-xs text-dark-6 font-medium">
            {translations.settings.fileFormats} (Max 4.5MB)
          </p>
        </label>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
          <div className="size-1.5 rounded-full bg-red-500" />
          {error}
        </div>
      )}

    </ShowcaseSection>
  );
}
