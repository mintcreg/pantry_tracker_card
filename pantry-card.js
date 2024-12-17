class PantryCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity_prefix) {
      throw new Error("Define an entity_prefix");
    }

    this.config = config;
    this.attachShadow({ mode: "open" });
    this._entities = [];
    this._originalEntities = [];
    this.searchTerm = "";
    this.hasRenderedInitially = false;
  }

  set hass(hass) {
    this._hass = hass;
    const entities = Object.values(hass.states)
      .filter(
        (entity) =>
          entity.entity_id.startsWith(this.config.entity_prefix) &&
          entity.attributes.category !== undefined && // Exclude undefined categories
          entity.state !== "unavailable" // Exclude unavailable sensors
      );

    const entityIds = entities.map((e) => e.entity_id).join(",");
    if (this._entities !== entityIds) {
      this._entities = entityIds;
      this._originalEntities = entities;
      this.updateView();
    }
  }

  filterEntities() {
    if (!this.searchTerm || this.searchTerm.trim() === "") {
      return this._originalEntities;
    }
    const search = this.searchTerm.trim().toLowerCase();
    return this._originalEntities.filter((e) =>
      (e.attributes.product_name || e.entity_id).toLowerCase().includes(search)
    );
  }

  updateView() {
    if (!this.hasRenderedInitially) {
      // Initial render of the structure, including search container if needed
      this.renderBaseStructure();
      this.hasRenderedInitially = true;
    }
    // Re-render just the categories container
    const entities = this.filterEntities();
    this.renderCategories(entities);
  }

  renderBaseStructure() {
    // This sets up the initial HTML structure without losing focus on subsequent updates
    const style = `
      <style>
        .category {
          margin-bottom: 20px;
        }
        .category h2 {
          text-align: center;
          font-size: 1.5em;
          margin-bottom: 10px;
          color: #ffffff;
          background-color: #007bff;
          padding: 10px;
          border-radius: 5px;
        }
        .product {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 10px 0;
        }
        .product-name {
          flex: 2;
          text-align: center;
        }
        .product-image {
          flex: 1;
          max-height: 40px;
          max-width: 40px;
          text-align: center;
        }
        .product-count {
          flex: 1;
          text-align: center;
        }
        button {
          flex: 1;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: 16px;
        }
        button.decrease {
          background-color: #dc3545;
          transition: background-color 0.3s ease;
        }
        button.decrease:hover {
          background-color: #a71d2a;
        }
        button.increase {
          background-color: #28a745;
          transition: background-color 0.3s ease;
        }
        button.increase:hover {
          background-color: #19692c;
        }

        .search-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
          gap: 10px;
        }
        .search-input {
          padding: 8px;
          font-size: 16px;
          border-radius: 5px;
          border: 1px solid #ccc;
          width: 70%;
        }
        .reset-button {
          background-color: #6c757d;
          border: none;
          border-radius: 5px;
          padding: 8px 15px;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .reset-button:hover {
          background-color: #5a6268;
        }

        .error {
          color: red;
          text-align: center;
        }

        .empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: red;
          font-weight: bold;
          font-size: 1.2em;
          gap: 10px;
        }
        .empty-state .emoji {
          font-size: 1.5em;
        }
      </style>
    `;

    let searchHtml = "";
    if (this.config.search) {
      searchHtml = `
        <div class="search-container">
          <input type="text" class="search-input" placeholder="Search products..." />
          <button class="reset-button">Reset</button>
        </div>
      `;
    }

    const baseHtml = `
      ${style}
      ${searchHtml}
      <div class="categories-container"></div>
    `;

    this.shadowRoot.innerHTML = baseHtml;

    if (this.config.search) {
      const searchInput = this.shadowRoot.querySelector(".search-input");
      const resetButton = this.shadowRoot.querySelector(".reset-button");

      // Restore previously typed search term
      searchInput.value = this.searchTerm;

      // Filter as user types without re-rendering the entire structure
      searchInput.addEventListener("input", () => {
        this.searchTerm = searchInput.value;
        this.updateView(); // re-renders categories only
      });

      resetButton.addEventListener("click", () => {
        this.searchTerm = "";
        searchInput.value = "";
        this.updateView();
      });
    }
  }

  renderCategories(entities) {
    const container = this.shadowRoot.querySelector(".categories-container");
    if (!container) return;

    if (!entities || entities.length === 0) {
      // Check if user provided empty_state_text
      const emptyStateText = this.config.empty_state_text;
      if (emptyStateText) {
        container.innerHTML = `
          <div class="empty-state">
            ${emptyStateText}
          </div>
        `;
      } else {
        // Default empty state if none provided
        container.innerHTML = `
          <div class="empty-state">
            <span class="emoji">🤷</span>
            <div class="empty-message">No products found. Try adding some products or adjust your search/sorting.</div>
          </div>
        `;
      }
      return;
    }

    const categories = [...new Set(entities.map((e) => e.attributes.category))];

    const showImages = this.config.show_images !== false; // Default true if not specified

    const cardHtml = categories
      .map((category) => {
        const products = entities.filter((e) => e.attributes.category === category);
        if (products.length === 0) return "";
        return `
          <div class="category">
            <h2>${category}</h2>
            ${products
              .map((product) => {
                const productName = product.attributes.product_name || product.entity_id;
                const productCount = product.state;
                const imageTag = showImages
                  ? `<img src="${product.attributes.url || ""}" alt="No Image" class="product-image" />`
                  : "";
                return `
                  <div class="product">
                    <span class="product-name">${productName}</span>
                    ${imageTag}
                    <span class="product-count" data-entity="${product.entity_id}">${productCount}</span>
                    <button class="decrease" data-entity="${product.entity_id}">-</button>
                    <button class="increase" data-entity="${product.entity_id}">+</button>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;
      })
      .join("");

    container.innerHTML = cardHtml;

    // Add event listeners to increase/decrease buttons
    container.querySelectorAll(".increase").forEach((button) =>
      button.addEventListener("click", (e) =>
        this.handleButtonClick("pantry_tracker.increase_count", e.target.dataset.entity, 1)
      )
    );

    container.querySelectorAll(".decrease").forEach((button) =>
      button.addEventListener("click", (e) =>
        this.handleButtonClick("pantry_tracker.decrease_count", e.target.dataset.entity, -1)
      )
    );
  }

  handleButtonClick(service, entityId, delta) {
    const countElement = this.shadowRoot.querySelector(
      `.product-count[data-entity="${entityId}"]`
    );

    if (countElement) {
      const currentCount = parseInt(countElement.textContent, 10);
      countElement.textContent = currentCount + delta;
    }

    this.callService(service, entityId);
  }

  callService(service, entityId) {
    this._hass.callService("pantry_tracker", service.split(".")[1], {
      entity_id: entityId,
    });

    setTimeout(() => {
      const updatedEntity = this._hass.states[entityId];
      if (updatedEntity) {
        const productCountElement = this.shadowRoot.querySelector(
          `.product-count[data-entity="${entityId}"]`
        );
        if (productCountElement) {
          productCountElement.textContent = updatedEntity.state;
        }
      }
    }, 1000);
  }
}

customElements.define("pantry-card", PantryCard);
