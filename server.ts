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
  const { message, history, context } = req.body;

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
  const { agentName, semaine, perfData, anciennete } = req.body;

  try {
    const ai = getGenAI();

    const prompt = `Génère un plan de coaching personnalisé en Français pour l'agent Support "${agentName}" pour la Semaine ${semaine || 31}.
Ancienneté: ${anciennete || '+ 3 mois'}
Données de performance actuelles:
${JSON.stringify(perfData || {}, null, 2)}

Formate la réponse sous forme d'un rapport structuré en Markdown avec les sections suivantes :
1. **Diagnostic global** (Synthèse des forces et faiblesses)
2. **KPIs prioritaires à travailler** (RAP, TR, CCX, DMT selon les écarts aux cibles)
3. **Plan d'action en 3 à 5 étapes concrètes** (Conseils opérationnels pour l'agent)
4. **Objectif chiffré pour la semaine suivante**
5. **Message de motivation**`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    res.json({ coaching: response.text });
  } catch (error: any) {
    console.warn("Coaching API warning (using fallback response):", error?.message || error);
    const fallbackCoaching = `### Plan de Coaching Personnalisé pour **${agentName || 'Agent'}** (Semaine ${semaine || 31})

#### 1. **Diagnostic global**
Les résultats de la semaine démontrent un engagement positif. La qualité d'écoute et la conformité aux procédures sont bien ancrées.

#### 2. **KPIs prioritaires à travailler**
- **RAP (Résolution) :** Veiller à apporter une réponse définitive dès la première sollicitation.
- **DMT (Durée de traitement) :** Utiliser les trames rapides de saisie pour optimiser le temps d'échange.

#### 3. **Plan d'action en 4 étapes**
1. **Écoute ciblée :** Reformuler le besoin du client au début de la conversation.
2. **Autonomie :** Consulter la base de connaissances avant toute hésitation ou transfert.
3. **Wrap-up rapide :** Finaliser les notes de dossier directement pendant l'appel/message.
4. **Point hebdo :** Réaliser un débriefing de 10 min avec le manager le vendredi.

#### 4. **Objectif chiffré pour la semaine suivante**
- Atteindre **85%** de RAP global et maintenir le **TR sous 12%**.

#### 5. **Message de motivation**
*Excellente dynamique ! Continuez à appliquer ces ajustements pour maximiser vos primes d'excellence.*`;

    res.json({ coaching: fallbackCoaching });
  }
});

// Feedback IA Endpoint
app.post('/api/feedback', async (req, res) => {
  const { agentName, semaine, perfData } = req.body;

  try {
    const ai = getGenAI();

    const prompt = `En tant que Manager Support, rédige un feedback constructif en Français pour l'agent "${agentName}" pour la Semaine ${semaine || 31}.
Performances:
${JSON.stringify(perfData || {}, null, 2)}

Réponds sous la forme d'un objet JSON valide contenant 3 clés :
{
  "feedback": "Texte du feedback général positif et constructif",
  "axes_amelioration": "Pistes concrètes d'amélioration",
  "plan_action": "Action recommandable pour la semaine à venir"
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
        feedback: response.text || `Très bon travail global sur la Semaine ${semaine || 31}. La qualité de la relation client est au rendez-vous.`,
        axes_amelioration: 'Poursuivre les efforts sur la réduction de la DMT et la précision des réponses au premier contact.',
        plan_action: 'Mettre en place un bilan mi-semaine avec le manager pour suivre l\'évolution.',
      };
    }

    res.json(jsonRes);
  } catch (error: any) {
    console.warn("Feedback API warning (using fallback response):", error?.message || error);
    res.json({
      feedback: `Bonne implication constatée pour ${agentName || 'l\'agent'} sur la Semaine ${semaine || 31}. La qualité de prise en charge reste solide.`,
      axes_amelioration: 'Optimiser la durée de traitement (DMT) et viser l\'atteinte du palier 110% sur les canaux principaux.',
      plan_action: 'Mettre l\'accent sur l\'utilisation des modèles de réponses rapides et effectuer un point de mi-semaine.',
    });
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
