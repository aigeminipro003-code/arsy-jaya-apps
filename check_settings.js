import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ambil credential dari .env
const envPath = path.resolve(__dirname, './.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '', key = '';
envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function runSQL() {
    // Sebagai alternatif RPC, karena Anon Key belum tentu punya hak DDL, 
    // Kita coba panggil RPC function atau cek jika tabel ada.
    // Paling reliable: kita arahkan pengguna untuk eksekusi query SQL bila kita tidak punya Service Role Key.
    console.log("Supabase URL: ", url);
    
    // Coba cek tabel app_settings
    const { data: cols, error: checkErr } = await supabase.from('app_settings').select('*').limit(1);
    if(checkErr) { // Tabel tidak ada / RLS block
        console.error("Error/Tabel tidak ditemukan: ", checkErr.message);
        console.log("Membutuhkan DDL SQL Eksekusi");
    } else {
        console.log("Tabel app_settings sudah ada!", cols);
    }
}
runSQL();
