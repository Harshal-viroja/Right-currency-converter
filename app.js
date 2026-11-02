
const API_PRIMARY =
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1";

const API_FALLBACK =
    "https://latest.currency-api.pages.dev/v1";

const fromCurr = document.querySelector("#from-currency");
const toCurr = document.querySelector("#to-currency");
const amountInput = document.querySelector("#amount");
const form = document.querySelector("#converter-form");
const msg = document.querySelector(".msg");
const btn = document.querySelector(".convert-btn");
const swapBtn = document.querySelector("#swap-btn");

const fromFlag = document.querySelector(".from-flag");
const toFlag = document.querySelector(".to-flag");

// Fetch JSON with fallback API
async function fetchJSON(endpoint) {
    const urls = [
        `${API_PRIMARY}/${endpoint}`,
        `${API_FALLBACK}/${endpoint}`
    ];

    let lastError;

    for (const url of urls) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            lastError = error;
            console.warn(`API failed: ${url}`, error);
        }
    }

    throw lastError;
}

// Load all supported currencies
async function loadCurrencies() {
    try {
        msg.innerText = "Loading currencies...";

        const data = await fetchJSON("currencies.json");

        const currencies = Object.entries(data)
            .filter(([code]) => /^[a-z]{3}$/.test(code))
            .sort(([a], [b]) => a.localeCompare(b));

        fromCurr.innerHTML = "";
        toCurr.innerHTML = "";

        currencies.forEach(([code, name]) => {
            const option1 = document.createElement("option");
            const option2 = document.createElement("option");

            option1.value = code.toUpperCase();
            option1.textContent =
                `${code.toUpperCase()} - ${name}`;

            option2.value = code.toUpperCase();
            option2.textContent =
                `${code.toUpperCase()} - ${name}`;

            fromCurr.appendChild(option1);
            toCurr.appendChild(option2);
        });

        fromCurr.value = "USD";
        toCurr.value = "INR";

        updateFlags();
        await updateExchangeRate();

    } catch (error) {
        console.error("Currency loading error:", error);
        msg.innerText = "Unable to load currencies. Refresh the page.";
    }
}

// Update currency flags
function updateFlags() {
    const fromCode = fromCurr.value;
    const toCode = toCurr.value;

    const fromCountry = countryList[fromCode];
    const toCountry = countryList[toCode];

    fromFlag.hidden = !fromCountry;
    toFlag.hidden = !toCountry;

    if (fromCountry) {
        fromFlag.src =
            `https://flagsapi.com/${fromCountry}/flat/64.png`;
        fromFlag.alt = `${fromCode} flag`;
    }

    if (toCountry) {
        toFlag.src =
            `https://flagsapi.com/${toCountry}/flat/64.png`;
        toFlag.alt = `${toCode} flag`;
    }
}

// Convert currency
async function updateExchangeRate() {
    const amount = Number(amountInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        msg.innerText = "Please enter a valid amount greater than zero.";
        amountInput.focus();
        return;
    }

    const from = fromCurr.value.toLowerCase();
    const to = toCurr.value.toLowerCase();

    if (!from || !to) return;

    if (from === to) {
        msg.innerText =
            `${amount} ${from.toUpperCase()} = ${amount.toFixed(2)} ${to.toUpperCase()}`;
        return;
    }

    try {
        btn.disabled = true;
        msg.innerText = "Fetching exchange rate...";

        // Fetch rates based on the source currency
        const data = await fetchJSON(`currencies/${from}.json`);

        const rate = data[from]?.[to];

        if (typeof rate !== "number" || !Number.isFinite(rate)) {
            throw new Error("Exchange rate unavailable for this currency pair.");
        }

        const result = amount * rate;

        const formattedResult = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(result);

        const formattedRate = new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 6
        }).format(rate);

        msg.innerText =
            `${amount} ${from.toUpperCase()} = ${formattedResult} ${to.toUpperCase()}`;

        console.log("Exchange rate:", formattedRate);
        console.log("API date:", data.date);

    } catch (error) {
        console.error("Conversion error:", error);
        msg.innerText =
            "Unable to fetch exchange rate. Please try again.";

    } finally {
        btn.disabled = false;
    }
}

// Form submission
form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateExchangeRate();
});

// Update when currency changes
fromCurr.addEventListener("change", () => {
    updateFlags();
    updateExchangeRate();
});

toCurr.addEventListener("change", () => {
    updateFlags();
    updateExchangeRate();
});

// Update when amount changes
amountInput.addEventListener("change", updateExchangeRate);

// Swap currencies
swapBtn.addEventListener("click", () => {
    const temp = fromCurr.value;

    fromCurr.value = toCurr.value;
    toCurr.value = temp;

    updateFlags();
    updateExchangeRate();
});

// Start application
loadCurrencies();
