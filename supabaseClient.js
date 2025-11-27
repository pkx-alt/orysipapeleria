// supabaseClient.js

// Importamos la librería de Supabase desde la CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// !!! CRÍTICO: REEMPLAZA ESTAS CLAVES CON LAS REALES DEL COMPAÑERO 5 !!!
const SUPABASE_URL = 'https://TU_URL_DE_SUPABASE.supabase.co'; 
const SUPABASE_ANON_KEY = 'TU_CLAVE_ANONIMA_PUBLICA_AQUI'; 

// Inicializa el cliente y lo exporta para ser usado en app.js
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);