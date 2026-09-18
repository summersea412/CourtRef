import { useEffect, useState } from 'react';
import type { Archive } from '../domain/archive';
import { getArchives } from '../services/archiveService';
export function useArchives(){const [archives,setArchives]=useState<Archive[]>([]);const [loading,setLoading]=useState(true);useEffect(()=>{void getArchives().then(setArchives).finally(()=>setLoading(false));},[]);return {archives,loading,setArchives};}
