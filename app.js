// app.js - CÓDIGO FINAL COMPLETO Y CORREGIDO (RESUELVE EL FALLO DE CARGA DE PERFIL)
console.log("HOLA ESTOY AQUI");
// Importar el cliente de Supabase
import { supabase } from './supabaseClient.js'; 

// ==========================================================
// LÓGICA DEL CARRITO LATERAL (SIDEBAR)
// ==========================================================

// 1. Abrir y Cerrar el Sidebar
function toggleCartSidebar(show) {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (show) {
        sidebar.classList.add('open');
        overlay.classList.add('open');
        renderCartSidebar(); // Actualizamos el contenido al abrir
    } else {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }
}

// 2. Renderizar contenido en el Sidebar
// 2. Renderizar contenido en el Sidebar (Con IVA calculado)
function renderCartSidebar() {
    const container = document.getElementById('cart-sidebar-items');
    const totalEl = document.getElementById('sidebar-total');
    const subtotalEl = document.getElementById('sidebar-subtotal');
    const countEl = document.getElementById('cart-count-header');
    const cart = getCart();

    if (!container) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if(countEl) countEl.textContent = `(${totalItems})`;

    container.innerHTML = '';
    
    // Variables para acumular
    let totalGlobal = 0;      // Lo que paga el cliente (Precio de lista)
    let subtotalGlobal = 0;   // Base imponible (Precio / 1.16)
    let ivaGlobal = 0;        // Impuesto (Total - Base)

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px 20px; color:#999;">
                <i class="fas fa-shopping-basket" style="font-size: 3rem; margin-bottom:15px; opacity:0.5;"></i>
                <p>Tu carrito está vacío</p>
                <button onclick="toggleCartSidebar(false)" style="margin-top:10px; background:none; border:none; color:#007bff; cursor:pointer; text-decoration:underline;">Seguir comprando</button>
            </div>`;
        
        if(subtotalEl) subtotalEl.textContent = "$0.00";
        if(totalEl) totalEl.textContent = "$0.00";
        const ivaEl = document.getElementById('sidebar-iva');
        if(ivaEl) ivaEl.textContent = "$0.00";
        return;
    }

    cart.forEach(item => {
        // 1. Calculamos el TOTAL de la línea (Precio Público * Cantidad)
        //    Ej: $115.00 * 1 = $115.00
        const importeTotalLinea = item.precio * item.quantity;
        
        // 2. Obtenemos la tasa (0.16, 0.00, etc)
        const tasa = (item.iva !== undefined && item.iva !== null) ? item.iva : 0.16;
        
        // 3. Desglosamos hacia atrás (Como el POS)
        //    Base = 115 / 1.16 = 99.137...
        const importeBaseLinea = importeTotalLinea / (1 + tasa);
        
        //    IVA = 115 - 99.137 = 15.862...
        const ivaLinea = importeTotalLinea - importeBaseLinea;

        // 4. Acumulamos
        totalGlobal += importeTotalLinea;
        subtotalGlobal += importeBaseLinea;
        ivaGlobal += ivaLinea;

        let img = 'img/papeleria.jpg'; 
        
        const div = document.createElement('div');
        div.className = 'mini-cart-item';
        div.innerHTML = `
            <div class="mini-img" style="background-image: url('${img}');"></div>
            <div class="mini-details">
                <h4>${item.nombre}</h4>
                <div class="mini-price">$${item.precio.toFixed(2)}</div>
                <div class="mini-controls">
                    <span class="mini-qty">Cant: ${item.quantity}</span>
                    <i class="fas fa-trash-alt btn-remove-mini" data-id="${item.id}" title="Eliminar"></i>
                </div>
            </div>
        `;
        
        div.querySelector('.btn-remove-mini').addEventListener('click', () => {
            removeCartItem(item.id.toString()); 
        });

        container.appendChild(div);
    });

    // Mostramos los totales calculados "hacia atrás"
    if(subtotalEl) subtotalEl.textContent = `$${subtotalGlobal.toFixed(2)}`;
    if(totalEl) totalEl.textContent = `$${totalGlobal.toFixed(2)}`;

    // Inyección del IVA en el Sidebar
    let ivaEl = document.getElementById('sidebar-iva');
    if (!ivaEl && subtotalEl) {
        const rowSubtotal = subtotalEl.parentElement;
        if (rowSubtotal) {
            const rowIva = document.createElement('div');
            rowIva.className = 'cart-summary-row';
            rowIva.innerHTML = '<span>IVA:</span><span id="sidebar-iva">$0.00</span>';
            rowSubtotal.insertAdjacentElement('afterend', rowIva);
            ivaEl = rowIva.querySelector('#sidebar-iva');
        }
    }
    
    if (ivaEl) {
        ivaEl.textContent = `$${ivaGlobal.toFixed(2)}`;
    }
}
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
        id: urlParams.get('id'),
        category: urlParams.get('category'),
        subId: urlParams.get('sub_id'), // <--- NUEVO: Leemos el ID
        title: urlParams.get('title'),  // <--- NUEVO: Leemos el nombre para el título
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
// ==========================================================
// 2. LÓGICA DE LISTADO Y FILTROS (Base)
// ==========================================================
// ==========================================================
// 2. LÓGICA DE LISTADO Y FILTROS (Base)
// ==========================================================
let pageState = {
    selectedCategories: [],      // Array de Nombres (Strings)
    selectedSubcategories: [],   // Array de IDs (Números) <--- ¡IMPORTANTE!
    priceRange: [0.00, 3000.00],
    orderBy: 'descripcion', 
    ascending: true,
    currentPage: 1,
    itemsPerPage: 12, // Cantidad por página
    searchTerm: null
};

// Carga las categorías y subcategorías en el sidebar
// ==========================================================
// CARGA Y GESTIÓN DE FILTROS (CASCADA)
// ==========================================================

async function loadFilters() {
    const catContainer = document.getElementById('filter-categories');
    const subContainer = document.getElementById('filter-subcategories');
    
    if (!catContainer || !subContainer) return;

    // 1. Limpiar y preparar estructura
    catContainer.innerHTML = '<h2>Categoría</h2><div class="filter-options-container" id="cat-options"></div>';
    subContainer.innerHTML = '<h2>Subcategoría</h2><div class="filter-options-container" id="sub-options"></div>';
    
    const catList = document.getElementById('cat-options');
    const subList = document.getElementById('sub-options');

    // 2. Obtener datos de Supabase
    // Traemos categorías y subcategorías para relacionarlas
    const { data: categories } = await supabase.from('categorias_web').select('id, nombre').order('nombre');
    const { data: subcategories } = await supabase.from('subcategorias_web').select('id, nombre, categoria_id').order('nombre');

    // Mapa auxiliar: ID -> Nombre de Categoría (Ej: 2 -> "Papelería")
    // Lo necesitamos porque tus productos guardan el NOMBRE de la categoría, no el ID.
    const categoryMap = {}; 
    if (categories) {
        categories.forEach(c => categoryMap[c.id] = c.nombre);
    }

    // 3. Renderizar Categorías
    if (categories) {
        categories.forEach(cat => {
            const label = document.createElement('label');
            label.className = 'filter-option';
            label.innerHTML = `
                <input type="checkbox" value="${cat.nombre}" class="cat-checkbox" data-id="${cat.id}">
                <span>${cat.nombre}</span>
            `;
            
            // Evento: Al marcar categoría -> Filtrar Subcategorías y Buscar
            label.querySelector('input').addEventListener('change', (e) => {
                const val = e.target.value;
                
                // Actualizar estado
                if (e.target.checked) {
                    pageState.selectedCategories.push(val);
                } else {
                    pageState.selectedCategories = pageState.selectedCategories.filter(c => c !== val);
                }
                
                // --- MAGIA AQUÍ: Sincronizar Subcategorías ---
                syncSubcategoriesVisibility(); 
                // ---------------------------------------------

                pageState.currentPage = 1; 
                updateProductList();
            });
            catList.appendChild(label);
        });
    }

    // 4. Renderizar Subcategorías (Con referencia al PADRE)
    if (subcategories) {
        subcategories.forEach(sub => {
            const parentName = categoryMap[sub.categoria_id]; // Buscamos el nombre del padre

            const label = document.createElement('label');
            label.className = 'filter-option sub-filter-item'; // Clase extra para manipularlas
            
            // ATRIBUTO CLAVE: data-parent-category nos dice a quién pertenece
            label.setAttribute('data-parent-category', parentName); 
            
            label.innerHTML = `
                <input type="checkbox" value="${sub.id}" class="sub-checkbox">
                <span>${sub.nombre}</span>
            `;
            
            label.querySelector('input').addEventListener('change', (e) => {
                const val = parseInt(e.target.value);
                if (e.target.checked) {
                    pageState.selectedSubcategories.push(val);
                } else {
                    pageState.selectedSubcategories = pageState.selectedSubcategories.filter(s => s !== val);
                }
                pageState.currentPage = 1; 
                updateProductList();
            });
            subList.appendChild(label);
        });
    }
}

/**
 * FUNCIÓN DE CASCADA: Muestra/Oculta subcategorías según la categoría seleccionada
 */
function syncSubcategoriesVisibility() {
    // 1. ¿Qué categorías están marcadas?
    const selectedCats = pageState.selectedCategories;
    
    // 2. Buscamos todas las opciones de subcategoría en el HTML
    const subItems = document.querySelectorAll('.sub-filter-item');

    subItems.forEach(item => {
        const parentCatName = item.getAttribute('data-parent-category');
        const checkbox = item.querySelector('input');
        const subId = parseInt(checkbox.value);

        // LÓGICA DE VISIBILIDAD:
        // Si NO hay categorías seleccionadas -> MUESTRA TODO (Comportamiento estándar)
        // Si HAY categorías seleccionadas -> Solo muestra las que coincidan con el padre
        let shouldShow = false;

        if (selectedCats.length === 0) {
            shouldShow = true;
        } else {
            shouldShow = selectedCats.includes(parentCatName);
        }

        // Aplicar visibilidad
        if (shouldShow) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
            
            // IMPORTANTE: Si ocultamos una subcategoría que estaba marcada, hay que desmarcarla
            // para que no rompa la búsqueda.
            if (checkbox.checked) {
                checkbox.checked = false;
                // También la sacamos del estado global
                pageState.selectedSubcategories = pageState.selectedSubcategories.filter(s => s !== subId);
            }
        }
    });
}

async function fetchProducts(filters) {
    console.log("📡 Buscando productos...", filters);

    try {
        // AGREGAMOS 'tasa_iva:porcentaje_iva'
        const selectFields = `
            id:sku, 
            nombre:descripcion,
            precio:precio, 
            stock:stock, 
            categoria:categoria,
            subcategoria_id:subcategoria,
            url_imagen:imagen_url,
            tasa_iva:porcentaje_iva 
        `;
        
        // count: 'exact' es vital para la paginación
        let query = supabase.from('productos_web').select(selectFields, { count: 'exact' });

        // --- FILTROS ---
        if (filters.searchTerm) { 
            query = query.ilike('descripcion', `%${filters.searchTerm}%`); 
        }
        
        // Filtro Categorías (Array de Strings)
        if (filters.selectedCategories.length > 0) { 
            query = query.in('categoria', filters.selectedCategories); 
        }

        // Filtro Subcategorías (Array de IDs)
        // Soporta tanto selección manual (array) como navegación por URL (single ID en array)
        if (filters.selectedSubcategories.length > 0) {
            query = query.in('subcategoria', filters.selectedSubcategories);
        }
        // Soporte legacy para currentSubcategoryId (si vienes del menú)
        else if (filters.currentSubcategoryId) {
             query = query.eq('subcategoria', filters.currentSubcategoryId);
        }

        // NUEVO: Filtro de Rango de Precios
        if (filters.priceRange && filters.priceRange.length === 2) {
            query = query.gte('precio', filters.priceRange[0]); // Mayor o igual al mínimo
            query = query.lte('precio', filters.priceRange[1]); // Menor o igual al máximo
        }

        query = query.gt('stock', 0); 

        // Ordenamiento
        query = query.order(filters.orderBy, { ascending: filters.ascending });
        
        // Paginación
        const from = (filters.currentPage - 1) * filters.itemsPerPage;
        const to = from + filters.itemsPerPage - 1;
        query = query.range(from, to);
        
        // Ejecutar
        const { data, error, count } = await query;

        if (error) {
            console.error("🔥 Error Supabase:", error.message);
            return { data: [], count: 0 }; 
        }

        return { data, count: count }; 
    } catch (e) {
        console.error("💥 Error JS:", e); 
        
        return { data: [], count: 0 }; 
    }
}

async function updateProductList() {
    const grid = document.getElementById('product-listing-grid') || document.getElementById('bestsellers-grid') || document.getElementById('favorites-listing-grid');
    const paginationContainer = document.getElementById('product-pagination');
    
    if (!grid) return;
    
    // Spinner de carga
    grid.innerHTML = '<div style="width:100%; text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    // Llamada a la BD
    const { data: products, count } = await fetchProducts(pageState); 
    
    grid.innerHTML = ''; 

    // Renderizar Productos
    if (products && products.length > 0) {
        products.forEach(product => {
            const card = document.createElement('div'); 
            card.className = 'product-card';
            
            // Imagen segura
            let imageUrl = product.url_imagen;
            if (!imageUrl || imageUrl.startsWith('http') === false || imageUrl.includes('placeholder')) {
                imageUrl = 'img/papeleria.jpg';
            }

            // Semáforo de Stock
            let stockHtml = '';
            let stockClass = 'high'; 
            let stockText = `Stock: ${product.stock}`;

            if (product.stock <= 5) {
                stockClass = 'critical'; 
                stockText = `¡Solo quedan ${product.stock}!`;
            } else if (product.stock <= 15) {
                stockClass = 'low'; 
                stockText = `Pocas piezas: ${product.stock}`;
            }

            stockHtml = `<span class="stock-badge ${stockClass}">${stockText}</span>`;

            // HTML de la Tarjeta
            card.innerHTML = `
                <div class="product-image-mockup" style="background-image: url('${imageUrl}');">
                    <div class="heart-icon" data-sku="${product.id}"><i class="far fa-heart"></i></div>
                </div>
                
                <div class="product-info-container">
                    ${stockHtml}
                    <h3>${product.nombre || 'Sin Nombre'}</h3>
                    <p class="product-price">$${(product.precio || 0).toFixed(2)}</p>
                    
                    <div class="add-to-cart">
                        <input type="number" value="1" min="1" max="${product.stock}" class="qty-input" id="qty-${product.id}">
                        <button class="add-btn" id="btn-${product.id}">
                            <i class="fas fa-cart-plus"></i> Añadir
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(card);

            // --- EVENTOS DE LA TARJETA ---
            
            // 1. Ir al detalle (clic en imagen o título)
            const goToDetail = () => {
                window.location.href = `pagina-10-detalle.html?id=${product.id}`;
            };
            card.querySelector('.product-image-mockup').addEventListener('click', goToDetail);
            card.querySelector('h3').addEventListener('click', goToDetail);

            // 2. Botón Añadir
            const btn = card.querySelector(`#btn-${product.id}`);
            const input = card.querySelector(`#qty-${product.id}`);

            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se abra el detalle
                let quantity = parseInt(input.value) || 1;
                
                // Validación de stock
                if(quantity > product.stock) {
                    alert(`Solo tenemos ${product.stock} unidades disponibles.`);
                    quantity = product.stock;
                    input.value = quantity;
                }
                addToCart(product, quantity);
            });

            // 3. Botón Favorito (Corazón)
            const heart = card.querySelector('.heart-icon');
            heart.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(product.id);
            });
            
            // Verificamos si es favorito para pintarlo rojo
            checkIfFavorite(product.id);
        });
    } else {
        grid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1; padding: 40px; color: #999;">No se encontraron productos con estos filtros.</p>';
    }

    // Renderizar Paginación
    if (paginationContainer) {
        renderPagination(count, paginationContainer);
    }
}

