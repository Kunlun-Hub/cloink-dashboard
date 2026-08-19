export interface IronRDPModule {
  SessionBuilder: new () => SessionBuilder;
  DesktopSize: new (width: number, height: number) => DesktopSize;
  ClipboardData?: new () => ClipboardData;
  Extension?: new (ident: string, value: unknown) => Extension;
  default?: () => Promise<void>;
  init?: () => Promise<void>;
  setup?: (logLevel: string) => void;
}
interface DesktopSize {
  width: number;
  height: number;
}
interface Extension {
  free(): void;
}
interface SessionBuilder {
  username(user: string): SessionBuilder;
  password(pwd: string): SessionBuilder;
  destination(dest: string): SessionBuilder;
  serverDomain(domain: string): SessionBuilder;
  desktopSize(size: DesktopSize): SessionBuilder;
  renderCanvas(canvas: HTMLCanvasElement): SessionBuilder;
  proxyAddress(url: string): SessionBuilder;
  authToken(token: string): SessionBuilder;
  extension(ext: Extension): SessionBuilder;
  setCursorStyleCallback(cb: (style: string) => void): void;
  setCursorStyleCallbackContext(ctx: unknown): void;
  remoteClipboardChangedCallback(cb: (data: ClipboardData) => void): void;
  forceClipboardUpdateCallback(cb: () => void): void;
  connect(): Promise<RDPSession>;
}
export interface RDPSession {
  run(): Promise<TerminationInfo>;
  shutdown(): void;
  sendInput(input: unknown): void;
  resize(
    width: number,
    height: number,
    scaleFactor?: number | null,
    physicalWidth?: number | null,
    physicalHeight?: number | null,
  ): void;
  onClipboardPaste?(content: ClipboardData): Promise<void>;
}
interface TerminationInfo {
  reason(): string;
}
interface ClipboardData {
  items(): ClipboardItem[];
  addText(mimeType: string, text: string): void;
  addBinary(mimeType: string, binary: Uint8Array): void;
  isEmpty(): boolean;
}
interface ClipboardItem {
  mimeType(): string;
  value(): string;
}
interface RDPConfig {
  username: string;
  password: string;
  domain?: string;
  width: number;
  height: number;
  enable_tls: boolean;
  enable_credssp: boolean;
  enable_nla: boolean;
}
declare global {
  interface Window {
    IronRDPBridge: IronRDPWASMBridge;
    initializeIronRDP: () => Promise<boolean>;
    onIronRDPReady?: () => void;
    createRDCleanPathProxy?: (
      hostname: string,
      port: number,
    ) => Promise<string>;
  }
}

const IRON_RDP_PKG = "/ironrdp-pkg/ironrdp_web.js";

// IronErrorKind values as exposed by the IronRDP wasm module's kind() method,
// indexed by the enum's numeric value.
const IRON_ERROR_KIND_NAMES = [
  "General",
  "WrongPassword",
  "LogonFailure",
  "AccessDenied",
  "RDCleanPath",
  "ProxyConnect",
  "NegotiationFailure",
] as const;

// User-facing message key per error kind. "General" is intentionally absent: it
// carries no structured detail, so its reason is read from the backtrace.
const IRON_ERROR_KIND_KEYS: Record<string, string> = {
  WrongPassword: "remoteAccess.rdpErrorWrongPassword",
  LogonFailure: "remoteAccess.rdpErrorLogonFailure",
  AccessDenied: "remoteAccess.rdpErrorAccessDenied",
  RDCleanPath: "remoteAccess.rdpErrorRDCleanPath",
  ProxyConnect: "remoteAccess.rdpErrorProxyConnect",
  NegotiationFailure: "remoteAccess.rdpErrorNegotiationFailure",
};

