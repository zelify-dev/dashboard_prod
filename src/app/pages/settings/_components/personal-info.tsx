"use client";

import {
  CallIcon,
  EmailIcon,
  PencilSquareIcon,
  UserIcon,
} from "@/assets/icons";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useUiTranslations } from "@/hooks/use-ui-translations";

export function PersonalInfoForm() {
  const translations = useUiTranslations();
  
  return (
    <ShowcaseSection title={translations.settings.personalInformation} className="!p-7">
      <form>
        <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
          <InputGroup
            className="w-full sm:w-1/2"
            type="text"
            name="fullName"
            label={translations.settings.fullName}
            placeholder="Carlos Mendoza"
            defaultValue="Carlos Mendoza"
            icon={<UserIcon />}
            iconPosition="left"
            height="sm"
          />

          <InputGroup
            className="w-full sm:w-1/2"
            type="text"
            name="phoneNumber"
            label={translations.settings.phoneNumber}
            placeholder="+593 99 123 4567"
            defaultValue={"+593 99 123 4567"}
            icon={<CallIcon />}
            iconPosition="left"
            height="sm"
          />
        </div>

        <InputGroup
          className="mb-5.5"
          type="email"
          name="email"
          label={translations.settings.emailAddress}
          placeholder="carlos.mendoza@zelify.com"
          defaultValue="carlos.mendoza@zelify.com"
          icon={<EmailIcon />}
          iconPosition="left"
          height="sm"
        />

        <InputGroup
          className="mb-5.5"
          type="text"
          name="username"
          label={translations.settings.username}
          placeholder="carlos.mendoza"
          defaultValue="carlos.mendoza"
          icon={<UserIcon />}
          iconPosition="left"
          height="sm"
        />

        <TextAreaGroup
          className="mb-5.5"
          label={translations.settings.bio}
          placeholder={translations.settings.writeYourBioHere}
          icon={<PencilSquareIcon />}
          defaultValue="Gerente de Productos Financieros con más de 8 años de experiencia en el sector fintech. Especializado en desarrollo de soluciones de pago, autenticación y gestión de identidad digital. Lidero equipos multidisciplinarios para implementar tecnologías innovadoras que mejoran la experiencia del usuario y garantizan la seguridad de las transacciones financieras."
        />

        <div className="flex justify-end gap-3">
          <button
            className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
            type="button"
          >
            {translations.settings.cancel}
          </button>

          <button
            className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90"
            type="submit"
          >
            {translations.settings.save}
          </button>
        </div>
      </form>
    </ShowcaseSection>
  );
}
