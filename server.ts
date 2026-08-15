import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Safe ESM / CJS resolution
const __filenameSafe = typeof __filename !== 'undefined' ? __filename : process.cwd();
const __dirnameSafe = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filenameSafe);

// Server-side Data Persistence Setup
const PASSWORDS_FILE = path.join(process.cwd(), '.passwords_db.json');
const AGENTS_FILE = path.join(process.cwd(), '.agents_db.json');

// Atomic write helper to prevent partial writes / corruption
function atomicWriteFileSync(filePath: string, content: string) {
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
  try {
    fs.writeFileSync(tempPath, content, 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    throw err;
  }
}

// Normalization & Password Hashing Utilities
function normalizeEmployeeId(id: any): string {
  if (id === null || id === undefined) return '';
  return String(id).trim();
}

function getInitialPassword(matricule: string): string {
  const norm = normalizeEmployeeId(matricule);
  return norm ? 'TP' + norm : '';
}

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `$scrypt$${salt}$${derivedKey}`;
}

function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || !plain) return false;
  if (stored.startsWith('$scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 4) return false;
    const salt = parts[2];
    const hash = parts[3];
    if (!salt || !hash) return false;
    try {
      const derivedHex = crypto.scryptSync(plain, salt, 64).toString('hex');
      const hashBuffer = Buffer.from(hash, 'hex');
      const derivedBuffer = Buffer.from(derivedHex, 'hex');
      if (hashBuffer.length === 0 || hashBuffer.length !== derivedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(derivedBuffer, hashBuffer);
    } catch {
      return false;
    }
  }
  // Plaintext legacy fallback
  return plain === stored;
}

const INITIAL_SERVER_MANAGERS = [
  { id: 'mgr-495', name: 'SABI Prospere', nom: 'SABI', prenom: 'Prospère', matricule: '495', isGlobalAdmin: true },
  { id: 'mgr-218', name: 'YOMEKPE Komlan Agbenyigan', nom: 'YOMEKPE', prenom: 'Komlan Agbenyigan', matricule: '218' },
  { id: 'mgr-391', name: 'HOUENASSOU Sidemeho Akofa', nom: 'HOUENASSOU', prenom: 'Sidemeho Akofa', matricule: '391', isGlobalAdmin: true },
  { id: 'mgr-881', name: 'KPONOOR ZAMAH Goudjo Yao Emile', nom: 'KPONOOR ZAMAH', prenom: 'Goudjo Yao Emile', matricule: '881' },
  { id: 'mgr-1010', name: 'BAHUN-WILSON Adjei Amos Annointed A.', nom: 'BAHUN-WILSON', prenom: 'Adjei Amos Annointed A.', matricule: '1010' },
  { id: 'mgr-563', name: 'AMADOU Fatimatou', nom: 'AMADOU', prenom: 'Fatimatou', matricule: '563' },
];

const INITIAL_SERVER_AGENTS = [
  {
    "id": "agent-17",
    "matricule_rh": "17",
    "nom_complet": "KLU Amepui Elom",
    "prenom": "Amepui Elom",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_elom",
    "email": "lom_elom@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-65",
    "matricule_rh": "65",
    "nom_complet": "HOUNDJAGO Luvossi Mago Nini",
    "prenom": "Luvossi Mago Nini",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_mago",
    "email": "lom_mago@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-278",
    "matricule_rh": "278",
    "nom_complet": "FREITAS JUNIOR KOSSI HORATIO",
    "prenom": "JUNIOR KOSSI HORATIO",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_horatio",
    "email": "lom_horatio@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-322",
    "matricule_rh": "322",
    "nom_complet": "HIHETAH Kokui Délali",
    "prenom": "Kokui Délali",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_kokui",
    "email": "lom_kokui@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-421",
    "matricule_rh": "421",
    "nom_complet": "SENAYA Adjo Genette",
    "prenom": "Adjo Genette",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_senaya",
    "email": "lom_senaya@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-517",
    "matricule_rh": "517",
    "nom_complet": "DOSSEH Yawa Sandrine",
    "prenom": "Yawa Sandrine",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_yawad",
    "email": "lom_yawad@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-551",
    "matricule_rh": "551",
    "nom_complet": "TATRA Aman Emefa",
    "prenom": "Aman Emefa",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_amane",
    "email": "lom_amane@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-552",
    "matricule_rh": "552",
    "nom_complet": "TSATSI Yao Léon",
    "prenom": "Yao Léon",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_leont",
    "email": "lom_leont@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-636",
    "matricule_rh": "636",
    "nom_complet": "AWADE Tetouwalla",
    "prenom": "Tetouwalla",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_wallaa",
    "email": "lom_wallaa@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-694",
    "matricule_rh": "694",
    "nom_complet": "SEDOU Adjo Bilola Vicentia",
    "prenom": "Adjo Bilola Vicentia",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_sedou",
    "email": "lom_sedou@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-768",
    "matricule_rh": "768",
    "nom_complet": "LIGBESSIM Bidalinam",
    "prenom": "Bidalinam",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_bidalinam",
    "email": "lom_bidalinam@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-772",
    "matricule_rh": "772",
    "nom_complet": "SAPARAPA Nihadat",
    "prenom": "Nihadat",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_nihadat",
    "email": "lom_nihadat@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-789",
    "matricule_rh": "789",
    "nom_complet": "DAMESSI Akou Elawoe",
    "prenom": "Akou Elawoe",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_elawoe",
    "email": "lom_elawoe@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-792",
    "matricule_rh": "792",
    "nom_complet": "DZIKPO Adjo Brigitte",
    "prenom": "Adjo Brigitte",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_brigitte",
    "email": "lom_brigitte@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-798",
    "matricule_rh": "798",
    "nom_complet": "GUELEWOUYE Logossi Sidoine",
    "prenom": "Logossi Sidoine",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_sidoine",
    "email": "lom_sidoine@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-870",
    "matricule_rh": "870",
    "nom_complet": "ADENYO Adjo Odile",
    "prenom": "Adjo Odile",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_adenadj",
    "email": "lom_adenadj@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-877",
    "matricule_rh": "877",
    "nom_complet": "DJOSSE Ahovi Gretta",
    "prenom": "Ahovi Gretta",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_djosaho",
    "email": "lom_djosaho@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-878",
    "matricule_rh": "878",
    "nom_complet": "DZESSOU Akoko Francine",
    "prenom": "Akoko Francine",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_dzesako",
    "email": "lom_dzesako@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-879",
    "matricule_rh": "879",
    "nom_complet": "KINGSLEY Elizabeth",
    "prenom": "Elizabeth",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_eliza",
    "email": "lom_eliza@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-898",
    "matricule_rh": "898",
    "nom_complet": "KIFALANG Komivi essolakna",
    "prenom": "Komivi essolakna",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_kifesso",
    "email": "lom_kifesso@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-960",
    "matricule_rh": "960",
    "nom_complet": "FOLLY Folly Gérarld",
    "prenom": "Folly Gérarld",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_foly",
    "email": "lom_foly@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-969",
    "matricule_rh": "969",
    "nom_complet": "ZOSSOU KoKou Elom",
    "prenom": "KoKou Elom",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_kozo",
    "email": "lom_kozo@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1007",
    "matricule_rh": "1007",
    "nom_complet": "AFANOU Inés Tiffany Ablavi",
    "prenom": "Inés Tiffany Ablavi",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_ablanou",
    "email": "lom_ablanou@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1032",
    "matricule_rh": "1032",
    "nom_complet": "GBOGBO Aba Yawa Abigaïl Gloria",
    "prenom": "Aba Yawa Abigaïl Gloria",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_gboya",
    "email": "lom_gboya@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1036",
    "matricule_rh": "1036",
    "nom_complet": "PEKEMSI Edmond Eyana",
    "prenom": "Edmond Eyana",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_kemsi",
    "email": "lom_kemsi@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1132",
    "matricule_rh": "1132",
    "nom_complet": "NTSUYIBOE Joanita",
    "prenom": "Joanita",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_boe",
    "email": "lom_boe@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1158",
    "matricule_rh": "1158",
    "nom_complet": "GAVITSE Michel",
    "prenom": "Michel",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_miche",
    "email": "lom_miche@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1163",
    "matricule_rh": "1163",
    "nom_complet": "TATOUNOU Shalom",
    "prenom": "Shalom",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_tatou",
    "email": "lom_tatou@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1647",
    "matricule_rh": "1647",
    "nom_complet": "BELEYI Pizem Aline",
    "prenom": "Pizem Aline",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_pizem",
    "email": "lom_pizem@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1659",
    "matricule_rh": "1659",
    "nom_complet": "EKLOU Abla Romaine",
    "prenom": "Abla Romaine",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_romaine",
    "email": "lom_romaine@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1691",
    "matricule_rh": "1691",
    "nom_complet": "HATTA Dessa'ana Maxime",
    "prenom": "Dessa'ana Maxime",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_dessana",
    "email": "lom_dessana@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1714",
    "matricule_rh": "1714",
    "nom_complet": "Amavi Kodjo Rémi",
    "prenom": "Kodjo Rémi",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_remi",
    "email": "lom_remi@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1741",
    "matricule_rh": "1741",
    "nom_complet": "ADJOGUENU Yawoa Beatrice Djifa",
    "prenom": "Yawoa Beatrice Djifa",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_bea",
    "email": "lom_bea@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1743",
    "matricule_rh": "1743",
    "nom_complet": "AMOUZOU Yawa Emmanuela",
    "prenom": "Yawa Emmanuela",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_manuela",
    "email": "lom_manuela@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1744",
    "matricule_rh": "1744",
    "nom_complet": "ANAGO Komi Horacio",
    "prenom": "Komi Horacio",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_ana",
    "email": "lom_ana@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1748",
    "matricule_rh": "1748",
    "nom_complet": "HOUNOU Têko José Daryl",
    "prenom": "Têko José Daryl",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_daryl",
    "email": "lom_daryl@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1751",
    "matricule_rh": "1751",
    "nom_complet": "NYAHENO Amivi Déladem",
    "prenom": "Amivi Déladem",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_deladem",
    "email": "lom_deladem@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1752",
    "matricule_rh": "1752",
    "nom_complet": "NYAVOR Koukou There",
    "prenom": "Koukou There",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_there",
    "email": "lom_there@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1753",
    "matricule_rh": "1753",
    "nom_complet": "OUADJA Niko Diane",
    "prenom": "Niko Diane",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_diana",
    "email": "lom_diana@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1754",
    "matricule_rh": "1754",
    "nom_complet": "TOGBETSE Yawa Venunye",
    "prenom": "Yawa Venunye",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_venunye",
    "email": "lom_venunye@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1767",
    "matricule_rh": "1767",
    "nom_complet": "COCO Abla Bertille-Sandrine",
    "prenom": "Abla Bertille-Sandrine",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_bertille",
    "email": "lom_bertille@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1768",
    "matricule_rh": "1768",
    "nom_complet": "DOLAYI Denke Renaud Kodjo",
    "prenom": "Denke Renaud Kodjo",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_denke",
    "email": "lom_denke@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1772",
    "matricule_rh": "1772",
    "nom_complet": "ANANIVI Jean-Christian Martinien",
    "prenom": "Jean-Christian Martinien",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_martinien",
    "email": "lom_martinien@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1779",
    "matricule_rh": "1779",
    "nom_complet": "AHADJI Akouavi Essenam",
    "prenom": "Akouavi Essenam",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_esenam",
    "email": "lom_esenam@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1780",
    "matricule_rh": "1780",
    "nom_complet": "AMEYAPOH Emmanuel Kodjo",
    "prenom": "Emmanuel Kodjo",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_manu",
    "email": "lom_manu@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1786",
    "matricule_rh": "1786",
    "nom_complet": "RAMANOU Kalaide Joseph Gnimdou",
    "prenom": "Kalaide Joseph Gnimdou",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_jo",
    "email": "lom_jo@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1814",
    "matricule_rh": "1814",
    "nom_complet": "TOUGAN Djiedjom Gilles",
    "prenom": "Djiedjom Gilles",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_gill",
    "email": "lom_gill@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1854",
    "matricule_rh": "1854",
    "nom_complet": "AFANGNAKOSSOU Kossi Carlos Clarck",
    "prenom": "Kossi Carlos Clarck",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_clarck",
    "email": "lom_clarck@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1859",
    "matricule_rh": "1859",
    "nom_complet": "BOTOBAWI Patawanam",
    "prenom": "Patawanam",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_patawanam",
    "email": "lom_patawanam@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1860",
    "matricule_rh": "1860",
    "nom_complet": "KOMLANVI Marie-Jessica Akouvi",
    "prenom": "Marie-Jessica Akouvi",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_jess",
    "email": "lom_jess@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1862",
    "matricule_rh": "1862",
    "nom_complet": "SOGBALI Elom Fernando Romuald",
    "prenom": "Elom Fernando Romuald",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_romuald",
    "email": "lom_romuald@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1863",
    "matricule_rh": "1863",
    "nom_complet": "YAKE Calice Bidema",
    "prenom": "Calice Bidema",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_calice",
    "email": "lom_calice@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1847",
    "matricule_rh": "1847",
    "nom_complet": "KOFFI Banabia Marguerite Gloria Dédé",
    "prenom": "Banabia Marguerite Gloria Dédé",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_marguerite",
    "email": "lom_marguerite@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1892",
    "matricule_rh": "1892",
    "nom_complet": "OLOUDE Tony-Mike",
    "prenom": "Tony-Mike",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_mike",
    "email": "lom_mike@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1905",
    "matricule_rh": "1905",
    "nom_complet": "MIHAMI Koffi Philippe",
    "prenom": "Koffi Philippe",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_philippe",
    "email": "lom_philippe@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2158",
    "matricule_rh": "2158",
    "nom_complet": "LAWSON Anoko Maude Victoire",
    "prenom": "Anoko Maude Victoire",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_maude",
    "email": "lom_maude@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2159",
    "matricule_rh": "2159",
    "nom_complet": "LAWSON-DRACKEY Koko Ornella Marie-José",
    "prenom": "Koko Ornella Marie-José",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_drackey",
    "email": "lom_drackey@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2160",
    "matricule_rh": "2160",
    "nom_complet": "AYIKA Ekoue Godwin",
    "prenom": "Ekoue Godwin",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_god",
    "email": "lom_god@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2161",
    "matricule_rh": "2161",
    "nom_complet": "SELODE Akossiwa Pascaline",
    "prenom": "Akossiwa Pascaline",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_pascaline",
    "email": "lom_pascaline@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2167",
    "matricule_rh": "2167",
    "nom_complet": "AGBAHOU Mario Kossi",
    "prenom": "Mario Kossi",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_marko",
    "email": "lom_marko@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2168",
    "matricule_rh": "2168",
    "nom_complet": "LAWSON Sibi Lolita",
    "prenom": "Sibi Lolita",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_sibita",
    "email": "lom_sibita@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-799",
    "matricule_rh": "799",
    "nom_complet": "HOUEDJAGBAGBA Komlan Mawuko Clément",
    "prenom": "Komlan Mawuko Clément",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_gbagba",
    "email": "lom_gbagba@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2173",
    "matricule_rh": "2173",
    "nom_complet": "AGBESSITONOU Regis Cedric",
    "prenom": "Regis Cedric",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_regis",
    "email": "lom_regis@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2177",
    "matricule_rh": "2177",
    "nom_complet": "GANKUI Marie-josé",
    "prenom": "Marie-josé",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_marijo",
    "email": "lom_marijo@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2178",
    "matricule_rh": "2178",
    "nom_complet": "KIDIKOUNE Emma",
    "prenom": "Emma",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_emma",
    "email": "lom_emma@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2179",
    "matricule_rh": "2179",
    "nom_complet": "KOURA Rihanatou",
    "prenom": "Rihanatou",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_rihana",
    "email": "lom_rihana@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2181",
    "matricule_rh": "2181",
    "nom_complet": "AMEGBOH-CLOUSSE Gerard Ferrer Mawuko",
    "prenom": "Gerard Ferrer Mawuko",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_ferrer",
    "email": "lom_ferrer@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2183",
    "matricule_rh": "2183",
    "nom_complet": "DZOKPE Afi Eyram Madeleine",
    "prenom": "Afi Eyram Madeleine",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_madou",
    "email": "lom_madou@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2184",
    "matricule_rh": "2184",
    "nom_complet": "P'KLA Abdoul quddousse steven gnimdou",
    "prenom": "Abdoul quddousse steven gnimdou",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_douss",
    "email": "lom_douss@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-467",
    "matricule_rh": "467",
    "nom_complet": "EKOUE Olivia Elise",
    "prenom": "Olivia Elise",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_olivia",
    "email": "lom_olivia@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2342",
    "matricule_rh": "2342",
    "nom_complet": "AKAKPO Koffi Arsène",
    "prenom": "Koffi Arsène",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_arsene",
    "email": "lom_arsene@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2343",
    "matricule_rh": "2343",
    "nom_complet": "AMELESSESSI Afi Marie-Hervé",
    "prenom": "Afi Marie-Hervé",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_amarie",
    "email": "lom_amarie@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2345",
    "matricule_rh": "2345",
    "nom_complet": "AYENA Abla",
    "prenom": "Abla",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_ayena",
    "email": "lom_ayena@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2346",
    "matricule_rh": "2346",
    "nom_complet": "AMESSE Dénise",
    "prenom": "Dénise",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_denise",
    "email": "lom_denise@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2347",
    "matricule_rh": "2347",
    "nom_complet": "AZANLEDJI Kokou Boniface",
    "prenom": "Kokou Boniface",
    "manager_name": "SABI Prospere",
    "log_activite": "lom_boniface",
    "email": "lom_boniface@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2350",
    "matricule_rh": "2350",
    "nom_complet": "HILIM Carine",
    "prenom": "Carine",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_carine",
    "email": "lom_carine@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2352",
    "matricule_rh": "2352",
    "nom_complet": "LAWSON HOINKA-MABOU Laté Franck-Olivier Benjamin",
    "prenom": "HOINKA-MABOU Laté Franck-Olivier Benjamin",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_benjamin",
    "email": "lom_benjamin@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2355",
    "matricule_rh": "2355",
    "nom_complet": "TCHINLIEK Yendoula",
    "prenom": "Yendoula",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_yendoula",
    "email": "lom_yendoula@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-1658",
    "matricule_rh": "1658",
    "nom_complet": "DOSSAH Ayewanu Abel",
    "prenom": "Ayewanu Abel",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_ayewanu",
    "email": "lom_ayewanu@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2459",
    "matricule_rh": "2459",
    "nom_complet": "Abalo Eunice Abigayle Donssi",
    "prenom": "Eunice Abigayle Donssi",
    "manager_name": "YOMEKPE Komlan Agbenyigan",
    "log_activite": "lom_abigayle",
    "email": "lom_abigayle@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2462",
    "matricule_rh": "2462",
    "nom_complet": "DAKU Abla Nelly",
    "prenom": "Abla Nelly",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_nelly",
    "email": "lom_nelly@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2463",
    "matricule_rh": "2463",
    "nom_complet": "DJANKALE Abattan Kéboukou",
    "prenom": "Abattan Kéboukou",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_keboukou",
    "email": "lom_keboukou@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2464",
    "matricule_rh": "2464",
    "nom_complet": "EKLO Amoussula Yao",
    "prenom": "Amoussula Yao",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_eklo",
    "email": "lom_eklo@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2465",
    "matricule_rh": "2465",
    "nom_complet": "ISSIFOU Simia Limata",
    "prenom": "Simia Limata",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_limata",
    "email": "lom_limata@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2468",
    "matricule_rh": "2468",
    "nom_complet": "SABY-KEKELE Rachida",
    "prenom": "Rachida",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_rachida",
    "email": "lom_rachida@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2516",
    "matricule_rh": "2516",
    "nom_complet": "KUEVI Ekue Pascal Eli",
    "prenom": "Ekue Pascal Eli",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_kuevi",
    "email": "lom_kuevi@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2582",
    "matricule_rh": "2582",
    "nom_complet": "AFANOU Akouvi Manavi Simone",
    "prenom": "Akouvi Manavi Simone",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_simone",
    "email": "lom_simone@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2583",
    "matricule_rh": "2583",
    "nom_complet": "Akakpo Adjo Rose",
    "prenom": "Adjo Rose",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_rose",
    "email": "lom_rose@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2585",
    "matricule_rh": "2585",
    "nom_complet": "AMOUZOU Koudjo Honoré",
    "prenom": "Koudjo Honoré",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_honore",
    "email": "lom_honore@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2171",
    "matricule_rh": "2171",
    "nom_complet": "BADASSOU Afi Ira",
    "prenom": "Afi Ira",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_ira",
    "email": "lom_ira@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2349",
    "matricule_rh": "2349",
    "nom_complet": "GADU Komi Pascal",
    "prenom": "Komi Pascal",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_pascal",
    "email": "lom_pascal@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2351",
    "matricule_rh": "2351",
    "nom_complet": "KOUNTA Abravi Aïcha",
    "prenom": "Abravi Aïcha",
    "manager_name": "KPONOOR ZAMAH Goudjo Yao Emile",
    "log_activite": "lom_kounta",
    "email": "lom_kounta@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2354",
    "matricule_rh": "2354",
    "nom_complet": "N'BIBA Napo",
    "prenom": "Napo",
    "manager_name": "HOUENASSOU Sidemeho Akofa",
    "log_activite": "lom_nabi",
    "email": "lom_nabi@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  },
  {
    "id": "agent-2461",
    "matricule_rh": "2461",
    "nom_complet": "AMANA Hèzouwè",
    "prenom": "Hèzouwè",
    "manager_name": "BAHUN-WILSON Adjei Amos Annointed A.",
    "log_activite": "lom_ama",
    "email": "lom_ama@amazon-support.com",
    "premier_login": true,
    "anciennete": "+ 3 mois",
    "statut": "actif",
    "role": "agent"
  }
];

function loadPersistedPasswords(): Record<string, string> {
  if (fs.existsSync(PASSWORDS_FILE)) {
    try {
      const content = fs.readFileSync(PASSWORDS_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('CRITICAL: Failed to load or parse persisted passwords:', err);
      throw new Error('Database error: .passwords_db.json is corrupted or unreadable.');
    }
  }
  return {};
}

function savePersistedPasswordsBatch(identifiers: string[], newPass: string) {
  const db = loadPersistedPasswords();
  for (const id of identifiers) {
    if (id) {
      db[String(id).toLowerCase()] = newPass;
    }
  }
  atomicWriteFileSync(PASSWORDS_FILE, JSON.stringify(db, null, 2));
}

function savePersistedPassword(userIdOrMatricule: string, newPass: string) {
  savePersistedPasswordsBatch([userIdOrMatricule], newPass);
}

function loadPersistedAgents(): any[] {
  if (fs.existsSync(AGENTS_FILE)) {
    try {
      const content = fs.readFileSync(AGENTS_FILE, 'utf-8');
      const stored = JSON.parse(content);
      if (Array.isArray(stored)) {
        return stored;
      }
      throw new Error('Agents file content is not an array.');
    } catch (err) {
      console.error('CRITICAL: Failed to load or parse persisted agents:', err);
      throw new Error('Database error: .agents_db.json is corrupted or unreadable.');
    }
  }
  // Save initial default agents if file does not exist
  try {
    atomicWriteFileSync(AGENTS_FILE, JSON.stringify(INITIAL_SERVER_AGENTS, null, 2));
  } catch (err) {
    console.error('Error saving initial agents:', err);
    throw err;
  }
  return INITIAL_SERVER_AGENTS;
}

function savePersistedAgents(agents: any[]) {
  atomicWriteFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2));
}

// Active Sessions Store
const ACTIVE_SESSIONS = new Map<string, { user: any; createdAt: number }>();

function createSession(user: any): string {
  const token = 'sess_' + crypto.randomBytes(32).toString('hex');
  ACTIVE_SESSIONS.set(token, { user, createdAt: Date.now() });
  return token;
}

function getSessionUser(token: string | undefined | null): any | null {
  if (!token) return null;
  const sess = ACTIVE_SESSIONS.get(token);
  if (!sess) return null;
  // Session TTL: 24 hours
  if (Date.now() - sess.createdAt > 24 * 60 * 60 * 1000) {
    ACTIVE_SESSIONS.delete(token);
    return null;
  }
  return sess.user;
}

function extractTokenFromReq(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-session-token'];
  if (typeof customHeader === 'string') {
    return customHeader.trim();
  }
  return null;
}

// Session Validation Middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extractTokenFromReq(req);
  const sessionUser = getSessionUser(token);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Session non valide ou expirée. Veuillez vous reconnecter.' });
  }
  (req as any).user = sessionUser;
  next();
}