export type TranslatorFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export class IronRDPWASMBridge {
  private ironrdp: IronRDPModule | null = null;
  private initialized = false;
  private sessions = new Map<string, RDPSession>();
  private lastClipboardContent = "";
  private clipboardEventListeners: (() => void)[] = [];
  private t: TranslatorFn;

  constructor(t?: TranslatorFn) {
    this.t = t || ((key: string) => key);
  }

  // Expose clipboard sync method for input handler
  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      // @ts-ignore - Dynamic import from public directory
      const ironrdpModule = (await import(
        /* webpackIgnore: true */ IRON_RDP_PKG
      )) as IronRDPModule;
      try {
        if (ironrdpModule.default) {
          await ironrdpModule.default();
        }
      } catch (e) {
        if (ironrdpModule.init) {
          await ironrdpModule.init();
        }
      }
      if (ironrdpModule.setup) {
        try {
          ironrdpModule.setup("info");
        } catch (e) {
          console.warn("IronRDP log setup failed:", e);
        }
      }
      this.ironrdp = ironrdpModule;
      this.initialized = true;
      if (window.onIronRDPReady) {
        window.onIronRDPReady();
      }
    } catch (error) {
      console.error("Failed to load IronRDP WASM:", error);
      this.initialized = false;
    }
  }
  async connect(
    hostname: string,
    port: number,
    username: string,
    password: string,
    domain?: string,
    canvas?: HTMLCanvasElement,
    enableClipboard = true,
    netbirdClient?: {
      createRDPProxy: (hostname: string, port: string) => Promise<string>;
    },
    onSessionEnd?: (error: string | null, sessionId: string) => void,
    enableDisplayControl = false,
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!this.ironrdp) {
      throw new Error(this.t("remoteAccess.ironrdpModuleNotLoaded"));
    }
    const sessionId = `${hostname}:${port}_${Date.now()}`;
    try {
      const config: RDPConfig = {
        username,
        password,
        domain: domain || "",
        width: canvas?.width || 1024,
        height: canvas?.height || 768,
        enable_tls: true,
        enable_credssp: true,
        enable_nla: true,
      };
      const builder = new this.ironrdp.SessionBuilder();
      builder
        .username(username)
        .password(password)
        .destination(`${hostname}:${port}`);
      if (config.domain) {
        builder.serverDomain(config.domain);
      }
      const desktopSize = new this.ironrdp.DesktopSize(
        config.width,
        config.height,
      );
      builder.desktopSize(desktopSize);

      // Enable the Display Control dynamic channel so the desktop can be
      // resized in-session (Session.resize) instead of reconnecting. Gated to
      // hosts known to handle it (Windows); xrdp mishandles the reactivation.
      if (enableDisplayControl && this.ironrdp.Extension) {
        builder.extension(
          new this.ironrdp.Extension("display_control", true),
        );
      }
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
        }
        builder.renderCanvas(canvas);
      }
      builder.setCursorStyleCallback((style: string) => {});
      builder.setCursorStyleCallbackContext(null);
      if (enableClipboard) {
        this.setupClipboard(builder);
      }
      // RDCleanPath proxy is required for IronRDP
      if (!netbirdClient || !netbirdClient.createRDPProxy) {
        throw new Error(this.t("remoteAccess.rdpProxySupportRequired"));
      }
      const proxyURL = await netbirdClient.createRDPProxy(
        hostname,
        port.toString(),
      );
      builder.proxyAddress(proxyURL);
      builder.authToken("");
      const session = await builder.connect();
      this.sessions.set(sessionId, session);
      if (enableClipboard) {
        this.startClipboardEventListeners();
      }
      this.startSession(session, sessionId, onSessionEnd);
      return sessionId;
    } catch (error) {
      console.error(`IronRDP connection failed:`, error);
      this.logIronError(error);
      throw new Error(this.getReadableError(error));
    }
  }
  private setupClipboard(builder: SessionBuilder): void {
    if (!this.ironrdp?.ClipboardData) {
      console.warn("ClipboardData class not available in IronRDP module");
      return;
    }
    builder.remoteClipboardChangedCallback((clipboardData: ClipboardData) => {
      this.handleRemoteClipboard(clipboardData);
    });
    builder.forceClipboardUpdateCallback(() => {
      this.handleLocalClipboardRequest();
    });
  }

  private startSession(
    session: RDPSession,
    sessionId: string,
    onSessionEnd?: (error: string | null, sessionId: string) => void,
  ): void {
    session
      .run()
      .then((termInfo) => {
        this.cleanupSession(session, sessionId);
        onSessionEnd?.(null, sessionId);
      })
      .catch((err) => {
        console.error("IronRDP session error:", err);
        this.logIronError(err);
        this.cleanupSession(session, sessionId);
        onSessionEnd?.(this.getReadableError(err), sessionId);
      });
  }
  private cleanupSession(session: RDPSession, sessionId: string): void {
    this.sessions.delete(sessionId);

    // Stop clipboard event listeners if no active sessions
    if (this.sessions.size === 0) {
      this.stopClipboardEventListeners();
    }
  }
  private formatWSAError(wsaCode: number): string {
    const wsaKeys: Record<number, string> = {
      10004: "remoteAccess.wsaInterruptedSystemCall",
      10009: "remoteAccess.wsaBadFileDescriptor",
      10013: "remoteAccess.wsaPermissionDenied",
      10014: "remoteAccess.wsaBadAddress",
      10022: "remoteAccess.wsaInvalidArgument",
      10024: "remoteAccess.wsaTooManyOpenFiles",
      10035: "remoteAccess.wsaResourceTemporarilyUnavailable",
      10036: "remoteAccess.wsaOperationNowInProgress",
      10037: "remoteAccess.wsaOperationAlreadyInProgress",
      10038: "remoteAccess.wsaSocketOperationOnNonsocket",
      10039: "remoteAccess.wsaDestinationAddressRequired",
      10040: "remoteAccess.wsaMessageTooLong",
      10041: "remoteAccess.wsaProtocolWrongTypeForSocket",
      10042: "remoteAccess.wsaBadProtocolOption",
      10043: "remoteAccess.wsaProtocolNotSupported",
      10044: "remoteAccess.wsaSocketTypeNotSupported",
      10045: "remoteAccess.wsaOperationNotSupported",
      10046: "remoteAccess.wsaProtocolFamilyNotSupported",
      10047: "remoteAccess.wsaAddressFamilyNotSupported",
      10048: "remoteAccess.wsaAddressAlreadyInUse",
      10049: "remoteAccess.wsaCannotAssignRequestedAddress",
      10050: "remoteAccess.wsaNetworkIsDown",
      10051: "remoteAccess.wsaNetworkIsUnreachable",
      10052: "remoteAccess.wsaNetworkDroppedConnectionOnReset",
      10053: "remoteAccess.wsaSoftwareCausedConnectionAbort",
      10054: "remoteAccess.wsaConnectionResetByPeer",
      10055: "remoteAccess.wsaNoBufferSpaceAvailable",
      10056: "remoteAccess.wsaSocketIsAlreadyConnected",
      10057: "remoteAccess.wsaSocketIsNotConnected",
      10058: "remoteAccess.wsaCannotSendAfterSocketShutdown",
      10060: "remoteAccess.wsaConnectionTimedOut",
      10061: "remoteAccess.wsaConnectionRefused",
      10064: "remoteAccess.wsaHostIsDown",
      10065: "remoteAccess.wsaNoRouteToHost",
      10067: "remoteAccess.wsaTooManyProcesses",
      10091: "remoteAccess.wsaNetworkSubsystemUnavailable",
      10092: "remoteAccess.wsaWinsockVersionNotSupported",
      10093: "remoteAccess.wsaWSAStartupNotPerformed",
      10101: "remoteAccess.wsaGracefulShutdownInProgress",
      10109: "remoteAccess.wsaClassTypeNotFound",
      11001: "remoteAccess.wsaHostNotFound",
      11002: "remoteAccess.wsaNonauthoritativeHostNotFound",
      11003: "remoteAccess.wsaNonrecoverableError",
      11004: "remoteAccess.wsaValidNameNoDataRecord",
    };

    const key = wsaKeys[wsaCode];
    return key ? this.t(key) : this.t("remoteAccess.wsaUnknownError");
  }

  private formatRDCleanPathError(backtraceMsg: string): string {
    const wsaMatch = backtraceMsg.match(/WSA last error = (\d+)/);
    if (wsaMatch) {
      const wsaCode = parseInt(wsaMatch[1], 10);
      const description = this.formatWSAError(wsaCode);
      return this.t("remoteAccess.rdpErrorConnectionFailedWsa", {
        description,
        code: wsaCode,
      });
    }

    const httpMatch = backtraceMsg.match(/HTTP status code = (\d+)/);
    if (httpMatch) {
      return this.t("remoteAccess.rdpErrorConnectionFailedHttp", {
        code: httpMatch[1],
      });
    }

    return backtraceMsg;
  }

  private getReadableError(error: unknown): string {
    const ironError = error as any;
    if (ironError && ironError.__wbg_ptr) {
      try {
        if (typeof ironError.kind === "function") {
          const kindName = IRON_ERROR_KIND_NAMES[ironError.kind()];
          if (kindName && IRON_ERROR_KIND_KEYS[kindName]) {
            return this.t(IRON_ERROR_KIND_KEYS[kindName]);
          }
        }
        if (typeof ironError.backtrace === "function") {
          const backtrace = ironError.backtrace();
          const formatted = this.formatRDCleanPathError(backtrace);
          if (
            formatted.startsWith(this.t("remoteAccess.connectionFailed") + ":")
          ) {
            return formatted;
          }
          const reason = this.extractIronReason(backtrace);
          if (reason) {
            return this.t("remoteAccess.rdpSessionError", { reason });
          }
        }
      } catch {
        // Fall through to generic handling below.
      }
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return this.t("remoteAccess.rdpGenericError");
  }

  // extractIronReason pulls the human-readable reason out of an IronRDP
  // backtrace like `[IO channel] reason: unhandled PDU: "Update PDU"`. The
  // wasm error has no structured field for this, so General-kind errors can
  // only expose it as free text.
  private extractIronReason(backtrace: string): string {
    if (!backtrace) return "";
    const reasonMatch = backtrace.match(/reason:\s*(.+)/);
    if (reasonMatch) {
      return reasonMatch[1].trim();
    }
    return backtrace.replace(/^\[[^\]]*\]\s*/, "").trim();
  }

  private logIronError(error: unknown): void {
    const ironError = error as any;
    if (!ironError || !ironError.__wbg_ptr) return;
    try {
      if (ironError.backtrace) {
        const backtraceMsg = ironError.backtrace();
        const formattedMsg = this.formatRDCleanPathError(backtraceMsg);
        console.error("IronRDP error:", formattedMsg);
        console.debug("IronRDP backtrace:", backtraceMsg);
      }
      if (ironError.kind) {
        const errorKind = ironError.kind();
        const errorKindName = IRON_ERROR_KIND_NAMES[errorKind] || "Unknown";
        console.error("IronRDP error kind:", errorKindName, `(${errorKind})`);
      }
    } catch (e) {
      console.error("Could not extract IronError details:", e);
    }
  }
  getSession(sessionId: string): RDPSession | null {
    return this.sessions.get(sessionId) || null;
  }

  resize(sessionId: string, width: number, height: number): void {
    const session = this.sessions.get(sessionId);
    if (!session || typeof session.resize !== "function") return;
    session.resize(width, height);
  }

  disconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.shutdown) {
      session.shutdown();
    }
    this.sessions.delete(sessionId);

    // Stop clipboard event listeners if no active sessions
    if (this.sessions.size === 0) {
      this.stopClipboardEventListeners();
    }
  }
  private handleRemoteClipboard(clipboardData: ClipboardData): void {
    if (!navigator.clipboard?.writeText) {
      console.warn("Browser clipboard API not available");
      return;
    }
    if (!clipboardData.items) {
      console.error("clipboardData.items() method not found");
      return;
    }
    const items = clipboardData.items();
    if (items.length === 0) return;
    for (const item of items) {
      const mimeType = item.mimeType();
      const value = item.value();
      if (mimeType !== "text/plain") {
        continue;
      }
      navigator.clipboard
        .writeText(value)
        .then(() => {
          //this.showClipboardNotification("Clipboard updated from RDP");
        })
        .catch((err) => {
          console.error("Failed to copy to browser clipboard:", err);
          this.fallbackClipboardCopy(value);
        });
      return; // Only handle first text item
    }
  }
  private fallbackClipboardCopy(text: string): void {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (success) {
        //this.showClipboardNotification("Clipboard updated from RDP");
      }
    } catch (err) {
      console.error("Fallback clipboard error:", err);
    }
  }

  private async handleLocalClipboardRequest(): Promise<void> {
    if (!navigator.clipboard?.readText) {
      console.warn("Browser clipboard read API not available");
      return;
    }
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText !== this.lastClipboardContent) {
        await this.sendClipboardToRDP(clipboardText);
        this.lastClipboardContent = clipboardText;
      }
    } catch (err) {
      console.warn("Could not read from clipboard:", err);
    }
  }

  private async sendClipboardToRDP(text: string): Promise<void> {
    if (!this.ironrdp?.ClipboardData) return;

    for (const [sessionId, session] of this.sessions) {
      try {
        const clipboardData = new this.ironrdp.ClipboardData();
        clipboardData.addText("text/plain", text);

        if (session.onClipboardPaste) {
          await session.onClipboardPaste(clipboardData);
        }
        //this.showClipboardNotification("Clipboard sent to RDP");
      } catch (err) {
        console.error("Failed to send clipboard to RDP:", err);
      }
    }
  }
  private startClipboardEventListeners(): void {
    if (this.clipboardEventListeners.length > 0) return;

    // Listen for keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+X)
    const handleKeyboardShortcut = async (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        ["c", "x", "v"].includes(event.key.toLowerCase())
      ) {
        // For copy/cut operations, check clipboard after delay
        if (["c", "x"].includes(event.key.toLowerCase())) {
          setTimeout(async () => {
            await this.checkAndSendClipboard();
          }, 100);
        }
        // For paste, check immediately to ensure up-to-date content
        else if (event.key.toLowerCase() === "v") {
          await this.checkAndSendClipboard();
        }
      }
    };

    // Listen for clipboard events (more reliable when available)
    const handleClipboardChange = async () => {
      await this.checkAndSendClipboard();
    };

    // Listen for focus events - check clipboard when window regains focus
    const handleFocus = async () => {
      await this.checkAndSendClipboard();
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyboardShortcut);
    document.addEventListener("copy", handleClipboardChange);
    document.addEventListener("cut", handleClipboardChange);
    window.addEventListener("focus", handleFocus);

    // Store cleanup functions
    this.clipboardEventListeners = [
      () => document.removeEventListener("keydown", handleKeyboardShortcut),
      () => document.removeEventListener("copy", handleClipboardChange),
      () => document.removeEventListener("cut", handleClipboardChange),
      () => window.removeEventListener("focus", handleFocus),
    ];
  }

  private stopClipboardEventListeners(): void {
    this.clipboardEventListeners.forEach((cleanup) => cleanup());
    this.clipboardEventListeners = [];
  }

  public async checkAndSendClipboard(): Promise<void> {
    if (!navigator.clipboard?.readText) return;

    if (!/Chrome/.test(navigator.userAgent)) {
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText !== this.lastClipboardContent) {
        await this.sendClipboardToRDP(clipboardText);
        this.lastClipboardContent = clipboardText;
      }
    } catch (err) {
      // Ignore clipboard read errors - might be due to focus/permission issues
    }
  }
}
if (typeof window !== "undefined") {
  window.IronRDPBridge = new IronRDPWASMBridge();
  window.initializeIronRDP = async function (): Promise<boolean> {
    try {
      await window.IronRDPBridge.initialize();
      return true;
    } catch (error) {
      console.error("Failed to initialize IronRDP:", error);
      return false;
    }
  };
}
