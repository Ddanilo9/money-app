import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ddreurgdaoopakbxugjg.supabase.co'
const supabaseKey = 'sb_publishable_4B4-JWQpyaSNhksPxCdM2w_B959-09n'

export const supabase = createClient(supabaseUrl, supabaseKey)
