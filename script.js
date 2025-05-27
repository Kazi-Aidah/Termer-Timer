const darkModeColors = {
   red: '#ff7979', orange: '#ffb479', yellow: '#ffd979', green: '#c4ff79', cyan: '#79ffc9',
   sky: '#79fcff', blue: '#79cdff', purple: '#9f79ff', magenta: '#ea79ff', pink: '#ff79b6', lightbrown: '#cca995',
   white: '#ffffff', grey: '#d6d6d6'
};
// Bright colors for light mode
const lightModeColors = {
   red: '#cc0000', orange: '#cc6600', yellow: '#cc9900', green: '#006600', cyan: '#006666',
   sky: '#0066cc', blue: '#0000cc', purple: '#6600cc', magenta: '#cc00cc', pink: '#cc0066', lightbrown: '#663300',
   white: '#000000', grey: '#444444'
};
let selectedColor = 'white';
let currentColorSet = JSON.parse(JSON.stringify(darkModeColors));
let simplifiedView = false;
let simplifiedFormat = ['[TASKNAME]', ' | ', '[TIMELEFT]'];
let boxRadius = 0;
let timeFormat = '12h'; // CHANGED: Default to 12h
let customColors = {};
let isLoadingSettings = false; // Flag to prevent saving during load
let currentRepeaterStyle = 'custom';
let customRepeaterFilled = '█'; // Character for filled part of the repeater
let customRepeaterUnfilled = '.'; // Character for unfilled part of the repeater
let repeaterLength = 10; // Default length for the repeater string


  const colorPicker = document.getElementById('colorPicker');
 const settingsColorPicker = document.getElementById('settingsColorPicker');
 const customColorInput = document.createElement('input');
 customColorInput.type = 'color';
 customColorInput.className = 'custom-color-input';
 customColorInput.value = '#ffffff';
  // Helper function to check if a color is light
 function isLightColor(hexColor) {
   if (!hexColor) return false;
   // Convert hex to RGB
   const r = parseInt(hexColor.substr(1, 2), 16);
   const g = parseInt(hexColor.substr(3, 2), 16);
   const b = parseInt(hexColor.substr(5, 2), 16);
  
   // Calculate luminance
   const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
   return luminance > 0.5;
 }
  // Update color boxes based on theme
 function updateColorBoxes() {
   colorPicker.innerHTML = '';
  
   // Add custom color box
   const customBox = document.createElement('div');
   customBox.className = 'custom-color-box';
   customBox.title = 'Custom color';
  
   const customInput = customColorInput.cloneNode(); // This is the <input type="color">
    // Set initial value of the custom color input based on global selectedColor
   if (typeof selectedColor === 'string' && selectedColor.startsWith('#')) {
     customInput.value = selectedColor; // selectedColor is a custom hex
   } else if (currentColorSet[selectedColor]) {
     customInput.value = currentColorSet[selectedColor]; // selectedColor is a preset key, use its hex
   } else {
     customInput.value = '#ffffff'; // Default or fallback
   }
    customInput.addEventListener('input', (e) => {
     selectedColor = e.target.value; // Update global selectedColor to the new hex
     // Reset border for all preset color boxes since a custom color is now active
     [...colorPicker.querySelectorAll('.color-box')].forEach(c => { // These are only preset boxes
       c.style.borderColor = document.body.classList.contains('light-mode') ? '#333' : 'white';
     });
   });
  
   customBox.appendChild(customInput);
   colorPicker.appendChild(customBox);
  
   // Add preset color boxes
   for (const [key, value] of Object.entries(currentColorSet)) {
     const box = document.createElement('div');
     box.className = 'color-box'; // These are the preset color boxes
     box.style.backgroundColor = value;
     box.title = key;
     box.dataset.colorKey = key;
     box.style.display = 'block';
    
     // Set initial border color based on theme AND current selectedColor
     if (selectedColor === key) { // If this preset color is selected
       box.style.borderColor = document.body.classList.contains('light-mode') ? '#cc0' : 'yellow';
     } else { // Default border for non-selected preset colors
       box.style.borderColor = document.body.classList.contains('light-mode') ? '#333' : 'white';
     }
    
     box.onclick = (e) => {
       if (e.button === 0) { // Left click
         selectedColor = key; // Update global selectedColor to the preset's key
          // Update all preset box borders to reflect the new selection
         [...colorPicker.querySelectorAll('.color-box')].forEach(c => {
           if (c.dataset.colorKey === selectedColor) { // Highlight the newly selected one
             c.style.borderColor = document.body.classList.contains('light-mode') ? '#cc0' : 'yellow';
           } else { // Reset others
             c.style.borderColor = document.body.classList.contains('light-mode') ? '#333' : 'white';
           }
         });
        
         // Update the custom color input to show the hex of the selected preset
         const customColorInputElement = colorPicker.querySelector('.custom-color-input');
         if (customColorInputElement && currentColorSet[selectedColor]) {
             customColorInputElement.value = currentColorSet[selectedColor];
         }
       }
     };
    
     colorPicker.appendChild(box);
   }
 }
  // Update color boxes in settings panel
  function updateSettingsColorPicker() {
    if (settingsColorPicker) { // Add this null check
      settingsColorPicker.innerHTML = '';
    } else {
      console.warn("[Renderer Process] updateSettingsColorPicker: settingsColorPicker element not found. Skipping update.");
      return; // Exit if the element doesn't exist
    }
  
    // Add color boxes - make sure they're always visible
   for (const [key, value] of Object.entries(currentColorSet)) {
     const box = document.createElement('div');
     box.className = 'color-box';
     box.style.backgroundColor = value;
     box.title = key;
     box.dataset.colorKey = key;
     box.style.display = 'block'; // Ensure visibility
    
     box.onclick = (e) => {
       if (e.button === 0) { // Left click
         selectedColor = key;
         [...settingsColorPicker.querySelectorAll('.color-box')].forEach(c => {
           c.style.borderColor = document.body.classList.contains('light-mode') ? '#333' : 'white';
         });
         box.style.borderColor = document.body.classList.contains('light-mode') ? '#cc0' : 'yellow';
       }
     };
    
     settingsColorPicker.appendChild(box);
   }
 }
  // Change theme
 function changeTheme(theme = null, save = true) {
   console.log(`[DEBUG Kilo] changeTheme: Called with theme: ${theme}, save: ${save}`);
   if (!theme) {
     theme = document.getElementById('themeSelect').value;
     console.log(`[DEBUG Kilo] changeTheme: Theme was null, now from select: ${theme}`);
   }
  
   document.body.className = theme + '-mode';
  
   if (theme === 'custom') {
     document.getElementById('customThemeOptions').style.display = 'block';
     updateCustomTheme(false);
    
     // Determine which color set to use based on background brightness
     const bgColor = document.getElementById('customBgColor').value;
     currentColorSet = isLightColor(bgColor) ?
       JSON.parse(JSON.stringify(lightModeColors)) :
       JSON.parse(JSON.stringify(darkModeColors));
   } else {
     document.getElementById('customThemeOptions').style.display = 'none';
     // Clear custom theme CSS variables from body.style when not in custom mode
     document.body.style.removeProperty('--custom-bg');
     document.body.style.removeProperty('--custom-text');
     // Note: --custom-hover was already removed from updateCustomTheme, so no need to remove it here.

     currentColorSet = theme === 'light' ?
       JSON.parse(JSON.stringify(lightModeColors)) :
       JSON.parse(JSON.stringify(darkModeColors));
   }

   // Update color pickers
   updateColorBoxes();
   updateSettingsColorPicker();
  
   // Update all existing tasks with proper colors
   document.querySelectorAll('.task').forEach(task => {
     const colorKey = task.dataset.colorKey;
     if (colorKey) {
       // Get the correct color from the current palette
       const color = currentColorSet[colorKey] || task.dataset.customColor;
       if (color) {
         task.style.borderColor = color;
         task.style.color = color;
       }
     }
   });
  if (save) saveSettings();
  updateThemeOptionLabelColors(); // Call new function
  console.log(`[DEBUG Kilo] changeTheme: Final body.className: ${document.body.className}`);
  console.log(`[DEBUG Kilo] changeTheme: Final body.style.--custom-text: ${document.body.style.getPropertyValue('--custom-text')}`);
}

