import Button from "@components/Button";
import { CommandItem } from "@components/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@components/Popover";
import { ScrollArea } from "@components/ScrollArea";
import { isNetBirdCloud } from "@utils/netbird";
import { Command, CommandGroup, CommandList } from "cmdk";
import { trim } from "lodash";
import {
  ChevronsUpDown,
  Cog,
  CreditCard,
  EyeIcon,
  NetworkIcon,
  User2,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import NetBirdIcon from "@/assets/icons/NetBirdIcon";
import { useMSP } from "@/cloud/msp/contexts/MSPProvider";
import { useDialog } from "@/contexts/DialogProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { useElementSize } from "@/hooks/useElementSize";
import { Role, User } from "@/interfaces/User";
import { useI18n } from "@/i18n/I18nProvider";

interface MultiSelectProps {
  value?: Role;
  onChange: (item: Role) => void;
  disabled?: boolean;
  popoverWidth?: "auto" | number;
  hideOwner?: boolean;
  hideBillingAdmin?: boolean;
  currentUser?: User;
  customTrigger?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export const UserRoles = [
  {
    nameKey: "userRoles.owner",
    value: Role.Owner,
    icon: NetBirdIcon,
  },
  {
    nameKey: "userRoles.admin",
    value: Role.Admin,
    icon: Cog,
  },
  {
    nameKey: "userRoles.networkAdmin",
    value: Role.NetworkAdmin,
    icon: NetworkIcon,
  },
  {
    nameKey: "userRoles.billingAdmin",
    value: Role.BillingAdmin,
    icon: CreditCard,
  },
  {
    nameKey: "userRoles.auditor",
    value: Role.Auditor,
    icon: EyeIcon,
  },
  {
    nameKey: "userRoles.user",
    value: Role.User,
    icon: User2,
  },
];

export function UserRoleSelector({
  onChange,
  value,
  disabled = false,
  popoverWidth = "auto",
  hideOwner = false,
  hideBillingAdmin = false,
  currentUser,
  customTrigger,
  side = "bottom",
  align = "start",
}: Readonly<MultiSelectProps>) {
  const [inputRef, { width }] = useElementSize<
    HTMLButtonElement | HTMLDivElement
  >();
  const { isOwner } = useLoggedInUser();
  const { confirm } = useDialog();
  const { t } = useI18n();

  const toggle = async (item: Role) => {
    if (item === Role.Owner) {
      let ok = await confirm({
        title: t("userRoles.transferOwnershipTitle"),
        type: "warning",
        description: (
          <div className={"inline-block"}>
            {t("userRoles.transferOwnershipDescription1")}{" "}
            <span className={"text-netbird inline font-medium"}>
              {t("userRoles.owner")}
            </span>{" "}
            {t("userRoles.transferOwnershipDescription2")}{" "}
            {currentUser ? (
              <span className={"text-netbird inline font-medium"}>
                {currentUser.name}
              </span>
            ) : (
              t("userRoles.thisUser")
            )}{" "}
            {t("userRoles.transferOwnershipDescription3")}{" "}
            <span className={"text-netbird inline font-medium"}>
              {t("userRoles.admin")}
            </span>{" "}
            {t("userRoles.transferOwnershipDescription4")}
          </div>
        ),
      });
      if (!ok) return;
    }

    const isSelected = value == item;
    if (!isSelected) onChange && onChange(item);
    setOpen(false);
  };

  const [open, setOpen] = useState(false);

  const selectedRole = UserRoles.find((role) => role.value === value);

  // Cloud only
  const { isAccountWithMSPParent } = useMSP();

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
      }}
    >
      <PopoverTrigger asChild={true}>
        {customTrigger ? (
          <div ref={inputRef} className={"group/user-role-selector"}>
            {customTrigger}
          </div>
        ) : (
          <Button
            variant={"input"}
            disabled={disabled}
            ref={inputRef}
            className={"w-full group/user-role-selector"}
            data-testid={"user-role-selector"}
          >
            <div className={"w-full flex justify-between items-center gap-2"}>
              {selectedRole && (
                <div className={"flex items-center gap-2.5"}>
                  <selectedRole.icon size={14} width={14} />
                  <div className={"flex flex-col text-sm font-medium"}>
                    <span className={"text-nb-gray-200 whitespace-nowrap"}>
                      {t(selectedRole.nameKey)}
                    </span>
                  </div>
                </div>
              )}

              <div className={"pl-2"}>
                <ChevronsUpDown size={18} className={"shrink-0"} />
              </div>
            </div>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0 shadow-sm shadow-nb-gray-950"
        style={{
          width: popoverWidth === "auto" ? width : popoverWidth,
        }}
        align={align}
        side={side}
        sideOffset={10}
      >
        <Command
          className={"w-full flex"}
          loop
          filter={(value, search) => {
            const formatValue = trim(value.toLowerCase());
            const formatSearch = trim(search.toLowerCase());
            if (formatValue.includes(formatSearch)) return 1;
            return 0;
          }}
        >
          <CommandList className={"w-full"}>
            <ScrollArea
              className={
                "max-h-[380px] overflow-y-auto flex flex-col gap-1 pl-2 py-2 pr-3"
              }
            >
              <CommandGroup>
                <div className={"grid grid-cols-1 gap-1"}>
                  {UserRoles.map((item) => {
                    if (!isOwner && item.value === Role.Owner) return null;
                    if (hideOwner && item.value === Role.Owner) return null;
                    if (hideBillingAdmin && item.value === Role.BillingAdmin)
                      return null;

                    // Cloud only
                    if (item.value === Role.BillingAdmin && !isNetBirdCloud())
                      return null;
                    if (
                      item.value === Role.BillingAdmin &&
                      isAccountWithMSPParent
                    )
                      return null;
                    if (item.value === Role.Owner && isAccountWithMSPParent)
                      return null;

                    return (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        data-testid={"user-role-selector-item"}
                        className={"py-1 px-2"}
                        onSelect={() => toggle(item.value)}
                        onClick={(e) => e.preventDefault()}
                      >
                        <div className={"flex items-center gap-2.5 p-1"}>
                          <item.icon size={14} width={14} />
                          <div
                            className={
                              "flex flex-col text-sm font-medium text-nb-gray-200 whitespace-nowrap"
                            }
                          >
                            {t(item.nameKey)}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
