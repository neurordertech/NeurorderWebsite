console.log("[KARDACH] app/js/kardach.js loaded");

(() => {
  "use strict";

  const KARDACH_VERSION = "1.0.0";
  const DEVICE_TABLE = "nous_devices";

  const OPTIONAL_BLE_SERVICES = [
    "battery_service",
    "device_information",
    "heart_rate"
  ];

  const Kardach = {
    version: KARDACH_VERSION,
    supabase: null,
    session: null,

    network: {
      online: navigator.onLine,
      connection: null
    },

    bluetooth: {
      supported: "bluetooth" in navigator,
      device: null,
      server: null,
      connected: false,
      services: [],
      batteryLevel: null
    },

    trustedDevices: [],
    nearbyDevices: [],
    elements: {},

    settings: {
      presenceEnabled: false,
      notificationsEnabled: false,
      wakePhraseEnabled: false
    },

    async initialise() {
      console.log("[KARDACH] Initialising...", {
        version: this.version
      });

      this.cacheElements();
      this.loadLocalSettings();
      this.renderAutomationSettings();

      this.initialiseNetwork();
      this.initialiseBluetooth();
      this.attachEvents();

      await this.initialiseSupabase();
      await this.loadSession();
      await this.loadProfile();
      await this.loadTrustedDevices();

      this.renderNearbyDevices();
      this.renderPresence();

      console.log("[KARDACH] Ready");
    },

    /* =====================================================
       DOM
       ===================================================== */

    cacheElements() {
      const byId = (id) => document.getElementById(id);

      this.elements.networkStatus = byId("network-status");
      this.elements.bluetoothStatus = byId("bluetooth-status");
      this.elements.presenceStatus = byId("presence-status");
      this.elements.nearbyCount = byId("nearby-count");
      this.elements.scanBluetooth = byId("scan-bluetooth");
      this.elements.scanNetwork = byId("scan-network");
      this.elements.trustedList = byId("trusted-device-list");
      this.elements.nearbyList = byId("nearby-device-list");

      this.elements.presenceEnabled = byId("presence-enabled");
      this.elements.notificationsEnabled = byId("notifications-enabled");
      this.elements.wakePhraseEnabled = byId("wakephrase-enabled");

      this.elements.profileButton = byId("profile-button");
      this.elements.profileAvatar = byId("profile-avatar");
      this.elements.profileName = byId("profile-name");
      this.elements.profileOrganisation = byId("profile-organisation");
    },

    escapeHTML(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    },

    formatStatus(status) {
      if (!status) {
        return "Offline";
      }

      return String(status)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
    },

    /* =====================================================
       SUPABASE + SESSION
       ===================================================== */

    async initialiseSupabase() {
      this.supabase = window.NOUS_SUPABASE || null;

      if (!this.supabase) {
        console.error("[KARDACH] Supabase unavailable.");
        return;
      }

      console.log("[KARDACH] Supabase connected");
    },

    async loadSession() {
      if (!this.supabase) {
        return;
      }

      try {
        const {
          data: { session },
          error
        } = await this.supabase.auth.getSession();

        if (error) {
          throw error;
        }

        this.session = session || null;

        console.log("[KARDACH] Session", {
          authenticated: Boolean(session?.user),
          userId: session?.user?.id || null
        });
      } catch (error) {
        console.error("[KARDACH] Session error", error);
      }
    },

    async loadProfile() {
      const user = this.session?.user;

      if (!user) {
        return;
      }

      const metadata = user.user_metadata || {};

      const displayName =
        metadata.display_name ||
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "NOUS Member";

      const organisation =
        metadata.organisation_name ||
        metadata.organisation ||
        metadata.company ||
        "NOUS";

      const avatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        "";

      if (this.elements.profileName) {
        this.elements.profileName.textContent = displayName;
      }

      if (this.elements.profileOrganisation) {
        this.elements.profileOrganisation.textContent = organisation;
      }

      if (this.elements.profileAvatar) {
        if (avatarUrl) {
          this.elements.profileAvatar.src = avatarUrl;
          this.elements.profileAvatar.alt = `${displayName} profile picture`;
        } else if (this.elements.profileAvatar.tagName === "IMG") {
          this.elements.profileAvatar.alt = `${displayName} profile`;
        }
      }

      this.elements.profileButton?.addEventListener("click", () => {
        window.location.href = "./identity.html";
      });
    },

    /* =====================================================
       NETWORK MANAGER
       ===================================================== */

    initialiseNetwork() {
      this.network.online = navigator.onLine;
      this.network.connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection ||
        null;

      this.renderNetwork();
    },

    renderNetwork() {
      if (!this.elements.networkStatus) {
        return;
      }

      this.elements.networkStatus.textContent =
        this.network.online ? "Connected" : "Offline";
    },

    checkNetwork() {
      this.network.online = navigator.onLine;
      this.network.connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection ||
        null;

      this.renderNetwork();

      const connection = this.network.connection;

      console.log("[KARDACH NETWORK]", {
        online: this.network.online,
        type: connection?.type || "Unavailable",
        effectiveType: connection?.effectiveType || "Unavailable",
        downlink: connection?.downlink ?? "Unavailable",
        rtt: connection?.rtt ?? "Unavailable"
      });

      const message = this.network.online
        ? "NOUS Kardach is connected to a network."
        : "NOUS Kardach is offline.";

      alert(message);
    },

    /* =====================================================
       BLUETOOTH MANAGER (NOUS KARDACH)
       ===================================================== */

    initialiseBluetooth() {
      this.bluetooth.supported = "bluetooth" in navigator;
      this.renderBluetooth();
    },

    renderBluetooth() {
      if (!this.elements.bluetoothStatus) {
        return;
      }

      if (!this.bluetooth.supported) {
        this.elements.bluetoothStatus.textContent = "Unavailable";
        return;
      }

      this.elements.bluetoothStatus.textContent =
        this.bluetooth.connected ? "Connected" : "Ready";
    },

    async scanBluetooth() {
      if (!this.bluetooth.supported) {
        alert("NOUS Kardach Bluetooth is not supported by this browser.");
        return;
      }

      const button = this.elements.scanBluetooth;

      if (button) {
        button.disabled = true;
        button.textContent = "Searching...";
      }

      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: OPTIONAL_BLE_SERVICES
        });

        this.bluetooth.device = device;
        this.addNearbyDevice(device, "available");

        console.log("[KARDACH DEVICE]", {
          id: device.id,
          name: device.name || "Unnamed Bluetooth device"
        });

        device.addEventListener(
          "gattserverdisconnected",
          () => this.handleBluetoothDisconnect(device)
        );

        await this.connectBluetooth();
        await this.registerBluetoothDevice(device);
      } catch (error) {
        if (error?.name === "NotFoundError") {
          console.log("[KARDACH] Bluetooth selection cancelled.");
          return;
        }

        if (error?.name === "SecurityError") {
          console.error("[KARDACH] Bluetooth security error", error);
          alert(
            "Bluetooth access was blocked. Open NOUS from localhost or HTTPS and allow Bluetooth permission."
          );
          return;
        }

        console.error("[KARDACH SCAN ERROR]", error);
        alert(error?.message || "NOUS Kardach could not access Bluetooth.");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = "Scan Bluetooth";
        }
      }
    },

    async connectBluetooth() {
      const device = this.bluetooth.device;

      if (!device?.gatt) {
        console.log("[KARDACH] Selected device has no accessible GATT interface.");
        return null;
      }

      try {
        const server = await device.gatt.connect();

        this.bluetooth.server = server;
        this.bluetooth.connected = Boolean(server.connected);

        console.log("[KARDACH CONNECTED]", {
          name: device.name || "Unnamed Bluetooth device",
          connected: server.connected
        });

        this.renderBluetooth();
        this.updateNearbyDeviceStatus(device.id, "connected");

        await this.discoverServices();
        await this.tryReadBatteryLevel();

        return server;
      } catch (error) {
        this.bluetooth.connected = false;
        this.bluetooth.server = null;
        this.renderBluetooth();

        console.warn("[KARDACH CONNECTION ERROR]", error);
        return null;
      }
    },

    async discoverServices() {
      const server = this.bluetooth.server;

      if (!server?.connected) {
        return [];
      }

      try {
        const services = await server.getPrimaryServices();

        this.bluetooth.services = services;

        console.log(
          "[KARDACH SERVICES]",
          services.map((service) => service.uuid)
        );

        return services;
      } catch (error) {
        this.bluetooth.services = [];
        console.warn("[KARDACH SERVICE DISCOVERY]", error);
        return [];
      }
    },

    async tryReadBatteryLevel() {
      const server = this.bluetooth.server;

      if (!server?.connected) {
        return null;
      }

      try {
        const service = await server.getPrimaryService("battery_service");
        const characteristic = await service.getCharacteristic("battery_level");
        const value = await characteristic.readValue();
        const percentage = value.getUint8(0);

        this.bluetooth.batteryLevel = percentage;

        console.log("[KARDACH BATTERY]", `${percentage}%`);
        return percentage;
      } catch (error) {
        this.bluetooth.batteryLevel = null;
        console.log(
          "[KARDACH BATTERY] Battery Service is not available on this device."
        );
        return null;
      }
    },

    async handleBluetoothDisconnect(device) {
      if (this.bluetooth.device?.id === device.id) {
        this.bluetooth.connected = false;
        this.bluetooth.server = null;
        this.bluetooth.services = [];
        this.renderBluetooth();
      }

      this.updateNearbyDeviceStatus(device.id, "offline");

      await this.updateRegisteredDeviceStatus(device.id, "offline");

      console.log("[KARDACH DISCONNECTED]", {
        id: device.id,
        name: device.name || "Unnamed Bluetooth device"
      });
    },

    /* =====================================================
       NEARBY DEVICE MANAGER
       ===================================================== */

    addNearbyDevice(device, status = "available") {
      const existingIndex = this.nearbyDevices.findIndex(
        (item) => item.id === device.id
      );

      const record = {
        id: device.id,
        name: device.name || "Unnamed Bluetooth device",
        transport: "bluetooth",
        status,
        lastSeenAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        this.nearbyDevices[existingIndex] = {
          ...this.nearbyDevices[existingIndex],
          ...record
        };
      } else {
        this.nearbyDevices.unshift(record);
      }

      this.renderNearbyDevices();
    },

    updateNearbyDeviceStatus(deviceId, status) {
      const device = this.nearbyDevices.find((item) => item.id === deviceId);

      if (!device) {
        return;
      }

      device.status = status;
      device.lastSeenAt = new Date().toISOString();
      this.renderNearbyDevices();
    },

    renderNearbyDevices() {
      if (this.elements.nearbyCount) {
        this.elements.nearbyCount.textContent = String(this.nearbyDevices.length);
      }

      if (!this.elements.nearbyList) {
        return;
      }

      if (!this.nearbyDevices.length) {
        this.elements.nearbyList.innerHTML = `
          <p>Scan Bluetooth to discover nearby devices.</p>
        `;
        return;
      }

      this.elements.nearbyList.innerHTML = this.nearbyDevices
        .map((device) => {
          const name = this.escapeHTML(device.name);
          const status = this.escapeHTML(this.formatStatus(device.status));
          const transport = this.escapeHTML(device.transport.toUpperCase());

          return `
            <article class="trusted-device nearby-device">
              <div>
                <small>${transport}</small>
                <strong>${name}</strong>
                <span>${status}</span>
              </div>
              <span
                class="trusted-device-status ${
                  device.status === "connected" ? "is-connected" : ""
                }"
                aria-label="${status}"
                title="${status}"
              ></span>
            </article>
          `;
        })
        .join("");
    },

    /* =====================================================
       TRUSTED DEVICE MANAGER
       ===================================================== */

    async loadTrustedDevices() {
      if (!this.supabase || !this.elements.trustedList) {
        return;
      }

      const user = this.session?.user;

      if (!user) {
        this.elements.trustedList.innerHTML = `
          <p>Sign in to view trusted devices.</p>
        `;
        return;
      }

      try {
        const { data, error } = await this.supabase
          .from(DEVICE_TABLE)
          .select("*")
          .eq("user_id", user.id)
          .eq("trusted", true)
          .order("last_seen_at", { ascending: false });

        if (error) {
          throw error;
        }

        this.trustedDevices = Array.isArray(data) ? data : [];
        this.renderTrustedDevices();
        this.renderPresence();
      } catch (error) {
        console.error("[KARDACH TRUSTED DEVICES]", error);

        this.elements.trustedList.innerHTML = `
          <p>NOUS Kardach could not load trusted devices.</p>
        `;
      }
    },

    renderTrustedDevices() {
      if (!this.elements.trustedList) {
        return;
      }

      if (!this.trustedDevices.length) {
        this.elements.trustedList.innerHTML = `
          <p>No trusted devices yet.</p>
        `;
        return;
      }

      this.elements.trustedList.innerHTML = this.trustedDevices
        .map((device) => {
          const name = this.escapeHTML(device.device_name || "Unnamed device");
          const transport = this.escapeHTML(
            (device.transport || "device").toUpperCase()
          );
          const status = device.status || "offline";
          const statusLabel = this.escapeHTML(this.formatStatus(status));
          const deviceId = this.escapeHTML(device.id);

          return `
            <article class="trusted-device" data-device-id="${deviceId}">
              <div>
                <small>${transport}</small>
                <strong>${name}</strong>
                <span>${statusLabel}</span>
              </div>

              <span
                class="trusted-device-status ${
                  status === "connected" ? "is-connected" : ""
                }"
                aria-label="${statusLabel}"
                title="${statusLabel}"
              ></span>
            </article>
          `;
        })
        .join("");
    },

    async registerBluetoothDevice(device) {
      if (!this.supabase) {
        console.error("[KARDACH] Supabase unavailable; device not registered.");
        return null;
      }

      const user = this.session?.user;

      if (!user) {
        alert("You must be signed in to register a device with NOUS Kardach.");
        return null;
      }

      const now = new Date().toISOString();
      const deviceName = device.name || "Unnamed Bluetooth device";

      try {
        const { data: existingRows, error: lookupError } = await this.supabase
          .from(DEVICE_TABLE)
          .select("*")
          .eq("user_id", user.id)
          .eq("device_identifier", device.id)
          .limit(1);

        if (lookupError) {
          throw lookupError;
        }

        const existing = existingRows?.[0] || null;

        if (existing) {
          const { data, error } = await this.supabase
            .from(DEVICE_TABLE)
            .update({
              device_name: deviceName,
              transport: "bluetooth",
              trusted: true,
              status: this.bluetooth.connected ? "connected" : "available",
              presence_enabled: this.settings.presenceEnabled,
              notifications_enabled: this.settings.notificationsEnabled,
              wake_phrase_enabled: this.settings.wakePhraseEnabled,
              app_version: this.version,
              last_seen_at: now
            })
            .eq("id", existing.id)
            .eq("user_id", user.id)
            .select()
            .single();

          if (error) {
            throw error;
          }

          console.log("[KARDACH DEVICE UPDATED]", data);
          await this.loadTrustedDevices();
          return data;
        }

        const { data, error } = await this.supabase
          .from(DEVICE_TABLE)
          .insert({
            user_id: user.id,
            device_name: deviceName,
            device_type: "other",
            platform: "web",
            app_version: this.version,
            presence_enabled: this.settings.presenceEnabled,
            notifications_enabled: this.settings.notificationsEnabled,
            wake_phrase_enabled: this.settings.wakePhraseEnabled,
            last_seen_at: now,
            transport: "bluetooth",
            device_identifier: device.id,
            trusted: true,
            status: this.bluetooth.connected ? "connected" : "available"
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        console.log("[KARDACH DEVICE REGISTERED]", data);
        await this.loadTrustedDevices();
        return data;
      } catch (error) {
        console.error("[KARDACH DEVICE REGISTER ERROR]", error);

        const diagnostic = {
          message: error?.message || "Unknown error",
          code: error?.code || null,
          details: error?.details || null,
          hint: error?.hint || null
        };

        console.log("[KARDACH DEVICE REGISTER DETAILS]", diagnostic);
        alert(`NOUS Kardach could not register the device.\n\n${diagnostic.message}`);
        return null;
      }
    },

    async updateRegisteredDeviceStatus(deviceIdentifier, status) {
      const user = this.session?.user;

      if (!this.supabase || !user || !deviceIdentifier) {
        return;
      }

      try {
        const { error } = await this.supabase
          .from(DEVICE_TABLE)
          .update({
            status,
            last_seen_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("device_identifier", deviceIdentifier);

        if (error) {
          throw error;
        }

        await this.loadTrustedDevices();
      } catch (error) {
        console.warn("[KARDACH DEVICE STATUS]", error);
      }
    },

    /* =====================================================
       PRESENCE + AUTOMATION SETTINGS
       ===================================================== */

    loadLocalSettings() {
      try {
        const raw = localStorage.getItem("nous-kardach-settings");
        const saved = raw ? JSON.parse(raw) : {};

        this.settings.presenceEnabled = Boolean(saved.presenceEnabled);
        this.settings.notificationsEnabled = Boolean(saved.notificationsEnabled);
        this.settings.wakePhraseEnabled = Boolean(saved.wakePhraseEnabled);
      } catch (error) {
        console.warn("[KARDACH SETTINGS] Could not load settings", error);
      }
    },

    saveLocalSettings() {
      try {
        localStorage.setItem(
          "nous-kardach-settings",
          JSON.stringify(this.settings)
        );
      } catch (error) {
        console.warn("[KARDACH SETTINGS] Could not save settings", error);
      }
    },

    renderAutomationSettings() {
      if (this.elements.presenceEnabled) {
        this.elements.presenceEnabled.checked = this.settings.presenceEnabled;
      }

      if (this.elements.notificationsEnabled) {
        this.elements.notificationsEnabled.checked =
          this.settings.notificationsEnabled;
      }

      if (this.elements.wakePhraseEnabled) {
        this.elements.wakePhraseEnabled.checked = this.settings.wakePhraseEnabled;
      }
    },

    renderPresence() {
      if (!this.elements.presenceStatus) {
        return;
      }

      if (!this.settings.presenceEnabled) {
        this.elements.presenceStatus.textContent = "Disabled";
        return;
      }

      const connected =
        this.bluetooth.connected ||
        this.trustedDevices.some((device) => device.status === "connected");

      this.elements.presenceStatus.textContent = connected
        ? "Detected"
        : "Waiting";
    },

    async syncAutomationSettingsToCurrentDevice() {
      const device = this.bluetooth.device;
      const user = this.session?.user;

      if (!this.supabase || !user || !device?.id) {
        return;
      }

      try {
        const { error } = await this.supabase
          .from(DEVICE_TABLE)
          .update({
            presence_enabled: this.settings.presenceEnabled,
            notifications_enabled: this.settings.notificationsEnabled,
            wake_phrase_enabled: this.settings.wakePhraseEnabled,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("device_identifier", device.id);

        if (error) {
          throw error;
        }
      } catch (error) {
        console.warn("[KARDACH SETTINGS SYNC]", error);
      }
    },

    async updateAutomationSetting(key, value) {
      this.settings[key] = Boolean(value);
      this.saveLocalSettings();
      this.renderPresence();
      await this.syncAutomationSettingsToCurrentDevice();
    },

    /* =====================================================
       EVENTS
       ===================================================== */

    attachEvents() {
      window.addEventListener("online", () => {
        this.network.online = true;
        this.renderNetwork();
      });

      window.addEventListener("offline", () => {
        this.network.online = false;
        this.renderNetwork();
      });

      this.network.connection?.addEventListener?.("change", () => {
        this.initialiseNetwork();
      });

      this.elements.scanNetwork?.addEventListener("click", () => {
        this.checkNetwork();
      });

      this.elements.scanBluetooth?.addEventListener("click", () => {
        this.scanBluetooth();
      });

      this.elements.presenceEnabled?.addEventListener("change", (event) => {
        this.updateAutomationSetting("presenceEnabled", event.target.checked);
      });

      this.elements.notificationsEnabled?.addEventListener("change", (event) => {
        this.updateAutomationSetting(
          "notificationsEnabled",
          event.target.checked
        );
      });

      this.elements.wakePhraseEnabled?.addEventListener("change", (event) => {
        this.updateAutomationSetting("wakePhraseEnabled", event.target.checked);
      });
    }
  };

  window.NOUS_KARDACH = Kardach;

  function bootKardach() {
    Kardach.initialise().catch((error) => {
      console.error("[KARDACH BOOT ERROR]", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootKardach, { once: true });
  } else {
    bootKardach();
  }

  /*
=========================================================
KARDACH PUBLIC BRIDGE
Personal / Business / Education → Kardach
=========================================================
*/

window.NOUS_KARDACH = window.NOUS_KARDACH || {};

window.NOUS_KARDACH.connectDevice = async function (
  category = "other"
) {
  if (!("bluetooth" in navigator)) {
    throw new Error(
      "Bluetooth is not supported by this browser."
    );
  }

  const typeMap = {
    "Smart home": "smart_home",
    "Wearable": "watch",
    "Vehicle": "vehicle",
    "Custom device": "other"
  };

  const deviceType =
    typeMap[category] ||
    "other";

  console.log(
    "[NOUS KARDACH] Starting connection",
    {
      category,
      deviceType
    }
  );

  /*
   * IMPORTANT:
   * Do not filter by battery_service here.
   * That caused the empty endless scan earlier.
   */

  const device =
    await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,

      optionalServices: [
        "battery_service",
        "device_information"
      ]
    });

  console.log(
    "[NOUS KARDACH DEVICE]",
    {
      id: device.id,
      name:
        device.name ||
        "Unnamed device",
      category
    }
  );

  let server = null;

  if (device.gatt) {
    try {
      server =
        await device.gatt.connect();

      console.log(
        "[NOUS KARDACH CONNECTED]",
        {
          device:
            device.name ||
            "Unnamed device",

          connected:
            server.connected
        }
      );
    } catch (error) {
      console.warn(
        "[NOUS KARDACH GATT]",
        error
      );
    }
  }

  /*
   * Use the existing Kardach registration
   * function if it is available.
   */

  if (
    typeof window.NOUS_KARDACH
      .registerDevice === "function"
  ) {
    await window.NOUS_KARDACH
      .registerDevice(
        device,
        {
          deviceType,
          category,
          transport:
            "bluetooth"
        }
      );
  }

  return {
    device,
    server,
    category,
    deviceType
  };
};

})();
