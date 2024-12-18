# <p align="center"> Pantry Tracker Card </p>

<p align="center">
<img src="https://github.com/mintcreg/pantry_tracker/blob/main/images/logo.webp" alt="Pantry Tracker Card Logo" width="300">
</p>

> [!CAUTION]
> This is a work in progress and made using GPT and basic knowledge.

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

4. **Restart HomeAssistant**
Ensure a full restart of HomeAssistant has taken place before installing (or restart after installing)

---

## Screenshots


![Screenshot](https://raw.githubusercontent.com/mintcreg/pantry_tracker_card/main/images/%231.PNG)


---

# Installation

- Add the Pantry Tracker Card to Home Assistant through HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?repository=pantry_tracker_card&category=Dashboard&owner=mintcreg)

***or*** 

- Manually copy `pantry-card.js` to the `/www/` directory in your Home Assistant configuration.

- Add the card to your Lovelace resources:
   - Navigate to **Settings** > **Dashboards** > **Resources**.
   - Add a new resource:
     - URL: `/local/pantry-card.js`
     - Resource type: `JavaScript Module`.

- Include the card in your Lovelace dashboard:
   ```yaml
   type: custom:pantry-card
   entity_prefix: sensor.product_
   search: true
   ```

## Card Options

Below are the available configuration options for the Pantry Tracker Lovelace card:

| **Option**           | **Description**                                                                 | **Type**       | **Default** | **Required** |
|----------------------|-------------------------------------------------------------------------------|----------------|-------------|--------------|
| `entity_prefix`      | The prefix for your pantry product entities (e.g., `sensor.product_`).         | `string`       | N/A         | **Yes**      |
| `search`             | Adds a search bar to filter products dynamically.                             | `boolean`      | `false`     | No           |
| `category_filter`    | Enables a dropdown to filter products by category.                            | `boolean`      | `false`     | No           |
| `filter_categories`  | An array of categories to exclude from the card.                              | `list(string)` | `[]`        | No           |
| `show_images`        | Toggles whether to display product images in the card.                        | `boolean`      | `true`      | No           |
| `empty_state_text`   | Custom text/HTML to display when no products are available.                   | `string/html`  | N/A         | No           |


## Example Usage

```yaml
type: custom:pantry-card
entity_prefix: sensor.product_
search: true
category_filter: true
filter_categories:
  - Water
  - Snacks
show_images: true
empty_state_text: >
  <p style="color: red; font-weight: bold;">No products found!</p>

```