// Función auxiliar para dibujar botones de página
function renderPagination(totalItems, container) {
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / pageState.itemsPerPage);
    
    if (totalPages <= 1) return; // No mostrar si solo hay 1 página

    // Botón Anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = pageState.currentPage === 1;
    prevBtn.onclick = () => { pageState.currentPage--; updateProductList(); };
    container.appendChild(prevBtn);

    // Botones de Número
    for (let i = 1; i <= totalPages; i++) {
        // Lógica simple: Mostrar todos. (Para muchos productos, habría que recortar ej: 1, 2 ... 10)
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === pageState.currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => { pageState.currentPage = i; updateProductList(); };
        container.appendChild(btn);
    }

    // Botón Siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = pageState.currentPage === totalPages;
    nextBtn.onclick = () => { pageState.currentPage++; updateProductList(); };
    container.appendChild(nextBtn);
}

function setupFilterEvents() { /* ... (Tu lógica) ... */ }
function getMockCategories() { /* ... (Tu lógica) ... */ return [
    { slug: 'papeleria-y-oficina', name: 'Papelería y oficina', subcategories: ['Papel', 'Cuadernos y agendas', 'Adhesivos y cintas'] },
    { slug: 'fiesta-y-eventos', name: 'Fiesta y eventos', subcategories: ['Globos', 'Decoración', 'Desechables'] }];
}

// ==========================================================
// FUNCIÓN: GENERAR MEGA MENÚ (Categorías + Subcategorías)
// ==========================================================
// ==========================================================
// FUNCIÓN MEGA MENÚ: VISTA DIVIDIDA (SIDEBAR + CONTENIDO)
// ==========================================================
// ==========================================================
// FUNCIÓN MEGA MENÚ: SOLO TEXTO (LISTA UL)
// ==========================================================
async function populateHeaderDropdown() {
    const dropdownMenu = document.getElementById('product-dropdown-menu');
    if (!dropdownMenu) return;

    // 1. Obtener datos
    const { data: categories } = await supabase
        .from('categorias_web')
        .select('id, nombre')
        .order('id', { ascending: true });

    const { data: subcategories } = await supabase
        .from('subcategorias_web')
        .select('id, nombre, categoria_id')
        .order('nombre', { ascending: true });

    // 2. Estructura Base (Izquierda y Derecha)
    dropdownMenu.innerHTML = `
        <div class="dropdown-sidebar" id="menu-sidebar"></div>
        <div class="dropdown-content-area" id="menu-content"></div>
    `;

    const sidebar = document.getElementById('menu-sidebar');
    const contentArea = document.getElementById('menu-content');

    if (!categories || categories.length === 0) return;

    // 3. Generar contenido
    categories.forEach((cat, index) => {
        // --- LADO IZQUIERDO (Categoría) ---
        const sidebarItem = document.createElement('div');
        // El primero está activo por defecto
        sidebarItem.className = `menu-category-item ${index === 0 ? 'active' : ''}`; 
        sidebarItem.innerHTML = `
            <span>${cat.nombre}</span>
            <i class="fas fa-chevron-right"></i>
        `;
        
        // Evento Hover para cambiar de pestaña
        sidebarItem.addEventListener('mouseenter', () => {
            // Desactivar todos
            document.querySelectorAll('.menu-category-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.subcategory-panel').forEach(el => el.classList.remove('active'));
            
            // Activar este
            sidebarItem.classList.add('active');
            const targetPanel = document.getElementById(`panel-${cat.id}`);
            if (targetPanel) targetPanel.classList.add('active');
        });

        sidebar.appendChild(sidebarItem);

        // --- LADO DERECHO (Panel de Subcategorías) ---
        const panel = document.createElement('div');
        panel.className = `subcategory-panel ${index === 0 ? 'active' : ''}`;
        panel.id = `panel-${cat.id}`;

        // Encabezado del panel
        const headerHtml = `
            <div class="panel-header">
                <a href="subcategorias.html?category=${encodeURIComponent(cat.nombre)}" class="panel-title">${cat.nombre}</a>
                <a href="subcategorias.html?category=${encodeURIComponent(cat.nombre)}" class="view-all-link">Ver todo</a>
            </div>
        `;
        
        // Lista UL de subcategorías
        const ul = document.createElement('ul');
        ul.className = 'subcategory-list';

        const misSubs = subcategories.filter(s => s.categoria_id === cat.id);
        
        if (misSubs.length > 0) {
            misSubs.forEach(sub => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                
                // Clic: Va al buscador filtrado
                link.href = `pagina-15-buscador.html?sub_id=${sub.id}&title=${encodeURIComponent(sub.nombre)}&category=${encodeURIComponent(cat.nombre)}`;
                link.textContent = sub.nombre; // SOLO TEXTO
                
                li.appendChild(link);
                ul.appendChild(li);
            });
        } else {
            ul.innerHTML = '<li style="color:#999; padding:10px;">No hay subcategorías disponibles.</li>';
        }

        panel.innerHTML = headerHtml;
        panel.appendChild(ul);
        contentArea.appendChild(panel);
    });
}

