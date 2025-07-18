---
applyTo: '**'
---
### **The Externalized Memory Protocol (EMP)**

The core objective of the EMP is to create a persistent, evolving knowledge base that an AI can tap into on-demand. This provides consistent, accurate context without consuming the limited and expensive active context window with redundant information.

-----

#### **I. Principle: Knowledge Base Architecture** 🏗️

The foundation of the EMP is a structured and machine-readable repository of information.

1.1. **Hierarchical Structure:**
\* **MAINTAIN** a central `memory_bank` directory for the project.
\* **ORGANIZE** knowledge within this directory using sub-folders based on topic. This creates a logical, navigable structure.
\* *Examples:* `/architecture`, `/style_guides`, `/data_schemas`, `/user_personas`, `/api_specifications`, `/common_errors`.

1.2. **Content Formatting Standard:**
\* **AUTHOR** all knowledge documents in Markdown (`.md`).
\* **USE** clear, semantic headings (`#`, `##`, etc.), code blocks with language identifiers (e.g., \`\`\`python), and lists to structure information. This makes the content highly parsable for the AI.

1.3. **Metadata (Improvement ✨):**
\* **INCLUDE** a YAML frontmatter block at the top of each document to provide metadata.
\* **DEFINE** key fields like `title`, `tags`, `last_updated`, and `owner`. This metadata is crucial for advanced retrieval and maintenance.
\`\`\`yaml
\---
title: "User Authentication Flow"
tags: ["auth", "jwt", "backend", "security"]
last\_updated: "2025-07-17"
owner: "@dev\_lead"
\---

````
  # User Authentication
  Our system uses JWT for authentication...
  ```
````

-----

#### **II. Principle: Dynamic Retrieval & Injection Protocol** 🔎

This protocol outlines how the AI should *use* the knowledge base. It transforms the static "Memory Bank" into a dynamic, active part of the workflow, much like Retrieval-Augmented Generation (RAG).

2.1. **Query Analysis:**
\* **UPON RECEIVING** a user prompt,
\* **ANALYZE** the prompt to extract key nouns, concepts, and technical terms (e.g., "authentication bug", "user profile page", "database schema").

2.2. **Semantic Search (Improvement ✨):**
\* **PERFORM** a semantic search (not just keyword search) across the `memory_bank` using the extracted concepts as the query.
\* **IDENTIFY** the top 3-5 most relevant knowledge documents based on a relevance score ($S\_{relevance}$). This is far more effective than requiring a human to manually point to the right file.

2.3. **Context Snippet Extraction (Improvement ✨):**
\* **DO NOT** inject entire documents into the context. This defeats the purpose.
\* **INSTEAD**, from the top-ranked documents, **EXTRACT** only the most relevant sections or "snippets" (e.g., the specific heading and paragraph, the relevant function definition).

2.4. **Formatted Context Injection:**
\* **PREPEND** the extracted snippets to the user's prompt, wrapped in clear XML-style tags. This tells the AI precisely how to treat the information.
\`\`\`xml
\<knowledge\_base\_context\>
\<document source="api\_specifications/auth.md"\>
\#\# Authentication Endpoint
The endpoint for token generation is `POST /api/v1/auth/token`.
It requires \`username\` and \`password\` in the body.
\</document\>
\</knowledge\_base\_context\>

````
  <user_prompt>
    I'm getting a 404 error when trying to get an auth token. Can you write the correct fetch call?
  </user_prompt>
  ```
````

-----

#### **III. Principle: Knowledge Maintenance & Evolution Protocol** 🔄

A knowledge base is only useful if it's accurate. This protocol ensures the memory evolves with the project.

3.1. **Stale Content Detection (Improvement ✨):**
\* **ON A SCHEDULE** (e.g., weekly),
\* **SCAN** the `last_updated` metadata field in all documents.
\* **FLAG** any document that hasn't been updated in a configurable period (e.g., 90 days) for human review to prevent knowledge decay.

3.2. **AI-Assisted Feedback Loop (Improvement ✨):**
\* **IF** the AI completes a task where it needed to ask for clarifying information that was *missing* from the knowledge base,
\* **THEN** automatically generate a suggestion to create a new knowledge document.
\* *Example Suggestion:* "I noticed we clarified the caching strategy for user avatars. Should I create a new document `memory_bank/architecture/caching_strategy.md` with this information?"

3.3. **On-the-Fly Knowledge Capture:**
\* **AFTER** the AI helps generate a new architectural pattern, API endpoint, or coding standard,
\* **PROMPT** the user with a simple "Add to Memory Bank?" option. If approved, the AI should auto-format the new information into a new or existing Markdown file.