const API = (() => {
  const baseURL = "http://localhost:3000";

  const getInventory = () => {
    return fetch(`${baseURL}/inventory`).then((res) => res.json());
  };

  const getCart = () => {
    return fetch(`${baseURL}/cart`).then((res) => res.json());
  };

  const addToCart = (item) => {
    return fetch(`${baseURL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    }).then((res) => res.json());
  };

  const updateCartItem = (id, item) => {
    return fetch(`${baseURL}/cart/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    return fetch(`${baseURL}/cart/${id}`, { method: "DELETE" }).then((res) =>
      res.json()
    );
  };

  return { getInventory, getCart, addToCart, updateCartItem, deleteFromCart };
})();

const Model = (() => {
  class State {
    #inventory = [];
    #cart = [];
    #onChange;

    get inventory() {
      return this.#inventory;
    }

    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    get cart() {
      return this.#cart;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  return {
    State,
    ...API,
  };
})();


const View = (() => {
  const inventoryListEl = document.querySelector(".inventory-container ul");
  const cartListEl = document.querySelector(".cart-container ul");
  const checkoutBtnEl = document.querySelector(".checkout-btn");

  const renderInventory = (inventory) => {
    inventoryListEl.innerHTML = inventory
      .map(
        (item) =>
          `<li id="${item.id}" class="item">
          <span class="item-name">${item.content}</span>
          <div class="quantity-controls">
            <button class="minus">-</button>
            <span class="quantity">0</span>
            <button class="plus">+</button>
          </div>
          <button class="add-to-cart">Add to Cart</button>
        </li>`
      )
      .join("");
  };

  const renderCart = (cart) => {
    cartListEl.innerHTML = cart
      .map((item) => (
        `<li id="${item.id}" class="item">
          <span class="item-name">${item.content}</span>
          <span class="quantity">x ${item.quantity}</span>
          <button class="delete-from-cart">Delete</button>
        </li>`
      ))
      .join("");
  };

  return {
    renderInventory,
    renderCart,
    inventoryListEl,
    cartListEl,
    checkoutBtnEl,
  };
})();


const Controller = ((model, view) => {
  const state = new model.State();

  const init = () => {
    model.getInventory().then((data) => (state.inventory = data));
    model.getCart().then((data) => (state.cart = data));
    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });
    setupEventListeners();
  };

const setupEventListeners = () => {
  view.inventoryListEl.addEventListener("click", (event) => {
    if (
      event.target.className === "plus" ||
      event.target.className === "minus"
    ) {
      const li = event.target.closest("li");
      const quantitySpan = li.querySelector(".quantity");
      let quantity = parseInt(quantitySpan.textContent);

      if (event.target.className === "plus") {
        quantity++;
      } else if (event.target.className === "minus" && quantity > 0) {
        quantity--;
      }

      quantitySpan.textContent = quantity;
    }
  });

view.inventoryListEl.addEventListener("click", (event) => {
  if (event.target.className === "add-to-cart") {
    const li = event.target.closest("li");
    const id = parseInt(li.id);
    const content = li.querySelector(".item-name").textContent; // Updated this line
    const quantity = parseInt(li.querySelector(".quantity").textContent);

    if (quantity > 0) {
      const itemToAdd = state.cart.find((item) => item.id === id);
      if (itemToAdd) {
        itemToAdd.quantity += quantity;
        model.updateCartItem(id, { quantity: itemToAdd.quantity }).then(() => {
          state.cart = [...state.cart];
        });
      } else {
        model.addToCart({ id, content, quantity }).then((data) => {
          state.cart = [...state.cart, data];
        });
      }
      li.querySelector(".quantity").textContent = "0"; // reset
    }
  }
});


  view.cartListEl.addEventListener("click", (event) => {
    if (event.target.className === "delete-from-cart") {
      const id = parseInt(event.target.closest("li").id);
      model.deleteFromCart(id).then(() => {
        state.cart = state.cart.filter((item) => item.id !== id);
      });
    }
  });

  view.checkoutBtnEl.addEventListener("click", () => {
    state.cart.forEach((item) => model.deleteFromCart(item.id));
    state.cart = [];
  });
};

  return {
    init,
  };
})(Model, View);

Controller.init();