async function loadBestsellers() {
    console.log("🏆 Cargando productos más vendidos...");
    
    pageState.baseCategory = null; 
    pageState.selectedCategories = [];
    
    // --- CAMBIOS CLAVE AQUÍ ---
    pageState.orderBy = 'ventas_totales'; // Usamos tu columna de ventas
    pageState.ascending = false;          // False = Descendente (De mayor a menor)
    
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
    if (authMessage) authMessage.textContent = 'Procesando registro...';

    // 1. Registro en Supabase Auth
    const { data, error } = await supabase.auth.signUp({ 
        email: email, 
        password: password,
        options: {
            data: {
                full_name: fullName, // Importante para el Trigger de la BD
                phone: phone
            }
        }
    });

    if (error) {
        if (authMessage) authMessage.textContent = `Error: ${error.message}`;
        return;
    }
    
    // 2. Verificación de Estado
    if (data.user && !data.session) {
        // CASO A: El usuario se creó, pero REQUIERE VERIFICACIÓN DE EMAIL.
        // (No hay sesión activa todavía)
        
        console.log("✉️ Registro iniciado. Esperando confirmación de email.");
        if (authMessage) authMessage.textContent = ''; // Limpiamos mensaje

        // Mostrar Modal de "Revisa tu correo"
        const emailSpan = document.getElementById('sent-email-span');
        const modal = document.getElementById('verify-email-modal');
        
        if (emailSpan) emailSpan.textContent = email;
        if (modal) modal.style.display = 'flex'; // Mostramos el modal

        // Nota: No hacemos el 'insert' manual aquí porque sin sesión fallaría por permisos (RLS).
        // El Trigger automático de tu Base de Datos (handle_new_user) se encargará de crear el cliente.

    } else if (data.user && data.session) {
        // CASO B: Confirmación desactivada o automática (Entra directo)
        
        console.log("✅ Registro y Login completado.");
        alert("¡Bienvenido! Tu cuenta ha sido creada.");
        window.location.href = 'index.html'; 
    }
}

async function handleLogin(e) { 
    e.preventDefault(); 
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const authMessage = document.getElementById('auth-message');
    if (authMessage) authMessage.textContent = 'Verificando credenciales...';

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        if (authMessage) authMessage.textContent = `Error: ${error.message}`;
        return;
    }
    
    // --- VALIDACIÓN ESTRICTA DE CORREO ---
    if (data.user) {
        // Verificamos la propiedad 'confirmed_at'
        if (!data.user.confirmed_at && !data.user.email_confirmed_at) {
            alert("⚠️ Acceso denegado.\nTu correo no ha sido verificado. Por favor revisa tu bandeja de entrada o spam.");
            
            // Importante: Cerramos la sesión que Supabase acaba de abrir
            await supabase.auth.signOut(); 
            
            if (authMessage) authMessage.textContent = 'Correo no verificado.';
            return; // Detenemos todo aquí
        }

        // Si pasa la validación:
        alert("¡Bienvenido! Sesión iniciada correctamente.");
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

    console.log("👤 Cargando perfil...");

    // 1. Obtener datos de autenticación (Auth)
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) return;

    // 2. Intentar obtener datos de la tabla (Base de Datos)
    let { data: clienteData, error } = await supabase
        .from('clientes_web')
        .select('razon_social, telefono, rfc') 
        .eq('id', currentUserID)
        .single();
    
    // 3. AUTO-REPARACIÓN: Si el usuario existe en Auth pero NO en la tabla...
    if (!clienteData) {
        console.warn("⚠️ El perfil no existe en la tabla. Intentando crear uno ahora...");
        
        // Recuperamos los datos que guardamos en user_metadata al registrarse
        const metaName = user.user_metadata?.full_name || 'Cliente Web';
        const metaPhone = user.user_metadata?.phone || '';

        // Insertamos el perfil "perdido"
        const { data: newProfile, error: insertError } = await supabase
            .from('clientes_web')
            .insert([{
                id: user.id,
                email: user.email,
                razon_social: metaName,
                telefono: metaPhone,
                rfc: 'XAXX010101000' // RFC genérico
            }])
            .select()
            .single();

        if (insertError) {
            console.error("❌ Error crítico al auto-crear perfil:", insertError.message);
            // Aquí podrías mostrar un error en pantalla
        } else {
            console.log("✅ Perfil auto-reparado con éxito.");
            clienteData = newProfile; // Usamos el perfil recién creado
        }
    }

    // 4. Mostrar datos en pantalla
    if (clienteData) {
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        const phoneEl = document.getElementById('profile-phone');

        if (nameEl) nameEl.textContent = clienteData.razon_social || '(Sin Nombre)';
        if (emailEl) emailEl.textContent = user.email; // El email siempre viene de Auth
        if (phoneEl) phoneEl.textContent = clienteData.telefono || '--';
    }
}


// ==========================================================
// NUEVA FUNCIÓN: CARGAR CATEGORÍAS DE SUPABASE
// ==========================================================
// ==========================================================
// NUEVA FUNCIÓN: CARGAR CATEGORÍAS CON DISEÑO DE CARDS
// ==========================================================
// ==========================================================
// NUEVA FUNCIÓN: CARGAR CATEGORÍAS CON IMÁGENES LOCALES (CARPETA IMG)
// ==========================================================
// ==========================================================
// NUEVA FUNCIÓN: CARGAR CATEGORÍAS CON IMÁGENES LOCALES
// ==========================================================
// ==========================================================
// NUEVA FUNCIÓN: CARGAR CATEGORÍAS (GRANDES + TEXTO)
// ==========================================================
async function loadCategoriesFromDB() {
    const container = document.getElementById('categories-grid-container');
    if (!container) return; 

    console.log("📂 Cargando categorías estilo tarjeta grande...");
    
    const { data: categories, error } = await supabase
        .from('categorias_web')
        .select('id, nombre')
        .order('id', { ascending: true });

    if (error) {
        console.error("Error:", error.message);
        container.innerHTML = '<p>Error al cargar categorías.</p>';
        return;
    }

    container.innerHTML = '';

    // 1. DICCIONARIO DE IMÁGENES
    const getLocalImageForCategory = (dbName) => {
        const name = dbName.toLowerCase().trim();
        if (name.includes('papelería') || name.includes('papeleria')) return 'img/papeleria.jpg';
        if (name.includes('fiesta')) return 'img/fiestas-eventos.jpg';
        if (name.includes('bolsas')) return 'img/bolsas-accesorios.jpg';
        if (name.includes('zapatería') || name.includes('zapateria')) return 'img/zapateria.jpg';
        return 'https://via.placeholder.com/400x300?text=Sin+Imagen';
    };

    // 2. DICCIONARIO DE TEXTOS DE REFERENCIA (¡NUEVO!)
    const getDescriptionForCategory = (dbName) => {
        const name = dbName.toLowerCase().trim();
        if (name.includes('papelería')) return 'Equípate para la escuela y oficina';
        if (name.includes('fiesta')) return 'Globos, decoración y diversión';
        if (name.includes('bolsas')) return 'Estilo y accesorios para ti';
        if (name.includes('zapatería')) return 'Comodidad en cada paso';
        return 'Explora nuestra colección'; // Texto por defecto
    };

    // 3. GENERAR HTML
    if (categories && categories.length > 0) {
        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card'; 
            
            const localImage = getLocalImageForCategory(cat.nombre);
            const descriptionText = getDescriptionForCategory(cat.nombre);

            card.onclick = () => {
                // CAMBIO: Ahora redirige a la página de subcategorías
                window.location.href = `subcategorias.html?category=${encodeURIComponent(cat.nombre)}`; 
            };
            // Estructura nueva con contenedor 'category-info'
            card.innerHTML = `
                <div class="category-image" style="background-image: url('${localImage}');"></div>
                <div class="category-overlay"></div>
                
                <div class="category-info">
                    <h3>${cat.nombre}</h3>
                    <p>${descriptionText}</p>
                </div>
            `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p>No hay categorías.</p>';
    }
}

