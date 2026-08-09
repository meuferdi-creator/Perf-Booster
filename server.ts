import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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

// Health API
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Server-side Auth State
const SERVER_MANAGERS = [
  { id: 'mgr-495', name: 'SABI Prospere', nom: 'SABI', prenom: 'Prospère', matricule: '495', password: 'TP495', premier_login: false, isGlobalAdmin: true },
  { id: 'mgr-218', name: 'YOMEKPE Komlan Agbenyigan', nom: 'YOMEKPE', prenom: 'Komlan Agbenyigan', matricule: '218', password: 'TP218', premier_login: false },
  { id: 'mgr-391', name: 'HOUENASSOU Sidemeho Akofa', nom: 'HOUENASSOU', prenom: 'Sidemeho Akofa', matricule: '391', password: 'TP391', premier_login: false },
  { id: 'mgr-881', name: 'KPONOOR ZAMAH Goudjo Yao Emile', nom: 'KPONOOR ZAMAH', prenom: 'Goudjo Yao Emile', matricule: '881', password: 'TP881', premier_login: false },
  { id: 'mgr-1010', name: 'BAHUN-WILSON Adjei Amos Annointed A.', nom: 'BAHUN-WILSON', prenom: 'Adjei Amos Annointed A.', matricule: '1010', password: 'TP1010', premier_login: false },
  { id: 'mgr-563', name: 'AMADOU Fatimatou', nom: 'AMADOU', prenom: 'Fatimatou', matricule: '563', password: 'TP563', premier_login: false },
];

const SERVER_AGENTS: Record<string, { password?: string; premier_login?: boolean }> = {};

// Rate limiting store for login endpoint
const LOGIN_ATTEMPTS: Record<string, { count: number; lockoutUntil: number }> = {};