// Helper function to update theme option label colors
function updateThemeOptionLabelColors() {
  const labels = document.querySelectorAll('.theme-option-label');
  labels.forEach(label => {
    const targetInputId = label.dataset.target;
    if (targetInputId) {
      const colorInput = document.getElementById(targetInputId);
      if (colorInput) {
        label.style.backgroundColor = colorInput.value;
        // Optional: Adjust text color for contrast if needed, for now, it uses the general text color
      }
    }
  });
}

// Update custom theme colors
function updateCustomTheme(save = true) {
  console.log(`[DEBUG Kilo] updateCustomTheme: Called with save: ${save}`);
  const bgColor = document.getElementById('customBgColor').value;
  const textColor = document.getElementById('customTextColor').value;
  console.log(`[DEBUG Kilo] updateCustomTheme: bgColor: ${bgColor}, textColor: ${textColor}`);

  document.body.style.setProperty('--custom-bg', bgColor);
  document.body.style.setProperty('--custom-text', textColor);

  // Update color set based on background brightness
  currentColorSet = isLightColor(bgColor) ?
    JSON.parse(JSON.stringify(lightModeColors)) :
    JSON.parse(JSON.stringify(darkModeColors));

  updateColorBoxes();
  updateSettingsColorPicker();
  updateThemeOptionLabelColors(); // Call new function

  if (save) saveSettings();
  console.log(`[DEBUG Kilo] updateCustomTheme: Final body.style.--custom-bg: ${document.body.style.getPropertyValue('--custom-bg')}`);
  console.log(`[DEBUG Kilo] updateCustomTheme: Final body.style.--custom-text: ${document.body.style.getPropertyValue('--custom-text')}`);
}
  // Format time until - fixed 12/24 hour format switching
 function formatTimeUntil(endTime) {
   console.log(`DEBUG: formatTimeUntil called. timeFormat is currently: '${timeFormat}'`);
   let options;
   let localeString;
    if (timeFormat === '24h') { // Ensure comparison is with '24h'
     options = {hour: '2-digit', minute:'2-digit', hour12: false};
     localeString = endTime.toLocaleTimeString([], options);
     console.log(`DEBUG: Attempting 24h format. Options: ${JSON.stringify(options)}. Raw output: ${localeString}`);
     return localeString;
   } else { // Default to 12h
     options = {hour: '2-digit', minute:'2-digit', hour12: true}; // Explicitly set hour12: true for 12h
     localeString = endTime.toLocaleTimeString([], options);
     console.log(`DEBUG: Attempting 12h format. Options: ${JSON.stringify(options)}. Raw output: ${localeString}`);
     return localeString;
   }
 }
  // Initialize event listeners for fixed functionality
 function initializeEventListeners() {
   console.log("DEBUG: Initializing event listeners...");
   // Box radius
   const boxRadiusSliderElement = document.getElementById('boxRadiusSlider'); // CORRECT ID
   console.log("DEBUG: boxRadiusSliderElement found:", boxRadiusSliderElement); // ADDED
   if (boxRadiusSliderElement) { // CORRECT ID
       boxRadiusSliderElement.addEventListener('input', updateBoxRadius); // CORRECT ID
       console.log("DEBUG: Event listener added to boxRadiusSlider"); // ADDED
   } else {
       console.error("DEBUG: boxRadiusSlider (expected ID: boxRadiusSlider) not found"); // UPDATED
   }


   // Big Add Button
   const bigAddButtonElement = document.getElementById('bigAddButton');
   if (bigAddButtonElement) {
     bigAddButtonElement.addEventListener('click', toggleAddPanel);
     console.log("DEBUG: Event listener added to bigAddButton");
   } else {
     console.error("DEBUG: bigAddButton not found");
   }
  
   // Add color
   const addColorBtn = document.getElementById('addColorBtn');
   if (addColorBtn) addColorBtn.addEventListener('click', addNewColor);
   else console.error("DEBUG: addColorBtn not found");
  
   // Theme selection
   const themeSelect = document.getElementById('themeSelect');
   if (themeSelect) themeSelect.addEventListener('change', function() {
     changeTheme(this.value, true);
   });
   else console.error("DEBUG: themeSelect not found");
  
   // Sound upload
   const soundUpload = document.getElementById('soundUpload');
   if (soundUpload) soundUpload.addEventListener('change', handleSoundUpload);
   else console.error("DEBUG: soundUpload not found");
  
   // Custom theme colors
   const customBgColor = document.getElementById('customBgColor');
   if (customBgColor) customBgColor.addEventListener('input', () => updateCustomTheme(true));
   else console.error("DEBUG: customBgColor not found");
    const customTextColor = document.getElementById('customTextColor');
   if (customTextColor) customTextColor.addEventListener('input', () => updateCustomTheme(true));
   else console.error("DEBUG: customTextColor not found");
    // Hide scrollbars globally
   document.documentElement.style.scrollbarWidth = 'none'; // For Firefox
   document.documentElement.style.msOverflowStyle = 'none'; // For IE
   const style = document.createElement('style');
   style.innerHTML = `
     ::-webkit-scrollbar {
       display: none;
     }
     body {
       overflow: hidden;
     }
   `;
   document.head.appendChild(style);
    // Time input - Enter moves to name input
   const timeInput = document.getElementById('timeInput');
   if (timeInput) {
     timeInput.addEventListener('keydown', e => {
       if (e.key === 'Enter') {
         console.log("DEBUG: Enter pressed in timeInput");
         e.preventDefault();
         const taskNameInput = document.getElementById('taskNameInput');
         if (taskNameInput) {
             taskNameInput.focus();
             console.log("DEBUG: Focusing taskNameInput");
         } else {
             console.error("DEBUG: taskNameInput not found for focus");
         }
       }
     });
   } else {
     console.error("DEBUG: timeInput not found");
   }
    // Name input - Enter starts the task
   const taskNameInput = document.getElementById('taskNameInput');
   if (taskNameInput) {
     taskNameInput.addEventListener('keydown', e => {
       if (e.key === 'Enter') {
         console.log("DEBUG: Enter pressed in taskNameInput");
         e.preventDefault();
         startTask();
       } else if (e.key === 'Backspace' && taskNameInput.value === '') {
         console.log("DEBUG: Backspace pressed in empty taskNameInput");
         e.preventDefault(); // Prevent default backspace behavior (e.g., browser navigation)
         const timeInput = document.getElementById('timeInput');
         if (timeInput) {
           timeInput.focus();
           timeInput.select(); // Highlight the content of timeInput
           console.log("DEBUG: Focusing and selecting timeInput due to Backspace");
         } else {
           console.error("DEBUG: timeInput not found for focus on Backspace");
         }
       }
     });
   } else {
     console.error("DEBUG: taskNameInput not found");
   }
    // Notes input - Enter starts the task
   const notesInput = document.getElementById('notesInput');
   if (notesInput) {
     notesInput.addEventListener('keydown', e => {
       if (e.key === 'Enter') {
         console.log("DEBUG: Enter pressed in notesInput");
         e.preventDefault();
         startTask();
       }
     });
   } else {
     console.error("DEBUG: notesInput not found");
   }
   console.log("DEBUG: Event listeners initialization complete.");
   removeSettingSeparators(); // Remove fake HRs
 }
