class PantryCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity_prefix) {
      throw new Error("Define an entity_prefix");
    }

    this.config = config;
    this.attachShadow({ mode: "open" });
    this._entities = [];
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
      this.render(entities);
    }
  }

  render(entities) {
    if (entities.length === 0) {
      this.shadowRoot.innerHTML = `
        <style>
          .error {
            color: red;
            text-align: center;
          }
        </style>
        <div class="error">No products found.</div>
      `;
      return;
    }

    const categories = [...new Set(entities.map((e) => e.attributes.category))];
    const cardHtml = categories
      .map((category) => {
        const products = entities.filter(
          (e) => e.attributes.category === category
        );
        return `
          <div class="category">
            <h2>${category}</h2>
            ${products
              .map(
                (product) => `
              <div class="product">
                <span class="product-name">${
                  product.attributes.product_name || product.entity_id
                }</span>
                <img src="${
                  product.attributes.url || ""
                }" alt="No Image" class="product-image" />
                <span class="product-count" data-entity="${
                  product.entity_id
                }">${product.state}</span>
                <button class="decrease" data-entity="${
                  product.entity_id
                }">-</button>
                <button class="increase" data-entity="${
                  product.entity_id
                }">+</button>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
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
      </style>
      ${cardHtml}
    `;

    this.shadowRoot
      .querySelectorAll(".increase")
      .forEach((button) =>
        button.addEventListener("click", (e) =>
          this.handleButtonClick(
            "pantry_tracker.increase_count",
            e.target.dataset.entity,
            1
          )
        )
      );

    this.shadowRoot
      .querySelectorAll(".decrease")
      .forEach((button) =>
        button.addEventListener("click", (e) =>
          this.handleButtonClick(
            "pantry_tracker.decrease_count",
            e.target.dataset.entity,
            -1
          )
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