// ==========================================================
// NUEVA FUNCIÓN: CARGAR SUBCATEGORÍAS (Página subcategorias.html)
// ==========================================================
// ==========================================================
// NUEVA FUNCIÓN: CARGAR SUBCATEGORÍAS CON IMÁGENES EXACTAS
// ==========================================================
async function loadSubcategoriesPage() {
    const container = document.getElementById('subcategories-grid-container');
    const pageTitle = document.getElementById('subcategory-page-title');
    
    // Solo ejecutamos si estamos en la página correcta
    if (!container || !pageTitle) return;

    console.log("📂 Cargando página de Subcategorías...");

    // 1. Obtener la categoría principal de la URL
    const params = getUrlParams();
    const parentCategoryName = decodeURIComponent(params.category || '');

    if (!parentCategoryName) {
        container.innerHTML = '<p style="text-align:center;">⚠️ Error: No se especificó una categoría.</p>';
        return;
    }

    // Actualizamos el título de la página
    pageTitle.textContent = `Explora: ${parentCategoryName}`;

    try {
        // 2. Buscar el ID de la categoría principal
        const { data: parentCatData, error: parentError } = await supabase
            .from('categorias_web')
            .select('id')
            .eq('nombre', parentCategoryName)
            .single();

        if (parentError || !parentCatData) {
            console.error("Error buscando categoría padre:", parentError);
            container.innerHTML = `<p style="text-align:center;">No se encontró la categoría "${parentCategoryName}".</p>`;
            return;
        }

        const parentId = parentCatData.id;

        // 3. Buscar las subcategorías asociadas
        const { data: subcategories, error: subError } = await supabase
            .from('subcategorias_web')
            .select('id, nombre')
            .eq('categoria_id', parentId)
            .order('nombre', { ascending: true });

        if (subError) {
            container.innerHTML = '<p style="text-align:center;">Error al cargar las subcategorías.</p>';
            return;
        }

        // 4. Mapeo de Imágenes y Textos
        container.innerHTML = ''; 

        if (subcategories && subcategories.length > 0) {
            
            // --- DICCIONARIO DE IMÁGENES (Rutas exactas de tu carpeta) ---
            const getSubImage = (dbName) => {
                const name = dbName.toLowerCase().trim();

                // 1. Papelería y Oficina
                if (name === 'papel') return 'img/subcategorias/papel.jpg';
                if (name.includes('cuadernos')) return 'img/subcategorias/cuadernos.jpg';
                if (name.includes('adhesivos')) return 'img/subcategorias/adhesivos.jpg';
                if (name.includes('artículos de oficina') || name.includes('articulos')) return 'img/subcategorias/oficina.jpg';
                if (name.includes('escritura')) return 'img/subcategorias/escritura.jpg';
                if (name.includes('libros')) return 'img/subcategorias/libros.jpg';
                
                // 2. Fiesta y Regalos
                if (name.includes('globos')) return 'img/subcategorias/globos.jpg';
                if (name.includes('empaques') || name.includes('regalos')) return 'img/subcategorias/regalos.jpeg'; // Ojo: es .jpeg
                
                // 3. Bolsas y Accesorios
                if (name === 'mochilas') return 'img/subcategorias/mochilas.webp'; // Ojo: es .webp
                if (name.includes('bolsas para dama')) return 'img/subcategorias/bolsas-dama.webp';
                if (name.includes('carteras')) return 'img/subcategorias/carteras.jpg';
                if (name.includes('accesorios')) return 'img/subcategorias/accesorios.jpg';

                // 4. Zapatería (Ojo con las extensiones aquí)
                if (name.includes('calzado de dama')) return 'img/subcategorias/calzado-dama.webp';
                if (name.includes('calzado de caballero')) return 'img/subcategorias/calzado-caballero.webp';
                if (name.includes('calzado infantil')) return 'img/subcategorias/calzado-infantil.png'; // Ojo: es .png

                // Imagen por defecto si no coincide
                return 'https://via.placeholder.com/400x300?text=Orysi';
            };

            // --- DICCIONARIO DE TEXTOS ---
            const getSubText = (dbName) => {
                const name = dbName.toLowerCase().trim();
                if (name.includes('papel')) return 'Bond, cartulinas, opalina y más';
                if (name.includes('cuadernos')) return 'Profesionales, forma francesa e italiana';
                if (name.includes('adhesivos')) return 'Cintas, pegamentos y silicones';
                if (name.includes('oficina')) return 'Engrapadoras, clips y organización';
                if (name.includes('escritura')) return 'Bolígrafos, plumones y lápices';
                if (name.includes('libros')) return 'Material didáctico y lectura';
                if (name.includes('globos')) return 'Látex, metálicos y números';
                if (name.includes('regalos')) return 'Cajas, bolsas y envolturas';
                if (name.includes('mochilas')) return 'Escolares, laptop y viaje';
                if (name.includes('bolsas')) return 'Estilo y tendencia para ella';
                if (name.includes('calzado')) return 'Comodidad y moda a tus pies';
                return 'Explora nuestra colección';
            };

            subcategories.forEach(sub => {
                const card = document.createElement('div');
                card.className = 'category-card'; // Reutilizamos el estilo de CSS
                
                const localImage = getSubImage(sub.nombre);
                const descriptionText = getSubText(sub.nombre);

                // Al hacer clic, enviamos la búsqueda filtrada por esa subcategoría
                // ... dentro del bucle forEach(sub => ...
                card.onclick = () => {
                // AHORA enviamos también 'category' (el padre) para poder armar la ruta de navegación
                window.location.href = `pagina-15-buscador.html?sub_id=${sub.id}&title=${encodeURIComponent(sub.nombre)}&category=${encodeURIComponent(parentCategoryName)}`;
    };

                card.innerHTML = `
                    <div class="category-image" style="background-image: url('${localImage}');"></div>
                    <div class="category-overlay"></div>
                    <div class="category-info">
                        <h3>${sub.nombre}</h3>
                        <p>${descriptionText}</p>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p style="text-align:center;">No hay subcategorías en esta sección.</p>';
        }

    } catch (e) {
        console.error("Error crítico:", e);
        container.innerHTML = '<p style="text-align:center;">Ocurrió un error inesperado.</p>';
    }
}
// ==========================================================
// 4. LÓGICA DE FAVORITOS Y DETALLE (RLS Enabled)
// ==========================================================

async function fetchProductDetail(sku) {
    // AGREGAMOS 'tasa_iva:porcentaje_iva'
    const selectFields = `id:sku, nombre:descripcion, precio:precio, stock:stock, url_imagen:imagen_url, tasa_iva:porcentaje_iva`;
    try {
        const { data } = await supabase.from('productos_web').select(selectFields).eq('sku', sku).single();
        return data;
    } catch (e) { 
        return null; 
    }
}

function renderProductDetail(product) {
    // Validación inicial
    if (!product) {
        const titleEl = document.getElementById('dynamic-page-title');
        if (titleEl) titleEl.textContent = "Producto no encontrado (ID inválido)";
        return;
    }

    currentProduct = product;

    // 1. LÓGICA DE IMAGEN (Usa local si falla la remota)
    let imageUrl = product.url_imagen;
    if (!imageUrl || imageUrl.startsWith('http') === false || imageUrl.includes('placeholder')) {
        imageUrl = 'img/papeleria.jpg';
    }
    
    // 2. RENDERIZADO SEGURO (Verificamos que el elemento exista antes de escribir)
    const titleEl = document.getElementById('dynamic-page-title');
    const priceEl = document.getElementById('product-price');
    const stockEl = document.getElementById('product-stock');
    const descEl = document.getElementById('product-description-text');
    const imgEl = document.getElementById('product-image-mockup');

    if (titleEl) titleEl.textContent = product.nombre;
    if (priceEl) priceEl.textContent = `$${(product.precio || 0).toFixed(2)} MXN`;
    if (descEl) descEl.textContent = product.descripcion || "Sin descripción disponible.";
    if (imgEl) imgEl.style.backgroundImage = `url('${imageUrl}')`;
    
    // Lógica de Stock (Semáforo)
    if (stockEl) {
        if (product.stock > 0) {
            stockEl.textContent = `En Stock: ${product.stock} unidades`;
            stockEl.style.color = '#2e7d32'; // Verde
        } else {
            stockEl.textContent = `Agotado`;
            stockEl.style.color = '#d32f2f'; // Rojo
        }
    }

    // ... (dentro de renderProductDetail) ...

    // Verificar si es favorito (Pinta el corazón al cargar)
    checkIfFavorite(product.id);

    // --- NUEVO: Conectar evento clic al corazón del detalle ---
    const detailHeartBtn = document.querySelector('.detail-heart');
    if (detailHeartBtn) {
        // Clonamos para eliminar eventos previos si se recarga
        const newHeart = detailHeartBtn.cloneNode(true);
        detailHeartBtn.parentNode.replaceChild(newHeart, detailHeartBtn);
        
        newHeart.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Efecto visual inmediato
            newHeart.querySelector('i').classList.add('fa-bounce'); 
            setTimeout(() => newHeart.querySelector('i').classList.remove('fa-bounce'), 500);
            
            toggleFavorite(product.id);
        });
    }
    // ----------------------------------------------------------

    // ... (sigue la lógica de controles de cantidad) ...

    // 3. LÓGICA DE CONTROLES (BOTONES + / - Y AGREGAR)
    const qtyInput = document.getElementById('qty-input-detail');
    const btnMinus = document.querySelector('.qty-btn.minus');
    const btnPlus = document.querySelector('.qty-btn.plus');
    const addToCartBtn = document.querySelector('.add-btn-large');

    // A. Botones de Cantidad
    if (qtyInput && btnMinus && btnPlus) {
        // Clonamos para eliminar eventos viejos acumulados
        const newMinus = btnMinus.cloneNode(true);
        const newPlus = btnPlus.cloneNode(true);
        btnMinus.parentNode.replaceChild(newMinus, btnMinus);
        btnPlus.parentNode.replaceChild(newPlus, btnPlus);

        // Resetear input a 1 al cargar producto
        qtyInput.value = 1;

        // Evento Menos
        newMinus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val > 1) qtyInput.value = val - 1;
        });

        // Evento Más (Con tope de stock)
        newPlus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val < product.stock) {
                qtyInput.value = val + 1;
            } else {
                alert(`Solo tenemos ${product.stock} unidades disponibles.`);
            }
        });
    }

    // B. Botón "Agregar al Carrito"
    if (addToCartBtn) {
        const newAddBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newAddBtn, addToCartBtn);

        if (product.stock > 0) {
            newAddBtn.disabled = false;
            newAddBtn.style.opacity = "1";
            newAddBtn.style.cursor = "pointer";
            newAddBtn.innerHTML = '<i class="fas fa-shopping-bag"></i> Agregar al Carrito';
            
            newAddBtn.addEventListener('click', () => {
                const finalQty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
                addToCart(product, finalQty);
            });
        } else {
            newAddBtn.disabled = true;
            newAddBtn.style.opacity = "0.6";
            newAddBtn.style.cursor = "not-allowed";
            newAddBtn.innerHTML = '<i class="fas fa-ban"></i> Agotado';
        }
    }
}
// ==========================================================
// 4. LÓGICA DE FAVORITOS (COMPLETA)
// ==========================================================

// Verifica si un producto es favorito y pinta el corazón
async function checkIfFavorite(sku) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Si no hay login, no hacemos nada

    // Buscamos botones de corazón para este producto (puede haber en grid y en detalle)
    // En el grid, el ID del botón suele ser complejo, así que buscamos por atributo data
    // O mejor, buscamos si tenemos el producto en memoria.
    
    // Consulta a BD
    const { data, error } = await supabase
        .from('favoritos_web')
        .select('id')
        .eq('user_id', user.id)
        .eq('producto_sku', sku)
        .maybeSingle();

    if (data) {
        // Si existe, buscamos el ícono y lo ponemos rojo
        markHeartAsActive(sku, true);
    }
}

// Función auxiliar visual
// Función auxiliar visual
function markHeartAsActive(sku, isActive) {
    // 1. Buscamos en la página de detalle (NUEVO SELECTOR)
    const detailHeart = document.querySelector('.detail-heart'); 
    
    if (detailHeart && currentProduct && currentProduct.id == sku) {
        const icon = detailHeart.querySelector('i');
        if (isActive) {
            detailHeart.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            detailHeart.classList.remove('active');
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    }

    // 2. Buscamos en listados (Grid) - ESTO SIGUE IGUAL
    const gridHearts = document.querySelectorAll(`.heart-icon[data-sku="${sku}"]`);
    gridHearts.forEach(heart => {
        const icon = heart.querySelector('i');
        if (isActive) {
            heart.classList.add('active');
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            heart.classList.remove('active');
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    });
}

// Agregar o Quitar (Toggle)
async function toggleFavorite(sku) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert("Debes iniciar sesión para guardar favoritos.");
        window.location.href = 'login.html';
        return;
    }

    // 1. Ver si ya existe
    const { data: existing } = await supabase
        .from('favoritos_web')
        .select('id')
        .eq('user_id', user.id)
        .eq('producto_sku', sku)
        .maybeSingle();

    if (existing) {
        // BORRAR
        const { error } = await supabase
            .from('favoritos_web')
            .delete()
            .eq('id', existing.id);
        
        if (!error) {
            markHeartAsActive(sku, false);
            // Si estamos en la página de mis favoritos, recargamos
            if (document.getElementById('favorites-listing-grid')) {
                loadFavoritesPage(); 
            }
        }
    } else {
        // AGREGAR
        const { error } = await supabase
            .from('favoritos_web')
            .insert([{ user_id: user.id, producto_sku: sku }]);
        
        if (!error) {
            markHeartAsActive(sku, true);
        }
    }
}

// Cargar la página "Mis Favoritos"
async function loadFavoritesPage() {
    const grid = document.getElementById('favorites-listing-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="text-align:center; width:100%;"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // 1. Traer IDs de favoritos
    const { data: favs, error } = await supabase
        .from('favoritos_web')
        .select('producto_sku')
        .eq('user_id', user.id);

    if (!favs || favs.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center; grid-column: 1/-1; padding: 50px;">
                <i class="far fa-heart" style="font-size:3rem; color:#ccc; margin-bottom:15px;"></i>
                <h3>No tienes favoritos aún.</h3>
                <a href="index.html" class="btn-view-all" style="display:inline-block; margin-top:10px;">Ir al catálogo</a>
            </div>`;
        return;
    }

    // 2. Traer los productos reales usando esos IDs
    const skus = favs.map(f => f.producto_sku);
    
    const { data: products } = await supabase
        .from('productos_web')
        .select('*')
        .in('sku', skus);

    // 3. Renderizar (Reusamos lógica similar a updateProductList pero simplificada)
    grid.innerHTML = '';
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        let imageUrl = product.imagen_url;
        if (!imageUrl || imageUrl.includes('placeholder')) imageUrl = 'img/papeleria.jpg';

        // En "Mis Favoritos", el corazón siempre empieza activo
        card.innerHTML = `
            <div class="product-image-mockup" style="background-image: url('${imageUrl}');">
                <div class="heart-icon fas active" data-sku="${product.sku}"><i class="fas fa-heart"></i></div>
            </div>
            <div class="product-info-container">
                <h3>${product.descripcion}</h3>
                <p class="product-price">$${(product.precio || 0).toFixed(2)}</p>
                <div class="add-to-cart">
                     <button class="add-btn" onclick="window.location.href='pagina-10-detalle.html?id=${product.sku}'">
                        Ver Producto
                     </button>
                </div>
            </div>
        `;

        // Evento del corazón (para quitar de la lista)
        card.querySelector('.heart-icon').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(product.sku);
        });

        grid.appendChild(card);
    });
}
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
// 3. MEJORA: Sobrescribir addToCart para que abra el sidebar
// Reemplaza tu función addToCart original con esta versión mejorada
function addToCart(product, quantityToAdd = 1) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    // Validamos que venga el IVA, si no, usamos 0.16 por seguridad
    // Nota: En tu BD el IVA viene como 0.16 o 0.00
    const productIva = (product.tasa_iva !== undefined && product.tasa_iva !== null) 
                       ? product.tasa_iva 
                       : 0.16;

    if (existingItem) {
        existingItem.quantity += quantityToAdd;
        // Actualizamos el IVA por si cambió en la base de datos
        existingItem.iva = productIva; 
    } else {
        cart.push({
            id: product.id,
            nombre: product.nombre,
            precio: product.precio,
            quantity: quantityToAdd,
            iva: productIva // <--- GUARDAMOS EL IVA INDIVIDUAL AQUÍ
        });
    }
    saveCart(cart);
    updateCartIconCount();
    
    toggleCartSidebar(true); 
}

