import "dotenv/config";
import { db } from "../lib/db";

// Normalized key helper
function norm(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

async function queryWithRetry(sql: string, params: any[] = [], maxRetries = 5): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await db.query(sql, params);
    } catch (err: any) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      console.warn(`[DB Retry ${attempt}/${maxRetries}] ${err.message}. Retrying in ${attempt * 1000}ms...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

// Subject-specific alias dictionary mapping legacy extracted chapter names / keywords to standard chapter numbers
const CHAPTER_ALIASES: Record<string, Record<string, Record<string, number>>> = {
  Biology: {
    IX: {
      "introduction to biology": 1,
      "solving a biological problem": 2,
      "biodiversity": 3,
      "cells and tissues": 4,
      "cell cycle": 4,
      "gaseous exchange": 5,
      "enzymes": 6,
      "bioenergetics": 7,
      "nutrition": 8,
      "nutrition and digestion": 8,
      "transport": 9,
    },
    X: {
      "biostatistics": 10,
      "cell cycle": 11,
      "homeostasis": 12,
      "coordination and control": 13,
      "support and movement": 14,
      "reproduction": 15,
      "inheritance": 16,
      "genetics": 16,
      "man and his environment": 17,
      "biotechnology": 18,
      "pharmacology": 19,
    },
    XI: {
      "cell structure and function": 3,
      "the cell": 3,
      "cell": 3,
      "biological molecules": 1,
      "enzymes": 2,
      "classification and acellular life": 4,
      "acellular life": 4,
      "viruses": 4,
      "kingdom prokaryotae": 5,
      "prokaryotes": 5,
      "prokaryotae": 5,
      "bacteria": 5,
      "kingdom protista": 6,
      "protists": 6,
      "protists and fungi": 6,
      "kingdom fungi": 7,
      "fungi": 7,
      "kingdom plantae": 8,
      "diversity among plants": 8,
      "plantae": 8,
      "kingdom animalia": 9,
      "diversity among animals": 9,
      "animalia": 9,
      "bioenergetics": 10,
      "nutrition": 11,
      "digestion": 11,
      "gaseous exchange": 12,
      "respiration": 12,
      "transport": 13,
      "circulation": 13,
      "form and function in plants": 13,
      "immune system": 14,
      "immunity": 14,
    },
    XII: {
      "homeostasis": 15,
      "support and movement": 16,
      "coordination and control": 17,
      "reproduction": 18,
      "growth and development": 19,
      "chromosomes and dna": 20,
      "cell cycle": 21,
      "variation and genetics": 22,
      "biotechnology": 23,
      "evolution": 24,
      "ecosystem": 25,
      "some major ecosystems": 26,
      "man and his environment": 27,
    },
  },
  Chemistry: {
    IX: {
      "fundamentals of chemistry": 1,
      "stoichiometry": 2,
      "atomic structure": 3,
      "periodic table": 4,
      "periodic table and periodicity": 4,
      "structure of molecules": 5,
      "chemical bonding": 5,
      "states of matter": 6,
      "solutions": 7,
      "electrochemistry": 8,
    },
    X: {
      "chemical equilibrium": 9,
      "acids, bases and salts": 10,
      "organic chemistry": 11,
      "hydrocarbons": 12,
      "natural and synthetic polymers": 13,
      "biochemistry": 13,
      "environmental chemistry i": 14,
      "environmental chemistry ii": 15,
      "chemical industries": 16,
    },
    XI: {
      "stoichiometry": 1,
      "introduction to fundamental concepts of chemistry": 1,
      "fundamental concepts": 1,
      "atomic structure": 2,
      "theories of covalent bonding and shape of molecules": 3,
      "covalent bonding": 3,
      "chemical bonding": 3,
      "states of matter: gases, liquids and solids": 4,
      "states of matter": 4,
      "gases": 4,
      "liquids and solids": 4,
      "chemical equilibrium": 5,
      "equilibrium": 5,
      "acids, bases and salts": 6,
      "acids and bases": 6,
      "chemical kinetics": 7,
      "reaction kinetics": 7,
      "solution and colloids": 8,
      "solutions": 8,
      "chemical energetics": 9,
      "thermochemistry": 9,
      "electrochemistry": 10,
    },
    XII: {
      "s- and p-block elements": 11,
      "transition metals": 12,
      "organic compounds": 13,
      "hydrocarbons": 14,
      "alkyl halides and amines": 15,
      "alcohols, phenols and ethers": 16,
      "carbonyl compound i": 17,
      "carbonyl compound ii": 18,
      "biochemistry": 19,
      "industrial chemistry": 20,
      "environmental chemistry": 21,
      "analytical chemistry": 22,
    },
  },
  Mathematics: {
    IX: {
      "real numbers": 1,
      "logarithms": 2,
      "sets theory": 3,
      "sets": 3,
      "functions and graphs": 4,
      "factorisation": 5,
      "algebraic manipulation": 6,
      "algebraic expressions": 6,
      "linear equations and inequalities": 7,
      "linear equations": 7,
      "vectors": 8,
      "introduction to coordinate geometry": 9,
      "coordinate geometry": 9,
      "loci": 10,
      "logic": 11,
      "similar figures": 12,
      "geometrical properties of regular polygons": 13,
      "polygons": 13,
      "introduction to trigonometry": 14,
      "trigonometry": 14,
    },
    X: {
      "quadratic equations": 15,
      "quadratic equation": 15,
      "plotting and interpreting the graphs": 16,
      "plotting and interpreting graphs": 16,
      "graphs": 16,
      "complex numbers": 17,
      "complex number": 17,
      "matrices and determinants": 18,
      "matrices": 18,
      "application of trigonometry": 19,
      "trigonometry": 19,
      "circles": 20,
      "circle": 20,
      "practical geometry": 21,
      "basic statistics": 22,
      "statistics": 22,
      "probability": 23,
    },
    XI: {
      "complex numbers": 1,
      "matrices and determinants": 2,
      "matrices": 2,
      "sequence and series": 3,
      "sequences and series": 3,
      "sequence & series": 3,
      "miscellaneous series": 4,
      "permutation and combination": 5,
      "permutations": 5,
      "combinations": 5,
      "mathematical induction and binomial theorem": 6,
      "mathematical induction": 6,
      "binomial theorem": 6,
      "factor and remainder theorems": 7,
      "factor and remainder theorem": 7,
      "remainder theorem": 7,
      "quadratic equation": 7,
      "quadratic equations": 7,
      "polynomials": 7,
      "trigonometric identities": 8,
      "fundamentals of trigonometry": 8,
      "application of trigonometry": 8,
      "solutions of triangles": 8,
      "trigonometric functions and their graphs": 9,
      "graphs of trigonometric functions": 9,
      "inverse trigonometric functions and trigonometric equations": 10,
      "inverse trigonometric functions": 10,
      "trigonometric equations": 10,
      "vectors": 11,
      "vector": 11,
    },
    XII: {
      "straight line": 12,
      "plane analytical geometry - straight line": 12,
      "translation and rotation of axes": 12,
      "linear programming": 12,
      "functions and limits": 13,
      "limits and continuity": 13,
      "differentiation": 14,
      "derivative": 14,
      "higher order derivatives and their applications": 15,
      "higher order derivatives and applications": 15,
      "vector differentiation": 16,
      "integration": 17,
      "indefinite integrals": 17,
      "definite integrals": 18,
      "numerical solution of nonlinear equations": 18,
      "numerical solutions": 18,
      "plane analytical geometry - conic sections": 19,
      "circle": 19,
      "circles": 19,
      "parabola": 20,
      "ellipse": 21,
      "hyperbola": 22,
      "maple": 23,
      "differential equations": 17,
    },
  },
  "General Mathematics": {
    IX: {
      "real numbers": 1,
      "logarithms": 2,
      "sets theory": 3,
      "sets": 3,
      "functions and graphs": 4,
      "factorisation": 5,
      "algebraic manipulation": 6,
      "linear equations and inequalities": 7,
      "vectors": 8,
      "introduction to coordinate geometry": 9,
      "coordinate geometry": 9,
      "loci": 10,
      "logic": 11,
      "similar figures": 12,
      "geometrical properties of regular polygons": 13,
      "introduction to trigonometry": 14,
    },
    X: {
      "quadratic equations": 15,
      "quadratic equation": 15,
      "plotting and interpreting the graphs": 16,
      "plotting and interpreting graphs": 16,
      "graphs": 16,
      "complex numbers": 17,
      "matrices and determinants": 18,
      "application of trigonometry": 19,
      "circles": 20,
      "practical geometry": 21,
      "basic statistics": 22,
      "statistics": 22,
      "probability": 23,
    },
  },
  "Business Mathematics": {
    XI: {
      "business arithmetic": 1,
      "interest and annuities": 2,
      "linear equations, functions and their graphs": 3,
      "quadratic equations, quadratic functions and their graphs": 4,
      "simultaneous solution of equations and linear inequalities": 5,
      "matrices and determinants": 6,
      "derivative of algebraic functions": 7,
      "sequence and series": 8,
    },
    XII: {
      "introduction to statistics": 9,
      "presentation of statistical data": 10,
      "measures of central tendency and quartiles": 11,
      "measures of dispersion": 12,
      "index number": 13,
      "counting techniques and probability": 14,
      "scatter diagram and correlation": 15,
    },
  },
  "Computer Science": {
    IX: {
      "the computer system": 1,
      "computer system": 1,
      "computer architecture": 1,
      "hardware": 1,
      "computational thinking and algorithms": 2,
      "algorithms": 2,
      "flowcharts": 2,
      "programming fundamentals (javascript, html & css)": 3,
      "programming fundamentals": 3,
      "programming": 3,
      "html and css": 3,
      "data and analysis": 4,
      "spreadsheets": 4,
      "applications of computer science": 5,
      "robotics": 5,
      "impact of computing": 6,
      "entrepreneurship in the digital age": 7,
    },
    X: {
      "number systems and encoding schemes": 8,
      "number systems": 8,
      "computational thinking and algorithm": 9,
      "algorithms": 9,
      "programming in javascript": 10,
      "c programming": 10,
      "programming": 10,
      "data and analysis": 11,
      "database": 11,
      "security, privacy and data integrity": 12,
      "security": 12,
      "digital literacy": 13,
      "entrepreneurship in the digital age": 14,
    },
    XI: {
      "computing systems": 1,
      "computer systems": 1,
      "computer architecture": 1,
      "hardware": 1,
      "central processing unit": 1,
      "memory and storage": 1,
      "logic gates": 1,
      "computational thinking and algorithm": 2,
      "algorithms": 2,
      "programming fundamentals (python)": 3,
      "programming in python": 3,
      "data and analysis": 4,
      "database systems": 4,
      "database": 4,
      "sql": 4,
      "ms access": 4,
      "applications of computer science": 5,
      "iot": 5,
      "blockchain": 5,
      "impacts of computing": 6,
      "cybersecurity": 6,
      "digital literacy": 7,
      "networking": 7,
      "computer networks": 7,
      "data communications": 7,
      "entrepreneurship in the digital age": 8,
      "software engineering": 8,
      "sdlc": 8,
    },
    XII: {
      "computing systems": 9,
      "advanced microprocessor": 9,
      "microprocessor architecture": 9,
      "computational thinking and algorithm": 10,
      "data structures": 10,
      "searching and sorting": 10,
      "programming fundamentals (python)": 11,
      "object oriented programming": 11,
      "c++ programming": 11,
      "data and analysis": 12,
      "machine learning": 12,
      "applications of computer science": 13,
      "deep learning": 13,
      "impacts of computing": 14,
      "cryptography": 14,
      "security protocols": 14,
      "digital literacy": 15,
      "entrepreneurship in the digital age": 16,
    },
  },
  Islamiat: {
    IX: {
      "qur’an-e-majeed": 1,
      "quran": 1,
      "surah": 1,
      "surah al-anfal": 1,
      "surah al-mumtahina": 1,
      "surah al-nisa": 1,
      "hadith shareef": 2,
      "hadith": 2,
      "hadis": 2,
      "mauzu’ati mutala’a": 3,
      "faith and worship": 3,
      "aqeedah": 3,
      "hidayat kay serchashmay/ mashaheer-e-islam": 4,
      "seerat": 4,
      "mashaheer": 4,
    },
    X: {
      "qur’an-e-majeed": 1,
      "quran": 1,
      "hadith shareef": 2,
      "hadith": 2,
      "mauzu’ati mutala’a": 3,
      "hidayat kay serchashmay/ mashaheer-e-islam": 4,
    },
    XI: {
      "al-qur’an-ul-karim": 1,
      "quran": 1,
      "al-hadith": 2,
      "hadith": 2,
      "mauzu‘ati mutala‘a": 3,
      "hidayat key serchashmay/ mashaheer-e-islam": 4,
    },
    XII: {
      "al-qur’an-ul-karim": 1,
      "quran": 1,
      "al-hadith": 2,
      "hadith": 2,
      "mauzu‘ati mutala‘a": 3,
      "hidayat key serchashmay/ mashaheer-e-islam": 4,
    },
  },
  "Pakistan Studies": {
    IX: {
      "ideological basis of pakistan (1857-1940)": 1,
      "ideological basis": 1,
      "emergence and creation of pakistan (1940-1947)": 2,
      "emergence of pakistan": 2,
      "constitution of pakistan": 3,
      "land and climate of pakistan": 4,
      "geography": 4,
      "resources and economic development of pakistan": 5,
      "economic development": 5,
      "trade and transportation": 6,
      "population of pakistan": 7,
      "citizenship": 8,
      "cultural diversity in pakistan": 9,
      "pakistan and world affairs": 10,
    },
    X: {
      "ideological basis of pakistan (1857-1940)": 1,
      "ideological basis": 1,
      "emergence and creation of pakistan (1940-1947)": 2,
      "emergence of pakistan": 2,
      "constitution of pakistan": 3,
      "land and climate of pakistan": 4,
      "geography": 4,
      "resources and economic development of pakistan": 5,
      "economic development": 5,
      "trade and transportation": 6,
      "population of pakistan": 7,
      "citizenship": 8,
      "cultural diversity in pakistan": 9,
      "pakistan and world affairs": 10,
    },
    XII: {
      "newly emergent state": 1,
      "political developments under different regimes": 2,
      "constitution of pakistan": 3,
      "geography of pakistan": 4,
      "economic development of pakistan": 5,
      "livestock and fish farming": 6,
      "national integration and national cohesion": 7,
      "rights and responsibilities of citizens": 8,
      "pakistan and international affairs": 9,
    },
  },
};

// Comprehensive keyword classification function
function classifyByKeywords(subject: string, classLevel: string, text: string): number | null {
  const t = (text || "").toLowerCase();

  // 1. Computer Science
  if (subject === "Computer Science") {
    if (classLevel === "IX") {
      if (
        t.includes("html") || t.includes("head") && t.includes("body") || t.includes("<") && t.includes(">") ||
        t.includes("css") || t.includes("style") || t.includes("javascript") || t.includes("script") ||
        t.includes("var ") || t.includes("let ") || t.includes("const ") || t.includes("function") ||
        t.includes("alert(") || t.includes("document.getelementbyid") || t.includes("web page") ||
        t.includes("webpage") || t.includes("tag") || t.includes("hyperlink") || t.includes("anchor") ||
        t.includes("attribute") && t.includes("href")
      ) return 3;

      if (
        t.includes("algorithm") || t.includes("flowchart") || t.includes("pseudocode") ||
        t.includes("computational thinking") || t.includes("decomposition") || t.includes("abstraction") ||
        t.includes("pattern recognition") || t.includes("connector symbol") || t.includes("trace table") ||
        t.includes("dry run") || t.includes("linear search") || t.includes("binary search") || t.includes("sorting")
      ) return 2;

      if (
        t.includes("excel") || t.includes("spreadsheet") || t.includes("worksheet") ||
        t.includes("cell reference") || (t.includes("formula") && (t.includes("sum") || t.includes("average"))) ||
        t.includes("bar chart") || t.includes("pie chart") || t.includes("data representation") ||
        t.includes("binary to decimal") || t.includes("decimal to binary") || t.includes("ascii") || t.includes("unicode")
      ) return 4;

      if (
        t.includes("network") || t.includes("lan") || t.includes("wan") || t.includes("man") ||
        t.includes("topology") || t.includes("star topology") || t.includes("bus topology") ||
        t.includes("ring topology") || t.includes("mesh topology") || t.includes("hub") ||
        t.includes("switch") || t.includes("router") || t.includes("modem") || t.includes("transmission") ||
        t.includes("satellite") || t.includes("cellular") || t.includes("wireless") || t.includes("wifi") ||
        t.includes("url") || t.includes("website") || t.includes("browser") || t.includes("internet") ||
        t.includes("artificial intelligence") || t.includes("robot") || t.includes("iot") ||
        t.includes("smart home") || t.includes("automation") || t.includes("drone")
      ) return 5;

      if (
        t.includes("cyberbullying") || t.includes("digital footprint") || t.includes("ergonomics") ||
        t.includes("posture") || t.includes("health risk") || t.includes("online safety") ||
        t.includes("malware") || t.includes("virus") || t.includes("antivirus") || t.includes("phishing") ||
        t.includes("privacy") || t.includes("security") || t.includes("password") || t.includes("ethics")
      ) return 6;

      if (
        t.includes("freelance") || t.includes("startup") || t.includes("e-commerce") ||
        t.includes("online business") || t.includes("digital marketing") || t.includes("entrepreneur")
      ) return 7;

      return 1;
    }

    if (classLevel === "X") {
      if (
        t.includes("binary") || t.includes("hexadecimal") || t.includes("octal") || t.includes("radix") ||
        t.includes("base-2") || t.includes("base-16") || t.includes("base-8") || t.includes("1's complement") ||
        t.includes("2's complement") || t.includes("ascii") || t.includes("unicode") || t.includes("bcd") ||
        t.includes("number system")
      ) return 8;

      if (
        t.includes("flowchart") || t.includes("algorithm") || t.includes("pseudocode") ||
        t.includes("dry run") || t.includes("trace table") || t.includes("step 1: start") ||
        t.includes("computational thinking")
      ) return 9;

      if (
        t.includes("#include") || t.includes("printf") || t.includes("scanf") || t.includes("int main") ||
        t.includes("stdio.h") || t.includes("switch") || t.includes("case ") || t.includes("break;") ||
        t.includes("for(") || t.includes("while(") || t.includes("do {") || t.includes("if(") ||
        t.includes("else") || t.includes("variable") || t.includes("c compiler") || t.includes("syntax") ||
        t.includes("loop") || t.includes("operator") || t.includes("declaration of a variable") ||
        t.includes("javascript") || t.includes("array") || t.includes("function")
      ) return 10;

      if (
        t.includes("database") || (t.includes("table") && (t.includes("record") || t.includes("field"))) ||
        t.includes("primary key") || t.includes("data model") || t.includes("erd") || t.includes("sql")
      ) return 11;

      if (
        t.includes("security") || t.includes("privacy") || t.includes("malware") || t.includes("virus") ||
        t.includes("antivirus") || t.includes("worm") || t.includes("authentication") ||
        t.includes("password") || t.includes("encryption") || t.includes("data integrity")
      ) return 12;

      if (
        t.includes("search engine") || t.includes("advanced search") || t.includes("email") ||
        t.includes("internet protocol") || t.includes("web browser") || t.includes("digital literacy")
      ) return 13;

      if (
        t.includes("entrepreneur") || t.includes("business plan") || t.includes("startup") ||
        t.includes("digital marketing")
      ) return 14;

      return 8;
    }

    if (classLevel === "XI") {
      if (
        t.includes("database") || t.includes("sql") || t.includes("ms access") ||
        t.includes("candidate key") || t.includes("foreign key") || t.includes("primary key") || t.includes("composite key") ||
        t.includes("cardinality") || t.includes("modality") || t.includes("erd") || t.includes("datasheet view") || t.includes("design view") ||
        t.includes("select ") || t.includes("insert into") || t.includes("update ") || t.includes("delete from") || t.includes("create table") ||
        t.includes("query created") || (t.includes("form") && (t.includes("layout") || t.includes("subform"))) ||
        (t.includes("report") && (t.includes("access") || t.includes("fetch"))) || t.includes("data type of a field") ||
        t.includes("normalisation") || t.includes("normalization") || t.includes("1nf") || t.includes("2nf") || t.includes("3nf") ||
        (t.includes("table") && (t.includes("record") || t.includes("field") || t.includes("rows") || t.includes("column") || t.includes("tuple") || t.includes("attribute")))
      ) {
        return 4;
      }

      if (
        t.includes("ipv4") || t.includes("ipv6") || t.includes("ip address") || t.includes("host id") || t.includes("network id") ||
        t.includes("osi model") || t.includes("tcp/ip") || t.includes("network topology") || t.includes("star topology") ||
        t.includes("bus topology") || t.includes("ring topology") || t.includes("mesh topology") || t.includes("tree topology") ||
        t.includes("hybrid topology") || t.includes("asynchronous transmission") || t.includes("synchronous transmission") ||
        t.includes("simplex") || t.includes("half-duplex") || t.includes("full-duplex") || t.includes("twisted pair") ||
        t.includes("coaxial") || t.includes("optical fiber") || t.includes("bandwidth") || t.includes("broadband") ||
        t.includes("lan") || t.includes("wan") || t.includes("man") || t.includes("pan") || t.includes("router") ||
        t.includes("switch") || t.includes("gateway") || t.includes("modem") || t.includes("hub") || t.includes("wi-fi") ||
        t.includes("bluetooth") || t.includes("cellular") || t.includes("search engine") || t.includes("boolean search")
      ) {
        return 7;
      }

      if (
        t.includes("cybersecurity") || t.includes("cyber threat") || t.includes("malware") || t.includes("virus") ||
        t.includes("worm") || t.includes("trojan") || t.includes("ransomware") || t.includes("phishing") ||
        t.includes("denial of service") || t.includes("dos attack") || t.includes("ddos") || t.includes("firewall") ||
        t.includes("encryption") || t.includes("cryptography") || t.includes("cipher") || t.includes("symmetric key") ||
        t.includes("asymmetric key") || t.includes("public key") || t.includes("private key") || t.includes("hashing") ||
        t.includes("privacy") || t.includes("intellectual property") || t.includes("copyright") || t.includes("patent") ||
        t.includes("software piracy") || t.includes("plagiarism") || t.includes("ethics") || t.includes("e-waste")
      ) {
        return 6;
      }

      if (
        t.includes("internet of things") || t.includes("iot") || t.includes("sensor") || t.includes("actuator") ||
        t.includes("microcontroller") || t.includes("arduino") || t.includes("raspberry pi") ||
        t.includes("blockchain") || t.includes("cryptocurrency") || t.includes("smart contract") || t.includes("distributed ledger") ||
        t.includes("cloud computing") || t.includes("iaas") || t.includes("paas") || t.includes("saas") ||
        t.includes("public cloud") || t.includes("private cloud") || t.includes("artificial intelligence") ||
        t.includes("expert system") || t.includes("robotics")
      ) {
        return 5;
      }

      if (
        t.includes("python") || t.includes("turtle") || t.includes("def ") || t.includes("range(") ||
        t.includes("elif") || t.includes("for loop") || t.includes("while loop") || t.includes("print(") ||
        t.includes("input(") || t.includes("indentation") || t.includes("syntax error") || t.includes("debugging")
      ) {
        return 3;
      }

      if (
        t.includes("algorithm") || t.includes("flowchart") || t.includes("pseudocode") ||
        t.includes("computational thinking") || t.includes("decomposition") || t.includes("abstraction") ||
        t.includes("dry run") || t.includes("trace table")
      ) {
        return 2;
      }

      if (
        t.includes("sdlc") || t.includes("software development life cycle") || t.includes("waterfall") ||
        t.includes("agile") || t.includes("wireframe") || t.includes("mockup") || t.includes("prototype") ||
        t.includes("ui/ux") || t.includes("user interface") || t.includes("user experience") ||
        t.includes("startup") || t.includes("freelance") || t.includes("mvp")
      ) {
        return 8;
      }

      return 1;
    }

    if (classLevel === "XII") {
      if (
        t.includes("class ") || t.includes("object") || t.includes("constructor") || t.includes("destructor") ||
        t.includes("inheritance") || t.includes("polymorphism") || t.includes("encapsulation") || t.includes("overloading") ||
        t.includes("overriding") || t.includes("public:") || t.includes("private:") || t.includes("protected:") ||
        t.includes("#include <iostream>") || t.includes("cout") || t.includes("cin") || t.includes("namespace std") ||
        t.includes("manipulator") || t.includes("setw") || t.includes("endl") || t.includes("array") ||
        t.includes("string") || t.includes("pointer") || t.includes("function") || t.includes("return value") ||
        t.includes("argument") || t.includes("parameter") || t.includes("structure") || t.includes("struct")
      ) {
        return 11;
      }

      if (
        t.includes("data structure") || t.includes("stack") || t.includes("push") || t.includes("pop") ||
        t.includes("queue") || t.includes("enqueue") || t.includes("dequeue") || t.includes("linked list") ||
        t.includes("binary tree") || t.includes("graph") || t.includes("linear search") || t.includes("binary search") ||
        t.includes("bubble sort") || t.includes("selection sort") || t.includes("insertion sort") || t.includes("quick sort") ||
        t.includes("time complexity") || t.includes("big o") || t.includes("algorithm")
      ) {
        return 10;
      }

      if (
        t.includes("machine learning") || t.includes("supervised") || t.includes("unsupervised") ||
        t.includes("classification") || t.includes("regression") || t.includes("clustering") ||
        t.includes("hypothesis") || t.includes("p-value") || t.includes("confusion matrix") ||
        t.includes("precision") || t.includes("recall") || t.includes("f1-score") || t.includes("accuracy")
      ) {
        return 12;
      }

      if (
        t.includes("deep learning") || t.includes("neural network") || t.includes("computer vision") ||
        t.includes("natural language processing") || t.includes("nlp") || t.includes("cnn") || t.includes("rnn")
      ) {
        return 13;
      }

      if (
        t.includes("ssl") || t.includes("tls") || t.includes("https") || t.includes("ipsec") || t.includes("vpn") ||
        t.includes("rsa") || t.includes("aes") || t.includes("digital signature") || t.includes("digital certificate") ||
        t.includes("cryptography") || t.includes("public key infrastructure") || t.includes("pki")
      ) {
        return 14;
      }

      if (
        t.includes("research methodology") || t.includes("data collection plan") || t.includes("survey instrument")
      ) {
        return 15;
      }

      if (
        t.includes("mvp") || t.includes("minimum viable product") || t.includes("pitch deck") ||
        t.includes("product-market fit") || t.includes("scaling") || t.includes("venture capital")
      ) {
        return 16;
      }

      return 9;
    }
  }

  // 1B. Business Studies
  if (subject === "Business Studies") {
    if (classLevel === "IX") {
      if (
        t.includes("marketing") || t.includes("market share") || t.includes("market segment") ||
        t.includes("4 ps") || t.includes("4ps") || t.includes("product life cycle") ||
        t.includes("pricing") || t.includes("promotion") || t.includes("advertising") ||
        t.includes("packaging") || t.includes("brand") || t.includes("distribution channel")
      ) return 5;

      if (
        t.includes("accounting") || t.includes("finance") || t.includes("cash flow") ||
        t.includes("balance sheet") || t.includes("income statement") || t.includes("profit and loss") ||
        t.includes("source of finance") || t.includes("bank loan") || t.includes("overdraft") ||
        t.includes("working capital") || t.includes("liquidity")
      ) return 4;

      if (
        t.includes("production") || t.includes("manufacturing") || t.includes("job production") ||
        t.includes("batch production") || t.includes("flow production") || t.includes("lean production") ||
        t.includes("productivity") || t.includes("efficiency") || t.includes("fixed cost") ||
        t.includes("variable cost") || t.includes("total cost") || t.includes("break-even") ||
        t.includes("quality control") || t.includes("quality assurance")
      ) return 3;

      if (
        t.includes("sole trader") || t.includes("partnership") || t.includes("private limited") ||
        t.includes("public limited") || t.includes("ltd") || t.includes("plc") ||
        t.includes("franchise") || t.includes("joint venture") || t.includes("public corporation") ||
        t.includes("stakeholder") || t.includes("business objective") || t.includes("growth")
      ) return 2;

      if (
        t.includes("needs") || t.includes("wants") || t.includes("scarcity") ||
        t.includes("opportunity cost") || t.includes("factors of production") ||
        t.includes("primary sector") || t.includes("secondary sector") || t.includes("tertiary sector") ||
        t.includes("added value") || t.includes("specialisation")
      ) return 1;

      return 1;
    }

    if (classLevel === "X") {
      if (
        t.includes("macroeconomic") || t.includes("economic growth") || t.includes("gdp") ||
        t.includes("inflation") || t.includes("unemployment") || t.includes("interest rate") ||
        t.includes("exchange rate") || t.includes("balance of payment") || t.includes("bop") ||
        t.includes("tariff") || t.includes("import") || t.includes("export") ||
        t.includes("taxation") || t.includes("monetary policy") || t.includes("fiscal policy") ||
        t.includes("government regulation") || t.includes("environmental") || t.includes("ethical") ||
        t.includes("social responsibility") || t.includes("multinational") || t.includes("globalisation")
      ) return 10;

      if (
        t.includes("market research") || t.includes("primary research") || t.includes("secondary research") ||
        t.includes("questionnaire") || t.includes("survey") || t.includes("sample") ||
        t.includes("focus group") || t.includes("market segmentation") || t.includes("target market") ||
        t.includes("skimming") || t.includes("penetration pricing") || t.includes("competitive pricing") ||
        t.includes("promotion") || t.includes("advertising") || t.includes("brand loyalty") ||
        t.includes("marketing department") || t.includes("market researcher")
      ) return 9;

      if (
        t.includes("cash flow forecast") || t.includes("working capital") || t.includes("income statement") ||
        t.includes("balance sheet") || t.includes("gross profit") || t.includes("net profit") ||
        t.includes("gross profit margin") || t.includes("net profit margin") || t.includes("roce") ||
        t.includes("return on capital") || t.includes("current ratio") || t.includes("acid test") ||
        t.includes("liquid ratio") || t.includes("source of finance") || t.includes("retained profit") ||
        t.includes("share capital") || t.includes("debenture")
      ) return 8;

      if (
        t.includes("production method") || t.includes("lean production") || t.includes("just-in-time") ||
        t.includes("jit") || t.includes("kaizen") || t.includes("quality control") ||
        t.includes("quality assurance") || t.includes("tqm") || t.includes("total quality") ||
        t.includes("economies of scale") || t.includes("diseconomies of scale") ||
        t.includes("location") && (t.includes("factory") || t.includes("business") || t.includes("site")) ||
        t.includes("inventory") || t.includes("buffer stock") || t.includes("lead time")
      ) return 7;

      if (
        t.includes("organisation structure") || t.includes("organization structure") ||
        t.includes("hierarchy") || t.includes("span of control") || t.includes("chain of command") ||
        t.includes("delegation") || t.includes("centralis") || t.includes("decentralis") ||
        t.includes("recruitment") || t.includes("selection") || t.includes("job description") ||
        t.includes("job specification") || t.includes("training") || t.includes("induction") ||
        t.includes("motivation") || t.includes("maslow") || t.includes("herzberg") ||
        t.includes("taylor") || t.includes("remuneration") || t.includes("wage") ||
        t.includes("salary") || t.includes("trade union") || t.includes("leadership") ||
        t.includes("autocratic") || t.includes("democratic") || t.includes("laissez-faire") ||
        t.includes("two factor theory") || t.includes("worker") || t.includes("employee")
      ) return 6;

      return 6;
    }
  }

  // 2. Islamiat
  if (subject === "Islamiat" || subject === "Islamiat (Urdu)") {
    if (t.includes("hadith") || t.includes("hadis") || t.includes("حدیث") || t.includes("قال رسول الله") || (t.includes("صلی اللہ علیہ وسلم") && (t.includes("فرمایا") || t.includes("ارشاد")))) return 2;
    if (t.includes("surah") || t.includes("surat") || t.includes("سورت") || t.includes("سورۃ") || t.includes("آیت") || t.includes("ayat") || t.includes("anfal") || t.includes("nisa") || t.includes("mumtahina") || t.includes("ahzab") || t.includes("quran") || t.includes("قرآن")) return 1;
    if (t.includes("badar") || t.includes("uhud") || t.includes("khandaq") || t.includes("badr") || t.includes("hudaibiya") || t.includes("makkah") || t.includes("abu bakr") || t.includes("umar") || t.includes("usman") || t.includes("ali ") || t.includes("fatima") || t.includes("ayesha") || t.includes("غزوہ") || t.includes("ابوبکر") || t.includes("عمر") || t.includes("عثمان") || t.includes("علی")) return 4;
    if (t.includes("salah") || t.includes("namaz") || t.includes("prayer") || t.includes("zakat") || t.includes("fasting") || t.includes("roza") || t.includes("hajj") || t.includes("jihad") || t.includes("tauheed") || t.includes("risalat") || t.includes("akhira") || t.includes("نماز") || t.includes("زکوٰۃ") || t.includes("روزہ") || t.includes("حج") || t.includes("توحید")) return 3;
    return 1;
  }

  // 3. Pakistan Studies
  if (subject === "Pakistan Studies" || subject === "Pakistan Studies (Urdu)") {
    if (classLevel === "IX" || classLevel === "X") {
      if (t.includes("sir syed") || t.includes("aligarh") || t.includes("allama iqbal") || t.includes("quaid-e-azam") || t.includes("two-nation") || t.includes("ideolog") || t.includes("1857") || t.includes("1906") || t.includes("muslim league") || t.includes("نظریہ") || t.includes("سر سید") || t.includes("اقبال")) return 1;
      if (t.includes("1940") || t.includes("lahore resolution") || t.includes("pakistan resolution") || t.includes("cripps") || t.includes("cabinet mission") || t.includes("1947") || t.includes("radcliff") || t.includes("قرارداد") || t.includes("قیام پاکستان")) return 2;
      if (t.includes("constitution") || t.includes("1956") || t.includes("1962") || t.includes("1973") || t.includes("amendment") || t.includes("senate") || t.includes("national assembly") || t.includes("آئین") || t.includes("دستور")) return 3;
      if (t.includes("mountain") || t.includes("himalaya") || t.includes("karakoram") || t.includes("hindu kush") || t.includes("river") || t.includes("climate") || t.includes("monsoon") || t.includes("plateau") || t.includes("موسم") || t.includes("پہاڑ") || t.includes("دریا")) return 4;
      if (t.includes("agriculture") || t.includes("crop") || t.includes("wheat") || t.includes("cotton") || t.includes("rice") || t.includes("sugarcane") || t.includes("mineral") || t.includes("industry") || t.includes("energy") || t.includes("dam") || t.includes("معیشت") || t.includes("صنعت") || t.includes("زراعت")) return 5;
      if (t.includes("trade") || t.includes("export") || t.includes("import") || t.includes("port") || t.includes("karachi port") || t.includes("gwadar") || t.includes("highway") || t.includes("railway") || t.includes("تجارت") || t.includes("بندرگاہ")) return 6;
      if (t.includes("population") || t.includes("census") || t.includes("migration") || t.includes("density") || t.includes("urban") || t.includes("rural") || t.includes("آبادی")) return 7;
      if (t.includes("citizen") || t.includes("rights") || t.includes("duties") || t.includes("human rights") || t.includes("شہری") || t.includes("حقوق")) return 8;
      if (t.includes("culture") || t.includes("language") || t.includes("urdu") || t.includes("punjabi") || t.includes("sindhi") || t.includes("pashto") || t.includes("balochi") || t.includes("craft") || t.includes("ثقافت")) return 9;
      if (t.includes("foreign policy") || t.includes("united nations") || t.includes("un ") || t.includes("oic") || t.includes("saarc") || t.includes("china") || t.includes("kashmir") || t.includes("خارجہ پالیسی")) return 10;
      return 1;
    }
    if (classLevel === "XII") {
      if (t.includes("initial problems") || t.includes("refugee") || t.includes("boundary commission") || t.includes("radcliff") || t.includes("quaid-e-azam") || t.includes("liaquat ali")) return 1;
      if (t.includes("ayub khan") || t.includes("yahya khan") || t.includes("zulfikar ali bhutto") || t.includes("zia-ul-haq") || t.includes("martial law") || t.includes("political")) return 2;
      if (t.includes("constitution") || t.includes("1973") || t.includes("1956") || t.includes("1962") || t.includes("objective resolution") || t.includes("parliament")) return 3;
      if (t.includes("geography") || t.includes("climate") || t.includes("location") || t.includes("borders") || t.includes("topography")) return 4;
      if (t.includes("economic development") || t.includes("agriculture") || t.includes("industry") || t.includes("mineral") || t.includes("power") || t.includes("cpec")) return 5;
      if (t.includes("livestock") || t.includes("dairy") || t.includes("fish") || t.includes("fisheries") || t.includes("marine")) return 6;
      if (t.includes("national integration") || t.includes("cohesion") || t.includes("unity") || t.includes("diversity") || t.includes("provinces")) return 7;
      if (t.includes("rights") || t.includes("responsibilities") || t.includes("citizens") || t.includes("law") || t.includes("justice")) return 8;
      if (t.includes("international") || t.includes("foreign policy") || t.includes("united nations") || t.includes("oic") || t.includes("relations")) return 9;
      return 1;
    }
  }

  // 4. Urdu
  if (subject === "Urdu") {
    if (classLevel === "IX") {
      if (t.includes("قواعد") || t.includes("گرامر") || t.includes("اسم") || t.includes("صفت") || t.includes("ضمیر") || t.includes("فعل") || t.includes("تذکیر") || t.includes("تانیث") || t.includes("واحد") || t.includes("جمع") || t.includes("متضاد") || t.includes("مترادف") || t.includes("محاورہ") || t.includes("اعراب")) return 5;
      if (t.includes("خط") || t.includes("درخواست") || t.includes("مضمون") || t.includes("کہانی") || t.includes("مکالمہ") || t.includes("روداد") || t.includes("تلخیص") || t.includes("ترکیب نحوی")) return 4;
      if (t.includes("نظم") || t.includes("غزل") || t.includes("شعر") || t.includes("شاعر") || t.includes("مصرع") || t.includes("ردیف") || t.includes("قافیہ") || t.includes("تشبیہ") || t.includes("استعارہ") || t.includes("غالب") || t.includes("میر") || t.includes("حالی") || t.includes("تشریح")) return 3;
      if (t.includes("نثر") || t.includes("سبق") || t.includes("افسانہ") || t.includes("خاکہ") || t.includes("مصنف") || t.includes("اقتباس")) return 1;
      return 1;
    }
    if (classLevel === "X") {
      if (t.includes("سمعی") || t.includes("سن کر") || t.includes("سننا") || t.includes("آڈیو") || t.includes("تقریر")) return 7;
      if (t.includes("خط") || t.includes("درخواست") || t.includes("مضمون") || t.includes("روداد") || t.includes("تلخیص") || t.includes("تفہیم") || t.includes("تحریر")) return 9;
      if (t.includes("نظم") || t.includes("غزل") || t.includes("شعر") || t.includes("شاعر") || t.includes("اشعار") || t.includes("مصرع") || t.includes("ردیف") || t.includes("قافیہ") || t.includes("مطلع") || t.includes("مقطع") || t.includes("تشریح")) return 8;
      if (t.includes("نثر") || t.includes("خوانی") || t.includes("سبق") || t.includes("افسانہ") || t.includes("مصنف") || t.includes("ادب کی کس صنف")) return 6;
      if (t.includes("قواعد") || t.includes("گرامر") || t.includes("اسم") || t.includes("صفت") || t.includes("محاورہ") || t.includes("تذکیر") || t.includes("تانیث") || t.includes("صنعت")) return 5;
      return 5;
    }
    if (classLevel === "XI" || classLevel === "XII") {
      if (t.includes("قواعد") || t.includes("انشاء") || t.includes("تذکیر") || t.includes("تانیث") || t.includes("صفت") || t.includes("اسم") || t.includes("محاورہ")) return 10;
      if (t.includes("نظم") || t.includes("غزل") || t.includes("شعر") || t.includes("شاعر") || t.includes("ردیف") || t.includes("قافیہ") || t.includes("اشعار")) return 8;
      if (t.includes("تخلیقی") || t.includes("تحریر") || t.includes("مضمون") || t.includes("خط") || t.includes("درخواست") || t.includes("روداد")) return 9;
      if (t.includes("سننا") || t.includes("سمعی")) return 1;
      if (t.includes("پڑھنا") || t.includes("خوانی") || t.includes("تفہیم") || t.includes("اقتباس")) return 3;
      return 3;
    }
  }

  // 5. Mathematics & General Mathematics & Business Mathematics
  if (subject === "Mathematics" || subject === "General Mathematics" || subject === "Business Mathematics") {
    // 5A. Business Mathematics
    if (subject === "Business Mathematics") {
      if (classLevel === "XI") {
        if (t.includes("matrix") || t.includes("matrices") || t.includes("determinant") || t.includes("cramer") || t.includes("adjoint") || t.includes("singular") || t.includes("transpose") || t.includes("<sup>t</sup>") || t.includes("^t")) return 6;
        if (t.includes("derivative") || t.includes("differentiat") || t.includes("marginal cost") || t.includes("marginal revenue") || t.includes("marginal profit") || t.includes("dy/dx")) return 7;
        if (t.includes("interest") || t.includes("annuity") || t.includes("annuities") || t.includes("compound interest") || t.includes("simple interest") || t.includes("present value") || t.includes("future value") || t.includes("accumulated amount") || t.includes("principal amount") || t.includes("rate of interest")) return 2;
        if (t.includes("sequence") || t.includes("series") || t.includes("arithmetic progression") || t.includes("geometric progression") || t.includes("a.p.") || t.includes("g.p.") || t.includes("common difference") || t.includes("common ratio")) return 8;
        if (t.includes("simultaneous") || t.includes("linear inequalities") || t.includes("inequality") || t.includes("feasible region") || t.includes("market equilibrium") || t.includes("supply and demand")) return 5;
        if (t.includes("quadratic") || t.includes("parabola") || t.includes("maximum profit") || t.includes("minimum cost") || t.includes("discriminant") || t.includes("roots of")) return 4;
        if (t.includes("linear equation") || t.includes("straight line") || t.includes("break-even") || t.includes("slope") || t.includes("cost function") || t.includes("revenue function") || t.includes("profit function") || t.includes("intercept")) return 3;
        if (t.includes("ratio") || t.includes("proportion") || t.includes("percentage") || t.includes("profit") || t.includes("loss") || t.includes("discount") || t.includes("commission") || t.includes("partnership") || t.includes("depreciation") || t.includes("mark-up") || t.includes("markup") || t.includes("trade discount") || t.includes("cash discount")) return 1;
        return 1;
      }
      if (classLevel === "XII") {
        if (t.includes("index number") || t.includes("laspeyre") || t.includes("paasche") || t.includes("fisher") || t.includes("price index") || t.includes("quantity index") || t.includes("weighted index")) return 13;
        if (t.includes("scatter diagram") || t.includes("correlation") || t.includes("pearson") || t.includes("rank correlation") || t.includes("regression")) return 15;
        if (t.includes("probability") || t.includes("counting") || t.includes("permutation") || t.includes("combination") || t.includes("sample space") || t.includes("factorial") || t.includes("event") || t.includes("drawn at random")) return 14;
        if (t.includes("dispersion") || t.includes("variance") || t.includes("standard deviation") || t.includes("mean deviation") || t.includes("range") || t.includes("quartile deviation") || t.includes("coefficient of variation")) return 12;
        if (t.includes("mean") || t.includes("median") || t.includes("mode") || t.includes("quartile") || t.includes("decile") || t.includes("percentile") || t.includes("geometric mean") || t.includes("harmonic mean") || t.includes("central tendency") || t.includes("average")) return 11;
        if (t.includes("presentation") || t.includes("frequency distribution") || t.includes("histogram") || t.includes("frequency polygon") || t.includes("pie chart") || t.includes("ogive") || t.includes("cumulative frequency") || t.includes("bar chart") || t.includes("tabulation") || t.includes("table")) return 10;
        if (t.includes("statistics") || t.includes("data") || t.includes("sample") || t.includes("population") || t.includes("variable") || t.includes("primary data") || t.includes("secondary data")) return 9;
        return 9;
      }
    }

    // 5B. Mathematics / General Mathematics Class IX (Chapters 1 to 14)
    if (classLevel === "IX") {
      if (
        t.includes("sin ") || t.includes("sinθ") || t.includes("cos ") || t.includes("cosθ") || t.includes("tan ") || t.includes("tanθ") ||
        t.includes("cot ") || t.includes("sec ") || t.includes("cosec") || t.includes("trigonometr") || t.includes("pythagor") ||
        t.includes("hypotenuse") || t.includes("sin 30") || t.includes("sin 45") || t.includes("cos 60") || t.includes("tan 45") ||
        t.includes("sin^2") || t.includes("cos^2") || t.includes("tan^2") || t.includes("sec^2") || t.includes("cosec^2") ||
        t.includes("radian") || t.includes("right angled triangle") || t.includes("right-angled triangle") || t.includes("right triangle") ||
        t.includes("acute angle") || t.includes("obtuse angle") || t.includes("d°m's''") || t.includes("degree, minute")
      ) return 14;

      if (
        t.includes("regular polygon") || t.includes("polygon") || t.includes("interior angle") || t.includes("exterior angle") ||
        t.includes("pentagon") || t.includes("hexagon") || t.includes("octagon") || t.includes("decagon") || t.includes("n-sided") ||
        t.includes("sum of interior angles")
      ) return 13;

      if (
        t.includes("similar") || t.includes("similarity") || t.includes("congruent") || t.includes("congruence") ||
        t.includes("ratio of areas") || t.includes("scale factor") || t.includes("parallelogram") || t.includes("congruent triangle") ||
        t.includes("ratio of corresponding sides") || t.includes("(triangle)") || t.includes("triangle") || t.includes("Δ") ||
        t.includes("parallel to") || t.includes("trapezium") || t.includes("quadrilateral") || t.includes("bisector of angle") ||
        t.includes("angle bisector") || t.includes("midpoint theorem") || t.includes("proportionality theorem") ||
        t.includes("side ab") || t.includes("side bc") || t.includes("side ac") || t.includes("(angle)") || t.includes("angle")
      ) return 12;

      if (
        t.includes("logic") || t.includes("truth value") || t.includes("truth table") || t.includes("implication") ||
        t.includes("conjunction") || t.includes("disjunction") || t.includes("negation") || t.includes("tautology") ||
        t.includes("conditional statement") || t.includes("converse") || t.includes("contrapositive") || t.includes("p ∧ q") ||
        t.includes("p ∨ q") || t.includes("p → q") || t.includes("p ↔ q") || (t.includes("hypothesis") && t.includes("conclusion"))
      ) return 11;

      if (t.includes("loci") || t.includes("locus") || t.includes("equidistant from two points") || t.includes("perpendicular bisector locus")) return 10;

      if (
        t.includes("coordinate geometry") || t.includes("distance formula") || t.includes("midpoint formula") ||
        t.includes("distance between points") || t.includes("midpoint of") || t.includes("collinear") ||
        t.includes("cartesian plane") || t.includes("abscissa") || t.includes("ordinate") || t.includes("ordered pair") ||
        (t.includes("quadrant") && (t.includes("point") || t.includes("lies in"))) ||
        t.includes("coordinates of") || t.includes("vertices of a triangle") || t.includes("vertices of") ||
        t.includes("line segment") || (t.includes("point") && t.includes("(") && t.includes(","))
      ) return 9;

      if (
        t.includes("vector") || t.includes("magnitude of vector") || t.includes("direction of vector") ||
        t.includes("unit vector") || t.includes("position vector") || t.includes("parallel vector") ||
        t.includes("resultant vector") || t.includes("scalar multiplication")
      ) return 8;

      if (
        t.includes("linear equation") || t.includes("inequality") || t.includes("inequalities") ||
        t.includes("absolute value") || t.includes("number line") || (t.includes("solution set of") && (t.includes("<") || t.includes(">") || t.includes("≤") || t.includes("≥") || t.includes("<=") || t.includes(">="))) ||
        t.includes("|x") || t.includes("|2x") || t.includes("|3x") || t.includes("|ax") || t.includes("solve for x:") ||
        t.includes("simultaneous linear") || t.includes("elimination method") || t.includes("substitution method") ||
        t.includes("linear inequality")
      ) return 7;

      if (
        t.includes("hcf") || t.includes("highest common factor") || t.includes("lcm") || t.includes("least common multiple") ||
        t.includes("square root of") || t.includes("division method") || t.includes("algebraic fraction") ||
        t.includes("partial fraction") || t.includes("rational expression") || t.includes("lowest terms") ||
        t.includes("simplest form of the algebraic") || t.includes("simplified form of") || t.includes("algebraic manipulation")
      ) return 6;

      if (
        t.includes("factoris") || t.includes("factoriz") || t.includes("factors of") ||
        t.includes("a^2 - b^2") || t.includes("a^3 + b^3") || t.includes("a^3 - b^3") ||
        t.includes("b^3 - 1/b^3") || t.includes("complete square") ||
        t.includes("polynomial") || t.includes("divided by x") || t.includes("remainder is") ||
        t.includes("zeros of the polynomial") || t.includes("factor theorem") || t.includes("remainder theorem")
      ) return 5;

      if (
        t.includes("binary relation") || t.includes("domain of the relation") || t.includes("range of the relation") ||
        t.includes("domain and range") || t.includes("onto function") || t.includes("one-one function") || t.includes("bijective") ||
        t.includes("injective") || t.includes("surjective") || t.includes("inverse of function") || t.includes("composite function") ||
        t.includes("graph of linear function") || (t.includes("function") && (t.includes("f(x)") || t.includes("g(x)")))
      ) return 4;

      if (
        t.includes("set ") || t.includes("sets") || t.includes("subset") || t.includes("power set") ||
        t.includes("universal set") || t.includes("null set") || t.includes("empty set") || t.includes("union") ||
        t.includes("intersection") || t.includes("venn diagram") || t.includes("de morgan") || t.includes("cartesian product") ||
        t.includes("ordered pairs") || t.includes("a ∪ b") || t.includes("a ∩ b") || t.includes("a \\ b") || t.includes("a - b") ||
        t.includes("complement of set") || t.includes("disjoint sets") || t.includes("overlapping sets")
      ) return 3;

      if (
        t.includes("logarithm") || t.includes("log_") || t.includes("log10") || t.includes("characteristic") ||
        t.includes("mantissa") || t.includes("scientific notation") || t.includes("laws of logarithm") ||
        t.includes("log ") || t.includes("log(") || t.includes("anti-log") || t.includes("antilog")
      ) return 2;

      if (
        t.includes("real number") || t.includes("rational number") || t.includes("irrational number") ||
        t.includes("radical") || t.includes("radicand") || t.includes("exponent") || t.includes("indices") ||
        t.includes("laws of exponents") || t.includes("surd") || t.includes("terminating decimal") ||
        t.includes("recurring decimal") || t.includes("non-terminating")
      ) return 1;

      return 1;
    }

    // 5C. Mathematics / General Mathematics Class X (Chapters 15 to 23)
    if (classLevel === "X") {
      // Unit 23: Probability
      if (
        t.includes("probability") || t.includes("sample space") || t.includes("favourable outcome") ||
        t.includes("possible outcome") || t.includes("dice is rolled") || t.includes("die is rolled") ||
        t.includes("coin is tossed") || t.includes("deck of 52 cards") || t.includes("mutually exclusive") ||
        t.includes("randomly drawn") || t.includes("drawn at random") || t.includes("p(e)") || t.includes("p(a)")
      ) return 23;

      // Unit 22: Basic Statistics
      if (
        t.includes("mean") || t.includes("median") || t.includes("mode") || t.includes("variance") ||
        t.includes("standard deviation") || t.includes("frequency distribution") || t.includes("frequency table") ||
        t.includes("grouped data") || t.includes("ungrouped data") || t.includes("histogram") ||
        t.includes("frequency polygon") || t.includes("cumulative frequency") || t.includes("ogive") ||
        t.includes("class boundary") || t.includes("class mark") || t.includes("mid-point of the class") ||
        t.includes("modal class") || t.includes("range of the data") || t.includes("range of x") ||
        t.includes("pie chart") || t.includes("bar chart") || t.includes("arithmetic mean") ||
        t.includes("geometric mean") || t.includes("harmonic mean") || t.includes("weighted mean") ||
        (t.includes("scores") && (t.includes("frequency") || t.includes("observations"))) ||
        t.includes("grouped frequency") || t.includes("measure of dispersion") || t.includes("central tendency") ||
        t.includes("favourite colour") || t.includes("favourite sports") || t.includes("favourite fruit") ||
        (t.includes("number of participants") && t.includes("age limit")) || t.includes("cumulative frequency curve")
      ) return 22;

      // Unit 21: Practical Geometry (Constructions)
      if (
        t.includes("practical geometry") || t.includes("circumscribe") || t.includes("inscribe") ||
        t.includes("escribe") || t.includes("draw an inscribed") || t.includes("draw a circumscribed") ||
        t.includes("draw a circle") || t.includes("construct a tangent") || t.includes("construction of circle") ||
        t.includes("inscribed square") || t.includes("inscribed regular hexagon") || t.includes("inscribed triangle") ||
        t.includes("circumscribed circle") || t.includes("escribed circle") || t.includes("concurrency of")
      ) return 21;

      // Unit 20: Circles
      if (
        t.includes("circle") || t.includes("chord") || t.includes("tangent") || t.includes("secant") ||
        t.includes("arc ") || t.includes("arcs") || t.includes("sector") || t.includes("segment of circle") ||
        t.includes("cyclic quadrilateral") || t.includes("central angle") || t.includes("subtended by an arc") ||
        t.includes("subtended by a chord") || t.includes("diameter of the circle") || t.includes("radius of the circle") ||
        t.includes("two circles touch") || t.includes("tangent segment") || t.includes("concentric circles") ||
        t.includes("circle theorems") || t.includes("centre o") || t.includes("centre at o") ||
        (t.includes("circle") && (t.includes("radius") || t.includes("diameter") || t.includes("chord")))
      ) return 20;

      // Unit 19: Application of Trigonometry
      if (
        t.includes("trigonometr") || t.includes("angle of elevation") || t.includes("angle of depression") ||
        t.includes("heights and distances") || t.includes("ladder") || t.includes("sin ") || t.includes("sinθ") ||
        t.includes("cos ") || t.includes("cosθ") || t.includes("tan ") || t.includes("tanθ") || t.includes("cot ") ||
        t.includes("cotθ") || t.includes("sec ") || t.includes("secθ") || t.includes("cosec") || t.includes("sin^2") ||
        t.includes("cos^2") || t.includes("tan^2") || t.includes("sec^2") || t.includes("cosec^2") ||
        t.includes("sin 30") || t.includes("sin 45") || t.includes("sin 60") || t.includes("cos 30") ||
        t.includes("cos 45") || t.includes("cos 60") || t.includes("tan 30") || t.includes("tan 45") ||
        t.includes("tan 60") || t.includes("sec30") || t.includes("sec45") || t.includes("sec60") ||
        t.includes("cosec 45") || t.includes("cot 45") || t.includes("radian") || t.includes("radians") ||
        (t.includes("quadrant") && (t.includes("signs of") || t.includes("terminal ray") || t.includes("trigonometric ratio"))) ||
        t.includes("d°m's''") || t.includes("right angled triangle") || t.includes("right-angled triangle") ||
        t.includes("right triangle") || t.includes("pythagor") || t.includes("hypotenuse") ||
        (t.includes("prove that") && (t.includes("sin") || t.includes("cos") || t.includes("tan"))) ||
        t.includes("sides of a right-angled triangle") || t.includes("sides of the right angled triangle")
      ) return 19;

      // Unit 18: Matrices and Determinants
      if (
        t.includes("matrix") || t.includes("matrices") || t.includes("determinant") || t.includes("cramer") ||
        t.includes("adjoint") || t.includes("inverse of a matrix") || t.includes("singular matrix") ||
        t.includes("non-singular matrix") || t.includes("order of a matrix") || t.includes("row matrix") ||
        t.includes("column matrix") || t.includes("identity matrix") || t.includes("null matrix") ||
        t.includes("transpose of a matrix") || t.includes("matrix inversion method")
      ) return 18;

      // Unit 17: Complex Numbers
      if (
        t.includes("complex number") || t.includes("imaginary") || t.includes("modulus") ||
        t.includes("conjugate of") || t.includes("real part") || t.includes("imaginary part") ||
        t.includes("iota") || t.includes("i^2") || t.includes("sqrt(-")
      ) return 17;

      // Unit 16: Plotting and Interpreting Graphs / Real-world Graphs & Coordinate Plane
      if (
        t.includes("graph") || t.includes("plotting") || t.includes("plot ") || t.includes("parabola") ||
        t.includes("x-intercept") || t.includes("y-intercept") || t.includes("intercept") ||
        t.includes("abscissa") || t.includes("ordinate") || t.includes("ordered pair") ||
        t.includes("cartesian plane") || t.includes("rectangular plane") || t.includes("coordinate plane") ||
        t.includes("straight line") || t.includes("line 2x") || t.includes("line x+y") ||
        t.includes("draw another line") || t.includes("points that lies on the given line") ||
        t.includes("points lies on the line") || t.includes("solution set from the graph") ||
        t.includes("slope of") || t.includes("gradient") || t.includes("us dollars and pakistani rupees") ||
        t.includes("tax payment") || t.includes("gross salary") || t.includes("basic salary") ||
        t.includes("allowance") || t.includes("income tax") || t.includes("zakat") || t.includes("mark-up") ||
        t.includes("instalment") || t.includes("installment") || t.includes("currency of") ||
        t.includes("usd =") || t.includes("depreciat") || t.includes("cash price") ||
        t.includes("call rates and taxes") || t.includes("shopping trip") || t.includes("ice-cream") ||
        (t.includes("cone") && (t.includes("diameter") || t.includes("volume") || t.includes("height"))) ||
        (t.includes("cylinder") && (t.includes("diameter") || t.includes("volume") || t.includes("height"))) ||
        (t.includes("sphere") && t.includes("volume")) || (t.includes("hemisphere") && t.includes("volume")) ||
        (t.includes("cube") && t.includes("volume")) || (t.includes("cuboid") && t.includes("volume")) ||
        t.includes("parallelogram") || t.includes("congruent triangle") || t.includes("similar") ||
        t.includes("midpoint of") || t.includes("distance between point") || t.includes("collinear") ||
        t.includes("equilateral triangle") || t.includes("linear equations") || t.includes("solve the inequality") ||
        t.includes("inequality") || t.includes("hcf") || t.includes("lcm") || t.includes("partial fraction") ||
        t.includes("square root of the expression") || t.includes("algebraic expression") ||
        t.includes("arithmetic progression") || t.includes("geometric progression") || t.includes("arithmetic sequence") ||
        t.includes("geometric sequence") || t.includes("common difference") || t.includes("common ratio") ||
        t.includes("arithmetic mean between") || t.includes("geometric mean between") || t.includes("arithmetic means") ||
        t.includes("sum of the ages") || t.includes("vertical opposite angles") || t.includes("corresponding angles")
      ) return 16;

      // Unit 15: Quadratic Equations (STRICT AND PRECISE!)
      if (
        t.includes("quadratic equation") || t.includes("quadratic formula") || t.includes("discriminant") ||
        t.includes("roots of the equation") || t.includes("roots of the quadratic") || t.includes("nature of the roots") ||
        t.includes("completing square") || t.includes("complete the square") || t.includes("perfect square") ||
        t.includes("sum of the roots") || t.includes("product of the roots") || t.includes("standard quadratic form") ||
        t.includes("reduced to quadratic") || t.includes("reducible to quadratic") ||
        t.includes("x^2") || t.includes("x<sup>2</sup>") || (t.includes("standard form of") && t.includes("x")) ||
        (t.includes("consecutive positive") && t.includes("product")) ||
        (t.includes("area of a rectangle") && (t.includes("x^2") || t.includes("x<sup>2</sup>") || t.includes("quadratic")))
      ) return 15;

      return 16;
    }

    // 5D. Mathematics Class XI (Chapters 1 to 11)
    if (classLevel === "XI") {
      if (
        t.includes("matrix") || t.includes("matrices") || t.includes("determinant") || t.includes("cramer") ||
        t.includes("adjoint") || t.includes("inverse of") || t.includes("singular") || t.includes("rank of matrix") ||
        t.includes("echelon form") || t.includes("symmetric matrix") || t.includes("skew-symmetric") ||
        t.includes("hermitian") || t.includes("skew-hermitian") || t.includes("transpose") ||
        t.includes("<sup>t</sup>") || t.includes("^t") ||
        t.includes("minor of the element") || t.includes("cofactor of the element") || t.includes("upper triangular") ||
        t.includes("matrix equation")
      ) return 2;

      if (
        t.includes("permutation") || t.includes("combination") || t.includes("factorial") || t.includes("npr") ||
        t.includes("ncr") || t.includes("ways of arranging") || t.includes("ways of selecting") ||
        t.includes("circular permutation") || t.includes("passwords that can be formed") ||
        t.includes("passwords that start") || t.includes("distinct objects") || t.includes("drawn randomly") ||
        t.includes("drawn at random") || t.includes("cubical die") || t.includes("spinner") || t.includes("probability") ||
        t.includes("p(e") || t.includes("p(a") || t.includes("distinct 4-digit") || t.includes("digit numbers")
      ) return 5;

      if (
        t.includes("arithmetico-geometric") || t.includes("sum of n terms of the series") || t.includes("sigma") ||
        t.includes("sum of squares") || t.includes("sum of cubes") || t.includes("1^2 + 2^2") || t.includes("1^3 + 2^3")
      ) return 4;

      if (
        t.includes("arithmetic progression") || t.includes("geometric progression") || t.includes("harmonic progression") ||
        t.includes("a.p.") || t.includes("g.p.") || t.includes("h.p.") || t.includes("arithmetic sequence") ||
        t.includes("geometric sequence") || t.includes("harmonic sequence") || t.includes("arithmetic mean") ||
        t.includes("geometric mean") || t.includes("harmonic mean") || t.includes("common difference") ||
        t.includes("common ratio") || t.includes("nth term") || t.includes("infinite geometric") ||
        t.includes("sum of the infinite geometric") || t.includes("term of a sequence") || t.includes("term of an arithmetic") ||
        t.includes("arithmetic (am)") || t.includes("geometric (gm)") || t.includes("harmonic (hm)") ||
        t.includes("s_n") || t.includes("s_∞") || t.includes("s<sub>n</sub>") || t.includes("s<sub>∞</sub>")
      ) return 3;

      if (
        t.includes("mathematical induction") || t.includes("binomial theorem") || t.includes("binomial expansion") ||
        t.includes("general term in the expansion") || t.includes("middle term") || t.includes("coefficient of x^")
      ) return 6;

      if (
        t.includes("factor theorem") || t.includes("remainder theorem") || t.includes("synthetic division") ||
        t.includes("polynomial") || t.includes("roots of the polynomial") || t.includes("divided by x") || t.includes("factor of") ||
        t.includes("quadratic equation") || t.includes("roots of the equation") || t.includes("sum of the roots") ||
        t.includes("product of the roots") || t.includes("nature of roots") || t.includes("roots are reciprocal") ||
        t.includes("roots α and β") || t.includes("sum of roots is") || t.includes("product of roots") ||
        t.includes("suitable quadratic form") || t.includes("solution set of x^2") || t.includes("roots of a quadratic")
      ) return 7;

      if (
        t.includes("vector") || t.includes("dot product") || t.includes("cross product") || t.includes("scalar product") ||
        t.includes("unit vector") || t.includes("projection") || t.includes("orthogonal")
      ) return 11;

      if (
        t.includes("inverse trigonometric") || t.includes("arcsin") || t.includes("arccos") || t.includes("arctan") ||
        t.includes("sin^-1") || t.includes("cos^-1") || t.includes("tan^-1") || t.includes("trigonometric equation") ||
        t.includes("general solution")
      ) return 10;

      if (
        t.includes("period of") || t.includes("period of the function") || t.includes("graph of sin") ||
        t.includes("graph of cos") || t.includes("graph of tan") || t.includes("domain and range of trigonometric")
      ) return 9;

      if (
        t.includes("sin") || t.includes("cos") || t.includes("tan") || t.includes("cot") || t.includes("sec") ||
        t.includes("cosec") || t.includes("trigonometr") || t.includes("radian") || t.includes("degree") ||
        t.includes("law of sines") || t.includes("law of cosines") || t.includes("law of tangents") ||
        t.includes("solution of triangles") || t.includes("circumradius") || t.includes("inradius") ||
        t.includes("escribed radius") || t.includes("terminal ray") || t.includes("area of the triangle") ||
        t.includes("hypotenuse") || t.includes("right angled triangle") || t.includes("m∠")
      ) return 8;

      if (
        t.includes("complex number") || t.includes("argand") || t.includes("modulus") || t.includes("conjugate") ||
        t.includes("polar form") || t.includes("de moivre") || t.includes("cube roots of unity") || t.includes("omega") ||
        t.includes("ω") || t.includes("fourth roots of unity") || t.includes("real part") || t.includes("imaginary part") ||
        t.includes("i^2 = -1") || t.includes("sqrt(-1)") || (t.includes("imaginary") && !t.includes("matrix"))
      ) return 1;

      return 7;
    }

    // 5E. Mathematics Class XII (Chapters 12 to 23)
    if (classLevel === "XII") {
      if (t.includes("maple") || t.includes("command in maple")) return 23;

      if (t.includes("hyperbola") || t.includes("asymptote") || t.includes("eccentricity of hyperbola") || t.includes("conjugate axis") || t.includes("transverse axis")) return 22;

      if (t.includes("ellipse") || t.includes("major axis") || t.includes("minor axis") || t.includes("eccentricity of ellipse") || t.includes("foci of ellipse") || t.includes("vertices of ellipse") || t.includes("x^2/a^2 + y^2/b^2")) return 21;

      if (t.includes("parabola") || t.includes("focus of parabola") || t.includes("vertex of parabola") || t.includes("directrix") || t.includes("latus rectum") || t.includes("y^2 = 4ax") || t.includes("x^2 = 4ay") || t.includes("axis of parabola")) return 20;

      if (t.includes("circle") || t.includes("radius of circle") || t.includes("centre of circle") || t.includes("tangent to circle") || t.includes("normal to circle") || t.includes("length of tangent") || t.includes("concentric") || (t.includes("diameter") && t.includes("circle"))) return 19;

      if (t.includes("numerical solution") || t.includes("bisection method") || t.includes("newton-raphson") || t.includes("newton raphson") || t.includes("regula falsi") || t.includes("iteration method") || t.includes("root of equation using")) return 18;

      if (t.includes("integrat") || t.includes("integral") || t.includes("∫") || t.includes("dx") || t.includes("area under the curve") || t.includes("area bounded by") || t.includes("integration by parts") || t.includes("definite integral") || t.includes("differential equation")) return 17;

      if (t.includes("vector differentiation") || t.includes("scalar triple product") || t.includes("vector triple product") || t.includes("velocity vector") || t.includes("acceleration vector") || t.includes("dr/dt") || t.includes("gradient of scalar") || t.includes("divergence") || t.includes("curl") || (t.includes("velocity") && t.includes("height"))) return 16;

      if (t.includes("higher order derivative") || t.includes("d^2y/dx^2") || t.includes("second derivative") || t.includes("maxima") || t.includes("minima") || t.includes("maximum value") || t.includes("minimum value") || t.includes("point of inflection") || t.includes("rate of change") || t.includes("tangent and normal") || t.includes("equation of tangent") || t.includes("equation of normal") || (t.includes("slope of tangent") || t.includes("slope of normal"))) return 15;

      if (t.includes("differentiat") || t.includes("derivative") || t.includes("dy/dx") || t.includes("first principle") || t.includes("chain rule") || t.includes("product rule") || t.includes("quotient rule") || t.includes("implicit differentiation") || t.includes("derivative of")) return 14;

      if (t.includes("limit") || t.includes("lim(") || t.includes("lim_") || t.includes("continuous") || t.includes("continuity") || t.includes("domain of the function") || t.includes("even function") || t.includes("odd function") || t.includes("inverse function") || t.includes("piecewise") || t.includes("composition function") || t.includes("f ∘ g")) return 13;

      if (t.includes("straight line") || t.includes("slope") || t.includes("gradient") || t.includes("parallel lines") || t.includes("perpendicular lines") || t.includes("angle between lines") || t.includes("distance from point to line") || t.includes("intercept") || t.includes("linear programming") || t.includes("constraints") || t.includes("objective function") || t.includes("corner points") || t.includes("feasible region") || t.includes("translation of axes") || t.includes("rotation of axes") || t.includes("homogeneous equation") || t.includes("pair of straight lines")) return 12;

      return 12;
    }
  }

  // 6. Chemistry
  if (subject === "Chemistry") {
    if (classLevel === "XI") {
      if (t.includes("stoichiometr") || t.includes("empirical formula") || t.includes("mole") || t.includes("limiting reactant") || t.includes("quantities conserved") || t.includes("synthesised a") || t.includes("quantitative science") || t.includes("gravimetric") || t.includes("volumetric") || t.includes("titration") || t.includes("impure sample") || t.includes("iron ore")) return 1;
      if (t.includes("bohr") || t.includes("quantum number") || t.includes("orbital") || t.includes("electron configuration") || t.includes("rutherford") || t.includes("spectrum") || t.includes("cathode ray") || t.includes("calcium ion in cacl")) return 2;
      if (t.includes("valence bond") || t.includes("vsepr") || t.includes("hybridization") || t.includes("dipole") || t.includes("covalent bond") || t.includes("molecular orbital")) return 3;
      if (t.includes("gas") || t.includes("dalton") || t.includes("graham") || t.includes("viscosity") || t.includes("surface tension") || t.includes("crystal lattice") || t.includes("unit cell") || t.includes("isomorph") || t.includes("solid state") || t.includes("insoluble in all solvents") || t.includes("glucose is readily soluble") || t.includes("at 4 °c") || t.includes("water has a tendency") || t.includes("ammonia dissolves in water")) return 4;
      if (t.includes("equilibrium") || t.includes("le chatelier") || t.includes("kc") || t.includes("kp") || t.includes("solubility product") || t.includes("common ion effect") || t.includes("2so2") || t.includes("nh4+")) return 5;
      if (t.includes("buffer") || t.includes("ph ") || t.includes("poh") || t.includes("acid") || t.includes("base") || t.includes("salt") || t.includes("zinc ion can be classified")) return 6;
      if (t.includes("rate of reaction") || t.includes("order of reaction") || t.includes("activation energy") || t.includes("catalyst") || t.includes("half life")) return 7;
      if (t.includes("colloid") || t.includes("molarity") || t.includes("molality") || t.includes("colligative") || t.includes("osmotic") || t.includes("raoult") || t.includes("ink spot") || t.includes("laundry soap")) return 8;
      if (t.includes("enthalpy") || t.includes("hess") || t.includes("calorimeter") || t.includes("exothermic") || t.includes("endothermic") || t.includes("born-haber") || t.includes("lattice energy")) return 9;
      if (t.includes("electrode") || t.includes("oxidation") || t.includes("reduction") || t.includes("galvanic") || t.includes("electrolysis") || t.includes("nfe") || t.includes("cell reaction will be spontaneous") || t.includes("potential of an electrochem") || t.includes("zn2+|zn") || t.includes("2fe") || t.includes("redox")) return 10;
      return 1;
    }
  }

  // 7. Principles of Accounting
  if (subject === "Principles of Accounting") {
    if (classLevel === "IX") {
      if (t.includes("journal") || t.includes("ledger") || t.includes("trial balance") || t.includes("accounting cycle") || t.includes("t-account")) return 2;
      if (t.includes("cash book") || t.includes("sales journal") || t.includes("purchases journal") || t.includes("sales return") || t.includes("purchases return") || t.includes("prime entry") || t.includes("original entry")) return 3;
      if (t.includes("special journal") || t.includes("control account") || t.includes("subsidiary ledger") || t.includes("petty cash")) return 4;
      if (t.includes("depreciation") || t.includes("bad debts") || t.includes("allowance for doubtful") || t.includes("accumulated depreciation") || t.includes("straight line method") || t.includes("reducing balance")) return 5;
      return 1;
    }
    if (classLevel === "X") {
      if (t.includes("financial statement") || t.includes("income statement") || t.includes("balance sheet") || t.includes("gross profit") || t.includes("net profit") || t.includes("trading account")) return 7;
      if (t.includes("single entry") || t.includes("incomplete records") || t.includes("statement of affairs") || t.includes("capital comparison")) return 8;
      if (t.includes("correction of errors") || t.includes("rectification") || t.includes("suspense account") || t.includes("error of omission") || t.includes("error of commission") || t.includes("error of principle")) return 9;
      if (t.includes("non-profit") || t.includes("npo") || t.includes("receipts and payments") || t.includes("income and expenditure") || t.includes("subscription account")) return 10;
      return 6;
    }
    if (classLevel === "XI") {
      if (t.includes("cash book") || t.includes("sales journal") || t.includes("purchases journal") || t.includes("prime entry") || t.includes("original entry") || t.includes("general journal")) return 2;
      if (t.includes("bank reconciliation") || t.includes("brs") || t.includes("bank statement") || t.includes("unpresented cheque") || t.includes("uncredited cheque") || t.includes("dishonoured cheque")) return 3;
      if (t.includes("rectification") || t.includes("suspense account") || t.includes("adjustment") || t.includes("accrual") || t.includes("prepayment") || t.includes("closing entries") || t.includes("reversing entries") || t.includes("opening entries")) return 4;
      if (t.includes("depreciation") || t.includes("ias 16") || t.includes("accumulated depreciation") || t.includes("disposal of fixed asset") || t.includes("salvage value") || t.includes("useful life")) return 5;
      return 1;
    }
    if (classLevel === "XII") {
      if (t.includes("non-profit") || t.includes("npo") || t.includes("receipts and payments") || t.includes("income and expenditure") || t.includes("subscription")) return 7;
      if (t.includes("partnership") || t.includes("partner") || t.includes("profit sharing ratio") || t.includes("admission of partner") || t.includes("retirement of partner") || t.includes("goodwill") || t.includes("capital account")) return 8;
      if (t.includes("company") || t.includes("corporation") || t.includes("shares") || t.includes("debentures") || t.includes("dividends") || t.includes("retained earnings")) return 9;
      if (t.includes("inventory") || t.includes("valuation of stock") || t.includes("ias 2") || t.includes("fifo") || t.includes("weighted average") || t.includes("avco") || t.includes("nrv") || t.includes("periodic inventory")) return 10;
      return 6;
    }
  }

  // 8. Principles of Commerce
  if (subject === "Principles of Commerce") {
    if (t.includes("trade") || t.includes("wholesale") || t.includes("retail") || t.includes("middleman") || t.includes("channels of distribution")) return 4;
    if (t.includes("marketing") || t.includes("advertising") || t.includes("sales promotion") || t.includes("branding") || t.includes("packaging")) return 5;
    if (t.includes("auxiliaries to trade") || t.includes("transportation") || t.includes("warehousing") || t.includes("insurance") || t.includes("banking")) return 6;
    if (t.includes("commercial correspondence") || t.includes("business letter") || t.includes("inquiry letter") || t.includes("order letter")) return 7;
    if (t.includes("sole proprietorship") || t.includes("partnership") || t.includes("joint stock company") || t.includes("cooperative society")) return 2;
    if (t.includes("office organisation") || t.includes("filing") || t.includes("indexing") || t.includes("office equipment")) return 3;
    return 1;
  }

  // 9. Principles of Economics
  if (subject === "Principles of Economics") {
    if (t.includes("demand") || t.includes("law of demand") || t.includes("elasticity of demand") || t.includes("substitute goods") || t.includes("complementary goods")) return 3;
    if (t.includes("supply") || t.includes("law of supply") || t.includes("elasticity of supply")) return 4;
    if (t.includes("market equilibrium") || t.includes("price determination") || t.includes("equilibrium price") || t.includes("shortage") || t.includes("surplus")) return 5;
    if (t.includes("production") || t.includes("laws of return") || t.includes("law of diminishing returns") || t.includes("factors of production") || t.includes("marginal product")) return 6;
    if (t.includes("cost") || t.includes("revenue") || t.includes("fixed cost") || t.includes("variable cost") || t.includes("marginal cost") || t.includes("average cost")) return 7;
    if (t.includes("market structure") || t.includes("perfect competition") || t.includes("monopoly") || t.includes("monopolistic competition") || t.includes("oligopoly")) return 8;
    if (t.includes("resource pricing") || t.includes("rent") || t.includes("wages") || t.includes("interest") || t.includes("profit theory")) return 9;
    if (t.includes("macro economics") || t.includes("national income") || t.includes("gdp") || t.includes("gnp") || t.includes("nnp") || t.includes("inflation") || t.includes("consumer price index")) return 10;
    if (t.includes("money") || t.includes("functions of money") || t.includes("quantity theory of money") || t.includes("irving fisher") || t.includes("central bank") || t.includes("commercial bank")) return 11;
    if (t.includes("business cycle") || t.includes("boom") || t.includes("recession") || t.includes("depression") || t.includes("recovery")) return 12;
    if (t.includes("international trade") || t.includes("balance of trade") || t.includes("balance of payment") || t.includes("comparative advantage") || t.includes("tariffs") || t.includes("exchange rate")) return 13;
    if (t.includes("public finance") || t.includes("taxation") || t.includes("budget") || t.includes("direct tax") || t.includes("indirect tax") || t.includes("fiscal policy") || t.includes("public expenditure")) return 14;
    if (t.includes("consumer behaviour") || t.includes("utility") || t.includes("marginal utility") || t.includes("indifference curve")) return 2;
    return 1;
  }

  // 10. Commercial Geography
  if (subject === "Commercial Geography") {
    if (t.includes("mineral") || t.includes("mining") || t.includes("coal") || t.includes("petroleum") || t.includes("natural gas") || t.includes("iron ore")) return 3;
    if (t.includes("agriculture") || t.includes("wheat") || t.includes("rice") || t.includes("cotton") || t.includes("sugarcane") || t.includes("tea") || t.includes("coffee")) return 4;
    if (t.includes("power resources") || t.includes("hydroelectric") || t.includes("thermal power") || t.includes("nuclear power") || t.includes("solar energy")) return 5;
    if (t.includes("industry") || t.includes("textile") || t.includes("iron and steel") || t.includes("chemical industry") || t.includes("sugar industry")) return 6;
    if (t.includes("transport") || t.includes("railways") || t.includes("highways") || t.includes("air transport") || t.includes("ocean routes") || t.includes("ports")) return 7;
    if (t.includes("trade") || t.includes("exports") || t.includes("imports") || t.includes("balance of trade")) return 8;
    if (t.includes("population") || t.includes("demography") || t.includes("urbanization") || t.includes("human resources")) return 9;
    return 1;
  }

  // 11. Banking
  if (subject === "Banking") {
    if (t.includes("central bank") || t.includes("state bank") || t.includes("monetary policy") || t.includes("credit control") || t.includes("bank of issue")) return 2;
    if (t.includes("commercial bank") || t.includes("deposits") || t.includes("loans and advances") || t.includes("credit creation")) return 3;
    if (t.includes("bank account") || t.includes("current account") || t.includes("savings account") || t.includes("fixed deposit") || t.includes("kyc")) return 4;
    if (t.includes("negotiable instrument") || t.includes("cheque") || t.includes("crossing of cheque") || t.includes("bill of exchange") || t.includes("promissory note") || t.includes("endorsement")) return 5;
    if (t.includes("electronic banking") || t.includes("atm") || t.includes("online banking") || t.includes("credit card") || t.includes("debit card") || t.includes("mobile banking")) return 6;
    if (t.includes("islamic banking") || t.includes("mudarabah") || t.includes("musharakah") || t.includes("murabahah") || t.includes("ijarah") || t.includes("riba")) return 7;
    return 1;
  }

  // 12. Civics
  if (subject === "Civics") {
    if (t.includes("state") || t.includes("elements of state") || t.includes("sovereignty") || t.includes("government")) return 2;
    if (t.includes("citizenship") || t.includes("rights") || t.includes("duties") || t.includes("law") || t.includes("liberty")) return 3;
    if (t.includes("constitution") || t.includes("democracy") || t.includes("dictatorship") || t.includes("judiciary") || t.includes("legislature") || t.includes("executive")) return 4;
    return 1;
  }

  // 13. Ethics
  if (subject === "Ethics") {
    if (classLevel === "XII") {
      if (
        t.includes("edhi") || t.includes("abdul sattar") || t.includes("guru nanak") ||
        t.includes("buddha") || t.includes("mother teresa") || t.includes("florence nightingale") ||
        t.includes("ruth pfau") || t.includes("socrates") || t.includes("plato") ||
        t.includes("aristotle") || t.includes("personality") || t.includes("personalities")
      ) return 4;

      if (
        t.includes("moral value") || t.includes("truthfulness") || t.includes("honesty") ||
        t.includes("justice") || t.includes("respect") || t.includes("tolerance") ||
        t.includes("inter-faith") || t.includes("interfaith") || t.includes("human rights") ||
        t.includes("civic sense") || t.includes("state institutions") || t.includes("labour") ||
        t.includes("environment") || t.includes("workplace") || t.includes("values")
      ) return 3;

      if (
        t.includes("zoroastrianism") || t.includes("parsi") || t.includes("hindu") ||
        t.includes("buddhism") || t.includes("christian") || t.includes("sikh") ||
        t.includes("kalash") || t.includes("funeral") || t.includes("rite") ||
        t.includes("temple") || t.includes("church") || t.includes("gurdwara") ||
        t.includes("religions of pakistan") || t.includes("religion") || t.includes("religious")
      ) return 2;

      return 1;
    }

    if (classLevel === "IX") {
      if (
        t.includes("socrates") || t.includes("plato") || t.includes("aristotle") ||
        t.includes("confucius") || t.includes("buddha") || t.includes("guru nanak") ||
        t.includes("mother teresa") || t.includes("edhi") || t.includes("gandhi")
      ) return 4;

      if (
        t.includes("truthfulness") || t.includes("honesty") || t.includes("justice") ||
        t.includes("respect") || t.includes("tolerance") || t.includes("patience") ||
        t.includes("peace") || t.includes("etiquette") || t.includes("values")
      ) return 3;

      if (
        t.includes("hinduism") || t.includes("buddhism") || t.includes("christianity") ||
        t.includes("judaism") || t.includes("zoroastrianism") || t.includes("sikhism") ||
        t.includes("religions") || t.includes("religion")
      ) return 2;

      return 1;
    }
    return 1;
  }

  return null;
}

async function setupCurriculumsAndChapters() {
  console.log("🛠️ Verifying and Initializing Curriculums & Chapters...");

  // Setup Urdu Class X Curriculum if missing
  const urduX = await queryWithRetry(`SELECT id FROM curriculums WHERE subject = 'Urdu' AND class = 'X'`);
  if (urduX.rows.length === 0) {
    const newId = "a1b2c3d4-e5f6-4a1b-8c9d-0e1f2a3b4c5d";
    await queryWithRetry(
      `INSERT INTO curriculums (id, subject, class, board, file_name, created_at, updated_at)
       VALUES ($1, 'Urdu', 'X', 'AKUEB', 'Urdu Compulsory SSC Syllabus 2025.pdf', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [newId]
    );

    // Assign chapters 5-10 from the IX curriculum to X
    await queryWithRetry(
      `UPDATE chapters SET curriculum_id = $1 WHERE curriculum_id = '0059b738-d191-4537-8f56-f134cbc1fd9b' AND chapter_number >= 5`,
      [newId]
    );
    console.log("✅ Initialized Urdu Class X Curriculum and linked Chapters 5-10.");
  }
}