// Manager/Admin Authorization Middleware
function requireManagerAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Accès refusé. Privilèges manager requis.' });
    }
    next();
  });
}

const app = express();
const PORT = 3000;

// Security Hardening Middleware
app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// API Rate Limiting Middleware for AI Endpoints
const AI_RATE_LIMITS: Record<string, { count: number; resetAt: number }> = {};

function rateLimitAiEndpoint(maxRequests = 20, windowMs = 60 * 1000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const userLimit = AI_RATE_LIMITS[ip] || { count: 0, resetAt: now + windowMs };

    if (now > userLimit.resetAt) {
      userLimit.count = 0;
      userLimit.resetAt = now + windowMs;
    }

    userLimit.count += 1;
    AI_RATE_LIMITS[ip] = userLimit;

    if (userLimit.count > maxRequests) {
      return res.status(429).json({
        error: 'Trop de requêtes vers l\'assistant IA. Veuillez patienter un instant.',
      });
    }
    next();
  };
}

// Lazy Google GenAI initializer
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API GEMINI_API_KEY non configurée.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper with retries and fallback models for transient 503 / UNAVAILABLE / Rate Limit spikes
async function generateContentWithRetry(ai: any, params: any, maxRetries = 2): Promise<any> {
  let lastError: any = null;
  const requestedModel = params.model || 'gemini-3.6-flash';
  const modelsToTry = [requestedModel];
  if (requestedModel !== 'gemini-2.5-flash') modelsToTry.push('gemini-2.5-flash');
  if (requestedModel !== 'gemini-flash-latest') modelsToTry.push('gemini-flash-latest');

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        const isTransient =
          errStr.includes('503') ||
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('high demand') ||
          errStr.includes('429') ||
          errStr.includes('RESOURCE_EXHAUSTED') ||
          errStr.includes('Overloaded');

        if (isTransient && attempt < maxRetries) {
          const delay = (attempt + 1) * 600;
          console.warn(`[GEMINI RETRY] Attempt ${attempt + 1} for ${modelName} failed (${errStr}). Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

// Health API
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Rate limiting store for login endpoint
const LOGIN_ATTEMPTS: Record<string, { count: number; lockoutUntil: number }> = {};

// Session Verification API Endpoint
app.get('/api/auth/verify', (req, res) => {
  const token = extractTokenFromReq(req);
  const sessionUser = getSessionUser(token);
  if (!sessionUser) {
    return res.status(401).json({ valid: false, error: 'Session non valide ou expirée.' });
  }
  return res.json({ valid: true, user: sessionUser });
});

// Secure Authentication API Endpoint (Server as single source of truth - NO clientAgents allowed)
app.post('/api/auth/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const attempt = LOGIN_ATTEMPTS[ip] || { count: 0, lockoutUntil: 0 };

  if (attempt.lockoutUntil > now) {
    const remainingSecs = Math.ceil((attempt.lockoutUntil - now) / 1000);
    return res.status(429).json({
      error: `Trop de tentatives de connexion infructueuses. Veuillez réespérer dans ${remainingSecs} secondes.`,
    });
  }

  const { role, identifier, password } = req.body || {};

  const cleanId = (identifier || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanId || !cleanPass) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
  }

  const idLower = cleanId.toLowerCase();

  const recordFailedAttempt = () => {
    const current = LOGIN_ATTEMPTS[ip] || { count: 0, lockoutUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockoutUntil = Date.now() + 60 * 1000; // 1 minute lockout after 5 failures
      current.count = 0;
    }
    LOGIN_ATTEMPTS[ip] = current;
  };

  const recordSuccess = () => {
    delete LOGIN_ATTEMPTS[ip];
  };

  try {
    const dbPasswords = loadPersistedPasswords();

    if (role === 'manager' || role === 'admin') {
      let matchedManager: typeof INITIAL_SERVER_MANAGERS[0] | undefined = undefined;

      if (idLower === 'manager') {
        // "Manager" generic username: match deterministically by exact password
        matchedManager = INITIAL_SERVER_MANAGERS.find((m) => {
          const normMat = normalizeEmployeeId(m.matricule);
          const customPass = dbPasswords[m.id.toLowerCase()] || dbPasswords[normMat.toLowerCase()];
          const defaultPass = getInitialPassword(m.matricule);
          const storedPass = customPass || defaultPass;
          return verifyPassword(cleanPass, storedPass);
        });
      } else {
        // Specific manager username / matricule / name
        matchedManager = INITIAL_SERVER_MANAGERS.find((m) => {
          const normMat = normalizeEmployeeId(m.matricule).toLowerCase();
          const mName = (m.name || '').toLowerCase();
          const mNom = (m.nom || '').toLowerCase();
          const mId = (m.id || '').toLowerCase();

          const isIdMatch =
            normMat === idLower ||
            mName === idLower ||
            mNom === idLower ||
            mId === idLower ||
            ('tp' + normMat) === idLower;

          if (!isIdMatch) return false;

          const customPass = dbPasswords[m.id.toLowerCase()] || dbPasswords[normMat];
          const defaultPass = getInitialPassword(m.matricule);
          const storedPass = customPass || defaultPass;
          return verifyPassword(cleanPass, storedPass);
        });
      }

      if (!matchedManager) {
        recordFailedAttempt();
        return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      }

      recordSuccess();

      const isGlobalAdmin = Boolean(
        matchedManager.isGlobalAdmin ||
        normalizeEmployeeId(matchedManager.matricule) === '495' ||
        normalizeEmployeeId(matchedManager.matricule) === '391'
      );

      const sessionUser = {
        role: 'manager' as const,
        id: matchedManager.id,
        matricule: normalizeEmployeeId(matchedManager.matricule),
        name: matchedManager.name,
        nom: matchedManager.nom,
        prenom: matchedManager.prenom,
        manager_name: matchedManager.name,
        isGlobalAdmin,
        premier_login: false,
      };

      const token = createSession(sessionUser);

      return res.json({
        success: true,
        token,
        user: { ...sessionUser, token },
      });
    } else {
      // Agent Authentication against Server-Persisted Agents
      const serverAgents = loadPersistedAgents();

      const matchedAgent = serverAgents.find((a) => {
        const aMat = normalizeEmployeeId(a.matricule_rh).toLowerCase();
        const aLog = (a.log_activite || '').toLowerCase();
        const aEmail = (a.email || '').toLowerCase();
        const aId = (a.id || '').toLowerCase();
        const aName = (a.nom_complet || '').toLowerCase();

        return (
          aMat === idLower ||
          aLog === idLower ||
          aEmail === idLower ||
          aId === idLower ||
          aName === idLower ||
          ('tp' + aMat) === idLower
        );
      });

      if (!matchedAgent) {
        console.log(`[SECURITY LOG] AUTH_USER_NOT_FOUND: role=agent identifier="${idLower}"`);
        recordFailedAttempt();
        return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      }

      if (matchedAgent.statut === 'inactif' || matchedAgent.statut === 'desactive') {
        console.log(`[SECURITY LOG] AUTH_ACCOUNT_DISABLED: role=agent id="${matchedAgent.id}"`);
        recordFailedAttempt();
        return res.status(401).json({ error: 'Compte désactivé. Veuillez contacter votre manager.' });
      }

      const normMat = normalizeEmployeeId(matchedAgent.matricule_rh);
      const customPass = dbPasswords[matchedAgent.id.toLowerCase()] || dbPasswords[normMat.toLowerCase()];
      const defaultPass = getInitialPassword(matchedAgent.matricule_rh);
      const storedPass = customPass || defaultPass;

      const isMatch = verifyPassword(cleanPass, storedPass);

      if (!isMatch) {
        console.log(`[SECURITY LOG] AUTH_INVALID_PASSWORD: role=agent id="${matchedAgent.id}" matricule="${normMat}"`);
        recordFailedAttempt();
        return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      }

      // Progressive Re-hashing: If verified successfully and stored pass was plaintext, re-hash it!
      if (customPass && !customPass.startsWith('$scrypt$')) {
        const hashedPassword = hashPassword(cleanPass);
        savePersistedPasswordsBatch([matchedAgent.id, normMat], hashedPassword);
      }

      recordSuccess();

      const isFirstLogin = matchedAgent.premier_login ?? false;

      const sessionUser = {
        role: 'agent' as const,
        id: matchedAgent.id,
        matricule: normMat,
        name: matchedAgent.nom_complet,
        prenom: matchedAgent.prenom,
        manager_name: matchedAgent.manager_name,
        premier_login: Boolean(isFirstLogin),
        anciennete: matchedAgent.anciennete,
        log_activite: matchedAgent.log_activite,
      };

      const token = createSession(sessionUser);

      return res.json({
        success: true,
        token,
        user: { ...sessionUser, token },
      });
    }
  } catch (err) {
    console.error('Login database error:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// Logout API Endpoint - Invalidate session on server
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = extractTokenFromReq(req);
  if (token) {
    ACTIVE_SESSIONS.delete(token);
  }
  return res.json({ success: true, message: 'Déconnexion réussie.' });
});

// Change Password API Endpoint
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { id, matricule, newPassword } = req.body || {};
  const cleanPass = (newPassword || '').trim();

  if (!cleanPass || cleanPass.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  const currentUser = (req as any).user;
  const isManagerOrAdmin = currentUser.role === 'manager' || currentUser.role === 'admin';

  let targetId = currentUser.id;
  let targetMatricule = currentUser.matricule;

  if (isManagerOrAdmin && (id || matricule)) {
    // Manager resetting an agent's password
    targetId = id || currentUser.id;
    targetMatricule = matricule || currentUser.matricule;
  } else {
    // Non-manager can ONLY change their own password (IDOR Prevention)
    if ((id && id !== currentUser.id) || (matricule && normalizeEmployeeId(matricule) !== normalizeEmployeeId(currentUser.matricule))) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que votre propre mot de passe.' });
    }
  }

  try {
    const hashedPassword = hashPassword(cleanPass);
    savePersistedPasswordsBatch([targetId, targetMatricule], hashedPassword);

    // Update agent premier_login
    const agents = loadPersistedAgents();
    const agentIdx = agents.findIndex(
      (a) => a.id === targetId || normalizeEmployeeId(a.matricule_rh) === normalizeEmployeeId(targetMatricule)
    );
    if (agentIdx >= 0) {
      // If reset by manager for another agent -> premier_login = true (agent must change it on login)
      // If changed by user themselves -> premier_login = false
      const isResetByManagerForOther = isManagerOrAdmin && targetId !== currentUser.id;
      agents[agentIdx].premier_login = isResetByManagerForOther;
      savePersistedAgents(agents);
    }
    return res.json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    console.error('Error persisting password change:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde du mot de passe.' });
  }
});

// Server Agents API - Sync agents across devices & browsers (Protected)
app.get('/api/agents', requireAuth, (req, res) => {
  const agents = loadPersistedAgents();
  return res.json({ agents });
});

app.post('/api/agents', requireManagerAuth, (req, res) => {
  const body = req.body || {};
  if (!body || (!body.id && !body.matricule_rh)) {
    return res.status(400).json({ error: 'Données agent invalides.' });
  }

  const normMat = normalizeEmployeeId(body.matricule_rh);

  // Mass assignment protection: Allowlist safe fields only
  const safeAgent: Record<string, any> = {
    role: 'agent', // Enforce role
    nom_complet: body.nom_complet || '',
    nom: body.nom || '',
    prenom: body.prenom || '',
    matricule_rh: normMat,
    manager_name: body.manager_name || '',
    contrat: body.contrat || '',
    anciennete: body.anciennete || '',
    log_activite: body.log_activite || '',
    statut: body.statut || 'actif',
    canal: body.canal || '',
    metier: body.metier || '',
    site: body.site || '',
    email: body.email || '',
  };

  const agents = loadPersistedAgents();
  const existingIdx = agents.findIndex(
    (a) => (body.id && a.id === body.id) || (normMat && normalizeEmployeeId(a.matricule_rh) === normMat)
  );

  if (existingIdx >= 0) {
    agents[existingIdx] = {
      ...agents[existingIdx],
      ...safeAgent,
      id: agents[existingIdx].id, // Prevent altering ID
      premier_login: agents[existingIdx].premier_login ?? false,
    };
  } else {
    const newId = body.id || `agent-${normMat || Date.now()}`;
    agents.push({
      ...safeAgent,
      id: newId,
      premier_login: true,
    });
  }

  try {
    savePersistedAgents(agents);
    return res.json({ success: true, agents });
  } catch (err) {
    console.error('Error persisting agent:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde de l\'agent.' });
  }
});

app.delete('/api/agents/:id', requireManagerAuth, (req, res) => {
  const agentId = req.params.id;
  if (!agentId) {
    return res.status(400).json({ error: 'ID agent manquant.' });
  }

  try {
    let agents = loadPersistedAgents();
    agents = agents.filter((a) => a.id !== agentId && normalizeEmployeeId(a.matricule_rh) !== agentId);
    savePersistedAgents(agents);
    return res.json({ success: true, agents });
  } catch (err) {
    console.error('Error deleting agent:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'agent.' });
  }
});

// Helper for fallback chat responses when API key is missing or fails
function getFallbackChatResponse(message: string, context: any): string {
  const msgLower = (message || '').toLowerCase();
  const agentName = context?.agentName || 'Conseiller';
  const perfs = context?.recentPerformances || [];
  const latestPerf = perfs[0] || {};

  if (msgLower.includes('rap')) {
    return `### 🎯 Conseils pour optimiser votre RAP (Taux de Résolution au premier contact)

Bonjour **${agentName}**, le RAP mesure votre capacité à apporter une solution definitiva dès le premier échange.

**Axes d'amélioration prioritaires :**
1. **Écoute active & reformulation :** Assurez-vous de bien comprendre la demande principale ainsi que les besoins sous-jacents du client.
2. **Traitement complet de la demande :** Vérifiez si le client a une question secondaire avant de clore l'appel ou le message.
3. **Pédagogie et clarté :** Expliquez clairement les étapes de résolution pour éviter un nouvel appel pour le même motif.

*Actuellement sur votre dernier suivi : RAP = ${latestPerf.rap ? `${latestPerf.rap}%` : 'Non renseigné'}. Visons un objectif supérieur à 85% !*`;
  }

  if (msgLower.includes('tr') || msgLower.includes('transfert')) {
    return `### 🔄 Réduire le TR (Taux de Transfert)

Le **TR** reflète le pourcentage d'interactions transférées vers d'autres services. Plus il est bas, plus le client bénéficie d'une prise en charge directe.

**Bonnes pratiques pour diminuer vos transferts :**
1. **Consultation de la base de connaissances (KB) :** Vérifiez les procédures d'escalade avant de transférer.
2. **Montée en autonomie :** Traitez vous-même les cas complexes à votre portée plutôt que de les renvoyer.
3. **Si le transfert est inévitable :** Faites un transfert qualifié avec une note explicative complète pour l'équipe suivante.

*Objectif cible TR : Réduire le taux sous le seuil de 12%.*`;
  }

  if (msgLower.includes('dmt') || msgLower.includes('durée') || msgLower.includes('duree')) {
    return `### ⏱️ Maîtriser la DMT (Durée Moyenne de Traitement)

La **DMT** est clé pour garantir la fluidité du service et la disponibilité pour les autres clients.

**Conseils pratiques :**
1. **Raccourcis & trames de réponse :** Utilisez les modèles de saisie pré-enregistrés pour la qualification des dossiers.
2. **Conduite d'entretien proactive :** Guidez la conversation avec assurance pour éviter les digressions.
3. **Saisie en temps réel :** Prenez vos notes pendant l'échange plutôt que pendant le Wrap-up.

*Actuellement : DMT = ${latestPerf.dmt ? `${latestPerf.dmt}s` : 'En analyse'}.*`;
  }

  if (msgLower.includes('prime') || msgLower.includes('calcul') || msgLower.includes('semaine 31') || msgLower.includes('s31') || msgLower.includes('résultat') || msgLower.includes('resultat')) {
    return `### 📊 Synthèse des Primes & Performances pour **${agentName}**

Votre prime multicanal repose sur la combinaison de vos 4 KPIs majeurs (**RAP**, **TR**, **CCX**, **DMT**) pondérés par le volume de chaque canal (Phone, Email, MU) et modulés par votre taux de **Présence**.

**Rappel de la structure de prime :**
- **Plafond théorique par canal :** 50 000 FCFA
- **Palier 100% :** Atteinte des cibles de la grille (+ 3 mois ou - 3 mois d'ancienneté)
- **Palier 110% (Bonus de surperformance) :** Jusqu'à 55 000 FCFA par canal
- **Ajustement Présence :** Une présence à 100% garantit la totalité de la prime calculée.

Pour maximiser votre prime cette semaine, concentrez-vous sur le canal ayant le plus fort volume !`;
  }

  return `Bonjour **${agentName}** ! 👋

Je suis votre **Assistant IA Performances Booster**. Je suis à votre disposition pour analyser vos résultats et vous accompagner au quotidien.

**Comment puis-je vous aider aujourd'hui ?**
- 🎯 *Comment améliorer mon RAP Phone ?*
- 📊 *Analyse de mes résultats et KPIs récents*
- 💰 *Explications sur le calcul de la prime multicanal*
- ⏱️ *Conseils pour réduire la DMT et les transferts (TR)*

N'hésitez pas à me poser directement votre question !`;
}

// Assistant IA Endpoint
app.post('/api/chat', requireAuth, rateLimitAiEndpoint(20), async (req, res) => {
  const { message, history, context } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Le message est requis.' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Le message dépasse la limite maximale de 2000 caractères.' });
  }

  try {
    const ai = getGenAI();

    const systemInstruction = `Tu es l'Assistant IA certifié de "Performances Booster" (Plateforme Support Multicanal).
Tu réponds en Français de manière très professionnelle, précise, constructive et motivante.
Contexte de l'agent connecté :
${JSON.stringify(context || {}, null, 2)}

Grille des primes & KPIs Support :
- Canaux : Phone, Email, MU (Message Utilisateur).
- 4 KPIs : RAP (s100), TR (s100, plus bas est meilleur), CCX (s100), DMT (s100, plus bas est meilleur).
- Ancienneté : + 3 mois ou - 3 mois.
- Prime max par canal : 50 000 FCFA.
- Pondération multicanal par volume, modulée par la Présence (%).
- Statuts : >= 45 000 FCFA (Objectif atteint), >= 20 000 FCFA (En progression), < 20 000 FCFA (À renforcer).

Règles de réponse :
1. Analyse le contexte de l'agent si fourni.
2. Sois concis, clair, structuré avec du Markdown (puces, gras).
3. Propose des conseils d'amélioration concrets sur les KPIs en retard.
4. Encourage l'agent avec professionnalisme.`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        if (!h.content || typeof h.content !== 'string') continue;
        const role = h.role === 'assistant' ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: h.content }],
        });
      }
    }

    // Ensure content array starts with a user role message for Gemini API compliance
    while (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message || '' }],
    });

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || getFallbackChatResponse(message, context);
    res.json({ text: replyText });
  } catch (error: any) {
    console.warn("Chat API warning (using fallback response):", error?.message || error);
    const fallbackText = getFallbackChatResponse(message, context);
    res.json({ text: fallbackText });
  }
});