// Remove visual separators (fake HRs) from settings sections
function removeSettingSeparators() {
 const sections = document.querySelectorAll('#settingsPanel .settings-section');
 sections.forEach(section => {
   // Reset styles that might create a horizontal rule effect
   section.style.border = 'none'; // Removes all borders
   section.style.marginTop = '0px';
   section.style.marginBottom = '0px';
   // Padding is usually for inner content spacing, so it's left untouched here.
 });
 console.log('DEBUG: Removed visual separators from settings sections.');
}
  // Load settings using electron-store via preload
  async function loadSettings() { // Make the function async
    isLoadingSettings = true; // Ensure this is set
    try {
      console.log('[DEBUG Kilo] loadSettings: Starting.');
      console.log('[Renderer Process] loadSettings: Attempting to get settings via window.electronAPI.getSettings()');
      const settings = await window.electronAPI.getSettings(); // Use await to get settings
      console.log('[Renderer Process] loadSettings: Received settings object:', settings);
      console.log('[DEBUG Kilo] loadSettings: Raw settings from store:', JSON.stringify(settings));

      if (settings && Object.keys(settings).length > 0) { // Check if settings object is not empty
    
     // Theme
     if (settings.theme) {
       document.getElementById('themeSelect').value = settings.theme;
       console.log(`[DEBUG Kilo] loadSettings: themeSelect.value set to: ${document.getElementById('themeSelect').value}`);
       changeTheme(settings.theme, false);
       console.log(`[DEBUG Kilo] loadSettings: body.className after changeTheme: ${document.body.className}`);
     } else {
        console.log('[DEBUG Kilo] loadSettings: No settings.theme found. Defaulting theme.');
        // Ensure a default theme is applied if none in settings
        changeTheme(document.getElementById('themeSelect').value, false);
        console.log(`[DEBUG Kilo] loadSettings: body.className after default changeTheme: ${document.body.className}`);
     }
    
     // Custom theme colors
     if (settings.customTheme) {
       document.getElementById('customBgColor').value = settings.customTheme.bg || '#000000';
       document.getElementById('customTextColor').value = settings.customTheme.text || '#ffffff';
       console.log(`[DEBUG Kilo] loadSettings: customBgColor.value: ${document.getElementById('customBgColor').value}, customTextColor.value: ${document.getElementById('customTextColor').value}`);
       // Only call updateCustomTheme if the loaded theme IS 'custom'.
       // changeTheme would have already handled applying custom styles if settings.theme was 'custom'.
       // If settings.theme is 'dark' or 'light', we don't want to re-apply --custom-text here.
       if (settings.theme === 'custom') {
        updateCustomTheme(false); // This will call updateThemeOptionLabelColors
        console.log(`[DEBUG Kilo] loadSettings: Called updateCustomTheme because settings.theme is 'custom'.`);
       } else {
        console.log(`[DEBUG Kilo] loadSettings: Skipped updateCustomTheme because settings.theme is '${settings.theme}'. --custom-text should be cleared by changeTheme.`);
       }
       console.log(`[DEBUG Kilo] loadSettings: body.className after customTheme processing: ${document.body.className}`);
       console.log(`[DEBUG Kilo] loadSettings: body.style.--custom-text after customTheme processing: ${document.body.style.getPropertyValue('--custom-text')}`);
     } else {
        console.log('[DEBUG Kilo] loadSettings: No settings.customTheme found.');
     }

     // Time format
     if (settings.timeFormat) {
       timeFormat = settings.timeFormat; // This will be '12h' or '24h'
       document.getElementById('timeFormatSelect').value = timeFormat;
       console.log(`DEBUG: Loaded timeFormat from settings: '${timeFormat}'`);
     } else {
       // Default is '12h' as per variable initialization
       document.getElementById('timeFormatSelect').value = timeFormat; // Ensure select matches default
       console.log(`DEBUG: No timeFormat in saved settings, using default from init: '${timeFormat}'`);
     }
    
     // Sound
     if (settings.soundName) {
       const soundNameElement = document.getElementById('currentSound'); // Corrected ID
       if (soundNameElement) {
         soundNameElement.textContent = settings.soundName;
       } else {
         console.warn("[Renderer Process] loadSettings: currentSound element not found."); // Corrected log
       }
       if (settings.soundData) {
         const audio = document.getElementById('successSound');
         audio.src = settings.soundData;
       }
     }
    
     // Simplified view
     if (settings.simplifiedView !== undefined) {
       simplifiedView = settings.simplifiedView;
       document.getElementById('simplifiedViewToggle').checked = simplifiedView;
       updateAllTaskDisplays();
     }
    
     // Simplified format
     if (settings.simplifiedFormat) {
       simplifiedFormat = settings.simplifiedFormat;
       updateFormatPreview();
     }
    
     // Box radius
     if (settings.boxRadius !== undefined) {
       boxRadius = settings.boxRadius;
       const boxRadiusSliderElem = document.getElementById('boxRadiusSlider');
       if (boxRadiusSliderElem) {
           boxRadiusSliderElem.value = boxRadius;
           console.log(`DEBUG: Loaded boxRadius from settings: ${boxRadius}, set slider to: ${boxRadiusSliderElem.value}`);
       } else {
           console.error("DEBUG: boxRadiusSlider not found in loadSettings when trying to set value."); // UPDATED log
       }
     } else {
         console.log(`DEBUG: No boxRadius in saved settings, using default: ${boxRadius}`);
     }
    
     // Custom colors
     if (settings.customColors) {
       customColors = settings.customColors;
       currentColorSet = {...darkModeColors, ...customColors}; // Ensure custom colors are loaded into currentColorSet
       // No need to call updateColorBoxes/updateSettingsColorPicker here, changeTheme or updateCustomTheme will do it.
       // If no theme is set, loadSettings will call them at the end.
     }

     // Repeater settings
     if (settings.repeaterStyle !== undefined && settings.repeaterStyle !== null) {
       currentRepeaterStyle = settings.repeaterStyle;
     } // else, currentRepeaterStyle retains its default ('block')

     // Update checkboxes based on the final currentRepeaterStyle
     document.getElementById('repeaterStyleHash').checked = currentRepeaterStyle === 'hash';
     document.getElementById('repeaterStyleBlock').checked = currentRepeaterStyle === 'block';
     document.getElementById('repeaterStyleCustomToggle').checked = currentRepeaterStyle === 'custom';

     if (currentRepeaterStyle === 'custom') {
       document.getElementById('customRepeaterSection').style.display = 'block';
     } else {
       document.getElementById('customRepeaterSection').style.display = 'none';
     }

     // Load custom chars
     if (settings.customRepeaterChars) {
       customRepeaterFilled = settings.customRepeaterChars.filled || '■';
       customRepeaterUnfilled = settings.customRepeaterChars.unfilled || '□';
       document.getElementById('customRepeaterFilled').value = customRepeaterFilled;
       document.getElementById('customRepeaterUnfilled').value = customRepeaterUnfilled;
       const customPreview = document.getElementById('customRepeaterPreview');
       if (customPreview) {
           customPreview.textContent = generateRepeaterString(0.5, customRepeaterFilled, customRepeaterUnfilled); // Show a 50% preview
       }
     }
     updateAllTaskDisplays(); // Update tasks with loaded repeater style

   } else {
     console.log("DEBUG: No saved settings found or settings are empty. Using default timeFormat:", timeFormat, "and boxRadius:", boxRadius);
     // Apply a default theme if no settings at all
     changeTheme(document.getElementById('themeSelect').value, false); // Default theme is dark from HTML
     console.log(`[DEBUG Kilo] loadSettings: body.className after applying default theme for empty settings: ${document.body.className}`);
   }
 } catch (error) {
   console.error("Error loading settings:", error);
   // Handle error or use defaults
   console.log("DEBUG: Error loading settings. Using default timeFormat:", timeFormat, "and boxRadius:", boxRadius);
 } finally {
   isLoadingSettings = false; // Ensure this is reset
 }
  
   // Initialize color pickers if not done by theme functions
   // This ensures they are populated even if no settings are saved or theme is default
   if (!document.body.className.includes('-mode')) { // Check if a theme was applied
       console.log('[DEBUG Kilo] loadSettings: body.className did not include "-mode", calling updateColorBoxes/SettingsColorPicker.');
       updateColorBoxes();
       updateSettingsColorPicker();
   }
   // Call updateBoxRadius here after settings are loaded and slider value might be set
   // This ensures the UI (preview, tasks, span) is updated based on loaded or default radius
   updateBoxRadius(); // MOVED AND ENSURED IT'S CALLED
   console.log('[DEBUG Kilo] loadSettings: Finished.');
 }
  // Save settings using electron-store via preload
  function saveSettings() {
    if (isLoadingSettings) {
      console.log('[Renderer Process] saveSettings: Suppressed during initial load.');
      return;
    }
    timeFormat = document.getElementById('timeFormatSelect').value;
    console.log(`[Renderer Process] saveSettings: Called. timeFormat from select is: '${timeFormat}'`);
  
   const settings = {
     theme: document.getElementById('themeSelect').value,
     customTheme: {
       bg: document.getElementById('customBgColor').value,
       text: document.getElementById('customTextColor').value
     },
     timeFormat: timeFormat, // This should be '12h' or '24h'
     soundName: document.getElementById('currentSound').textContent, // CORRECTED ID
     soundData: document.getElementById('successSound').src,
     simplifiedView: simplifiedView,
     simplifiedFormat: simplifiedFormat,
     boxRadius: boxRadius,
     customColors: customColors,
     repeaterStyle: currentRepeaterStyle,
     customRepeaterChars: { filled: customRepeaterFilled, unfilled: customRepeaterUnfilled }
   };
   console.log('[Renderer Process] saveSettings: Settings object to be sent:', settings);
   window.electronAPI.setSettings(settings); // Send settings to main process
   console.log('[Renderer Process] saveSettings: Settings sent to main process.');
 }
  // Handle sound upload
 function handleSoundUpload() {
   const fileInput = document.getElementById('soundUpload');
   if (fileInput.files.length > 0) {
     const file = fileInput.files[0];
     if (file.type.startsWith('audio/')) {
       const reader = new FileReader();
       reader.onload = function(e) {
         const audio = document.getElementById('successSound');
         audio.src = e.target.result;
         document.getElementById('currentSound').textContent = file.name; // Corrected ID
         saveSettings();
       };
       reader.readAsDataURL(file);
     } else {
       alert('Please upload an audio file.');
     }
   }
 }
  // Add new color to presets
 function addNewColor() {
   const newColor = prompt('Enter a hex color (e.g., #ff0000 for red):');
   if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
     const colorName = `custom${Object.keys(customColors).length + 1}`;
     customColors[colorName] = newColor;
     currentColorSet = {...darkModeColors, ...customColors}; // Rebuild currentColorSet
     updateColorBoxes();
     updateSettingsColorPicker();
     saveSettings();
   } else if (newColor) {
     alert('Please enter a valid hex color (e.g., #ff0000).');
   }
 }
  // Toggle simplified view
 function toggleSimplifiedView() {
   simplifiedView = document.getElementById('simplifiedViewToggle').checked;
   updateAllTaskDisplays();
   saveSettings();
 }
  // Update format preview
  function updateFormatPreview() {
    const preview = document.getElementById('formatPreview');
    if (!preview) {
      console.warn("[Renderer Process] updateFormatPreview: formatPreview element not found. Skipping update.");
      return;
    }
    preview.innerHTML = '';
  
    if (simplifiedFormat.length === 0) {
      preview.innerHTML = '<div class="drag-here">Drag elements here</div>';
     document.getElementById('currentFormatText').textContent = 'Empty';
     return;
   }
  
   simplifiedFormat.forEach(item => {
     if (['[TASKNAME]', '[TIMELEFT]', '[TIMEUNTIL]', '[NOTES]'].includes(item)) {
       const el = document.createElement('span');
       el.className = 'format-option';
       el.textContent = item;
       el.draggable = true;
       el.dataset.format = item;
       preview.appendChild(el);
     } else {
       preview.appendChild(document.createTextNode(item));
     }
   });
  
   document.getElementById('currentFormatText').textContent = simplifiedFormat.join('');
  
   // Make elements draggable
   setupDragAndDrop();
 }
  // Setup drag and drop for format customization
 function setupDragAndDrop() {
   const formatOptions = document.querySelectorAll('.format-option');
   const preview = document.getElementById('formatPreview');
  
   formatOptions.forEach(option => {
     option.addEventListener('dragstart', (e) => {
       e.dataTransfer.setData('text/plain', e.target.dataset.format);
       setTimeout(() => {
         e.target.style.display = 'none';
       }, 0);
     });
    
     option.addEventListener('dragend', (e) => {
       e.target.style.display = 'inline-block';
     });
   });
  
   preview.addEventListener('dragover', (e) => {
     e.preventDefault();
   });
  
   preview.addEventListener('drop', (e) => {
     e.preventDefault();
     const format = e.dataTransfer.getData('text/plain');
    
     // Calculate drop position
     const previewRect = preview.getBoundingClientRect();
     const x = e.clientX - previewRect.left;
     const y = e.clientY - previewRect.top;
    
     // Find the element at the drop position
     let closestElement = null;
     let closestDistance = Infinity;
    
     preview.childNodes.forEach(child => {
       if (child.nodeType === Node.ELEMENT_NODE) {
         const rect = child.getBoundingClientRect();
         const centerX = rect.left + rect.width / 2 - previewRect.left;
         const centerY = rect.top + rect.height / 2 - previewRect.top;
         const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
         if (distance < closestDistance) {
           closestDistance = distance;
           closestElement = child;
         }
       }
     });
    
     // Insert the new element
     const newElement = document.createElement('span');
     newElement.className = 'format-option';
     newElement.textContent = format;
     newElement.draggable = true;
     newElement.dataset.format = format;
    
     if (closestElement) {
       preview.insertBefore(newElement, closestElement);
     } else {
       preview.appendChild(newElement);
     }
    
     // Update simplified format
     updateSimplifiedFormatFromPreview();
   });
  
   // Make existing preview elements draggable
   const previewElements = preview.querySelectorAll('.format-option');
   previewElements.forEach(el => {
     el.addEventListener('dragstart', (e) => {
       e.dataTransfer.setData('text/plain', e.target.dataset.format);
       setTimeout(() => {
         e.target.style.display = 'none';
       }, 0);
     });
    
     el.addEventListener('dragend', (e) => {
       e.target.style.display = 'inline-block';
     });
   });
 }
  // Update simplified format from preview
 function updateSimplifiedFormatFromPreview() {
   const preview = document.getElementById('formatPreview');
   const newFormat = [];
  
   preview.childNodes.forEach(child => {
     if (child.nodeType === Node.ELEMENT_NODE && child.classList.contains('format-option')) {
       newFormat.push(child.dataset.format);
     } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
       newFormat.push(child.textContent);
     }
   });
  
   simplifiedFormat = newFormat;
   document.getElementById('currentFormatText').textContent = simplifiedFormat.join('');
   updateAllTaskDisplays();
   saveSettings();
 }
  // Update box radius
