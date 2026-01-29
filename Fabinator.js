// ==================================
// Quixel Megascans Auto-Licensing Script
// ==================================

(function() {
    'use strict';

    // Configuration and State
    const config = {
        itemSelector: '.fabkit-Stack-root.nTa5u2sc',
        freeTextIndicator: 'Free',
        cartButtonSelector: '.fabkit-Button-root[aria-label*="cart"]',
        modalCloseButtonSelector: '.fabkit-XButton-root.fabkit-Modal-closeButton',
        professionalRadioId: ':r1l:',
        personalRadioId: ':r1i:',
        confirmButtonSelector: '.fabkit-Button-root.fabkit-Button--primary',
        priceTextClass: 'fabkit-Typography-root.fabkit-Typography--align-start.fabkit-Typography--intent-primary.fabkit-Text--lg.fabkit-Text--bold',
        modalStackSelector: '.fabkit-Stack-root.nTa5u2sc',
        highlightColor: '#00d9ff',
        guiBackgroundColor: '#0a1929',
        guiAccentColor: '#00d9ff',
        processingDelay: 1500,
        modalOpenDelay: 800,
        scrollDelay: 300
    };

    const state = {
        isRunning: false,
        isPaused: false,
        processedItems: new Set(),
        counters: {
            professional: 0,
            personal: 0,
            skipped: 0,
            total: 0
        },
        currentItemIndex: 0,
        personalLicenseAlternatively: false
    };

    // ===================
    // Utility Functions
    // ===================

    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}]`;
        const logEntry = { message, type, timestamp };
        
        if (type === 'error') {
            console.error(prefix, message);
        } else if (type === 'warn') {
            console.warn(prefix, message);
        } else {
            console.log(prefix, message);
        }
        
        updateLogDisplay(logEntry);
    }

    function waitFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    function simulateClick(element) {
        if (!element) return false;
        
        const events = [
            new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }),
            new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }),
            new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
        ];
        
        events.forEach(event => element.dispatchEvent(event));
        return true;
    }

    function triggerPressEvent(element) {
        if (!element) return false;
        
        // Try clicking the radio button directly
        if (element.tagName === 'INPUT' && element.type === 'radio') {
            element.checked = true;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        simulateClick(element);
        return true;
    }

    // ===================
    // Item Processing
    // ===================

    function highlightItem(item, active = true) {
        if (active) {
            item.style.outline = `3px solid ${config.highlightColor}`;
            item.style.outlineOffset = '4px';
            item.style.boxShadow = `0 0 20px ${config.highlightColor}80, inset 0 0 20px ${config.highlightColor}30`;
            item.style.transition = 'all 0.3s ease-in-out';
            item.style.position = 'relative';
            item.style.zIndex = '1000';
            
            // Scroll into view
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            item.style.outline = '';
            item.style.outlineOffset = '';
            item.style.boxShadow = '';
            item.style.zIndex = '';
        }
    }

    function checkIfItemIsFree(item) {
            try {
      log("Checking if item is free...", "info");

      // Look for the price section that contains "From" and "Free" as siblings
      const priceContainers = item.querySelectorAll(".fabkit-Stack-root");
      log(`Found ${priceContainers.length} stack containers in item`, "info");

      for (let container of priceContainers) {
        const textDivs = container.querySelectorAll(".fabkit-Typography-root");
        let hasFrom = false;
        let hasFree = false;
        let texts = [];

        for (let div of textDivs) {
          const text = div.textContent.trim();
          texts.push(text);
          if (text === "From") {
            hasFrom = true;
          }
          if (text === "Free" || text.startsWith("Free")) {
            hasFree = true;
          }
        }

        if (texts.length > 0) {
          log(`Container texts: [${texts.join(", ")}]`, "info");
        }

        if (hasFrom && hasFree) {
          log(
            `✓ Item is free: Found "From Free" pattern in same container`,
            "success",
          );
          return true;
        }
      }

      // Alternative: Look for "From" followed by "Free" in adjacent divs
      const allTypography = item.querySelectorAll(".fabkit-Typography-root");
      log(`Total typography elements: ${allTypography.length}`, "info");

      for (let i = 0; i < allTypography.length - 1; i++) {
        const currentText = allTypography[i].textContent.trim();
        const nextText = allTypography[i + 1].textContent.trim();

        if (
          currentText === "From" &&
          (nextText === "Free" || nextText.startsWith("Free"))
        ) {
          log(
            `✓ Item is free: Found "From Free" in adjacent elements`,
            "success",
          );
          return true;
        }
      }

      log('✗ Item is not free: No "From Free" pattern found', "warn");
      return false;
    } catch (error) {
      log(`Error checking if item is free: ${error.message}`, "error");
      return false;
    }
    }

    function findShoppingCartButton(item) {
        try {
            const buttons = item.querySelectorAll('button[aria-label*="cart"], button[aria-label*="Cart"]');
            for (let button of buttons) {
                const icon = button.querySelector('.edsicon-shopping-cart-plus');
                if (icon) {
                    return button;
                }
            }
            return null;
        } catch (error) {
            log(`Error finding shopping cart button: ${error.message}`, 'error');
            return null;
        }
    }

    async function processModalLicenseSelection() {
        try {
        log("Waiting for license modal to open...", "info");
        await waitForElement(".fabkit-Modal-root", 3000);
        log("Modal appeared", "success");

        const modal = document.querySelector(".fabkit-Modal-root");

        if (!modal) {
            log("Modal not found!", "error");
            return false;
        }

        const formFields = modal.querySelectorAll(".fabkit-FormField-root");

        /*if (formFields.length < 2) {
            log("License options not found", "error");
            await closeModalIfOpen();
            return false;
            }*/

        let professionalSection = null;
        let personalSection = null;

        formFields.forEach((field) => {
            const label = field.querySelector("label");
            if (label && label.textContent.trim() === "Professional") {
            professionalSection = field;
            } else if (label && label.textContent.trim() === "Personal") {
            personalSection = field;
            }
        });

        if (!professionalSection || !personalSection) {
            log("Professional or Personal section not found", "error");
            await closeModalIfOpen();
            return false;
        }

        // Check Professional License
        const professionalPriceElements = professionalSection.querySelectorAll(
            `.${config.priceTextClass.split(" ").join(".")}`,
        );

        const professionalIsFree = Array.from(professionalPriceElements).some(
            (el) => el.textContent.trim().toLowerCase() === "free",
        );

        // Check Personal License
        const personalPriceElements = personalSection.querySelectorAll(
            `.${config.priceTextClass.split(" ").join(".")}`,
        );

        const personalIsFree = Array.from(personalPriceElements).some(
            (el) => el.textContent.trim().toLowerCase() === "free",
        );

        log(
            `Professional: ${professionalIsFree ? "FREE" : "paid"}`,
            professionalIsFree ? "success" : "warning",
        );
        log(
            `Personal: ${personalIsFree ? "FREE" : "paid"}`,
            personalIsFree ? "success" : "warning",
        );

        // Decision Logic (from working script)
        if (professionalIsFree) {
            log("Selecting Professional license", "info");
            const professionalRadio = professionalSection.querySelector(
            'input[type="radio"]',
            );
            if (professionalRadio) {
            professionalRadio.click();
            await waitFor(300);

            const addButton = modal.querySelector(config.confirmButtonSelector);
            if (addButton && !addButton.disabled) {
                addButton.click();
                log("Added to library (Professional)", "success");
                state.counters.professional++;
                updateCounters();
                await waitFor(1000);
                return true;
            }
            }
            log("Error adding to library", "error");
            await closeModalIfOpen();
            return false;
        } else if (!professionalIsFree && !state.personalLicenseAlternatively) {
            log("Professional not free and no alternative desired", "warning");
            await closeModalIfOpen();
            return false;
        } else if (personalIsFree) {
            log("Selecting Personal license as alternative", "info");
            const personalRadio = personalSection.querySelector(
            'input[type="radio"]',
            );
            if (personalRadio) {
            personalRadio.click();
            await waitFor(300);

            const addButton = modal.querySelector(config.confirmButtonSelector);
            if (addButton && !addButton.disabled) {
                addButton.click();
                log("Added to library (Personal)", "success");
                state.counters.personal++;
                updateCounters();
                await waitFor(1000);
                return true;
            }
            }
            log("Error adding to library", "error");
            await closeModalIfOpen();
            return false;
        } else {
            log("No free license available", "warning");
            await closeModalIfOpen();
            return false;
        }
        } catch (error) {
        log(`Error processing modal: ${error.message}`, "error");
        await closeModalIfOpen();
        return false;
        }
    }

    async function closeModalIfOpen() {
        const closeButton = document.querySelector(config.modalCloseButtonSelector);
        if (closeButton) {
        log("Closing modal...", "info");
        closeButton.click();
        await waitFor(500);
        }
    }

    async function processItem(item, index) {
        try {
            log(`Processing item ${index + 1}...`, 'info');
            state.counters.total++;
            
            // Highlight the item
            highlightItem(item, true);
            await waitFor(500);

            // Check if item is free
            if (!checkIfItemIsFree(item)) {
                log(`Item ${index + 1} is not free - skipping`, 'warn');
                highlightItem(item, false);
                state.counters.skipped++;
                updateCounters();
                return false;
            }

            // Find and click shopping cart button
            const cartButton = findShoppingCartButton(item);
            if (!cartButton) {
                log(`Item ${index + 1}: Shopping cart button not found - skipping`, 'error');
                highlightItem(item, false);
                state.counters.skipped++;
                updateCounters();
                return false;
            }

            log(`Item ${index + 1}: Clicking shopping cart button`, 'info');
            simulateClick(cartButton);
            
            // Wait for modal to open and process license selection
            await waitFor(config.modalOpenDelay);
            const success = await processModalLicenseSelection();

            // Remove highlight
            highlightItem(item, false);
            await waitFor(config.processingDelay);

            if (!success) {
                state.counters.skipped++;
                updateCounters();
            }

            return success;

        } catch (error) {
            log(`Error processing item ${index + 1}: ${error.message}`, 'error');
            highlightItem(item, false);
            state.counters.skipped++;
            updateCounters();
            return false;
        }
    }

    // ===================
    // Main Processing Loop
    // ===================

    async function processAllItems() {
        if (state.isRunning) {
            log('Processing already running', 'warn');
            return;
        }

        state.isRunning = true;
        state.isPaused = false;
        log('Starting automated licensing process...', 'info');
        updateStartButton();

        try {
            while (state.isRunning) {
                // Get all items
                const items = document.querySelectorAll(config.itemSelector);
                
                if (items.length === 0) {
                    log('No items found on page', 'warn');
                    break;
                }

                log(`Found ${items.length} items on page`, 'info');

                // Process items that haven't been processed yet
                let processedThisRound = 0;
                for (let i = state.currentItemIndex; i < items.length && state.isRunning; i++) {
                    const item = items[i];
                    const itemId = `item-${i}`;
                    
                    if (!state.processedItems.has(itemId)) {
                        await processItem(item, i);
                        state.processedItems.add(itemId);
                        state.currentItemIndex = i + 1;
                        processedThisRound++;
                    }

                    // Check for pause
                    while (state.isPaused && state.isRunning) {
                        await waitFor(500);
                    }
                }

                // Check if there are more items to load (infinite scroll)
                log('Checking for additional items...', 'info');
                await waitFor(config.scrollDelay);
                
                // Scroll to bottom to trigger loading more items
                window.scrollTo(0, document.body.scrollHeight);
                await waitFor(1000);

                const newItems = document.querySelectorAll(config.itemSelector);
                if (newItems.length === items.length) {
                    log('No new items loaded - processing complete', 'info');
                    break;
                }

                log(`New items detected (${newItems.length} total), continuing...`, 'info');
            }

        } catch (error) {
            log(`Fatal error in processing loop: ${error.message}`, 'error');
        } finally {
            state.isRunning = false;
            log('Processing stopped', 'info');
            updateStartButton();
        }
    }

    function stopProcessing() {
        if (state.isRunning) {
            log('Stopping process...', 'info');
            state.isRunning = false;
            state.isPaused = false;
            updateStartButton();
        }
    }

    function togglePause() {
        if (state.isRunning) {
            state.isPaused = !state.isPaused;
            log(state.isPaused ? 'Process paused' : 'Process resumed', 'info');
            updateStartButton();
        }
    }

    function resetCounters() {
        state.counters = {
            professional: 0,
            personal: 0,
            skipped: 0,
            total: 0
        };
        state.currentItemIndex = 0;
        state.processedItems.clear();
        updateCounters();
        clearLogs();
        log('Counters reset', 'info');
    }

    // ===================
    // GUI Creation
    // ===================

    function createGUI() {
        // Remove existing GUI if any
        const existingGUI = document.getElementById('quixel-auto-license-gui');
        if (existingGUI) {
            existingGUI.remove();
        }

        // Create minimized toggle button
        const toggleButton = document.createElement('div');
        toggleButton.id = 'quixel-auto-license-toggle';
        toggleButton.innerHTML = `
            <svg width="33" height="33" viewBox="0 0 24 24" fill="white">
                <path d="M7 10l5 5 5-5z"/>
            </svg>
        `;
        toggleButton.style.cssText = `
            position: fixed;
            top: 0;
            right: 300px;
            width: 40px;
            height: 35px;
            background: ${config.guiBackgroundColor};
            border: 2px solid ${config.guiAccentColor};
            border-top: none;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 217, 255, 0.3);
        `;

        // Create main GUI container
        const gui = document.createElement('div');
        gui.id = 'quixel-auto-license-gui';
        gui.style.cssText = `
            position: fixed;
            top: -600px;
            right: 20px;
            width: 400px;
            background: ${config.guiBackgroundColor};
            border: 2px solid ${config.guiAccentColor};
            border-radius: 12px;
            padding: 20px;
            z-index: 10001;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 8px 32px rgba(0, 217, 255, 0.4);
            transition: top 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;

        gui.innerHTML = `
            <style>
                #quixel-auto-license-gui * {
                    box-sizing: border-box;
                }
                .qal-title {
                    color: ${config.guiAccentColor};
                    font-size: 22px;
                    font-weight: bold;
                    margin: 0 0 20px 0;
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .qal-section {
                    margin-bottom: 20px;
                }
                .qal-section-title {
                    color: ${config.guiAccentColor};
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .qal-checkbox-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                    padding: 12px;
                    background: rgba(0, 217, 255, 0.1);
                    border-radius: 6px;
                    border: 1px solid rgba(0, 217, 255, 0.3);
                }
                .qal-checkbox {
                    width: 20px;
                    height: 20px;
                    margin-right: 12px;
                    cursor: pointer;
                    accent-color: ${config.guiAccentColor};
                }
                .qal-checkbox-label {
                    color: #ffffff;
                    font-size: 14px;
                    flex: 1;
                }
                .qal-counters {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .qal-counter {
                    background: rgba(0, 217, 255, 0.15);
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid rgba(0, 217, 255, 0.3);
                }
                .qal-counter-label {
                    color: #aaa;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 5px;
                }
                .qal-counter-value {
                    color: ${config.guiAccentColor};
                    font-size: 24px;
                    font-weight: bold;
                }
                .qal-buttons {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .qal-button {
                    flex: 1;
                    padding: 12px;
                    background: ${config.guiAccentColor};
                    color: ${config.guiBackgroundColor};
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .qal-button:hover {
                    background: #00b8d4;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 217, 255, 0.4);
                }
                .qal-button:active {
                    transform: translateY(0);
                }
                .qal-button.stop {
                    background: #ff4444;
                }
                .qal-button.stop:hover {
                    background: #cc0000;
                }
                .qal-button.pause {
                    background: #ff9800;
                }
                .qal-button.pause:hover {
                    background: #e68900;
                }
                .qal-button.reset {
                    background: #666;
                }
                .qal-button.reset:hover {
                    background: #555;
                }
                .qal-logs {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(0, 217, 255, 0.3);
                    border-radius: 6px;
                    padding: 12px;
                    max-height: 200px;
                    overflow-y: auto;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                }
                .qal-log-entry {
                    color: #ccc;
                    margin-bottom: 4px;
                    line-height: 1.4;
                }
                .qal-log-entry.error {
                    color: #ff6b6b;
                }
                .qal-log-entry.warn {
                    color: #ffd93d;
                }
                .qal-log-entry.info {
                    color: #6bcf7f;
                }
                .qal-logs::-webkit-scrollbar {
                    width: 8px;
                }
                .qal-logs::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 4px;
                }
                .qal-logs::-webkit-scrollbar-thumb {
                    background: ${config.guiAccentColor};
                    border-radius: 4px;
                }
                .qal-minimize {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: transparent;
                    border: none;
                    color: ${config.guiAccentColor};
                    font-size: 24px;
                    cursor: pointer;
                    line-height: 1;
                    padding: 5px;
                    transition: transform 0.2s;
                }
                .qal-minimize:hover {
                    transform: scale(1.2);
                }
            </style>
            
            <h1 class="qal-title">Licensing Items</h1>
            
            <div class="qal-section">
                <div class="qal-checkbox-container">
                    <input type="checkbox" id="qal-personal-alternative" class="qal-checkbox">
                    <label for="qal-personal-alternative" class="qal-checkbox-label">
                        Allow Personal License as Alternative
                    </label>
                </div>
            </div>
            
            <div class="qal-section">
                <div class="qal-section-title">Statistics</div>
                <div class="qal-counters">
                    <div class="qal-counter">
                        <div class="qal-counter-label">Professional</div>
                        <div class="qal-counter-value" id="qal-counter-professional">0</div>
                    </div>
                    <div class="qal-counter">
                        <div class="qal-counter-label">Personal</div>
                        <div class="qal-counter-value" id="qal-counter-personal">0</div>
                    </div>
                    <div class="qal-counter">
                        <div class="qal-counter-label">Skipped</div>
                        <div class="qal-counter-value" id="qal-counter-skipped">0</div>
                    </div>
                    <div class="qal-counter">
                        <div class="qal-counter-label">Total Processed</div>
                        <div class="qal-counter-value" id="qal-counter-total">0</div>
                    </div>
                </div>
            </div>
            
            <div class="qal-section">
                <div class="qal-buttons">
                    <button class="qal-button" id="qal-start-btn">Start</button>
                    <button class="qal-button pause" id="qal-pause-btn" style="display: none;">Pause</button>
                    <button class="qal-button stop" id="qal-stop-btn" style="display: none;">Stop</button>
                    <button class="qal-button reset" id="qal-reset-btn">Reset</button>
                </div>
            </div>
            
            <div class="qal-section">
                <div class="qal-section-title">Activity Log</div>
                <div class="qal-logs" id="qal-logs"></div>
            </div>
        `;

        document.body.appendChild(toggleButton);
        document.body.appendChild(gui);

        // Event Listeners
        toggleButton.addEventListener('click', () => {
            const isVisible = gui.style.top === '30px';
            gui.style.top = isVisible ? '-700px' : '30px';
            toggleButton.querySelector('svg').style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        document.getElementById('qal-minimize-btn').addEventListener('click', () => {
            gui.style.top = '-700px';
            toggleButton.querySelector('svg').style.transform = 'rotate(0deg)';
        });

        document.getElementById('qal-personal-alternative').addEventListener('change', (e) => {
            state.personalLicenseAlternatively = e.target.checked;
            log(`Personal license alternative: ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'info');
        });

        document.getElementById('qal-start-btn').addEventListener('click', processAllItems);
        document.getElementById('qal-stop-btn').addEventListener('click', stopProcessing);
        document.getElementById('qal-pause-btn').addEventListener('click', togglePause);
        document.getElementById('qal-reset-btn').addEventListener('click', resetCounters);

        log('GUI initialized successfully', 'info');
    }

    function updateCounters() {
        document.getElementById('qal-counter-professional').textContent = state.counters.professional;
        document.getElementById('qal-counter-personal').textContent = state.counters.personal;
        document.getElementById('qal-counter-skipped').textContent = state.counters.skipped;
        document.getElementById('qal-counter-total').textContent = state.counters.total;
    }

    function updateStartButton() {
        const startBtn = document.getElementById('qal-start-btn');
        const stopBtn = document.getElementById('qal-stop-btn');
        const pauseBtn = document.getElementById('qal-pause-btn');

        if (state.isRunning) {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            pauseBtn.style.display = 'block';
            pauseBtn.textContent = state.isPaused ? 'Resume' : 'Pause';
        } else {
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
        }
    }

    function updateLogDisplay(logEntry) {
        const logsContainer = document.getElementById('qal-logs');
        if (!logsContainer) return;

        const logElement = document.createElement('div');
        logElement.className = `qal-log-entry ${logEntry.type}`;
        logElement.textContent = `[${logEntry.timestamp}] ${logEntry.message}`;
        
        logsContainer.appendChild(logElement);
        logsContainer.scrollTop = logsContainer.scrollHeight;

        // Keep only last 100 log entries
        while (logsContainer.children.length > 100) {
            logsContainer.removeChild(logsContainer.firstChild);
        }
    }

    function clearLogs() {
        const logsContainer = document.getElementById('qal-logs');
        if (logsContainer) {
            logsContainer.innerHTML = '';
        }
    }

    // ===================
    // Initialization
    // ===================

    function initialize() {
        log('Initializing Quixel Auto-Licensing Script...', 'info');
        createGUI();
        log('Script ready. Click the toggle button or Start to begin.', 'info');
    }

    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
