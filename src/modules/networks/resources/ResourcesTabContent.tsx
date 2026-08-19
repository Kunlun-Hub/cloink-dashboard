import SkeletonTable, {
  SkeletonTableHeader,
} from "@components/skeletons/SkeletonTable";
import * as React from "react";
import { Suspense } from "react";
import { NetworkResource } from "@/interfaces/Network";
import ResourcesTable from "@/modules/networks/resources/ResourcesTable";
import Paragraph from "@components/Paragraph";
import InlineLink from "@components/InlineLink";
import { ExternalLinkIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

type ResourcesSectionProps = {
  data?: NetworkResource[];
  isLoading: boolean;
};

export const ResourcesTabContent = ({
  data,
  isLoading,
}: ResourcesSectionProps) => {
  const { t } = useI18n();

  return (
    <div className={"px-8"}>
      <div className={"flex justify-between items-center mb-5"}>
        <div>
          <Paragraph>
            {t("networkResources.tabContentDescription")}{" "}
            <InlineLink
              href={"https://docs.netbird.io/how-to/networks#resources"}
              target={"_blank"}
            >
              {t("common.learnMore")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
      </div>
      <Suspense
        fallback={
          <div>
            <SkeletonTableHeader className={"!p-0"} />
            <div className={"mt-8 w-full"}>
              <SkeletonTable withHeader={false} />
            </div>
          </div>
        }
      >
        <ResourcesTable isLoading={isLoading} resources={data} />
      </Suspense>
    </div>
  );
};
