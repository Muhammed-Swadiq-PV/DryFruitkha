function addToCart(id) {

  const data = {
    productId: id,
  };

  console.log(data , "product id");

  fetch(`/addToCart/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
 
  .then((response) => {
    if (response.ok) {
      return response.json();
    } else {
     
      if (response.status === 401) {
        
        window.location.href = '/login';
      } else {
        throw new Error('Failed to add product to cart');
      }
    }
  })
    .then((data) => {
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Added to Cart',
        showConfirmButton: false,
        timer: 1500,
      });
    })
    .catch((error) => {
      console.error('Error adding product to cart:', error);
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: 'Failed to add to Cart',
        text: error.message,
        showConfirmButton: false,
        timer: 1500,
      });
    });

  
}




//for removing cart Item from cart//

function removeCartItem(productId) {
  // console.log(`Removing product with ID: ${productId}`);
  fetch(`/removeFromCart/${productId}`, {
    method: 'DELETE',
    headers: {
      'Content-type': 'application/json',
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to remove product. Status: ${response.status}`);
      }

      return response.json();
    })
    .then((data) => {
      if (data.success) {
        window.location.reload();

        const removedRow = document
          .querySelector(`.remove-product-btn[data-product-id="${productId}"]`)
          .closest('.table-body-row');

        if (removedRow) {
          removedRow.remove();
        }
      } else {
        console.error('Product removal failed');
      }
    })
    .catch((error) => console.error(error.message));
}

// updating quantity and price dynamically cart view page
document
  .querySelectorAll('.product-quantity input')
  .forEach((input) => {
    input.addEventListener('change', function () {
      // console.log('Quantity changed:', this.value);
      handleQuantityChange(this);
    });
  });





async function handleQuantityChange(input) {
  const productId = input.dataset.productId;
  const newQuantity = input.value;
//  console.log(newQuantity,"ygyguyyyu   handlequantityyile quantity");
  if (newQuantity < 1) {
    input.value = 1;
    alert('Quantity must be at least 1');
    return;
  }

  try {
    const response = await fetch(`/updateCartItemQuantity/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newQuantity: newQuantity }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const errorMessageElement = document.getElementById(`quantity-error-${productId}`);
        errorMessageElement.textContent = data.error || ''; // Clear the error message if it exists
        errorMessageElement.style.color = data.error ? 'red' : 'black'; // Set color based on error presence

        if (!data.error) {
            // Update the UI with the new cart data
            console.log(data.cart, "update cart ui yilot pass cheyyunna data");
            updateCartUI(data.cart);
            console.log("updated ui successfully");

            // Fetch the updated cart data after updating quantity
            const updatedCartData = await fetchUpdatedCartData(productId);

            // Update subtotal and total in the views using the latest data
            document.querySelector('#subtotal').textContent = `${updatedCartData.subtotal.toFixed(2)}`;
            document.querySelector('#total').textContent = `${updatedCartData.total.toFixed(2)}`;
        }
  } catch (error) {
    console.error('Error updating quantity:', error);
  }
}

// Helper function to fetch updated cart data------------------------
async function fetchUpdatedCartData(productId) {
  try {
    const response = await fetch(`/updateCartItemQuantity/${productId}`, {
      method: 'PATCH', 
    });
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return {};
    }
    const data = await response.json();
    console.log('Fetched updated cart data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching updated cart data:', error);
    throw error;
  }
}

//adding total to subtotal ----------------------------
function updateCartUI(cartData) {
   console.log('Received cart data: inside updade cart ui', cartData);
  document.querySelectorAll('.table-body-row').forEach((row, index) => {
    const quantityInput = row.querySelector('.product-quantity input');
    const totalPriceCell = row.querySelector('.product-total');

    // Update the quantity
    const newQuantity = cartData[index].quantity;
    quantityInput.value = newQuantity;

    // Update the total price directly from the cartData
    const newTotalPrice = cartData[index].totalPrice;
    totalPriceCell.textContent = `₹${newTotalPrice.toFixed(2)}`;
  });
  const subtotal = cartData.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingCharge = 90;
  const total = subtotal + shippingCharge;
  const subtotalElement = document.getElementById('subtotal');
  const totalElement = document.getElementById('total');
  if (subtotalElement && totalElement) {
    subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    totalElement.textContent = `₹${total.toFixed(2)}`;
  }

  // Update shipping charge in the UI
  const shippingRow = document.getElementById('shipping-row');
  if (shippingRow) {
    shippingRow.querySelector('td:nth-child(2)').textContent = `₹${shippingCharge.toFixed(2)}`;
  }
}





    

    function addToWishlist(productId) {
      fetch(`/addToWishlist/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(function (response) {
           if (response.ok) {
        console.log("Product added to wishlist.");
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Added to Wishlist',
          showConfirmButton: false,
          timer: 1500
        });
      } else if (response.status === 409) { 
        console.warn("Product already exists in wishlist.");
        Swal.fire({
          position: 'center',
          icon: 'error',
          title: 'Product already in Wishlist',
          showConfirmButton: false,
          timer: 2500
        });
      } else {
        console.error("Error adding product to wishlist. Status:", response.status);
      }
    })
    .catch(function (error) {
      console.error("Network error:", error);
    });
}