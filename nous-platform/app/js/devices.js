console.log(
  "[NOUS FILE] app/js/devices.js loaded"
);

(() => {
  "use strict";

  const networkStatus =
    document.getElementById(
      "network-status"
    );

  const bluetoothStatus =
    document.getElementById(
      "bluetooth-status"
    );

  const scanBluetoothButton =
    document.getElementById(
      "scan-bluetooth"
    );

  const scanNetworkButton =
    document.getElementById(
      "scan-network"
    );

  const trustedDeviceList =
    document.getElementById(
      "trusted-device-list"
    );

  /*
   * ---------------------------------------------------------
   * Utility
   * ---------------------------------------------------------
   */

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatStatus(status) {
    if (!status) {
      return "Offline";
    }

    return status
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  /*
   * ---------------------------------------------------------
   * Network
   * ---------------------------------------------------------
   */

  function updateNetworkStatus() {
    if (!networkStatus) {
      return;
    }

    networkStatus.textContent =
      navigator.onLine
        ? "Connected"
        : "Offline";
  }

  function checkNetwork() {
    const online =
      navigator.onLine;

    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    updateNetworkStatus();

    console.log(
      "[NOUS NETWORK]",
      {
        online,

        type:
          connection?.type ||
          "Unavailable",

        effectiveType:
          connection?.effectiveType ||
          "Unavailable",

        downlink:
          connection?.downlink ||
          "Unavailable",

        rtt:
          connection?.rtt ||
          "Unavailable"
      }
    );

    let message =
      online
        ? "NOUS is connected to a network."
        : "NOUS is currently offline.";

    if (
      online &&
      connection?.effectiveType
    ) {
      message +=
        ` Connection quality: ${connection.effectiveType}.`;
    }

    alert(message);
  }

  /*
   * ---------------------------------------------------------
   * Bluetooth availability
   * ---------------------------------------------------------
   */

  function updateBluetoothStatus() {
    if (!bluetoothStatus) {
      return;
    }

    bluetoothStatus.textContent =
      "bluetooth" in navigator
        ? "Available"
        : "Not supported";
  }

  /*
   * ---------------------------------------------------------
   * Load trusted devices from Supabase
   * ---------------------------------------------------------
   */

  async function loadTrustedDevices() {
    const client =
      window.NOUS_SUPABASE;

    if (
      !client ||
      !trustedDeviceList
    ) {
      return;
    }

    try {
      const {
        data: {
          session
        },
        error: sessionError
      } =
        await client.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        trustedDeviceList.innerHTML = `
          <p>
            Sign in to view trusted devices.
          </p>
        `;

        return;
      }

      const {
        data: devices,
        error
      } =
        await client
          .from("nous_devices")
          .select("*")
          .eq(
            "user_id",
            session.user.id
          )
          .eq(
            "trusted",
            true
          )
          .order(
            "last_seen_at",
            {
              ascending: false
            }
          );

      if (error) {
        throw error;
      }

      if (!devices?.length) {
        trustedDeviceList.innerHTML = `
          <p>
            No trusted devices yet.
          </p>
        `;

        return;
      }

      trustedDeviceList.innerHTML =
        devices
          .map(
            (device) => {
              const deviceName =
                escapeHTML(
                  device.device_name ||
                  "Unnamed device"
                );

              const transport =
                escapeHTML(
                  device.transport ||
                  "device"
                );

              const status =
                device.status ||
                "offline";

              const statusLabel =
                escapeHTML(
                  formatStatus(status)
                );

              const isConnected =
                status ===
                "connected";

              return `
                <article
                  class="trusted-device"
                  data-device-id="${escapeHTML(
                    device.id
                  )}"
                >
                  <div>
                    <small>
                      ${transport.toUpperCase()}
                    </small>

                    <strong>
                      ${deviceName}
                    </strong>

                    <span>
                      ${statusLabel}
                    </span>
                  </div>

                  <span
                    class="trusted-device-status ${
                      isConnected
                        ? "is-connected"
                        : ""
                    }"
                    aria-label="${statusLabel}"
                    title="${statusLabel}"
                  ></span>
                </article>
              `;
            }
          )
          .join("");

    } catch (error) {
      console.error(
        "[NOUS DEVICES LOAD ERROR]",
        error
      );

      trustedDeviceList.innerHTML = `
        <p>
          NOUS could not load your trusted devices.
        </p>
      `;
    }
  }

  /*
   * ---------------------------------------------------------
   * Register or update Bluetooth device
   * ---------------------------------------------------------
   */

  async function registerBluetoothDevice(
    device
  ) {
    const client =
      window.NOUS_SUPABASE;

    if (!client) {
      console.error(
        "[NOUS DEVICES] Supabase client is unavailable."
      );

      alert(
        "NOUS could not reach the device service."
      );

      return;
    }

    try {
      const {
        data: {
          session
        },
        error: sessionError
      } =
        await client.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.user) {
        alert(
          "You must be signed in to register a device."
        );

        return;
      }

      const user =
        session.user;

      const deviceIdentifier =
        device.id;

      const deviceName =
        device.name ||
        "Unnamed Bluetooth device";

      /*
       * Check if this device already exists
       * for the current user.
       */

      const {
        data: existingDevices,
        error: existingError
      } =
        await client
          .from("nous_devices")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "device_identifier",
            deviceIdentifier
          )
          .limit(1);

      if (existingError) {
        throw existingError;
      }

      const existingDevice =
        existingDevices?.[0] ||
        null;

      /*
       * Existing device:
       * update it instead of creating a duplicate.
       */

      if (existingDevice) {
        const {
          data: updatedDevice,
          error: updateError
        } =
          await client
            .from("nous_devices")
            .update({
              device_name:
                deviceName,

              transport:
                "bluetooth",

              trusted:
                true,

              status:
                "connected",

              last_seen_at:
                new Date()
                  .toISOString()
            })
            .eq(
              "id",
              existingDevice.id
            )
            .eq(
              "user_id",
              user.id
            )
            .select()
            .single();

        if (updateError) {
          throw updateError;
        }

        console.log(
          "[NOUS DEVICE UPDATED]",
          updatedDevice
        );

        await loadTrustedDevices();

        return;
      }

      /*
       * New device.
       *
       * Web Bluetooth does not reliably tell us
       * whether this is a phone, watch, mouse, etc.
       * So device_type is stored as "other" for now.
       */

      const {
        data: registeredDevice,
        error: insertError
      } =
        await client
          .from("nous_devices")
          .insert({
            user_id:
              user.id,

            device_name:
              deviceName,

            device_type:
              "other",

            platform:
              "web",

            app_version:
              "1.0.0",

            transport:
              "bluetooth",

            device_identifier:
              deviceIdentifier,

            trusted:
              true,

            status:
              "connected",

            last_seen_at:
              new Date()
                .toISOString()
          })
          .select()
          .single();

      if (insertError) {
        throw insertError;
      }

      console.log(
        "[NOUS DEVICE REGISTERED]",
        registeredDevice
      );

      await loadTrustedDevices();

    } catch (error) {
      console.error(
        "[NOUS DEVICE REGISTER ERROR]",
        error
      );

      const diagnostic = {
        message:
          error?.message ||
          "Unknown error",

        code:
          error?.code ||
          null,

        details:
          error?.details ||
          null,

        hint:
          error?.hint ||
          null
      };

      console.log(
        "[NOUS DEVICE REGISTER ERROR DETAILS]",
        diagnostic
      );

      alert(
        JSON.stringify(
          diagnostic,
          null,
          2
        )
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * Bluetooth scan + GATT connection
   * ---------------------------------------------------------
   */

  async function scanBluetooth() {
    if (!("bluetooth" in navigator)) {
      alert(
        "Bluetooth is not supported by this browser."
      );

      return;
    }

    if (scanBluetoothButton) {
      scanBluetoothButton.disabled =
        true;

      scanBluetoothButton.textContent =
        "Searching...";
    }

    try {
      /*
       * Step 1:
       * User chooses a Bluetooth device.
       */

    const device =
    await navigator.bluetooth.requestDevice({
        filters: [
        {
            services: [
            "battery_service"
            ]
        }
        ]
    });

      console.log(
        "[NOUS BLUETOOTH DEVICE]",
        {
          id:
            device.id,

          name:
            device.name ||
            "Unnamed device"
        }
      );

      /*
       * Step 2:
       * Attempt a real GATT connection.
       */

      if (device.gatt) {
        try {
          const server =
            await device.gatt.connect();

          console.log(
            "[NOUS GATT CONNECTED]",
            {
              device:
                device.name ||
                "Unnamed device",

              connected:
                server.connected
            }
          );

          /*
           * Step 3:
           * Ask the BLE device for primary services
           * that this page is authorised to access.
           */

          const services =
            await server.getPrimaryServices();

          console.log(
            "[NOUS GATT SERVICES]",
            services.map(
              (service) =>
                service.uuid
            )
          );

        } catch (gattError) {
          console.warn(
            "[NOUS GATT CONNECTION FAILED]",
            gattError
          );
        }
      } else {
        console.log(
          "[NOUS GATT]",
          "Selected device does not expose a GATT interface."
        );
      }

      /*
       * Step 4:
       * Register/update the device in Supabase.
       */

      await registerBluetoothDevice(
        device
      );

    } catch (error) {
      if (
        error?.name ===
        "NotFoundError"
      ) {
        console.log(
          "[NOUS BLUETOOTH] Device selection cancelled."
        );

        return;
      }

      if (
        error?.name ===
        "SecurityError"
      ) {
        console.error(
          "[NOUS BLUETOOTH SECURITY ERROR]",
          error
        );

        alert(
          "Bluetooth access was blocked. Open NOUS from localhost or HTTPS."
        );

        return;
      }

      console.error(
        "[NOUS BLUETOOTH ERROR]",
        error
      );

      alert(
        error?.message ||
        "NOUS could not access the Bluetooth device."
      );

    } finally {
      if (scanBluetoothButton) {
        scanBluetoothButton.disabled =
          false;

        scanBluetoothButton.textContent =
          "Scan Bluetooth";
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * Browser events
   * ---------------------------------------------------------
   */

  window.addEventListener(
    "online",
    updateNetworkStatus
  );

  window.addEventListener(
    "offline",
    updateNetworkStatus
  );

  scanNetworkButton?.addEventListener(
    "click",
    checkNetwork
  );

  scanBluetoothButton?.addEventListener(
    "click",
    scanBluetooth
  );

  /*
   * ---------------------------------------------------------
   * Initial page state
   * ---------------------------------------------------------
   */

  updateNetworkStatus();
  updateBluetoothStatus();
  loadTrustedDevices();
})();