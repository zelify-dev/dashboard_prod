"use client";

import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Checkbox } from "@/components/FormElements/checkbox";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import { useState } from "react";

const PRODUCTS = [
  "🔐 Zelify Auth",
  "🧬 Zelify Identity",
  "🛡️ Zelify AML (Anti-Money Laundering)",
  "🔗 Zelify Connect",
  "💳 Zelify Cards",
  "💸 Zelify Transfers",
  "🌍 Zelify TX (Foreign Exchange & Cross-Border)",
  "💰 Zelify Payments",
  "🎟️ Zelify Discounts & Coupons",
  "🤖 Matilda AI Core",
  "🛡️ Zelify Insurance",
  "⚙️ Zelify Custom Services",
];

type CreateTeamModalProps = {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    products: string[];
  }) => void;
};

export function CreateTeamModal({ onClose, onCreate }: CreateTeamModalProps) {
  const translations = useUiTranslations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [mentionLater, setMentionLater] = useState(false);
  const modalRef = useClickOutside<HTMLDivElement>(() => onClose());

  const handleProductToggle = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      description,
      products: mentionLater ? [] : selectedProducts,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={modalRef}
        className="w-full max-w-2xl rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card"
      >
        <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h2 className="text-heading-6 font-bold text-dark dark:text-white">
            {translations.organizationTeams.createTeamModal.title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <InputGroup
              label={translations.organizationTeams.createTeamModal.teamNameLabel}
              type="text"
              name="name"
              placeholder={
                translations.organizationTeams.createTeamModal.teamNamePlaceholder
              }
              value={name}
              handleChange={(e) => setName(e.target.value)}
              required
            />

            <TextAreaGroup
              label={translations.organizationTeams.createTeamModal.descriptionLabel}
              placeholder={
                translations.organizationTeams.createTeamModal.descriptionPlaceholder
              }
              value={description}
              handleChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <div className="mb-3 flex items-center gap-3">
                <Checkbox
                  label={
                    translations.organizationTeams.createTeamModal.mentionProductsLater
                  }
                  name="mentionLater"
                  onChange={(e) => setMentionLater(e.target.checked)}
                />
              </div>

              {!mentionLater && (
                <div>
                  <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                    {translations.organizationTeams.createTeamModal.productsLabel}
                  </label>
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-stroke p-4 dark:border-dark-3">
                    {PRODUCTS.map((product) => (
                      <div key={product}>
                        <Checkbox
                          label={product}
                          name={`product-${product}`}
                          onChange={() => handleProductToggle(product)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stroke px-6 py-2.5 font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
            >
              {translations.organizationTeams.actions.cancel}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-opacity-90"
            >
              {translations.organizationTeams.actions.createTeam}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
