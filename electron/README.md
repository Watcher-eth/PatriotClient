# Patriot Desktop

The Electron shell for Patriot lives inside `/Users/watcher/Desktop/Patri0t/patriotclient`.

## What it does

- reuses the existing Patriot React UI as the renderer
- embeds a desktop `field_sensor`
- pairs with the control plane through `patriot-desktop://pair?...`
- advertises local capabilities dynamically based on host readiness

## Desktop sensor capability model

Always available when paired:

- `lan_access`
- `local_subnet_recon`
- `arp_neighbors`
- `bonjour_mdns_scan`
- `gateway_fingerprint`

Conditionally available:

- `nmap_scan` only when `nmap` is installed and detected on the host

## Local development

Run the Next.js app and Electron together:

```bash
cd /Users/watcher/Desktop/Patri0t/patriotclient
npm install
npm run dev
PATRIOT_DESKTOP_START_URL=http://127.0.0.1:3000 npm run desktop:start
```

## Packaging

```bash
cd /Users/watcher/Desktop/Patri0t/patriotclient
npm install
npm run build
npm run desktop:pack
```

