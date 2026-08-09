console.log(
  "[NOUS FILE] app/js/personal.js loaded"
);


(() => {
  "use strict";


  /* =========================================================
     APPLIC’ALPHA CONFIGURATION
  ========================================================= */

  const STORAGE_KEY =
    "nous-applic-alpha";


  const MAX_APPS =
    6;


  const DEFAULT_APPS = [
    "Instagram",
    "WhatsApp",
    "TikTok",
    "YouTube",
    "Facebook",
    "Bolt"
  ];


  const APPLICATIONS = {

    Instagram: {
      short:
        "IG",

      description:
        "Visual sharing and communication",

      url:
        "https://www.instagram.com/"
    },


    WhatsApp: {
      short:
        "WA",

      description:
        "Messages and everyday communication",

      url:
        "https://web.whatsapp.com/"
    },


    TikTok: {
      short:
        "TT",

      description:
        "Short video and discovery",

      url:
        "https://www.tiktok.com/"
    },


    YouTube: {
      short:
        "YT",

      description:
        "Video, learning and entertainment",

      url:
        "https://www.youtube.com/"
    },


    Facebook: {
      short:
        "FB",

      description:
        "Communities and social updates",

      url:
        "https://www.facebook.com/"
    },


    Bolt: {
      short:
        "BT",

      description:
        "Mobility and transport",

      url:
        "https://bolt.eu/"
    },


    "Mr D": {
      short:
        "MD",

      description:
        "Food and everyday delivery",

      url:
        "https://www.mrd.com/"
    },


    Sixty60: {
      short:
        "60",

      description:
        "Groceries and rapid delivery",

      url:
        "https://www.checkers.co.za/sixty60"
    },


    LinkedIn: {
      short:
        "IN",

      description:
        "Professional communication",

      url:
        "https://www.linkedin.com/"
    },


    Spotify: {
      short:
        "SP",

      description:
        "Music, podcasts and audio",

      url:
        "https://open.spotify.com/"
    },


    Netflix: {
      short:
        "NX",

      description:
        "Streaming and entertainment",

      url:
        "https://www.netflix.com/"
    },


    X: {
      short:
        "X",

      description:
        "Public conversations and updates",

      url:
        "https://x.com/"
    }

  };


  /* =========================================================
     INITIALISE
  ========================================================= */

  function initialisePersonalPage() {

    /* =====================================================
       ELEMENTS
    ====================================================== */

    const openIotButton =
      document.getElementById(
        "open-iot-panel"
      );


    const openAppsButton =
      document.getElementById(
        "open-apps-panel"
      );


    const iotPanel =
      document.getElementById(
        "iot-panel"
      );


    const appsPanel =
      document.getElementById(
        "apps-panel"
      );


    const iotNotice =
      document.getElementById(
        "iot-notice"
      );


    const appsNotice =
      document.getElementById(
        "apps-notice"
      );


    const selectedAppGrid =
      document.getElementById(
        "selected-app-grid"
      );


    const availableAppGrid =
      document.getElementById(
        "available-app-grid"
      );


    const deviceButtons =
      document.querySelectorAll(
        "[data-device]"
      );


    let selectedApps =
      loadApplications();


    /* =====================================================
       DEBUG
    ====================================================== */

    console.log(
      "[NOUS PERSONAL] Elements",
      {
        openIotButton:
          Boolean(
            openIotButton
          ),

        openAppsButton:
          Boolean(
            openAppsButton
          ),

        iotPanel:
          Boolean(
            iotPanel
          ),

        appsPanel:
          Boolean(
            appsPanel
          )
      }
    );


    /* =====================================================
       APPLIC’ALPHA STORAGE
    ====================================================== */

    function loadApplications() {

      try {

        const stored =
          window.localStorage.getItem(
            STORAGE_KEY
          );


        const parsed =
          stored
            ? JSON.parse(
                stored
              )
            : null;


        if (
          Array.isArray(
            parsed
          )
        ) {

          const valid =
            parsed.filter(
              (name) =>
                APPLICATIONS[
                  name
                ]
            );


          if (
            valid.length
          ) {

            return valid.slice(
              0,
              MAX_APPS
            );
          }
        }


      } catch (error) {

        console.warn(
          "[NOUS PERSONAL] Could not load Applic’alpha:",
          error
        );

      }


      return [
        ...DEFAULT_APPS
      ];
    }


    function saveApplications() {

      try {

        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            selectedApps
          )
        );


      } catch (error) {

        console.warn(
          "[NOUS PERSONAL] Could not save Applic’alpha:",
          error
        );

      }
    }


    /* =====================================================
       PANELS
    ====================================================== */

    function openPanel(
      panel,
      trigger
    ) {

      if (!panel) {

        console.error(
          "[NOUS PERSONAL] Panel not found."
        );

        return;
      }


      /*
       * Close the other panel first.
       */

      if (
        panel !==
          iotPanel &&
        iotPanel
          ?.classList
          .contains(
            "is-open"
          )
      ) {

        closePanel(
          iotPanel
        );
      }


      if (
        panel !==
          appsPanel &&
        appsPanel
          ?.classList
          .contains(
            "is-open"
          )
      ) {

        closePanel(
          appsPanel
        );
      }


      panel.classList.add(
        "is-open"
      );


      panel.setAttribute(
        "aria-hidden",
        "false"
      );


      trigger?.setAttribute(
        "aria-expanded",
        "true"
      );


      document.body.style.overflow =
        "hidden";
    }


    function closePanel(
      panel
    ) {

      if (!panel) {
        return;
      }


      panel.classList.remove(
        "is-open"
      );


      panel.setAttribute(
        "aria-hidden",
        "true"
      );


      if (
        panel ===
        iotPanel
      ) {

        openIotButton
          ?.setAttribute(
            "aria-expanded",
            "false"
          );
      }


      if (
        panel ===
        appsPanel
      ) {

        openAppsButton
          ?.setAttribute(
            "aria-expanded",
            "false"
          );
      }


      if (
        !iotPanel
          ?.classList
          .contains(
            "is-open"
          ) &&
        !appsPanel
          ?.classList
          .contains(
            "is-open"
          )
      ) {

        document.body.style.overflow =
          "";
      }
    }


    /* =====================================================
       APPLIC’ALPHA
    ====================================================== */

    function renderSelectedApps() {

      if (
        !selectedAppGrid
      ) {
        return;
      }


      selectedAppGrid.innerHTML =
        "";


      selectedApps.forEach(
        (appName) => {

          const application =
            APPLICATIONS[
              appName
            ];


          if (
            !application
          ) {
            return;
          }


          const button =
            document.createElement(
              "button"
            );


          button.className =
            "selected-app";


          button.type =
            "button";


          button.innerHTML = `
            <span class="app-icon">
              ${application.short}
            </span>

            <strong>
              ${appName}
            </strong>
          `;


          button.addEventListener(
            "click",
            () => {

              window.open(
                application.url,
                "_blank",
                "noopener,noreferrer"
              );

            }
          );


          selectedAppGrid.appendChild(
            button
          );

        }
      );
    }


    function renderAvailableApps() {

      if (
        !availableAppGrid
      ) {
        return;
      }


      availableAppGrid.innerHTML =
        "";


      Object.entries(
        APPLICATIONS
      ).forEach(
        ([
          appName,
          application
        ]) => {

          const button =
            document.createElement(
              "button"
            );


          const selected =
            selectedApps.includes(
              appName
            );


          button.className =
            "available-app-button";


          if (
            selected
          ) {

            button.classList.add(
              "is-selected"
            );
          }


          button.type =
            "button";


          button.innerHTML = `
            <strong>
              ${appName}
            </strong>

            <span>
              ${application.description}
            </span>
          `;


          button.addEventListener(
            "click",
            () => {

              toggleApplication(
                appName
              );

            }
          );


          availableAppGrid.appendChild(
            button
          );

        }
      );
    }


    function toggleApplication(
      appName
    ) {

      const currentIndex =
        selectedApps.indexOf(
          appName
        );


      if (
        currentIndex !==
        -1
      ) {

        selectedApps.splice(
          currentIndex,
          1
        );


        if (
          appsNotice
        ) {

          appsNotice.textContent =
            `${appName} was removed from Applic’alpha.`;
        }


      } else if (
        selectedApps.length <
        MAX_APPS
      ) {

        selectedApps.push(
          appName
        );


        if (
          appsNotice
        ) {

          appsNotice.textContent =
            `${appName} was added to Applic’alpha.`;
        }


      } else {

        const replaced =
          selectedApps.shift();


        selectedApps.push(
          appName
        );


        if (
          appsNotice
        ) {

          appsNotice.textContent =
            `${appName} replaced ${replaced} in your everyday six.`;
        }
      }


      saveApplications();

      renderSelectedApps();

      renderAvailableApps();
    }


    /* =====================================================
       KARDACH / IoT
    ====================================================== */

    async function connectThroughKardach(
      category,
      button
    ) {

      deviceButtons.forEach(
        (deviceButton) => {

          deviceButton.classList.remove(
            "is-selected"
          );

        }
      );


      button?.classList.add(
        "is-selected"
      );


      if (
        iotNotice
      ) {

        iotNotice.textContent =
          `Preparing ${category.toLowerCase()} connection…`;
      }


      const kardach =
        window.NOUS_KARDACH;


      /*
       * Kardach may not be loaded on the Personal
       * page yet. In that case send the user to the
       * dedicated Kardach workspace instead.
       */

      if (
        !kardach ||
        typeof kardach.scanBluetooth !==
          "function"
      ) {

        console.info(
          "[NOUS PERSONAL] Opening Kardach workspace",
          {
            category
          }
        );


        const url =
          new URL(
            "./kardach.html",
            window.location.href
          );


        url.searchParams.set(
          "category",
          category
        );


        window.location.href =
          url.href;


        return;
      }


      try {

        kardach.requestedCategory =
          category;


        if (
          iotNotice
        ) {

          iotNotice.textContent =
            `Searching for nearby ${category.toLowerCase()} devices…`;
        }


        await kardach.scanBluetooth();


        const connectedDevice =
          kardach.currentDevice;


        const connectedServer =
          kardach.currentServer;


        if (
          !connectedDevice
        ) {

          if (
            iotNotice
          ) {

            iotNotice.textContent =
              "Device selection cancelled.";
          }


          return;
        }


        const deviceName =
          connectedDevice.name ||
          "Unnamed device";


        if (
          connectedServer?.connected
        ) {

          if (
            iotNotice
          ) {

            iotNotice.textContent =
              `${deviceName} connected through NOUS Kardach.`;
          }


        } else {

          if (
            iotNotice
          ) {

            iotNotice.textContent =
              `${deviceName} was added to NOUS Kardach.`;
          }
        }


        console.info(
          "[NOUS PERSONAL → KARDACH COMPLETE]",
          {
            category,

            device:
              deviceName,

            connected:
              Boolean(
                connectedServer?.connected
              )
          }
        );


      } catch (error) {

        if (
          error?.name ===
          "NotFoundError"
        ) {

          if (
            iotNotice
          ) {

            iotNotice.textContent =
              "Device selection cancelled.";
          }


          return;
        }


        console.error(
          "[NOUS PERSONAL → KARDACH ERROR]",
          error
        );


        if (
          iotNotice
        ) {

          iotNotice.textContent =
            error?.message ||
            "NOUS Kardach could not connect to this device.";
        }
      }
    }


    /* =====================================================
       MAIN BUTTONS
    ====================================================== */

    if (
      openIotButton
    ) {

      openIotButton.addEventListener(
        "click",
        (event) => {

          event.preventDefault();


          console.log(
            "[NOUS PERSONAL] Opening IoT panel"
          );


          openPanel(
            iotPanel,
            openIotButton
          );

        }
      );

    } else {

      console.error(
        "[NOUS PERSONAL] #open-iot-panel not found."
      );
    }


    if (
      openAppsButton
    ) {

      openAppsButton.addEventListener(
        "click",
        (event) => {

          event.preventDefault();


          console.log(
            "[NOUS PERSONAL] Opening Applic’alpha"
          );


          renderSelectedApps();

          renderAvailableApps();


          openPanel(
            appsPanel,
            openAppsButton
          );

        }
      );

    } else {

      console.error(
        "[NOUS PERSONAL] #open-apps-panel not found."
      );
    }


    /* =====================================================
       CLOSE BUTTONS
    ====================================================== */

    document
      .querySelectorAll(
        "[data-close-panel]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            (event) => {

              event.preventDefault();


              const panelId =
                button.getAttribute(
                  "data-close-panel"
                );


              if (
                !panelId
              ) {
                return;
              }


              closePanel(
                document.getElementById(
                  panelId
                )
              );

            }
          );

        }
      );


    /* =====================================================
       IoT CATEGORY BUTTONS
    ====================================================== */

    deviceButtons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          async () => {

            const category =
              button.getAttribute(
                "data-device"
              );


            if (
              !category
            ) {
              return;
            }


            await connectThroughKardach(
              category,
              button
            );

          }
        );

      }
    );


    /* =====================================================
       KEYBOARD
    ====================================================== */

    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key !==
          "Escape"
        ) {
          return;
        }


        if (
          appsPanel
            ?.classList
            .contains(
              "is-open"
            )
        ) {

          closePanel(
            appsPanel
          );


          return;
        }


        if (
          iotPanel
            ?.classList
            .contains(
              "is-open"
            )
        ) {

          closePanel(
            iotPanel
          );
        }

      }
    );


    /* =====================================================
       INITIAL RENDER
    ====================================================== */

    renderSelectedApps();


    console.info(
      "[NOUS PERSONAL] Ready.",
      {
        selectedApps:
          selectedApps.length,

        deviceCategories:
          deviceButtons.length
      }
    );
  }


  /* =========================================================
     BOOT
  ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialisePersonalPage,
      {
        once: true
      }
    );


  } else {

    initialisePersonalPage();

  }

})();