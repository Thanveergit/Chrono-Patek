function toggleAddAddressForm() {
     const form = document.getElementById('addAddressForm');
     form.style.display = form.style.display === 'none' ? 'block' : 'none';
 }

 
 
 function showAddAddressForm() {
 const form = document.getElementById('addAddressForm');
 if (form) {
     form.style.display = 'block'; // Show the form
 }
}

function cancelForm() {
 const form = document.getElementById('addAddressForm');
 const actualForm = document.getElementById('actualAddAddressForm');
 
 if (form) {
     form.style.display = 'none'; 
 }

 if (actualForm) {
     actualForm.reset(); 
 }
}


//order placing

document.getElementById('placeOrderBtn').addEventListener('click', async function() {
     const selectedAddress = document.querySelector('input[name="address"]:checked');
     const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
     const totalPrice = this.getAttribute('data-totalPrice');
     // Validate address selection
     // Custom toast notification function
 function showToast(message, type = 'info') {
     // Create toast container if it doesn't exist
     let toastContainer = document.getElementById('toast-container');
     if (!toastContainer) {
         toastContainer = document.createElement('div');
         toastContainer.id = 'toast-container';
         toastContainer.style.cssText = `
             position: fixed;
             bottom: 20px;
             left: 50%;
             transform: translateX(-50%);
             z-index: 9999;
             display: flex;
             flex-direction: column-reverse;
             align-items: center;
         `;
         document.body.appendChild(toastContainer);
     }
 
     // Create toast element
     const toast = document.createElement('div');
     toast.style.cssText = `
         padding: 12px 24px;
         margin-bottom: 10px;
         border-radius: 4px;
         color: white;
         opacity: 0;
         transition: opacity 0.3s ease-in;
         animation: slideUp 0.3s ease-out;
         min-width: 300px;
         text-align: center;
         box-shadow: 0 3px 6px rgba(0,0,0,0.16);
         font-weight: 500;
     `;
 
     // Set background color based on type
     const colors = {
         success: '#4CAF50',
         error: '#f44336',
         warning: '#ff9800',
         info: '#2196F3'
     };
     toast.style.backgroundColor = colors[type] || colors.info;
 
     toast.textContent = message;
 
     // Add to container
     toastContainer.appendChild(toast);
 
     // Trigger animation
     setTimeout(() => toast.style.opacity = '1', 10);
 
     // Remove after 3 seconds
     setTimeout(() => {
         toast.style.opacity = '0';
         setTimeout(() => toastContainer.removeChild(toast), 300);
     }, 3000);
 }
 
 // Add required CSS
 const style = document.createElement('style');
 style.textContent = `
     @keyframes slideUp {
         from {
             transform: translateY(100%);
             opacity: 0;
         }
         to {
             transform: translateY(0);
             opacity: 1;
         }
     }
 `;
 document.head.appendChild(style);
 
                // Address validation check
                if (!selectedAddress) {
                    showToast('Please select an address!', 'warning');
                    return;
                }
                
                
                    
                
                try {
                    const response = await axios.post('/checkout/place-order', {
                        selectedAddress: selectedAddress.value,
                        paymentMethod: selectedPaymentMethod,
                        totalPrice: totalPrice,
                    });
                
                    const orderId = response.data.orderId; // Store orderId for later use
                
                    if (selectedPaymentMethod === "razorpay" && response.data.success) {
                        const options = {
                            key: response.data.key,
                            amount: response.data.amount,
                            currency: "INR",
                            name: response.data.name,
                            description: "Order Payment",
                            image: "/assets/images/icons/logo.png",
                            order_id: response.data.razorpayOrderId,
                            handler: async function (response) {
                                if (response.razorpay_payment_id) {
                                    try {
                                        const verifyResponse = await axios.post('/verify-and-place-order', {
                                            razorpay_payment_id: response.razorpay_payment_id,
                                            razorpay_order_id: response.razorpay_order_id,
                                            razorpay_signature: response.razorpay_signature,
                                        });
                
                                        if (verifyResponse.data.success) {
                                            window.location.href = "/order-success";
                                        } else {
                                            await axios.post('/update-order-status', { orderId, status: 'failed' });
                                            window.location.href = "/order-failed";
                                        }
                                    } catch (error) {
                                        await axios.post('/update-order-status', { orderId, status: 'failed' });
                                        window.location.href = "/order-failed";
                                    }
                                }
                            },
                            modal: {
                                ondismiss: async function () {
                                    await axios.post('/update-order-status', { orderId, status: 'failed' });
                                    window.location.href = "/order-failed";
                                }
                            },
                            prefill: {
                                name: response.data.name,
                                email: response.data.email,
                                contact: response.data.phone,
                            },
                            theme: {
                                color: "#FF5733"
                            }
                        };
                
                        const rzp = new Razorpay(options);
                        rzp.open();
                    } else if (selectedPaymentMethod === "cod" && response.data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Order Placed Successfully!',
                            text: response.data.message,
                            timer: 3000,
                            showConfirmButton: false,
                        });
                        setTimeout(() => {
                            window.location.href = '/order-success';
                        }, 2000);
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: response.data.message || 'Something went wrong!',
                            timer: 3000,
                            showConfirmButton: false,
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: error.response?.data?.message || 'Something went wrong!',
                        timer: 3000,
                        showConfirmButton: false,
                    });
                }
                  
     });
 
 
 
  document.addEventListener('DOMContentLoaded', function () {
     const form = document.getElementById('actualAddAddressForm');
     
     if (form) {
         // Validation patterns and error messages
         const validationPatterns = {
             name: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
             phone: /^[1-9]\d{9}$/,
             district: /^[A-Za-z]{3,}$/,
             city: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
             house: /^[A-Za-z0-9 ]+$/,  
             state: /^[A-Za-z]{3,}$/,
             pincode: /^\d{6}$/
         };
 
         const errorMessages = {
             name: 'Name should start with a letter and contain only letters and spaces.',
             phone: 'Please provide a valid 10-digit mobile number.',
             district: 'Please provide a valid district name.',
             city: 'Please provide a valid city name.',
             house: 'Please provide a valid house name or number.',
             state: 'Please provide a valid state name.',
             pincode: 'Please provide a valid 6-digit pincode.'
         };
 
         const fields = Object.keys(validationPatterns);
 
         // Function to validate all fields
         function validateField(field) {
             const input = document.getElementById(field);
             const errorElement = document.getElementById(`${field}Error`);
             const value = input.value.trim(); 
 
             if (!validationPatterns[field].test(value)) {
                 errorElement.innerText = errorMessages[field];
                 return false; 
             } else {
                 errorElement.innerText = ''; 
                 return true; 
             }
         }
 
         // Add event listeners for input validation
         fields.forEach(field => {
             const input = document.getElementById(field);
             input.addEventListener('input', function () {
                 validateField(field);
             });
         });
 
         form.addEventListener('submit', function (e) {
             e.preventDefault(); 
             
             let isValid = true;
 
             // Validate all fields on form submission
             fields.forEach(field => {
                 if (!validateField(field)) {
                     isValid = false; 
                 }
             });
 
             if (!isValid) return; 
 
             const formData = new FormData(this); 
             const data = Object.fromEntries(formData.entries()); 
             
             fetch('/checkout/add-new-address', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify(data)
             })
             .then(response => response.json())
             .then(data => {
                 if (data.message) {
                     // SweetAlert2 popup for success
                     Swal.fire({
                         icon: 'success',
                         title: 'Success!',
                         text: data.message,
                         timer: 3000,  
                         showConfirmButton: false,
                         position: 'bottom',  
                         toast: true
                     });
 
                      
                     setTimeout(() => {
                         window.location.href = '/checkout';  
                     }, 2000);
 
                     // Reset the form
                     form.reset();
 
                     // Hide the form after submission
                     const addAddressForm = document.getElementById('addAddressForm');
                     if (addAddressForm) {
                         addAddressForm.style.display = 'none';
                     }
                 }
             })
             .catch(error => {
                 console.error('Error:', error);
                 // SweetAlert2 popup for error
                 Swal.fire({
                     icon: 'error',
                     title: 'Oops...',
                     text: 'An error occurred while adding the address.',
                     timer: 3000,  
                     showConfirmButton: false,
                     position: 'bottom',  
                     toast: true
                 });
             });
         });
     } else {
         console.error("Form with ID 'actualAddAddressForm' not found");
     }
 });

    let currentCouponId= null;
    let originalTotalPrice=parseFloat(document.querySelector('#totalPrice').dataset.totalprice);
    let finalTotalPrice= originalTotalPrice;
    console.log(originalTotalPrice,'hfkhkfjdh')


   

   // First, let's create a simple toast notification function
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column-reverse;
            align-items: center;
        `;
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        padding: 12px 24px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        opacity: 0;
        transition: opacity 0.3s ease-in;
        animation: slideUp 0.3s ease-out;
        min-width: 300px;
        text-align: center;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16);
    `;

    // Set background color based on type
    const colors = {
        success: '#4CAF50',
        error: 'red',
        warning: 'black',
        info: '#2196F3'
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    toast.textContent = message;

    // Add to container
    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.style.opacity = '1', 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toastContainer.removeChild(toast), 300);
    }, 3000);
}

