"use strict";

// Escapa los caracteres especiales para usar el texto dentro de una RegExp
function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Construye una expresión regular que busca texto parcial
// sin importar mayúsculas ni acentos ("leon" encuentra "León")
function buildSearchRegex(text) {
    const accents = { a: "[aá]", e: "[eé]", i: "[ií]", o: "[oó]", u: "[uúü]", n: "[nñ]" };

    const pattern = escapeRegex(
        String(text).normalize("NFD").replace(/[̀-ͯ]/g, "")
    ).replace(/[aeioun]/gi, (letter) => accents[letter.toLowerCase()]);

    return new RegExp(pattern, "i");
}

module.exports = {
    escapeRegex,
    buildSearchRegex
};