// Actualiza el numerito rojo del carrito en el header
function updateCartIconCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartIcon = document.getElementById('cart-icon');
    if (!cartIcon) return;

    // Buscamos si ya existe el badge (la bolita roja)
    let badge = cartIcon.querySelector('.cart-badge');
    
    // Si hay productos, mostramos el badge
    if (totalItems > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            cartIcon.appendChild(badge);
            // Agregamos estilo dinámicamente si no existe en CSS
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -10px;
                background-color: var(--highlight-red, red);
                color: white;
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 50%;
                font-weight: bold;
            `;
        }
        badge.textContent = totalItems;
        badge.style.display = 'block';
    } else {
        // Si está vacío, ocultamos la bolita
        if (badge) badge.style.display = 'none';
    }
}
// ==========================================================
// 5. LÓGICA DEL CARRITO (LocalStorage)
// ==========================================================

// ... (tus funciones getCart, saveCart, addToCart, updateCartIconCount siguen igual) ...

/**
 * Actualiza la cantidad de un producto específico
 */
function updateCartItemQuantity(itemId, newQuantity) {
    let cart = getCart();
    const item = cart.find(i => i.id.toString() === itemId.toString());

    if (item) {
        if (newQuantity < 1) {
            // Si baja a 0, preguntamos si quiere borrarlo
            if(confirm("¿Deseas eliminar este producto del carrito?")) {
                removeCartItem(itemId);
            } else {
                // Si dice que no, lo regresamos a 1 (o recargamos la vista)
                renderCartPage(); 
            }
            return;
        }
        item.quantity = newQuantity;
        saveCart(cart);
        
        // Actualizamos todas las vistas posibles
        updateCartIconCount();
        renderCartSidebar(); // Actualiza el lateral
        if (document.getElementById('cart-item-list')) renderCartPage(); // Actualiza la página grande
    }
}

/**
 * Elimina un producto del carrito por su ID
 */
function removeCartItem(itemId) {
    let cart = getCart();
    
    // Filtramos para quedarnos con todos MENOS el que queremos borrar
    const newCart = cart.filter(item => item.id.toString() !== itemId.toString());
    
    saveCart(newCart);
    updateCartIconCount();

    // Actualizamos las vistas visuales inmediatamente
    renderCartSidebar(); // Refresca el sidebar
    
    // Si estamos en la página de carrito, también la refrescamos
    if (document.getElementById('cart-item-list')) {
        renderCartPage();
    }
    
    // Opcional: Un pequeño aviso (puedes quitarlo si prefieres que sea silencioso)
    // console.log(`Producto ${itemId} eliminado`);
}

function renderCartPage() {
    const cartList = document.getElementById('cart-item-list');
    const cart = getCart();
    
    if (!cartList) return; 

    if (cart.length === 0) {
         cartList.innerHTML = `
            <div style="text-align:center; padding: 60px 20px; color:#999;">
                <i class="fas fa-shopping-cart" style="font-size: 4rem; margin-bottom:20px; opacity:0.3;"></i>
                <h3>Tu carrito está vacío</h3>
                <p>¡Explora nuestro catálogo y encuentra lo que necesitas!</p>
                <a href="index.html" class="add-btn" style="display:inline-block; margin-top:20px; width:auto; padding: 10px 30px; text-decoration:none;">Ir a comprar</a>
            </div>`;
         
         document.getElementById('cart-subtotal').textContent = '$0.00 MXN';
         document.getElementById('cart-iva').textContent = '$0.00 MXN';
         document.getElementById('cart-total').textContent = '$0.00 MXN';
         
         const btn = document.getElementById('generate-quotation-btn');
         if(btn) btn.disabled = true;
         return;
    }

    // Acumuladores
    let totalGlobal = 0;
    let subtotalGlobal = 0;
    let ivaGlobal = 0;

    cartList.innerHTML = '';
    
    cart.forEach(item => {
        // 1. Importe Total de línea (Precio con IVA * Cantidad)
        const importeTotalLinea = item.precio * item.quantity;
        
        // 2. Tasa
        const tasa = (item.iva !== undefined && item.iva !== null) ? item.iva : 0.16;
        
        // 3. Desglose inverso
        const importeBaseLinea = importeTotalLinea / (1 + tasa);
        const ivaLinea = importeTotalLinea - importeBaseLinea;

        // 4. Sumar
        totalGlobal += importeTotalLinea;
        subtotalGlobal += importeBaseLinea;
        ivaGlobal += ivaLinea;

        let imgUrl = 'img/papeleria.jpg';

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.setAttribute('data-id', item.id);

        cartItemDiv.innerHTML = `
            <div class="item-img-mockup" style="background-image: url('${imgUrl}');"></div>
            
            <div class="item-details">
                <h3>${item.nombre}</h3>
                <div class="item-sku">SKU: ${item.id}</div>
            </div>

            <div class="qty-selector cart-qty-selector">
                <button type="button" class="qty-btn minus" data-id="${item.id}"><i class="fas fa-minus"></i></button>
                <input type="number" value="${item.quantity}" min="1" class="qty-input" data-id="${item.id}" readonly>
                <button type="button" class="qty-btn plus" data-id="${item.id}"><i class="fas fa-plus"></i></button>
            </div>

            <div class="item-actions">
                <div class="item-price">$${importeTotalLinea.toFixed(2)} MXN</div>
                <button class="remove-item-btn" data-id="${item.id}">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </div>
        `;
        cartList.appendChild(cartItemDiv);
    });

    // Actualizar textos con los cálculos "inversos"
    document.getElementById('cart-subtotal').textContent = `$${subtotalGlobal.toFixed(2)} MXN`;
    document.getElementById('cart-iva').textContent = `$${ivaGlobal.toFixed(2)} MXN`;
    document.getElementById('cart-total').textContent = `$${totalGlobal.toFixed(2)} MXN`;
}

function setupCartEvents() {
    const cartList = document.getElementById('cart-item-list');
    if (!cartList) return;

    // Usamos delegación de eventos para mejor rendimiento

    cartList.addEventListener('click', (e) => {
        const target = e.target;

        // A. Botón MINUS (-)
        if (target.closest('.qty-btn.minus')) {
            const btn = target.closest('.qty-btn.minus');
            const id = btn.getAttribute('data-id');
            const input = cartList.querySelector(`input.qty-input[data-id="${id}"]`);
            let val = parseInt(input.value) || 1;
            
            if (val > 1) {
                updateCartItemQuantity(id, val - 1);
            } else {
                // Si es 1 y le da menos, preguntamos si quiere borrar
                if(confirm("¿Eliminar producto?")) removeCartItem(id);
            }
        }

        // B. Botón PLUS (+)
        if (target.closest('.qty-btn.plus')) {
            const btn = target.closest('.qty-btn.plus');
            const id = btn.getAttribute('data-id');
            const input = cartList.querySelector(`input.qty-input[data-id="${id}"]`);
            let val = parseInt(input.value) || 1;
            
            // Aquí podrías validar stock máximo si tuvieras el dato en localStorage
            updateCartItemQuantity(id, val + 1);
        }

        // C. Botón ELIMINAR (Basura)
        if (target.closest('.remove-item-btn')) {
            const btn = target.closest('.remove-item-btn');
            const id = btn.getAttribute('data-id');
            if(confirm("¿Seguro que deseas eliminar este producto?")) {
                removeCartItem(id);
            }
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
/**
 * Función principal para generar cotización y PDF.
 */
async function handleGenerateQuotation() {
    const cart = getCart();
    // Obtener totales limpios (quitando el signo $)
    const subtotalText = document.getElementById('cart-subtotal')?.textContent || "$0";
    const ivaText = document.getElementById('cart-iva')?.textContent || "$0";
    const totalText = document.getElementById('cart-total')?.textContent || "$0";

    const subtotal = parseFloat(subtotalText.replace(/[^0-9.-]+/g,"")) || 0;
    const iva = parseFloat(ivaText.replace(/[^0-9.-]+/g,"")) || 0;
    const total = parseFloat(totalText.replace(/[^0-9.-]+/g,"")) || 0;

    // 1. VALIDACIÓN: Solo usuarios registrados
    if (!currentUserID) {
        alert("⚠️ Debes iniciar sesión para generar una cotización.");
        window.location.href = 'login.html';
        return;
    }

    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    // --- NUEVO: VALIDACIÓN DE LÍMITE DIARIO ---
    try {
        const today = new Date().toISOString().split('T')[0]; // Fecha YYYY-MM-DD
        // Buscamos cuántas ha hecho hoy este usuario
        const { count, error: countError } = await supabase
            .from('cotizaciones_web')
            .select('*', { count: 'exact', head: true }) // head: true para solo contar, no descargar datos
            .eq('cliente_email', (await supabase.auth.getUser()).data.user.email)
            .gte('created_at', today);

        if (countError) throw countError;

        if (count >= 5) {
            alert("⚠️ Has alcanzado el límite diario de 5 cotizaciones.\nPor favor intenta de nuevo mañana.");
            return; // Detenemos la función
        }
    } catch (e) {
        console.error("Error validando límite:", e);
        // Opcional: dejar pasar si hay error de conexión para no bloquear al usuario
    }
    
    // Cambiar texto del botón para feedback
    const btn = document.getElementById('generate-quotation-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
    btn.disabled = true;

    try {
        // 2. OBTENER DATOS DEL CLIENTE
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;

        const { data: clienteData, error: clienteError } = await supabase
            .from('clientes_web')
            .select('razon_social, telefono, rfc')
            .eq('id', user.id)
            .single();
        
        // Si no tiene perfil completo, usamos el email como respaldo
        const nombreCliente = clienteData?.razon_social || user.email;
        const telefonoCliente = clienteData?.telefono || "";
        const rfcCliente = clienteData?.rfc || "XAXX010101000";

        // 3. INSERTAR CABECERA (cotizaciones_web)
        // Calculamos fecha de vencimiento (15 días)
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 15);

        const cotizacionHeader = {
            cliente_nombre: nombreCliente,
            cliente_email: user.email, 
            total: total,
            estado: 'PENDIENTE', 
            fecha_vencimiento: fechaVencimiento.toISOString() // Formato fecha DB
        };

        const { data: headerInsert, error: headerError } = await supabase
            .from('cotizaciones_web')
            .insert([cotizacionHeader])
            .select()
            .single();

        if (headerError) throw new Error("Error al guardar cotización: " + headerError.message);

        const cotizacionId = headerInsert.id;

        // 4. INSERTAR DETALLES (cotizacion_detalles_web)
        // Mapeamos el carrito a la estructura de tu BD
        const detallesToInsert = cart.map(item => ({
            cotizacion_id: cotizacionId,
            producto_sku: item.id.toString(), // Aseguramos que sea texto si tu BD lo pide
            cantidad: item.quantity,
            precio_unitario: item.precio,
            descripcion: item.nombre
        }));

        const { error: detallesError } = await supabase
            .from('cotizacion_detalles_web')
            .insert(detallesToInsert);

        if (detallesError) throw new Error("Error al guardar detalles: " + detallesError.message);

        // 5. GENERAR PDF (Localmente con pdfMake)
        generatePdfQuote(cotizacionId, nombreCliente, rfcCliente, telefonoCliente, cart, subtotal, iva, total);

        alert(`✅ ¡Cotización #${cotizacionId} generada correctamente!`);

    } catch (error) {
        console.error(error);
        alert("Hubo un problema: " + error.message);
    } finally {
        // Restaurar botón
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Función auxiliar separada para mantener el código limpio
function generatePdfQuote(folio, nombre, rfc, telefono, cart, subtotal, iva, total) {
    
    // Definición del documento PDF
    const docDefinition = {
        pageSize: 'LETTER',
        pageMargins: [40, 60, 40, 60],
        content: [
            // Encabezado
            { text: 'PAPELERÍA ORYSI', style: 'header', alignment: 'center', color: '#cc0000' },
            { text: 'COTIZACIÓN', style: 'subheader', alignment: 'center', margin: [0, 5, 0, 20] },

            // Datos del Cliente y Folio
            {
                columns: [
                    {
                        width: '*',
                        text: [
                            { text: 'Cliente: ', bold: true }, nombre + '\n',
                            { text: 'RFC: ', bold: true }, rfc + '\n',
                            { text: 'Teléfono: ', bold: true }, telefono
                        ]
                    },
                    {
                        width: 'auto',
                        text: [
                            { text: 'FOLIO: ', bold: true }, folio + '\n',
                            { text: 'FECHA: ', bold: true }, new Date().toLocaleDateString() + '\n',
                            { text: 'VIGENCIA: ', bold: true }, '15 días'
                        ],
                        alignment: 'right'
                    }
                ]
            },
            { text: '', margin: [0, 10] }, // Espacio

            // Tabla de Productos
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto', 'auto'],
                    body: [
                        // Cabecera de tabla
                        [
                            { text: 'Cant.', style: 'tableHeader' },
                            { text: 'Descripción', style: 'tableHeader' },
                            { text: 'SKU', style: 'tableHeader' },
                            { text: 'P. Unitario', style: 'tableHeader' },
                            { text: 'Importe', style: 'tableHeader' }
                        ],
                        // Filas del carrito (Dinámico)
                        ...cart.map(item => [
                            item.quantity,
                            item.nombre,
                            item.id,
                            `$${item.precio.toFixed(2)}`,
                            `$${(item.precio * item.quantity).toFixed(2)}`
                        ])
                    ]
                },
                layout: 'lightHorizontalLines'
            },

            // Totales
            {
                columns: [
                    { width: '*', text: '' },
                    {
                        width: 'auto',
                        style: 'totals',
                        margin: [0, 20, 0, 0],
                        table: {
                            widths: [100, 80],
                            body: [
                                ['Subtotal:', `$${subtotal.toFixed(2)}`],
                                ['IVA (16%):', `$${iva.toFixed(2)}`],
                                [{ text: 'TOTAL:', bold: true, fontSize: 14 }, { text: `$${total.toFixed(2)}`, bold: true, fontSize: 14 }]
                            ]
                        },
                        layout: 'noBorders'
                    }
                ]
            },
            
            // Pie de página
            { text: 'Gracias por su preferencia.', style: 'small', alignment: 'center', margin: [0, 40, 0, 0] }
        ],
        styles: {
            header: { fontSize: 22, bold: true },
            subheader: { fontSize: 16, bold: true, color: '#555' },
            tableHeader: { bold: true, fontSize: 12, color: 'black', fillColor: '#eeeeee' },
            totals: { alignment: 'right' },
            small: { fontSize: 10, italics: true, color: '#888' }
        }
    };

    // Generar y descargar
    pdfMake.createPdf(docDefinition).download(`Cotizacion_Orysi_${folio}.pdf`);
}
// ==========================================================
// HISTORIAL DE COTIZACIONES Y REGENERACIÓN DE PDF
// ==========================================================

