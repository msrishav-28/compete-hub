# Project WingMan: Master Design & Strategy Blueprint
*Code Name: "Neon Operator"*

> **Executive Summary:**
> This document fuses the **"High-Energy Campus" Product Strategy** (Viral Loops, Career Focus) with the **"Neon Operator" Visual Language** (Iron Man HUD, Glass, Precision).
> We are building a tool that feels like a **Military-Grade Command Center** for the elite engineering student.

---

## �️ PART 1: The Visual Language ("Neon Operator")

**Philosophy:** *Tony Stark builds a Cyberpunk Terminal.*
We reject "soft" SaaS design. We embrace **Structure, Precision, and Depth**.

### 1. The Palette: "Toxic Void"
*   **Void Black (`#050505`)**: The infinite background. Pure, deep, OLED friendly.
*   **Reactor Lime (`#a3e635`)**: The primary signal color (Status: Active, Buttons, Cursors).
*   **Hologram White (`#FFFFFF`, roughly 90% opacity)**: Primary data.
*   **HUD Grey (`#1A1A1A`)**: Structural blocks and "off" states.
*   **Signal Colors (The HUD Logic)**:
    *   🟢 **Solid Lime**: Active / "Go"
    *   🟡 **Amber Warning**: Deadline < 72h
    *   🔴 **Critical Pulse**: Deadline < 24h

### 2. The Materials: "Glass & Grid"
*   **The "Dataglass" Block**:
    *   **Consists of:** `backdrop-blur-xl` + `bg-white/5` + `border-white/10`.
    *   **The Detail:** Add **Chamfered (Cut) Corners** on the top-right of key cards to mimic machined hardware.
*   **The "Blueprint" Grid**:
    *   **Consists of:** A very faint (`opacity-5`) technical grid background.
    *   **Why:** It grounds the floating elements, giving a "Schematic" feel.

### 3. Motion: "Mechanical Precision"
*   **Snap, Don't Fade:** Loaders should fill like progress bars. Text should "type in" or scramble-reveal.
*   **Magnetic Cursors:** The cursor locks onto buttons, and the button border glows.
*   **Heavy Physics:** Drawers and modals slide with weight (spring physics), appearing like physical sliding panels.

---

## 🗺️ PART 2: The User Journey & UX Strategy

We are enhancing the User Flow to feel like a "Career Video Game".

### Phase 1: The "Pilot" Registration (Onboarding)
*Replaces the generic "Sign Up" with a "Character Select" sequence.*

*   **UI:** A centered **Glass Modal** with a step-progress bar.
*   **Step 1: "Initialize Identity"**
    *   Input: College Year & Degree.
*   **Step 2: "Select Class" (The Specialization)**
    *   Big, selectable Glass Cards with icons:
    *   `[ </> Full Stack ]` `[ 🤖 AI/ML ]` `[ ⚡ Comp. Program. ]`
*   **Step 3: "Set Mission Parameters"**
    *   Goal: *Internship* / *Research* / *Pure Skills*.
    *   Grind Level (Slider): *Casual* (2h/wk) -> *Hardcore* (20h/wk).
*   **The Payoff:** "Profile Calibrated. Entering Lobby..." -> Redirect to Explore.

### Phase 2: The Lobby (Explore Page)
*A high-density "Mission Board" for finding opportunities.*

*   **Global Filter Bar (Top):**
    *   Horizontal scroll of "Holographic Chips": `[🏆 Placement Leagues]` `[🔥 Ending Soon]` `[🐍 Python]`.
    *   Clicking one instantly reshuffles the grid (React Query).
*   **The Holographic Card (Competition Item):**
    *   **Visual:** Glass Block with a **Status Strip** at the bottom (colored line).
    *   **Status Strip Logic:**
        *   **Green:** Open.
        *   **Red Pulse:** Deadline < 24h.
        *   **Gold Glow:** Hiring Opportunity.
    *   **Interaction:** Hovering lifts the card and activates the "Recruit" button.

### Phase 3: "Squad Up" (The Viral Loop)
*Leveraging the #1 student behavior: WhatsApp Groups.*

*   **The Trigger:** A button on the card/detail view named **"RECRUIT SQUAD"** (Icon: Users/WhatsApp).
*   **The Action:**
    *   Clicking triggers a "Radar Pulse" animation on the button.
    *   Opens native WhatsApp share with a pre-filled, hype-inducing message:
    *   *"Bro, found a High-Value Hackathon. ₹50k Prize Pool. Needs a React dev. Let’s grind? [Link]"*
*   **Why:** It turns every user into a promoter.

### Phase 4: The Command Center (Dashboard)
*Visualized as a "Bento Grid" Control Panel.*

*   **Block 1: "Live Status" (Top Left, Large)**
    *   Shows the **Active Streak** (Flame Icon).
    *   Copy: *"4 Day Streak. Log in tomorrow to maintain sync."*
*   **Block 2: "Panic Room" (Top Right)**
    *   List of **Saved Items closing in < 48 hours**.
    *   Visual: These items have a subtle red background pulse.
*   **Block 3: "Career Inventory" (Bottom)**
    *   **Feature: "Resume Export"**
    *   Button: **[ GENERATE INTEL ]**
    *   Action: Copies a formatted Markdown string to clipboard:
        *   *"Participated in [Hackathon Name] (Top 10%) - Built [Project] using [Tech Stack]."*
    *   *Why:* Direct value unlock for their career.

### Phase 5: The Mobile Experience (Mobile First)
*   **The "Drawer" Navigation:**
    *   On mobile, tapping a card **DOES NOT** open a new page.
    *   It slides up a **Bottom Drawer** (Glass effect, using `vaul`).
    *   **Content:**
        *   Sticky Footer: "Apply" (Green) + "Recruit" (White).
        *   Body: Prize Money (Big font), Tech Stack (Tags), Problem Statement.
        *   *Why:* Keeps users in the "flow" of browsing. fast, native app feel.

---

## 🛠️ PART 3: Technical Implementation Plan

**Stack:** React + Tailwind + Framer Motion + Supabase (DB) + Clerk (Auth).

### Day 1: Foundation & Identity
1.  **System Config:** Setup `tailwind.config.ts` with `neon`, `void` colors and `glass-panel` utility.
2.  **Auth Integration:** Wrap app in Clerk.
3.  **Onboarding:** Build the 3-step "Pilot Registration" Wizard.

### Day 2: The Engine (Explore & Logic)
1.  **DB Upgrade:** Connect Supabase. Replace JSON dumps.
2.  **Card 2.0:** Implement the "Holographic Card" with Status Strip and Chamfered Corners.
3.  **Mobile Drawers:** Implement `vaul` for all detail views.

### Day 3: The Polish (Command Center)
1.  **Dashboard:** Build the "Bento Grid" Command Center.
2.  **Viral Loop:** Wire up the "Recruit Squad" WhatsApp deep links.
3.  **Resume Export:** Implement the string generator logic.
4.  **Trust Signals:** Add "Verified" checkmarks (mocked for now).

---

**Summary:**
We have restored the **deep functionality** (Onboarding flows, Viral loops, Mobile Drawers) but wrapped them in the **"Neon Operator"** skin. This is now a $10k product design.