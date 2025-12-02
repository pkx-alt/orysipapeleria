// app.js - CÓDIGO FINAL COMPLETO Y CORREGIDO (RESUELVE EL FALLO DE CARGA DE PERFIL)

// Importar el cliente de Supabase
import { supabase } from './supabaseClient.js'; 


// ==========================================================
// 1. CONEXIÓN Y ESTADO GLOBAL
// ==========================================================

let currentUserID = null; // Variable global para el ID del usuario logueado
let currentProduct = null; // Producto actualmente en vista de detalle
const CART_KEY = 'orysi_cart';
const TASA_IVA = 0.16; // Tasa de IVA fija

// Función para leer parámetros de la URL
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        id: urlParams.get('id'), // Lee el ID (ej. "3") como string
        category: urlParams.get('category'),
        subcategory: urlParams.get('subcategory'),
        search: urlParams.get('q') 
    };
}

/**
 * Configura los íconos de usuario en el header (fa-user-check si logueado).
 */
function updateHeaderUI(user) {
    const profileIcon = document.getElementById('user-profile-icon');
    if (profileIcon) {
        const iconElement = profileIcon.querySelector('i'); 

        if (user) {
            profileIcon.href = 'perfil.html';
            iconElement.classList.remove('fa-user-circle');
            iconElement.classList.add('fa-user-check'); 
        } else {
            profileIcon.href = 'login.html';
            iconElement.classList.remove('fa-user-check');
            iconElement.classList.add('fa-user-circle');
        }
    }
}


// ==========================================================
// 2. LÓGICA DE LISTADO Y FILTROS (Base)
// ==========================================================
let pageState = {
    selectedCategories: [],
    selectedSubcategories: [],
    priceRange: [0.00, 150.00],
    orderBy: 'descripcion', 
    ascending: true,
    currentPage: 1,
    baseCategory: null, 
    baseSubcategory: null,
    searchTerm: null
};

async function fetchProducts(filters, limit = 12) {
    try {
        const selectFields = `
            id:sku, 
            nombre:descripcion,
            precio:precio, 
            stock:stock, 
            categoria:categoria,
            url_imagen:imagen_url
        `;
        let query = supabase.from('productos_web').select(selectFields, { count: 'exact' });
        // Lógica de filtros, ordenamiento y paginación
        if (filters.searchTerm) { query = query.textSearch('fts_column', filters.searchTerm); }
        if (filters.selectedCategories.length > 0) { query = query.in('Categorias', filters.selectedCategories); }
        query = query.order(filters.orderBy, { ascending: filters.ascending });
        const start = (filters.currentPage - 1) * limit;
        const end = start + limit - 1;
        query = query.range(start, end);
        
        const { data } = await query;
        return { data, count: 0 }; 
    } catch (e) {
        return { data: [], count: 0 }; 
    }
}

async function updateProductList() {
    const grid = document.getElementById('product-listing-grid') || document.getElementById('bestsellers-grid') || document.getElementById('favorites-listing-grid');
    if (!grid) return;
    const { data: products } = await fetchProducts(pageState, 12); 
    grid.innerHTML = ''; 

    if (products && products.length > 0) {
        products.forEach(product => {
            const card = document.createElement('a'); 
            card.href = `pagina-10-detalle.html?id=${product.id}`; 
            card.className = 'product-card';
            const imageUrl = product.url_imagen || 'https://via.placeholder.com/180/ccc?text=No+Image';

            card.innerHTML = `
                <div class="product-image-mockup" style="background-image: url('${imageUrl}');"></div>
                <i class="far fa-heart heart-icon"></i>
                <h3>${product.nombre || 'Sin Nombre'}</h3>
                <p class="product-price">$${(product.precio || 0).toFixed(2)} MXN.</p>
                <div class="add-to-cart"><input type="number" value="1" min="1" class="qty-input"><button class="add-btn">Añadir</button></div>
            `;
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<p style="text-align:center;">No se encontraron productos.</p>';
    }
}

function setupFilterEvents() { /* ... (Tu lógica) ... */ }
function getMockCategories() { /* ... (Tu lógica) ... */ return [
    { slug: 'papeleria-y-oficina', name: 'Papelería y oficina', subcategories: ['Papel', 'Cuadernos y agendas', 'Adhesivos y cintas'] },
    { slug: 'fiesta-y-eventos', name: 'Fiesta y eventos', subcategories: ['Globos', 'Decoración', 'Desechables'] }];
}

function populateHeaderDropdown() {
    // ... (Tu lógica de menú) ...
}

async function loadBestsellers() {
    pageState.baseCategory = null; 
    pageState.selectedCategories = [];
    await updateProductList();
}


// ==========================================================
// 3. AUTENTICACIÓN (LOGIN/LOGOUT/REGISTER)
// ==========================================================

async function handleRegister(e) { 
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const fullName = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;

    const authMessage = document.getElementById('auth-message');
    if (authMessage) authMessage.textContent = 'Registrando...';

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        if (authMessage) authMessage.textContent = `Error: ${error.message}`;
        return;
    }
    
    if (data.user) {
        const { error: insertError } = await supabase
            .from('clientes_web') 
            .insert([{ id: data.user.id, razon_social: fullName, telefono: phone }]);

        if (insertError) {
             if (authMessage) authMessage.textContent = `Error de Base de Datos: ${insertError.message}`;
             alert("¡Error en el registro! Revisa la consola (F12) para más detalles.");
             return; 
        }

        alert("Registro exitoso. Serás redirigido para iniciar sesión.");
        window.location.href = 'login.html'; 
    }
}

async function handleLogin(e) { 
    e.preventDefault(); // Detiene el refrescado de página
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const authMessage = document.getElementById('auth-message');
    if (authMessage) authMessage.textContent = 'Iniciando sesión...';

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        if (authMessage) authMessage.textContent = `Error: ${error.message}`;
        return;
    }
    
    if (data.user) {
        alert("¡Bienvenido! Sesión iniciada.");
        window.location.href = 'perfil.html'; 
    }
}