function updateBoxRadius() {
  const slider = document.getElementById('boxRadiusSlider'); // CORRECT ID
  const valueDisplay = document.getElementById('boxRadiusValue'); // Get the span for displaying value
  
  if (slider) {
    boxRadius = parseInt(slider.value) || 0;
    console.log(`DEBUG: updateBoxRadius called. Slider value: ${slider.value}, Parsed boxRadius: ${boxRadius}`);
  } else {
    console.error("DEBUG: boxRadiusSlider not found in updateBoxRadius. Using current boxRadius:", boxRadius);
  }

  // Set the CSS variable on the root element
  document.documentElement.style.setProperty('--task-radius', `${boxRadius}px`);
  console.log(`DEBUG: Set CSS variable --task-radius to ${boxRadius}px`);

  // Update all existing tasks' border radius directly
  document.querySelectorAll('.task').forEach(task => {
    task.style.borderRadius = `${boxRadius}px`;
  });

  if (valueDisplay) { // Update the text display
    valueDisplay.textContent = `${boxRadius}px`;
    console.log(`DEBUG: Updated boxRadiusValue text to ${boxRadius}px`);
  } else {
    console.warn("DEBUG: boxRadiusValue span not found.");
  }

  saveSettings();
}

 // --- REPEATER FUNCTIONS ---
 function generateRepeaterString(progressRatio, filledChar, unfilledChar, totalLength = repeaterLength) {
   const filledCount = Math.round(progressRatio * totalLength);
   const unfilledCount = totalLength - filledCount;
   return `[${filledChar.repeat(filledCount)}${unfilledChar.repeat(unfilledCount)}]`;
 }

 function updateRepeaterStyle(checkboxElement, styleType) { // styleType is 'hash' or 'block'
   const hashCheckbox = document.getElementById('repeaterStyleHash');
   const blockCheckbox = document.getElementById('repeaterStyleBlock');
   const customCheckbox = document.getElementById('repeaterStyleCustomToggle');
   const customSection = document.getElementById('customRepeaterSection');

   if (checkboxElement.checked) {
       currentRepeaterStyle = styleType;
       if (styleType === 'hash') {
           blockCheckbox.checked = false;
           customCheckbox.checked = false;
       } else { // styleType === 'block'
           hashCheckbox.checked = false;
           customCheckbox.checked = false;
       }
       customSection.style.display = 'none'; // Always hide custom section if hash or block is chosen
   } else {
       // User unchecked the box. If it was the active style, revert to 'block' as default.
       // This logic ensures one of hash/block/custom is effectively always selected, defaulting to 'block'.
       if (currentRepeaterStyle === styleType) {
           currentRepeaterStyle = 'block'; // Default to 'block'
           blockCheckbox.checked = true;
           if (styleType === 'hash') hashCheckbox.checked = false; // It was just unchecked
           customCheckbox.checked = false; // Ensure custom is also unchecked
           customSection.style.display = 'none';
       } else {
           // This case (unchecking a non-active style) should ideally not happen if they behave like radio buttons.
           // If it does, force UI to match currentRepeaterStyle.
           hashCheckbox.checked = (currentRepeaterStyle === 'hash');
           blockCheckbox.checked = (currentRepeaterStyle === 'block');
           customCheckbox.checked = (currentRepeaterStyle === 'custom');
           customSection.style.display = (currentRepeaterStyle === 'custom' ? 'block' : 'none');
       }
   }
   console.log(`[DEBUG] updateRepeaterStyle: currentRepeaterStyle set to: ${currentRepeaterStyle}`);
   updateAllTaskDisplays();
   saveSettings();
}

