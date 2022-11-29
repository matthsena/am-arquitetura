import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

let PUBLIC_KEY =
  "pk_dev_DkFDQPJ08uKcb9WS_PPFX9TQEi96QgQFA9qGwnzTXa6AGAP3H2m7t5rQv_be83l8";

if (!/^pk_(live|test)/.test(PUBLIC_KEY)) {
  console.warn(
    `Replace "${PUBLIC_KEY}" by your public key from https://liveblocks.io/dashboard/apikeys.\n` +
      `Learn more: https://github.com/liveblocks/liveblocks/tree/main/examples/react-dashboard#getting-started.`
  );
}

overrideApiKey();

const client = createClient({
  publicApiKey: PUBLIC_KEY
});

export const {
  suspense: {
    useHistory,
    useOthers,
    useStorage,
    useMutation,
    RoomProvider,
    useSelf
  }
} = createRoomContext(client);

/**
 * This function is used when deploying an example on liveblocks.io.
 * You can ignore it completely if you run the example locally.
 */
function overrideApiKey() {
  const query = new URLSearchParams(window?.location?.search);
  const apiKey = query.get("apiKey");

  if (apiKey) {
    PUBLIC_KEY = apiKey;
  }
}
