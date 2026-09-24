import Badge from "@components/Badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/Tooltip";
import { Server } from "lucide-react";
import { countLabel } from "@utils/helpers";
import React from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { NameserverGroup } from "@/interfaces/Nameserver";

type Props = {
  ns: NameserverGroup;
};
export default function NameserverNameserversCell({ ns }: Props) {
  const { t } = useI18n();
  const nameservers = ns.nameservers ?? [];

  if (nameservers.length > 3) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={1}>
          <TooltipTrigger asChild={true}>
            <Badge variant={"gray"} className={"font-mono cursor-help"}>
              <Server size={10} className={"mr-1"} />
              {countLabel(
                t,
                nameservers.length,
                "counts.server",
                "counts.servers",
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className={"p-3"}>
            <div className={"flex flex-col gap-1.5 items-start max-w-sm"}>
              {nameservers.map((server) => (
                <Badge
                  key={server.ip}
                  variant={"gray"}
                  className={"font-mono"}
                >
                  <Server size={10} className={"mr-1"} />
                  {server.ip}
                </Badge>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={"flex gap-2"}>
      {nameservers.map((server) => (
        <Badge key={server.ip} variant={"gray"} className={"font-mono"}>
          <Server size={10} className={"mr-1"} />
          {server.ip}
        </Badge>
      ))}
    </div>
  );
}