async function loadQuoteHistory() {
    const tbody = document.getElementById('quotes-history-body');
    const noQuotesMsg = document.getElementById('no-quotes-msg');
    
    if (!tbody) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Traer cotizaciones del usuario
    const { data: quotes, error } = await supabase
        .from('cotizaciones_web')
        .select('*')
        .eq('cliente_email', user.email)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando historial:", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar historial.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    if (quotes.length === 0) {
        document.querySelector('.history-table').style.display = 'none';
        noQuotesMsg.style.display = 'block';
        return;
    }

    // 2. Renderizar filas
    quotes.forEach(quote => {
        const tr = document.createElement('tr');
        const date = new Date(quote.created_at).toLocaleDateString();
        const statusClass = quote.estado.toLowerCase(); // 'pendiente'

        tr.innerHTML = `
            <td>#${quote.id}</td>
            <td>${date}</td>
            <td style="font-weight:bold;">$${quote.total.toFixed(2)}</td>
            <td><span class="status-badge ${statusClass}">${quote.estado}</span></td>
            <td>
                <button class="btn-download-pdf" data-id="${quote.id}">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
            </td>
        `;
        
        // Conectar botón de descarga
        tr.querySelector('.btn-download-pdf').addEventListener('click', () => downloadSavedQuote(quote));
        
        tbody.appendChild(tr);
    });
}

