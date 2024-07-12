// Get references to HTML elements
const cartItemsElement = document.getElementById("cart-items");
const cartTotalElement = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const cartSidebar = document.getElementById("cart-sidebar");
const openCartBtn = document.querySelector(".fas.fa-shopping-cart");
const closeCartBtn = document.getElementById("close-cart-btn");
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const couponCodeInput = document.getElementById("coupon-code");
const openCartBtn1 = document.querySelectorAll(".open-cart-btn");
// Initialize cart data
const cart = [];
let total = 0;
let couponApplied = false;
// Coupon discount percentage
const couponDiscountPercentage = 20; // 20% discount

// Function to add an item to the cart and display a message
function addToCart(item) {
  // cart.push(item);
  const existingItem = cart.find((cartItem) => cartItem.name === item.name);

  if (existingItem) {
      // If the item exists, increment the quantity
      existingItem.quantity++;
      existingItem.price = existingItem.quantity * existingItem.originalPrice; // Update the total price for this item
  } else {
      // If the item doesn't exist, add it to the cart
      item.quantity = 1; // Initialize the quantity to 1
      item.price = item.quantity * item.originalPrice; // Calculate the item price
      cart.push(item);
  }

  // total += item.price;
  total = calculateTotalPrice(cart);
  updateCartUI();
  
  // Display a message when a product is added to the cart
  alert(`${item.name} has been added to your cart.`);
  updateCartAndApplyCoupon();
}

// Function to calculate the total price based on cart items
function calculateTotalPrice(cartItems) {
  return cartItems.reduce((total, item) => total + item.price, 0);
}

function updateCartUI() {
  cartItemsElement.innerHTML = ""; // Clear the cart items

  cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "cart-item";

      const productContainer = document.createElement("div");
      productContainer.className = "cart-item-container";
      li.appendChild(productContainer);

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name;
      img.className = "cart-item-image";
      productContainer.appendChild(img);

      const itemDetailsContainer = document.createElement("div");
      itemDetailsContainer.className = "cart-item-details-container";
      productContainer.appendChild(itemDetailsContainer);

      const productName = document.createElement("div");
      productName.textContent = item.name;
      productName.className = "cart-item-name";
      itemDetailsContainer.appendChild(productName);

      const productPrice = document.createElement("div");
      productPrice.textContent = `₹${item.price}`;
      productPrice.className = "cart-item-price";
      itemDetailsContainer.appendChild(productPrice);

      const quantityDropdown = document.createElement("select");
      quantityDropdown.className = "cart-item-quantity";
      quantityDropdown.addEventListener("change", () => {
          item.quantity = parseInt(quantityDropdown.value, 10);
          item.price = item.quantity * item.originalPrice;
          total = calculateTotalPrice(cart);
          updateCartAndApplyCoupon();
          updateCartUI();
      });

      // Populate the dropdown with quantity options
      for (let i = 1; i <= 10; i++) {
          const option = document.createElement("option");
          option.value = i;
          option.textContent = i;
          if (i === item.quantity) {
              option.selected = true;
          }
          quantityDropdown.appendChild(option);
      }

      itemDetailsContainer.appendChild(quantityDropdown);

      // Add a delete button for each item
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "cart-item-delete";
      deleteButton.addEventListener("click", () => {
          // Remove the item from the cart array
          cart.splice(index, 1);
          total = calculateTotalPrice(cart);
          updateCartAndApplyCoupon();
          updateCartUI();
      });
      itemDetailsContainer.appendChild(deleteButton);

      cartItemsElement.appendChild(li);
  });

  cartTotalElement.textContent = total;
}


// Event listener for adding items to the cart
document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    const itemName = button.dataset.name;
    const itemPrice = parseFloat(button.dataset.price);
    const itemImage = button.dataset.image; // Get the image URL
    // const itemOriginalPrice = parseFloat(button.dataset.originalPrice); // Get the original price
    const itemOriginalPrice = itemPrice; // Get the original price

    const item = { name: itemName, price: itemPrice, image: itemImage, originalPrice: itemOriginalPrice };
    addToCart(item);
  });
});


checkoutBtn.addEventListener("click", () => {
  // Redirect to a new page with total amount as a URL parameter
  // window.location.href = "payment.html?total=" + encodeURIComponent(total);
  var logoPath = '/image/logo.png'; // replace with your actual image path
  window.location.href = "payment.html?total=" + encodeURIComponent(total) + "&logo=" + encodeURIComponent(logoPath);
  cart.length = 0; // Clear the cart
  total = 0;
  couponApplied = false;
  updateCartUI();
});


// Function to open the cart
function openCart() {
  // event.preventDefault();
  cartSidebar.style.right = "0"; // Display the cart by setting 'right' to 0
}

// Function to close the cart
function closeCart() {
  cartSidebar.style.right = "-300px"; // Hide the cart by setting 'right' to -300px (or the width of the cart)
}

// Event listener to open the cart when the cart button is clicked
openCartBtn.addEventListener("click", openCart);

// Event listener to close the cart when the close button is clicked
closeCartBtn.addEventListener("click", closeCart);


// Function to update the cart total and apply coupon if valid
function updateCartAndApplyCoupon() {
  total = calculateTotalPrice(cart); // Recalculate the total price
  if (couponApplied) {
      // If a coupon is already applied, reapply it
      applyCoupon();
  }
  updateCartUI();
}
let appliedCouponCode = "";
function applyCoupon() {
  const couponCode = couponCodeInput.value;

  // Check if the entered coupon code is valid (you may implement coupon validation logic here)
  if (couponCode === "book20") {
    // If a different coupon was applied before, remove its discount
    if (couponApplied && couponCode !== appliedCouponCode) {
      total = calculateTotalPrice(cart);
  }

      // Calculate the discount
      const discountAmount = (total * couponDiscountPercentage) / 100;

      // Apply the discount
      total -= discountAmount;

      // Provide a message to the user
      alert(`Coupon applied! You got a ${couponDiscountPercentage}% discount.`);
      couponApplied = true;
  } else if (couponApplied) {
    // If a coupon has been applied and the code is now invalid, remove the discount
    total = calculateTotalPrice(cart);
    // alert("Reapply the coupon!");
    couponApplied = false;
}
}

// Event listener for applying the coupon
applyCouponBtn.addEventListener("click", () => {
  if (couponApplied) {
      // If the coupon has already been applied, show a message
      alert("Coupon has already been applied.");
  } else {
      applyCoupon();
      updateCartUI();
      couponCodeInput.value = ""; // Clear the coupon code input
  }
});

// Event listener for changing quantity
document.querySelectorAll(".cart-item-quantity").forEach((dropdown) => {
  dropdown.addEventListener("change", () => {
      updateCartAndApplyCoupon();
  });
});


// openCartBtn1.addEventListener("click", openCart);
openCartBtn1.forEach((button) => {
  button.addEventListener("click",(event)=> {
    event.preventDefault();
    openCart();
  });
});
  