function toggleCustomRepeaterSection() { // Called by customCheckbox
   const customCheckbox = document.getElementById('repeaterStyleCustomToggle');
   const customSection = document.getElementById('customRepeaterSection');
   const hashCheckbox = document.getElementById('repeaterStyleHash');document.getElementById('repeaterStyleCustomToggle').checked = true;
   const blockCheckbox = document.getElementById('repeaterStyleBlock');

   if (customCheckbox.checked) {
       currentRepeaterStyle = 'custom';
       customSection.style.display = 'block';
       hashCheckbox.checked = false;
       blockCheckbox.checked = false;
       if (document.getElementById('customRepeaterInputBoxes').style.display === 'none') {
           document.getElementById('addCustomRepeatersText').style.display = 'block';
       }
   } else {
       // Custom was unchecked. Revert to 'block' as default.
       currentRepeaterStyle = 'block';
       customSection.style.display = 'none';
       blockCheckbox.checked = true; // Check block by default
       hashCheckbox.checked = false;
   }
   console.log(`[DEBUG] toggleCustomRepeaterSection: currentRepeaterStyle set to: ${currentRepeaterStyle}`);
   updateAllTaskDisplays();
   saveSettings();
}

function showCustomRepeaterInputs() {
   document.getElementById('customRepeaterInputBoxes').style.display = 'block';
   document.getElementById('addCustomRepeatersText').style.display = 'none';
   document.getElementById('customRepeaterFilled').focus();

   const customToggleCheckbox = document.getElementById('repeaterStyleCustomToggle');
   if (!customToggleCheckbox.checked) {
       customToggleCheckbox.checked = true; // This will trigger toggleCustomRepeaterSection
       // toggleCustomRepeaterSection will set currentRepeaterStyle to 'custom'
       // and uncheck hash/block.
   } else { // Custom is already checked, ensure style is 'custom' and others are off
       currentRepeaterStyle = 'custom';
       document.getElementById('repeaterStyleHash').checked = false;
       document.getElementById('repeaterStyleBlock').checked = false;
       // Ensure custom section is visible (it should be if customToggleCheckbox is checked)
       document.getElementById('customRepeaterSection').style.display = 'block';
   }
   console.log(`[DEBUG] showCustomRepeaterInputs: currentRepeaterStyle is now: ${currentRepeaterStyle}`);
   // updateCustomRepeaterPreview(); // Preview will update on input
   saveSettings();
}

