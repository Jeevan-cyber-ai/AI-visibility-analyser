# Live Presentation Guide: Closed-Loop GEO Optimization on Vercel

This folder (`deployable_test_site/`) is set up for your **live presentation demonstration**.

You will deploy an unoptimized site first, scan it to get a failing score with AI suggestions, apply the suggested code fixes live, and re-scan to show the score jump to Grade A!

---

## Part 1: Initial Deployment (Unoptimized Baseline)

1. Open PowerShell in this folder:
   ```powershell
   cd "c:\Users\jeeva\Desktop\Documents\Ai_visibility analyser\ai_visibility_analyzer\deployable_test_site"
   ```

2. Run Vercel CLI:
   ```powershell
   npx vercel
   ```
   * Follow the prompts:
     * **Set up and deploy?** -> `Y`
     * **Which scope?** -> Enter
     * **Link to existing project?** -> `N`
     * **Project name?** -> `pulsetask-geo-demo`
     * **Directory location?** -> Enter (`./`)

3. Vercel will give you a live production URL:
   👉 **`https://pulsetask-geo-demo.vercel.app`**

---

## Part 2: The Live Presentation Script (In Front of Evaluators)

### Step 1: Scan the Baseline Site
1. Open your AI Analyzer dashboard at **`http://localhost:8000/`**.
2. Go to the **Live On-Page GEO Crawler** tab.
3. Paste your live Vercel URL: `https://pulsetask-geo-demo.vercel.app`
4. Click **"Audit Page Now"**.
5. **Result to Show Evaluators:**
   * ❌ **Score: 3.8 / 100 (Grade F)**
   * ❌ AI bots (GPTBot, PerplexityBot) blocked in `robots.txt`.
   * ❌ 0 JSON-LD schemas detected.
   * ❌ 0 empirical statistics or benchmarks.
   * ❌ No direct 40-word answers to customer queries.
   * 💡 **The AI Analyzer displays the exact diagnostic recommendations!**

---

### Step 2: Apply the Suggested Fixes Live
Tell the evaluators: *"Now let's apply the AI Analyzer's recommended GEO fixes to our website."*

1. Open [`deployable_test_site/robots.txt`](file:///c:/Users/jeeva/Desktop/Documents/Ai_visibility%20analyser/ai_visibility_analyzer/deployable_test_site/robots.txt) and change `Disallow: /` to `Allow: /` for GPTBot & PerplexityBot.
2. Open [`deployable_test_site/index.html`](file:///c:/Users/jeeva/Desktop/Documents/Ai_visibility%20analyser/ai_visibility_analyzer/deployable_test_site/index.html) and copy the content from [`optimized_solution.html`](file:///c:/Users/jeeva/Desktop/Documents/Ai_visibility%20analyser/ai_visibility_analyzer/deployable_test_site/optimized_solution.html).
3. Redeploy to Vercel (takes ~10 seconds):
   ```powershell
   npx vercel --prod
   ```

---

### Step 3: Re-Audit Live & Show the Score Jump
1. Back on your AI Analyzer dashboard, click **"Audit Page Now"** again.
2. **Result to Show Evaluators:**
   * ✅ **Score Jumps to 100.0 / 100 (Grade A) [+96.2 Point Improvement]!**
   * ✅ AI search crawlers allowed.
   * ✅ Full JSON-LD structured schemas parsed (`SoftwareApplication`, `Organization`, `FAQPage`).
   * ✅ Empirical benchmarks verified (240ms latency, 38% sprint velocity, $8/mo).
   * ✅ 40-word direct answer blocks detected.
   * ✅ Author credentials (Dr. Sarah Lin) & SOC2 certifications verified.

---

### Step 4: Show Competitive Share of Voice
1. Switch to the **AI Query Cluster** tab in your dashboard.
2. Enter the seed query: *"best agile sprint management software 2026"* and your brand URL.
3. Click **"Run AI Visibility Cluster Audit"**.
4. Show the evaluators how the AI searches the web and ranks your brand against competitors (**Jira, ClickUp, Linear**), calculating **Share of Voice %**!
