"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useUiTranslations } from "@/hooks/use-ui-translations";
import type { Team } from "../page";

type TeamsListProps = {
  teams: Team[];
  onAddMember: (teamId: string) => void;
};

export function TeamsList({ teams, onAddMember }: TeamsListProps) {
  const translations = useUiTranslations();

  if (teams.length === 0) {
    return (
      <ShowcaseSection
        title={translations.organizationTeams.emptyTitle}
        className="!p-7"
      >
        <p className="text-center text-dark-6 dark:text-dark-6">
          {translations.organizationTeams.emptyMessage}
        </p>
      </ShowcaseSection>
    );
  }

  return (
    <div className="space-y-6">
      {teams.map((team) => (
        <ShowcaseSection key={team.id} title={team.name} className="!p-7">
          <div className="space-y-4">
            {team.description && (
              <div>
                <h3 className="mb-2 text-body-sm font-medium text-dark dark:text-white">
                  {translations.organizationTeams.section.description}
                </h3>
                <p className="text-dark-6 dark:text-dark-6">
                  {team.description}
                </p>
              </div>
            )}

            {team.products.length > 0 && (
              <div>
                <h3 className="mb-2 text-body-sm font-medium text-dark dark:text-white">
                  {translations.organizationTeams.section.productsOfInterest}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {team.products.map((product, index) => (
                    <span
                      key={index}
                      className="rounded-lg bg-primary/10 px-3 py-1 text-body-sm text-primary dark:bg-primary/20"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-body-sm font-medium text-dark dark:text-white">
                  {translations.organizationTeams.section.members(
                    team.members.length
                  )}
                </h3>
                <button
                  onClick={() => onAddMember(team.id)}
                  className="rounded-lg border border-stroke px-4 py-2 text-body-sm font-medium text-dark hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                >
                  {translations.organizationTeams.actions.addMember}
                </button>
              </div>

              <div className="space-y-2">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-stroke p-3 dark:border-dark-3 dark:bg-dark-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-dark dark:text-white">
                          {member.fullName}
                        </span>
                        {member.role === "admin" && (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-body-xs text-primary dark:bg-primary/20">
                            {translations.organizationTeams.badges.admin}
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-dark-6 dark:text-dark-6">
                        {member.email}
                      </p>
                      {member.phone && (
                        <p className="text-body-sm text-dark-6 dark:text-dark-6">
                          {member.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ShowcaseSection>
      ))}
    </div>
  );
}













