# Laviius Driver

The commercial freight driver app for Laviius. Continues the workflow handed
off from the Dispatcher Console / Carrier Portal (shipment assigned → driver
& vehicle set) through pickup, transport, delivery, and proof of delivery.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full information
architecture, API contract, offline sync design, and accessibility/security
notes.

## Stack

React Native · Expo (Router) · TypeScript · NativeWind · TanStack Query ·
Zustand · React Hook Form · Zod · Expo Camera/Location/Notifications ·
offline-first (AsyncStorage-persisted stores + a replayable sync queue).

## Getting started

```bash
npm install
npm run start   # then press i / a / w, or scan the QR code in Expo Go
```

The app runs fully on mock data out of the box (`src/api/mockData.ts`) — no
backend required for local development. Point `EXPO_PUBLIC_API_URL` at a
real Laviius API and flip `USE_MOCK = false` in `src/api/client.ts` to go
live; no screen or store code needs to change, since they only ever talk to
the API client / TanStack Query layer.

## Structure

```
src/
  app/                 expo-router screens (file-based routing)
    (tabs)/            Home, Today's Jobs, Messages, Profile
    job/[id]/           the guided pickup → delivery → POD workflow
    messages/[threadId] shipment/carrier conversation
  components/          ui/ (primitives), job/ (domain widgets)
  domain/              workflow state machine, checklists, selectors
  stores/              Zustand: auth, shipments, messages, sync queue, connectivity
  api/                 mock data, client, TanStack Query hooks
  lib/                 location, notifications, photo compression, offline sync
  types/               shipment, driver, messaging domain models
  constants/theme.ts   design tokens (color, spacing, type scale)
```
