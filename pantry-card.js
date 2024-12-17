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

    this.categoryFilterEnabled = (config.category_filter === true);
    this.selectedCategory = "all";

    // Store filter_categories if provided
    this.filteredCategories = Array.isArray(config.filter_categories) ? config.filter_categories : [];
  }

  set hass(hass) {
    this._hass = hass;
    const entities = Object.values(hass.states)
      .filter(
        (entity) =>
          entity.entity_id.startsWith(this.config.entity_prefix) &&
          entity.attributes.category !== undefined &&
          entity.state !== "unavailable"
      );

    const entityIds = entities.map((e) => e.entity_id).join(",");
    if (this._entities !== entityIds) {
      this._entities = entityIds;
      this._originalEntities = entities;
      this.updateView();
    }
  }

  filterEntities() {
    let filtered = this._originalEntities;

    // Exclude categories listed in filter_categories
    if (this.filteredCategories.length > 0) {
      filtered = filtered.filter((e) => !this.filteredCategories.includes(e.attributes.category));
    }

    // Search filter
    if (this.searchTerm && this.searchTerm.trim() !== "") {
      const search = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter((e) =>
        (e.attributes.product_name || e.entity_id).toLowerCase().includes(search)
      );
    }

    // Category filter (dropdown)
    if (this.categoryFilterEnabled && this.selectedCategory !== "all") {
      filtered = filtered.filter(
        (e) => e.attributes.category && e.attributes.category === this.selectedCategory
      );
    }

    return filtered;
  }

  updateView() {
    if (!this.hasRenderedInitially) {
      this.renderBaseStructure();
      this.hasRenderedInitially = true;
    }
    const entities = this.filterEntities();
    this.renderCategories(entities);
  }

  renderBaseStructure() {
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

        .search-container, .filter-container {
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

        .category-dropdown {
          padding: 8px;
          font-size: 16px;
          border-radius: 5px;
          border: 1px solid #ccc;
          background-color: #fff;
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

        .product-placeholder {
          text-align: center;
          font-size: 1em;
          color: #6c757d;
          margin: 10px 0;
          font-style: italic;
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

    let filterHtml = "";
    if (this.categoryFilterEnabled) {
      filterHtml = `<div class="filter-container"><select class="category-dropdown"></select></div>`;
    }

    const baseHtml = `
      ${style}
      ${searchHtml}
      ${filterHtml}
      <div class="categories-container"></div>
    `;

    this.shadowRoot.innerHTML = baseHtml;

    // Setup search events
    if (this.config.search) {
      const searchInput = this.shadowRoot.querySelector(".search-input");
      const resetButton = this.shadowRoot.querySelector(".reset-button");

      searchInput.value = this.searchTerm;

      searchInput.addEventListener("input", () => {
        this.searchTerm = searchInput.value;
        this.updateView();
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

    // Determine all categories from original entities
    let allCategories = [...new Set(this._originalEntities.map((e) => e.attributes.category))];

    // Filter out categories listed in filter_categories from allCategories as well
    if (this.filteredCategories.length > 0) {
      allCategories = allCategories.filter(cat => !this.filteredCategories.includes(cat));
    }

    // Populate dropdown if category_filter enabled
    if (this.categoryFilterEnabled) {
      const dropdown = this.shadowRoot.querySelector(".category-dropdown");
      if (dropdown) {
        dropdown.innerHTML = `<option value="all">All Categories</option>`;
        allCategories.forEach(cat => {
          const selected = this.selectedCategory === cat ? "selected" : "";
          dropdown.insertAdjacentHTML("beforeend", `<option value="${cat}" ${selected}>${cat}</option>`);
        });

        if (!this.dropdownListenerAttached) {
          dropdown.addEventListener("change", (e) => {
            this.selectedCategory = e.target.value;
            this.updateView();
          });
          this.dropdownListenerAttached = true;
        }
      }
    }

    // If no entities match (after filtering)
    if (!entities || entities.length === 0) {
      // If searching, show "No results found"
      if (this.searchTerm.trim() !== "") {
        container.innerHTML = `
          <div class="empty-state">
            <div>No results found</div>
          </div>
        `;
      } else {
        // No search term, show empty state or default
        const emptyStateText = this.config.empty_state_text;
        if (emptyStateText) {
          container.innerHTML = `
            <div class="empty-state">
              ${emptyStateText}
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="empty-state">
              <span class="emoji">🤷</span>
              <div class="empty-message">No products found. Try adding some products or adjust your search/sorting.</div>
            </div>
          `;
        }
      }
      return;
    }

    const showImages = this.config.show_images !== false;
    const isSearching = this.searchTerm.trim() !== "";

    // Determine which categories to render
    // If filtering by category, only show that category
    const categoriesToRender =
      this.categoryFilterEnabled && this.selectedCategory !== "all"
        ? [this.selectedCategory]
        : allCategories;

    const cardHtml = categoriesToRender
      .map((category) => {
        const products = entities.filter((e) => e.attributes.category === category);

        // If searching and no products, skip category
        if (isSearching && products.length === 0) {
          return "";
        }

        // If no products, skip category (no show_empty_categories logic needed now)
        if (products.length === 0) {
          return "";
        }

        const productsHtml = products
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
          .join("");

        return `
          <div class="category">
            <h2>${category}</h2>
            ${productsHtml}
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