/**
 * Reconstruye el PDF a partir de los datos guardados en BD
 */
async function downloadSavedQuote(quoteHeader) {
    const btn = document.querySelector(`button[data-id="${quoteHeader.id}"]`);
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        // 1. Obtener los detalles (productos) de esa cotización
        const { data: detalles, error } = await supabase
            .from('cotizacion_detalles_web')
            .select('*')
            .eq('cotizacion_id', quoteHeader.id);

        if (error) throw error;

        // 2. Obtener datos extra del cliente (Teléfono y RFC)
        // Como en la cotización solo guardamos nombre y email, buscamos el resto en el perfil actual
        // OJO: Si el cliente cambió sus datos después, saldrán los nuevos. Es aceptable.
        const { data: clienteData } = await supabase
            .from('clientes_web')
            .select('telefono, rfc')
            .eq('email', quoteHeader.cliente_email)
            .single();

        const telefono = clienteData?.telefono || "";
        const rfc = clienteData?.rfc || "";

        // 3. Reconstruir el objeto 'cart' para la función del PDF
        const reconstructedCart = detalles.map(d => ({
            quantity: d.cantidad,
            nombre: d.descripcion,
            id: d.producto_sku,
            precio: d.precio_unitario
        }));

        // 4. Calcular montos (asumiendo IVA 16%)
        const subtotal = quoteHeader.total / 1.16;
        const iva = quoteHeader.total - subtotal;

        // 5. Generar PDF (Reutilizamos tu función existente)
        generatePdfQuote(
            quoteHeader.id, 
            quoteHeader.cliente_nombre, 
            rfc, 
            telefono, 
            reconstructedCart, 
            subtotal, 
            iva, 
            quoteHeader.total
        );

    } catch (err) {
        alert("Error al descargar PDF: " + err.message);
        console.error(err);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================================
// LÓGICA DEL SLIDER DE PRECIOS (DUAL)
// ==========================================================

// ==========================================================
// LÓGICA DEL SLIDER DE PRECIOS (DUAL Y MANUAL)
// ==========================================================

// ==========================================================
// LÓGICA DEL SLIDER DE PRECIOS (RANGO 3000 Y NUMÉRICO)
// ==========================================================

// ==========================================================
// LÓGICA DEL SLIDER DE PRECIOS (CORREGIDA)
// ==========================================================

function setupPriceSlider() {
    const mockup = document.querySelector('.slider-mockup');
    if (!mockup) return;

    // 1. Configuración
    const minLimit = 0;
    const maxLimit = 3000; // Tope ajustado
    
    let currentMin = pageState.priceRange[0] || minLimit;
    let currentMax = pageState.priceRange[1] || maxLimit;

    // 2. Inyectar HTML del Slider
    mockup.innerHTML = `
        <div class="price-slider-container">
            <div class="slider-track-bg"></div>
            <div class="slider-track-fill" id="track-fill"></div>
            <input type="range" min="${minLimit}" max="${maxLimit}" value="${currentMin}" id="range-min" class="range-input">
            <input type="range" min="${minLimit}" max="${maxLimit}" value="${currentMax}" id="range-max" class="range-input">
        </div>
    `;
    
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const trackFill = document.getElementById('track-fill');
    const inputMinDisplay = document.getElementById('price-min-input');
    const inputMaxDisplay = document.getElementById('price-max-input');
    const gap = 100; 

    // 3. Sincronizar UI
    const updateSliderUI = (fromInput = false) => {
        let minVal = parseInt(rangeMin.value);
        let maxVal = parseInt(rangeMax.value);

        // Validar cruce en el slider
        if (maxVal - minVal < gap && !fromInput) {
            if (event.target === rangeMin) {
                rangeMin.value = maxVal - gap;
                minVal = maxVal - gap;
            } else {
                rangeMax.value = minVal + gap;
                maxVal = minVal + gap;
            }
        }

        // Pintar barra
        const percent1 = (minVal / maxLimit) * 100;
        const percent2 = (maxVal / maxLimit) * 100;
        trackFill.style.left = percent1 + "%";
        trackFill.style.width = (percent2 - percent1) + "%";

        // --- CORRECCIÓN CRÍTICA AQUÍ ---
        // Solo asignamos NÚMEROS a los inputs type="number"
        if (!fromInput) {
            if (inputMinDisplay) inputMinDisplay.value = minVal;
            if (inputMaxDisplay) inputMaxDisplay.value = maxVal;
        }

        pageState.priceRange = [minVal, maxVal];
    };

    // 4. Trigger de búsqueda
    let timeout;
    const triggerSearch = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            console.log("💰 Filtrando por precio:", pageState.priceRange);
            pageState.currentPage = 1;
            updateProductList();
        }, 500);
    };

    // 5. Eventos Slider
    rangeMin.addEventListener('input', () => { updateSliderUI(); triggerSearch(); });
    rangeMax.addEventListener('input', () => { updateSliderUI(); triggerSearch(); });

    // 6. Eventos Inputs Manuales
    if (inputMinDisplay) {
        inputMinDisplay.addEventListener('change', (e) => {
            let val = parseInt(e.target.value) || minLimit;
            // Validaciones
            if (val < minLimit) val = minLimit;
            if (val > parseInt(rangeMax.value) - gap) val = parseInt(rangeMax.value) - gap;
            
            rangeMin.value = val;
            e.target.value = val; // Asegura que el input refleje el valor corregido
            updateSliderUI(true);
            triggerSearch();
        });
    }

    if (inputMaxDisplay) {
        inputMaxDisplay.addEventListener('change', (e) => {
            let val = parseInt(e.target.value) || maxLimit;
            // Validaciones
            if (val > maxLimit) val = maxLimit;
            if (val < parseInt(rangeMin.value) + gap) val = parseInt(rangeMin.value) + gap;

            rangeMax.value = val;
            e.target.value = val;
            updateSliderUI(true);
            triggerSearch();
        });
    }

    updateSliderUI();
}


// ==========================================================
// LÓGICA DE ORDENAMIENTO (ORDENAR POR...)
// ==========================================================

function setupSortLogic() {
    const sortSelect = document.getElementById('order-by');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        console.log("🔄 Cambiando orden a:", value);

        switch (value) {
            case 'name-asc':
                pageState.orderBy = 'descripcion'; // Nombre de tu columna en BD
                pageState.ascending = true;
                break;
            case 'name-desc':
                pageState.orderBy = 'descripcion';
                pageState.ascending = false;
                break;
            case 'price-min':
                pageState.orderBy = 'precio';
                pageState.ascending = true;
                break;
            case 'price-max':
                pageState.orderBy = 'precio';
                pageState.ascending = false;
                break;
            default:
                // Por defecto (ej: relevancia o nombre)
                pageState.orderBy = 'descripcion';
                pageState.ascending = true;
        }

        // Reiniciamos a página 1 y recargamos
        pageState.currentPage = 1;
        updateProductList();
    });
}
// ==========================================================
// LÓGICA DEL BUSCADOR INTELIGENTE (AUTOCOMPLETE)
// ==========================================================

