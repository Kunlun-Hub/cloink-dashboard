"use client";

import { Modal } from "@components/modal/Modal";
import { useIsMd } from "@utils/responsive";
import { useEffect, useState } from "react";
import SetupModal from "@/modules/setup-netbird-modal/SetupModal";

function InstallContent() {
  const [open, setOpen] = useState(false);
  const isMd = useIsMd();

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <Modal onOpenChange={() => null} open={open}>
      <SetupModal showClose={false} style={{ marginTop: isMd ? 0 : 13 }} />
    </Modal>
  );
}

export default function UnauthenticatedInstallModal() {
  return <InstallContent />;
}
