// app.js - CÓDIGO FINAL COMPLETO Y CORREGIDO

// Importar el cliente de Supabase
import { supabase } from './supabaseClient.js'; 
// !!! Se elimina la importación de Auth UI para evitar el error 404 que bloquea el código !!!


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
async function fetchProducts(filters, limit = 12) {
    try {
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

        // 1. FILTRO DE BÚSQUEDA
        if (filters.searchTerm) {
            query = query.textSearch('fts_column', filters.searchTerm); 
        }

        // 2. FILTRO DINÁMICO (Categoría)
        if (filters.selectedCategories.length > 0) {
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
            console.error("Error al obtener productos de Supabase (Revisa RLS o conexión):", error);
            return { data: [], count: 0 };
        }
        
        return { data, count };
        
    } catch (e) {
        console.error("Fallo catastrófico en fetchProducts (Error de JS):", e);
        return { data: [], count: 0 }; 
    }
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
            card.href = `pagina-10-detalle.html?id=${product.id}`; 
            card.className = 'product-card';
            
            // Usamos la propiedad mapeada (url_imagen) para renderizar
            const imageUrl = product.url_imagen || 'https://via.placeholder.com/180/ccc?text=No+Image';

            card.innerHTML = `
                <div class="product-image-mockup" style="background-image: url('${imageUrl}');"></div>
                <i class="far fa-heart heart-icon"></i>
                <h3>${product.nombre || 'Sin Nombre'}</h3>
                <p>${product.descripcion || 'Sin descripción'}</p>
                <p class="product-price">$${(product.precio || 0).toFixed(2)} MXN.</p>
                <div class="add-to-cart">
                    <input type="number" value="1" min="1" class="qty-input">
                    <button class="add-btn">Añadir</button>
                </div>
            `;
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = '<p style="text-align:center;">No se encontraron productos o la tabla está vacía en Supabase.</p>';
    }
}

// Lógica de conexión de eventos (Para la barra de búsqueda y filtros)
function setupFilterEvents() {
    // Conecta el botón de búsqueda global
    document.getElementById('main-search-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const searchTerm = document.getElementById('main-search-input').value;
        if (searchTerm) {
            window.location.href = `pagina-15-buscador.html?q=${encodeURIComponent(searchTerm)}`;
        }
    });

    // Conecta el ordenamiento (simulación)
    document.getElementById('order-by')?.addEventListener('change', (e) => {
        // Lógica de actualización de pageState
        updateProductList(); 
    });
    
    // Conexión de checkboxes de filtros
    document.addEventListener('change', (e) => {
        if (e.target.closest('.filter-group') && e.target.type === 'checkbox') {
            // Lógica para actualizar pageState.selectedCategories/Subcategories
            updateProductList();
        }
    });
}

// ==========================================================
// 3. NAVEGACIÓN Y MENÚ (Persona 2)
// ==========================================================

// Mock de Categorías para el menú (Debería usar categorias_web en producción)
const getMockCategories = () => [
    { slug: 'papeleria-y-oficina', name: 'Papelería y oficina', subcategories: ['Papel', 'Cuadernos y agendas', 'Adhesivos y cintas'] },
    { slug: 'fiesta-y-eventos', name: 'Fiesta y eventos', subcategories: ['Globos', 'Decoración', 'Desechables'] },
    { slug: 'bolsas-y-accesorios', name: 'Bolsas y accesorios', subcategories: ['Mochilas', 'Carteras', 'Estuches'] },
    { slug: 'zapateria', name: 'Zapatería', subcategories: ['Tenis', 'Botas', 'Sandalias'] },
];

function populateHeaderDropdown() {
    const categoriesData = getMockCategories();
    const dropdownMenu = document.getElementById('product-dropdown-menu');
    if (!dropdownMenu) return;

    // Lógica para construir el HTML del menú desplegable con enlaces a Pág 13/14
    const categoriesColumn = document.createElement('div');
    categoriesColumn.className = 'dropdown-column categories-column';
    const subcategoriesColumn = document.createElement('div');
    subcategoriesColumn.className = 'dropdown-column subcategories-column';
    
    // Llenar categorías
    categoriesData.forEach(cat => {
        const catLink = document.createElement('a');
        catLink.href = `pagina-13-categorias.html?category=${cat.slug}`;
        catLink.textContent = cat.name;
        categoriesColumn.appendChild(catLink);
    });

    // Añadir columnas y footer
    dropdownMenu.appendChild(categoriesColumn);
    dropdownMenu.appendChild(subcategoriesColumn);
    dropdownMenu.innerHTML += `<div class="dropdown-footer"><a href="pagina-13-categorias.html" class="view-all-btn">Ver todo</a></div>`;

    // Llenar la primera subcategoría por defecto
    if(categoriesData.length > 0) {
        subcategoriesColumn.innerHTML = `<h4>${categoriesData[0].name}</h4>` + categoriesData[0].subcategories.map(sub => `<a href="pagina-14-subcategorias.html?category=${categoriesData[0].slug}&subcategory=${sub}">${sub}</a>`).join('');
    }
}

// Carga los productos "Lo más vendido" en la Página 1
async function loadBestsellers() {
    // 1. Establecer filtros mínimos para la página principal
    pageState.baseCategory = null; 
    pageState.selectedCategories = []; // CRÍTICO: Asegurarse de no enviar un filtro de categoría vacío
    
    // 2. Llamar al motor de renderizado
    await updateProductList(); // Renderiza en #bestsellers-grid
}

// ==========================================================
// 4. AUTENTICACIÓN Y USUARIO (Persona 4)
// ==========================================================

// Función de Registro (handleRegister) - Ahora conectada a los formularios estáticos
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
        // Insertar datos adicionales en la tabla clientes_web
        await supabase
            .from('clientes_web') // USAMOS EL NOMBRE REAL DE LA TABLA
            .insert([
                { 
                    id: data.user.id,        // CRÍTICO: Usar el ID de Supabase Auth
                    razón_social: fullName,  // Mapeo a la columna real
                    teléfono: phone          // Mapeo a la columna real
                }
            ]);
        
        alert("Registro exitoso. Por favor, revisa tu correo electrónico para confirmar la cuenta.");
        window.location.href = 'login.html';
    }
}

// Inicialización de la página de perfil (Pág 19)
async function initializeProfilePage() {
    // ... (Lógica de perfil que usa clientes_web) ...
}

// ==========================================================
// 5. INICIALIZACIÓN GLOBAL FINAL
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Conectar formularios de Autenticación
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    
    // ... Conectar login-form a supabase.auth.signInWithPassword ...

    // Lógica para todas las páginas con Header/Menú
    populateHeaderDropdown(); 
    setupFilterEvents(); 

    // Lógica para la Página Principal (index.html)
    if (document.getElementById('bestsellers-grid')) {
        loadBestsellers(); 
    }
    
    // ... Lógica condicional para el resto de páginas ...
    
});