function setupSearchLogic() {
    const searchInput = document.getElementById('main-search-input');
    const searchBtn = document.getElementById('main-search-btn');
    
    // Si no existen (ej: estamos cargando el header), no hacemos nada
    if (!searchInput || !searchBtn) return;

    // 1. Crear el contenedor de sugerencias dinámicamente
    let suggestionsBox = document.createElement('div');
    suggestionsBox.className = 'search-suggestions';
    searchInput.parentNode.appendChild(suggestionsBox); // Lo metemos dentro de .search-bar

    // --- FUNCIONES INTERNAS ---

    // A. Ir a la página de resultados
    const performSearch = (term) => {
        if (!term.trim()) return;
        // Redirigimos al buscador con el parámetro 'q'
        window.location.href = `pagina-15-buscador.html?search=${encodeURIComponent(term.trim())}`;
    };

    // B. Buscar sugerencias en Supabase
    const fetchSuggestions = async (term) => {
        if (term.length < 2) { // Mínimo 2 letras para buscar
            suggestionsBox.style.display = 'none';
            return;
        }

        // Buscamos productos que coincidan (insensible a mayúsculas con ilike)
        const { data: products, error } = await supabase
            .from('productos_web')
            .select('sku, descripcion, precio, imagen_url')
            .ilike('descripcion', `%${term}%`) 
            .gt('stock', 0) // Solo productos con stock
            .limit(5); // Máximo 5 sugerencias

        if (error || !products || products.length === 0) {
            suggestionsBox.style.display = 'none';
            return;
        }

        renderSuggestions(products);
    };

    // C. Mostrar las sugerencias en HTML
    const renderSuggestions = (products) => {
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'block';

        products.forEach(prod => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            // Imagen segura
            let img = prod.imagen_url && prod.imagen_url.startsWith('http') ? prod.imagen_url : 'img/papeleria.jpg';

            div.innerHTML = `
                <img src="${img}" class="suggestion-thumb" alt="">
                <div class="suggestion-info">
                    <span class="suggestion-name">${prod.descripcion}</span>
                    <span class="suggestion-price">$${prod.precio.toFixed(2)}</span>
                </div>
            `;

            // Al hacer clic en una sugerencia, vamos directo al producto
            div.addEventListener('click', () => {
                window.location.href = `pagina-10-detalle.html?id=${prod.sku}`;
            });

            suggestionsBox.appendChild(div);
        });
    };

    // --- EVENTOS ---

    // 1. Detectar escritura (con Debounce para no saturar)
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        const term = e.target.value;
        
        // Esperamos 300ms antes de buscar
        timeout = setTimeout(() => {
            fetchSuggestions(term);
        }, 300);
    });

    // 2. Detectar Enter para buscar
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(searchInput.value);
            suggestionsBox.style.display = 'none';
        }
    });

    // 3. Detectar clic en la lupa
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch(searchInput.value);
    });

    // 4. Ocultar sugerencias si haces clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });
}

// ==========================================================
// 6. BLOQUE DE ARRANQUE (¡LO QUE FALTABA!)
// ==========================================================
// ==========================================================
// 6. BLOQUE DE ARRANQUE (¡CON INYECCIÓN DE HEADER/FOOTER!)
// ==========================================================

async function loadSharedComponents() {
    try {
        // 1. Cargar Header
        const headerContainer = document.getElementById('global-header');
        if (headerContainer) {
            const response = await fetch('header.html');
            if (response.ok) headerContainer.innerHTML = await response.text();
        }

        // 2. Cargar Footer
        const footerContainer = document.getElementById('global-footer');
        if (footerContainer) {
            const response = await fetch('footer.html');
            if (response.ok) footerContainer.innerHTML = await response.text();
        }

        // 3. Cargar Sidebar (Carrito) - ¡NUEVO!
        const sidebarContainer = document.getElementById('global-sidebar');
        if (sidebarContainer) {
            const response = await fetch('sidebar.html');
            if (response.ok) sidebarContainer.innerHTML = await response.text();
        }

    } catch (error) {
        console.error("Error cargando componentes compartidos:", error);
    }
}

// INICIO DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Iniciando aplicación...");

    // 1. PRIMERO: Inyectamos Header y Footer (Espera a que termine)
    await loadSharedComponents();
    console.log("✅ Header y Footer cargados.");

    // 2. AHORA SÍ: Ejecutamos la lógica que depende del Header
    // (Porque ahora los botones y menús ya existen en el HTML)
    // --- AQUÍ CONECTAMOS EL BUSCADOR (NUEVO) ---
    setupSearchLogic();
    // Revisar usuario logueado
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUserID = user.id;
        console.log("👤 Usuario detectado:", user.email);
    }
    updateHeaderUI(user);
    
    // Cargar menú desplegable
    populateHeaderDropdown();
    updateCartIconCount(); // Actualizar el numerito del carrito

    // --- CONECTAR EVENTOS DEL HEADER Y SIDEBAR ---
    const cartIcon = document.getElementById('cart-icon');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const overlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.getElementById('checkout-sidebar-btn');

    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault(); 
            toggleCartSidebar(true);
        });
    }
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCartSidebar(false));
    if (overlay) overlay.addEventListener('click', () => toggleCartSidebar(false));
    if (checkoutBtn) checkoutBtn.addEventListener('click', () => window.location.href = 'carrito.html');


    // 3. DETECTOR DE PÁGINAS (Lógica específica de cada vista)
    
    // A. INICIO
    const bestsellersGrid = document.getElementById('bestsellers-grid');
    if (bestsellersGrid) {
        console.log("🏠 Página de Inicio.");
        await loadBestsellers();
        await loadCategoriesFromDB();
    }

    // B. CATÁLOGO / BUSCADOR
    const listingGrid = document.getElementById('product-listing-grid');
    if (listingGrid) {
        console.log("📂 Catálogo detectado.");
        
        // 1. PRIMERO: Cargamos los filtros (crea los checkboxes en el HTML)
        await loadFilters(); 
        setupPriceSlider();
        setupSortLogic();
        
        const params = getUrlParams();
        const pageTitle = document.querySelector('.section-title');
        
        // 2. SEGUNDO: Procesamos la URL y actualizamos el ESTADO
        if (params.subId) {
            const subId = parseInt(params.subId);
            
            // TRUCO: Metemos el ID en el array de filtros manuales
            // Así el sistema piensa que el usuario le dio clic al checkbox
            pageState.selectedSubcategories = [subId]; 
            pageState.selectedCategories = []; 
            pageState.currentSubcategoryId = null; // Limpiamos el legacy para evitar conflictos

            if(pageTitle) pageTitle.textContent = params.title ? decodeURIComponent(params.title) : "Subcategoría";
        } 
        else if (params.category) {
            const catName = decodeURIComponent(params.category);
            
            pageState.selectedCategories = [catName];
            pageState.selectedSubcategories = [];
            pageState.currentSubcategoryId = null;
            
            if(pageTitle) pageTitle.textContent = catName;
        } 
        else if (params.search) {
            pageState.searchTerm = params.search;
            if(pageTitle) pageTitle.textContent = `Resultados: "${params.search}"`;
        }

        // 3. TERCERO (¡LA SOLUCIÓN!): Sincronizamos visualmente los checkboxes
        // Ahora que pageState tiene datos, le decimos a los inputs que se marquen
        
        // A. Marcar Categorías
        document.querySelectorAll('.cat-checkbox').forEach(cb => {
            if (pageState.selectedCategories.includes(cb.value)) {
                cb.checked = true;
                // Opcional: Abrir el acordeón si lo tuvieras colapsado
            }
        });

        // B. Marcar Subcategorías
        document.querySelectorAll('.sub-checkbox').forEach(cb => {
            // El value del checkbox es string, el estado es número
            if (pageState.selectedSubcategories.includes(parseInt(cb.value))) {
                cb.checked = true;
            }
        });
// --- NUEVO: OCULTAR SUBCATEGORÍAS IRRELEVANTES AL INICIO ---
        // Esto asegura que si entré a "Papelería", no vea opciones de zapatos
        syncSubcategoriesVisibility();

        // 4. Finalmente buscamos los productos
        await updateProductList();
    }

    // C. DETALLE PRODUCTO
    const detailTitle = document.getElementById('dynamic-page-title');
    const currentParams = getUrlParams();
    if (detailTitle && currentParams.id) {
        console.log("🔍 Vista de Detalle.");
        const product = await fetchProductDetail(currentParams.id);
        renderProductDetail(product);
        // ... Lógica de botones de detalle ...
    }

    // ... dentro del DOMContentLoaded (al final del archivo) ...

    // D. CARRITO
    const cartList = document.getElementById('cart-item-list');
    if (cartList) {
        // --- CAMBIO CLAVE: CONECTAMOS LOS EVENTOS DELEGADOS SÓLO AQUÍ ---
        setupCartEvents();
        // -----------------------------------------------------------------
        
        renderCartPage(); // Ahora esta función solo dibuja el contenido
        setupQuotationButton(!!user);
    }
    
// ...

    // E. LOGIN / REGISTRO
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const registerForm = document.getElementById('register-form'); 
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // --- NUEVO: Botón del Modal de Verificación ---
    const closeVerifyBtn = document.getElementById('close-verify-btn');
    if (closeVerifyBtn) {
        closeVerifyBtn.addEventListener('click', () => {
            // Ocultar modal e ir al login
            document.getElementById('verify-email-modal').style.display = 'none';
            window.location.href = 'login.html';
        });
    }

    // F. PERFIL
    const profileContainer = document.getElementById('profile-container');
    if (profileContainer) {
        if (user) {
            await initializeProfilePage();
            await loadQuoteHistory();
            // ... Lógica de logout ...
            const logoutBtn = document.getElementById('logout-btn');
            if(logoutBtn) logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('logout-modal').style.display = 'flex';
            });
            // Conectar botones del modal...
            document.getElementById('cancel-logout-btn')?.addEventListener('click', () => document.getElementById('logout-modal').style.display = 'none');
            document.getElementById('confirm-logout-btn')?.addEventListener('click', async () => await handleLogout());
        } else {
            profileContainer.style.display = 'none';
            document.getElementById('profile-error').style.display = 'block';
        }
    }

    // G. SUBCATEGORÍAS
    const subcategoriesGrid = document.getElementById('subcategories-grid-container');
    if (subcategoriesGrid) {
        await loadSubcategoriesPage();
    }

    // H. PÁGINA DE FAVORITOS
    const favGrid = document.getElementById('favorites-listing-grid');
    if (favGrid) {
        await loadFavoritesPage();
    }

});