// Secure Authentication API Endpoint
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

  if (role === 'manager' || role === 'admin') {
    let matchedManager: typeof SERVER_MANAGERS[0] | undefined = undefined;

    if (idLower === 'manager') {
      // "Manager" generic username: match deterministically by exact password
      matchedManager = SERVER_MANAGERS.find((m) => {
        const expectedPass = m.password || ('TP' + m.matricule);
        return cleanPass === expectedPass;
      });
    } else {
      // Specific manager username / matricule / name
      matchedManager = SERVER_MANAGERS.find((m) => {
        const mMat = (m.matricule || '').toLowerCase();
        const mName = (m.name || '').toLowerCase();
        const mNom = (m.nom || '').toLowerCase();
        const mId = (m.id || '').toLowerCase();

        const isIdMatch =
          mMat === idLower ||
          mName === idLower ||
          mNom === idLower ||
          mId === idLower ||
          ('tp' + mMat) === idLower;

        if (!isIdMatch) return false;

        const expectedPass = m.password || ('TP' + m.matricule);
        return cleanPass === expectedPass;
      });
    }

    if (!matchedManager) {
      recordFailedAttempt();
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }

    recordSuccess();

    const sessionUser = {
      role: 'manager' as const,
      id: matchedManager.id,
      matricule: matchedManager.matricule,
      name: matchedManager.name,
      nom: matchedManager.nom,
      prenom: matchedManager.prenom,
      manager_name: matchedManager.name,
      isGlobalAdmin: Boolean(matchedManager.isGlobalAdmin || matchedManager.matricule === '495' || matchedManager.name.includes('SABI')),
      premier_login: Boolean(matchedManager.premier_login),
    };

    const sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

    return res.json({
      success: true,
      token: sessionToken,
      user: sessionUser,
    });
  } else {
    // Agent Authentication
    // Identifier must match matricule, log_activite, or email
    const knownAgents = [
      { id: 'agent-1163', matricule_rh: '1163', nom_complet: 'TATOUNOU Shalom', prenom: 'Shalom', manager_name: 'SABI Prospere', log_activite: 'lom_tatounou', email: 'tatounou.s@amazon-support.com', anciennete: '+ 3 mois' },
      { id: 'agent-2347', matricule_rh: '2347', nom_complet: 'AZANLEDJI Kokou Boniface', prenom: 'Kokou Boniface', manager_name: 'SABI Prospere', log_activite: 'lom_boniface', email: 'boniface.a@amazon-support.com', anciennete: '+ 3 mois' },
      { id: 'agent-2177', matricule_rh: '2177', nom_complet: 'GANKUI Marie-josé', prenom: 'Marie-josé', manager_name: 'SABI Prospere', log_activite: 'lom_marijo', email: 'marijo.g@amazon-support.com', anciennete: '+ 3 mois' },
      { id: 'agent-2178', matricule_rh: '2178', nom_complet: 'KIDIKOUNE Emma', prenom: 'Emma', manager_name: 'SABI Prospere', log_activite: 'lom_emma', email: 'emma.k@amazon-support.com', anciennete: '+ 3 mois' },
      { id: 'agent-799', matricule_rh: '799', nom_complet: 'HOUEDJAGBAGBA Komlan Mawuko Clément', prenom: 'Clément', manager_name: 'SABI Prospere', log_activite: 'lom_gbagba', email: 'gbagba.c@amazon-support.com', anciennete: '+ 3 mois' },
      { id: 'agent-2168', matricule_rh: '2168', nom_complet: 'LAWSON Sibi Lolita', prenom: 'Lolita', manager_name: 'SABI Prospere', log_activite: 'lom_sibita', email: 'lolita.l@amazon-support.com', anciennete: '+ 3 mois' },
      { id: 'agent-551', matricule_rh: '551', nom_complet: 'TATRA Aman Emefa', prenom: 'Emefa', manager_name: 'SABI Prospere', log_activite: 'lom_amane', email: 'emefa.t@amazon-support.com', anciennete: '+ 3 mois' },
      { id: 'agent-1814', matricule_rh: '1814', nom_complet: 'Agent 1814', prenom: 'Agent', manager_name: 'SABI Prospere', log_activite: 'lom_1814', email: 'agent1814@amazon-support.com', anciennete: '+ 3 mois' },
    ];

    const matchedAgent = knownAgents.find((a) => {
      const aMat = a.matricule_rh.toLowerCase();
      const aLog = a.log_activite.toLowerCase();
      const aEmail = (a.email || '').toLowerCase();

      return aMat === idLower || aLog === idLower || aEmail === idLower;
    });

    if (!matchedAgent) {
      recordFailedAttempt();
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }

    const agentState = SERVER_AGENTS[matchedAgent.id] || {};
    const expectedPass = agentState.password || ('TP' + matchedAgent.matricule_rh);

    if (cleanPass !== expectedPass) {
      recordFailedAttempt();
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }

    recordSuccess();

    const sessionUser = {
      role: 'agent' as const,
      id: matchedAgent.id,
      matricule: matchedAgent.matricule_rh,
      name: matchedAgent.nom_complet,
      prenom: matchedAgent.prenom,
      manager_name: matchedAgent.manager_name,
      premier_login: Boolean(agentState.premier_login ?? false),
      anciennete: matchedAgent.anciennete,
      log_activite: matchedAgent.log_activite,
    };

    const sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

    return res.json({
      success: true,
      token: sessionToken,
      user: sessionUser,
    });
  }
});

