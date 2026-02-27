import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, './.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '', key = '';
envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function runSQL() {
    const { data: matList, error: checkErr } = await supabase.from('materials').select('*').order('total_stock_m');
    console.log("matList length:", matList?.length);
    if(matList && matList.length > 0) {
        console.log("Sample material:");
        console.log(matList[0]);
        console.log("total_stock_m type:", typeof matList[0].total_stock_m);
        
        const lowMats = matList.filter(m => (m?.total_stock_m || 0) < 10).sort((a, b) => (a?.total_stock_m || 0) - (b?.total_stock_m || 0)).slice(0, 5);
        console.log("Filtered lowMats length:", lowMats.length);
    }
}
runSQL();
