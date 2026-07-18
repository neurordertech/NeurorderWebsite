(() => {
    const state = {
        registered: localStorage.getItem("nous_registered") === "true",
        membership: localStorage.getItem("nous_membership") === "active"
    };

    function ensureModal() {
        let modal = document.getElementById("nousPaywall");
        if (modal) return modal;
        modal = document.createElement("div");
        modal.id = "nousPaywall";
        modal.className = "nous-paywall-backdrop";
        modal.hidden = true;
        modal.innerHTML = `
            <section class="nous-paywall" role="dialog" aria-modal="true" aria-labelledby="nousPaywallTitle">
                <p class="nous-paywall-kicker">NOUS MEMBERSHIP</p>
                <h2 id="nousPaywallTitle">Connect to Nous.</h2>
                <p>Profiles, dashboards and connected applications remain available as basic tools. Live Nous intelligence requires a registered account and an active membership.</p>
                <div class="nous-paywall-actions">
                    <button type="button" id="nousRegisterButton">Register interest</button>
                    <button type="button" class="secondary" id="nousMembershipButton">Membership coming soon</button>
                    <button type="button" class="secondary" id="nousPaywallClose">Continue with basic tools</button>
                </div>
                <p class="nous-paywall-note">Development builds on localhost can activate test access from the status button.</p>
            </section>`;
        document.body.appendChild(modal);
        modal.querySelector("#nousPaywallClose").addEventListener("click", () => modal.hidden = true);
        modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; });
        modal.querySelector("#nousRegisterButton").addEventListener("click", () => {
            state.registered = true;
            localStorage.setItem("nous_registered", "true");
            modal.querySelector("#nousRegisterButton").textContent = "Interest registered";
            updateChip();
        });
        return modal;
    }

    function updateChip() {
        const chip = document.getElementById("nousAccessChip");
        if (!chip) return;
        chip.innerHTML = state.membership ? "<strong>Nous Member</strong>" : state.registered ? "Registered • Basic access" : "Guest • Basic access";
    }

    function ensureChip() {
        if (document.getElementById("nousAccessChip")) return;
        const chip = document.createElement("button");
        chip.id = "nousAccessChip";
        chip.type = "button";
        chip.className = "nous-access-chip";
        chip.addEventListener("click", () => {
            if (["127.0.0.1", "localhost"].includes(location.hostname)) {
                state.membership = !state.membership;
                localStorage.setItem("nous_membership", state.membership ? "active" : "inactive");
                updateChip();
            } else {
                ensureModal().hidden = false;
            }
        });
        document.body.appendChild(chip);
        updateChip();
    }

    window.NousAccess = {
        canUseAI() { return state.registered && state.membership; },
        requireAI() {
            if (this.canUseAI()) return true;
            ensureModal().hidden = false;
            return false;
        },
        showPaywall() { ensureModal().hidden = false; },
        enableDevelopmentMembership() {
            state.registered = true;
            state.membership = true;
            localStorage.setItem("nous_registered", "true");
            localStorage.setItem("nous_membership", "active");
            updateChip();
        }
    };

    document.addEventListener("DOMContentLoaded", () => { ensureModal(); ensureChip(); });
})();
