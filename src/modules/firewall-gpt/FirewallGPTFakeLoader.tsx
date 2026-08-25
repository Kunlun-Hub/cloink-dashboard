import { cn } from "@utils/helpers";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2Icon } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useI18n } from "@/i18n/I18nProvider";
import { FirewallGptAnimatedMessageText } from "@/modules/firewall-gpt/FirewallGPTAnimatedMessageText";
import {
  AssistantAvatar,
  LoadingAvatar,
} from "@/modules/firewall-gpt/FirewallGPTAvatars";

type Props = {
  isLoading?: boolean;
};

interface LoadingMessage {
  loadingMessage: string;
  successMessage: string;
  icon: React.ReactNode;
}

const createLoadingMessages = (t: (key: string) => string): LoadingMessage[] => [
  {
    loadingMessage: t("firewallGpt.loader.identifyNodes.loading"),
    successMessage: t("firewallGpt.loader.identifyNodes.success"),
    icon: <CheckCircle2Icon size={16} className={"text-green-400"} />,
  },
  {
    loadingMessage: t("firewallGpt.loader.findGroups.loading"),
    successMessage: t("firewallGpt.loader.findGroups.success"),
    icon: <CheckCircle2Icon size={16} className={"text-green-400"} />,
  },
  {
    loadingMessage: t("firewallGpt.loader.postureChecks.loading"),
    successMessage: t("firewallGpt.loader.postureChecks.success"),
    icon: <CheckCircle2Icon size={16} className={"text-green-400"} />,
  },
  {
    loadingMessage: t("firewallGpt.loader.gettingReady.loading"),
    successMessage: t("firewallGpt.loader.gettingReady.success"),
    icon: <CheckCircle2Icon size={16} className={"text-green-400"} />,
  },
  {
    loadingMessage: t("firewallGpt.loader.almostThere.loading"),
    successMessage: t("firewallGpt.loader.almostThere.success"),
    icon: <CheckCircle2Icon size={16} className={"text-green-400"} />,
  },
  {
    loadingMessage: t("firewallGpt.loader.takingLonger.loading"),
    successMessage: "",
    icon: <CheckCircle2Icon size={16} className={"text-green-400"} />,
  },
];

const messageDuration = 4000;

export const FirewallGPTFakeLoader = ({ isLoading = true }: Props) => {
  const { t } = useI18n();
  const loadingMessages = createLoadingMessages(t);

  const [messages, setMessages] = useState<LoadingMessage[]>(() =>
    loadingMessages.slice(0, 1),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const current = messages.length;
      setMessages(loadingMessages.slice(0, current + 1));
    }, messageDuration);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <motion.div
      className={"flex gap-4"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {isLoading ? <LoadingAvatar /> : <AssistantAvatar />}

      <div className={cn("flex-col gap-2 flex w-full mt-[0.15rem]")}>
        {messages.map((message, index) => (
          <CompleteMessage message={message} key={index} />
        ))}
      </div>
    </motion.div>
  );
};

export const CompleteMessage = ({
  message,
  real,
  isLoading,
}: {
  message: LoadingMessage;
  real?: boolean;
  isLoading?: boolean;
}) => {
  const [isFakeLoading, setIsFakeLoading] = useState(true);

  useEffect(() => {
    if (real) return;
    const interval = setInterval(() => {
      if (message.successMessage === "") return;
      setIsFakeLoading(false);
    }, messageDuration - 500);
    return () => !real && clearInterval(interval);
  }, []);

  return !real ? (
    <AnimatePresence>
      {isFakeLoading ? (
        <LoadingMessage message={message.loadingMessage} />
      ) : (
        <SuccessMessage message={message.successMessage} icon={message.icon} />
      )}
    </AnimatePresence>
  ) : (
    <AnimatePresence>
      {isLoading ? (
        <LoadingMessage message={message.loadingMessage} />
      ) : (
        <SuccessMessage message={message.successMessage} icon={message.icon} />
      )}
    </AnimatePresence>
  );
};

const LoadingMessage = ({ message }: { message: string }) => {
  return (
    <motion.span
      className={"text-nb-gray-200 font-light text-sm relative mt-3"}
      layout={"position"}
      animate={{
        y: 0,
        opacity: 1,
      }}
      initial={{
        y: 5,
        opacity: 0,
      }}
      exit={{
        y: -5,
        opacity: 0,
      }}
      transition={{
        duration: 1,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      <Skeleton
        className={
          "rounded-md  border border-nb-gray-900/0 flex flex-col w-full relative left-0 top-0 animate-pulse"
        }
        height={80}
        containerClassName={"flex"}
      ></Skeleton>
      <span className={"absolute left-0 top-0 z-10 w-full h-full "}>
        <div className={"flex w-full h-full items-center justify-center px-6"}>
          <FirewallGptAnimatedMessageText message={message}>
            <LoadingDots />
          </FirewallGptAnimatedMessageText>
        </div>
      </span>
    </motion.span>
  );
};

const SuccessMessage = ({
  message,
  icon,
}: {
  message: string;
  icon: React.ReactNode;
}) => {
  return (
    <motion.span
      layout={"position"}
      animate={{
        x: 0,
        opacity: 1,
      }}
      initial={{
        x: -10,
        opacity: 0,
      }}
      transition={{
        duration: 1,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className={
        "text-nb-gray-200 font-normal text-sm relative flex items-center gap-2"
      }
    >
      {icon}
      <FirewallGptAnimatedMessageText message={message} />
    </motion.span>
  );
};

const LoadingDots = () => {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((dots) => {
        if (dots.length === 4) {
          return ".";
        }
        return dots + ".";
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <>{dots}</>;
};