function applyCoupon(couponId, couponCode) {
    // Check if a coupon is already applied
    if (currentCouponId) {
        showToast("A coupon is already applied. Please remove the existing coupon first.", "warning");
        return;
    }

    let totalPrice = originalTotalPrice;

    axios.get(`/check-coupon?couponId=${couponId}&totalPrice=${totalPrice}`)
        .then((response) => {
            // Check if the coupon is valid
            if (!response.data.success && response.data.message === "Not a valid coupon") {
                showToast("Invalid coupon code", "error");
            } 
            // Check if the coupon is eligible
            else if (!response.data.success && response.data.message === "Not eligible for this coupon") {
                showToast("You're not eligible for this coupon", "warning");
            } 
            // Check if the user has already used the coupon
            else if (!response.data.success && response.data.message === "You have already used this coupon.") {
                showToast("You've already used this coupon", "warning");
            } 
            // If all checks are passed, apply the coupon
            else if (response.data.success) {
                const discountPercentage = response.data.discountPercentage;
                console.log(discountPercentage);
                const discountAmount = Math.ceil((discountPercentage * totalPrice) / 100);
                console.log(discountAmount);
                const maxRedeemAmount = response.data.maxRedeemAmount;
                const finalDiscount = discountAmount > maxRedeemAmount ? maxRedeemAmount : discountAmount;
                finalTotalPrice = totalPrice - finalDiscount;

                document.querySelector("#totalPrice").innerHTML = `<b>₹ ${finalTotalPrice.toFixed(2)}<b>`;
                document.querySelector(".card .flex-w:nth-child(3) .mtext-110").innerHTML = `₹ ${finalDiscount.toFixed(2)}`;

                const applyButton = document.querySelector(`button[data-coupon-id='${couponId}']`);
                applyButton.textContent = "Remove";
                applyButton.onclick = () => removeCoupon(couponId);

                currentCouponId = couponId;
                showToast(`Coupon applied! You saved ₹${finalDiscount.toFixed(2)}`, "success");

                // Send the discount details to the server
                axios.post('/apply-discount', {
                    couponId: couponId,
                    discountAmount: finalDiscount
                })
                .then((discountResponse) => {
                    console.log("Discount saved on backend:", discountResponse.data);
                })
                .catch((error) => {
                    console.error("Error saving discount:", error);
                    showToast("Failed to save discount. Please try again later.", "error");
                });
            }
        })
        .catch((error) => {
            console.log("apply coupon", error);
            showToast("Failed to apply coupon. Please try again later.", "error");
        });
}

