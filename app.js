// app.js - CÓDIGO FINAL CORREGIDO PARA EL ESQUEMA DE SUPABASE

// Importar el cliente de Supabase
import { supabase } from './supabaseClient.js';
import { Auth } from 'https://cdn.jsdelivr.net/npm/@supabase/auth-ui-vanilla/+esm';

// ==========================================================
// 1. CONEXIÓN Y UTILIDADES
// ==========================================================

// Función para leer parámetros de la URL
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        category: urlParams.get('category'),
        subcategory: urlParams.get('subcategory'),
        search: urlParams.get('q') 
    };
}

// ==========================================================
// 2. LÓGICA DE LISTADO Y FILTROS (Persona 3)
// ==========================================================
let pageState = {
    selectedCategories: [],
    selectedSubcategories: [],
    priceRange: [0.00, 150.00],
    orderBy: 'Descripción', // Usamos el nombre real de la columna para ordenar
    ascending: true,
    currentPage: 1,
    baseCategory: null, 
    baseSubcategory: null,
    searchTerm: null
};

// --- FUNCIÓN CENTRAL DE CONSULTA (REAL CON ALIASES) ---
async function fetchProducts(filters, limit = 12) {
    // Usamos ALIASES para mapear los nombres largos/con espacios a nombres amigables (ej. 'nombre')
    const selectFields = `
        id, 
        nombre:Descripción, 
        precio:Precio, 
        stock:Stock, 
        categoria_slug:Categorias, 
        url_imagen: "Url de la imagen"
    `;

    let query = supabase
        .from('productos_web') // USAMOS EL NOMBRE REAL DE LA TABLA
        .select(selectFields, { count: 'exact' });

    // 1. FILTRO DE BÚSQUEDA (textSearch - requiere configuración FTS en Supabase)
    if (filters.searchTerm) {
        query = query.textSearch('fts_column', filters.searchTerm); 
    }

    // 2. FILTRO DINÁMICO (Categoría y Subcategoría)
    if (filters.selectedCategories.length > 0) {
        // Usamos el nombre real de la columna: 'Categorias'
        query = query.in('Categorias', filters.selectedCategories);
    }
    
    // 3. ORDENAMIENTO
    query = query.order(filters.orderBy, { ascending: filters.ascending });

    // 4. PAGINACIÓN
    const start = (filters.currentPage - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);
    
    const { data, error, count } = await query;

    if (error) {
        console.error("Error al obtener productos de Supabase:", error);
        return { data: [], count: 0 };
    }
    // El nombre de la columna ahora es 'url_imagen' gracias al ALIAS.
    return { data, count }; 
}

// Función para renderizar el listado de productos
async function updateProductList() {
    const grid = document.getElementById('product-listing-grid') || document.getElementById('bestsellers-grid') || document.getElementById('favorites-listing-grid');
    if (!grid) return;

    const { data: products } = await fetchProducts(pageState, 12); 
    grid.innerHTML = ''; 

    if (products && products.length > 0) {
        products.forEach(product => {
            const card = document.createElement('a'); 
            card.href = `detalle.html?id=${product.id}`;
            card.className = 'product-card';
            
            // Usamos la propiedad mapeada (url_imagen) para renderizar
            const imageUrl = product.url_imagen || 'https://via.placeholder.com/180/ccc?text=No+Image';

            card.innerHTML = `
                <div class="product-image-mockup" style="background-image: url(${imageUrl});"></div>
                <i class="far fa-heart heart-icon"></i>
                <h3>${product.nombre}</h3>
                <p>${product.descripcion || 'Sin descripción'}</p>
                <p class="product-price">$${product.precio.toFixed(2)} MXN.</p>
                <div class="add-to-cart">
                    <input type="number" value="1" min="1" class="qty-input">
                    <button class="add-btn">Añadir</button>
                </div>
            `;
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<p>No se encontraron productos con los filtros seleccionados.</p>';
    }
}

// ... (Resto de las funciones de Persona 2 y 3: setupFilterEvents, initializeListingPage, etc.) ...

// ==========================================================
// 4. AUTENTICACIÓN Y USUARIO (Persona 4) - CONEXIÓN A CLIENTES_WEB
// ==========================================================

// Inicialización de la página de perfil (Pág 19)
async function initializeProfilePage() {
    // ... (Lógica para obtener la sesión) ...
    
    // 2. Obtener datos de la tabla 'clientes_web' (nombre, telefono)
    const { data: profile, error } = await supabase
        .from('clientes_web') // USAMOS EL NOMBRE REAL DE LA TABLA
        .select('razón_social, teléfono') // USAMOS LOS NOMBRES REALES DE LAS COLUMNAS
        .eq('id', user.id) // ID del usuario autenticado
        .single();
    
    if (!error) {
        // Renderizar datos usando los nombres reales de las columnas
        document.getElementById('profile-name').textContent = profile.razón_social || 'N/A';
        document.getElementById('profile-phone').textContent = profile.teléfono || 'N/A';
    } else {
        console.error("Error al cargar perfil:", error);
    }
    // ... (Resto de la función) ...
}

// Función de Registro (debe insertar en clientes_web al registrarse)
// NOTA: Esta lógica debe ser añadida a tu listener en login.html
async function handleRegister(email, password, fullName, phone) {
    const { user, error } = await supabase.auth.signUp({ email, password });

    if (user) {
        // Insertar datos adicionales en la tabla clientes_web
        await supabase
            .from('clientes_web')
            .insert([
                { 
                    id: user.id, // CRÍTICO: Usar el ID de Supabase Auth
                    razón_social: fullName, 
                    teléfono: phone 
                }
            ]);
    }
}