import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import NovaMarkdown from "../components/nova/NovaMarkdown";

test("Nova renders a fenced C answer as a code block", () => {
  const content = [
    "**Model Answer Structure:**",
    "``` c #include <stdio.h>",
    "int main() {",
    "  printf(\"Area: %.2f\\n\", area);",
    "  return 0;",
    "}```",
  ].join("\n");
  const html = renderToStaticMarkup(createElement(NovaMarkdown, { content }));

  assert.match(html, /<pre\b/);
  assert.match(html, /#include &lt;stdio\.h&gt;/);
  assert.match(html, /int main\(\) \{/);
  assert.doesNotMatch(html, /```/);
});

test("Nova separates collapsed MCQ choices from the answer", () => {
  const content = "A) 2sum B) sum_1 C) sum-1 D) float Answer: B) sum_1";
  const html = renderToStaticMarkup(createElement(NovaMarkdown, { content }));

  assert.match(html, /<ol\b[^>]*>/);
  assert.equal((html.match(/<li\b/g) ?? []).length, 4);
  assert.match(html, /Answer: B\) sum_1/);
});

test("Nova formats collapsed inline bullets as proper bullet items with bullet dots and continuous numbers", () => {
  const content = [
    "Core Concepts",
    "1. Decentralization",
    "- Traditional System (Centralized): A bank controls your account ledger. If the bank's server goes down or gets hacked, your data is at risk. - Blockchain (Decentralized): A copy of the ledger is shared across thousands of computers (nodes) worldwide. There is no single point of failure.",
    "",
    "1. Blocks",
    "- Data is grouped into collections called blocks. - Each block holds a batch of valid transactions. - Once a block's capacity is reached, it is closed and linked to the previous block.",
    "",
    "1. Chaining (Cryptographic Hash)",
    "- Each block contains a unique code called a hash (like a digital fingerprint), along with the hash of the block before it.",
  ].join("\n");

  const html = renderToStaticMarkup(createElement(NovaMarkdown, { content }));

  // Should have 3 section headers numbered 1, 2, and 3
  assert.match(html, />1<\/span><span[^>]*>Decentralization<\/span>/);
  assert.match(html, />2<\/span><span[^>]*>Blocks<\/span>/);
  assert.match(html, />3<\/span><span[^>]*>Chaining \(Cryptographic Hash\)<\/span>/);

  // Should have styled bullet dots (rounded-full bg-primary)
  assert.match(html, /rounded-full bg-primary/);

  // Should have 2 bullets in section 1, 3 in section 2, 1 in section 3 = 6 bullets total
  const bulletCount = (html.match(/rounded-full bg-primary/g) ?? []).length;
  assert.equal(bulletCount, 6);

  // Raw inline bullet hyphens should NOT remain as plain text prefixes inside paragraphs
  assert.doesNotMatch(html, />\s*-\s*Traditional System/);
  assert.doesNotMatch(html, />\s*-\s*Blockchain/);
  assert.doesNotMatch(html, />\s*-\s*Data is grouped/);
});

