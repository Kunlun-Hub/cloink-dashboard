import {
  Cast,
  CloudIcon,
  Database,
  KeyboardIcon,
  SquareTerminal,
} from "lucide-react";
import * as React from "react";
import { memo } from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  onClick: (prompt: string) => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
};
const FirewallGptExampleCards = ({ onClick, textAreaRef }: Props) => {
  const { t } = useI18n();
  return (
    <div className={"grid grid-cols-2 px-6 z-10 relative gap-4 mb-2"}>
      <FirewallGptExampleCard
        title={t("firewallGpt.exampleCards.sshAccess.title")}
        icon={<SquareTerminal size={16} />}
        description={t("firewallGpt.exampleCards.sshAccess.description")}
        onClick={(prompt) => {
          onClick(prompt);
          textAreaRef.current?.focus();
        }}
      />
      <FirewallGptExampleCard
        title={t("firewallGpt.exampleCards.rdpAccess.title")}
        icon={<Cast size={16} />}
        description={t("firewallGpt.exampleCards.rdpAccess.description")}
        onClick={(prompt) => {
          onClick(prompt);
          textAreaRef.current?.focus();
        }}
      />
      <FirewallGptExampleCard
        icon={<Database size={16} />}
        title={t("firewallGpt.exampleCards.databaseAccess.title")}
        description={t("firewallGpt.exampleCards.databaseAccess.description")}
        onClick={(prompt) => {
          onClick(prompt);
          textAreaRef.current?.focus();
        }}
      />
      <FirewallGptExampleCard
        title={t("firewallGpt.exampleCards.cloudAccess.title")}
        description={t("firewallGpt.exampleCards.cloudAccess.description")}
        onClick={(prompt) => {
          onClick(prompt);
          textAreaRef.current?.focus();
        }}
        icon={<CloudIcon size={16} />}
      />
    </div>
  );
};

type ExampleCardProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  prompt?: string;
  onClick?: (prompt: string) => void;
};
export const FirewallGptExampleCard = ({
  icon = <KeyboardIcon size={16} />,
  title,
  prompt,
  description,
  onClick,
}: ExampleCardProps) => {
  return (
    <div
      className={
        "rounded-md bg-nb-gray-920/50 border border-nb-gray-900/50 py-4 px-5 hover:bg-nb-gray-920/70 cursor-pointer transition-colors"
      }
      onClick={() => onClick?.(prompt || description)}
    >
      <div className={"flex gap-2 items-center text-sm text-nb-gray-100"}>
        {icon}
        {title}
      </div>
      <div className={"text-xs inline-block text-nb-gray-400 mt-1.5"}>
        {description}
      </div>
    </div>
  );
};

export default memo(FirewallGptExampleCards);
