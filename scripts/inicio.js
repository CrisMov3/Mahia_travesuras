// IIFE (Immediately Invoked Function Expression) para encapsular el código
(() => {
  // ===============================
  // CONFIGURACIÓN
  // ===============================
  const SHIPPING_THRESHOLD = 170000;
  const SHIPPING_FEE = 8000;
  const WHATSAPP_NUMBER = '573172980319';

  // ===============================
  // SELECTORES DEL DOM
  // ===============================
  const cartIcon = document.querySelector('.cart-icon');
  const cartPanel = document.getElementById('cart');
  const cartCloseBtn = document.getElementById('cart-close');
  const cartItemsContainer = document.querySelector('.cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-whatsapp');
  const clearBtn = document.getElementById('clear-cart');
  const modal = document.getElementById('checkout-modal');
  const modalCloseBtn = document.getElementById('modal-close');
  const modalCancelBtn = document.getElementById('modal-cancel');
  const deliveryForm = document.getElementById('delivery-form');
  const productButtons = document.querySelectorAll('.producto .btn-add-to-cart');
  const shippingOptions = document.querySelectorAll('input[name="shippingMethod"]');
  const hamburgerBtn = document.getElementById('hamburger-button');
  const navMenu = document.querySelector('.main-nav');
  // NUEVO: Selector para el contador
  const cartCounterEl = document.getElementById('cart-counter');

  // ===============================
  // ESTADO DEL CARRITO
  // ===============================
  let cartItems = [];

  // ===============================
  // LÓGICA DEL MENÚ HAMBURGUESA
  // ===============================
  function toggleNavMenu() {
    hamburgerBtn.classList.toggle('open');
    navMenu.classList.toggle('open');
  }

  // ===============================
  // LÓGICA DEL CARRITO
  // ===============================
  // NUEVA FUNCIÓN: Actualizar el contador del ícono del carrito
  function updateCartCounter() {
    if (!cartCounterEl) return;
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

    if (totalItems > 0) {
        cartCounterEl.textContent = totalItems;
        cartCounterEl.classList.add('show');
    } else {
        cartCounterEl.classList.remove('show');
    }
  }
  
  const formatCOP = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
  const parsePrice = (text) => Number(String(text || '').replace(/[^\d]/g, ''));
  function findItemIndex(name) { return cartItems.findIndex(i => i.name === name); }

  function addItemToCart({ name, price, qty = 1 }) {
    const idx = findItemIndex(name);
    if (idx >= 0) {
      cartItems[idx].qty += qty;
    } else {
      cartItems.push({ name, price, qty });
    }
    renderCart();
  }

  function removeItemFromCart(name) {
    cartItems = cartItems.filter(i => i.name !== name);
    renderCart();
  }

  function changeItemQty(name, newQty) {
    const idx = findItemIndex(name);
    if (idx >= 0) {
      cartItems[idx].qty = Math.max(1, Math.floor(newQty) || 1);
      renderCart();
    }
  }

  function calculateSubtotal() { return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0); }
  function getSelectedShippingMethod() { return document.querySelector('input[name="shippingMethod"]:checked')?.value || 'delivery'; }
  function calculateShipping(subtotal) {
    const method = getSelectedShippingMethod();
    return (method === 'delivery' && subtotal > 0 && subtotal < SHIPPING_THRESHOLD) ? SHIPPING_FEE : 0;
  }

  function updateTotalsUI() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;
    if (subtotalEl) subtotalEl.textContent = formatCOP(subtotal);
    if (shippingEl) shippingEl.textContent = formatCOP(shipping);
    if (totalEl) totalEl.textContent = formatCOP(total);
  }

  function renderCart() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = cartItems.length === 0 ? '<p>Tu carrito está vacío.</p>' :
      cartItems.map(item => `
        <div class="cart-item" data-name="${item.name}">
            <div class="item-info">
                <strong class="item-name">${item.name}</strong>
                <div class="item-meta">
                    <span class="item-price">${formatCOP(item.price)}</span>
                    <span>x</span>
                    <input type="number" min="1" value="${item.qty}" class="item-qty" style="width: 50px;">
                </div>
            </div>
            <button class="item-remove" title="Eliminar">×</button>
        </div>`).join('');
    
    updateTotalsUI();
    addCartItemListeners();
    updateCartCounter(); // Actualiza el contador cada vez que el carrito cambia
  }

  function clearCart(confirm = true) {
    if (confirm && !window.confirm('¿Estás segura de que quieres vaciar el carrito?')) return;
    cartItems = [];
    renderCart();
  }

  // ===============================
  // GESTIÓN DE EVENTOS
  // ===============================
  function addCartItemListeners() {
    document.querySelectorAll('.cart-item .item-qty').forEach(input => {
        input.addEventListener('change', e => {
            const name = e.target.closest('.cart-item').dataset.name;
            changeItemQty(name, Number(e.target.value));
        });
    });
    document.querySelectorAll('.cart-item .item-remove').forEach(button => {
        button.addEventListener('click', e => {
            const name = e.target.closest('.cart-item').dataset.name;
            removeItemFromCart(name);
        });
    });
  }

  function toggleCart() { cartPanel.classList.toggle('open'); }
  function openModal() { if (modal) modal.style.display = 'block'; }
  function closeModal() { if (modal) modal.style.display = 'none'; }

  function handleCheckout() {
    if (cartItems.length === 0) {
        alert('Tu carrito está vacío. ¡Añade algunos productos para continuar!');
        return;
    }
    const method = getSelectedShippingMethod();
    if (method === 'delivery') {
        openModal();
    } else {
        const message = buildWhatsAppMessage();
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    }
  }
  
  function handleDeliveryFormSubmit(e) {
    e.preventDefault();
    const address = document.getElementById('delivery-address').value.trim();
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    if (!address || !name || !phone) {
        alert('Por favor completa todos los campos de envío.');
        return;
    }
    const deliveryDetails = { address, name, phone };
    const message = buildWhatsAppMessage(deliveryDetails);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    closeModal();
  }
  
  function buildWhatsAppMessage(deliveryDetails = null) {
      const subtotal = calculateSubtotal();
      const shipping = calculateShipping(subtotal);
      const total = subtotal + shipping;
      const method = getSelectedShippingMethod();
      const itemsText = cartItems.map(it => `  - ${it.qty} x ${it.name} (${formatCOP(it.price)})`).join('\n');
      let message = [
          '👗 ¡Hola Mahia Travesuras! Quiero realizar este pedido:\n',
          itemsText,
          '\n------------------------------------',
          `Subtotal: ${formatCOP(subtotal)}`,
          `Método: ${method === 'delivery' ? 'Domicilio' : 'Recoger en tienda'}`,
          `Costo Envío: ${formatCOP(shipping)}`,
          `TOTAL: ${formatCOP(total)}`,
          '------------------------------------\n'
      ];
      if (deliveryDetails) {
          message.push('Mis datos de envío son:');
          message.push(`Nombre: ${deliveryDetails.name}`);
          message.push(`Dirección: ${deliveryDetails.address}`);
          message.push(`Celular: ${deliveryDetails.phone}`);
      } else {
          message.push('Pasaré a recoger el pedido. ¡Gracias!');
      }
      return message.join('\n');
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleNavMenu);
  if (cartIcon) cartIcon.addEventListener('click', toggleCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', toggleCart);
  if (clearBtn) clearBtn.addEventListener('click', () => clearCart(true));
  if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
  
  productButtons.forEach(button => {
    button.addEventListener('click', e => {
        const productCard = e.target.closest('.producto');
        const name = productCard.querySelector('h3').innerText;
        const price = parsePrice(productCard.querySelector('p.price').innerText);
        addItemToCart({ name, price });
        // ELIMINADO: Ya no se abre el carrito al añadir un producto
        // cartPanel.classList.add('open');
    });
  });

  shippingOptions.forEach(radio => radio.addEventListener('change', updateTotalsUI));
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
  if (deliveryForm) deliveryForm.addEventListener('submit', handleDeliveryFormSubmit);
  window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // ===============================
  // FEED DE INSTAGRAM
  // ===============================
  async function fetchInstagramFeed() {
    const instagramGrid = document.getElementById('instagram-grid');
    if (!instagramGrid) return;
    const accessToken = 'TU_TOKEN_DE_ACCESO_DE_INSTAGRAM_AQUI'; 
    if (accessToken === 'TU_TOKEN_DE_ACCESO_DE_INSTAGRAM_AQUI') {
        instagramGrid.innerHTML = '<p>Configura tu Token de Acceso de Instagram en el archivo script.js.</p>';
        return;
    }
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url&access_token=${accessToken}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            instagramGrid.innerHTML = '';
            data.data.slice(0, 6).forEach(post => {
                const postElement = document.createElement('a');
                postElement.href = post.permalink;
                postElement.target = '_blank';
                postElement.rel = 'noopener noreferrer';
                postElement.className = 'instagram-card';
                const imageUrl = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
                postElement.innerHTML = `<img src="${imageUrl}" alt="${post.caption || 'Publicación de Instagram'}">`;
                instagramGrid.appendChild(postElement);
            });
        }
    } catch (error) {
        console.error('Error al cargar feed de Instagram:', error);
        instagramGrid.innerHTML = '<p>No se pudo cargar el feed de Instagram.</p>';
    }
  }

  // ===============================
  // INICIALIZACIÓN
  // ===============================
  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    fetchInstagramFeed();
  });

})();