function updateCustomRepeaterPreview() {
   customRepeaterFilled = document.getElementById('customRepeaterFilled').value || '■';
   customRepeaterUnfilled = document.getElementById('customRepeaterUnfilled').value || '□';
   const previewSpan = document.getElementById('customRepeaterPreview');
   if (previewSpan) {
     previewSpan.textContent = generateRepeaterString(0.5, customRepeaterFilled, customRepeaterUnfilled);
   }

   const customToggleCheckbox = document.getElementById('repeaterStyleCustomToggle');
   if (!customToggleCheckbox.checked) {
       customToggleCheckbox.checked = true; // This triggers toggleCustomRepeaterSection
                                         // which sets currentRepeaterStyle = 'custom'
                                         // and unchecks hash/block.
   } else { // Custom checkbox is already checked, ensure style is 'custom'.
        currentRepeaterStyle = 'custom';
        // Ensure other checkboxes are off if user interacts with custom inputs
        document.getElementById('repeaterStyleHash').checked = false;
        document.getElementById('repeaterStyleBlock').checked = false;
   }
   console.log(`[DEBUG] updateCustomRepeaterPreview: customFilled: ${customRepeaterFilled}, customUnfilled: ${customRepeaterUnfilled}, currentRepeaterStyle: ${currentRepeaterStyle}`);
   updateAllTaskDisplays();
   saveSettings();
}
 // --- END REPEATER FUNCTIONS ---

  // Toggle settings panel
 function toggleSettingsPanel() {
  console.log('[DEBUG Kilo] toggleSettingsPanel: Called.');
  console.log(`[DEBUG Kilo] toggleSettingsPanel: current themeSelect.value: ${document.getElementById('themeSelect').value}`);
  console.log(`[DEBUG Kilo] toggleSettingsPanel: current body.className: ${document.body.className}`);
  console.log(`[DEBUG Kilo] toggleSettingsPanel: current body.style.--custom-text: ${document.body.style.getPropertyValue('--custom-text')}`);
   const panel = document.getElementById('settingsPanel');
   panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
 }
  // Toggle add panel
 function toggleAddPanel() {
   console.log("DEBUG: toggleAddPanel() called. Current panel display:", document.getElementById('addPanel').style.display); // ADDED
   const panel = document.getElementById('addPanel');
   if (panel.style.display === 'block') {
     panel.style.display = 'none';
     console.log("DEBUG: addPanel set to 'none'"); // ADDED
   } else {
     panel.style.display = 'block';
     // panel.style.transform = 'translateY(0)'; // No longer needed with fixed positioning
     console.log("DEBUG: addPanel set to 'block'"); // ADDED
     document.getElementById('timeInput').focus();
     // panel.scrollIntoView({behavior: 'smooth'}); // No longer needed with fixed positioning
   }
 }
  // Parse time input
 function parseTime(input) {
   const regex = /\d+\s*[hms]/g;
   let total = 0;
   const matches = input.match(regex);
   if (!matches) return 0;
   for (const part of matches) {
     const num = parseInt(part);
     if (part.includes('h')) total += num * 3600;
     else if (part.includes('m')) total += num * 60;
     else if (part.includes('s')) total += num;
   }
   return total;
 }
  // Format time left
 function formatTimeLeft(seconds) {
   const hours = Math.floor(seconds / 3600);
   const mins = Math.floor((seconds % 3600) / 60);
   const secs = seconds % 60;
  
   let result = '';
   if (hours > 0) result += `${hours}h `;
   if (mins > 0 || hours > 0) result += `${mins}m `;
   result += `${secs}s`;
   return result.trim();
 }
  // Start a new task
 function startTask() {
   console.log("DEBUG: startTask() called");
   const timeInputElem = document.getElementById('timeInput');
   const taskNameInputElem = document.getElementById('taskNameInput');
   const notesInputElem = document.getElementById('notesInput');
    if (!timeInputElem || !taskNameInputElem || !notesInputElem) {
     console.error("DEBUG: One or more input elements not found in startTask");
     return;
   }
    const timeStr = timeInputElem.value.trim();
   const task = taskNameInputElem.value.trim().toUpperCase() || 'TASK';
   const notes = notesInputElem.value.trim();
   const duration = parseTime(timeStr);
  
   console.log(`DEBUG: timeStr: '${timeStr}', task: '${task}', notes: '${notes}', duration: ${duration}`);
    if (!duration) {
     console.log("DEBUG: startTask() returning due to no duration.");
     return;
   }
   const endTime = new Date(Date.now() + duration * 1000);
  
   // Handle color selection
   let colorHex;
   let colorKey;
   if (typeof selectedColor === 'string' && selectedColor in currentColorSet) {
     colorHex = currentColorSet[selectedColor];
     colorKey = selectedColor;
     console.log(`DEBUG: Using preset color: ${selectedColor}, hex: ${colorHex}`);
   } else {
     colorHex = selectedColor; // This would be a hex string from the custom color input
     colorKey = null;
     console.log(`DEBUG: Using custom color hex: ${colorHex}`);
   }
  
   addTask(task, duration, endTime, notes, colorHex, colorKey);
    // Reset input fields & hide panel
   const panel = document.getElementById('addPanel');
   if (panel) panel.style.display = 'none';
   else console.error("DEBUG: addPanel not found in startTask");
    timeInputElem.value = '';
   taskNameInputElem.value = '';
   notesInputElem.value = '';
   selectedColor = 'white'; // Reset selected color to default
   updateColorBoxes(); // Refresh the color picker UI to reflect the reset
   console.log("DEBUG: Inputs reset and color picker updated.");
    // Hide big button and show bottom controls if first task
   if (taskContainer && bigAddButton && bottomControls) {
     if (taskContainer.children.length === 1) { // Check if it was the first task added
       bigAddButton.style.display = 'none';
       bottomControls.style.display = 'flex';
       console.log("DEBUG: First task added, adjusting button visibility.");
     }
   } else {
     console.error("DEBUG: taskContainer, bigAddButton, or bottomControls not found in startTask");
   }
  
    // Scroll to bottom to see new task and controls
   if (taskContainer) {
     setTimeout(() => {
       taskContainer.scrollTop = taskContainer.scrollHeight;
       console.log("DEBUG: Scrolled to bottom.");
     }, 100);
   }
   console.log("DEBUG: startTask() finished.");
 }
  // Update all task displays
 function updateAllTaskDisplays() {
   document.querySelectorAll('.task').forEach(task => {
     if (task.updateDisplay) {
       task.updateDisplay();
     }
   });
 }
  // Add a new task
 function addTask(taskName, totalSec, endTime, notes, color, colorKey = null) {
   const div = document.createElement('div');
   div.className = 'task' + (simplifiedView ? ' simplified' : '');
   div.style.borderColor = color;
   div.style.color = color;
   div.style.borderRadius = `${boxRadius}px`;
  
   // Store color information for theme changes
   if (colorKey) {
     div.dataset.colorKey = colorKey;
   } else {
     div.dataset.customColor = color; // Store the actual hex if it's custom
   }
    let isPaused = false;
    let pausedTimeLeft = 0;
    let updateInterval;
    function updateTaskDisplay() {
      // Log current state for diagnosis
      console.log(`[Debug] updateTaskDisplay: Task: "${taskName}", simplifiedView: ${simplifiedView}, current div.className: "${div.className}"`);

      const now = new Date();
     const timeLeft = isPaused ? pausedTimeLeft : Math.max(0, Math.floor((endTime - now) / 1000));
     const percent = 1 - (timeLeft / totalSec);
    
     if (simplifiedView) {
       div.innerHTML = '';
      
       const container = document.createElement('div');
       container.style.display = 'flex';
       container.style.justifyContent = 'center'; // Center the content
       container.style.alignItems = 'center';
       container.style.width = '100%';
       container.style.padding = '0 15px';
      
       const nameSpan = document.createElement('span');
       nameSpan.textContent = taskName;
       nameSpan.style.fontWeight = 'bold';
       nameSpan.style.flex = '0 1 auto';
       nameSpan.style.textAlign = 'right';
       nameSpan.style.paddingRight = '10px';
       nameSpan.style.overflow = 'hidden';
       nameSpan.style.textOverflow = 'ellipsis';
       nameSpan.style.whiteSpace = 'nowrap';
      
       const separator = document.createElement('span');
       separator.textContent = '|';
       separator.style.margin = '0 5px';
       separator.style.flex = '0 0 auto';

       const contentSpan = document.createElement('span'); // Renamed from timeSpan
       contentSpan.style.flex = '0 1 auto';
       contentSpan.style.textAlign = 'left';
       contentSpan.style.paddingLeft = '10px';
       contentSpan.style.overflow = 'hidden';
       contentSpan.style.textOverflow = 'ellipsis';
       contentSpan.style.whiteSpace = 'nowrap';
       contentSpan.textContent = formatTimeLeft(timeLeft) + (isPaused ? ' (PAUSED)' : ''); // Reverted to original simplified view
      
       container.appendChild(nameSpan);
       container.appendChild(separator);
       container.appendChild(contentSpan);
       div.appendChild(container);
     } else { // Non-simplified view - Apply repeater styles here
       const mins = Math.floor(timeLeft / 60);
       const secs = timeLeft % 60;
       const percent = totalSec > 0 ? 1 - (timeLeft / totalSec) : 0; // percent is available from outer scope
       let bar = '';
       console.log(`[DEBUG] updateTaskDisplay (non-simplified): Task "${taskName}", currentRepeaterStyle: ${currentRepeaterStyle}, customFilled: ${customRepeaterFilled}, customUnfilled: ${customRepeaterUnfilled}`);

       // currentRepeaterStyle should always have a value (default 'block')
       let filledChar = '█'; // Default to block characters
       let unfilledChar = '.'; // Default to block characters

       if (currentRepeaterStyle === 'hash') {
           filledChar = '#';
           unfilledChar = '.';
       } else if (currentRepeaterStyle === 'block') {
           filledChar = '█';
           unfilledChar = '.';
       } else if (currentRepeaterStyle === 'custom') {
           filledChar = customRepeaterFilled;
           unfilledChar = customRepeaterUnfilled;
       }
       // If currentRepeaterStyle was somehow null/undefined, it would use the default initialized filledChar/unfilledChar.

       bar = generateRepeaterString(percent, filledChar, unfilledChar, repeaterLength);

       let text =
`DO ${taskName} UNTIL ${formatTimeUntil(endTime)}
 ${bar}
 TIME LEFT: ${mins}mins ${secs}s${isPaused ? ' (PAUSED)' : ''}`;
       if (notes) {
         text += `\nNOTES: ${notes}`;
       }
       div.innerText = text;
     }
   }
    div.updateDisplay = updateTaskDisplay;
    function startTimer() {
     updateInterval = setInterval(() => {
       if (isPaused) return;
      
       updateTaskDisplay();
        const now = new Date();
       const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
       if (timeLeft <= 0) {
         clearInterval(updateInterval);
         try {
           const audio = document.getElementById('successSound');
           audio.currentTime = 0; // Reset to start
           audio.play().catch(e => console.log('Audio play failed:', e));
         } catch (e) {
           console.log('Audio error:', e);
         }
         div.dataset.finished = 'true';
         div.style.opacity = '0.6';
       }
     }, 1000);
   }
   // Left click to pause/resume
   div.onclick = (e) => {
     if (e.button !== 0) return; // Only left click
    
     isPaused = !isPaused;
     if (isPaused) {
       const now = new Date();
       pausedTimeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
       clearInterval(updateInterval);
       div.classList.add('paused');
     } else {
       endTime = new Date(Date.now() + pausedTimeLeft * 1000);
       startTimer();
       div.classList.remove('paused');
     }
     updateTaskDisplay();
   };
    // Right click for menu
   div.oncontextmenu = (e) => {
     e.preventDefault();
    
     // Remove any existing menu
     const existingMenu = document.querySelector('.context-menu');
     if (existingMenu) existingMenu.remove();
    
     // Create new menu
     const menu = document.createElement('div');
     menu.className = 'context-menu';
     menu.style.left = `${e.pageX}px`;
     menu.style.top = `${e.pageY}px`;
    
     // Add menu items
     const pauseItem = document.createElement('div');
     pauseItem.className = 'context-menu-item';
     pauseItem.textContent = isPaused ? 'UNPAUSE TASK' : 'PAUSE TASK';
     pauseItem.onclick = (e) => {
       e.stopPropagation();
       isPaused = !isPaused;
       if (isPaused) {
         const now = new Date();
         pausedTimeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
         clearInterval(updateInterval);
         div.classList.add('paused');
       } else {
         endTime = new Date(Date.now() + pausedTimeLeft * 1000);
         startTimer();
         div.classList.remove('paused');
       }
       updateTaskDisplay();
       menu.remove();
     };
    
     const deleteItem = document.createElement('div');
     deleteItem.className = 'context-menu-item';
     deleteItem.textContent = 'DELETE TASK';
     deleteItem.onclick = (e) => {
       e.stopPropagation();
       div.remove();
       menu.remove();
       if (taskContainer.children.length === 0) {
         bigAddButton.style.display = 'block';
         bottomControls.style.display = 'none';
       }
     };
    
     const editItem = document.createElement('div');
     editItem.className = 'context-menu-item';
     editItem.textContent = 'EDIT TASK';
     editItem.onclick = (e) => {
       e.stopPropagation();
       console.log("DEBUG: 'EDIT TASK' clicked. Task name:", taskName);
      
       // Store reference to this task div
       const taskDiv = div;
      
       // Open add panel with task details
       const panel = document.getElementById('addPanel');
       panel.style.display = 'block';
       document.getElementById('timeInput').value = formatTimeLeft(isPaused ? pausedTimeLeft : Math.max(0, Math.floor((endTime - new Date()) / 1000)));
       document.getElementById('taskNameInput').value = taskName;
       document.getElementById('notesInput').value = notes || '';
      
       // Set color
       if (colorKey) {
         selectedColor = colorKey;
       } else {
         selectedColor = color;
       }
       updateColorBoxes();
      
       // Override the startTask function temporarily for this edit
       const originalStartTask = window.startTask;
       window.startTask = function() {
         // Get the new values from the inputs
         const timeStr = document.getElementById('timeInput').value.trim();
         const newTaskName = document.getElementById('taskNameInput').value.trim().toUpperCase() || 'TASK';
         const newNotes = document.getElementById('notesInput').value.trim();
         const duration = parseTime(timeStr);
        
         if (!duration) return;
        
         // Update the existing task with new values
         taskName = newTaskName;
         notes = newNotes;
         totalSec = duration;
         endTime = new Date(Date.now() + duration * 1000);
         isPaused = false;
         pausedTimeLeft = 0;
        
         // Update color
         if (typeof selectedColor === 'string' && selectedColor in currentColorSet) {
           color = currentColorSet[selectedColor];
           colorKey = selectedColor;
           taskDiv.dataset.colorKey = colorKey;
           delete taskDiv.dataset.customColor;
         } else {
           color = selectedColor;
           colorKey = null;
           taskDiv.dataset.customColor = color;
           delete taskDiv.dataset.colorKey;
         }
        
         taskDiv.style.borderColor = color;
         taskDiv.style.color = color;
        
         // Restart the timer
         clearInterval(updateInterval);
         startTimer();
         updateTaskDisplay();
        
         // Reset the panel and original function
         document.getElementById('addPanel').style.display = 'none';
         document.getElementById('timeInput').value = '';
         document.getElementById('taskNameInput').value = '';
         document.getElementById('notesInput').value = '';
         selectedColor = 'white';
         updateColorBoxes();
        
         window.startTask = originalStartTask;
       };
      
       menu.remove();
       document.getElementById('timeInput').focus();
       panel.scrollIntoView({behavior: 'smooth'});
     };
    
     menu.appendChild(pauseItem);
     menu.appendChild(deleteItem);
     menu.appendChild(editItem);
     document.body.appendChild(menu);
    
     // Close menu when clicking elsewhere
     const closeMenu = (ev) => {
       if (!menu.contains(ev.target)) {
         menu.remove();
         document.removeEventListener('click', closeMenu);
       }
     };
     setTimeout(() => {
       document.addEventListener('click', closeMenu);
     }, 10);
   };
    startTimer();
   taskContainer.appendChild(div);
   updateTaskDisplay();
 }
  // Clear finished tasks
 function clearFinishedTasks() {
   [...taskContainer.children].forEach(div => {
     if (div.dataset.finished === 'true') div.remove();
   });
  
   // Show big button if no tasks left
   if (taskContainer.children.length === 0) {
     bigAddButton.style.display = 'block';
     bottomControls.style.display = 'none';
   }
 }
  // Close panels when clicking outside
 document.addEventListener('click', (e) => {
   const settingsPanel = document.getElementById('settingsPanel');
   const settingsButton = document.getElementById('settings-button');
   const addPanel = document.getElementById('addPanel');
   const addBottomButton = document.getElementById('addBottomButton'); // For the button in bottomControls
   const bigAddBtn = document.getElementById('bigAddButton'); // The big plus button
  
   console.log("DEBUG: Global click listener. Clicked target:", e.target);
    // Close settings panel if clicking outside
   if (settingsPanel.style.display === 'block' &&
       !settingsPanel.contains(e.target) &&
       !(settingsButton && settingsButton.contains(e.target))) { // Ensure settingsButton is checked if it exists
     settingsPanel.style.display = 'none';
   }
  
   // Close add panel if clicking outside
   if (addPanel.style.display === 'block') {
     const isBigAddButton = bigAddBtn && (e.target === bigAddBtn || bigAddBtn.contains(e.target));
     const isAddBottomButton = addBottomButton && (e.target === addBottomButton || addBottomButton.contains(e.target));
      if (!addPanel.contains(e.target) && !isBigAddButton && !isAddBottomButton) {
       console.log("DEBUG: Closing addPanel due to outside click (refined logic). Target:", e.target);
       addPanel.style.display = 'none';
     }
   }
 });
  // Spacebar toggles add panel unless typing in input
 document.body.addEventListener('keydown', (e) => {
   if (e.code === 'Space' &&
       e.target.tagName !== 'INPUT' &&
       e.target.tagName !== 'TEXTAREA') { // Also check for TEXTAREA
     e.preventDefault();
     toggleAddPanel();
   }
 });
  // Initialize the app
 const taskContainer = document.getElementById('task-container');
 const bigAddButton = document.getElementById('bigAddButton');
 const bottomControls = document.getElementById('bottomControls');
 const timeInput = document.getElementById('timeInput'); // Already declared, but good for reference
  // Load settings when page loads
 window.addEventListener('load', async () => { // Make the callback async
   console.log('[Renderer Process] Window load event: electronAPI object:', window.electronAPI);
   initializeEventListeners();
   await loadSettings(); // Await the completion of loadSettings
   updateFormatPreview();
  
   // Ensure scrollbars are hidden
   document.documentElement.style.overflow = 'hidden';
   document.body.style.overflow = 'hidden';
    // Initial check for task list to show/hide big button
   if (taskContainer.children.length === 0) {
     bigAddButton.style.display = 'block';
     bottomControls.style.display = 'none';
   } else {
     bigAddButton.style.display = 'none';
     bottomControls.style.display = 'flex';
   }
 });
  document.getElementById('timeFormatSelect').addEventListener('change', (e) => {
   timeFormat = e.target.value;
   console.log(`DEBUG: timeFormatSelect changed. New timeFormat: ${timeFormat}`); // ADDED
   updateAllTaskDisplays();
   saveSettings();
 });


 

