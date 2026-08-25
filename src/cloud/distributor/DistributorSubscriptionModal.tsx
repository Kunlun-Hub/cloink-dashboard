import { InlineButtonLink } from "@components/InlineLink";
import { Modal, ModalClose, ModalContent } from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import Paragraph from "@components/Paragraph";
import { CreditCardIcon } from "lucide-react";
import * as React from "react";
import { useCustomerPlan } from "@/cloud/distributor/hooks/useCustomerPlan";
import { PlanCard, PlanLoadingSkeleton } from "@/modules/billing/PlanCard";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  name: string;
  accountId: string;
};

export const DistributorSubscriptionModal = ({
  open,
  setOpen,
  name,
  accountId,
}: Props) => {
  return (
    <Modal open={open} onOpenChange={setOpen} key={open ? 1 : 0}>
      <DistributorSubscriptionModalContent
        name={name}
        accountId={accountId}
        setOpen={setOpen}
      />
    </Modal>
  );
};

type ContentProps = {
  name: string;
  accountId: string;
  setOpen: (open: boolean) => void;
};

const DistributorSubscriptionModalContent = ({
  name,
  accountId,
  setOpen,
}: ContentProps) => {
  const { t } = useI18n();
  const {
    plans,
    isLoading,
    currentPlan,
    currency,
    isSubscribing,
    subscribe,
    subscription,
  } = useCustomerPlan({ accountId });

  return (
    <ModalContent
      maxWidthClass={"max-w-3xl"}
      showClose={false}
      onEscapeKeyDown={(e) => e.preventDefault()}
      onInteractOutside={(e) => e.preventDefault()}
      onPointerDownOutside={(e) => e.preventDefault()}
    >
      <ModalHeader
        icon={<CreditCardIcon size={18} />}
        title={t("distributor.netBirdPlanFor", { name })}
        description={t("distributor.selectPlanForCustomer")}
        color={"netbird"}
      />
      <div className={"px-8 pb-1"}>
        <div
          className={"grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4"}
        >
          {(!plans || isLoading) && (
            <>
              <PlanLoadingSkeleton height={378} />
              <PlanLoadingSkeleton height={378} />
            </>
          )}
          {!isLoading &&
            plans?.map((plan) => (
              <PlanCard
                currentPlan={currentPlan}
                currentSubscription={subscription}
                plan={plan}
                currency={currency}
                isSubscribing={isSubscribing}
                onClick={() => subscribe(plan).finally(() => setOpen(false))}
                key={plan.name}
                buttonText={{
                  upgrade: t("billing.continueWith"),
                  downgrade: t("billing.downgradeTo"),
                }}
              />
            ))}
        </div>
        <div className={"pt-6 flex items-center justify-center"}>
          <Paragraph className={"inline text-sm"}>
            {t("billing.haventDecided")}{" "}
            <ModalClose asChild={true}>
              <InlineButtonLink variant={"white"}>
                {t("billing.continueWithTrial")}
              </InlineButtonLink>
            </ModalClose>
          </Paragraph>
        </div>
      </div>
    </ModalContent>
  );
};
