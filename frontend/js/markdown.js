// =========================================================
// MISSIONLMS — MARKDOWN RENDERER
// =========================================================

function renderMarkdown(value) {
    let text = String(value || "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

    const codeBlocks = [];

    // -----------------------------------------------------
    // PROTECT CODE BLOCKS
    // -----------------------------------------------------

    text = text.replace(
        /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g,
        function (_, language, code) {
            const index = codeBlocks.length;

            codeBlocks.push({
                language: language || "",
                code: escapeMarkdownHtml(
                    code.replace(/\n$/, "")
                )
            });

            return `@@CODEBLOCK_${index}@@`;
        }
    );

    // -----------------------------------------------------
    // ESCAPE RAW HTML
    // -----------------------------------------------------

    text = escapeMarkdownHtml(text);

    // Remove Markdown hard-break backslashes at line endings.
    text = text.replace(/\\\s*$/gm, "");

    const lines = text.split("\n");
    const output = [];

    let paragraph = [];

    function flushParagraph() {
        if (paragraph.length === 0) {
            return;
        }

        output.push(
            `<p>${paragraph.join("<br>")}</p>`
        );

        paragraph = [];
    }

    // -----------------------------------------------------
    // PROCESS EACH LINE
    // -----------------------------------------------------

    lines.forEach(function (line) {
        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            return;
        }

        // CODE BLOCK PLACEHOLDER
        if (/^@@CODEBLOCK_\d+@@$/.test(trimmed)) {
            flushParagraph();
            output.push(trimmed);
            return;
        }

        // HORIZONTAL RULE
        if (/^---+$/.test(trimmed)) {
            flushParagraph();
            output.push("<hr>");
            return;
        }

        // HEADINGS — check ### before ##
        if (/^###\s+/.test(trimmed)) {
            flushParagraph();

            output.push(
                `<h4>${formatInline(
                    trimmed.replace(/^###\s+/, "")
                )}</h4>`
            );

            return;
        }

        if (/^##\s+/.test(trimmed)) {
            flushParagraph();

            output.push(
                `<h3>${formatInline(
                    trimmed.replace(/^##\s+/, "")
                )}</h3>`
            );

            return;
        }

        if (/^#\s+/.test(trimmed)) {
            flushParagraph();

            output.push(
                `<h2>${formatInline(
                    trimmed.replace(/^#\s+/, "")
                )}</h2>`
            );

            return;
        }

        // CHECKBOX
        if (/^\[\s\]\s*/.test(trimmed)) {
            flushParagraph();

            const content = trimmed.replace(
                /^\[\s\]\s*/,
                ""
            );

            output.push(
                `<div class="markdown-checklist">` +
                    `<span class="markdown-checkbox">□</span>` +
                    `<span>${formatInline(content)}</span>` +
                `</div>`
            );

            return;
        }

        // COMPLETED / VALIDATION LINE
        if (/^✓\s*/.test(trimmed)) {
            flushParagraph();

            const content =
                trimmed.replace(/^✓\s*/, "");

            output.push(
                `<div class="markdown-check">` +
                    `<span class="markdown-check-icon">✓</span>` +
                    `<span>${formatInline(content)}</span>` +
                `</div>`
            );

            return;
        }

        // WARNING
        if (/^⚠\s*/.test(trimmed)) {
            flushParagraph();

            const content =
                trimmed.replace(/^⚠\s*/, "");

            output.push(
                `<div class="markdown-warning">` +
                    `<span class="markdown-warning-icon">⚠</span>` +
                    `<span>${formatInline(content)}</span>` +
                `</div>`
            );

            return;
        }

        // DIAMOND / GAME ITEM
        if (/^◆\s*/.test(trimmed)) {
            flushParagraph();

            const content =
                trimmed.replace(/^◆\s*/, "");

            output.push(
                `<div class="markdown-item markdown-diamond">` +
                    `<span class="markdown-bullet">◆</span>` +
                    `<span>${formatInline(content)}</span>` +
                `</div>`
            );

            return;
        }

        // ACTION ITEM
        if (/^(▸|➜|►)\s*/.test(trimmed)) {
            flushParagraph();

            const match =
                trimmed.match(/^(▸|➜|►)\s*(.*)$/);

            output.push(
                `<div class="markdown-item">` +
                    `<span class="markdown-bullet">` +
                        `${match[1]}` +
                    `</span>` +
                    `<span>${formatInline(match[2])}</span>` +
                `</div>`
            );

            return;
        }

        // STANDARD MARKDOWN BULLET
        if (/^[-*]\s+/.test(trimmed)) {
            flushParagraph();

            const content =
                trimmed.replace(/^[-*]\s+/, "");

            output.push(
                `<div class="markdown-item">` +
                    `<span class="markdown-bullet">▸</span>` +
                    `<span>${formatInline(content)}</span>` +
                `</div>`
            );

            return;
        }

        // NORMAL TEXT
        paragraph.push(
            formatInline(trimmed)
        );
    });

    flushParagraph();

    // -----------------------------------------------------
    // RESTORE CODE BLOCKS
    // -----------------------------------------------------

    let html = output.join("\n");

    html = html.replace(
        /@@CODEBLOCK_(\d+)@@/g,
        function (_, index) {
            const block =
                codeBlocks[Number(index)];

            if (!block) {
                return "";
            }

            const language =
                block.language &&
                block.language.toLowerCase() !== "text"
                    ? (
                        `<div class="code-language">` +
                        `${block.language}` +
                        `</div>`
                    )
                    : "";

            return (
                `<div class="code-block">` +
                    language +
                    `<pre><code>${block.code}</code></pre>` +
                `</div>`
            );
        }
    );

    return html;
}


// =========================================================
// INLINE MARKDOWN
// =========================================================

function formatInline(value) {
    let text = String(value || "");

    // -----------------------------------------------------
    // MARKDOWN LINKS
    // [label](https://example.com)
    // -----------------------------------------------------

    text = text.replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        function (_, label, url) {
            return (
                `<a href="${url}" ` +
                `target="_blank" ` +
                `rel="noopener noreferrer">` +
                `${label}</a>`
            );
        }
    );

    // -----------------------------------------------------
    // BOLD
    // -----------------------------------------------------

    text = text.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );

    // -----------------------------------------------------
    // INLINE CODE
    // -----------------------------------------------------

    text = text.replace(
        /`([^`\n]+)`/g,
        '<code class="inline-code">$1</code>'
    );

    // -----------------------------------------------------
    // PLAIN URLs
    // Only URLs that are not already inside generated HTML.
    // -----------------------------------------------------

    if (!text.includes("<a ")) {
        text = text.replace(
            /(https?:\/\/[^\s<]+)/g,
            function (url) {
                let cleanUrl = url;
                let punctuation = "";

                while (/[.,;!?)]$/.test(cleanUrl)) {
                    punctuation =
                        cleanUrl.slice(-1) +
                        punctuation;

                    cleanUrl =
                        cleanUrl.slice(0, -1);
                }

                return (
                    `<a href="${cleanUrl}" ` +
                    `target="_blank" ` +
                    `rel="noopener noreferrer">` +
                    `${cleanUrl}</a>` +
                    punctuation
                );
            }
        );
    }

    return text;
}


// =========================================================
// SECURITY — ESCAPE RAW HTML
// =========================================================

function escapeMarkdownHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