function generateDynamicCoachingFallback(params: {
  agentName: string;
  periodLabel: string;
  anciennete: string;
  managerName: string;
  perfData: any;
}): string {
  const { agentName, periodLabel, anciennete, managerName, perfData } = params;

  let perfSummary = '';
  let strongPoints = '';
  let focusPoints = '';

  if (perfData?.canaux && Array.isArray(perfData.canaux) && perfData.canaux.length > 0) {
    const channelLines = perfData.canaux.map((c: any) => {
      const parts = [];
      if (c.vol != null) parts.push(`Volume: ${c.vol}`);
      if (c.rap != null) parts.push(`RAP: ${(c.rap * 100).toFixed(1)}%`);
      if (c.ccx != null) parts.push(`CCX: ${(c.ccx * 100).toFixed(1)}%`);
      if (c.tr != null) parts.push(`TR: ${(c.tr * 100).toFixed(1)}%`);
      if (c.dmt != null) parts.push(`DMT: ${Math.round(c.dmt)}s`);
      if (c.assiduite != null) parts.push(`Assiduité: ${Math.round(c.assiduite)}%`);
      return `- **Canal ${c.canal}** : ${parts.join(' | ')}`;
    });
    perfSummary = channelLines.join('\n');

    const firstChan = perfData.canaux[0];
    if (firstChan) {
      if (firstChan.rap != null && firstChan.rap >= 0.83) {
        strongPoints += `- **Excellente Résolution (RAP) sur le canal ${firstChan.canal}** : ${(firstChan.rap * 100).toFixed(1)}% de dossiers résolus dès la première interaction.\n`;
      }
      if (firstChan.ccx != null && firstChan.ccx >= 0.90) {
        strongPoints += `- **Haute Conformité (CCX) sur ${firstChan.canal}** : ${(firstChan.ccx * 100).toFixed(1)}% de respect des normes de qualité.\n`;
      }
      if (firstChan.dmt != null && firstChan.dmt <= 600) {
        strongPoints += `- **Maîtrise du temps de traitement (DMT)** : ${Math.round(firstChan.dmt)}s, permettant une bonne fluidité des échanges.\n`;
      }
      if (firstChan.tr != null && firstChan.tr > 0.14) {
        focusPoints += `- **Réitération (TR) sur ${firstChan.canal}** : ${(firstChan.tr * 100).toFixed(1)}%. Assurer une prise en charge complète pour éviter le rappel client.\n`;
      }
      if (firstChan.rap != null && firstChan.rap < 0.85) {
        focusPoints += `- **Clarification du besoin (RAP)** : Poursuivre les efforts pour sécuriser un RAP supérieur à 85%.\n`;
      }
    }
  } else if (perfData?.donnees_mensuelles) {
    const m = perfData.donnees_mensuelles;
    perfSummary = `- Volume global : ${m.vol_total || 'N/A'}\n- Taux de Présence : ${m.presence || 100}%\n- Statut de Prime : ${m.statut_prime || 'En cours'}`;
    strongPoints = `- **Engagement et Présence** : ${m.presence || 100}% de présence sur la période mensuelle.`;
    focusPoints = `- **Optimisation des contributions** : Consolider les performances sur l'ensemble des canaux actifs pour viser le statut 'Objectif atteint'.`;
  } else {
    perfSummary = `Données brutes enregistrées pour la période ${periodLabel}.`;
    strongPoints = `- **Régularité opérationnelle** : Présence et engagement maintenus sur l'activité.`;
    focusPoints = `- **Maîtrise des KPIs clés** : Travailler la régularité du RAP et du DMT.`;
  }

  if (!strongPoints) {
    strongPoints = `- **Implication active** : Constance dans le traitement des sollicitations clients sur la période.`;
  }
  if (!focusPoints) {
    focusPoints = `- **Maintien des standards** : Conserver la rigueur dans la qualification et le suivi des demandes.`;
  }

  let historyNotice = '';
  if (perfData?.historique_semaines_precedentes && Array.isArray(perfData.historique_semaines_precedentes) && perfData.historique_semaines_precedentes.length > 0) {
    const prevCount = perfData.historique_semaines_precedentes.length;
    historyNotice = `\n\n*Analyse comparative disponible sur les ${prevCount} période(s) précédente(s).*`;
  }

  return `# 🎯 Plan de Coaching Individuel - ${agentName} (${periodLabel})

### 📊 Analyse de la performance
Profil agent : **${anciennete}**  
Bilan des indicateurs enregistrés pour la période **${periodLabel}** :
${perfSummary}${historyNotice}

### ✅ Points forts
${strongPoints}

### ⚠️ Points d'attention
${focusPoints}

### 🎯 Priorités
1. **Qualification précise** : Valider systématiquement l'ensemble des points de la demande client dès le premier contact.
2. **Rigueur de synthèse** : Renseigner clairement le suivi du dossier pour réduire les taux de réitération.

### 🛠️ Actions concrètes
- Utiliser la grille de contrôle rapide avant la clôture de chaque dossier.
- Faire un point hebdomadaire de 5 minutes avec votre manager **${managerName}** sur les cas complexes.

### 📈 Objectif suivant
- Viser un **RAP ≥ 85%** et maintenir un **CCX ≥ 93%** sur les canaux principaux.

### 💬 Message du Manager
*${agentName}, ton implication constante porte ses fruits. En restant concentré(e) sur la précision de tes réponses dès le premier contact, tu consolideras d'excellents résultats !*

— **${managerName}**`;
}

