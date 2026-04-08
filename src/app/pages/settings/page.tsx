"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { PersonalInfoForm } from "./_components/personal-info";
import { SessionsList } from "./_components/sessions-list";
import { UploadPhotoForm } from "./_components/upload-photo";

export default function SettingsPage() {
  const translations = useUiTranslations();

  return (
    <div className="mx-auto max-w-270">
      <Breadcrumb pageName={translations.settings.pageTitle} />

      <div className="grid grid-cols-5 gap-8 items-stretch">
        <div className="col-span-5 xl:col-span-3 flex flex-col">
          <PersonalInfoForm />
        </div>
        <div className="col-span-5 xl:col-span-2 flex flex-col">
          <UploadPhotoForm />
        </div>
        
        <div className="col-span-5">
          <SessionsList />
        </div>
      </div>
    </div>
  );
}

