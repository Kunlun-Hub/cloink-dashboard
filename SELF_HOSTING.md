# Self-hosted runtime endpoints

The Dashboard does not automatically read NetBird announcements or release
metadata. Analytics is disabled unless explicitly enabled.

Set the following container variables when needed:

| Variable                    | Default         | Purpose                                                                                           |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `NETBIRD_WASM_PATH`         | `/netbird.wasm` | Browser VPN client used by Web SSH and Web RDP. Point this to the Cloink WASM service.            |
| `NETBIRD_WASM_EXEC_PATH`    | `/wasm_exec.js` | Go runtime matching the self-hosted WASM build.                                                   |
| `NETBIRD_ANNOUNCEMENTS_URL` | empty           | Optional private announcement JSON endpoint.                                                      |
| `NETBIRD_RELEASES_URL`      | empty           | Optional private release JSON endpoint.                                                           |
| `NETBIRD_ANALYTICS_ENABLED` | `false`         | Enables configured GA, GTM and Hotjar integrations. Keep `false` for no analytics return traffic. |

For a dedicated WASM hostname:

```env
NETBIRD_WASM_PATH=https://wasm.example.com/netbird.wasm
NETBIRD_WASM_EXEC_PATH=https://wasm.example.com/wasm_exec.js
NETBIRD_ANNOUNCEMENTS_URL=
NETBIRD_RELEASES_URL=
NETBIRD_ANALYTICS_ENABLED=false
```

The WASM image and its build instructions live in
`cloink-server/client/wasm/`.