// Coaching IA Endpoint
app.post('/api/coaching', requireManagerAuth, rateLimitAiEndpoint(15), async (req, res) => {
  const { agentName, semaine, moisKey, periodType, perfData, anciennete, managerName } = req.body;
  const periodLabel = periodType === 'month' ? `Mois ${moisKey || 'En cours'}` : `Semaine S${semaine || 31}`;

  console.log(`[COACHING IA] Agent: "${agentName}", Période: ${periodLabel}, Ancienneté: ${anciennete || 'N/A'}`);

  try {
    const ai = getGenAI();

    const systemInstruction = `Tu es un Manager de Centre de Contact opérationnel pour l'activité PHONE · EMAIL · MU.
Tu rédiges un plan de coaching individuel personnalisé, professionnel et humain pour l'agent "${agentName || 'Conseiller'}".

RÈGLES ABSOLUES À RESPECTER :
1. Analyse UNIQUEMENT et EXCLUSIVEMENT les données réelles fournies dans le payload.
2. NE JAMAIS inventer un KPI qui n'est pas présent dans les données (Interdiction absolue d'inventer QA, CSAT, FRT, CPH, AHT ou tout autre indicateur absents des données).
3. NE JAMAIS inventer un chiffre, un volume ou un objectif non fourni.
4. Si un historique de performances précédentes est fourni dans les données, analyse l'évolution (progression ou dégradation) sur les KPI réels. Si aucun historique n'est fourni, ne prétend pas qu'il existe et n'invente pas d'évolution.
5. Adapte le niveau d'exigence et d'analyse à l'ancienneté réelle de l'agent ("${anciennete || '+ 3 mois'}") et aux cibles métier fournies.
6. Adopte le style d'un Manager humain direct, professionnel, bienveillant, exigeant et bien ancré dans la réalité du terrain. Évite les phrases bateau ou génériques sans lien avec les chiffres.

Structure la réponse en Markdown selon ce plan exact :
# 🎯 Plan de Coaching Individuel - ${agentName || 'Conseiller'} (${periodLabel})

### 📊 Analyse de la performance
(Analyse détaillée et chiffrée des KPI réels disponibles pour la période, avec évolution historique si disponible)

### ✅ Points forts
(Éléments réellement positifs d'après les chiffres)

### ⚠️ Points d'attention
(KPI ou comportements nécessitant un effort ciblé d'après les chiffres)

### 🎯 Priorités
(Max 2 à 3 priorités concrètes et ciblées)

### 🛠️ Actions concrètes
(Actions pratiques et quotidiennes pour l'agent)

### 📈 Objectif suivant
(Cible chiffrée basée sur les objectifs métier fournis)

### 💬 Message du Manager
(Message humain, motivant et signé par le Manager "${managerName || 'Votre Manager'}")`;

    const prompt = `Voici le payload complet des données réelles de l'agent :
- Agent : ${agentName || 'Conseiller'}
- Manager : ${managerName || 'SABI Prospere'}
- Période : ${periodLabel}
- Ancienneté : ${anciennete || '+ 3 mois'}
- Données de performance et cibles :
${JSON.stringify(perfData || {}, null, 2)}

Génère le plan de coaching personnalisé en Markdown en respectant scrupuleusement la structure et les consignes.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction, temperature: 0.6 },
    });

    const text = response.text || '';
    res.json({ coaching: text, coachingPlan: text, success: true });
  } catch (error: any) {
    console.warn("[COACHING IA] Warning (using dynamic data fallback):", error?.message || error);
    const fallback = generateDynamicCoachingFallback({
      agentName: agentName || 'Conseiller',
      periodLabel,
      anciennete: anciennete || '+ 3 mois',
      managerName: managerName || 'SABI Prospere',
      perfData,
    });

    res.json({ coaching: fallback, coachingPlan: fallback, success: true, fallbackUsed: true, errorMsg: error?.message });
  }
});

// Feedback IA Endpoint
app.post('/api/feedback', requireManagerAuth, rateLimitAiEndpoint(15), async (req, res) => {
  const { agentName, semaine, moisKey, periodType, perfData, managerName } = req.body;
  const periodLabel = periodType === 'month' ? `Mois ${moisKey || 'En cours'}` : `Semaine ${semaine || 31}`;

  try {
    const ai = getGenAI();

    const prompt = `En tant que Manager Support (${managerName || 'SABI Prospere'}), rédige un feedback constructif et bienveillant en Français pour l'agent "${agentName || 'Conseiller'}" pour la période ${periodLabel}.
Données de performance :
${JSON.stringify(perfData || {}, null, 2)}

Réponds sous la forme d'un objet JSON valide avec 3 clés :
{
  "feedback": "Remarques générales valorisantes et synthèse des résultats",
  "axes_amelioration": "Point(s) d'attention spécifique(s) pour progresser",
  "plan_action": "Action concrète recommandée pour la période suivante"
}`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    let jsonRes = { feedback: '', axes_amelioration: '', plan_action: '' };
    try {
      jsonRes = JSON.parse(response.text || '{}');
    } catch {
      jsonRes = {
        feedback: response.text || `Très bon travail global sur ${periodLabel}. La relation client reste constante et satisfaisante.`,
        axes_amelioration: 'Maintenir la vigilance sur la maîtrise de la DMT et du taux de transfert.',
        plan_action: 'Faire un point régulier avec votre responsable pour suivre la montée en compétence.',
      };
    }

    res.json({ ...jsonRes, success: true });
  } catch (error: any) {
    console.warn("Feedback API warning (using fallback response):", error?.message || error);
    res.json({
      feedback: `Bonne implication constatée pour ${agentName || 'l\'agent'} sur la période ${periodLabel}. Prise en charge professionnelle des demandes clients.`,
      axes_amelioration: 'Continuer à optimiser la durée moyenne de traitement (DMT) et la résolution au premier contact (RAP).',
      plan_action: 'Consulter les guides de réponses types et faire un bilan mi-période avec le manager.',
      success: true,
      fallbackUsed: true,
      errorMsg: error?.message,
    });
  }
});

// OCR / Screenshot Agent Extraction Endpoint
app.post('/api/extract-agents-image', requireManagerAuth, rateLimitAiEndpoint(10), async (req, res) => {
  const { imageBase64, mimeType } = req.body;

  try {
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 manquante.' });
    }

    const ai = getGenAI();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analyse cette image/capture d'écran contenant un tableau ou une liste d'agents.
Extrais la liste de tous les agents présents dans le document sous forme d'un tableau JSON strict d'objets avec les champs suivants pour chaque agent :
- "matricule_rh": string (ex: "1163")
- "nom": string (ex: "TATOUNOU")
- "prenom": string (ex: "Shalom")
- "nom_complet": string (ex: "TATOUNOU Shalom")
- "log_activite": string (ex: "lom_tatounou")
- "contrat": string ("CDI", "CDD", "STG" ou "ANP")
- "anciennete": string ("+ 3 mois" ou "- 3 mois")

Retourne un tableau JSON d'objets d'agents.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/png',
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    let extracted: any[] = [];
    try {
      const parsed = JSON.parse(response.text || '[]');
      extracted = Array.isArray(parsed) ? parsed : parsed.agents || [];
    } catch {
      extracted = [];
    }

    res.json({ agents: extracted });
  } catch (error: any) {
    console.warn('Extract agents image error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur d\'extraction de l\'image.' });
  }
});

// Vite Middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
