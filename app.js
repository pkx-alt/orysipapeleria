// app.js - CÓDIGO FINAL CORREGIDO PARA EL ESQUEMA DE SUPABASE

// Importar el cliente de Supabase y las librerías necesarias
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
    orderBy: 'Descripción', // Nombre real de la columna para ordenar
    ascending: true,
    currentPage: 1,
    baseCategory: null, 
    baseSubcategory: null,
    searchTerm: null
};

// --- FUNCIÓN CENTRAL DE CONSULTA (REAL CON ALIASES) ---
// Utiliza los nombres de tablas y columnas auditados (productos_web, Descripción, Url de la imagen)
async function fetchProducts(filters, limit = 12) {
    // Definimos los campos que queremos obtener, usando ALIASES para mapear nombres difíciles a nombres amigables (ej. 'nombre')
    const selectFields = `
        id, 
        nombre:Descripción, 
        precio:Precio, 
        stock:Stock, 
        categoria_slug:Categorias, 
        url_imagen: "Url de la imagen"
    `;

    let query = supabase
        .from('productos_web') // USAMOS EL NOMBRE REAL DE LA TABLA: productos_web
        .select(selectFields, { count: 'exact' });

    // 1. FILTRO DE BÚSQUEDA (textSearch)
    if (filters.searchTerm) {
        query = query.textSearch('fts_column', filters.searchTerm); 
    }

    // 2. FILTRO DINÁMICO (Categoría)
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
    // Devolvemos el resultado con los nombres amigables (nombre, url_imagen, etc.)
    return { data, count }; 
}

// Función para renderizar el listado de productos
async function updateProductList() {
    // Identifica el contenedor (bestsellers, listado principal, o favoritos)
    const grid = document.getElementById('product-listing-grid') || document.getElementById('bestsellers-grid') || document.getElementById('favorites-listing-grid');
    if (!grid) return;

    // Obtener datos reales de Supabase (o simulación)
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
                <div class="product-image-mockup" style="background-image: url('${imageUrl}');"></div>
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


// --- Lógica de conexión de eventos, initialization, etc. (Persona 2 y 3) ---
// (Estas funciones deben estar completas en tu archivo, no se repiten aquí por espacio)
// ...

// ==========================================================
// 4. AUTENTICACIÓN Y USUARIO (Persona 4) - CONEXIÓN A CLIENTES_WEB
// ==========================================================

// Función de Registro (Debe usarse en el listener del formulario de registro)
async function handleRegister(email, password, fullName, phone) {
    // 1. Crear el usuario en auth.users
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (data.user) {
        // 2. Insertar datos adicionales en la tabla clientes_web
        await supabase
            .from('clientes_web') // USAMOS EL NOMBRE REAL DE LA TABLA
            .insert([
                { 
                    id: data.user.id,        // CRÍTICO: Usar el ID de Supabase Auth
                    razón_social: fullName,  // Mapeo a la columna real (Nombre completo)
                    teléfono: phone          // Mapeo a la columna real (Teléfono)
                }
            ]);
        return { success: true };
    }
    return { success: false, error };
}

// Inicialización de la página de perfil (Pág 19)
async function initializeProfilePage() {
    const session = await supabase.auth.getSession();
    const user = session.data.session?.user;
    
    if (!user) {
        window.location.href = 'login.html'; 
        return;
    }

    // 2. Obtener datos de la tabla 'clientes_web' (nombre, telefono)
    const { data: profile, error } = await supabase
        .from('clientes_web') // USAMOS EL NOMBRE REAL DE LA TABLA
        .select('razón_social, teléfono') // USAMOS LOS NOMBRES REALES DE LAS COLUMNAS
        .eq('id', user.id)
        .single();
    
    // 3. Renderizar datos
    document.getElementById('profile-email').textContent = user.email;
    if (!error) {
        document.getElementById('profile-name').textContent = profile.razón_social || 'N/A';
        document.getElementById('profile-phone').textContent = profile.teléfono || 'N/A';
    } else {
        console.error("Error al cargar perfil:", error);
    }

    // 4. Conectar botón de Cerrar Sesión
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        const { error: logoutError } = await supabase.auth.signOut();
        if (!logoutError) {
            window.location.href = 'index.html';
        }
    });
}


// ==========================================================
// 5. INICIALIZACIÓN GLOBAL FINAL
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Lógica de Autenticación (si estamos en login/registro)
    // ... (Conexión de los formularios de login.html y registro.html a las funciones de Auth) ...

    // 2. Lógica para todas las páginas con Header/Menú
    populateHeaderDropdown(); 

    // 3. Lógica para las páginas de listado (Pág 13, 14, 15)
    if (document.getElementById('product-listing-grid')) {
        initializeListingPage();
    }
    
    // 4. Lógica para la Página Principal (index.html)
    if (document.getElementById('bestsellers-grid')) {
        loadBestsellers(); 
    }
    
    // 5. Lógica para la página de Perfil (si está activa)
    if (document.getElementById('profile-container')) {
        initializeProfilePage(); 
    }
});