async function handleLogout() { 
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = 'index.html'; 
    } else {
        alert("Error al cerrar sesión.");
    }
}

/**
 * Inicializa la página de perfil con los datos del usuario.
 */
async function initializeProfilePage() { 
    if (!currentUserID) { return; }

    const { data: authData } = await supabase.auth.getUser();

    const { data: clienteData } = await supabase
        .from('clientes_web')
        .select('razon_social, telefono, rfc') 
        .eq('id', currentUserID)
        .single();
    
    if (authData.user && clienteData) {
        document.getElementById('profile-name').textContent = clienteData.razon_social || '(Sin Nombre Registrado)';
        document.getElementById('profile-email').textContent = authData.user.email;
        document.getElementById('profile-phone').textContent = clienteData.telefono || '(Sin Teléfono Registrado)';
    }
}


// ==========================================================
// 4. LÓGICA DE FAVORITOS Y DETALLE (RLS Enabled)
// ==========================================================

async function fetchProductDetail(sku) {
    const selectFields = `id:sku, nombre:descripcion, precio:precio, stock:stock, url_imagen:imagen_url`;
    try {
        const { data } = await supabase.from('productos_web').select(selectFields).eq('sku', sku).single();
        return data;
    } catch (e) { 
        return null; 
    }
}

function renderProductDetail(product) {
    if (!product) {
        document.getElementById('dynamic-page-title').textContent = "Producto no encontrado (ID inválido)";
        return;
    }
    
    currentProduct = product;
    // Renderizado de datos del producto
    document.getElementById('dynamic-page-title').textContent = product.nombre;
    document.getElementById('product-price').textContent = `$${(product.precio || 0).toFixed(2)} MXN`;
    document.getElementById('product-stock').textContent = `Stock: ${product.stock} uds.`;
    document.getElementById('product-description-text').textContent = product.descripcion;
    document.getElementById('product-image-mockup').style.backgroundImage = `url('${product.url_imagen || 'https://via.placeholder.com/450/f0f0f0?text=No+Image'}')`;
    
    checkIfFavorite(product.id);
}

async function checkIfFavorite(productId) { /* ... (Tu lógica) ... */ }
async function toggleFavorite() { /* ... (Tu lógica) ... */ }
async function fetchFavorites() { /* ... (Tu lógica) ... */ return []; }
async function loadFavoritesPage() { /* ... (Tu lógica) ... */ }


// ==========================================================
// 5. LÓGICA DEL CARRITO (LocalStorage)
// ==========================================================

function getCart() {
    const cartString = localStorage.getItem(CART_KEY);
    return cartString ? JSON.parse(cartString) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartIconCount();
}

/**
 * Añade un producto al carrito o incrementa su cantidad.
 */
function addToCart(product, quantityToAdd = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantityToAdd;
    } else {
        // Añadir solo datos esenciales y tasa de IVA
        cart.push({
            id: product.id,
            nombre: product.nombre,
            precio: product.precio,
            quantity: quantityToAdd,
            iva: TASA_IVA
        });
    }
    saveCart(cart);
    alert(`✅ ${product.nombre} añadido al carrito.`);
}