async function main() {
  console.log("🚀 Starting Comprehensive Question-to-Syllabus Mapping Engine...\n");
  await setupCurriculumsAndChapters();

  // Distinct subjects in past_papers
  const { rows: paperSubjects } = await queryWithRetry(`
    SELECT DISTINCT pp.subject, pp.class
    FROM past_papers pp
    ORDER BY pp.subject, pp.class
  `);

  console.log(`Found ${paperSubjects.length} subject-class combinations in past papers.\n`);

  let totalMapped = 0;
  let totalUnmatchable = 0;

  for (const { subject: rawSubject, class: classLevel } of paperSubjects) {
    // Subject alias mapping (e.g. "Islamiat (Urdu)" -> "Islamiat", "Pakistan Studies (Urdu)" -> "Pakistan Studies")
    let targetCurriculumSubject = rawSubject;
    if (rawSubject === "Islamiat (Urdu)") targetCurriculumSubject = "Islamiat";
    if (rawSubject === "Pakistan Studies (Urdu)") targetCurriculumSubject = "Pakistan Studies";

    // 1. Get curriculum for this subject and class
    const { rows: curriculums } = await queryWithRetry(
      `SELECT id, class, board FROM curriculums WHERE subject = $1 AND class = $2`,
      [targetCurriculumSubject, classLevel]
    );

    if (curriculums.length === 0) {
      console.warn(`⚠️ No curriculum found for "${targetCurriculumSubject} Class ${classLevel}". Skipping.`);
      continue;
    }

    const curr = curriculums[0];
    const curriculumId = curr.id;

    // 2. Get chapters for this curriculum
    const { rows: chapters } = await queryWithRetry(
      `SELECT id, chapter_number, chapter_name FROM chapters WHERE curriculum_id = $1 ORDER BY chapter_number ASC`,
      [curriculumId]
    );

    if (chapters.length === 0) {
      console.warn(`⚠️ Curriculum ${curriculumId} (${targetCurriculumSubject} ${classLevel}) has 0 chapters.`);
      continue;
    }

    console.log(`\n📚 [${rawSubject} Class ${classLevel}] Mapping with ${chapters.length} chapters from ${targetCurriculumSubject}...`);

    // Build mapping lookups
    const chapByNumber = new Map<number, { id: string; name: string }>();
    const chapByNormName = new Map<string, { id: string; name: string }>();

    for (const ch of chapters) {
      chapByNumber.set(ch.chapter_number, { id: ch.id, name: ch.chapter_name });
      chapByNormName.set(norm(ch.chapter_name), { id: ch.id, name: ch.chapter_name });
    }

    const aliasMap = CHAPTER_ALIASES[targetCurriculumSubject]?.[classLevel] || {};

    // 3. Get all questions for this raw subject and class
    const { rows: questions } = await queryWithRetry(
      `SELECT q.id, q.question_number, q.question_text, q.chapter_id, q.chapter_name, pp.paper_number, pp.year
       FROM questions q
       JOIN past_papers pp ON q.past_paper_id = pp.id
       WHERE pp.subject = $1 AND pp.class = $2
       ORDER BY pp.year, pp.paper_number, q.question_number`,
      [rawSubject, classLevel]
    );

    let mappedCount = 0;
    let unmappedCount = 0;
    const pendingUpdates: Array<{ id: string; chapterId: string; chapterName: string }> = [];

    for (const q of questions) {
      let targetChapterId: string | null = null;
      let targetChapterName: string | null = null;

      // Strategy A: Direct Keyword classification on question text
      const inferredNum = classifyByKeywords(targetCurriculumSubject, classLevel, q.question_text || "");
      if (inferredNum && chapByNumber.has(inferredNum)) {
        const match = chapByNumber.get(inferredNum)!;
        targetChapterId = match.id;
        targetChapterName = match.name;
      }

      // Strategy B: Extracted chapter / topic candidate matching if not classified by keywords
      if (!targetChapterId) {
        const qChapterName = (q.chapter_name || "").trim();
        const candidates = [qChapterName, ...qChapterName.split(/[/–—:,]/).map((s: string) => s.trim())].filter(Boolean);

        for (const cand of candidates) {
          const normCand = norm(cand);
          if (!normCand) continue;

          // B1. Exact normalized name
          if (chapByNormName.has(normCand)) {
            const match = chapByNormName.get(normCand)!;
            targetChapterId = match.id;
            targetChapterName = match.name;
            break;
          }

          // B2. Alias dictionary lookup
          for (const [aliasPattern, chapNum] of Object.entries(aliasMap)) {
            if (normCand.includes(norm(aliasPattern)) || norm(aliasPattern).includes(normCand)) {
              if (chapByNumber.has(chapNum)) {
                const match = chapByNumber.get(chapNum)!;
                targetChapterId = match.id;
                targetChapterName = match.name;
                break;
              }
            }
          }
          if (targetChapterId) break;

          // B3. Substring containment against official chapter names
          for (const ch of chapters) {
            const chNorm = norm(ch.chapter_name);
            if (chNorm.includes(normCand) || normCand.includes(chNorm)) {
              targetChapterId = ch.id;
              targetChapterName = ch.chapter_name;
              break;
            }
          }
          if (targetChapterId) break;
        }
      }

      // Strategy C: English / Single-unit fallbacks
      if (!targetChapterId && chapters.length > 0) {
        if (targetCurriculumSubject === "English") {
          const readingChap = chapters.find((c: any) => norm(c.chapter_name).includes("reading")) || chapters[0];
          targetChapterId = readingChap.id;
          targetChapterName = readingChap.chapter_name;
        } else {
          targetChapterId = chapters[0].id;
          targetChapterName = chapters[0].chapter_name;
        }
      }

      // Record update
      if (targetChapterId && targetChapterName) {
        pendingUpdates.push({ id: q.id, chapterId: targetChapterId, chapterName: targetChapterName });
        mappedCount++;
      } else {
        unmappedCount++;
      }
    }

    // Execute updates in concurrent chunks of 50
    const CHUNK_SIZE = 50;
    for (let ci = 0; ci < pendingUpdates.length; ci += CHUNK_SIZE) {
      const chunk = pendingUpdates.slice(ci, ci + CHUNK_SIZE);
      await Promise.all(
        chunk.map((u) =>
          queryWithRetry(
            `UPDATE questions SET chapter_id = $1, chapter_name = $2, updated_at = NOW() WHERE id = $3`,
            [u.chapterId, u.chapterName, u.id]
          )
        )
      );
    }

    console.log(`✅ [${rawSubject} Class ${classLevel}] Result: ${mappedCount} questions mapped across ${chapters.length} chapters.`);
    totalMapped += mappedCount;
    totalUnmatchable += unmappedCount;
  }

  console.log(`\n======================================================`);
  console.log(`🎉 FULL SYLLABUS QUESTION MAPPING COMPLETE!`);
  console.log(`✨ Successfully Mapped Questions: ${totalMapped}`);
  console.log(`❓ Unmatchable Questions:         ${totalUnmatchable}`);
  console.log(`======================================================\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