// Add required CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);


    const fetchCartDetails = async () => {
    try {
        const response = await axios.get('/cart'); 
        const { totalPrice, appliedDiscount } = response.data; 
        
        // Calculate the adjusted total price after discount
        const adjustedTotal = totalPrice - (appliedDiscount?.discountAmount || 0);
        updateTotalPriceUI(adjustedTotal); 
    } catch (error) {
        console.error('Error fetching cart details:', error);
    }
};


window.onload = () => {
    fetchCartDetails(); 
};

// Custom modal function for confirmation
function showConfirmModal(message) {
    return new Promise((resolve) => {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            animation: fadeIn 0.3s ease-out;
        `;

        modalContent.innerHTML = `
            <p style="margin: 0 0 20px 0; font-size: 16px;">${message}</p>
            <div style="display: flex; justify-content: center; gap: 10px;">
                <button class="confirm" style="
                    padding: 8px 16px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Yes, remove it</button>
                <button class="cancel" style="
                    padding: 8px 16px;
                    background-color: #f44336;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;

        // Add event listeners
        modalContent.querySelector('.confirm').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
            resolve(true);
        });

        modalContent.querySelector('.cancel').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
            resolve(false);
        });

        modalContainer.appendChild(modalContent);
        document.body.appendChild(modalContainer);
    });
}

// Function to remove the coupon
async function removeCoupon(couponId) {
    const isConfirmed = await showConfirmModal('Are you sure you want to remove the coupon?');

    if (isConfirmed) {
        try {
            const response = await axios.post('/remove-coupon', { couponId });
            if (response.data.success) {
                showToast(response.data.message || 'Coupon removed successfully', 'success');
                
                // Reload the cart details to reflect the updated total
                fetchCartDetails();

                // Redirect after a delay
                
                    setTimeout(() => {
                        window.location.href = '/checkout';
                    }, 1000);
               
            }
        } catch (error) {
            console.error('Error removing coupon:', error);
            showToast('Failed to remove the coupon. Please try again.', 'error');
        }
    }
}

// Add required CSS
const modalStyle = document.createElement('style');
modalStyle.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .confirm:hover {
        background-color: #45a049 !important;
    }

    .cancel:hover {
        background-color: #da3c31 !important;
    }
`;
document.head.appendChild(modalStyle);