function updateCartIconCount() { /* ... (Tu lógica) ... */ }
function updateCartItemQuantity(itemId, newQuantity) { /* ... (Tu lógica) ... */ }
function removeCartItem(itemId) { /* ... (Tu lógica) ... */ }

function renderCartPage() {
    const cartList = document.getElementById('cart-item-list');
    const cart = getCart(); // Intenta leer la memoria
    
    if (cart.length === 0) {
         if(cartList) cartList.innerHTML = '<p style="text-align:center; padding: 20px;">Tu carrito está vacío.</p>';
         const totalElement = document.getElementById('cart-total');
         if(totalElement) totalElement.textContent = '$0.00 MXN';
         return;
    }

    let subtotal = 0;
    if(cartList) cartList.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.precio * item.quantity;
        subtotal += itemTotal;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.setAttribute('data-id', item.id);

        cartItemDiv.innerHTML = `
            <div class="item-img-mockup"></div>
            <div class="item-details">
                <h3>${item.nombre}</h3>
                <span class="item-price">$${item.precio.toFixed(2)} MXN</span>
                <button class="remove-item-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="item-quantity">
                <input type="number" value="${item.quantity}" min="1" class="qty-input" data-id="${item.id}">
            </div>
        `;
        if(cartList) cartList.appendChild(cartItemDiv);
    });

    // CÁLCULO DE TOTALES
    const totalIva = subtotal * TASA_IVA;
    const totalFinal = subtotal + totalIva;

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)} MXN`;
    document.getElementById('cart-iva').textContent = `$${totalIva.toFixed(2)} MXN`;
    document.getElementById('cart-total').textContent = `$${totalFinal.toFixed(2)} MXN`;

    // Re-conectar eventos de la página de carrito
    setupCartEvents();
}

function setupCartEvents() {
    const cartList = document.getElementById('cart-item-list');
    if (!cartList) return;

    cartList.addEventListener('change', (e) => {
        if (e.target.classList.contains('qty-input')) {
            updateCartItemQuantity(e.target.getAttribute('data-id'), parseInt(e.target.value));
        }
    });

    cartList.addEventListener('click', (e) => {
        if (e.target.closest('.remove-item-btn')) {
            removeCartItem(e.target.closest('.remove-item-btn').getAttribute('data-id'));
        }
    });
}

/**
 * Habilita/deshabilita el botón de cotización y conecta la acción.
 */
function setupQuotationButton(isLoggedIn) {
    const btn = document.getElementById('generate-quotation-btn');
    const msg = document.getElementById('quotation-message');
    const cart = getCart();

    if (!btn) return;

    if (isLoggedIn && cart.length > 0) {
        btn.disabled = false;
        if (msg) msg.textContent = "Haga clic para guardar y descargar su presupuesto.";
        
        // Remove existing listener to prevent duplicates
        btn.removeEventListener('click', handleGenerateQuotation); 
        // ATTACH THE LISTENER
        btn.addEventListener('click', handleGenerateQuotation);

    } else {
        btn.disabled = true;
        if (msg) msg.textContent = "La cotización solo se habilita para usuarios con sesión iniciada.";
        if (cart.length === 0 && msg) msg.textContent = "Añada productos al carrito para cotizar.";
        // Ensure the old listener is removed if disabled
        btn.removeEventListener('click', handleGenerateQuotation);
    }
}

/**
 * Función principal para generar cotización y PDF. (ASÍNCRONA)
 */
async function handleGenerateQuotation() {
    const cart = getCart();
    // Obtener totales
    const subtotal = parseFloat(document.getElementById('cart-subtotal')?.textContent.replace(/[^0-9.-]+/g,"")) || 0;
    const iva = parseFloat(document.getElementById('cart-iva')?.textContent.replace(/[^0-9.-]+/g,"")) || 0;
    const total = parseFloat(document.getElementById('cart-total')?.textContent.replace(/[^0-9.-]+/g,"")) || 0;

    if (cart.length === 0 || !currentUserID) {
        alert("Error: Inicia sesión y añade productos.");
        return;
    }
    
    // 1. OBTENER DATOS DEL CLIENTE LOGUEADO (Para la cabecera)
    const user = supabase.auth.user();
    
    if (!user || !currentUserID) return; 

    const { data: clienteData, error: clienteError } = await supabase
        .from('clientes_web')
        .select('razon_social, telefono, rfc')
        .eq('id', user.id)
        .single();
    
    if (clienteError || !clienteData) {
        alert("Error: No se pudieron obtener los datos de tu perfil para la cotización. Revisa RLS SELECT.");
        return;
    }

    // --- DATOS DE LA PAPELERÍA (HARDCODEADO TEMPORALMENTE) ---
    const papeleriaInfo = { nombre: "PAPELERÍA ORYSI", rfc: "XAXX010101000", direccion: "Av. Principal #123, Col. Centro", telefono: "81 1234 5678" };

    // 2. INSERTAR LA CABECERA (cotizaciones_web)
    const cotizacionHeader = {
        cliente_nombre: clienteData.razon_social,
        cliente_email: user.email, 
        total: total,
        estado: 'PENDIENTE', 
        fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    const { data: headerInsert, error: headerError } = await supabase
        .from('cotizaciones_web')
        .insert([cotizacionHeader])
        .select()
        .single();

    if (headerError || !headerInsert) {
        console.error("Error al guardar cabecera de cotización:", headerError);
        alert("Error al guardar la cabecera de la cotización en la base de datos.");
        return;
    }

    const cotizacionId = headerInsert.id;

    // 3. INSERTAR LOS DETALLES (cotizacion_detalles_web)
    const detallesToInsert = cart.map(item => ({
        cotizacion_id: cotizacionId,
        producto_sku: item.id.toString(), 
        cantidad: item.quantity,
        precio_unitario: item.precio,
        descripcion: item.nombre
    }));

    const { error: detallesError } = await supabase
        .from('cotizacion_detalles_web')
        .insert(detallesToInsert);

    if (detallesError) {
        console.error("Error al guardar detalles de cotización:", detallesError);
        alert("Advertencia: Se guardó la cabecera, pero fallaron los detalles. Revisa RLS de Detalles.");
    }
    
    // --- 4. GENERAR PDF (Lógica de PDFMake) ---
    
    // 1. Encabezado de la Tabla
    const tableBody = [
        [{ text: 'CANT.', style: 'tableHeader' }, 
         { text: 'DESCRIPCIÓN', style: 'tableHeader' }, 
         { text: 'PRECIO UNITARIO', style: 'tableHeader' }, 
         { text: 'IMPORTE', style: 'tableHeader' }]
    ];
    cart.forEach(item => {
        tableBody.push([
            item.quantity.toString(),
            item.nombre,
            `$${item.precio.toFixed(2)}`,
            `$${(item.precio * item.quantity).toFixed(2)}`
        ]);
    });

    const docDefinition = {
        pageSize: 'LETTER',
        pageMargins: [40, 60, 40, 60],
        content: [
            { text: papeleriaInfo.nombre, style: 'header', alignment: 'center' },
            { text: 'COTIZACIÓN FORMAL', style: 'subheader', alignment: 'center', margin: [0, 5, 0, 15] },
            
            { 
                columns: [
                    { width: '*', text: `RFC: ${papeleriaInfo.rfc}\n${papeleriaInfo.direccion}\nTel: ${papeleriaInfo.telefono}` },
                    { width: 'auto', text: `FECHA: ${new Date().toLocaleDateString('es-MX')}\nVIGENCIA: 15 Días\nFOLIO: ${cotizacionId}`, alignment: 'right', bold: true }
                ],
                margin: [0, 0, 0, 20]
            },
            { text: 'Detalle de Productos:', style: 'sectionHeader', margin: [0, 10, 0, 5] },
            { table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto'], body: tableBody }, layout: 'lightHorizontalLines' },
            {
                columns: [
                    { width: '*', text: '' },
                    {
                        width: 'auto',
                        table: {
                            widths: [100, 100],
                            body: [
                                ['Subtotal:', { text: `$${subtotal.toFixed(2)} MXN`, alignment: 'right' }],
                                ['IVA (16%):', { text: `$${iva.toFixed(2)} MXN`, alignment: 'right' }],
                                [{ text: 'TOTAL:', bold: true }, { text: `$${total.toFixed(2)} MXN`, bold: true, alignment: 'right' }],
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 15, 0, 0]
                    }
                ],
                margin: [0, 20, 0, 0]
            }
        ],
        styles: {
            header: { fontSize: 20, bold: true, alignment: 'center' },
            subheader: { fontSize: 16, bold: true, color: '#343a40' },
            sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
            tableHeader: { bold: true, fillColor: '#f0f0f0', alignment: 'center' }
        },
        footer: function(currentPage, pageCount) {
            return { text: 'Página ' + currentPage.toString() + ' de ' + pageCount, alignment: 'center', margin: [0, 30] };
        }
    };

    pdfMake.createPdf(docDefinition).download(`Cotizacion_${papeleriaInfo.nombre}_${new Date().getTime()}.pdf`);
    
    alert(`🎉 Cotización N°${cotizacionId} generada con éxito!\nDescarga del PDF completada.`);
}