// Change Password API Endpoint
app.post('/api/auth/change-password', (req, res) => {
  const { role, id, newPassword } = req.body || {};
  const cleanPass = (newPassword || '').trim();

  if (!cleanPass || cleanPass.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  if (role === 'manager') {
    const mgr = SERVER_MANAGERS.find((m) => m.id === id);
    if (mgr) {
      mgr.password = cleanPass;
      mgr.premier_login = false;
    }
  } else {
    SERVER_AGENTS[id] = { password: cleanPass, premier_login: false };
  }

  return res.json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
});

// Helper for fallback chat responses when API key is missing or fails
function getFallbackChatResponse(message: string, context: any): string {
  const msgLower = (message || '').toLowerCase();
  const agentName = context?.agentName || 'Conseiller';
  const perfs = context?.recentPerformances || [];
  const latestPerf = perfs[0] || {};

  if (msgLower.includes('rap')) {
    return `### 🎯 Conseils pour optimiser votre RAP (Taux de Résolution au premier contact)

Bonjour **${agentName}**, le RAP mesure votre capacité à apporter une solution définitive dès le premier échange.

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
app.post('/api/chat', async (req, res) => {
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

    const response = await ai.models.generateContent({
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

// Coaching IA Endpoint
app.post('/api/coaching', async (req, res) => {
  const { agentName, semaine, moisKey, periodType, perfData, anciennete, managerName } = req.body;
  const periodLabel = periodType === 'month' ? `Mois ${moisKey || 'En cours'}` : `Semaine ${semaine || 31}`;

  try {
    const ai = getGenAI();

    const systemInstruction = `Tu es un Manager de Centre de Contact Support Multicanal chevronné, humain, bienveillant et orienté résultats. 
Ton rôle est de rédiger un plan de coaching individuel personnalisé et motivant pour l'agent "${agentName || 'Conseiller'}".
Le ton doit être constructif, empathique, direct et valorisant la montée en compétences.
Rédige un rapport complet et structuré en Markdown avec les sections suivantes :
# 🎯 Plan de Coaching Individuel - ${agentName} (${periodLabel})
## 1. 📊 Diagnostic & Bilan des Performances
Analyse précise des forces et axes de progrès basés sur les données réelles fournies (RAP, TR, CCX, DMT, Volume, Assiduite/Présence, PV).
## 2. 🔍 Axes prioritaires de développement
Focus sur 1 à 2 objectifs majeurs avec explications claires du pourquoi.
## 3. 🚀 Plan d'action opérationnel (3 à 5 étapes)
Actions concrètes, pratiques et applicables dès le prochain appel ou message.
## 4. 📈 Objectifs cibles & Impact sur la Prime
Chiffres cibles pour la période suivante et rappel de l'opportunité de gain de prime.
## 5. 💡 Message d'encouragement du Manager (${managerName || 'Votre Manager'})
Phrase motivante personnalisée.`;

    const prompt = `Informations de l'agent :
- Agent : ${agentName || 'Conseiller'}
- Période : ${periodLabel}
- Ancienneté : ${anciennete || '+ 3 mois'}
- Manager : ${managerName || 'SABI Prospere'}
- Données de performance :
${JSON.stringify(perfData || {}, null, 2)}

Génère le plan de coaching complet en Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction, temperature: 0.7 },
    });

    const text = response.text || '';
    res.json({ coaching: text, coachingPlan: text, success: true });
  } catch (error: any) {
    console.warn("Coaching API warning (using fallback response):", error?.message || error);
    const fallback = `# 🎯 Plan de Coaching Individuel - **${agentName || 'Conseiller'}** (${periodLabel})

## 1. 📊 Diagnostic & Bilan des Performances
Les résultats de la période démontrent un très bon engagement opérationnel. La qualité d'écoute et la prise en charge des clients sont solides sur vos canaux principaux.

## 2. 🔍 Axes prioritaires de développement
- **RAP (Résolution au 1er contact) :** Apporter une réponse complète et définitive dès le premier échange pour limiter les réitérations.
- **DMT (Durée de traitement) :** Optimiser l'utilisation des trames de saisie et la qualification des dossiers.

## 3. 🚀 Plan d'action opérationnel
1. **Écoute & Reformulation :** Valider le besoin du client au début de l'interaction.
2. **Autonomie KB :** Consulter la base de connaissances avant de demander une escalade.
3. **Wrap-up fluide :** Prendre vos notes de synthèse directement pendant l'interaction.
4. **Bilan hebdomadaire :** Réaliser un débrief de 10 minutes avec votre manager ${managerName || 'SABI Prospere'}.

## 4. 📈 Objectifs cibles & Impact sur la Prime
- Visons un **RAP >= 85%** et un **TR < 12%** pour maximiser le palier de prime multicanal (jusqu'à 50 000 FCFA / canal).

## 5. 💡 Message d'encouragement
*Bravo pour votre régularité et votre implication. En appliquant ces conseils simples, vous franchirez facilement le niveau supérieur !*`;

    res.json({ coaching: fallback, coachingPlan: fallback, success: true, fallbackUsed: true, errorMsg: error?.message });
  }
});

// Feedback IA Endpoint
app.post('/api/feedback', async (req, res) => {
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

    const response = await ai.models.generateContent({
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
app.post('/api/extract-agents-image', async (req, res) => {
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

    const response = await ai.models.generateContent({
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
