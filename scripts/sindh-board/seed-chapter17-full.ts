import "dotenv/config";
import { db } from "@/lib/db";
import {
  drawVennDisjoint,
  drawVennOverlapping,
  drawVennSubset,
  drawVenn3Sets,
  drawVennGrid,
} from "@/lib/utils/venn-diagrams";

interface QuestionPart {
  partNumber: string;
  partText: string;
  solution: string;
  explanation?: string;
}

interface ExerciseQuestion {
  questionNumber: string;
  questionText: string;
  parts: QuestionPart[];
}

interface SeedExerciseText {
  classLevel: string;
  chapterNumber: number;
  exerciseNumber: string;
  title: string;
  questions: ExerciseQuestion[];
}

const CHAPTER_17_DATA: SeedExerciseText[] = [
  // ==========================================
  // EXERCISE 17.1
  // ==========================================
  {
    classLevel: "X",
    chapterNumber: 17,
    exerciseNumber: "Exercise 17.1",
    title: "Sets and Functions - Exercise 17.1",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Write the following sets in tabular (roster) form:",
        parts: [
          {
            partNumber: "i",
            partText: "A = Set of all natural numbers less than 10",
            solution: "$$A = \\{1, 2, 3, 4, 5, 6, 7, 8, 9\\}$$",
            explanation: "Natural numbers are counting numbers starting from 1 up to 9."
          },
          {
            partNumber: "ii",
            partText: "B = Set of all prime numbers between 10 and 25",
            solution: "$$B = \\{11, 13, 17, 19, 23\\}$$",
            explanation: "Prime numbers can only be divided by 1 and themselves."
          },
          {
            partNumber: "iii",
            partText: "C = Set of all integers between -3 and 4",
            solution: "$$C = \\{-2, -1, 0, 1, 2, 3\\}$$",
            explanation: "Integers between -3 and 4 (not including -3 and 4)."
          },
          {
            partNumber: "iv",
            partText: "D = Set of all whole numbers less than or equal to 8",
            solution: "$$D = \\{0, 1, 2, 3, 4, 5, 6, 7, 8\\}$$",
            explanation: "Whole numbers start from 0 up to 8."
          },
          {
            partNumber: "v",
            partText: "E = Set of even numbers between 1 and 15",
            solution: "$$E = \\{2, 4, 6, 8, 10, 12, 14\\}$$",
            explanation: "Even numbers can be divided evenly by 2."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Write the following sets in set builder form:",
        parts: [
          {
            partNumber: "i",
            partText: "A = Set of all rational numbers between 5 and 6",
            solution: "$$A = \\{x \\mid x \\in \\mathbb{Q} \\wedge 5 < x < 6\\}$$",
            explanation: "$\\mathbb{Q}$ represents rational numbers (fractions and decimals) between 5 and 6."
          },
          {
            partNumber: "ii",
            partText: "B = {1, 2, 3, 4, 6, 12}",
            solution: "$$B = \\{x \\mid x \\text{ is a positive factor of } 12\\}$$",
            explanation: "These are all the numbers that divide evenly into 12."
          },
          {
            partNumber: "iii",
            partText: "C = {0, ±1, ±2, ... ±40}",
            solution: "$$C = \\{x \\mid x \\in \\mathbb{Z} \\wedge -40 \\le x \\le 40\\}$$",
            explanation: "$\\mathbb{Z}$ represents all integers from -40 to +40, including 0."
          },
          {
            partNumber: "iv",
            partText: "D = {-4, -2, 0, 2, 4}",
            solution: "$$D = \\{x \\mid x \\in \\mathbb{E} \\wedge -4 \\le x \\le 4\\}$$",
            explanation: "Even numbers between -4 and 4."
          },
          {
            partNumber: "v",
            partText: "E = {1, 4, 9, 16, 25}",
            solution: "$$E = \\{x \\mid x = n^2, n \\in \\mathbb{N} \\wedge 1 \\le n \\le 5\\}$$",
            explanation: "Each number is the square of a counting number ($1^2, 2^2, 3^2, 4^2, 5^2$)."
          },
          {
            partNumber: "vi",
            partText: "F = {-1, -3, -5, -7}",
            solution: "$$F = \\{x \\mid x \\in \\mathbb{O}^- \\wedge x \\ge -7\\}$$",
            explanation: "Negative odd numbers starting from -1 down to -7."
          }
        ]
      },
      {
        questionNumber: "Q.3",
        questionText: "If $A = \\{1, 2, 3, 4, 5\\}$ and $B = \\{2, 4, 6, 8\\}$, find the following operations:",
        parts: [
          {
            partNumber: "i",
            partText: "A \\cup B",
            solution: "$$A \\cup B = \\{1, 2, 3, 4, 5\\} \\cup \\{2, 4, 6, 8\\} = \\{1, 2, 3, 4, 5, 6, 8\\}$$",
            explanation: "Union combines all numbers from both sets into one set."
          },
          {
            partNumber: "ii",
            partText: "A \\cap B",
            solution: "$$A \\cap B = \\{1, 2, 3, 4, 5\\} \\cap \\{2, 4, 6, 8\\} = \\{2, 4\\}$$",
            explanation: "Intersection takes only the common numbers found in both sets."
          },
          {
            partNumber: "iii",
            partText: "A - B",
            solution: "$$A - B = \\{1, 2, 3, 4, 5\\} - \\{2, 4, 6, 8\\} = \\{1, 3, 5\\}$$",
            explanation: "Takes set A and removes any numbers that are also in set B."
          },
          {
            partNumber: "iv",
            partText: "B - A",
            solution: "$$B - A = \\{2, 4, 6, 8\\} - \\{1, 2, 3, 4, 5\\} = \\{6, 8\\}$$",
            explanation: "Takes set B and removes any numbers that are also in set A."
          },
          {
            partNumber: "v",
            partText: "A \\Delta B \\text{ (Symmetric Difference)}",
            solution: "$$A \\Delta B = (A - B) \\cup (B - A) = \\{1, 3, 5\\} \\cup \\{6, 8\\} = \\{1, 3, 5, 6, 8\\}$$",
            explanation: "Takes all numbers that are in either A or B, but not in both."
          }
        ]
      },
      {
        questionNumber: "Q.4",
        questionText: "If the universal set $U = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\}$, $A = \\{2, 4, 6, 8, 10\\}$, and $B = \\{1, 3, 5, 7, 9\\}$, verify:",
        parts: [
          {
            partNumber: "i",
            partText: "A \\cup A' = U",
            solution: "$$A' = U - A = \\{1, 3, 5, 7, 9\\}$$\n$$A \\cup A' = \\{2, 4, 6, 8, 10\\} \\cup \\{1, 3, 5, 7, 9\\} = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\} = U$$\n$$\\text{Hence verified.}$$",
            explanation: "Combining a set with everything outside it gives the whole universal set."
          },
          {
            partNumber: "ii",
            partText: "A \\cap A' = \\emptyset",
            solution: "$$A \\cap A' = \\{2, 4, 6, 8, 10\\} \\cap \\{1, 3, 5, 7, 9\\} = \\emptyset$$\n$$\\text{Hence verified.}$$",
            explanation: "A set and its complement never share any common numbers."
          },
          {
            partNumber: "iii",
            partText: "(A')' = A",
            solution: "$$A' = \\{1, 3, 5, 7, 9\\}$$\n$$(A')' = U - A' = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\} - \\{1, 3, 5, 7, 9\\} = \\{2, 4, 6, 8, 10\\} = A$$\n$$\\text{Hence verified.}$$",
            explanation: "Taking the complement twice brings you back to the original set."
          },
          {
            partNumber: "iv",
            partText: "U' = \\emptyset \\text{ and } \\emptyset' = U",
            solution: "$$U' = U - U = \\emptyset$$\n$$\\emptyset' = U - \\emptyset = U$$\n$$\\text{Hence verified.}$$",
            explanation: "The opposite of everything is nothing (empty set), and the opposite of nothing is everything."
          }
        ]
      }
    ]
  },

  // ==========================================
  // EXERCISE 17.2
  // ==========================================
  {
    classLevel: "X",
    chapterNumber: 17,
    exerciseNumber: "Exercise 17.2",
    title: "Sets and Functions - Exercise 17.2",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "If $P = \\{1, 2, 3, 4, 5\\}$ and $Q = \\{1, 3, 5, 7, 9\\}$, find $P \\cup Q$, $P \\cap Q$, $P - Q$, and $Q - P$ and state whether $P$ and $Q$ are disjoint or overlapping sets.",
        parts: [
          {
            partNumber: "i",
            partText: "Calculations of Union, Intersection, and Differences",
            solution: "$$P \\cup Q = \\{1, 2, 3, 4, 5\\} \\cup \\{1, 3, 5, 7, 9\\} = \\{1, 2, 3, 4, 5, 7, 9\\}$$\n$$P \\cap Q = \\{1, 2, 3, 4, 5\\} \\cap \\{1, 3, 5, 7, 9\\} = \\{1, 3, 5\\}$$\n$$P - Q = \\{1, 2, 3, 4, 5\\} - \\{1, 3, 5, 7, 9\\} = \\{2, 4\\}$$\n$$Q - P = \\{1, 3, 5, 7, 9\\} - \\{1, 2, 3, 4, 5\\} = \\{7, 9\\}$$",
            explanation: "Because $P$ and $Q$ share some numbers ($\\{1, 3, 5\\}$) but neither set is fully inside the other, they are **Overlapping Sets**."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "If universal set $U = \\{x \\mid x \\in \\mathbb{W} \\wedge x \\le 10\\}$, $A = \\{x \\mid x \\text{ is even } \\wedge x \\le 10\\}$, and $B = \\{x \\mid x \\text{ is odd } \\wedge x < 10\\}$, verify:",
        parts: [
          {
            partNumber: "i",
            partText: "(A \\cup B)' = A' \\cap B'",
            solution: "$$U = \\{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\}$$\n$$A = \\{0, 2, 4, 6, 8, 10\\}, \\quad B = \\{1, 3, 5, 7, 9\\}$$\n\n$$\\mathbf{\\text{LHS:}}$$\n$$A \\cup B = \\{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\} = U$$\n$$(A \\cup B)' = U - U = \\emptyset$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A' = U - A = \\{1, 3, 5, 7, 9\\}$$\n$$B' = U - B = \\{0, 2, 4, 6, 8, 10\\}$$\n$$A' \\cap B' = \\{1, 3, 5, 7, 9\\} \\cap \\{0, 2, 4, 6, 8, 10\\} = \\emptyset$$\n\n$$\\text{LHS} = \\text{RHS} = \\emptyset \\implies \\text{Verified.}$$",
            explanation: "The complement of a union is equal to the intersection of their individual complements."
          },
          {
            partNumber: "ii",
            partText: "(A \\cap B)' = A' \\cup B'",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$A \\cap B = \\emptyset$$\n$$(A \\cap B)' = U - \\emptyset = U = \\{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A' \\cup B' = \\{1, 3, 5, 7, 9\\} \\cup \\{0, 2, 4, 6, 8, 10\\} = \\{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\} = U$$\n\n$$\\text{LHS} = \\text{RHS} = U \\implies \\text{Verified.}$$",
            explanation: "The complement of an intersection is equal to the union of their individual complements."
          }
        ]
      },
      {
        questionNumber: "Q.3",
        questionText: "If $A = \\{1, 2, 3\\}$, $B = \\{2, 3, 4, 5\\}$, and $C = \\{2, 4, 6, 8\\}$, verify the Associative Property of Union and Intersection:",
        parts: [
          {
            partNumber: "i",
            partText: "A \\cup (B \\cup C) = (A \\cup B) \\cup C",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$B \\cup C = \\{2, 3, 4, 5, 6, 8\\}$$\n$$A \\cup (B \\cup C) = \\{1, 2, 3\\} \\cup \\{2, 3, 4, 5, 6, 8\\} = \\{1, 2, 3, 4, 5, 6, 8\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A \\cup B = \\{1, 2, 3, 4, 5\\}$$\n$$(A \\cup B) \\cup C = \\{1, 2, 3, 4, 5\\} \\cup \\{2, 4, 6, 8\\} = \\{1, 2, 3, 4, 5, 6, 8\\}$$\n\n$$\\text{LHS} = \\text{RHS} \\implies \\text{Verified.}$$",
            explanation: "Changing how you group sets in a union gives the exact same result."
          },
          {
            partNumber: "ii",
            partText: "A \\cap (B \\cap C) = (A \\cap B) \\cap C",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$B \\cap C = \\{2, 4\\}$$\n$$A \\cap (B \\cap C) = \\{1, 2, 3\\} \\cap \\{2, 4\\} = \\{2\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A \\cap B = \\{2, 3\\}$$\n$$(A \\cap B) \\cap C = \\{2, 3\\} \\cap \\{2, 4, 6, 8\\} = \\{2\\}$$\n\n$$\\text{LHS} = \\text{RHS} = \\{2\\} \\implies \\text{Verified.}$$",
            explanation: "Changing how you group sets in an intersection gives the exact same result."
          }
        ]
      },
      {
        questionNumber: "Q.4",
        questionText: "If $X = \\{a, b, c, d\\}$, $Y = \\{b, d, e, f\\}$, and $Z = \\{a, d, f, g\\}$, verify the Distributive Property of Union over Intersection:",
        parts: [
          {
            partNumber: "i",
            partText: "X \\cup (Y \\cap Z) = (X \\cup Y) \\cap (X \\cup Z)",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$Y \\cap Z = \\{d, f\\}$$\n$$X \\cup (Y \\cap Z) = \\{a, b, c, d\\} \\cup \\{d, f\\} = \\{a, b, c, d, f\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$X \\cup Y = \\{a, b, c, d, e, f\\}$$\n$$X \\cup Z = \\{a, b, c, d, f, g\\}$$\n$$(X \\cup Y) \\cap (X \\cup Z) = \\{a, b, c, d, f\\}$$\n\n$$\\text{LHS} = \\text{RHS} = \\{a, b, c, d, f\\} \\implies \\text{Verified.}$$",
            explanation: "Distributive property: taking union with an intersection gives the same answer as intersecting the two unions."
          }
        ]
      },
      {
        questionNumber: "Q.5",
        questionText: "If $A \\subseteq B$, then show that: (i) $A \\cup B = B$, (ii) $A \\cap B = A$, (iii) $A - B = \\emptyset$.",
        parts: [
          {
            partNumber: "i",
            partText: "General Proof for Subsets",
            solution: "- **(i) $A \\cup B = B$:** Since every element of $A$ is already in $B$, uniting $A$ with $B$ adds no new elements $\\implies A \\cup B = B$.\n- **(ii) $A \\cap B = A$:** The common elements between $A$ and $B$ are precisely all elements of $A \\implies A \\cap B = A$.\n- **(iii) $A - B = \\emptyset$:** There is no element in $A$ that is not present in $B \\implies A - B = \\emptyset$.",
            explanation: "Since set A is entirely inside set B, combining them gives B, finding common elements gives A, and subtracting B leaves nothing."
          }
        ]
      }
    ]
  },

  // ==========================================
  // EXERCISE 17.3
  // ==========================================
  {
    classLevel: "X",
    chapterNumber: 17,
    exerciseNumber: "Exercise 17.3",
    title: "Sets and Functions - Exercise 17.3",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Verify the Commutative and Associative Properties of Union and Intersection for the given sets: $A = \\{1, 2, 3, 4\\}$, $B = \\{2, 4, 6, 8\\}$, and $C = \\{3, 4, 5, 6\\}$.",
        parts: [
          {
            partNumber: "i",
            partText: "Commutative Property of Union: A \\cup B = B \\cup A",
            solution: "$$\\text{LHS} = A \\cup B = \\{1, 2, 3, 4\\} \\cup \\{2, 4, 6, 8\\} = \\{1, 2, 3, 4, 6, 8\\}$$\n$$\\text{RHS} = B \\cup A = \\{2, 4, 6, 8\\} \\cup \\{1, 2, 3, 4\\} = \\{1, 2, 3, 4, 6, 8\\}$$\n$$\\text{Since LHS} = \\text{RHS}, \\text{ hence verified.}$$",
            explanation: "Swapping the order of sets in a union gives the same result ($A \\cup B = B \\cup A$)."
          },
          {
            partNumber: "ii",
            partText: "Commutative Property of Intersection: A \\cap B = B \\cap A",
            solution: "$$\\text{LHS} = A \\cap B = \\{1, 2, 3, 4\\} \\cap \\{2, 4, 6, 8\\} = \\{2, 4\\}$$\n$$\\text{RHS} = B \\cap A = \\{2, 4, 6, 8\\} \\cap \\{1, 2, 3, 4\\} = \\{2, 4\\}$$\n$$\\text{Since LHS} = \\text{RHS} = \\{2, 4\\}, \\text{ hence verified.}$$",
            explanation: "Swapping the order of sets in an intersection gives the same result ($A \\cap B = B \\cap A$)."
          },
          {
            partNumber: "iii",
            partText: "Associative Property of Union: (A \\cup B) \\cup C = A \\cup (B \\cup C)",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$A \\cup B = \\{1, 2, 3, 4, 6, 8\\}$$\n$$(A \\cup B) \\cup C = \\{1, 2, 3, 4, 6, 8\\} \\cup \\{3, 4, 5, 6\\} = \\{1, 2, 3, 4, 5, 6, 8\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$B \\cup C = \\{2, 4, 6, 8\\} \\cup \\{3, 4, 5, 6\\} = \\{2, 3, 4, 5, 6, 8\\}$$\n$$A \\cup (B \\cup C) = \\{1, 2, 3, 4\\} \\cup \\{2, 3, 4, 5, 6, 8\\} = \\{1, 2, 3, 4, 5, 6, 8\\}$$\n\n$$\\text{Since LHS} = \\text{RHS}, \\text{ hence verified.}$$",
            explanation: "Changing the grouping brackets does not change the union of three sets."
          },
          {
            partNumber: "iv",
            partText: "Associative Property of Intersection: (A \\cap B) \\cap C = A \\cap (B \\cap C)",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$A \\cap B = \\{2, 4\\}$$\n$$(A \\cap B) \\cap C = \\{2, 4\\} \\cap \\{3, 4, 5, 6\\} = \\{4\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$B \\cap C = \\{2, 4, 6, 8\\} \\cap \\{3, 4, 5, 6\\} = \\{4, 6\\}$$\n$$A \\cap (B \\cap C) = \\{1, 2, 3, 4\\} \\cap \\{4, 6\\} = \\{4\\}$$\n\n$$\\text{Since LHS} = \\text{RHS} = \\{4\\}, \\text{ hence verified.}$$",
            explanation: "Changing the grouping brackets does not change the common elements of three sets."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Verify the Distributive Property of Intersection over Union: $A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)$ for $A = \\{1, 2, 3, 4\\}$, $B = \\{2, 4, 6, 8\\}$, and $C = \\{3, 4, 5, 6\\}$.",
        parts: [
          {
            partNumber: "i",
            partText: "Step-by-step verification of LHS and RHS",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$B \\cup C = \\{2, 4, 6, 8\\} \\cup \\{3, 4, 5, 6\\} = \\{2, 3, 4, 5, 6, 8\\}$$\n$$A \\cap (B \\cup C) = \\{1, 2, 3, 4\\} \\cap \\{2, 3, 4, 5, 6, 8\\} = \\{2, 3, 4\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A \\cap B = \\{1, 2, 3, 4\\} \\cap \\{2, 4, 6, 8\\} = \\{2, 4\\}$$\n$$A \\cap C = \\{1, 2, 3, 4\\} \\cap \\{3, 4, 5, 6\\} = \\{3, 4\\}$$\n$$(A \\cap B) \\cup (A \\cap C) = \\{2, 4\\} \\cup \\{3, 4\\} = \\{2, 3, 4\\}$$\n\n$$\\text{Since LHS} = \\text{RHS} = \\{2, 3, 4\\}, \\text{ the distributive property is verified.}$$",
            explanation: "Distributing intersection over union works just like multiplying through parentheses in regular algebra."
          }
        ]
      },
      {
        questionNumber: "Q.3",
        questionText: "If the Universal Set $U = \\{x \\mid x \\in \\mathbb{N} \\wedge x \\le 10\\}$, $A = \\{2, 3, 5, 7\\}$, and $B = \\{1, 3, 5, 7, 9\\}$, verify De Morgan's Laws:",
        parts: [
          {
            partNumber: "i",
            partText: "(A \\cup B)' = A' \\cap B'",
            solution: "$$U = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10\\}$$\n\n$$\\mathbf{\\text{LHS:}}$$\n$$A \\cup B = \\{2, 3, 5, 7\\} \\cup \\{1, 3, 5, 7, 9\\} = \\{1, 2, 3, 5, 7, 9\\}$$\n$$(A \\cup B)' = U - (A \\cup B) = \\{4, 6, 8, 10\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A' = U - A = \\{1, 4, 6, 8, 9, 10\\}$$\n$$B' = U - B = \\{2, 4, 6, 8, 10\\}$$\n$$A' \\cap B' = \\{1, 4, 6, 8, 9, 10\\} \\cap \\{2, 4, 6, 8, 10\\} = \\{4, 6, 8, 10\\}$$\n\n$$\\text{LHS} = \\text{RHS} = \\{4, 6, 8, 10\\} \\implies \\text{Verified.}$$",
            explanation: "Everything outside the union $(A \\cup B)'$ is the same as the common area outside both sets ($A' \\cap B'$)."
          },
          {
            partNumber: "ii",
            partText: "(A \\cap B)' = A' \\cup B'",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$A \\cap B = \\{2, 3, 5, 7\\} \\cap \\{1, 3, 5, 7, 9\\} = \\{3, 5, 7\\}$$\n$$(A \\cap B)' = U - \\{3, 5, 7\\} = \\{1, 2, 4, 6, 8, 9, 10\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A' \\cup B' = \\{1, 4, 6, 8, 9, 10\\} \\cup \\{2, 4, 6, 8, 10\\} = \\{1, 2, 4, 6, 8, 9, 10\\}$$\n\n$$\\text{LHS} = \\text{RHS} = \\{1, 2, 4, 6, 8, 9, 10\\} \\implies \\text{Verified.}$$",
            explanation: "Everything outside the intersection $(A \\cap B)'$ is the same as combining everything outside $A$ and everything outside $B$ ($A' \\cup B'$)."
          }
        ]
      },
      {
        questionNumber: "Q.4",
        questionText: "Verify the Distributive Property of Union over Intersection: $A \\cup (B \\cap C) = (A \\cup B) \\cap (A \\cup C)$ for $A = \\{1, 2, 3\\}$, $B = \\{2, 4, 6\\}$, and $C = \\{1, 3, 5, 7\\}$.",
        parts: [
          {
            partNumber: "i",
            partText: "Step-by-step verification",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$B \\cap C = \\{2, 4, 6\\} \\cap \\{1, 3, 5, 7\\} = \\emptyset$$\n$$A \\cup (B \\cap C) = \\{1, 2, 3\\} \\cup \\emptyset = \\{1, 2, 3\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A \\cup B = \\{1, 2, 3\\} \\cup \\{2, 4, 6\\} = \\{1, 2, 3, 4, 6\\}$$\n$$A \\cup C = \\{1, 2, 3\\} \\cup \\{1, 3, 5, 7\\} = \\{1, 2, 3, 5, 7\\}$$\n$$(A \\cup B) \\cap (A \\cup C) = \\{1, 2, 3, 4, 6\\} \\cap \\{1, 2, 3, 5, 7\\} = \\{1, 2, 3\\}$$\n\n$$\\text{LHS} = \\text{RHS} = \\{1, 2, 3\\} \\implies \\text{Verified.}$$",
            explanation: "Distributive law works even when the sets share no common elements."
          }
        ]
      },
      {
        questionNumber: "Q.5",
        questionText: "If $U = \\{x \\mid x \\in \\mathbb{W} \\wedge x \\le 20\\}$, $A = \\{x \\mid x \\text{ is prime } \\wedge x \\le 20\\}$, and $B = \\{x \\mid x \\text{ is odd } \\wedge x \\le 20\\}$, verify $(A \\cup B)' = A' \\cap B'$.",
        parts: [
          {
            partNumber: "i",
            partText: "De Morgan's Verification for primes and odds up to 20",
            solution: "$$U = \\{0, 1, 2, 3, \\dots, 20\\}$$\n$$A = \\{2, 3, 5, 7, 11, 13, 17, 19\\}$$\n$$B = \\{1, 3, 5, 7, 9, 11, 13, 15, 17, 19\\}$$\n\n$$\\mathbf{\\text{LHS:}}$$\n$$A \\cup B = \\{1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19\\}$$\n$$(A \\cup B)' = U - (A \\cup B) = \\{0, 4, 6, 8, 10, 12, 14, 16, 18, 20\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A' = \\{0, 1, 4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20\\}$$\n$$B' = \\{0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20\\}$$\n$$A' \\cap B' = \\{0, 4, 6, 8, 10, 12, 14, 16, 18, 20\\}$$\n\n$$\\text{LHS} = \\text{RHS} \\implies \\text{Verified.}$$",
            explanation: "Subtracting all primes and odd numbers from whole numbers leaves only even non-prime numbers and $0$."
          }
        ]
      }
    ]
  },

  // ==========================================
  // EXERCISE 17.4
  // ==========================================
  {
    classLevel: "X",
    chapterNumber: 17,
    exerciseNumber: "Exercise 17.4",
    title: "Sets and Functions - Exercise 17.4",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "If $A$ and $B$ are any two subsets of $U$, draw and describe Venn diagrams representing $A \\cup B$, $A \\cap B$, $A \\Delta B$, and $A - B$ under the following conditions:",
        parts: [
          {
            partNumber: "i",
            partText: "A and B are disjoint sets (A \\cap B = \\emptyset)",
            solution: `${drawVennGrid([
              drawVennDisjoint({
                title: "A ∪ B",
                setA: "A",
                setB: "B",
                shaded: "union",
                caption: "Both distinct circles A and B are completely shaded.",
              }),
              drawVennDisjoint({
                title: "A ∩ B = ∅",
                setA: "A",
                setB: "B",
                shaded: "none",
                caption: "Neither circle is shaded (Result is empty ∅).",
              }),
              drawVennDisjoint({
                title: "A Δ B",
                setA: "A",
                setB: "B",
                shaded: "symDiff",
                caption: "Both circles A and B are shaded (No overlap to exclude).",
              }),
              drawVennDisjoint({
                title: "A − B",
                setA: "A",
                setB: "B",
                shaded: "diffAB",
                caption: "Only circle A is shaded; circle B remains unshaded.",
              }),
            ])}

- **$A \\cup B$:** Both distinct circles $A$ and $B$ are completely shaded.
- **$A \\cap B$:** Neither circle is shaded (result is $\\emptyset$).
- **$A \\Delta B$:** Both circles $A$ and $B$ are shaded since there is no common region to exclude.
- **$A - B$:** Entire circle $A$ is shaded, while circle $B$ is unshaded.`,
            explanation: "Disjoint sets do not share any numbers, so their circles are drawn completely separate from each other."
          },
          {
            partNumber: "ii",
            partText: "A and B are overlapping sets",
            solution: `${drawVennGrid([
              drawVennOverlapping({
                title: "A ∪ B",
                setA: "A",
                setB: "B",
                shaded: "union",
                caption: "The entire combined area of both intersecting circles is shaded.",
              }),
              drawVennOverlapping({
                title: "A ∩ B",
                setA: "A",
                setB: "B",
                shaded: "intersection",
                caption: "Only the shared central football-shaped intersection is shaded.",
              }),
              drawVennOverlapping({
                title: "A Δ B",
                setA: "A",
                setB: "B",
                shaded: "symDiff",
                caption: "Both outer exclusive crescents are shaded; overlap is unshaded.",
              }),
              drawVennOverlapping({
                title: "A − B",
                setA: "A",
                setB: "B",
                shaded: "diffAB",
                caption: "Only the exclusive left crescent of circle A is shaded.",
              }),
            ])}

- **$A \\cup B$:** The entire combined area of both intersecting circles is shaded.
- **$A \\cap B$:** Only the shared central football-shaped intersection is shaded.
- **$A \\Delta B$:** Both outer exclusive crescents of $A$ and $B$ are shaded; the central overlap is unshaded.
- **$A - B$:** Only the exclusive crescent of circle $A$ (excluding the overlap with $B$) is shaded.`,
            explanation: "Overlapping sets share some common numbers, so their circles cross each other in the middle."
          },
          {
            partNumber: "iii",
            partText: "A is a subset of B (A \\subseteq B)",
            solution: `${drawVennGrid([
              drawVennSubset({
                title: "A ∪ B = B",
                outerSet: "B",
                innerSet: "A",
                shaded: "union",
                caption: "Entire outer circle B (including A) is completely shaded.",
              }),
              drawVennSubset({
                title: "A ∩ B = A",
                outerSet: "B",
                innerSet: "A",
                shaded: "intersection",
                caption: "Inner circle A is shaded.",
              }),
              drawVennSubset({
                title: "A − B = ∅",
                outerSet: "B",
                innerSet: "A",
                shaded: "none",
                caption: "Nothing is shaded since all elements of A belong to B.",
              }),
              drawVennSubset({
                title: "B − A",
                outerSet: "B",
                innerSet: "A",
                shaded: "annular",
                caption: "The annular (doughnut) region inside B outside A is shaded.",
              }),
            ])}

- Circle $A$ lies entirely inside circle $B$.
- **$A \\cup B = B$:** Entire outer circle $B$ is shaded.
- **$A \\cap B = A$:** Inner circle $A$ is shaded.
- **$A - B = \\emptyset$:** Nothing is shaded.
- **$B - A$:** The annular region inside $B$ but outside $A$ is shaded.`,
            explanation: "Because every number in set A is inside set B, circle A is drawn completely inside circle B."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "Verify the Commutative Property of Union and Intersection using Venn diagram analysis:",
        parts: [
          {
            partNumber: "i",
            partText: "For A = {a, b, c, d, e} and B = {a, e, i, o, u}",
            solution: `${drawVennGrid([
              drawVennOverlapping({
                title: "A ∪ B = B ∪ A",
                setA: "A",
                setB: "B",
                elementsA: ["b", "c", "d"],
                elementsAB: ["a", "e"],
                elementsB: ["i", "o", "u"],
                shaded: "union",
                caption: "Combined boundary contains {a, b, c, d, e, i, o, u}",
              }),
              drawVennOverlapping({
                title: "A ∩ B = B ∩ A",
                setA: "A",
                setB: "B",
                elementsA: ["b", "c", "d"],
                elementsAB: ["a", "e"],
                elementsB: ["i", "o", "u"],
                shaded: "intersection",
                caption: "Central intersection contains {a, e}",
              }),
            ])}

$$\\mathbf{\\text{Union: }} A \\cup B = \\{a, b, c, d, e, i, o, u\\} = B \\cup A$$
$$\\mathbf{\\text{Intersection: }} A \\cap B = \\{a, e\\} = B \\cap A$$

- Venn diagram shows elements $\\{a, e\\}$ in the central intersection.
- Exclusive region of $A$ contains $\\{b, c, d\\}$, and exclusive region of $B$ contains $\\{i, o, u\\}$.
- Shaded region for $A \\cup B$ and $B \\cup A$ covers the identical combined boundary.
- Shaded region for $A \\cap B$ and $B \\cap A$ covers the identical central intersection $\\{a, e\\}$.`,
            explanation: "The shaded areas look identical for both $A \\cup B$ and $B \\cup A$, proving the order does not matter."
          },
          {
            partNumber: "ii",
            partText: "For P = {1, 2, 3, ..., 10} and Q = {2, 4, 6, 8, 10}",
            solution: `${drawVennGrid([
              drawVennSubset({
                title: "P ∪ Q = Q ∪ P = P",
                outerSet: "P",
                innerSet: "Q",
                elementsInner: ["2, 4, 6, 8, 10"],
                elementsOuter: ["1, 3, 5, 7, 9"],
                shaded: "union",
                caption: "Entire circle P is shaded: {1, 2, 3, ..., 10}",
              }),
              drawVennSubset({
                title: "P ∩ Q = Q ∩ P = Q",
                outerSet: "P",
                innerSet: "Q",
                elementsInner: ["2, 4, 6, 8, 10"],
                elementsOuter: ["1, 3, 5, 7, 9"],
                shaded: "intersection",
                caption: "Inner circle Q is shaded: {2, 4, 6, 8, 10}",
              }),
            ])}

$$Q \\subseteq P$$
$$\\mathbf{\\text{Union: }} P \\cup Q = P = \\{1, 2, 3, \\dots, 10\\} = Q \\cup P$$
$$\\mathbf{\\text{Intersection: }} P \\cap Q = Q = \\{2, 4, 6, 8, 10\\} = Q \\cap P$$

- Concentric Venn diagram with $Q$ inside $P$.
- Union shades the entire circle $P$.
- Intersection shades only the inner circle $Q$.`,
            explanation: "Because Q is inside P, circle Q sits inside circle P. Uniting them shades all of P, and intersecting them shades only Q."
          }
        ]
      },
      {
        questionNumber: "Q.3",
        questionText: "Verify De Morgan's Laws using Venn diagram for $A = \\{1, 3, 5, 7, 9\\}$, $B = \\{5, 6, 7, 8\\}$, and universal set $U = \\{1, 2, 3, \\dots, 10\\}$:",
        parts: [
          {
            partNumber: "i",
            partText: "(A \\cup B)' = A' \\cap B'",
            solution: `${drawVennGrid([
              drawVennOverlapping({
                title: "LHS: (A ∪ B)'",
                setA: "A",
                setB: "B",
                elementsA: ["1", "3", "9"],
                elementsAB: ["5", "7"],
                elementsB: ["6", "8"],
                elementsU: ["2", "4", "10"],
                shaded: "compUnion",
                caption: "Exterior shaded region: {2, 4, 10}",
              }),
              drawVennOverlapping({
                title: "RHS: A' ∩ B'",
                setA: "A",
                setB: "B",
                elementsA: ["1", "3", "9"],
                elementsAB: ["5", "7"],
                elementsB: ["6", "8"],
                elementsU: ["2", "4", "10"],
                shaded: "compUnion",
                caption: "Intersection of complements: {2, 4, 10}",
              }),
            ])}

$$A \\cup B = \\{1, 3, 5, 6, 7, 8, 9\\}$$
$$(A \\cup B)' = U - (A \\cup B) = \\{2, 4, 10\\}$$

$$A' = U - A = \\{2, 4, 6, 8, 10\\}$$
$$B' = U - B = \\{1, 2, 3, 4, 9, 10\\}$$
$$A' \\cap B' = \\{2, 4, 10\\}$$

$$\\text{In the Venn diagram, the region outside both circles } A \\text{ and } B \\text{ contains } \\{2, 4, 10\\} \\text{ and is shaded identically in both figures.}$$`,
            explanation: "In both diagrams, the area outside both circles is shaded, showing that $(A \\cup B)' = A' \\cap B'$."
          },
          {
            partNumber: "ii",
            partText: "(A \\cap B)' = A' \\cup B'",
            solution: `${drawVennGrid([
              drawVennOverlapping({
                title: "LHS: (A ∩ B)'",
                setA: "A",
                setB: "B",
                elementsA: ["1", "3", "9"],
                elementsAB: ["5", "7"],
                elementsB: ["6", "8"],
                elementsU: ["2", "4", "10"],
                shaded: "compInter",
                caption: "Everything shaded except central {5, 7}",
              }),
              drawVennOverlapping({
                title: "RHS: A' ∪ B'",
                setA: "A",
                setB: "B",
                elementsA: ["1", "3", "9"],
                elementsAB: ["5", "7"],
                elementsB: ["6", "8"],
                elementsU: ["2", "4", "10"],
                shaded: "compInter",
                caption: "Everything shaded except central {5, 7}",
              }),
            ])}

$$A \\cap B = \\{5, 7\\}$$
$$(A \\cap B)' = U - \\{5, 7\\} = \\{1, 2, 3, 4, 6, 8, 9, 10\\}$$

$$A' \\cup B' = \\{2, 4, 6, 8, 10\\} \\cup \\{1, 2, 3, 4, 9, 10\\} = \\{1, 2, 3, 4, 6, 8, 9, 10\\}$$

$$\\text{In the Venn diagram, everything is shaded except the central intersection } \\{5, 7\\}.$$`,
            explanation: "In both diagrams, the entire box is shaded except the middle intersection, showing that $(A \\cap B)' = A' \\cup B'$."
          }
        ]
      },
      {
        questionNumber: "Q.4",
        questionText: "Verify Associative and Distributive Laws using Venn diagrams for three sets: $A = \\{1, 2, 3, \\dots, 8\\}$, $B = \\{4, 6, 7, 8, 9, 10\\}$, and $C = \\{5, 7, 9, 11\\}$:",
        parts: [
          {
            partNumber: "i",
            partText: "A \\cup (B \\cup C) = (A \\cup B) \\cup C",
            solution: `${drawVennGrid([
              drawVenn3Sets({
                title: "LHS: A ∪ (B ∪ C)",
                setA: "A",
                setB: "B",
                setC: "C",
                shaded: "unionAll",
                caption: "All 7 sectors shaded identically",
              }),
              drawVenn3Sets({
                title: "RHS: (A ∪ B) ∪ C",
                setA: "A",
                setB: "B",
                setC: "C",
                shaded: "unionAll",
                caption: "All 7 sectors shaded identically",
              }),
            ])}

$$B \\cup C = \\{4, 5, 6, 7, 8, 9, 10, 11\\}$$
$$A \\cup (B \\cup C) = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11\\}$$
$$(A \\cup B) \\cup C = \\{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11\\}$$

$$\\text{Venn diagram for 3 sets: Shading covers all 7 interior sectors of the three circles.}$$`,
            explanation: "All 3 circles are fully shaded in both cases, showing that grouping order does not change the union."
          },
          {
            partNumber: "ii",
            partText: "A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)",
            solution: `${drawVennGrid([
              drawVenn3Sets({
                title: "LHS: A ∩ (B ∪ C)",
                setA: "A",
                setB: "B",
                setC: "C",
                shaded: "interA_unionBC",
                caption: "Overlap of circle A with (B ∪ C) shaded",
              }),
              drawVenn3Sets({
                title: "RHS: (A ∩ B) ∪ (A ∩ C)",
                setA: "A",
                setB: "B",
                setC: "C",
                shaded: "interAB_union_interAC",
                caption: "Union of overlaps (A ∩ B) and (A ∩ C) shaded",
              }),
            ])}

$$\\mathbf{\\text{LHS:}}$$
$$B \\cup C = \\{4, 5, 6, 7, 8, 9, 10, 11\\}$$
$$A \\cap (B \\cup C) = \\{4, 5, 6, 7, 8\\}$$

$$\\mathbf{\\text{RHS:}}$$
$$A \\cap B = \\{4, 6, 7, 8\\}$$
$$A \\cap C = \\{5, 7\\}$$
$$(A \\cap B) \\cup (A \\cap C) = \\{4, 5, 6, 7, 8\\}$$

$$\\text{Venn diagram: Shaded region represents the portion of circle } A \\text{ that overlaps with either } B \\text{ or } C.$$`,
            explanation: "The shaded area shows all parts of circle A that touch either circle B or circle C."
          }
        ]
      }
    ]
  },

  // ==========================================
  // EXERCISE 17.5
  // ==========================================
  {
    classLevel: "X",
    chapterNumber: 17,
    exerciseNumber: "Exercise 17.5",
    title: "Sets and Functions - Exercise 17.5",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Find the values of $x$ and $y$ for the following equal ordered pairs:",
        parts: [
          {
            partNumber: "i",
            partText: "(x - 5, 10) = (11, y - 7)",
            solution: "$$x - 5 = 11 \\implies x = 11 + 5 = 16$$\n$$10 = y - 7 \\implies y = 10 + 7 = 17$$\n\n$$\\mathbf{x = 16, \\quad y = 17}$$",
            explanation: "For two ordered pairs to be equal, the first elements must match each other and the second elements must match each other."
          },
          {
            partNumber: "ii",
            partText: "(5x + 8, 5y - 4) = (3x + 10, 2y + 2)",
            solution: "$$5x + 8 = 3x + 10 \\implies 5x - 3x = 10 - 8 \\implies 2x = 2 \\implies x = 1$$\n$$5y - 4 = 2y + 2 \\implies 5y - 2y = 2 + 4 \\implies 3y = 6 \\implies y = 2$$\n\n$$\\mathbf{x = 1, \\quad y = 2}$$",
            explanation: "Set the first values equal to find $x$, and set the second values equal to find $y$."
          },
          {
            partNumber: "iii",
            partText: "(2x - 3y, 5x + y) = (3, 16)",
            solution: "$$2x - 3y = 3 \\quad \\text{--- (1)}$$\n$$5x + y = 16 \\implies y = 16 - 5x \\quad \\text{--- (2)}$$\n\nSubstitute (2) into (1):\n$$2x - 3(16 - 5x) = 3$$\n$$2x - 48 + 15x = 3$$\n$$17x = 51 \\implies x = 3$$\n\nFrom (2): $$y = 16 - 5(3) = 16 - 15 = 1$$\n\n$$\\mathbf{x = 3, \\quad y = 1}$$",
            explanation: "Set the first values equal and second values equal, then solve the two equations together."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "If set $P$ has $10$ elements and set $Q$ has $15$ elements, find the number of elements in $P \\times Q$, $Q \\times P$, and $P \\times P$.",
        parts: [
          {
            partNumber: "i",
            partText: "Calculate Cardinalities of Cartesian Products",
            solution: "$$n(P \\times Q) = n(P) \\times n(Q) = 10 \\times 15 = 150$$\n$$n(Q \\times P) = n(Q) \\times n(P) = 15 \\times 10 = 150$$\n$$n(P \\times P) = n(P) \\times n(P) = 10 \\times 10 = 100$$",
            explanation: "To find the total number of pairs in $A \\times B$, simply multiply the number of items in $A$ by the number of items in $B$."
          }
        ]
      },
      {
        questionNumber: "Q.3",
        questionText: "If $A = \\{1, 2\\}$, $B = \\{2, 3\\}$, and $C = \\{1, 3, 5\\}$, find the following Cartesian products:",
        parts: [
          {
            partNumber: "i",
            partText: "A \\times B",
            solution: "$$A \\times B = \\{1, 2\\} \\times \\{2, 3\\} = \\{(1, 2), (1, 3), (2, 2), (2, 3)\\}$$",
            explanation: "Pair every item in set A with every item in set B."
          },
          {
            partNumber: "ii",
            partText: "B \\times C",
            solution: "$$B \\times C = \\{2, 3\\} \\times \\{1, 3, 5\\} = \\{(2, 1), (2, 3), (2, 5), (3, 1), (3, 3), (3, 5)\\}$$",
            explanation: "Pair every item in set B with every item in set C."
          },
          {
            partNumber: "iii",
            partText: "A \\times (B \\cup C)",
            solution: "$$B \\cup C = \\{1, 2, 3, 5\\}$$\n$$A \\times (B \\cup C) = \\{1, 2\\} \\times \\{1, 2, 3, 5\\}$$\n$$= \\{(1, 1), (1, 2), (1, 3), (1, 5), (2, 1), (2, 2), (2, 3), (2, 5)\\}$$",
            explanation: "First combine B and C into one set, then pair each element of A with every element in that new set."
          },
          {
            partNumber: "iv",
            partText: "B \\times (A \\cup C)",
            solution: "$$A \\cup C = \\{1, 2, 3, 5\\}$$\n$$B \\times (A \\cup C) = \\{2, 3\\} \\times \\{1, 2, 3, 5\\}$$\n$$= \\{(2, 1), (2, 2), (2, 3), (2, 5), (3, 1), (3, 2), (3, 3), (3, 5)\\}$$",
            explanation: "First combine A and C into one set, then pair each element of B with every element in that new set."
          },
          {
            partNumber: "v",
            partText: "(A \\cap B) \\times (B \\cap C)",
            solution: "$$A \\cap B = \\{2\\}$$\n$$B \\cap C = \\{3\\}$$\n$$(A \\cap B) \\times (B \\cap C) = \\{2\\} \\times \\{3\\} = \\{(2, 3)\\}$$",
            explanation: "First find the common elements for each bracket, then make ordered pairs from the results."
          }
        ]
      },
      {
        questionNumber: "Q.4",
        questionText: "If $A = \\{5, 6\\}$ and $B = \\{1, 2, 3\\}$, find the following binary relations:",
        parts: [
          {
            partNumber: "i",
            partText: "Three relations in A \\times B",
            solution: "$$A \\times B = \\{(5, 1), (5, 2), (5, 3), (6, 1), (6, 2), (6, 3)\\}$$\n$$R_1 = \\{(5, 1), (5, 2)\\}$$\n$$R_2 = \\{(5, 3), (6, 1)\\}$$\n$$R_3 = \\{(6, 2)\\}$$",
            explanation: "A relation is just any collection of pairs chosen from $A \\times B$."
          },
          {
            partNumber: "ii",
            partText: "Four relations in B \\times A",
            solution: "$$B \\times A = \\{(1, 5), (1, 6), (2, 5), (2, 6), (3, 5), (3, 6)\\}$$\n$$R_1 = \\{(1, 5), (1, 6)\\}$$\n$$R_2 = \\{(1, 5), (2, 5), (3, 6)\\}$$\n$$R_3 = \\{(2, 5), (2, 6), (3, 5)\\}$$\n$$R_4 = \\{(3, 6)\\}$$",
            explanation: "Pick any collection of pairs from $B \\times A$ to make a relation."
          },
          {
            partNumber: "iii",
            partText: "Five relations in B (i.e. B \\times B)",
            solution: "$$B \\times B = \\{(1, 1), (1, 2), (1, 3), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (3, 3)\\}$$\n$$R_1 = \\{(1, 1)\\}$$\n$$R_2 = \\{(1, 1), (1, 2)\\}$$\n$$R_3 = \\{(2, 2), (3, 3)\\}$$\n$$R_4 = \\{(1, 3), (2, 1), (2, 2)\\}$$\n$$R_5 = \\{(3, 2), (3, 3)\\}$$",
            explanation: "Pick any collection of pairs from $B \\times B$ to make a relation on set B."
          },
          {
            partNumber: "iv",
            partText: "All relations in A (A \\times A)",
            solution: "$$A \\times A = \\{(5, 5), (5, 6), (6, 5), (6, 6)\\}$$\nSince $n(A \\times A) = 4$, there are $2^4 = 16$ total relations in $A$:\n**1. Empty relation:** $\\emptyset$\n**2. 1-element relations:** $\\{(5, 5)\\}$, $\\{(5, 6)\\}$, $\\{(6, 5)\\}$, $\\{(6, 6)\\}$\n**3. 2-element relations:** $\\{(5, 5), (5, 6)\\}$, $\\{(5, 5), (6, 5)\\}$, $\\{(5, 5), (6, 6)\\}$, $\\{(5, 6), (6, 5)\\}$, $\\{(5, 6), (6, 6)\\}$, $\\{(6, 5), (6, 6)\\}$\n**4. 3-element relations:** $\\{(5, 5), (5, 6), (6, 5)\\}$, $\\{(5, 5), (5, 6), (6, 6)\\}$, $\\{(5, 5), (6, 5), (6, 6)\\}$, $\\{(5, 6), (6, 5), (6, 6)\\}$\n**5. Universal relation:** $A \\times A$",
            explanation: "Since there are 4 total pairs in $A \\times A$, there are $2^4 = 16$ possible subsets (relations)."
          }
        ]
      },
      {
        questionNumber: "Q.5",
        questionText: "For two sets $A$ and $B$, if $n(A) = 3$ and $n(B) = 4$, find the total number of binary relations in $A \\times B$.",
        parts: [
          {
            partNumber: "i",
            partText: "Calculation",
            solution: "$$n(A \\times B) = n(A) \\times n(B) = 3 \\times 4 = 12$$\n$$\\text{Total number of binary relations} = 2^{n(A \\times B)} = 2^{12} = \\mathbf{4096}$$",
            explanation: "Since there are $3 \\times 4 = 12$ pairs, the total number of possible relations is $2^{12} = 4096$."
          }
        ]
      },
      {
        questionNumber: "Q.6",
        questionText: "Write the following binary relations of $A \\times B$ in tabular (roster) form where $A = \\{0, 1, 2, 3\\}$ and $B = \\{2, 4, 6, 8\\}$ such that $a \\in A$ and $b \\in B$:",
        parts: [
          {
            partNumber: "i",
            partText: "R_1 = \\{(a, b) \\mid b < 5\\}",
            solution: "$$R_1 = \\{(0, 2), (0, 4), (1, 2), (1, 4), (2, 2), (2, 4), (3, 2), (3, 4)\\}$$",
            explanation: "Keep only the pairs where the second number is less than 5 (2 or 4)."
          },
          {
            partNumber: "ii",
            partText: "R_2 = \\{(a, b) \\mid a + b = 9\\}",
            solution: "$$R_2 = \\{(1, 8), (3, 6)\\}$$",
            explanation: "Keep only the pairs where adding the first and second number equals 9."
          },
          {
            partNumber: "iii",
            partText: "R_3 = \\{(a, b) \\mid a - b = 1\\}",
            solution: "$$R_3 = \\{(3, 2)\\}$$",
            explanation: "Keep only the pairs where subtracting the second number from the first gives 1."
          }
        ]
      },
      {
        questionNumber: "Q.7",
        questionText: "If relation $R = \\{(x, y) \\mid y = 2x + 5\\}$ is in $\\mathbb{Z}$ (Integers), then:",
        parts: [
          {
            partNumber: "i",
            partText: "Find Range if Domain is {-2, -1, 0, 1, 2}",
            solution: "For $x = -2: \\quad y = 2(-2) + 5 = 1$\nFor $x = -1: \\quad y = 2(-1) + 5 = 3$\nFor $x = 0: \\quad y = 2(0) + 5 = 5$\nFor $x = 1: \\quad y = 2(1) + 5 = 7$\nFor $x = 2: \\quad y = 2(2) + 5 = 9$\n\n$$\\mathbf{\\text{Range} = \\{1, 3, 5, 7, 9\\}}$$",
            explanation: "Plug each $x$ value into $y = 2x + 5$ to calculate each output $y$."
          },
          {
            partNumber: "ii",
            partText: "Find Domain if Range is {11, 13, 15, 17}",
            solution: "$$y = 2x + 5 \\implies 2x = y - 5 \\implies x = \\frac{y - 5}{2}$$\nFor $y = 11: \\quad x = \\frac{11 - 5}{2} = 3$\nFor $y = 13: \\quad x = \\frac{13 - 5}{2} = 4$\nFor $y = 15: \\quad x = \\frac{15 - 5}{2} = 5$\nFor $y = 17: \\quad x = \\frac{17 - 5}{2} = 6$\n\n$$\\mathbf{\\text{Domain} = \\{3, 4, 5, 6\\}}$$",
            explanation: "Rearrange the formula to $x = (y - 5)/2$ and plug in each $y$ value to find $x$."
          }
        ]
      },
      {
        questionNumber: "Q.8",
        questionText: "If $x, y$ represent elements of $\\mathbb{W}$ (Whole Numbers $\\{0, 1, 2, \\dots\\}$), find the domain and range of the following relations:",
        parts: [
          {
            partNumber: "i",
            partText: "R = \\{(x, y) \\mid 3x + y = 11\\}",
            solution: "$$y = 11 - 3x$$\nSince $x, y \\in \\mathbb{W}$, $y \\ge 0 \\implies 11 - 3x \\ge 0 \\implies x \\le 3.66$:\nFor $x = 0: \\quad y = 11$\nFor $x = 1: \\quad y = 8$\nFor $x = 2: \\quad y = 5$\nFor $x = 3: \\quad y = 2$\n\n$$R = \\{(0, 11), (1, 8), (2, 5), (3, 2)\\}$$\n$$\\mathbf{\\text{Domain} = \\{0, 1, 2, 3\\}}$$\n$$\\mathbf{\\text{Range} = \\{2, 5, 8, 11\\}}$$",
            explanation: "Test whole numbers for $x$ ($0, 1, 2, 3$) so that $y$ stays a positive whole number."
          },
          {
            partNumber: "ii",
            partText: "R = \\{(x, y) \\mid x - y = 6\\}",
            solution: "$$x = y + 6$$\nFor any $y \\in \\mathbb{W} = \\{0, 1, 2, 3, \\dots\\}$:\nFor $y = 0: \\quad x = 6$\nFor $y = 1: \\quad x = 7$\nFor $y = 2: \\quad x = 8$\nFor $y = 3: \\quad x = 9, \\dots$\n\n$$R = \\{(6, 0), (7, 1), (8, 2), (9, 3), (10, 4), \\dots\\}$$\n$$\\mathbf{\\text{Domain} = \\{6, 7, 8, 9, 10, \\dots\\}}$$\n$$\\mathbf{\\text{Range} = \\{0, 1, 2, 3, 4, \\dots\\} = \\mathbb{W}}$$",
            explanation: "Since whole numbers go on forever, this relation continues infinitely."
          }
        ]
      },
      {
        questionNumber: "Q.9",
        questionText: "If $f: A \\to B$ is a function given by $f = \\{(1, 5), (2, 6), (3, 7), (4, 8)\\}$ where $A = \\{1, 2, 3, 4\\}$ and $B = \\mathbb{N}$ (Natural Numbers), write its domain, co-domain, and range. Also write the values of $f(2)$ and $f(4)$.",
        parts: [
          {
            partNumber: "i",
            partText: "Domain, Codomain, Range, and Function Values",
            solution: "$$\\mathbf{\\text{Domain}} = \\{1, 2, 3, 4\\} = A$$\n$$\\mathbf{\\text{Co-domain}} = \\mathbb{N} = \\{1, 2, 3, 4, 5, 6, 7, 8, \\dots\\}$$\n$$\\mathbf{\\text{Range}} = \\{5, 6, 7, 8\\}$$\n$$f(2) = 6$$\n$$f(4) = 8$$",
            explanation: "The domain is the input numbers, the codomain is all natural numbers $\\mathbb{N}$, and the range is the actual output numbers."
          }
        ]
      },
      {
        questionNumber: "Q.10",
        questionText: "If $A = \\{0, 1, 2, 3, 4\\}$ and $B = \\{2, 4, 6, 8, 10\\}$, determine whether the following relations from $A$ to $B$ are functions or not. If they are functions, identify their types:",
        parts: [
          {
            partNumber: "i",
            partText: "R_1 = \\{(0, 2), (1, 4), (2, 6), (3, 8)\\}",
            solution: "$$\\mathbf{\\text{Not a function.}}$$\nElement $4 \\in A$ is not mapped (Domain of $R_1 \\ne A$).",
            explanation: "To be a function, every single number in set A must be used. Number 4 was left out, so it is not a function."
          },
          {
            partNumber: "ii",
            partText: "R_2 = \\{(0, 10), (1, 8), (2, 6), (2, 4), (3, 4), (4, 2)\\}",
            solution: "$$\\mathbf{\\text{Not a function.}}$$\nElement $2 \\in A$ has two distinct images ($6$ and $4$).",
            explanation: "To be a function, each input can only have one output. Here the input 2 has two different outputs (6 and 4), so it is not a function."
          },
          {
            partNumber: "iii",
            partText: "R_3 = \\{(0, 2), (1, 4), (2, 6), (3, 8), (4, 8)\\}",
            solution: "$$\\mathbf{\\text{Many-to-One Into Function.}}$$\n- Every element in $A$ has a single image.\n- Distinct elements $3$ and $4$ map to the same image $8$ $\\implies$ **Many-to-One**.\n- $\\text{Range} = \\{2, 4, 6, 8\\} \\ne B$ (element $10 \\in B$ is unmapped) $\\implies$ **Into**.",
            explanation: "It is **Many-to-One** because two inputs (3 and 4) share the same output (8). It is **Into** because number 10 in set B is never used."
          },
          {
            partNumber: "iv",
            partText: "R_4 = \\{(0, 2), (1, 2), (2, 2), (3, 2), (4, 8)\\}",
            solution: "$$\\mathbf{\\text{Many-to-One Into Function.}}$$\n- Range $\\{2, 8\\} \\ne B$.",
            explanation: "It is **Many-to-One** because multiple inputs map to 2, and **Into** because some numbers in set B are not used."
          },
          {
            partNumber: "v",
            partText: "R_5 = \\{(0, 2), (1, 4), (2, 6), (3, 8), (4, 10)\\}",
            solution: "$$\\mathbf{\\text{Bijective Function (One-to-One and Onto).}}$$\n- Every element in $A$ has a unique distinct image in $B$ $\\implies$ **One-to-One (Injective)**.\n- $\\text{Range} = \\{2, 4, 6, 8, 10\\} = B$ $\\implies$ **Onto (Surjective)**.",
            explanation: "It is **One-to-One** because each input has a unique output, and **Onto** because every number in set B is used."
          }
        ]
      },
      {
        questionNumber: "Q.11",
        questionText: "Which of the following mappings represents a one-to-one function, a one-to-one correspondence (bijective), or neither?",
        parts: [
          {
            partNumber: "i",
            partText: "Mapping from {0, 1, 2} to {4, 5, 6, 7} with (0 → 4, 1 → 6, 2 → 7)",
            solution: "$$\\mathbf{\\text{One-to-One Function (Injective Into).}}$$\n- Distinct domain elements map to distinct images.\n- Not a correspondence because element $5 \\in \\text{Codomain}$ is unmapped.",
            explanation: "Each input goes to a unique output (One-to-One), but number 5 in the target set is left over, so it is not onto."
          },
          {
            partNumber: "ii",
            partText: "Mapping from {0, 1, 2} to {5, 6, 7} with (0 → 5, 1 → 6, 2 → 7)",
            solution: "$$\\mathbf{\\text{One-to-One Correspondence (Bijective).}}$$\n- Injective and surjective with equal set sizes $n(A) = n(B) = 3$.",
            explanation: "Every element has exactly one partner with no numbers left over, making it a perfect one-to-one correspondence (Bijective)."
          },
          {
            partNumber: "iii",
            partText: "Mapping with multiple elements mapping to the same image",
            solution: "$$\\mathbf{\\text{Neither One-to-One nor One-to-One Correspondence.}}$$",
            explanation: "Because more than one input goes to the same output, it is not one-to-one."
          }
        ]
      },
      {
        questionNumber: "Q.12",
        questionText: "If $P = \\{a, b, c\\}$, $Q = \\{x, y, z\\}$, and $R = \\{p, q, r, s\\}$, find:",
        parts: [
          {
            partNumber: "i",
            partText: "A function f from P into Q",
            solution: "$$f = \\{(a, x), (b, y), (c, y)\\}$$\n$$\\text{Domain}(f) = \\{a, b, c\\} = P, \\quad \\text{Range}(f) = \\{x, y\\} \\ne Q$$",
            explanation: "An into function leaves at least one element unused in the second set (z is not used here)."
          },
          {
            partNumber: "ii",
            partText: "A function g from R onto P",
            solution: "$$g = \\{(p, a), (q, b), (r, a), (s, c)\\}$$\n$$\\text{Domain}(g) = \\{p, q, r, s\\} = R, \\quad \\text{Range}(g) = \\{a, b, c\\} = P$$",
            explanation: "An onto function makes sure every single element in set P is covered."
          },
          {
            partNumber: "iii",
            partText: "A function h from P to R which is injective",
            solution: "$$h = \\{(a, p), (b, q), (c, r)\\}$$\n$$\\text{Domain}(h) = P, \\quad \\text{Distinct inputs have distinct outputs in } R.$$",
            explanation: "An injective (one-to-one) function gives every input a different output."
          },
          {
            partNumber: "iv",
            partText: "A function k from Q to P which is bijective",
            solution: "$$k = \\{(x, a), (y, b), (z, c)\\}$$\n$$\\text{Domain}(k) = Q, \\quad \\text{Range}(k) = \\{a, b, c\\} = P$$",
            explanation: "A bijective function pairs every element one-to-one with nothing left out in either set."
          }
        ]
      }
    ]
  },

  // ==========================================
  // REVIEW EXERCISE 17 (ALL 7 QUESTIONS)
  // ==========================================
  {
    classLevel: "X",
    chapterNumber: 17,
    exerciseNumber: "Review Exercise 17",
    title: "Sets and Functions - Review Exercise 17",
    questions: [
      {
        questionNumber: "Q.1",
        questionText: "Review Questions on Subsets, Power Sets, and Cardinality:",
        parts: [
          {
            partNumber: "i",
            partText: "If A = {a, b, c}, write all subsets of A and find n(P(A))",
            solution: "All subsets of $A$:\n$$\\emptyset, \\{a\\}, \\{b\\}, \\{c\\}, \\{a, b\\}, \\{a, c\\}, \\{b, c\\}, \\{a, b, c\\}$$\n\n$$P(A) = \\{ \\emptyset, \\{a\\}, \\{b\\}, \\{c\\}, \\{a, b\\}, \\{a, c\\}, \\{b, c\\}, \\{a, b, c\\} \\}$$\n$$n(P(A)) = 2^n = 2^3 = 8$$",
            explanation: "Every set has the empty set $\\emptyset$ and itself as subsets. Total subsets = $2^n = 2^3 = 8$."
          },
          {
            partNumber: "ii",
            partText: "If n(A) = 4 and n(B) = 3, find n(A × B) and total possible binary relations from A to B",
            solution: "$$n(A \\times B) = n(A) \\times n(B) = 4 \\times 3 = 12$$\n$$\\mathbf{\\text{Total number of binary relations} = 2^{n(A \\times B)} = 2^{12} = 4096}$$",
            explanation: "Multiply the set sizes to get $4 \\times 3 = 12$ pairs, then use $2^{12} = 4096$ to find all possible relations."
          },
          {
            partNumber: "iii",
            partText: "Define Universal Set, Null Set, and Singleton Set with examples",
            solution: "**1. Universal Set ($U$):** A set which contains all possible elements under discussion. Example: $U = \\{1, 2, 3, \\dots, 10\\}$.\n\n**2. Null / Empty Set ($\\emptyset$ or $\\{\\}$):** A set containing no elements. Example: $\\emptyset = \\{x \\mid x \\in \\mathbb{N} \\wedge x < 1\\}$.\n\n**3. Singleton Set:** A set containing exactly one element. Example: $S = \\{5\\}$.",
            explanation: "Universal set contains everything in the problem, null set is empty, and singleton set has only one item."
          }
        ]
      },
      {
        questionNumber: "Q.2",
        questionText: "If $A = \\{1, 2, 5\\}$, $B = \\{2, 4, 6\\}$, and universal set $U = \\{1, 2, 3, 4, 5, 6\\}$, find the following:",
        parts: [
          {
            partNumber: "a",
            partText: "A \\cup B",
            solution: "$$A \\cup B = \\{1, 2, 5\\} \\cup \\{2, 4, 6\\} = \\{1, 2, 4, 5, 6\\}$$",
            explanation: "Union combines all numbers from both sets together without repeating any."
          },
          {
            partNumber: "b",
            partText: "A \\cap B",
            solution: "$$A \\cap B = \\{1, 2, 5\\} \\cap \\{2, 4, 6\\} = \\{2\\}$$",
            explanation: "Intersection picks only the common numbers that appear in both sets."
          },
          {
            partNumber: "c",
            partText: "A \\Delta B \\text{ (Symmetric Difference)}",
            solution: "$$A \\Delta B = (A - B) \\cup (B - A) = \\{1, 5\\} \\cup \\{4, 6\\} = \\{1, 4, 5, 6\\}$$",
            explanation: "Symmetric difference takes all numbers that belong to only one set, leaving out the common overlap."
          },
          {
            partNumber: "d",
            partText: "A - B",
            solution: "$$A - B = \\{1, 2, 5\\} - \\{2, 4, 6\\} = \\{1, 5\\}$$",
            explanation: "Difference $A - B$ takes set A and removes any numbers that are also in B."
          },
          {
            partNumber: "e",
            partText: "A' \\text{ (Complement of A)}",
            solution: "$$A' = U - A = \\{1, 2, 3, 4, 5, 6\\} - \\{1, 2, 5\\} = \\{3, 4, 6\\}$$",
            explanation: "Complement $A'$ takes all numbers in the universal set $U$ except those in set A."
          },
          {
            partNumber: "f",
            partText: "B' \\text{ (Complement of B)}",
            solution: "$$B' = U - B = \\{1, 2, 3, 4, 5, 6\\} - \\{2, 4, 6\\} = \\{1, 3, 5\\}$$",
            explanation: "Complement $B'$ takes all numbers in the universal set $U$ except those in set B."
          }
        ]
      },
      {
        questionNumber: "Q.3",
        questionText: "Verify De Morgan's Laws for the sets of Question 2: $A = \\{1, 2, 5\\}$, $B = \\{2, 4, 6\\}$, and $U = \\{1, 2, 3, 4, 5, 6\\}$:",
        parts: [
          {
            partNumber: "i",
            partText: "(A \\cup B)' = A' \\cap B'",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$A \\cup B = \\{1, 2, 4, 5, 6\\}$$\n$$(A \\cup B)' = U - (A \\cup B) = \\{1, 2, 3, 4, 5, 6\\} - \\{1, 2, 4, 5, 6\\} = \\{3\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A' = U - A = \\{3, 4, 6\\}$$\n$$B' = U - B = \\{1, 3, 5\\}$$\n$$A' \\cap B' = \\{3, 4, 6\\} \\cap \\{1, 3, 5\\} = \\{3\\}$$\n\n$$\\text{Since LHS} = \\text{RHS} = \\{3\\}, \\mathbf{(A \\cup B)' = A' \\cap B' \\text{ is Proved.}}$$",
            explanation: "Everything outside the union $(A \\cup B)'$ is identical to the common numbers outside both sets ($A' \\cap B'$)."
          },
          {
            partNumber: "ii",
            partText: "(A \\cap B)' = A' \\cup B'",
            solution: "$$\\mathbf{\\text{LHS:}}$$\n$$A \\cap B = \\{2\\}$$\n$$(A \\cap B)' = U - (A \\cap B) = \\{1, 2, 3, 4, 5, 6\\} - \\{2\\} = \\{1, 3, 4, 5, 6\\}$$\n\n$$\\mathbf{\\text{RHS:}}$$\n$$A' = \\{3, 4, 6\\}, \\quad B' = \\{1, 3, 5\\}$$\n$$A' \\cup B' = \\{3, 4, 6\\} \\cup \\{1, 3, 5\\} = \\{1, 3, 4, 5, 6\\}$$\n\n$$\\text{Since LHS} = \\text{RHS} = \\{1, 3, 4, 5, 6\\}, \\mathbf{(A \\cap B)' = A' \\cup B' \\text{ is Proved.}}$$",
            explanation: "Everything outside the intersection $(A \\cap B)'$ is identical to combining everything outside $A$ and everything outside $B$ ($A' \\cup B'$)."
          }
        ]
      },
      {
        questionNumber: "Q.4",
        questionText: "Verify the Commutative Properties of Union and Intersection for the sets $A = \\{a, b, d\\}$ and $B = \\{a, d, e\\}$:",
        parts: [
          {
            partNumber: "i",
            partText: "A \\cup B = B \\cup A",
            solution: "$$\\mathbf{\\text{LHS:}} \\quad A \\cup B = \\{a, b, d\\} \\cup \\{a, d, e\\} = \\{a, b, d, e\\}$$\n$$\\mathbf{\\text{RHS:}} \\quad B \\cup A = \\{a, d, e\\} \\cup \\{a, b, d\\} = \\{a, b, d, e\\}$$\n$$\\text{LHS} = \\text{RHS} \\implies \\mathbf{A \\cup B = B \\cup A \\text{ Proved.}}$$",
            explanation: "Changing the order of sets in a union gives the exact same result."
          },
          {
            partNumber: "ii",
            partText: "A \\cap B = B \\cap A",
            solution: "$$\\mathbf{\\text{LHS:}} \\quad A \\cap B = \\{a, b, d\\} \\cap \\{a, d, e\\} = \\{a, d\\}$$\n$$\\mathbf{\\text{RHS:}} \\quad B \\cap A = \\{a, d, e\\} \\cap \\{a, b, d\\} = \\{a, d\\}$$\n$$\\text{LHS} = \\text{RHS} \\implies \\mathbf{A \\cap B = B \\cap A \\text{ Proved.}}$$",
            explanation: "Changing the order of sets in an intersection gives the exact same result."
          }
        ]
      },
      {
        questionNumber: "Q.5",
        questionText: "For sets $P = \\{1, 3, 5\\}$ and $Q = \\{1, 3, 7\\}$, represent the following sets by using Venn diagrams:",
        parts: [
          {
            partNumber: "a",
            partText: "P \\cup Q",
            solution: `${drawVennGrid([
              drawVennOverlapping({
                title: "P ∪ Q",
                setA: "P",
                setB: "Q",
                elementsA: ["5"],
                elementsAB: ["1", "3"],
                elementsB: ["7"],
                shaded: "union",
                caption: "P ∪ Q = {1, 3, 5, 7} (Both circles shaded)",
              }),
            ])}

$$P \\cup Q = \\{1, 3, 5\\} \\cup \\{1, 3, 7\\} = \\mathbf{\\{1, 3, 5, 7\\}}$$

- **Elements:** Exclusive region of $P$ contains $\\{5\\}$, exclusive region of $Q$ contains $\\{7\\}$, and central intersection contains $\\{1, 3\\}$.
- **Shading:** The entire combined interior of both circles $P$ and $Q$ is completely shaded.`,
            explanation: "In the Venn diagram, both circles P and Q are completely shaded to show all combined elements."
          },
          {
            partNumber: "b",
            partText: "P \\cap Q",
            solution: `${drawVennGrid([
              drawVennOverlapping({
                title: "P ∩ Q",
                setA: "P",
                setB: "Q",
                elementsA: ["5"],
                elementsAB: ["1", "3"],
                elementsB: ["7"],
                shaded: "intersection",
                caption: "P ∩ Q = {1, 3} (Central overlap shaded)",
              }),
            ])}

$$P \\cap Q = \\{1, 3, 5\\} \\cap \\{1, 3, 7\\} = \\mathbf{\\{1, 3\\}}$$

- **Elements:** Shared central region contains $\\{1, 3\\}$.
- **Shading:** Only the central overlapping lens is shaded.`,
            explanation: "In the Venn diagram, only the middle overlapping part is shaded to show the shared numbers {1, 3}."
          },
          {
            partNumber: "c",
            partText: "P \\Delta Q \\text{ (Symmetric Difference)}",
            solution: `${drawVennGrid([
              drawVennOverlapping({
                title: "P Δ Q",
                setA: "P",
                setB: "Q",
                elementsA: ["5"],
                elementsAB: ["1", "3"],
                elementsB: ["7"],
                shaded: "symDiff",
                caption: "P Δ Q = {5, 7} (Both crescents shaded)",
              }),
            ])}

$$P \\Delta Q = (P - Q) \\cup (Q - P) = \\{5\\} \\cup \\{7\\} = \\mathbf{\\{5, 7\\}}$$

- **Elements:** Non-overlapping regions contain $\\{5\\}$ and $\\{7\\}$.
- **Shading:** Both outer exclusive crescents are shaded; central intersection $\\{1, 3\\}$ remains unshaded.`,
            explanation: "In the Venn diagram, both side crescents are shaded while the middle overlap is left blank."
          },
          {
            partNumber: "d",
            partText: "P - Q",
            solution: `${drawVennGrid([
              drawVennOverlapping({
                title: "P − Q",
                setA: "P",
                setB: "Q",
                elementsA: ["5"],
                elementsAB: ["1", "3"],
                elementsB: ["7"],
                shaded: "diffAB",
                caption: "P − Q = {5} (Exclusive crescent P shaded)",
              }),
            ])}

$$P - Q = \\{1, 3, 5\\} - \\{1, 3, 7\\} = \\mathbf{\\{5\\}}$$

- **Elements:** Exclusive left region of $P$ contains $\\{5\\}$.
- **Shading:** Only the exclusive left crescent of circle $P$ is shaded.`,
            explanation: "In the Venn diagram, only the exclusive part of circle P is shaded, excluding the common numbers."
          }
        ]
      },
      {
        questionNumber: "Q.6",
        questionText: "If $A = \\{a, c\\}$ and $B = \\{b, d\\}$, then find:",
        parts: [
          {
            partNumber: "a",
            partText: "Two relations in A",
            solution: "$$A \\times A = \\{a, c\\} \\times \\{a, c\\} = \\{(a, a), (a, c), (c, a), (c, c)\\}$$\n$$R_1 = \\{(a, a)\\}$$\n$$R_2 = \\{(a, c), (c, a)\\}$$",
            explanation: "Pick any subset of pairs from $A \\times A$ to create a relation in A."
          },
          {
            partNumber: "b",
            partText: "Three relations in B",
            solution: "$$B \\times B = \\{b, d\\} \\times \\{b, d\\} = \\{(b, b), (b, d), (d, b), (d, d)\\}$$\n$$R_1 = \\{(b, d), (d, d)\\}$$\n$$R_2 = \\{(d, d)\\}$$\n$$R_3 = \\{(b, d), (d, b), (d, d)\\}$$",
            explanation: "Pick any subset of pairs from $B \\times B$ to create a relation in B."
          },
          {
            partNumber: "c",
            partText: "Three relations in A × B",
            solution: "$$A \\times B = \\{a, c\\} \\times \\{b, d\\} = \\{(a, b), (a, d), (c, b), (c, d)\\}$$\n$$R_1 = \\{(a, b)\\}$$\n$$R_2 = \\{(a, b), (a, d)\\}$$\n$$R_3 = \\{(c, d)\\}$$",
            explanation: "Pick any subset of pairs from $A \\times B$ to create a relation from A to B."
          },
          {
            partNumber: "d",
            partText: "Two relations in A ∪ B",
            solution: "$$A \\cup B = \\{a, c\\} \\cup \\{b, d\\} = \\{a, b, c, d\\}$$\n$$(A \\cup B) \\times (A \\cup B) = 16 \\text{ ordered pairs}$$\n$$R_1 = \\{(a, a), (a, c)\\}$$\n$$R_2 = \\{(a, a), (a, b), (a, d)\\}$$",
            explanation: "First combine A and B, then choose any subset of pairs to create a relation."
          }
        ]
      },
      {
        questionNumber: "Q.7",
        questionText: "If $A = \\{1, 2, 5\\}$ and $B = \\{6, 8\\}$, find a function from $A$ to $B$ which is (a) Onto function, and (b) Into function:",
        parts: [
          {
            partNumber: "a",
            partText: "Onto function (Surjective)",
            solution: "$$f_1 = \\{(1, 6), (2, 8), (5, 8)\\}$$\n$$\\text{Domain}(f_1) = \\{1, 2, 5\\} = A$$\n$$\\text{Range}(f_1) = \\{6, 8\\} = B$$\nSince $\\text{Range}(f_1) = \\text{Codomain}(B)$, $f_1$ is an **Onto (Surjective) function**.",
            explanation: "In an Onto function, every number in the target set B is used as an output."
          },
          {
            partNumber: "b",
            partText: "Into function",
            solution: "$$f_2 = \\{(1, 6), (2, 6), (5, 6)\\}$$\n$$\\text{Domain}(f_2) = \\{1, 2, 5\\} = A$$\n$$\\text{Range}(f_2) = \\{6\\} \\ne B$$\nSince $\\text{Range}(f_2)$ is a proper subset of $B$ (element $8 \\in B$ is unmapped), $f_2$ is an **Into function**.\n\n*(Alternatively, $f_3 = \\{(1, 8), (2, 8), (5, 8)\\}$ is also an into function)*.",
            explanation: "In an Into function, at least one number in the target set B is left unused (number 8 here)."
          }
        ]
      }
    ]
  }
];

function generateMarkdown(title: string, questions: ExerciseQuestion[]): string {
  let md = `# ${title}\n\n`;
  for (const q of questions) {
    md += `## ${q.questionNumber}: ${q.questionText}\n\n`;
    for (const p of q.parts) {
      md += `### (${p.partNumber}) ${p.partText}\n`;
      md += `**Solution:**\n${p.solution}\n\n`;
      if (p.explanation) {
        md += `*Note:* ${p.explanation}\n\n`;
      }
      md += `---\n\n`;
    }
  }
  return md;
}

async function seedChapter17() {
  console.log("🚀 Seeding full Unit 17 (17.1, 17.2, 17.3, 17.4, 17.5, Review 17) complete LaTeX solved notes...");
  for (const item of CHAPTER_17_DATA) {
    const md = generateMarkdown(item.title, item.questions);
    const res = await db.query(
      `UPDATE solved_exercises
       SET 
         content_markdown = $1,
         sections = $2,
         source_credit = 'Sindh Textbook Board (Standard Curriculum)'
       WHERE class = $3 AND chapter_number = $4 AND exercise_number = $5`,
      [
        md,
        JSON.stringify(item.questions),
        item.classLevel,
        item.chapterNumber,
        item.exerciseNumber
      ]
    );

    if (res.rowCount && res.rowCount > 0) {
      console.log(`✅ Seeded Class ${item.classLevel} Unit ${item.chapterNumber} -> ${item.exerciseNumber} (${item.questions.length} questions)`);
    } else {
      console.log(`⚠️ Not found: ${item.exerciseNumber}`);
    }
  }
  console.log("🎉 Done seeding full Chapter 17!");
}

seedChapter17().then(() => process.exit(0)).catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
