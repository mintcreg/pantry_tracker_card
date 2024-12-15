# <p align="center"> Pantry Tracker Card </p>

<p align="center">
<img src="https://github.com/mintcreg/pantry_tracker/blob/main/images/logo.webp" alt="Pantry Tracker Card Logo" width="300">
</p>

# Description

The Pantry Tracker Card is a custom Lovelace card for Home Assistant designed specifically to work with the **Pantry Tracker** add-on. It provides a sleek and user-friendly interface for tracking and managing your pantry items directly from your Home Assistant dashboard.

This card displays categories and products, along with their quantities, and allows you to adjust quantities in real time using simple controls.

---

# Features

✨ **Seamless Integration**  
Built to work exclusively with the **Pantry Tracker Add-on**, providing a unified experience for managing your inventory.

📦 **Product and Category View**  
Easily browse categories, view products, and their current counts.

➕➖ **Real-Time Updates**  
Update product counts (increase/decrease) directly from the card, with changes reflected within 30 seconds.

🖼️ **Image Support**  
Displays product images for a more visual inventory management experience.

---

# Requirements

1. **Pantry Tracker Add-on**  
Ensure that the [Pantry Tracker Add-on](https://github.com/mintcreg/pantry_tracker/) is installed and running in Home Assistant.

2. **Custom Components for Pantry Tracker**  
Install the [Pantry Tracker Custom Components](https://github.com/mintcreg/pantry_tracker_components).

---

# Installation

1. Add the Pantry Tracker Card to Home Assistant through HACS or manually copy `pantry-card.js` to the `/www/` directory in your Home Assistant configuration.

2. Add the card to your Lovelace resources:
   - Navigate to **Settings** > **Dashboards** > **Resources**.
   - Add a new resource:
     - URL: `/local/pantry-card.js`
     - Resource type: `JavaScript Module`.

3. Include the card in your Lovelace dashboard:
   ```yaml
   type: custom:pantry-card
   entity_prefix: sensor.product_